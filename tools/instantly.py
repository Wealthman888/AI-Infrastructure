"""Wrapper around the Instantly v2 API for cold email campaigns and leads."""

import os

import requests

BASE_URL = "https://api.instantly.ai/api/v2"


class InstantlyClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ["INSTANTLY_API_KEY"]
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {self.api_key}"})

    def list_campaigns(self, limit: int = 10) -> list[dict]:
        resp = self.session.get(f"{BASE_URL}/campaigns", params={"limit": limit}, timeout=30)
        resp.raise_for_status()
        return resp.json()["items"]

    def list_accounts(self, limit: int = 10) -> list[dict]:
        resp = self.session.get(f"{BASE_URL}/accounts", params={"limit": limit}, timeout=30)
        resp.raise_for_status()
        return resp.json()["items"]

    def add_lead(
        self,
        campaign_id: str,
        email: str,
        first_name: str = "",
        last_name: str = "",
        company_name: str = "",
        personalization: str = "",
        custom_variables: dict | None = None,
    ) -> dict:
        """Add a lead to a campaign. Personalized copy goes in `personalization`
        and is referenced in the campaign's email templates as {{personalization}}."""
        payload = {
            "campaign": campaign_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "company_name": company_name,
            "personalization": personalization,
        }
        if custom_variables:
            payload["custom_variables"] = custom_variables
        resp = self.session.post(f"{BASE_URL}/leads", json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def list_leads(self, campaign_id: str, limit: int = 10) -> list[dict]:
        resp = self.session.post(
            f"{BASE_URL}/leads/list",
            json={"campaign": campaign_id, "limit": limit},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["items"]
