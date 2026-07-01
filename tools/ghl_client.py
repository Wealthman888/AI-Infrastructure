"""
Thin wrapper around the GoHighLevel (GHL) v2 API for moving contacts through
the 7-stage Axiom pipeline: New Lead -> Signal Confirmed -> DM Sent ->
Loom Sent -> Call Booked -> Proposal Sent -> Closed.

Reads GHL_API_KEY / GHL_LOCATION_ID / GHL_PIPELINE_ID / GHL_STAGE_* from .env.
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

GHL_BASE_URL = "https://services.leadconnectorhq.com"
GHL_API_VERSION = "2021-07-28"

STAGE_ENV_MAP = {
    "New Lead": "GHL_STAGE_NEW_LEAD",
    "Signal Confirmed": "GHL_STAGE_SIGNAL_CONFIRMED",
    "DM Sent": "GHL_STAGE_DM_SENT",
    "Loom Sent": "GHL_STAGE_LOOM_SENT",
    "Call Booked": "GHL_STAGE_CALL_BOOKED",
    "Proposal Sent": "GHL_STAGE_PROPOSAL_SENT",
    "Closed": "GHL_STAGE_CLOSED",
}


class GHLClient:
    def __init__(self, api_key: str | None = None, location_id: str | None = None,
                 pipeline_id: str | None = None):
        self.api_key = api_key or os.environ.get("GHL_API_KEY")
        self.location_id = location_id or os.environ.get("GHL_LOCATION_ID")
        self.pipeline_id = pipeline_id or os.environ.get("GHL_PIPELINE_ID")
        if not self.api_key or not self.location_id:
            raise RuntimeError(
                "GHL_API_KEY and GHL_LOCATION_ID must be set in .env (see .env.example)."
            )
        self._session = requests.Session()
        self._session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Version": GHL_API_VERSION,
            "Content-Type": "application/json",
        })

    def stage_id(self, stage_name: str) -> str:
        env_var = STAGE_ENV_MAP.get(stage_name)
        stage_id = env_var and os.environ.get(env_var)
        if not stage_id:
            raise RuntimeError(
                f"No GHL stage id configured for '{stage_name}'. Set {env_var} in .env."
            )
        return stage_id

    def find_or_create_contact(self, email: str, first_name: str = "",
                                company: str = "", phone: str = "",
                                source: str = "cold_email") -> dict:
        r = self._session.post(
            f"{GHL_BASE_URL}/contacts/upsert",
            json={
                "locationId": self.location_id,
                "email": email,
                "firstName": first_name,
                "companyName": company,
                "phone": phone or None,
                "source": source,
            },
            timeout=30,
        )
        r.raise_for_status()
        return r.json()["contact"]

    def move_to_stage(self, contact_id: str, stage_name: str,
                       opportunity_id: str | None = None,
                       monetary_value: float | None = None,
                       name: str | None = None) -> dict:
        """Create the opportunity (if opportunity_id is None) or move an
        existing one to the given pipeline stage."""
        stage_id = self.stage_id(stage_name)
        if opportunity_id:
            r = self._session.put(
                f"{GHL_BASE_URL}/opportunities/{opportunity_id}",
                json={"pipelineStageId": stage_id},
                timeout=30,
            )
        else:
            r = self._session.post(
                f"{GHL_BASE_URL}/opportunities/",
                json={
                    "pipelineId": self.pipeline_id,
                    "locationId": self.location_id,
                    "pipelineStageId": stage_id,
                    "contactId": contact_id,
                    "name": name or "Cold email lead",
                    "monetaryValue": monetary_value,
                    "status": "open",
                },
                timeout=30,
            )
        r.raise_for_status()
        return r.json()

    def add_note(self, contact_id: str, body: str) -> dict:
        r = self._session.post(
            f"{GHL_BASE_URL}/contacts/{contact_id}/notes",
            json={"body": body},
            timeout=30,
        )
        r.raise_for_status()
        return r.json()

    def sync_reply(self, email: str, first_name: str, company: str,
                    classification: str, reply_body: str,
                    monetary_value: float | None = None) -> dict:
        """Entry point called by scripts/webhook_server.py on every Instantly
        reply. Upserts the contact, files the reply text as a note, and moves
        the opportunity to the stage matching the reply classification."""
        contact = self.find_or_create_contact(email, first_name, company)
        stage = {
            "interested": "Signal Confirmed",
            "question": "Signal Confirmed",
            "not_now": "New Lead",
            "negative": "New Lead",
            "unsubscribe": "New Lead",
        }.get(classification, "New Lead")
        self.add_note(contact["id"], f"[{classification.upper()}] {reply_body[:1500]}")
        return self.move_to_stage(
            contact["id"], stage, name=f"{company or first_name} - cold email",
            monetary_value=monetary_value,
        )
