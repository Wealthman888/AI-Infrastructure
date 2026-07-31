"""
Scraper agent, backed by ScrapeGraphAI (https://github.com/ScrapeGraphAI/Scrapegraph-ai).

Follows the tool-use loop pattern from /CLAUDE.md:
1. Send a user message + tool definitions to the Claude API
2. If the response contains tool_use blocks, execute the tool and return a tool_result
3. Continue the loop until the model returns a final text response

The orchestrator (this loop) decides *which* URLs to scrape and *what* to
extract from each; the `smart_scrape` tool delegates the actual fetch +
LLM-driven extraction to ScrapeGraphAI's SmartScraperGraph.
"""

import os

from anthropic import Anthropic
from dotenv import load_dotenv
from scrapegraphai.graphs import SmartScraperGraph

load_dotenv()

MODEL = os.environ.get("SCRAPER_MODEL", "claude-haiku-4-5-20251001")

SYSTEM_PROMPT = """You are a web scraping agent. Use the smart_scrape tool to \
retrieve pages and extract the structured data the user asks for. Only \
scrape URLs that are relevant to the request, and write a specific \
extraction prompt per URL describing exactly what to pull out."""

TOOLS = [
    {
        "name": "smart_scrape",
        "description": (
            "Fetch a URL and use an LLM to extract the data described in "
            "the extraction prompt, returning it as structured data."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to scrape"},
                "extraction_prompt": {
                    "type": "string",
                    "description": "What to extract from the page, e.g. 'list all product names and prices'",
                },
            },
            "required": ["url", "extraction_prompt"],
        },
    }
]


def smart_scrape(url: str, extraction_prompt: str) -> dict:
    graph_config = {
        "llm": {
            "api_key": os.environ["ANTHROPIC_API_KEY"],
            "model": f"anthropic/{MODEL}",
        },
        "verbose": False,
        "headless": True,
    }
    scraper = SmartScraperGraph(
        prompt=extraction_prompt,
        source=url,
        config=graph_config,
    )
    return scraper.run()


def run_tool(name: str, tool_input: dict) -> dict:
    if name == "smart_scrape":
        return smart_scrape(tool_input["url"], tool_input["extraction_prompt"])
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
                    "content": str(result),
                }
            )
        messages.append({"role": "user", "content": tool_results})


if __name__ == "__main__":
    import sys

    prompt = sys.argv[1] if len(sys.argv) > 1 else "Scrape https://example.com"
    print(run(prompt))
