#!/usr/bin/env python3
"""Score a Vibe Prospecting (Explorium) real estate agent export for fit
with the cinematic listing-video offer.

Unlike the Zillow listing scorer (which sees per-listing video/3D-tour
signals), an agent-prospecting export only has the agent's role, their
brokerage, and how reachable they are. So the offer fit here is judged on:

- Title fit: is this someone who actually lists and shows residential
  homes (realtor / agent / broker), vs. an assistant, a commercial /
  industrial / leasing broker (different video need), or a "real estate"
  title at a firm that isn't a brokerage at all (corporate real estate,
  private banking)?
- Brokerage fit: does the business's NAICS description indicate an actual
  real estate brokerage? If not, the lead is disqualified regardless of
  title - the offer doesn't apply.
- Reachability: does the record include a direct mobile number in
  addition to email?

Usage:
    python scripts/score_agent_leads.py \
        --in leads/vibe_prospecting_agents_raw.csv \
        --out leads/vibe_prospecting_agents_scored.csv
"""

import argparse
import csv
import os

LOW_FIT_TITLE_KEYWORDS = [
    "commercial",
    "industrial",
    "tenant representation",
    "leasing",
    "corporate real estate",
    "broker of record",
]
ASSISTANT_TITLE_KEYWORDS = ["assistant"]
CORE_TITLE_KEYWORDS = [
    "real estate agent",
    "realtor",
    "real estate broker",
    "broker associate",
    "licensed real estate",
    "real estate sales",
]

OUT_FIELDS = [
    "score",
    "qualified",
    "disqualify_reason",
    "prospect_full_name",
    "prospect_job_title",
    "business_name",
    "business_naics_description",
    "contact_professions_email",
    "contact_mobile_phone",
    "prospect_linkedin",
]


def is_real_brokerage(naics_description):
    return "real estate" in (naics_description or "").lower()


def score_title(title):
    title_lower = (title or "").lower()
    if any(kw in title_lower for kw in LOW_FIT_TITLE_KEYWORDS):
        return 10
    if any(kw in title_lower for kw in ASSISTANT_TITLE_KEYWORDS):
        return 20
    if any(kw in title_lower for kw in CORE_TITLE_KEYWORDS):
        return 60
    return 35


def score_row(row):
    naics = row.get("business_naics_description", "")
    if not is_real_brokerage(naics):
        return 0, False, "business is not a real estate brokerage"

    title_score = score_title(row.get("prospect_job_title", ""))
    contact_score = 40 if (row.get("contact_mobile_phone") or "").strip() else 20
    score = title_score + contact_score
    return score, True, ""


def score_leads(rows):
    scored = []
    for row in rows:
        score, qualified, reason = score_row(row)
        out_row = {field: row.get(field, "") for field in OUT_FIELDS}
        out_row["score"] = score
        out_row["qualified"] = qualified
        out_row["disqualify_reason"] = reason
        scored.append(out_row)
    scored.sort(key=lambda r: r["score"], reverse=True)
    return scored


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--in", dest="in_path", required=True, help="Input lead CSV (Vibe Prospecting export)")
    parser.add_argument("--out", default="leads/scored_agent_leads.csv")
    parser.add_argument("--top", type=int, default=None, help="Only keep the top N scored leads")
    args = parser.parse_args()

    with open(args.in_path, newline="") as f:
        rows = list(csv.DictReader(f))

    scored = score_leads(rows)
    qualified = [r for r in scored if r["qualified"]]
    disqualified = [r for r in scored if not r["qualified"]]

    output = scored[: args.top] if args.top else scored

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUT_FIELDS)
        writer.writeheader()
        writer.writerows(output)

    print(f"Scored {len(scored)} leads: {len(qualified)} qualified, {len(disqualified)} disqualified")
    print(f"Wrote {len(output)} rows to {args.out}")


if __name__ == "__main__":
    main()
