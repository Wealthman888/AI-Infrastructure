"""Unified web research agent with access to all scraping tools.

Combines Firecrawl, Crawl4AI, Scrapling, AutoScraper, MarkItDown, and
Browser Use into a single agent. Claude picks the right tool for the job:
- Firecrawl: clean markdown from any page, with site crawl and search
- Crawl4AI: free alternative, concurrent scraping, no API key
- Scrapling: fast CSS/XPath element extraction from static pages
- AutoScraper: pattern-based extraction trained on examples
- MarkItDown: convert documents (PDF, DOCX, XLSX, PPTX) to markdown
- Browser Use: AI-controlled browser for JS-heavy or interactive sites

Usage:
    python -m agents.research_agent "Extract all product prices from https://example.com/shop"
    python -m agents.research_agent "Download the PDF at <url> and summarize it"

Required env vars: ANTHROPIC_API_KEY
Optional: FIRECRAWL_API_KEY (enables Firecrawl tools)
"""

import importlib
import json
import os
import sys

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODEL = "claude-opus-4-7"

SYSTEM_PROMPT = """You are a web research agent with multiple scraping tools. Choose the best tool for each task:

- **firecrawl_***: Best for clean markdown extraction and full site crawls. Requires FIRECRAWL_API_KEY.
- **crawl4ai_***: Free alternative to Firecrawl. Good for concurrent scraping of multiple URLs.
- **scrapling_***: Best for extracting specific HTML elements by CSS selector (prices, tables, headings).
- **autoscraper_***: Best when you have example values and want to find similar data across a page.
- **convert_*_to_markdown**: Best for documents (PDF, Word, Excel, PowerPoint) — not web pages.
- **browser_task**: Use ONLY for JavaScript-heavy pages, login walls, or interactive tasks that static tools fail on. It's slower and costlier.

Always prefer static tools over browser_task when possible. Do not invent information."""


def _load_tools() -> tuple[list[dict], dict]:
    tool_modules = [
        ("tools.crawl4ai_tool", True),
        ("tools.markitdown_tool", True),
        ("tools.scrapling_tool", True),
        ("tools.autoscraper_tool", True),
        ("tools.browser_use_tool", True),
    ]
    if os.environ.get("FIRECRAWL_API_KEY"):
        tool_modules.insert(0, ("tools.firecrawl_tool", True))

    all_defs = []
    dispatch: dict[str, tuple] = {}

    for module_name, _ in tool_modules:
        try:
            mod = importlib.import_module(module_name)
            for defn in mod.TOOL_DEFINITIONS:
                all_defs.append(defn)
                dispatch[defn["name"]] = mod.call_tool
        except Exception as exc:
            print(f"[warn] Could not load {module_name}: {exc}", file=sys.stderr)

    return all_defs, dispatch


def run(task: str, max_turns: int = 15) -> str:
    tool_defs, dispatch = _load_tools()
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
            tools=tool_defs,
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
            handler = dispatch.get(block.name)
            try:
                if handler is None:
                    raise ValueError(f"No handler for tool: {block.name}")
                result = handler(block.name, block.input)
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
        print("Usage: python -m agents.research_agent <task description>")
        sys.exit(1)
    print(run(" ".join(sys.argv[1:])))


if __name__ == "__main__":
    main()
