"""GoHighLevel CRM agent powered by Claude.

Manages contacts, opportunities, pipelines, appointments, and conversations
via a tool-use loop.

Usage:
    python -m agents.ghl_agent "Search for contacts at acme.com in location <id>"
    python -m agents.ghl_agent "Show all open opportunities in location <id>"
    python -m agents.ghl_agent "Book an appointment for contact <id> on 2026-07-10"

Requires: ANTHROPIC_API_KEY, GHL_API_KEY
"""

import json
import os
import sys

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.ghl_tool import TOOL_DEFINITIONS, call_tool

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "You are a GoHighLevel CRM assistant. You can search and manage contacts, "
    "view and update pipeline opportunities, book appointments, and send messages. "
    "Always ask for confirmation before creating, updating, or sending anything. "
    "When listing data, present it in a clean, readable format."
)


def run(task: str, max_turns: int = 10) -> str:
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": task}]

    for _ in range(max_turns):
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )

        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            return "".join(
                block.text for block in response.content if block.type == "text"
            )

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            try:
                result = call_tool(block.name, block.input)
                content = json.dumps(result, default=str)
            except Exception as exc:
                content = f"Error: {exc}"
            tool_results.append(
                {"type": "tool_result", "tool_use_id": block.id, "content": content}
            )

        messages.append({"role": "user", "content": tool_results})

    return "Reached max turns without a final answer."


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m agents.ghl_agent <task>")
        sys.exit(1)
    print(run(" ".join(sys.argv[1:])))


if __name__ == "__main__":
    main()
