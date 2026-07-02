"""Cold outreach agent: research a prospect, draft a personalized opener, and
add them as a lead to an Instantly campaign.

Usage:
    python agents/email_marketing_agent.py \
        --url https://prospect-company.com \
        --email founder@prospect-company.com \
        --campaign-id <instantly-campaign-id> \
        --first-name Jane --company "Prospect Co"

Follows the tool-use loop pattern from CLAUDE.md: send messages + tools to
Claude, execute any tool_use blocks, feed back tool_result, repeat until a
final text response. Uses claude-opus-4-7 per CLAUDE.md guidance for
multi-step reasoning agents (swap to claude-haiku-4-5-20251001 for
high-volume/cost-sensitive runs).
"""

import argparse
import json
import os
import sys

import anthropic
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.firecrawl import FirecrawlClient
from tools.instantly import InstantlyClient

MODEL = "claude-opus-4-7"

SYSTEM_PROMPT = """You are the cold outreach research agent for GemLabs Agency, \
an AI automation agency selling custom revenue automation systems (AI SDRs, lead \
qualification, sales ops) to growth-stage companies.

Given a prospect's website URL, you will:
1. Scrape the site with firecrawl_scrape to understand what the company does, \
who they serve, and any recent news or specific detail worth referencing.
2. Write a short (2-3 sentence) personalized opening line for a cold email. It \
must reference something SPECIFIC and true from the site (not a generic \
compliment) and bridge naturally to how GemLabs helps companies like theirs \
automate revenue operations. No greeting, no sign-off, no subject line — just \
the opener paragraph, since it will be inserted as {{personalization}} into an \
existing email template.
3. Call instantly_add_lead to add the prospect as a lead in the given campaign, \
passing your opener as the `personalization` field.
4. Reply with a one-line confirmation of what you found and what you wrote.

Never fabricate details about the prospect. If the site scrape fails or lacks \
enough content, say so instead of inventing a personalization."""

TOOLS = [
    {
        "name": "firecrawl_scrape",
        "description": "Scrape a URL and return its content as markdown for research.",
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
    {
        "name": "instantly_add_lead",
        "description": "Add a lead to an Instantly campaign with a personalization field.",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "string"},
                "email": {"type": "string"},
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "company_name": {"type": "string"},
                "personalization": {"type": "string"},
            },
            "required": ["campaign_id", "email", "personalization"],
        },
    },
]


def run_tool(name: str, tool_input: dict, firecrawl: FirecrawlClient, instantly: InstantlyClient) -> dict:
    if name == "firecrawl_scrape":
        return firecrawl.scrape(tool_input["url"])
    if name == "instantly_add_lead":
        return instantly.add_lead(
            campaign_id=tool_input["campaign_id"],
            email=tool_input["email"],
            first_name=tool_input.get("first_name", ""),
            last_name=tool_input.get("last_name", ""),
            company_name=tool_input.get("company_name", ""),
            personalization=tool_input["personalization"],
        )
    raise ValueError(f"Unknown tool: {name}")


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser(description="Cold outreach research + Instantly lead agent")
    parser.add_argument("--url", required=True, help="Prospect's website URL")
    parser.add_argument("--email", required=True, help="Prospect's email address")
    parser.add_argument("--campaign-id", required=True, help="Instantly campaign ID")
    parser.add_argument("--first-name", default="")
    parser.add_argument("--last-name", default="")
    parser.add_argument("--company", default="")
    args = parser.parse_args()

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    firecrawl = FirecrawlClient()
    instantly = InstantlyClient()

    user_prompt = (
        f"Prospect URL: {args.url}\n"
        f"Email: {args.email}\n"
        f"First name: {args.first_name}\n"
        f"Last name: {args.last_name}\n"
        f"Company: {args.company}\n"
        f"Instantly campaign ID: {args.campaign_id}\n\n"
        "Research this prospect and add them to the campaign with a personalized opener."
    )

    messages = [{"role": "user", "content": user_prompt}]

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=[
                {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}
            ],
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            for block in response.content:
                if block.type == "text":
                    print(block.text)
            break

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            try:
                result = run_tool(block.name, block.input, firecrawl, instantly)
                tool_results.append(
                    {"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(result)}
                )
            except Exception as exc:  # noqa: BLE001
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(exc),
                        "is_error": True,
                    }
                )
        messages.append({"role": "user", "content": tool_results})


if __name__ == "__main__":
    main()
