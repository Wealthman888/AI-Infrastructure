"""
LandWatch.com land listing scraper using ScrapeGraph AI.

LandWatch is far less aggressive about bot-blocking than Zillow/Trulia,
making it a more reliable target for land searches.

Usage:
    python scripts/scraper_landwatch.py                            # default search
    python scripts/scraper_landwatch.py --url <landwatch_url>      # specific search page
    python scripts/scraper_landwatch.py --multi                    # pages 1-3 in parallel
    python scripts/scraper_landwatch.py --contacts                 # also scrape agent phone numbers
    python scripts/scraper_landwatch.py --multi --contacts         # full run

Output is saved to data/<search-slug>_<date>.json

Setup:
    pip install scrapegraphai
    playwright install
    export ANTHROPIC_API_KEY=sk-...
"""

import os
import json
import argparse
import time
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise EnvironmentError("ANTHROPIC_API_KEY is not set. Run: export ANTHROPIC_API_KEY=sk-...")

SCRAPE_CONFIG = {
    "llm": {
        "api_key": ANTHROPIC_API_KEY,
        "model": "anthropic/claude-haiku-4-5-20251001",
    },
    "verbose": True,
}

SEARCH_RESULTS_PROMPT = """
Extract all land listings visible on the page. For each listing return:
- title: the listing title (e.g. "0.25 Acres in Palm Bay, FL")
- address: street address or location description
- city: city name
- county: county name if shown
- state: state abbreviation
- price: listing price (e.g. "$45,000")
- acreage: lot size in acres
- price_per_acre: price per acre if shown or calculable
- land_type: e.g. "Residential", "Recreational", "Agricultural", "Vacant Lot"
- parcel_number: parcel/APN number if shown
- days_listed: how many days the listing has been up if shown
- listing_url: the full URL to the LandWatch listing page
- agent_name: listing agent or company name if shown

Return a JSON list of objects, one per listing.
"""

CONTACT_PROMPT = """
Extract the listing agent or seller contact information from this land listing page:
- agent_name: full name of the listing agent
- agent_phone: phone number of the listing agent
- agent_email: email address if shown
- company: real estate company or agency name
- agent_photo_url: URL of agent headshot if shown

Return a single JSON object with these fields (use null if not found).
"""

DEFAULT_URL = "https://www.landwatch.com/florida-land-for-sale/palm-bay"

DATA_DIR = Path("data")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def flatten_result(result) -> list[dict]:
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        for val in result.values():
            if isinstance(val, list):
                return val
    return [result] if result else []


def deduplicate(listings: list[dict]) -> list[dict]:
    seen, unique = set(), []
    for listing in listings:
        key = listing.get("listing_url") or listing.get("address", "")
        if key and key not in seen:
            seen.add(key)
            unique.append(listing)
        elif not key:
            unique.append(listing)
    return unique


def slug_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/").replace("/", "_")
    return path[:60] if path else "landwatch"


def output_filename(url: str) -> Path:
    DATA_DIR.mkdir(exist_ok=True)
    slug = slug_from_url(url)
    today = date.today().isoformat()
    return DATA_DIR / f"{slug}_{today}.json"


# ---------------------------------------------------------------------------
# Scraper functions
# ---------------------------------------------------------------------------

def scrape_single(url: str) -> list[dict]:
    from scrapegraphai.graphs import SmartScraperGraph
    print(f"\nScraping: {url}")
    scraper = SmartScraperGraph(
        prompt=SEARCH_RESULTS_PROMPT,
        source=url,
        config=SCRAPE_CONFIG,
    )
    return flatten_result(scraper.run())


def scrape_multi(urls: list[str]) -> list[dict]:
    from scrapegraphai.graphs import SmartScraperMultiGraph
    print(f"\nScraping {len(urls)} pages in parallel...")
    scraper = SmartScraperMultiGraph(
        prompt=SEARCH_RESULTS_PROMPT,
        source=urls,
        config=SCRAPE_CONFIG,
    )
    all_listings = []
    for page_result in scraper.run():
        all_listings.extend(flatten_result(page_result))
    return all_listings


def enrich_with_contacts(listings: list[dict]) -> list[dict]:
    """Visit each individual listing page to pull agent phone numbers."""
    from scrapegraphai.graphs import SmartScraperGraph

    total = len(listings)
    for i, listing in enumerate(listings):
        url = listing.get("listing_url")
        if not url:
            continue

        print(f"  [{i+1}/{total}] Fetching contact for: {listing.get('title', url)}")
        try:
            scraper = SmartScraperGraph(
                prompt=CONTACT_PROMPT,
                source=url,
                config=SCRAPE_CONFIG,
            )
            contact = scraper.run()
            if isinstance(contact, dict):
                listing["agent_phone"] = contact.get("agent_phone")
                listing["agent_email"] = contact.get("agent_email")
                if not listing.get("agent_name"):
                    listing["agent_name"] = contact.get("agent_name")
                listing["company"] = contact.get("company")
        except Exception as e:
            print(f"    Warning: could not fetch contact — {e}")

        time.sleep(1)  # polite delay between listing page visits

    return listings


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="LandWatch scraper via ScrapeGraph AI")
    parser.add_argument("--url", default=DEFAULT_URL, help="LandWatch search URL to scrape")
    parser.add_argument(
        "--multi",
        action="store_true",
        help="Scrape pages 1–3 in parallel (more results)",
    )
    parser.add_argument(
        "--contacts",
        action="store_true",
        help="Visit each listing page to extract agent phone numbers",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Override output file path (default: data/<slug>_<date>.json)",
    )
    args = parser.parse_args()

    # --- Scrape search results ---
    if args.multi:
        base = args.url.rstrip("/")
        urls = [base, f"{base}/page-2", f"{base}/page-3"]
        listings = scrape_multi(urls)
    else:
        listings = scrape_single(args.url)

    listings = deduplicate(listings)
    print(f"\nFound {len(listings)} unique listings.")

    # --- Enrich with agent contacts ---
    if args.contacts:
        print(f"\nFetching agent contact info for {len(listings)} listings...")
        listings = enrich_with_contacts(listings)

    # --- Save ---
    output_path = Path(args.output) if args.output else output_filename(args.url)
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(listings, indent=2))

    print(f"\nSaved {len(listings)} listings → {output_path}")
    if listings:
        print("\nSample (first listing):")
        print(json.dumps(listings[0], indent=2))


if __name__ == "__main__":
    main()
