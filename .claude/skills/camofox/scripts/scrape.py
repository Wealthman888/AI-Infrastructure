#!/usr/bin/env python3
"""Fetch a page through the Camoufox stealth browser and save its rendered HTML.

Usage:
    python3 scrape.py "https://example.com" --out page.html

Requires: pip install camoufox[geoip] && python3 -m camoufox fetch
"""
import argparse
import sys
from pathlib import Path

from camoufox.sync_api import Camoufox


def fetch(url: str, out_path: Path, wait_ms: int) -> None:
    with Camoufox(headless=True) as browser:
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        if wait_ms:
            page.wait_for_timeout(wait_ms)
        out_path.write_text(page.content())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument("--out", type=Path, default=Path("page.html"), help="Output HTML path")
    parser.add_argument("--wait-ms", type=int, default=0, help="Extra wait after load, in ms (for JS-rendered content)")
    args = parser.parse_args()

    try:
        fetch(args.url, args.out, args.wait_ms)
    except Exception as exc:
        sys.exit(f"Scrape failed: {exc}")

    print(f"Saved rendered HTML to {args.out}")


if __name__ == "__main__":
    main()
