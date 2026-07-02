"""One-off: enrich the HVAC Las Vegas lead list (business name/phone/website,
no emails) by scraping each site for a published contact email, then add any
lead with a found email to an Instantly campaign. No AI drafting/personalization
is used in this pass.

Usage:
    python scripts/enrich_hvac_leads.py <csv_path> [--campaign-id ID] [--limit N]
"""

import argparse
import csv
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

from tools.firecrawl import FirecrawlClient
from tools.instantly import InstantlyClient

DEFAULT_CAMPAIGN_ID = "9a62fd13-a7b4-49cf-aa4f-58b84b7075f2"

EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*")

JUNK_DOMAIN_SUBSTRINGS = (
    "wixpress",
    "sentry.io",
    "godaddy",
    "schema.org",
    "example.com",
    "w3.org",
    "googleapis",
    "gstatic",
    "cloudflare",
    "squarespace",
    "wordpress.com",
    "network-tools",
    "yourdomain",
    "domain.com",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
)


def extract_domain(url: str) -> str:
    match = re.search(r"https?://(?:www\.)?([^/]+)", url or "")
    return match.group(1).lower() if match else ""


def extract_email(markdown: str, site_domain: str) -> str:
    candidates = [e.lower() for e in EMAIL_RE.findall(markdown or "")]
    candidates = [e for e in candidates if not any(j in e for j in JUNK_DOMAIN_SUBSTRINGS)]
    if not candidates:
        return ""
    for c in candidates:
        if site_domain and site_domain in c:
            return c
    return candidates[0]


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path")
    parser.add_argument("--campaign-id", default=DEFAULT_CAMPAIGN_ID)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    firecrawl = FirecrawlClient()
    instantly = InstantlyClient()

    results = []
    with open(args.csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader if r.get("title")]

    if args.limit:
        rows = rows[: args.limit]

    for i, row in enumerate(rows, 1):
        company = row["title"]
        website = row.get("website", "").strip()
        phone = row.get("phone", "").strip()
        city = row.get("city", "").strip()

        if not website:
            print(f"[{i}/{len(rows)}] {company}: SKIP (no website)")
            results.append({"company": company, "website": "", "email": "", "status": "no_website"})
            continue

        try:
            data = firecrawl.scrape(website)
            markdown = data.get("markdown", "")
        except Exception as exc:  # noqa: BLE001
            print(f"[{i}/{len(rows)}] {company}: SCRAPE FAILED ({exc})")
            results.append({"company": company, "website": website, "email": "", "status": f"scrape_failed: {exc}"})
            continue

        domain = extract_domain(website)
        email = extract_email(markdown, domain)

        if not email:
            print(f"[{i}/{len(rows)}] {company}: no email found on {website}")
            results.append({"company": company, "website": website, "email": "", "status": "no_email_found"})
            continue

        try:
            instantly.add_lead(
                campaign_id=args.campaign_id,
                email=email,
                company_name=company,
                personalization="",
                custom_variables={"phone": phone, "city": city, "website": website},
            )
            print(f"[{i}/{len(rows)}] {company}: ADDED {email}")
            results.append({"company": company, "website": website, "email": email, "status": "added"})
        except Exception as exc:  # noqa: BLE001
            print(f"[{i}/{len(rows)}] {company}: ADD FAILED ({exc})")
            results.append({"company": company, "website": website, "email": email, "status": f"add_failed: {exc}"})

        time.sleep(0.3)

    out_path = os.path.join(os.path.dirname(args.csv_path), "hvac_lead_enrichment_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    added = sum(1 for r in results if r["status"] == "added")
    print(f"\nDone. {added}/{len(rows)} leads added. Full results: {out_path}")


if __name__ == "__main__":
    main()
