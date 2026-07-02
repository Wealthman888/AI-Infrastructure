"""Reusable wrapper around Scrapling for use by agents.

Scrapling provides fast, resilient HTML parsing with CSS/XPath selectors
and auto-matching that survives page layout changes.

Requires: pip install scrapling && python -m scrapling install
"""

import httpx
from scrapling.parser import Adaptor


def fetch_and_parse(url: str, css_selector: str | None = None) -> dict:
    """Fetch a URL and parse its HTML. Optionally extract elements by CSS selector."""
    response = httpx.get(url, follow_redirects=True, timeout=30)
    response.raise_for_status()
    page = Adaptor(response.text, url=url)

    if css_selector:
        elements = page.css(css_selector)
        return {
            "url": url,
            "selector": css_selector,
            "matches": [el.text for el in elements],
            "count": len(elements),
        }

    return {
        "url": url,
        "title": page.css("title").first.text if page.css("title") else None,
        "text": page.get_all_text(separator="\n"),
    }


def extract_links(url: str) -> dict:
    """Fetch a URL and extract all hyperlinks."""
    response = httpx.get(url, follow_redirects=True, timeout=30)
    response.raise_for_status()
    page = Adaptor(response.text, url=url)
    links = [a.attrib.get("href", "") for a in page.css("a")]
    links = [l for l in links if l and not l.startswith("#")]
    return {"url": url, "links": links, "count": len(links)}


TOOL_DEFINITIONS = [
    {
        "name": "scrapling_fetch",
        "description": (
            "Fetch a web page and return its full text content. "
            "Optionally provide a CSS selector to extract only matching elements."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to fetch and parse."},
                "css_selector": {
                    "type": "string",
                    "description": "Optional CSS selector to extract specific elements (e.g. 'h1', '.price', 'table').",
                },
            },
            "required": ["url"],
        },
    },
    {
        "name": "scrapling_links",
        "description": "Fetch a web page and extract all hyperlinks found on it.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to extract links from."},
            },
            "required": ["url"],
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "scrapling_fetch":
        return fetch_and_parse(tool_input["url"], tool_input.get("css_selector"))
    if name == "scrapling_links":
        return extract_links(tool_input["url"])
    raise ValueError(f"Unknown tool: {name}")
