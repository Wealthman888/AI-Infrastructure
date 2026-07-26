"""Wrapper around Meta's Ad Library API (Graph API `ads_archive` endpoint).

Requires an access token with Ad Library API access, set via the
META_ADS_LIBRARY_TOKEN environment variable.
"""

import os
import time
from urllib.parse import urlparse

import requests

GRAPH_API_VERSION = "v21.0"
ADS_ARCHIVE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}/ads_archive"

FIELDS = ",".join(
    [
        "id",
        "page_id",
        "page_name",
        "ad_creative_link_captions",
        "ad_creative_link_titles",
        "ad_snapshot_url",
        "publisher_platforms",
    ]
)


def _extract_domain(url: str) -> str | None:
    if not url:
        return None
    netloc = urlparse(url).netloc
    return netloc.replace("www.", "") if netloc else None


def search_ads(search_terms: str, countries: list[str], limit: int = 200, access_token: str | None = None):
    """Query the Ad Library API for a search term and return one row per unique advertiser.

    Each row: {"page_id", "page_name", "domains": set[str], "ad_snapshot_url"}
    """
    token = access_token or os.environ.get("META_ADS_LIBRARY_TOKEN")
    if not token:
        raise RuntimeError("Set META_ADS_LIBRARY_TOKEN before calling search_ads()")

    advertisers: dict[str, dict] = {}
    params = {
        "search_terms": search_terms,
        "ad_reached_countries": str(countries),
        "ad_active_status": "ALL",
        "fields": FIELDS,
        "limit": 100,
        "access_token": token,
    }

    url = ADS_ARCHIVE_URL
    while url and len(advertisers) < limit:
        resp = requests.get(url, params=params if url == ADS_ARCHIVE_URL else None, timeout=30)
        if resp.status_code == 429:
            time.sleep(5)
            continue
        resp.raise_for_status()
        payload = resp.json()

        for ad in payload.get("data", []):
            page_id = ad.get("page_id")
            if not page_id:
                continue
            entry = advertisers.setdefault(
                page_id,
                {"page_id": page_id, "page_name": ad.get("page_name"), "domains": set(), "ad_snapshot_url": ad.get("ad_snapshot_url")},
            )
            for caption in ad.get("ad_creative_link_captions") or []:
                domain = _extract_domain(caption if caption.startswith("http") else f"https://{caption}")
                if domain:
                    entry["domains"].add(domain)

        url = payload.get("paging", {}).get("next")
        params = None  # subsequent requests use the fully-formed `next` URL

    return list(advertisers.values())
