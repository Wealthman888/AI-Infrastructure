"""Wrapper around the Firecrawl scrape API for prospect/site research."""

import os

import requests

BASE_URL = "https://api.firecrawl.dev/v1"


class FirecrawlClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ["FIRECRAWL_API_KEY"]
        self.session = requests.Session()
        self.session.headers.update(
            {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        )

    def scrape(self, url: str, formats: list[str] | None = None) -> dict:
        resp = self.session.post(
            f"{BASE_URL}/scrape",
            json={"url": url, "formats": formats or ["markdown"]},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["data"]
