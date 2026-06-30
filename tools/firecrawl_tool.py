"""Reusable wrapper around the Firecrawl API for use by agents.

Requires FIRECRAWL_API_KEY to be set in the environment and the
`firecrawl-py` package to be installed (see agents/README.md).
"""

import os

from firecrawl import FirecrawlApp

_app = None


def _client() -> FirecrawlApp:
    global _app
    if _app is None:
        api_key = os.environ.get("FIRECRAWL_API_KEY")
        if not api_key:
            raise RuntimeError("FIRECRAWL_API_KEY environment variable is not set")
        _app = FirecrawlApp(api_key=api_key)
    return _app


def scrape(url: str, formats: list[str] | None = None) -> dict:
    """Scrape a single URL and return clean content (markdown/html/etc)."""
    result = _client().scrape_url(url, formats=formats or ["markdown"])
    return result.model_dump() if hasattr(result, "model_dump") else result


def crawl(url: str, limit: int = 10, formats: list[str] | None = None) -> dict:
    """Crawl a site starting at url, following internal links up to limit pages."""
    result = _client().crawl_url(
        url,
        limit=limit,
        scrape_options={"formats": formats or ["markdown"]},
    )
    return result.model_dump() if hasattr(result, "model_dump") else result


def map_site(url: str) -> dict:
    """Discover URLs on a site without scraping their content."""
    result = _client().map_url(url)
    return result.model_dump() if hasattr(result, "model_dump") else result


def search(query: str, limit: int = 5) -> dict:
    """Run a web search and return matching pages."""
    result = _client().search(query, limit=limit)
    return result.model_dump() if hasattr(result, "model_dump") else result


TOOL_DEFINITIONS = [
    {
        "name": "scrape_url",
        "description": "Scrape a single web page and return its content as clean markdown.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to scrape."},
            },
            "required": ["url"],
        },
    },
    {
        "name": "crawl_site",
        "description": (
            "Crawl a website starting from a URL, following internal links, "
            "and return markdown content for each page found."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The starting URL to crawl."},
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of pages to crawl.",
                    "default": 10,
                },
            },
            "required": ["url"],
        },
    },
    {
        "name": "map_site",
        "description": "Discover all URLs on a website without scraping their content. Useful for getting a sitemap before deciding what to scrape.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The site URL to map."},
            },
            "required": ["url"],
        },
    },
    {
        "name": "web_search",
        "description": "Search the web for pages matching a query.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query."},
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return.",
                    "default": 5,
                },
            },
            "required": ["query"],
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    """Dispatch a tool_use call from the Claude API to the matching Firecrawl function."""
    if name == "scrape_url":
        return scrape(tool_input["url"])
    if name == "crawl_site":
        return crawl(tool_input["url"], limit=tool_input.get("limit", 10))
    if name == "map_site":
        return map_site(tool_input["url"])
    if name == "web_search":
        return search(tool_input["query"], limit=tool_input.get("limit", 5))
    raise ValueError(f"Unknown tool: {name}")
