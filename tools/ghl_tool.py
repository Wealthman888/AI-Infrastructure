"""Reusable wrapper around the GoHighLevel v2 API for use by agents.

Covers contacts, opportunities, pipelines, calendars, appointments,
conversations, and messages.
Requires GHL_API_KEY in the environment (Private Integration Token).
"""

import os
import httpx

BASE_URL = "https://services.leadconnectorhq.com"
API_VERSION = "2021-07-28"


def _headers() -> dict:
    key = os.environ.get("GHL_API_KEY")
    if not key:
        raise RuntimeError("GHL_API_KEY environment variable is not set")
    return {
        "Authorization": f"Bearer {key}",
        "Version": API_VERSION,
        "Content-Type": "application/json",
    }


def _get(path: str, params: dict | None = None) -> dict:
    r = httpx.get(f"{BASE_URL}{path}", headers=_headers(), params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def _post(path: str, body: dict) -> dict:
    r = httpx.post(f"{BASE_URL}{path}", headers=_headers(), json=body, timeout=30)
    r.raise_for_status()
    return r.json()


def _put(path: str, body: dict) -> dict:
    r = httpx.put(f"{BASE_URL}{path}", headers=_headers(), json=body, timeout=30)
    r.raise_for_status()
    return r.json()


def _delete(path: str) -> dict:
    r = httpx.delete(f"{BASE_URL}{path}", headers=_headers(), timeout=30)
    r.raise_for_status()
    return r.json()


# --- Contacts ---

def search_contacts(location_id: str, query: str | None = None, limit: int = 20) -> dict:
    params = {"locationId": location_id, "limit": limit}
    if query:
        params["query"] = query
    return _get("/contacts/", params)


def get_contact(contact_id: str) -> dict:
    return _get(f"/contacts/{contact_id}")


def create_contact(location_id: str, data: dict) -> dict:
    """data: firstName, lastName, email, phone, tags, etc."""
    return _post("/contacts/", {"locationId": location_id, **data})


def update_contact(contact_id: str, data: dict) -> dict:
    return _put(f"/contacts/{contact_id}", data)


def add_contact_tags(contact_id: str, tags: list[str]) -> dict:
    return _post(f"/contacts/{contact_id}/tags", {"tags": tags})


# --- Opportunities / Pipeline ---

def list_pipelines(location_id: str) -> dict:
    return _get("/opportunities/pipelines", {"locationId": location_id})


def list_opportunities(location_id: str, pipeline_id: str | None = None, limit: int = 20) -> dict:
    params: dict = {"location_id": location_id, "limit": limit}
    if pipeline_id:
        params["pipeline_id"] = pipeline_id
    return _get("/opportunities/search", params)


def create_opportunity(location_id: str, data: dict) -> dict:
    """data: pipelineId, pipelineStageId, name, contactId, monetaryValue, etc."""
    return _post("/opportunities/", {"locationId": location_id, **data})


def update_opportunity(opportunity_id: str, data: dict) -> dict:
    return _put(f"/opportunities/{opportunity_id}", data)


def update_opportunity_status(opportunity_id: str, status: str) -> dict:
    """status: open, won, lost, abandoned"""
    return _put(f"/opportunities/{opportunity_id}/status", {"status": status})


# --- Calendars & Appointments ---

def list_calendars(location_id: str) -> dict:
    return _get("/calendars/", {"locationId": location_id})


def get_free_slots(calendar_id: str, start_date: str, end_date: str, timezone: str = "UTC") -> dict:
    """start_date / end_date: YYYY-MM-DD"""
    return _get(
        f"/calendars/{calendar_id}/free-slots",
        {"startDate": start_date, "endDate": end_date, "timezone": timezone},
    )


def create_appointment(data: dict) -> dict:
    """data: calendarId, locationId, contactId, startTime, endTime, title, etc."""
    return _post("/calendars/events/appointments", data)


# --- Conversations & Messages ---

def list_conversations(location_id: str, contact_id: str | None = None, limit: int = 20) -> dict:
    params: dict = {"locationId": location_id, "limit": limit}
    if contact_id:
        params["contactId"] = contact_id
    return _get("/conversations/search", params)


def get_messages(conversation_id: str) -> dict:
    return _get(f"/conversations/{conversation_id}/messages")


def send_message(conversation_id: str, message_type: str, message: str) -> dict:
    """message_type: SMS, Email, WhatsApp"""
    return _post(
        f"/conversations/{conversation_id}/messages",
        {"type": message_type, "message": message},
    )


TOOL_DEFINITIONS = [
    {
        "name": "ghl_search_contacts",
        "description": "Search or list contacts in a GHL location.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location_id": {"type": "string"},
                "query": {"type": "string", "description": "Name, email, or phone to search."},
                "limit": {"type": "integer", "default": 20},
            },
            "required": ["location_id"],
        },
    },
    {
        "name": "ghl_get_contact",
        "description": "Get full details of a GHL contact by ID.",
        "input_schema": {
            "type": "object",
            "properties": {"contact_id": {"type": "string"}},
            "required": ["contact_id"],
        },
    },
    {
        "name": "ghl_create_contact",
        "description": "Create a new contact in GHL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location_id": {"type": "string"},
                "data": {
                    "type": "object",
                    "description": "Contact fields: firstName, lastName, email, phone, tags, source, etc.",
                },
            },
            "required": ["location_id", "data"],
        },
    },
    {
        "name": "ghl_update_contact",
        "description": "Update an existing GHL contact.",
        "input_schema": {
            "type": "object",
            "properties": {
                "contact_id": {"type": "string"},
                "data": {"type": "object", "description": "Fields to update."},
            },
            "required": ["contact_id", "data"],
        },
    },
    {
        "name": "ghl_add_tags",
        "description": "Add tags to a GHL contact.",
        "input_schema": {
            "type": "object",
            "properties": {
                "contact_id": {"type": "string"},
                "tags": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["contact_id", "tags"],
        },
    },
    {
        "name": "ghl_list_pipelines",
        "description": "List all pipelines and their stages in a GHL location.",
        "input_schema": {
            "type": "object",
            "properties": {"location_id": {"type": "string"}},
            "required": ["location_id"],
        },
    },
    {
        "name": "ghl_list_opportunities",
        "description": "List pipeline opportunities, optionally filtered by pipeline.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location_id": {"type": "string"},
                "pipeline_id": {"type": "string"},
                "limit": {"type": "integer", "default": 20},
            },
            "required": ["location_id"],
        },
    },
    {
        "name": "ghl_create_opportunity",
        "description": "Create a new opportunity in a GHL pipeline.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location_id": {"type": "string"},
                "data": {
                    "type": "object",
                    "description": "Fields: pipelineId, pipelineStageId, name, contactId, monetaryValue, status.",
                },
            },
            "required": ["location_id", "data"],
        },
    },
    {
        "name": "ghl_update_opportunity_status",
        "description": "Move an opportunity to open, won, lost, or abandoned.",
        "input_schema": {
            "type": "object",
            "properties": {
                "opportunity_id": {"type": "string"},
                "status": {"type": "string", "enum": ["open", "won", "lost", "abandoned"]},
            },
            "required": ["opportunity_id", "status"],
        },
    },
    {
        "name": "ghl_list_calendars",
        "description": "List all calendars in a GHL location.",
        "input_schema": {
            "type": "object",
            "properties": {"location_id": {"type": "string"}},
            "required": ["location_id"],
        },
    },
    {
        "name": "ghl_get_free_slots",
        "description": "Get available booking slots for a calendar.",
        "input_schema": {
            "type": "object",
            "properties": {
                "calendar_id": {"type": "string"},
                "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                "end_date": {"type": "string", "description": "YYYY-MM-DD"},
                "timezone": {"type": "string", "default": "UTC"},
            },
            "required": ["calendar_id", "start_date", "end_date"],
        },
    },
    {
        "name": "ghl_create_appointment",
        "description": "Book an appointment on a GHL calendar.",
        "input_schema": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "object",
                    "description": "Fields: calendarId, locationId, contactId, startTime (ISO8601), endTime, title.",
                },
            },
            "required": ["data"],
        },
    },
    {
        "name": "ghl_list_conversations",
        "description": "List conversations in a GHL location, optionally filtered by contact.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location_id": {"type": "string"},
                "contact_id": {"type": "string"},
                "limit": {"type": "integer", "default": 20},
            },
            "required": ["location_id"],
        },
    },
    {
        "name": "ghl_send_message",
        "description": "Send an SMS, Email, or WhatsApp message via a GHL conversation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "conversation_id": {"type": "string"},
                "message_type": {"type": "string", "enum": ["SMS", "Email", "WhatsApp"]},
                "message": {"type": "string"},
            },
            "required": ["conversation_id", "message_type", "message"],
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "ghl_search_contacts":
        return search_contacts(tool_input["location_id"], tool_input.get("query"), tool_input.get("limit", 20))
    if name == "ghl_get_contact":
        return get_contact(tool_input["contact_id"])
    if name == "ghl_create_contact":
        return create_contact(tool_input["location_id"], tool_input["data"])
    if name == "ghl_update_contact":
        return update_contact(tool_input["contact_id"], tool_input["data"])
    if name == "ghl_add_tags":
        return add_contact_tags(tool_input["contact_id"], tool_input["tags"])
    if name == "ghl_list_pipelines":
        return list_pipelines(tool_input["location_id"])
    if name == "ghl_list_opportunities":
        return list_opportunities(tool_input["location_id"], tool_input.get("pipeline_id"), tool_input.get("limit", 20))
    if name == "ghl_create_opportunity":
        return create_opportunity(tool_input["location_id"], tool_input["data"])
    if name == "ghl_update_opportunity_status":
        return update_opportunity_status(tool_input["opportunity_id"], tool_input["status"])
    if name == "ghl_list_calendars":
        return list_calendars(tool_input["location_id"])
    if name == "ghl_get_free_slots":
        return get_free_slots(tool_input["calendar_id"], tool_input["start_date"], tool_input["end_date"], tool_input.get("timezone", "UTC"))
    if name == "ghl_create_appointment":
        return create_appointment(tool_input["data"])
    if name == "ghl_list_conversations":
        return list_conversations(tool_input["location_id"], tool_input.get("contact_id"), tool_input.get("limit", 20))
    if name == "ghl_send_message":
        return send_message(tool_input["conversation_id"], tool_input["message_type"], tool_input["message"])
    raise ValueError(f"Unknown tool: {name}")
