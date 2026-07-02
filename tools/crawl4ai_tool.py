"""Reusable wrapper around Crawl4AI for use by agents.

No API key required — Crawl4AI runs locally using Playwright.
Requires: pip install crawl4ai && crawl4ai-setup
"""

import asyncio
import json

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode


def _run(coro):
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
    except RuntimeError:
        pass
    return asyncio.run(coro)


async def _scrape(url: str, word_count_threshold: int = 10) -> dict:
    config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, word_count_threshold=word_count_threshold)
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url, config=config)
        return {
            "url": result.url,
            "success": result.success,
            "markdown": result.markdown,
            "title": result.metadata.get("title") if result.metadata else None,
            "error": result.error_message if not result.success else None,
        }


async def _crawl(urls: list[str], word_count_threshold: int = 10) -> list[dict]:
    config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, word_count_threshold=word_count_threshold)
    async with AsyncWebCrawler() as crawler:
        results = await crawler.arun_many(urls=urls, config=config)
        return [
            {
                "url": r.url,
                "success": r.success,
                "markdown": r.markdown,
                "title": r.metadata.get("title") if r.metadata else None,
                "error": r.error_message if not r.success else None,
            }
            for r in results
        ]


def scrape(url: str) -> dict:
    """Scrape a single URL and return LLM-ready markdown content."""
    return _run(_scrape(url))


def crawl_many(urls: list[str]) -> list[dict]:
    """Scrape multiple URLs concurrently and return markdown for each."""
    return _run(_crawl(urls))


TOOL_DEFINITIONS = [
    {
        "name": "crawl4ai_scrape",
        "description": "Scrape a single web page using Crawl4AI and return clean markdown. Works without an API key.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to scrape."},
            },
            "required": ["url"],
        },
    },
    {
        "name": "crawl4ai_scrape_many",
        "description": "Scrape multiple URLs concurrently using Crawl4AI. Returns markdown for each URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "urls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of URLs to scrape.",
                },
            },
            "required": ["urls"],
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "crawl4ai_scrape":
        return scrape(tool_input["url"])
    if name == "crawl4ai_scrape_many":
        return crawl_many(tool_input["urls"])
    raise ValueError(f"Unknown tool: {name}")
