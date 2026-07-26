"""Search the Meta Ad Library for advertisers in target niches and write a leads CSV.

Usage:
    export META_ADS_LIBRARY_TOKEN=EAA...
    python scripts/scrape_ads_library_leads.py

Output: scripts/output/ads_library_leads.csv (page_name, page_id, domains, ad_snapshot_url)

Feed the resulting CSV's page_name/domain columns into Clay
(find-and-enrich-company / find-and-enrich-contacts-at-company) to attach
contact emails per company.
"""

import csv
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools.meta_ads_library import search_ads

SEARCH_TERMS = ["med spa", "aesthetic clinic", "saas"]
COUNTRIES = ["US"]
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "output", "ads_library_leads.csv")


def main():
    seen_page_ids = set()
    rows = []

    for term in SEARCH_TERMS:
        for advertiser in search_ads(term, COUNTRIES):
            if advertiser["page_id"] in seen_page_ids:
                continue
            seen_page_ids.add(advertiser["page_id"])
            rows.append(
                {
                    "search_term": term,
                    "page_name": advertiser["page_name"],
                    "page_id": advertiser["page_id"],
                    "domains": "; ".join(sorted(advertiser["domains"])),
                    "ad_snapshot_url": advertiser["ad_snapshot_url"],
                }
            )

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["search_term", "page_name", "page_id", "domains", "ad_snapshot_url"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} unique advertisers to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
