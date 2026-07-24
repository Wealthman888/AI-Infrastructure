"""Thin wrapper around the Instantly.ai v2 API (https://developer.instantly.ai).

Auth: reads INSTANTLY_API_KEY from the environment. Get a key with
`emails:all` and `leads:all` scopes (or `all:all`) from your Instantly
workspace settings -> API Keys. Never hardcode the key here or commit it;
set it as an environment variable in your deploy/session config.
"""

from __future__ import annotations

import os
from typing import Any

import requests

BASE_URL = "https://api.instantly.ai"


class InstantlyError(RuntimeError):
    pass


def _api_key() -> str:
    key = os.environ.get("INSTANTLY_API_KEY")
    if not key:
        raise InstantlyError("INSTANTLY_API_KEY is not set")
    return key


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }


def _request(method: str, path: str, **kwargs: Any) -> dict[str, Any]:
    resp = requests.request(method, f"{BASE_URL}{path}", headers=_headers(), timeout=30, **kwargs)
    if not resp.ok:
        raise InstantlyError(f"{method} {path} -> {resp.status_code}: {resp.text}")
    return resp.json()


def list_new_replies(
    *,
    campaign_id: str | None = None,
    min_timestamp_created: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """List unread inbound replies (email_type=received), newest thread state only.

    min_timestamp_created should be an ISO-8601 timestamp; pass the last time
    this was polled to avoid re-processing old replies.
    """
    params: dict[str, Any] = {
        "email_type": "received",
        "is_unread": "true",
        "latest_of_thread": "true",
        "limit": limit,
    }
    if campaign_id:
        params["campaign_id"] = campaign_id
    if min_timestamp_created:
        params["min_timestamp_created"] = min_timestamp_created
    data = _request("GET", "/api/v2/emails", params=params)
    return data.get("items", data if isinstance(data, list) else [])


def reply_to_email(
    *,
    reply_to_uuid: str,
    eaccount: str,
    subject: str,
    body_text: str | None = None,
    body_html: str | None = None,
) -> dict[str, Any]:
    """Send a real reply through Instantly. This actually sends — there is no draft mode.

    reply_to_uuid: id of the inbound email being answered (from list_new_replies).
    eaccount: the sending mailbox configured in the Instantly campaign.
    """
    if not body_text and not body_html:
        raise InstantlyError("reply_to_email requires body_text and/or body_html")
    payload = {
        "reply_to_uuid": reply_to_uuid,
        "eaccount": eaccount,
        "subject": subject,
        "body": {k: v for k, v in {"text": body_text, "html": body_html}.items() if v},
    }
    return _request("POST", "/api/v2/emails/reply", json=payload)


def flag_lead_for_review(
    *,
    lead_email: str,
    campaign_id: str | None = None,
    interest_value: int | None = 1,
) -> dict[str, Any]:
    """Mark a lead's interest status so a human knows to check Unibox manually.

    interest_value=1 is Instantly's default "Interested" bucket; adjust to match
    your workspace's configured interest values if you've customized them.
    """
    payload: dict[str, Any] = {"lead_email": lead_email, "interest_value": interest_value}
    if campaign_id:
        payload["campaign_id"] = campaign_id
    return _request("POST", "/api/v2/leads/update-interest-status", json=payload)
