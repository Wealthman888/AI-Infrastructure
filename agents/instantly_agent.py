"""Instantly campaign management agent powered by Claude.

Manages email outreach campaigns — listing campaigns, checking analytics,
adding leads, and updating campaign status — via a tool-use loop.

Usage:
    python -m agents.instantly_agent "Show me analytics for all active campaigns"
    python -m agents.instantly_agent "Add these leads to campaign <id>: john@acme.com, jane@corp.com"

Requires: ANTHROPIC_API_KEY, INSTANTLY_API_KEY
"""

import json
import os
import sys

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.instantly_tool import TOOL_DEFINITIONS, call_tool

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "You are an email outreach assistant managing Instantly campaigns. "
    "You can list campaigns, check analytics, manage leads, and update campaign status. "
    "Always confirm before making changes (pausing/resuming campaigns, adding leads). "
    "Present analytics clearly with open rates, reply rates, and bounce rates."
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
        print("Usage: python -m agents.instantly_agent <task>")
        sys.exit(1)
    print(run(" ".join(sys.argv[1:])))


if __name__ == "__main__":
    main()
