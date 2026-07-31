"""
Scraper agent scaffolding.

Follows the tool-use loop pattern from /CLAUDE.md:
1. Send a user message + tool definitions to the Claude API
2. If the response contains tool_use blocks, execute the tool and return a tool_result
3. Continue the loop until the model returns a final text response

Fill in `fetch_url` with real extraction logic (selectors, pagination, etc.)
for the site(s) this agent targets.
"""

import os

import requests
from anthropic import Anthropic
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

MODEL = os.environ.get("SCRAPER_MODEL", "claude-haiku-4-5-20251001")

SYSTEM_PROMPT = """You are a web scraping agent. Use the fetch_url tool to \
retrieve pages and extract the structured data the user asks for. Only \
fetch URLs that are relevant to the request."""

TOOLS = [
    {
        "name": "fetch_url",
        "description": "Fetch a URL and return its visible text content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to fetch"},
            },
            "required": ["url"],
        },
    }
]


def fetch_url(url: str) -> str:
    """Stub tool implementation. Replace with real parsing for target sites."""
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    return soup.get_text(separator="\n", strip=True)[:5000]


def run_tool(name: str, tool_input: dict) -> str:
    if name == "fetch_url":
        return fetch_url(tool_input["url"])
    raise ValueError(f"Unknown tool: {name}")


def run(user_message: str) -> str:
    client = Anthropic()
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason != "tool_use":
            return "".join(
                block.text for block in response.content if block.type == "text"
            )

        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            result = run_tool(block.name, block.input)
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                }
            )
        messages.append({"role": "user", "content": tool_results})


if __name__ == "__main__":
    import sys

    prompt = sys.argv[1] if len(sys.argv) > 1 else "Scrape https://example.com"
    print(run(prompt))
