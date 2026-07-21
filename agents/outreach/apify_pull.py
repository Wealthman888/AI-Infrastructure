"""Pull a prospect list from an Apify actor and normalize it to the pipeline CSV schema.

Default actor is the Apollo.io scraper (code_crafter~apollo-io-scraper): build your
search in Apollo (e.g. founders, company size 11-50, US, industry Software), copy the
search URL, and pass it in the actor input. Works with any actor whose dataset items
contain name/title/company/email fields — the normalizer checks common key variants.

Usage:
    export APIFY_TOKEN=apify_api_...
    python apify_pull.py --input apollo_input.json --out prospects.csv
    # or a different actor:
    python apify_pull.py --actor some~actor --input input.json --out prospects.csv

Example apollo_input.json:
    {
      "url": "https://app.apollo.io/#/people?personTitles[]=founder&...",
      "totalRecords": 300,
      "getWorkEmails": true
    }
"""

import argparse
import csv
import json
import os
import sys
import time

import requests

APIFY_BASE = "https://api.apify.com/v2"

# Ordered candidate keys for each output column — first match wins.
FIELD_MAP = {
    "first_name": ["first_name", "firstName", "firstname"],
    "last_name": ["last_name", "lastName", "lastname"],
    "title": ["title", "jobTitle", "job_title", "headline", "position"],
    "company": ["organization_name", "companyName", "company_name", "company", "organization"],
    "website": ["website_url", "organization_website_url", "companyWebsite", "website", "domain"],
    "email": ["email", "workEmail", "work_email", "emailAddress"],
    "linkedin_url": ["linkedin_url", "linkedinUrl", "linkedin", "profileUrl"],
    "location": ["city", "location", "prospect_location"],
    "signal": ["signal", "keywords", "seo_description", "shortDescription"],
}


def run_actor(actor: str, actor_input: dict, token: str, timeout_min: int = 30) -> list:
    resp = requests.post(
        f"{APIFY_BASE}/acts/{actor}/runs",
        params={"token": token},
        json=actor_input,
        timeout=60,
    )
    resp.raise_for_status()
    run = resp.json()["data"]
    run_id = run["id"]
    print(f"Actor run {run_id} started; waiting...")

    deadline = time.time() + timeout_min * 60
    while time.time() < deadline:
        run = requests.get(
            f"{APIFY_BASE}/actor-runs/{run_id}", params={"token": token}, timeout=60
        ).json()["data"]
        if run["status"] in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            break
        time.sleep(15)
    if run["status"] != "SUCCEEDED":
        sys.exit(f"Actor run ended with status {run['status']}")

    items, offset = [], 0
    while True:
        page = requests.get(
            f"{APIFY_BASE}/datasets/{run['defaultDatasetId']}/items",
            params={"token": token, "format": "json", "offset": offset, "limit": 1000},
            timeout=120,
        ).json()
        items.extend(page)
        if len(page) < 1000:
            return items
        offset += 1000


def normalize(item: dict) -> dict:
    # Flatten one level of nesting (e.g. Apollo's "organization": {...}).
    flat = dict(item)
    for value in item.values():
        if isinstance(value, dict):
            for k, v in value.items():
                flat.setdefault(k, v)

    row = {}
    for col, candidates in FIELD_MAP.items():
        row[col] = next(
            (str(flat[k]).strip() for k in candidates if flat.get(k)), ""
        )
    if not row["first_name"] and flat.get("name"):
        parts = str(flat["name"]).split(None, 1)
        row["first_name"] = parts[0]
        row["last_name"] = parts[1] if len(parts) > 1 else ""
    return row


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--actor", default="code_crafter~apollo-io-scraper")
    parser.add_argument("--input", required=True, help="JSON file with actor input")
    parser.add_argument("--out", default="prospects.csv")
    args = parser.parse_args()

    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("Set APIFY_TOKEN")
    with open(args.input, encoding="utf-8") as f:
        actor_input = json.load(f)

    items = run_actor(args.actor, actor_input, token)
    print(f"Fetched {len(items)} items from Apify")

    rows, seen = [], set()
    for item in items:
        row = normalize(item)
        email = row["email"].lower()
        if not email or "@" not in email or email in seen:
            continue
        seen.add(email)
        rows.append(row)

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(FIELD_MAP.keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} unique prospects with emails -> {args.out}")
    print("Next: verify emails (MillionVerifier/NeverBounce), then run generate_emails.py")


if __name__ == "__main__":
    main()
