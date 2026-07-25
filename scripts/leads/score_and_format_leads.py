#!/usr/bin/env python3
"""
Merge an Apify Google Maps Scraper export with an Apify email/contact-scraper
export, score each business on the med spa "cash ready" ICP, and write an
Instantly-ready CSV (email, website, company).

Pipeline this feeds from:
  1. Apify Google Maps Scraper -> maps_export.json
     (filters already applied: rating>=4.0, reviews>=100, has website,
     excludes closed -- see tools/leads-icp.md)
  2. Apify email/contact-scraper run against each business's website
     -> emails_export.json (crawls each site, extracts contact emails)

Usage:
  python3 score_and_format_leads.py maps_export.json emails_export.json out.csv [--min-score 1]

A lead is included only if:
  - it passed the Apify-side quality filters (this script re-checks the
    basics defensively: rating, review count, website present, not closed)
  - at least one email was found for its domain
  - its high-margin keyword score meets --min-score (default 1; use 0 to
    include everything that has an email, ignoring service-mix signal)
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


def domain_of(url: str) -> str:
    if not url:
        return ""
    netloc = urlparse(url if "://" in url else f"https://{url}").netloc
    return netloc.lower().lstrip("www.")


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


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("maps_export")
    ap.add_argument("emails_export")
    ap.add_argument("out_csv")
    ap.add_argument("--min-score", type=int, default=1)
    args = ap.parse_args()

    maps_data = json.load(open(args.maps_export, encoding="utf-8"))
    emails_data = json.load(open(args.emails_export, encoding="utf-8"))
    email_map = load_email_map(emails_data)

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
        score, matched = score_text(name, category)

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
            })

    with open(args.out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "website", "company", "score", "matched_keywords"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"wrote {len(rows)} leads -> {args.out_csv}")
    print(f"skipped: {skipped_quality} failed quality filter, {skipped_no_email} no email found, {skipped_score} below min-score")


if __name__ == "__main__":
    main()
