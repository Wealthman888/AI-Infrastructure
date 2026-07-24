"""Instantly.ai auto-responder, powered by the Super Closer skill.

Polls Instantly for new unread replies to cold outreach campaigns, has Claude
diagnose each one using the six-book Super Closer tactics
(.claude/skills/super-closer/), and either sends the drafted reply or holds it
for human review — gated by risk tier, not just by the AUTO_SEND flag.

Safety model (enforced in code, not just prompted):
  - Claude classifies every reply as risk_tier "low" or "high" per the same
    objection routing table the Super Closer skill uses (price, competitor,
    "cheaper", ghosting/re-engagement, "check with partner/boss" -> high).
  - "high" risk NEVER auto-sends, regardless of SUPER_CLOSER_AUTO_SEND. It is
    always flagged in Instantly (update-interest-status) for a human to answer
    in Unibox.
  - "low" risk only auto-sends if SUPER_CLOSER_AUTO_SEND=true. Otherwise it is
    flagged for review too, so with the flag off this whole script is
    read-only with respect to sending mail.

Required env vars:
  ANTHROPIC_API_KEY      - your Anthropic API key
  INSTANTLY_API_KEY      - Instantly workspace API key (emails:all, leads:all)
  SUPER_CLOSER_EACCOUNT  - the Instantly-connected mailbox replies send from
Optional:
  SUPER_CLOSER_AUTO_SEND - "true" to allow low-risk auto-send (default "false")
  SUPER_CLOSER_CAMPAIGN_ID - restrict to one campaign (default: all campaigns)

Run manually: python agents/super_closer_responder.py
Schedule it: see scripts/instantly_responder_cron.md
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

import anthropic

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from tools import instantly  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILL_DIR = REPO_ROOT / ".claude" / "skills" / "super-closer"
MODEL = "claude-opus-4-7"
MAX_TURNS = 25


def load_skill_content() -> str:
    parts = [(SKILL_DIR / "SKILL.md").read_text()]
    for ref in sorted((SKILL_DIR / "references").glob("*.md")):
        parts.append(f"\n\n---\n# {ref.name}\n\n{ref.read_text()}")
    return "\n".join(parts)


TOOLS = [
    {
        "name": "list_new_replies",
        "description": (
            "List unread inbound replies from Instantly cold-email campaigns "
            "that have not been processed yet. Call this once at the start of a run."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {
                    "type": "string",
                    "description": "Optional: restrict to one campaign UUID.",
                }
            },
        },
    },
    {
        "name": "submit_reply_decision",
        "description": (
            "Submit the drafted Super Closer reply for one lead's message, with a risk "
            "classification. low risk = no price/guarantee/competitor/scarcity claim, "
            "pure info/scheduling/acknowledgment. high risk = anything matching the "
            "objection routing table (price, competitor, 'cheaper', ghosting "
            "re-engagement, 'check with partner/boss', 'not the right time'). "
            "When in doubt, classify high. This call either sends the reply (only if "
            "low risk and auto-send is enabled) or flags the lead for human review in "
            "Instantly Unibox — it never sends a high-risk reply automatically."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reply_to_uuid": {"type": "string", "description": "id of the inbound email being answered"},
                "lead_email": {"type": "string"},
                "campaign_id": {"type": "string"},
                "eaccount": {"type": "string", "description": "sending mailbox for this campaign"},
                "subject": {"type": "string"},
                "body_text": {"type": "string", "description": "the drafted reply, in the lead's voice"},
                "risk_tier": {"type": "string", "enum": ["low", "high"]},
                "reasoning": {"type": "string", "description": "one line: surface objection, real objection, tactics used"},
            },
            "required": ["reply_to_uuid", "lead_email", "eaccount", "subject", "body_text", "risk_tier", "reasoning"],
        },
    },
]


def execute_tool(name: str, tool_input: dict[str, Any], auto_send: bool) -> dict[str, Any]:
    if name == "list_new_replies":
        replies = instantly.list_new_replies(campaign_id=tool_input.get("campaign_id"))
        return {"replies": replies}

    if name == "submit_reply_decision":
        risk = tool_input["risk_tier"]
        will_send = risk == "low" and auto_send
        if will_send:
            result = instantly.reply_to_email(
                reply_to_uuid=tool_input["reply_to_uuid"],
                eaccount=tool_input["eaccount"],
                subject=tool_input["subject"],
                body_text=tool_input["body_text"],
            )
            return {"action": "sent", "instantly_response": result}
        result = instantly.flag_lead_for_review(
            lead_email=tool_input["lead_email"],
            campaign_id=tool_input.get("campaign_id"),
        )
        why_held = "high risk" if risk == "high" else "auto-send disabled"
        return {"action": "held_for_review", "reason": why_held, "instantly_response": result}

    raise ValueError(f"unknown tool: {name}")


def run() -> None:
    auto_send = os.environ.get("SUPER_CLOSER_AUTO_SEND", "false").lower() == "true"
    campaign_id = os.environ.get("SUPER_CLOSER_CAMPAIGN_ID")
    eaccount = os.environ.get("SUPER_CLOSER_EACCOUNT")
    if not eaccount:
        raise SystemExit("SUPER_CLOSER_EACCOUNT is required")

    client = anthropic.Anthropic()
    system = [
        {
            "type": "text",
            "text": load_skill_content(),
            "cache_control": {"type": "ephemeral"},
        }
    ]

    task = (
        "Check Instantly for new unread cold-email replies and respond to each one "
        "using the Super Closer core loop. Use list_new_replies first (pass "
        f"campaign_id={campaign_id!r} if set), then for every reply, diagnose it, "
        f"draft the reply in the lead's voice, and call submit_reply_decision with "
        f"eaccount={eaccount!r}. If there are no new replies, say so and stop."
    )
    messages: list[dict[str, Any]] = [{"role": "user", "content": task}]

    for _ in range(MAX_TURNS):
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=system,
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            for block in response.content:
                if block.type == "text":
                    print(block.text)
            return

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            try:
                output = execute_tool(block.name, block.input, auto_send)
                content = json.dumps(output)
                is_error = False
            except Exception as exc:  # noqa: BLE001
                content = str(exc)
                is_error = True
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": content,
                    "is_error": is_error,
                }
            )
        messages.append({"role": "user", "content": tool_results})

    print("Stopped after MAX_TURNS without a final response — check for a loop.")


if __name__ == "__main__":
    run()
