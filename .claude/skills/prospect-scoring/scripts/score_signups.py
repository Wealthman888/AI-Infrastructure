#!/usr/bin/env python3
"""Score and rank enriched signups/companies by buying-intent signals.

Input: JSON array of company records (see SKILL.md for the schema). Output:
a Markdown table ranked highest score first, plus a one-line tier summary.

Usage:
    python score_signups.py --input companies.json [--output report.md] [--relevant-dept ops]
    cat companies.json | python score_signups.py
"""

import argparse
import json
import sys
from datetime import datetime, timezone


TIERS = [
    (60, "Call today"),
    (35, "Call this week"),
    (15, "Nurture"),
    (0, "Not yet"),
]


def tier_for(score):
    for threshold, label in TIERS:
        if score >= threshold:
            return label
    return TIERS[-1][1]


def months_since(date_str):
    if not date_str:
        return None
    try:
        d = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    return (now.year - d.year) * 12 + (now.month - d.month)


def score_company(c):
    reasons = []
    score = 0

    funding = c.get("funding") or {}
    age_months = months_since(funding.get("last_round_date"))
    if age_months is not None and age_months <= 12:
        score += 40
        reasons.append(
            f"funding: {funding.get('last_round', 'round')} "
            f"${funding.get('last_round_amount', 0):,.0f} ({age_months}mo ago)"
        )
    elif age_months is not None and age_months <= 24:
        score += 20
        reasons.append(f"funding: {funding.get('last_round', 'round')} ({age_months}mo ago, aging)")

    growth = c.get("headcount_growth_pct_6mo")
    if growth is not None:
        if growth >= 30:
            score += 25
            reasons.append(f"headcount +{growth:.0f}% in 6mo")
        elif growth >= 15:
            score += 15
            reasons.append(f"headcount +{growth:.0f}% in 6mo")
        elif growth >= 5:
            score += 5
            reasons.append(f"headcount +{growth:.0f}% in 6mo")

    relevant_jobs = c.get("open_jobs_relevant")
    if relevant_jobs is not None:
        if relevant_jobs >= 3:
            score += 20
            reasons.append(f"hiring {relevant_jobs} relevant roles")
        elif relevant_jobs >= 1:
            score += 10
            reasons.append(f"hiring {relevant_jobs} relevant role")

    traffic_growth = c.get("website_traffic_growth_pct")
    if traffic_growth is not None:
        if traffic_growth >= 20:
            score += 15
            reasons.append(f"traffic +{traffic_growth:.0f}%")
        elif traffic_growth >= 10:
            score += 8
            reasons.append(f"traffic +{traffic_growth:.0f}%")

    return score, reasons


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", "-i", help="Path to JSON input file (default: stdin)")
    parser.add_argument("--output", "-o", help="Path to write the Markdown report (default: stdout)")
    args = parser.parse_args()

    raw = open(args.input).read() if args.input else sys.stdin.read()
    companies = json.loads(raw)
    if not isinstance(companies, list):
        raise SystemExit("Input must be a JSON array of company records.")

    scored = []
    for c in companies:
        score, reasons = score_company(c)
        scored.append({**c, "score": score, "tier": tier_for(score), "reasons": reasons})

    scored.sort(key=lambda c: c["score"], reverse=True)

    lines = [
        "| Score | Tier | Company | Email | Signals |",
        "|---|---|---|---|---|",
    ]
    for c in scored:
        signals = "; ".join(c["reasons"]) or "no strong signals yet"
        lines.append(
            f"| {c['score']} | {c['tier']} | {c.get('company', c.get('domain', '—'))} "
            f"| {c.get('email', '—')} | {signals} |"
        )

    ready = sum(1 for c in scored if c["score"] >= 60)
    lines.append("")
    lines.append(f"**{ready} of {len(scored)} ready to call today.**")

    report = "\n".join(lines)
    if args.output:
        with open(args.output, "w") as f:
            f.write(report + "\n")
    else:
        print(report)


if __name__ == "__main__":
    main()
