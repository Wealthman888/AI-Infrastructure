#!/usr/bin/env python3
"""
Build a lead list for the ad-scraper email outreach pipeline, either from
the vendored scrapers' bundled sample data (default) or from live Apify
Actor runs (--live).

Usage:
    python3 scripts/ad-outreach/find_leads.py [--skip-facebook] [--skip-google]
    python3 scripts/ad-outreach/find_leads.py --live   # requires APIFY_API_TOKEN
                                                          # and apify_config.json

NOTE: As of the pinned submodule commits, every .py file in both
tools/facebook-ads-library-scraper and tools/google-ad-transparency-scraper
has a corrupted first line (a stray "thon" prefix from a broken markdown
export, e.g. "thonimport argparse" instead of "import argparse") and will
not run — see tools/README.md. This script never shells out to their
src/main.py; the default (offline) mode reads their bundled
data/*.sample.json directly, and --live mode fetches real data via Apify
Actors instead (see apify_config.example.json).
"""
import argparse
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FB_SCRAPER_DIR = REPO_ROOT / "tools" / "facebook-ads-library-scraper"
GOOGLE_SCRAPER_DIR = REPO_ROOT / "tools" / "google-ad-transparency-scraper"
OUTPUT_DIR = Path(__file__).resolve().parent
LEADS_PATH = OUTPUT_DIR / "leads.json"
APIFY_CONFIG_PATH = OUTPUT_DIR / "apify_config.json"

sys.path.insert(0, str(REPO_ROOT / "tools"))


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


def load_apify_config() -> dict:
    if not APIFY_CONFIG_PATH.exists():
        raise SystemExit(
            f"--live requires {APIFY_CONFIG_PATH}. Copy apify_config.example.json "
            "to apify_config.json and fill in your actor IDs + input."
        )
    return json.loads(APIFY_CONFIG_PATH.read_text())


def load_facebook_ads_live(config: dict) -> list:
    from apify_client import run_actor  # tools/apify_client.py

    token = os.environ["APIFY_API_TOKEN"]
    return run_actor(config["facebook_actor_id"], config["facebook_actor_input"], token)


def load_google_ads_live(config: dict) -> list:
    from apify_client import run_actor  # tools/apify_client.py

    token = os.environ["APIFY_API_TOKEN"]
    return run_actor(config["google_actor_id"], config["google_actor_input"], token)


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
    parser.add_argument(
        "--live", action="store_true",
        help="Fetch real ads via Apify Actors instead of bundled sample data.",
    )
    args = parser.parse_args()

    if args.live and "APIFY_API_TOKEN" not in os.environ:
        raise SystemExit("--live requires the APIFY_API_TOKEN environment variable.")

    apify_config = load_apify_config() if args.live else None

    leads = []

    if not args.skip_facebook:
        raw_fb = (
            load_facebook_ads_live(apify_config) if args.live else load_facebook_ads()
        )
        leads.extend(normalize_facebook_ads(raw_fb))

    if not args.skip_google:
        raw_google = (
            load_google_ads_live(apify_config) if args.live else load_google_ads()
        )
        leads.extend(normalize_google_ads(raw_google))

    leads = dedupe(leads)
    LEADS_PATH.write_text(json.dumps(leads, indent=2))

    print(f"Wrote {len(leads)} deduped leads to {LEADS_PATH}")
    print("Next: for each lead's profile_url, run `/market audit <url>`, then")
    print("draft outreach with `/market emails` or the Gmail MCP create_draft tool.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
