"""Pull listing agent name/phone/brokerage for the results of a single Zillow
search URL.

Run this on a machine with unrestricted internet access (NOT from a sandboxed
Claude Code remote environment — see CLAUDE.md network notes). Zillow runs bot
detection, so:
  - Prefer --headed over headless; headless is far more likely to be blocked.
  - Expect to occasionally need to solve a CAPTCHA by hand in the opened window.
  - Keep --limit small and --delay reasonable; this is meant for a one-off
    pull of a single search's results, not bulk/recurring harvesting.
  - This uses Zillow's own embedded page JSON (more stable than CSS selectors,
    which change often), but Zillow can still change that structure at any time.

Setup:
    pip install playwright
    playwright install chromium

Usage:
    python scripts/zillow_search_agents.py "<zillow search URL>" --headed
    python scripts/zillow_search_agents.py "<zillow search URL>" --headed --limit 10 --out agents.csv
"""

import argparse
import csv
import json
import re
import sys
import time

from playwright.sync_api import sync_playwright

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _next_data(page) -> dict | None:
    """Pull Zillow's embedded __NEXT_DATA__ JSON blob off the current page, if present."""
    raw = page.evaluate(
        "() => { const el = document.getElementById('__NEXT_DATA__'); return el ? el.textContent : null; }"
    )
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def get_listings(page, search_url: str, limit: int) -> list[dict]:
    """Load a Zillow search URL and return address/price/detail-url for each result."""
    page.goto(search_url, timeout=45000, wait_until="domcontentloaded")
    page.wait_for_timeout(4000)

    data = _next_data(page)
    results = []
    if data:
        try:
            cat1 = data["props"]["pageProps"]["searchPageState"]["cat1"]
            raw_results = cat1["searchResults"]["listResults"]
        except (KeyError, TypeError):
            raw_results = []
        for r in raw_results:
            detail_url = r.get("detailUrl")
            if not detail_url:
                continue
            if detail_url.startswith("/"):
                detail_url = "https://www.zillow.com" + detail_url
            results.append(
                {
                    "address": r.get("address"),
                    "price": r.get("price") or r.get("unformattedPrice"),
                    "zpid": r.get("zpid"),
                    "broker_name_from_search": r.get("brokerName"),
                    "detail_url": detail_url,
                }
            )

    if not results:
        # Fallback: pull listing links straight off the DOM.
        hrefs = page.eval_on_selector_all(
            "a[href*='/homedetails/']", "els => els.map(e => e.href)"
        )
        seen = set()
        for href in hrefs:
            if href not in seen:
                seen.add(href)
                results.append({"address": None, "price": None, "zpid": None,
                                 "broker_name_from_search": None, "detail_url": href})

    return results[:limit] if limit else results


def get_agent_info(page, detail_url: str) -> dict:
    """Visit a single listing's detail page and extract agent contact info."""
    info = {"agent_name": None, "agent_phone": None, "brokerage": None}
    try:
        page.goto(detail_url, timeout=45000, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
    except Exception as exc:  # noqa: BLE001 - keep going on a bad listing
        info["error"] = str(exc)
        return info

    html = page.content()

    # Zillow's GraphQL "attributionInfo" block is more stable than page markup.
    name_match = re.search(r'"agentName"\s*:\s*"([^"]+)"', html)
    phone_match = re.search(r'"agentPhoneNumber"\s*:\s*"([^"]+)"', html)
    broker_match = re.search(r'"brokerName"\s*:\s*"([^"]+)"', html)

    if name_match:
        info["agent_name"] = name_match.group(1)
    if phone_match:
        info["agent_phone"] = phone_match.group(1)
    if broker_match:
        info["brokerage"] = broker_match.group(1)

    # Fallback: visible "Listed by" text block on the page.
    if not info["agent_name"]:
        listed_by = page.locator("text=Listed by").first
        if listed_by.count():
            container_text = listed_by.locator("xpath=..").inner_text()
            info["agent_name"] = container_text.strip()[:200]

    return info


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("search_url", help="Full Zillow search results URL (the one with searchQueryState=...)")
    parser.add_argument("--limit", type=int, default=0, help="Max listings to process (0 = all found)")
    parser.add_argument("--delay", type=float, default=3.0, help="Seconds to wait between detail-page visits")
    parser.add_argument("--headed", action="store_true", help="Show the browser window (recommended)")
    parser.add_argument("--out", default="zillow_agents.csv", help="Output CSV path")
    args = parser.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        page = browser.new_page(user_agent=USER_AGENT, viewport={"width": 1366, "height": 900})

        print(f"Loading search results: {args.search_url}", file=sys.stderr)
        listings = get_listings(page, args.search_url, args.limit)
        print(f"Found {len(listings)} listings.", file=sys.stderr)

        rows = []
        for i, listing in enumerate(listings, 1):
            print(f"[{i}/{len(listings)}] {listing.get('address') or listing['detail_url']}", file=sys.stderr)
            agent = get_agent_info(page, listing["detail_url"])
            rows.append({**listing, **agent})
            time.sleep(args.delay)

        browser.close()

    fieldnames = ["address", "price", "zpid", "detail_url", "agent_name", "agent_phone", "brokerage"]
    with open(args.out, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
