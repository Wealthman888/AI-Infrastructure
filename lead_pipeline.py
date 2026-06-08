#!/usr/bin/env python3
"""
Lead pipeline: scrapes business leads via Apify's Google Maps Scraper.
Usage: python lead_pipeline.py --query "HVAC contractor Las Vegas NV" --max 60
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime


APIFY_API_TOKEN = os.environ.get("APIFY_API_TOKEN", "")
# Apify actor for Google Maps scraping
ACTOR_ID = "nwua9Gu5YrADL7ZDj"  # compass/google-maps-scraper


def apify_post(path: str, payload: dict) -> dict:
    url = f"https://api.apify.com/v2{path}?token={APIFY_API_TOKEN}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def apify_get(path: str) -> dict:
    url = f"https://api.apify.com/v2{path}?token={APIFY_API_TOKEN}"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())


def run_actor(query: str, max_results: int) -> str:
    print(f"[*] Starting Apify actor for: {query!r} (max {max_results})")
    resp = apify_post(f"/acts/{ACTOR_ID}/runs", {
        "searchStringsArray": [query],
        "maxCrawledPlacesPerSearch": max_results,
        "language": "en",
        "countryCode": "us",
        "includeReviews": False,
        "includeImages": False,
    })
    run_id = resp["data"]["id"]
    print(f"[*] Run ID: {run_id}")
    return run_id


def wait_for_run(run_id: str, poll_interval: int = 10) -> str:
    print("[*] Waiting for actor run to finish...", end="", flush=True)
    while True:
        data = apify_get(f"/actor-runs/{run_id}")["data"]
        status = data["status"]
        if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            print(f" {status}")
            if status != "SUCCEEDED":
                sys.exit(f"[!] Actor run ended with status: {status}")
            return data["defaultDatasetId"]
        print(".", end="", flush=True)
        time.sleep(poll_interval)


def fetch_results(dataset_id: str) -> list[dict]:
    print(f"[*] Fetching results from dataset {dataset_id}")
    url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_API_TOKEN}&format=json&clean=true"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())


def normalize(item: dict) -> dict:
    return {
        "name": item.get("title", ""),
        "category": item.get("categoryName", ""),
        "address": item.get("address", ""),
        "city": item.get("city", ""),
        "state": item.get("state", ""),
        "zip": item.get("postalCode", ""),
        "phone": item.get("phone", ""),
        "website": item.get("website", ""),
        "rating": item.get("totalScore", ""),
        "reviews": item.get("reviewsCount", ""),
        "google_maps_url": item.get("url", ""),
    }


def save_csv(leads: list[dict], filename: str):
    if not leads:
        print("[!] No leads to save.")
        return
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=leads[0].keys())
        writer.writeheader()
        writer.writerows(leads)
    print(f"[+] Saved {len(leads)} leads -> {filename}")


def main():
    parser = argparse.ArgumentParser(description="Scrape business leads via Apify Google Maps Scraper")
    parser.add_argument("--query", required=True, help='Search query, e.g. "HVAC contractor Las Vegas NV"')
    parser.add_argument("--max", type=int, default=50, help="Max number of results (default: 50)")
    parser.add_argument("--out", default="", help="Output CSV filename (default: auto-generated)")
    args = parser.parse_args()

    if not APIFY_API_TOKEN:
        sys.exit("[!] APIFY_API_TOKEN environment variable not set. Export it before running.")

    out_file = args.out or f"leads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    run_id = run_actor(args.query, args.max)
    dataset_id = wait_for_run(run_id)
    raw = fetch_results(dataset_id)

    leads = [normalize(item) for item in raw]
    print(f"[+] Retrieved {len(leads)} leads")

    save_csv(leads, out_file)

    # Print preview
    print("\n--- Preview (first 5) ---")
    for lead in leads[:5]:
        print(f"  {lead['name']} | {lead['phone']} | {lead['address']} | {lead['website']}")


if __name__ == "__main__":
    main()
