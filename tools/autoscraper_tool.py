"""Reusable wrapper around AutoScraper for use by agents.

AutoScraper learns scraping rules from examples — you provide a URL and
sample values you want to extract, and it finds and reuses the pattern
across similar pages.

Requires: pip install autoscraper
"""

import json
import os
import tempfile

from autoscraper import AutoScraper


def train_and_scrape(url: str, wanted_list: list[str]) -> dict:
    """Train a scraper on example values and return all matching items from the page."""
    scraper = AutoScraper()
    result = scraper.build(url, wanted_list)
    return {
        "url": url,
        "wanted_examples": wanted_list,
        "results": result or [],
    }


def save_scraper(url: str, wanted_list: list[str], name: str) -> dict:
    """Train a scraper and save it to the scrapers/ directory for reuse."""
    os.makedirs("scrapers", exist_ok=True)
    path = os.path.join("scrapers", f"{name}.json")
    scraper = AutoScraper()
    scraper.build(url, wanted_list)
    scraper.save(path)
    return {"saved_to": path, "name": name}


def load_and_scrape(name: str, url: str) -> dict:
    """Load a previously saved scraper and run it on a (potentially different) URL."""
    path = os.path.join("scrapers", f"{name}.json")
    scraper = AutoScraper()
    scraper.load(path)
    result = scraper.get_result_similar(url)
    return {"url": url, "scraper": name, "results": result or []}


TOOL_DEFINITIONS = [
    {
        "name": "autoscraper_train",
        "description": (
            "Train AutoScraper using example values from a page, then return all "
            "matching items. Provide the URL and a list of sample strings you want "
            "to extract (e.g. a product name, a price, a title)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to train and scrape."},
                "wanted_list": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Example values that exist on the page which you want to extract.",
                },
            },
            "required": ["url", "wanted_list"],
        },
    },
    {
        "name": "autoscraper_save",
        "description": "Train a scraper and save it by name for reuse on similar pages.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Training URL."},
                "wanted_list": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Example values to learn from.",
                },
                "name": {"type": "string", "description": "Name to save the scraper under (e.g. 'product_prices')."},
            },
            "required": ["url", "wanted_list", "name"],
        },
    },
    {
        "name": "autoscraper_run",
        "description": "Run a previously saved scraper on a new URL to extract similar data.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Name of the saved scraper to load."},
                "url": {"type": "string", "description": "URL to scrape using the saved rules."},
            },
            "required": ["name", "url"],
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "autoscraper_train":
        return train_and_scrape(tool_input["url"], tool_input["wanted_list"])
    if name == "autoscraper_save":
        return save_scraper(tool_input["url"], tool_input["wanted_list"], tool_input["name"])
    if name == "autoscraper_run":
        return load_and_scrape(tool_input["name"], tool_input["url"])
    raise ValueError(f"Unknown tool: {name}")
