"""Web research agent powered by Claude + Crawl4AI.

API-key-free alternative to the Firecrawl agent — uses local Playwright
to scrape and crawl websites, returning LLM-optimized markdown.

Usage:
    python -m agents.crawl4ai_agent "Scrape https://example.com and summarize it"

Requires ANTHROPIC_API_KEY. No other API keys needed.
Run `crawl4ai-setup` once after installation to install Playwright browsers.
"""

import os
import sys
import json

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.crawl4ai_tool import TOOL_DEFINITIONS, call_tool

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "You are a web research agent. You can scrape individual pages or scrape "
    "multiple URLs concurrently using Crawl4AI. Use these tools to gather the "
    "information needed to answer the user's request, then give a concise final answer. "
    "Do not invent information you have not retrieved."
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
        print("Usage: python -m agents.crawl4ai_agent <task description>")
        sys.exit(1)
    print(run(" ".join(sys.argv[1:])))


if __name__ == "__main__":
    main()
