"""Perplexity end-to-end: research each prospect AND write their 3-touch sequence.

One Perplexity call per prospect. Sonar searches the web live, so research and
writing happen in the same request: it looks up the company/person, extracts
verifiable hooks, then writes email_1 (day 0), email_2 (day 3), email_3 (day 7)
following the offer brief and writing rules.

Resumable: rows that already have an email_1 in the output file are skipped.

Usage:
    export PERPLEXITY_API_KEY=pplx-...
    python generate_emails.py prospects.csv --offer offer.md --out emails.csv
    # deeper research on high-value targets:
    python generate_emails.py prospects.csv --model sonar-pro --out emails.csv
"""

import argparse
import csv
import json
import os
import re
import sys
import time

import requests

PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"

WRITING_RULES = """You write cold outreach emails for GemLabs Agency that book discovery calls
(a free Revenue Audit of the prospect's sales systems and ad spend).

STEP 1 - RESEARCH (use web search):
Look up the company and the person. Find: what the company does, recent news (funding,
launches, hiring - especially sales/SDR/marketing roles), whether they run paid ads,
and 2-3 specific verifiable observations a cold email could open with. If nothing
specific can be verified, note that instead of inventing something.

STEP 2 - WRITE a 3-touch sequence. Non-negotiable rules:
- email_1: max 120 words. email_2 and email_3: max 80 words each.
- Open email_1 with the most specific verifiable observation from your research (a job
  post, funding round, product launch, ad campaign). Never open with "I hope", "My
  name is", or anything about GemLabs.
- One idea per email: connect the observation to ONE pain (leaky sales systems or
  wasted ad spend), then ONE outcome from the offer brief. Do not list services.
- One low-friction interest-based CTA ("worth a look?", "want the 2-minute version?").
  Never ask for 30 minutes in email_1.
- email_2 (day 3): no "just following up" - lead with a new angle or proof point.
- email_3 (day 7): short, light breakup with an easy out.
- Subject: 2-5 words, lowercase, specific to them, no spam words, no exclamation marks.
- Plain text, no links, no bullets. Founder-to-founder voice: contractions, short
  sentences, zero marketing jargon, no em dashes.
- NEVER invent facts or numbers about the prospect. If research came up thin, set
  "weak_research" to true and write the best segment-level email you can.

OUTPUT: return ONLY a JSON object (no markdown fences, no citations markers in values):
{"research_summary": "3-4 sentences of what you found",
 "hook_used": "the observation email_1 opens with",
 "subject": "...", "email_1": "...", "email_2": "...", "email_3": "...",
 "weak_research": false}"""


def generate(row: dict, offer_text: str, model: str, api_key: str) -> dict:
    prospect = {k: v for k, v in row.items() if v}
    resp = requests.post(
        PERPLEXITY_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": WRITING_RULES
                 + f"\n\n<offer_brief>\n{offer_text}\n</offer_brief>"},
                {"role": "user", "content": "Prospect:\n"
                 + json.dumps(prospect, indent=2, ensure_ascii=False)},
            ],
            "max_tokens": 1800,
        },
        timeout=180,
    )
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"]
    # Strip fences / citation markers like [1], then parse the JSON object.
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"\[\d+\]", "", text)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("no JSON object in response")
    return json.loads(match.group(0))


OUT_COLS = ["research_summary", "hook_used", "subject",
            "email_1", "email_2", "email_3", "weak_research"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_csv")
    parser.add_argument("--offer", default="offer.md")
    parser.add_argument("--out", default="emails.csv")
    parser.add_argument("--model", default="sonar",
                        help="sonar (cheap) or sonar-pro (deeper research)")
    parser.add_argument("--sleep", type=float, default=1.0)
    args = parser.parse_args()

    api_key = os.environ.get("PERPLEXITY_API_KEY")
    if not api_key:
        sys.exit("Set PERPLEXITY_API_KEY")

    with open(args.input_csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit("Input CSV is empty")
    with open(args.offer, encoding="utf-8") as f:
        offer_text = f.read()

    # Resume from an existing output file.
    if os.path.exists(args.out):
        with open(args.out, newline="", encoding="utf-8") as f:
            done = {r.get("email"): r for r in csv.DictReader(f) if r.get("email_1")}
        for row in rows:
            prior = done.get(row.get("email"))
            if prior:
                for col in OUT_COLS:
                    row[col] = prior.get(col, "")

    fieldnames = [c for c in rows[0].keys() if c not in OUT_COLS] + OUT_COLS
    generated, failed = 0, 0
    for i, row in enumerate(rows, 1):
        if row.get("email_1"):
            continue
        try:
            result = generate(row, offer_text, args.model, api_key)
            for col in OUT_COLS:
                row[col] = result.get(col, "")
            generated += 1
            flag = " [WEAK]" if result.get("weak_research") else ""
            print(f"[{i}/{len(rows)}] {row.get('company')}: ok{flag}")
        except (requests.RequestException, ValueError, json.JSONDecodeError) as e:
            failed += 1
            print(f"[{i}/{len(rows)}] {row.get('company')}: FAILED ({e}) — retry on re-run")
        time.sleep(args.sleep)
        if generated and generated % 20 == 0:
            _write(args.out, fieldnames, rows)

    _write(args.out, fieldnames, rows)
    weak = sum(1 for r in rows if str(r.get("weak_research")).lower() == "true")
    print(f"\nWrote {args.out}: {generated} new sequences, {failed} failures, "
          f"{weak} flagged weak_research.")
    print("Next: spot-check 20-30 rows, drop/rewrite weak ones, load into your sequencer.")


def _write(path: str, fieldnames: list, rows: list) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
