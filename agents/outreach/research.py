"""Per-prospect research via the Perplexity API.

Reads a prospect CSV (from Clay / Vibe Prospecting / Origami exports), asks Perplexity
Sonar for company context and personalization hooks, and writes the results into two
new columns: `research_summary` and `personalization_hooks`.

Resumable: rows that already have a non-empty `research_summary` are skipped, so you
can re-run after a failure or after appending new prospects.

Usage:
    export PERPLEXITY_API_KEY=pplx-...
    python research.py prospects.csv --out prospects_researched.csv [--model sonar]
"""

import argparse
import csv
import json
import os
import sys
import time

import requests

PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"

RESEARCH_PROMPT = """Research {company} ({website}) and {name}, their {title}.

Report, in plain text:
1. WHAT THEY DO: one sentence on the company's product/service and who buys it.
2. RECENT: any news from the last 6 months — funding, launches, hiring (especially
   sales/SDR roles), partnerships, notable posts by {name}.
3. REVENUE MOTION: how they most likely generate pipeline today (outbound, inbound,
   PLG, partnerships) and any visible signs of manual sales processes or scaling pain.
4. HOOKS: 2-3 specific, verifiable observations a cold email could open with. Each one
   sentence, concrete (name the job post, the funding round, the post, the product).
   If you cannot find anything specific and verifiable, say "NO STRONG HOOKS FOUND".

Be factual. Never invent details. Prefer "not found" over speculation."""


def research_prospect(row: dict, model: str, api_key: str) -> str:
    prompt = RESEARCH_PROMPT.format(
        company=row.get("company", ""),
        website=row.get("website", "") or row.get("domain", ""),
        name=f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
        title=row.get("title", "their role"),
    )
    resp = requests.post(
        PERPLEXITY_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 700,
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def split_hooks(research: str) -> str:
    # Pull the HOOKS section out for easy QA filtering; keep full text either way.
    marker = "HOOKS"
    idx = research.upper().find(marker)
    return research[idx:].strip() if idx != -1 else ""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_csv")
    parser.add_argument("--out", default=None, help="output CSV (default: <input>_researched.csv)")
    parser.add_argument("--model", default="sonar", help="sonar (cheap) or sonar-pro (deeper)")
    parser.add_argument("--sleep", type=float, default=1.0, help="seconds between requests")
    args = parser.parse_args()

    api_key = os.environ.get("PERPLEXITY_API_KEY")
    if not api_key:
        sys.exit("Set PERPLEXITY_API_KEY")

    out_path = args.out or args.input_csv.replace(".csv", "_researched.csv")

    with open(args.input_csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit("Input CSV is empty")

    # Resume from an existing output file if present.
    if os.path.exists(out_path):
        with open(out_path, newline="", encoding="utf-8") as f:
            done = {r.get("email"): r for r in csv.DictReader(f) if r.get("research_summary")}
        for row in rows:
            prior = done.get(row.get("email"))
            if prior:
                row["research_summary"] = prior["research_summary"]
                row["personalization_hooks"] = prior.get("personalization_hooks", "")

    fieldnames = list(rows[0].keys())
    for col in ("research_summary", "personalization_hooks"):
        if col not in fieldnames:
            fieldnames.append(col)

    researched = 0
    for i, row in enumerate(rows, 1):
        if row.get("research_summary"):
            continue
        try:
            summary = research_prospect(row, args.model, api_key)
        except requests.RequestException as e:
            print(f"[{i}/{len(rows)}] {row.get('company')}: FAILED ({e}) — will retry on re-run")
            row["research_summary"] = ""
            row["personalization_hooks"] = ""
            time.sleep(args.sleep * 5)
            continue
        row["research_summary"] = summary
        row["personalization_hooks"] = split_hooks(summary)
        researched += 1
        print(f"[{i}/{len(rows)}] {row.get('company')}: ok")
        time.sleep(args.sleep)

        # Checkpoint every 20 rows so a crash loses little work.
        if researched % 20 == 0:
            _write(out_path, fieldnames, rows)

    _write(out_path, fieldnames, rows)
    weak = sum(1 for r in rows if "NO STRONG HOOKS FOUND" in (r.get("research_summary") or ""))
    print(f"\nDone: {researched} newly researched → {out_path}")
    print(f"{weak} rows have no strong hooks — review or drop them before personalizing.")


def _write(path: str, fieldnames: list, rows: list) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
