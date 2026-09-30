"""Reusable wrapper around Browser Use for use by agents.

Browser Use lets an LLM control a real Chromium browser — clicking buttons,
filling forms, navigating pages, and extracting live data from JavaScript-heavy
sites that static scrapers can't handle.

Requires: pip install browser-use
Playwright browsers must be installed: playwright install chromium
"""

import asyncio
import os

from browser_use.agent.service import Agent as BrowserAgent
from browser_use.browser.session import BrowserSession
from browser_use.llm.browser_use.chat import ChatBrowserUse


def _run(coro):
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
    except RuntimeError:
        pass
    return asyncio.run(coro)


async def _run_browser_task(task: str, max_steps: int = 15) -> dict:
    llm = ChatBrowserUse(
        model="claude-haiku-4-5-20251001",
        api_key=os.environ["ANTHROPIC_API_KEY"],
    )
    session = BrowserSession(
        executable_path="/opt/pw-browsers/chromium",
        headless=True,
    )
    agent = BrowserAgent(task=task, llm=llm, browser_session=session, max_actions_per_step=max_steps)
    history = await agent.run()
    return {
        "task": task,
        "result": history.final_result(),
        "steps": len(history.history),
        "success": history.is_done(),
    }


def run_browser_task(task: str, max_steps: int = 15) -> dict:
    """Let the AI control a browser to complete a task and return the result."""
    return _run(_run_browser_task(task, max_steps))


TOOL_DEFINITIONS = [
    {
        "name": "browser_task",
        "description": (
            "Control a real browser to complete a task. Use this for JavaScript-heavy "
            "sites, login-gated pages, forms, or anything a static scraper can't handle. "
            "Describe the task in plain English (e.g. 'Go to example.com, click Products, "
            "and return the list of product names and prices')."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": "Plain-English description of what to do in the browser.",
                },
                "max_steps": {
                    "type": "integer",
                    "description": "Maximum browser action steps before stopping.",
                    "default": 15,
                },
            },
            "required": ["task"],
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "browser_task":
        return run_browser_task(tool_input["task"], tool_input.get("max_steps", 15))
    raise ValueError(f"Unknown tool: {name}")
