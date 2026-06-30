"""Web scraping agent powered by Claude + Firecrawl.

Given a natural-language task (e.g. "summarize the pricing page at
example.com" or "find the docs site for X and list its sections"), the
agent decides which Firecrawl tool to call (scrape/crawl/map/search),
runs the tool-use loop until it has enough information, and returns a
final text answer.

Usage:
    python -m agents.web_scraper_agent "Scrape https://example.com and summarize it"

Requires ANTHROPIC_API_KEY and FIRECRAWL_API_KEY in the environment.
"""

import json
import os
import sys

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.firecrawl_tool import TOOL_DEFINITIONS, call_tool

MODEL = "claude-opus-4-7"

SYSTEM_PROMPT = (
    "You are a web research agent. You have tools to scrape, crawl, map, "
    "and search the web via Firecrawl. Use them to gather the information "
    "needed to complete the user's task, then give a concise final answer. "
    "Prefer map_site before crawl_site on large sites to avoid wasting pages "
    "on irrelevant links. Do not invent information you have not retrieved."
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
            except Exception as exc:  # noqa: BLE001 - surface tool errors to the model
                content = f"Error: {exc}"
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": content,
                }
            )

        messages.append({"role": "user", "content": tool_results})

    return "Reached max turns without a final answer."


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m agents.web_scraper_agent <task description>")
        sys.exit(1)
    task = " ".join(sys.argv[1:])
    print(run(task))


if __name__ == "__main__":
    main()
