#!/usr/bin/env python3
"""Find Zillow listings + agents that are good targets for a cinematic /
high-quality listing-video offer, and score them by opportunity.

Pulls FOR_SALE listings above a price floor across a set of ZIP codes,
then scores each one for how much it would benefit from a premium video
upgrade: no existing walkthrough video, no 3D tour, high price (budget to
justify the spend), and signs of a stale or under-performing listing
(days on market vs. page views).

Usage:
    export APIFY_API_TOKEN=your_token_here
    python scripts/find_video_offer_leads.py \
        --zip 89135 89144 89138 89117 89113 89141 89052 89011 89014 89109 \
        --min-price 750000 \
        --max-per-zip 10 \
        --top 50 \
        --out leads/vegas_video_offer_leads.csv
"""

import argparse
import csv
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools.apify_zillow_agents import run_zillow_agent_scraper

LEAD_FIELDS = [
    "score",
    "streetAddress",
    "city",
    "zipcode",
    "price",
    "hasVideo",
    "has3DModel",
    "daysOnZillow",
    "pageViewCount",
    "photoCount",
    "agentName",
    "agentEmail",
    "cellPhone",
    "brokerName",
    "brokerPhoneNumber",
    "hdpUrl",
    "mainPhoto",
]


def parse_days(days_on_zillow):
    if not days_on_zillow:
        return 0
    match = re.search(r"\d+", str(days_on_zillow))
    return int(match.group()) if match else 0


def score_listing(item):
    """Higher score = better target for a cinematic video upsell."""
    score = 0.0

    if not item.get("hasVideo"):
        score += 35
    if not item.get("has3DModel"):
        score += 15

    price = item.get("price") or 0
    score += min(25, (price - 750000) / 100000)

    days = parse_days(item.get("daysOnZillow"))
    score += min(15, days / 10)

    views = item.get("pageViewCount") or 0
    views_per_day = views / max(days, 1)
    if views_per_day < 15:
        score += 10

    return round(max(score, 0), 1)


def collect_and_score(zip_codes, min_price, max_per_zip):
    seen_zpids = set()
    scored = []
    for zip_code in zip_codes:
        properties = run_zillow_agent_scraper(
            zip_codes=[zip_code],
            status_type="ForSale",
            max_properties_per_zip=max_per_zip,
            price_min=min_price,
            enrichPhotos=True,
        )
        for item in properties:
            zpid = item.get("zpid")
            if not zpid or zpid in seen_zpids:
                continue
            if (item.get("price") or 0) < min_price:
                continue
            seen_zpids.add(zpid)
            photos = item.get("photos") or []
            row = {field: item.get(field, "") for field in LEAD_FIELDS}
            row["photoCount"] = len(photos)
            row["score"] = score_listing(item)
            scored.append(row)
    scored.sort(key=lambda r: r["score"], reverse=True)
    return scored


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", nargs="+", required=True, help="ZIP codes to search")
    parser.add_argument("--min-price", type=int, default=750000)
    parser.add_argument("--max-per-zip", type=int, default=10)
    parser.add_argument("--top", type=int, default=50, help="Number of top-scored listings to keep")
    parser.add_argument("--out", default="leads/video_offer_leads.csv")
    args = parser.parse_args()

    scored = collect_and_score(args.zip, args.min_price, args.max_per_zip)
    top = scored[: args.top]

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=LEAD_FIELDS)
        writer.writeheader()
        writer.writerows(top)

    print(f"Scanned {len(scored)} unique listings >= ${args.min_price:,}; wrote top {len(top)} to {args.out}")


if __name__ == "__main__":
    main()
