"""Tier-2 deep research for high-value prospects (OpenAI agent + direct site evidence).

The bulk pipeline (generate_emails.py) researches everyone cheaply with Perplexity.
This stage goes deeper on the top slice of the list — the prospects worth $10K-$20K —
and produces two assets per prospect:

  1. Richer personalization: deep_summary + deep_hooks columns. generate_emails.py
     passes every CSV column into the writing prompt, so tier-2 rows automatically
     get better emails — no other changes needed.
  2. The "audit preview" (teardown_preview column): 3 concrete findings about THEIR
     funnel, ready to paste into a reply to book hesitant prospects (conversion
     lever #6 in SCALING-MODEL.md) and to open the audit call with.

How it digs deeper than the tier-1 pass:
  - Fetches the prospect's actual website (home, pricing, careers pages) and feeds the
    text in as primary evidence — careers pages expose hiring signals, pricing pages
    expose the sales motion.
  - Runs an OpenAI web-search agent pass over the evidence: founder's recent posts,
    funding, ad-library activity, competitor pressure, visible funnel gaps.

Usage:
    export OPENAI_API_KEY=sk-...
    # deep-research the top 30 rows of a (pre-sorted or pre-filtered) CSV:
    python deep_research.py prospects.csv --limit 30 --out prospects_tier2.csv
    # then run the normal writer on the tier-2 file:
    python generate_emails.py prospects_tier2.csv --out emails_tier2.csv

Model defaults to gpt-5 with the web_search tool via the Responses API; override with
--model or OPENAI_MODEL for newer models.
"""

import argparse
import csv
import json
import os
import re
import sys
import time

import requests

OPENAI_URL = "https://api.openai.com/v1/responses"
UA = "Mozilla/5.0 (compatible; GemLabsResearch/1.0)"
SITE_PAGES = ["", "/pricing", "/careers", "/jobs"]

PROMPT = """You are doing pre-sales deep research for GemLabs Agency, which sells AI revenue
systems (lead qualification, AI SDR, revenue automation) and audits of sales systems
and ad spend. Target: {name}, {title} at {company} ({website}).

Below is text captured directly from their website. Combine it with web search on:
- the founder/exec's recent LinkedIn or X activity and interviews
- funding, launches, hiring (especially sales/SDR/marketing roles)
- whether they are running paid ads (Meta ad library, Google), and on what message
- competitors applying pressure
- visible gaps in their funnel or sales motion (slow demo process, no pricing page,
  manual booking, no chat/qualification, generic outbound, etc.)

<site_evidence>
{site_text}
</site_evidence>

Return ONLY a JSON object:
{{"deep_summary": "5-8 sentences: business model, GTM motion, current pressure points",
 "deep_hooks": ["3-5 specific verifiable observations, best first; each one sentence"],
 "teardown_preview": ["exactly 3 concrete findings about THEIR funnel/ads phrased as
   audit-preview bullets, each with a specific detail we actually observed"],
 "hiring_signals": "sales/marketing hiring found, or 'none found'",
 "ad_activity": "what paid ads they run, or 'none found'",
 "weak_research": false}}
Never invent facts. If a category has nothing verifiable, say 'none found' and set
weak_research true only if there are NO usable hooks at all."""


def fetch_site_text(website: str, max_chars_per_page: int = 3000) -> str:
    if not website:
        return "(no website on file)"
    base = website if website.startswith("http") else f"https://{website}"
    chunks = []
    for path in SITE_PAGES:
        try:
            resp = requests.get(base.rstrip("/") + path, headers={"User-Agent": UA},
                                timeout=20, allow_redirects=True)
            if resp.status_code != 200 or "text/html" not in resp.headers.get("content-type", ""):
                continue
            text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", resp.text,
                          flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r"<[^>]+>", " ", text)
            text = re.sub(r"\s+", " ", text).strip()
            if text:
                chunks.append(f"[{path or '/'}] {text[:max_chars_per_page]}")
        except requests.RequestException:
            continue
    return "\n\n".join(chunks) or "(site unreachable — note this; it is itself a finding)"


def extract_output_text(data: dict) -> str:
    # Responses API: prefer the convenience field, else walk output messages.
    if data.get("output_text"):
        return data["output_text"]
    parts = []
    for item in data.get("output", []):
        if item.get("type") == "message":
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    parts.append(content.get("text", ""))
    return "\n".join(parts)


def deep_research(row: dict, model: str, api_key: str) -> dict:
    website = row.get("website", "")
    site_text = fetch_site_text(website)
    prompt = PROMPT.format(
        name=f"{row.get('first_name', '')} {row.get('last_name', '')}".strip() or "the founder",
        title=row.get("title", "founder"),
        company=row.get("company", ""),
        website=website,
        site_text=site_text,
    )
    resp = requests.post(
        OPENAI_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": model, "input": prompt, "tools": [{"type": "web_search"}]},
        timeout=600,
    )
    resp.raise_for_status()
    text = extract_output_text(resp.json())
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("no JSON object in response")
    return json.loads(match.group(0))


OUT_COLS = ["deep_summary", "deep_hooks", "teardown_preview",
            "hiring_signals", "ad_activity", "weak_research"]


def flatten(value) -> str:
    if isinstance(value, list):
        return "\n".join(f"- {v}" for v in value)
    return str(value)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_csv", help="prospect CSV (pre-filter/sort to your top targets)")
    parser.add_argument("--limit", type=int, default=0, help="only research the first N rows")
    parser.add_argument("--out", default=None, help="default: <input>_tier2.csv")
    parser.add_argument("--model", default=os.environ.get("OPENAI_MODEL", "gpt-5"))
    parser.add_argument("--sleep", type=float, default=2.0)
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit("Set OPENAI_API_KEY")

    out_path = args.out or args.input_csv.replace(".csv", "_tier2.csv")
    with open(args.input_csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit("Input CSV is empty")
    targets = rows[: args.limit] if args.limit else rows

    # Resume from an existing output file.
    if os.path.exists(out_path):
        with open(out_path, newline="", encoding="utf-8") as f:
            done = {r.get("email"): r for r in csv.DictReader(f) if r.get("deep_summary")}
        for row in rows:
            prior = done.get(row.get("email"))
            if prior:
                for col in OUT_COLS:
                    row[col] = prior.get(col, "")

    fieldnames = [c for c in rows[0].keys() if c not in OUT_COLS] + OUT_COLS
    researched, failed = 0, 0
    for i, row in enumerate(targets, 1):
        if row.get("deep_summary"):
            continue
        try:
            result = deep_research(row, args.model, api_key)
            for col in OUT_COLS:
                row[col] = flatten(result.get(col, ""))
            researched += 1
            flag = " [WEAK]" if str(result.get("weak_research")).lower() == "true" else ""
            print(f"[{i}/{len(targets)}] {row.get('company')}: ok{flag}")
        except (requests.RequestException, ValueError, json.JSONDecodeError) as e:
            failed += 1
            print(f"[{i}/{len(targets)}] {row.get('company')}: FAILED ({e}) — retry on re-run")
        time.sleep(args.sleep)
        if researched and researched % 10 == 0:
            _write(out_path, fieldnames, rows)

    _write(out_path, fieldnames, rows)
    print(f"\nWrote {out_path}: {researched} deep-researched, {failed} failures.")
    print("teardown_preview bullets are the audit-preview asset — use them in replies "
          "to hesitant prospects and to open the audit call.")
    print(f"Next: python generate_emails.py {out_path} --out emails_tier2.csv")


def _write(path: str, fieldnames: list, rows: list) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
