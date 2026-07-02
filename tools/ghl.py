"""Wrapper around the GoHighLevel (GHL) v2 API for CRM contacts and opportunities.

GHL Private Integration Tokens are scoped to a single sub-account (location),
so every call requires GHL_LOCATION_ID to be set alongside GHL_API_KEY.
"""

import os

import requests

BASE_URL = "https://services.leadconnectorhq.com"
API_VERSION = "2021-07-28"


class GHLClient:
    def __init__(self, api_key: str | None = None, location_id: str | None = None):
        self.api_key = api_key or os.environ["GHL_API_KEY"]
        self.location_id = location_id or os.environ["GHL_LOCATION_ID"]
        self.session = requests.Session()
        self.session.headers.update(
            {"Authorization": f"Bearer {self.api_key}", "Version": API_VERSION}
        )

    def list_contacts(self, limit: int = 20) -> list[dict]:
        resp = self.session.get(
            f"{BASE_URL}/contacts/",
            params={"locationId": self.location_id, "limit": limit},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["contacts"]

    def create_contact(
        self, email: str, first_name: str = "", last_name: str = "", phone: str = "", tags: list[str] | None = None
    ) -> dict:
        payload = {
            "locationId": self.location_id,
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
        }
        if phone:
            payload["phone"] = phone
        if tags:
            payload["tags"] = tags
        resp = self.session.post(f"{BASE_URL}/contacts/", json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()["contact"]

    def create_opportunity(self, pipeline_id: str, stage_id: str, name: str, contact_id: str) -> dict:
        payload = {
            "pipelineId": pipeline_id,
            "locationId": self.location_id,
            "pipelineStageId": stage_id,
            "name": name,
            "contactId": contact_id,
        }
        resp = self.session.post(f"{BASE_URL}/opportunities/", json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()["opportunity"]
