"""Batch-generate hyper-personalized cold email sequences with Claude.

Takes the researched prospect CSV (from research.py, optionally merged with Origami
Agents signal columns) and generates a 3-touch sequence per prospect:

  - subject, email_1 (day 0), email_2 (day 3, new angle), email_3 (day 7, breakup)

Uses the Message Batches API (50% cost discount — right choice for 300 non-urgent
generations) with prompt caching on the shared offer/rules prefix, per this repo's
CLAUDE.md conventions. Model: claude-opus-4-7 (repo convention for reasoning-heavy
generation).

Usage:
    export ANTHROPIC_API_KEY=sk-...
    python personalize.py prospects_researched.csv --offer offer.md --out emails.csv
"""

import argparse
import csv
import json
import re
import sys
import time

import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

MODEL = "claude-opus-4-7"

WRITING_RULES = """You write cold outreach emails for GemLabs Agency that book discovery calls.
You will receive an offer brief (below) and then one prospect's data with research.
Write a 3-touch sequence for that prospect.

Non-negotiable rules:
- email_1: max 120 words. email_2 and email_3: max 80 words each.
- Open email_1 with the most specific, verifiable observation from the research (a job
  post, funding round, LinkedIn post, product launch). Never open with "I hope", "My
  name is", or anything about GemLabs.
- One idea per email. Connect the observation to ONE relevant pain, then ONE offer
  outcome from the brief. Do not list services.
- One low-friction, interest-based CTA ("worth a look?", "want the 2-minute version?").
  Never ask for 30 minutes in email_1.
- email_2 (send day 3): do not say "just following up". Lead with a new angle: a proof
  point, a one-line relevant insight, or a different pain.
- email_3 (send day 7): short, light breakup. Give an easy out, leave the door open.
- Subject: 2-5 words, lowercase, specific to them (e.g. "your sdr hiring"), no spam
  words (free, guaranteed, urgent), no exclamation marks.
- Plain text. No links, no images, no bullet lists inside the emails.
- Sound like a founder typing quickly: contractions, short sentences, zero marketing
  jargon ("synergy", "revolutionize", "cutting-edge" are banned). No em dashes.
- NEVER invent facts, numbers, or claims about the prospect. Only use what the research
  says. If the research is thin (e.g. "NO STRONG HOOKS FOUND"), set "weak_research"
  to true and write the best segment-level (not fake-personalized) email you can.

Return ONLY a JSON object, no markdown fences:
{"subject": "...", "email_1": "...", "email_2": "...", "email_3": "...",
 "hook_used": "one line: which observation you opened with", "weak_research": false}"""


def build_requests(rows: list, offer_text: str) -> list:
    system = [
        {"type": "text", "text": WRITING_RULES},
        {
            "type": "text",
            "text": f"<offer_brief>\n{offer_text}\n</offer_brief>",
            # Shared static prefix — cached across the batch per CLAUDE.md conventions.
            "cache_control": {"type": "ephemeral"},
        },
    ]
    requests_ = []
    for i, row in enumerate(rows):
        prospect = {k: v for k, v in row.items() if v}
        requests_.append(
            Request(
                custom_id=f"prospect-{i}",
                params=MessageCreateParamsNonStreaming(
                    model=MODEL,
                    max_tokens=2000,
                    system=system,
                    messages=[{
                        "role": "user",
                        "content": "Prospect data and research:\n"
                        + json.dumps(prospect, indent=2, ensure_ascii=False),
                    }],
                ),
            )
        )
    return requests_


def parse_result(text: str) -> dict:
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_csv", help="researched prospect CSV")
    parser.add_argument("--offer", default="offer.md", help="offer brief markdown file")
    parser.add_argument("--out", default="emails.csv")
    args = parser.parse_args()

    with open(args.input_csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit("Input CSV is empty")
    with open(args.offer, encoding="utf-8") as f:
        offer_text = f.read()

    client = anthropic.Anthropic()
    batch = client.messages.batches.create(requests=build_requests(rows, offer_text))
    print(f"Batch {batch.id} submitted ({len(rows)} prospects). Polling...")

    while True:
        batch = client.messages.batches.retrieve(batch.id)
        if batch.processing_status == "ended":
            break
        counts = batch.request_counts
        print(f"  processing={counts.processing} succeeded={counts.succeeded} errored={counts.errored}")
        time.sleep(60)

    generated: dict[int, dict] = {}
    errors = 0
    for result in client.messages.batches.results(batch.id):
        idx = int(result.custom_id.split("-")[1])
        if result.result.type != "succeeded":
            errors += 1
            continue
        text = next(
            (b.text for b in result.result.message.content if b.type == "text"), ""
        )
        try:
            generated[idx] = parse_result(text)
        except (json.JSONDecodeError, ValueError):
            errors += 1

    out_cols = ["subject", "email_1", "email_2", "email_3", "hook_used", "weak_research"]
    fieldnames = list(rows[0].keys()) + out_cols
    weak = 0
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for i, row in enumerate(rows):
            email = generated.get(i, {})
            for col in out_cols:
                row[col] = email.get(col, "")
            if email.get("weak_research"):
                weak += 1
            writer.writerow(row)

    print(f"\nWrote {args.out}: {len(generated)} sequences, {errors} failures, "
          f"{weak} flagged weak_research (review before sending).")
    print("Next: spot-check 20-30 rows, drop/rewrite weak ones, then load into your sequencer.")


if __name__ == "__main__":
    main()
