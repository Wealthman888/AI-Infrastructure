#!/usr/bin/env python3
"""
Merge an Apify Google Maps Scraper export, an Apify email/contact-scraper
export, and (optionally) an Apify Meta Ads Scraper export, score each
business on the med spa "cash ready" ICP, and write an Instantly-ready
CSV (email, website, company).

Pipeline this feeds from:
  1. Apify Google Maps Scraper -> maps_export.json
     (filters already applied: rating>=4.0, reviews>=100, has website,
     excludes closed -- see tools/leads-icp.md)
  2. Apify email/contact-scraper run against each business's website
     -> emails_export.json (crawls each site, extracts contact emails)
  3. Optional: Apify Meta Ads Scraper run against each business's name/page
     -> ads_export.json (checks whether they're currently running Meta ads --
     a stronger buy signal than the keyword match alone)

Usage:
  python3 score_and_format_leads.py maps_export.json emails_export.json out.csv \
      [--ads-export ads_export.json] [--min-score 1]

A lead is included only if:
  - it passed the Apify-side quality filters (this script re-checks the
    basics defensively: rating, review count, website present, not closed)
  - at least one email was found for its domain
  - its total score (keyword matches + active-ads bonus) meets --min-score
    (default 1; use 0 to include everything that has an email)
"""
import argparse
import csv
import json
import re
import sys
from urllib.parse import urlparse

HIGH_MARGIN_KEYWORDS = [
    "botox", "filler", "dermal filler", "lip filler", "injectable",
    "laser", "coolsculpting", "body contouring", "sculptra", "kybella",
    "morpheus8", "microneedling", "prp", "hydrafacial", "iv therapy",
    "iv drip", "sculpting", "cellulite", "skin tightening", "juvederm",
    "restylane", "dysport", "emsculpt",
]

MIN_RATING = 4.0
MIN_REVIEWS = 100
ACTIVE_ADS_BONUS = 3  # already spending on Meta ads outweighs a keyword match

NAME_NOISE_WORDS = {
    "med", "medspa", "spa", "medical", "aesthetics", "clinic", "the",
    "llc", "inc", "and", "co", "wellness",
}


def domain_of(url: str) -> str:
    if not url:
        return ""
    netloc = urlparse(url if "://" in url else f"https://{url}").netloc
    return netloc.lower().lstrip("www.")


def normalize_name(name: str) -> str:
    """Loose match key for joining Maps business names against Meta ad
    page names, which rarely share a clean identifier like a domain."""
    words = re.findall(r"[a-z0-9]+", (name or "").lower())
    return " ".join(w for w in words if w not in NAME_NOISE_WORDS)


def score_text(*texts: str) -> tuple[int, list[str]]:
    blob = " ".join(t or "" for t in texts).lower()
    matched = [kw for kw in HIGH_MARGIN_KEYWORDS if kw in blob]
    return len(matched), matched


def passes_quality_filter(place: dict) -> bool:
    if place.get("permanentlyClosed") or place.get("temporarilyClosed"):
        return False
    if not place.get("website"):
        return False
    rating = place.get("totalScore") or place.get("rating") or 0
    reviews = place.get("reviewsCount") or place.get("userRatingsTotal") or 0
    return rating >= MIN_RATING and reviews >= MIN_REVIEWS


def load_email_map(emails_export: list[dict]) -> dict[str, list[str]]:
    """Map domain -> list of emails found by the contact-scraper actor.
    Adjust the field names below if your actor's output schema differs."""
    out: dict[str, list[str]] = {}
    for item in emails_export:
        url = item.get("url") or item.get("website") or item.get("startUrl") or ""
        dom = domain_of(url)
        if not dom:
            continue
        emails = item.get("emails") or item.get("contactEmails") or []
        if isinstance(emails, str):
            emails = [emails]
        emails = [e for e in emails if e and "@" in e]
        if emails:
            out.setdefault(dom, [])
            for e in emails:
                if e not in out[dom]:
                    out[dom].append(e)
    return out


def load_ads_map(ads_export: list[dict]) -> dict[str, bool]:
    """Map normalized page/business name -> currently running Meta ads.

    NOTE: field names here are a best guess (pageName/page_name/name for the
    identifier, isActive/is_active/adCount for activity) -- Meta Ads Scraper
    actors vary in output schema. Adjust once you've confirmed the real
    field names from a sample export; see tools/leads-icp.md.
    """
    out: dict[str, bool] = {}
    for item in ads_export:
        page_name = (
            item.get("pageName") or item.get("page_name")
            or item.get("name") or item.get("advertiserName") or ""
        )
        key = normalize_name(page_name)
        if not key:
            continue
        is_active = bool(
            item.get("isActive") or item.get("is_active")
            or (item.get("adCount") or item.get("ad_count") or 0) > 0
            or item.get("ads")  # some actors nest a non-empty list of active ads
        )
        out[key] = out.get(key, False) or is_active
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("maps_export")
    ap.add_argument("emails_export")
    ap.add_argument("out_csv")
    ap.add_argument("--ads-export", default=None, help="Optional Meta Ads Scraper export (JSON)")
    ap.add_argument("--min-score", type=int, default=1)
    args = ap.parse_args()

    maps_data = json.load(open(args.maps_export, encoding="utf-8"))
    emails_data = json.load(open(args.emails_export, encoding="utf-8"))
    email_map = load_email_map(emails_data)

    ads_map: dict[str, bool] = {}
    if args.ads_export:
        ads_data = json.load(open(args.ads_export, encoding="utf-8"))
        ads_map = load_ads_map(ads_data)

    rows = []
    skipped_no_email = 0
    skipped_quality = 0
    skipped_score = 0

    for place in maps_data:
        if not passes_quality_filter(place):
            skipped_quality += 1
            continue

        website = place.get("website", "")
        dom = domain_of(website)
        emails = email_map.get(dom, [])
        if not emails:
            skipped_no_email += 1
            continue

        name = place.get("title") or place.get("name") or ""
        category = place.get("categoryName") or ""
        keyword_score, matched = score_text(name, category)

        running_ads = ads_map.get(normalize_name(name), False)
        score = keyword_score + (ACTIVE_ADS_BONUS if running_ads else 0)

        if score < args.min_score:
            skipped_score += 1
            continue

        for email in emails:
            rows.append({
                "email": email,
                "website": website,
                "company": name,
                "score": score,
                "matched_keywords": ";".join(matched),
                "running_meta_ads": running_ads,
            })

    with open(args.out_csv, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["email", "website", "company", "score", "matched_keywords", "running_meta_ads"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"wrote {len(rows)} leads -> {args.out_csv}")
    print(f"skipped: {skipped_quality} failed quality filter, {skipped_no_email} no email found, {skipped_score} below min-score")


if __name__ == "__main__":
    main()
