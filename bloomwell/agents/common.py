"""Shared clients, models, and helpers for Bloomwell agents."""

from __future__ import annotations

import json
import os
from functools import lru_cache

import anthropic

# Product spec pins Sonnet 4.6 for the reasoning agents (weekly review, lab decoder,
# education curator). Swap to claude-opus-4-7 (CLAUDE.md's pick for complex multi-step
# reasoning) if a workload needs more depth.
MODEL_COACH = "claude-sonnet-4-6"
# High-frequency / cost-sensitive tasks (intake parsing, copy classification).
MODEL_FAST = "claude-haiku-4-5-20251001"

BLOOMWELL_TENANT_ID = "00000000-0000-0000-0000-000000000001"


@lru_cache(maxsize=1)
def get_anthropic() -> anthropic.Anthropic:
    return anthropic.Anthropic()  # ANTHROPIC_API_KEY from env


@lru_cache(maxsize=1)
def get_supabase():
    """Service-role client — server-side agents only. Bypasses RLS; never ship
    this key to any client surface."""
    from supabase import create_client
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def parse_json_response(response: anthropic.types.Message) -> dict | list:
    """Extract and parse the JSON payload from a text response, tolerating
    markdown code fences."""
    raw = next((b.text for b in response.content if b.type == "text"), "")
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)


def cached_system(prompt: str) -> list[dict]:
    """System block with prompt caching on the last static block (per CLAUDE.md:
    all agents with a large static system prompt must include this). 5-minute TTL —
    agents are built to stay within a cache window when running loops."""
    return [{
        "type": "text",
        "text": prompt,
        "cache_control": {"type": "ephemeral"},
    }]
