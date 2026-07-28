#!/usr/bin/env python3
"""Pull real estate agent leads from Zillow (via Apify) and write them to CSV.

Usage:
    export APIFY_API_TOKEN=your_token_here
    python scripts/pull_zillow_leads.py --zip 90210 94105 --status ForSale --out leads/zillow_leads.csv

To run this on a recurring schedule, wire it up with Claude Code's
/schedule skill (e.g. a weekly pull for a fixed list of target ZIP codes).
"""

import argparse
import csv
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools.apify_zillow_agents import run_zillow_agent_scraper

LEAD_FIELDS = [
    "agentName",
    "agentEmail",
    "cellPhone",
    "agentLicenseNumber",
    "brokerName",
    "brokerPhoneNumber",
    "source_zip",
]


def collect_leads(zip_codes, status_type, max_properties_per_zip):
    seen = set()
    leads = []
    for zip_code in zip_codes:
        properties = run_zillow_agent_scraper(
            zip_codes=[zip_code],
            status_type=status_type,
            max_properties_per_zip=max_properties_per_zip,
        )
        for prop in properties:
            email = (prop.get("agentEmail") or "").strip().lower()
            phone = (prop.get("cellPhone") or "").strip()
            key = email or phone
            if not key or key in seen:
                continue
            seen.add(key)
            lead = {field: prop.get(field, "") for field in LEAD_FIELDS[:-1]}
            lead["source_zip"] = zip_code
            leads.append(lead)
    return leads


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", nargs="+", required=True, help="ZIP codes to search")
    parser.add_argument(
        "--status",
        default="ForSale",
        choices=["ForSale", "ForRent", "RecentlySold"],
    )
    parser.add_argument(
        "--max-per-zip",
        type=int,
        default=0,
        help="Cap on properties scanned per ZIP code (0 = actor default)",
    )
    parser.add_argument("--out", default="leads/zillow_leads.csv")
    args = parser.parse_args()

    leads = collect_leads(args.zip, args.status, args.max_per_zip)

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=LEAD_FIELDS)
        writer.writeheader()
        writer.writerows(leads)

    print(f"Wrote {len(leads)} unique agent leads to {args.out}")


if __name__ == "__main__":
    main()
