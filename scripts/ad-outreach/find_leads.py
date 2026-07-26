#!/usr/bin/env python3
"""
Normalize the vendored ad-library scrapers' bundled sample data into a
single lead list for the ad-scraper email outreach pipeline.

Usage:
    python3 scripts/ad-outreach/find_leads.py [--skip-facebook] [--skip-google]

NOTE: As of the pinned submodule commits, every .py file in both
tools/facebook-ads-library-scraper and tools/google-ad-transparency-scraper
has a corrupted first line (a stray "thon" prefix from a broken markdown
export, e.g. "thonimport argparse" instead of "import argparse") and will
not run — see tools/README.md. Until that's fixed upstream (or patched
locally), this script reads each submodule's bundled data/*.sample.json
directly instead of shelling out to their src/main.py.
"""
import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FB_SCRAPER_DIR = REPO_ROOT / "tools" / "facebook-ads-library-scraper"
GOOGLE_SCRAPER_DIR = REPO_ROOT / "tools" / "google-ad-transparency-scraper"
OUTPUT_DIR = Path(__file__).resolve().parent
LEADS_PATH = OUTPUT_DIR / "leads.json"


def load_facebook_ads() -> list:
    data_path = FB_SCRAPER_DIR / "data" / "output.sample.json"
    return json.loads(data_path.read_text())


def load_google_ads() -> list:
    """Flatten data/advertisers.sample.json into the scraper's per-ad output shape."""
    data_path = GOOGLE_SCRAPER_DIR / "data" / "advertisers.sample.json"
    advertisers = json.loads(data_path.read_text())["advertisers"]
    ads = []
    for advertiser in advertisers:
        for ad in advertiser.get("ads", []):
            ads.append({
                **ad,
                "advertiserId": advertiser.get("advertiserId"),
                "advertiserName": advertiser.get("advertiserName"),
            })
    return ads


def normalize_facebook_ads(raw: list) -> list:
    leads = []
    for ad in raw:
        snapshot = ad.get("snapshot", {})
        leads.append({
            "business_name": ad.get("page_name"),
            "source": "facebook_ads_library",
            "source_id": ad.get("page_id"),
            "profile_url": ad.get("page_profile_uri"),
            "sample_ad_text": snapshot.get("body", {}).get("text"),
            "ad_platforms": ad.get("publisher_platform", []),
            "engagement": ad.get("page_like_count"),
        })
    return leads


def normalize_google_ads(raw: list) -> list:
    by_advertiser = {}
    for ad in raw:
        advertiser_id = ad.get("advertiserId")
        if advertiser_id not in by_advertiser:
            cta_url = None
            for variation in ad.get("variations", []):
                cta_url = variation.get("youtubeMetadata", {}).get("ctaUrl")
                if cta_url:
                    break
            by_advertiser[advertiser_id] = {
                "business_name": ad.get("advertiserName"),
                "source": "google_ad_transparency",
                "source_id": advertiser_id,
                "profile_url": cta_url,
                "sample_ad_text": None,
                "ad_platforms": ["Google", "YouTube"],
                "engagement": ad.get("stats", {}).get("impressions", {}).get("total"),
            }
    return list(by_advertiser.values())


def dedupe(leads: list) -> list:
    seen = {}
    for lead in leads:
        key = (lead.get("business_name") or "").strip().lower()
        if not key:
            continue
        if key not in seen:
            seen[key] = lead
        else:
            seen[key].setdefault("sources", [seen[key]["source"]])
            if lead["source"] not in seen[key]["sources"]:
                seen[key]["sources"].append(lead["source"])
    return list(seen.values())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-facebook", action="store_true")
    parser.add_argument("--skip-google", action="store_true")
    args = parser.parse_args()

    leads = []

    if not args.skip_facebook:
        leads.extend(normalize_facebook_ads(load_facebook_ads()))

    if not args.skip_google:
        leads.extend(normalize_google_ads(load_google_ads()))

    leads = dedupe(leads)
    LEADS_PATH.write_text(json.dumps(leads, indent=2))

    print(f"Wrote {len(leads)} deduped leads to {LEADS_PATH}")
    print("Next: for each lead's profile_url, run `/market audit <url>`, then")
    print("draft outreach with `/market emails` or the Gmail MCP create_draft tool.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
