"""Reusable wrapper around the Instantly v2 API for use by agents.

Covers campaigns, leads, accounts, and analytics.
Requires INSTANTLY_API_KEY in the environment.
"""

import os
import httpx

BASE_URL = "https://api.instantly.ai/api/v2"


def _headers() -> dict:
    key = os.environ.get("INSTANTLY_API_KEY")
    if not key:
        raise RuntimeError("INSTANTLY_API_KEY environment variable is not set")
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def _get(path: str, params: dict | None = None) -> dict:
    r = httpx.get(f"{BASE_URL}{path}", headers=_headers(), params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def _post(path: str, body: dict) -> dict:
    r = httpx.post(f"{BASE_URL}{path}", headers=_headers(), json=body, timeout=30)
    r.raise_for_status()
    return r.json()


def _patch(path: str, body: dict) -> dict:
    r = httpx.patch(f"{BASE_URL}{path}", headers=_headers(), json=body, timeout=30)
    r.raise_for_status()
    return r.json()


def _delete(path: str) -> dict:
    r = httpx.delete(f"{BASE_URL}{path}", headers=_headers(), timeout=30)
    r.raise_for_status()
    return r.json()


# --- Campaigns ---

def list_campaigns(limit: int = 20, search: str | None = None) -> dict:
    params = {"limit": limit}
    if search:
        params["search"] = search
    return _get("/campaign", params)


def get_campaign(campaign_id: str) -> dict:
    return _get(f"/campaign/{campaign_id}")


def get_campaign_analytics(campaign_id: str) -> dict:
    return _get(f"/campaign/{campaign_id}/analytics/overview")


def update_campaign_status(campaign_id: str, status: int) -> dict:
    """status: 1=active, 2=paused, 3=completed"""
    return _patch(f"/campaign/{campaign_id}", {"status": status})


# --- Leads ---

def list_leads(campaign_id: str | None = None, limit: int = 20) -> dict:
    params: dict = {"limit": limit}
    if campaign_id:
        params["campaign_id"] = campaign_id
    return _get("/lead", params)


def add_leads(campaign_id: str, leads: list[dict]) -> dict:
    """leads: list of dicts with at minimum {"email": "..."}"""
    return _post("/lead", {"campaign_id": campaign_id, "leads": leads})


def get_lead(lead_id: str) -> dict:
    return _get(f"/lead/{lead_id}")


def update_lead(lead_id: str, updates: dict) -> dict:
    return _patch(f"/lead/{lead_id}", updates)


# --- Accounts (sending email accounts) ---

def list_accounts(limit: int = 20) -> dict:
    return _get("/account", {"limit": limit})


# --- Emails ---

def list_emails(campaign_id: str | None = None, limit: int = 20) -> dict:
    params: dict = {"limit": limit}
    if campaign_id:
        params["campaign_id"] = campaign_id
    return _get("/email", params)


TOOL_DEFINITIONS = [
    {
        "name": "instantly_list_campaigns",
        "description": "List all Instantly email campaigns. Optionally filter by name.",
        "input_schema": {
            "type": "object",
            "properties": {
                "search": {"type": "string", "description": "Optional name filter."},
                "limit": {"type": "integer", "default": 20},
            },
        },
    },
    {
        "name": "instantly_get_campaign",
        "description": "Get details of a specific Instantly campaign by ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "string"},
            },
            "required": ["campaign_id"],
        },
    },
    {
        "name": "instantly_campaign_analytics",
        "description": "Get open, click, reply, and bounce analytics for a campaign.",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "string"},
            },
            "required": ["campaign_id"],
        },
    },
    {
        "name": "instantly_update_campaign_status",
        "description": "Pause (2), activate (1), or complete (3) a campaign.",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "string"},
                "status": {"type": "integer", "description": "1=active, 2=paused, 3=completed"},
            },
            "required": ["campaign_id", "status"],
        },
    },
    {
        "name": "instantly_list_leads",
        "description": "List leads, optionally filtered by campaign.",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "string", "description": "Optional campaign ID to filter by."},
                "limit": {"type": "integer", "default": 20},
            },
        },
    },
    {
        "name": "instantly_add_leads",
        "description": "Add one or more leads to an Instantly campaign.",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "string"},
                "leads": {
                    "type": "array",
                    "description": "List of lead objects. Each must have 'email'; optional: first_name, last_name, company, custom variables.",
                    "items": {"type": "object"},
                },
            },
            "required": ["campaign_id", "leads"],
        },
    },
    {
        "name": "instantly_update_lead",
        "description": "Update a lead's fields (e.g. status, custom variables).",
        "input_schema": {
            "type": "object",
            "properties": {
                "lead_id": {"type": "string"},
                "updates": {"type": "object", "description": "Fields to update."},
            },
            "required": ["lead_id", "updates"],
        },
    },
    {
        "name": "instantly_list_accounts",
        "description": "List all connected sending email accounts in Instantly.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "default": 20},
            },
        },
    },
    {
        "name": "instantly_list_emails",
        "description": "List sent emails, optionally filtered by campaign.",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "string"},
                "limit": {"type": "integer", "default": 20},
            },
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "instantly_list_campaigns":
        return list_campaigns(tool_input.get("limit", 20), tool_input.get("search"))
    if name == "instantly_get_campaign":
        return get_campaign(tool_input["campaign_id"])
    if name == "instantly_campaign_analytics":
        return get_campaign_analytics(tool_input["campaign_id"])
    if name == "instantly_update_campaign_status":
        return update_campaign_status(tool_input["campaign_id"], tool_input["status"])
    if name == "instantly_list_leads":
        return list_leads(tool_input.get("campaign_id"), tool_input.get("limit", 20))
    if name == "instantly_add_leads":
        return add_leads(tool_input["campaign_id"], tool_input["leads"])
    if name == "instantly_update_lead":
        return update_lead(tool_input["lead_id"], tool_input["updates"])
    if name == "instantly_list_accounts":
        return list_accounts(tool_input.get("limit", 20))
    if name == "instantly_list_emails":
        return list_emails(tool_input.get("campaign_id"), tool_input.get("limit", 20))
    raise ValueError(f"Unknown tool: {name}")
