"""
Zillow property listing scraper using ScrapeGraph AI.

Usage:
    python scripts/scraper_zillow.py                        # scrape default search URL
    python scripts/scraper_zillow.py --url <zillow_url>     # scrape a specific search page
    python scripts/scraper_zillow.py --multi                # scrape multiple pages in parallel

Setup:
    pip install scrapegraphai
    playwright install
    export ANTHROPIC_API_KEY=sk-...
"""

import os
import json
import argparse
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise EnvironmentError("ANTHROPIC_API_KEY is not set. Run: export ANTHROPIC_API_KEY=sk-...")

# Use Haiku for cost-efficient, high-volume scraping (per CLAUDE.md)
SCRAPE_CONFIG = {
    "llm": {
        "api_key": ANTHROPIC_API_KEY,
        "model": "anthropic/claude-haiku-4-5-20251001",
    },
    "verbose": True,
}

# Fields to extract per listing
EXTRACT_PROMPT = """
Extract all property listings visible on the page. For each listing return:
- address: full street address
- price: listing price (e.g. "$850,000")
- beds: number of bedrooms
- baths: number of bathrooms
- sqft: square footage
- price_per_sqft: price per sqft if shown
- lot_size: lot size if shown
- listing_type: "For Sale", "For Rent", "Sold", etc.
- days_on_zillow: how many days on market if shown
- listing_url: the URL to the full Zillow listing
- agent_name: listing agent or brokerage name if shown
- zestimate: Zestimate value if shown

Return a JSON list of objects, one per listing.
"""

# Default search URL — swap city/state as needed
DEFAULT_URL = "https://www.zillow.com/homes/for_sale/"

# ---------------------------------------------------------------------------
# Scraper functions
# ---------------------------------------------------------------------------

def scrape_single(url: str) -> list[dict]:
    """Scrape one Zillow search results page."""
    from scrapegraphai.graphs import SmartScraperGraph

    print(f"Scraping: {url}")
    scraper = SmartScraperGraph(
        prompt=EXTRACT_PROMPT,
        source=url,
        config=SCRAPE_CONFIG,
    )
    result = scraper.run()

    # ScrapeGraph may return a dict with a key like "listings" or a bare list
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        for val in result.values():
            if isinstance(val, list):
                return val
    return [result]


def scrape_multi(urls: list[str]) -> list[dict]:
    """Scrape multiple Zillow pages in parallel."""
    from scrapegraphai.graphs import SmartScraperMultiGraph

    print(f"Scraping {len(urls)} pages in parallel...")
    scraper = SmartScraperMultiGraph(
        prompt=EXTRACT_PROMPT,
        source=urls,
        config=SCRAPE_CONFIG,
    )
    results = scraper.run()

    # Flatten results from all pages into one list
    all_listings = []
    for page_result in results:
        if isinstance(page_result, list):
            all_listings.extend(page_result)
        elif isinstance(page_result, dict):
            for val in page_result.values():
                if isinstance(val, list):
                    all_listings.extend(val)
                    break
    return all_listings


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Zillow scraper via ScrapeGraph AI")
    parser.add_argument("--url", default=DEFAULT_URL, help="Zillow search URL to scrape")
    parser.add_argument(
        "--multi",
        action="store_true",
        help="Scrape multiple pages (pages 1-3 of the default search)",
    )
    parser.add_argument(
        "--output", default="output.json", help="Output file path (default: output.json)"
    )
    args = parser.parse_args()

    # Zillow requires a realistic user-agent; ScrapeGraph + Playwright handles this,
    # but large-scale runs need proxy rotation to avoid blocks.
    print("Note: Zillow aggressively blocks scrapers at scale.")
    print("For production use, add proxy rotation to SCRAPE_CONFIG.")
    print()

    if args.multi:
        # Scrape pages 1–3 (Zillow paginates via ?searchQueryState= params,
        # but simple page suffixes work for basic searches)
        base = args.url.rstrip("/")
        urls = [
            f"{base}/",
            f"{base}/2_p/",
            f"{base}/3_p/",
        ]
        listings = scrape_multi(urls)
    else:
        listings = scrape_single(args.url)

    # Deduplicate by address
    seen = set()
    unique_listings = []
    for listing in listings:
        addr = listing.get("address", "")
        if addr and addr not in seen:
            seen.add(addr)
            unique_listings.append(listing)
        elif not addr:
            unique_listings.append(listing)

    # Save output
    output_path = Path(args.output)
    output_path.write_text(json.dumps(unique_listings, indent=2))

    print(f"\nExtracted {len(unique_listings)} listings → {output_path}")
    if unique_listings:
        print("\nSample (first listing):")
        print(json.dumps(unique_listings[0], indent=2))


if __name__ == "__main__":
    main()
