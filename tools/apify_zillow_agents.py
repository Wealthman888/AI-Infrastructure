"""Wrapper for the Apify "Zillow Property + Agent Data Scraper" actor
(afanasenko/zillow-property-agent-data-scraper).

Searches Zillow listings by ZIP code and returns the raw dataset items.
Each item is a property listing carrying agent/broker contact fields
alongside the property data — multiple listings commonly share the same
agent, so dedupe downstream before treating rows as a lead list (see
scripts/pull_zillow_leads.py).
"""

import os

import requests

ACTOR_ID = "afanasenko~zillow-property-agent-data-scraper"
API_BASE = "https://api.apify.com/v2"
RUN_TIMEOUT_SECS = 600


def run_zillow_agent_scraper(
    zip_codes,
    status_type="ForSale",
    max_properties_per_zip=0,
    api_token=None,
    **extra_filters,
):
    """Run the actor in ZIP-code mode and return the resulting dataset items.

    Args:
        zip_codes: list of US ZIP code strings to search.
        status_type: "ForSale", "ForRent", or "RecentlySold".
        max_properties_per_zip: cap per ZIP code (0 = actor default).
        api_token: Apify API token; defaults to the APIFY_API_TOKEN env var.
        **extra_filters: additional actor input fields passed through as-is
            (e.g. price_min, price_max, enrichPhotos, beds_min).

    Returns:
        List of dicts, one per property, including agentName, agentEmail,
        cellPhone, agentLicenseNumber, brokerName, brokerPhoneNumber,
        hasVideo, has3DModel, photos, pageViewCount, and daysOnZillow.
    """
    token = api_token or os.environ.get("APIFY_API_TOKEN")
    if not token:
        raise RuntimeError("APIFY_API_TOKEN is not set")

    run_input = {
        "mode": "zip",
        "zipCodes": zip_codes,
        "status_type": status_type,
        "maxPropertiesPerZip": max_properties_per_zip,
        "isForSaleByAgent": True,
        **extra_filters,
    }

    response = requests.post(
        f"{API_BASE}/acts/{ACTOR_ID}/run-sync-get-dataset-items",
        params={"token": token},
        json=run_input,
        timeout=RUN_TIMEOUT_SECS,
    )
    response.raise_for_status()
    return response.json()
