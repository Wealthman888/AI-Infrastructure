"""
Enrichment agent scaffolding.

Follows the tool-use loop pattern from /CLAUDE.md:
1. Send a user message + tool definitions to the Claude API
2. If the response contains tool_use blocks, execute the tool and return a tool_result
3. Continue the loop until the model returns a final text response

Fill in `enrich_record` with a real data-provider call (e.g. Clay, a CRM API,
or another enrichment source) for the fields this agent needs to fill in.
"""

import os

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

MODEL = os.environ.get("ENRICHMENT_MODEL", "claude-opus-4-7")

SYSTEM_PROMPT = """You are a data enrichment agent. Given a record (e.g. a \
company or contact), use the enrich_record tool to look up missing fields, \
then return the enriched record as structured output."""

TOOLS = [
    {
        "name": "enrich_record",
        "description": (
            "Look up additional data points for an entity (company or "
            "contact) by name or domain."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "entity": {
                    "type": "string",
                    "description": "Company name, domain, or contact identifier",
                },
                "fields": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Data points to look up, e.g. company_size, tech_stack",
                },
            },
            "required": ["entity", "fields"],
        },
    }
]


def enrich_record(entity: str, fields: list) -> dict:
    """Stub tool implementation. Replace with a real enrichment provider call."""
    return {field: None for field in fields} | {"entity": entity, "source": "stub"}


def run_tool(name: str, tool_input: dict) -> dict:
    if name == "enrich_record":
        return enrich_record(tool_input["entity"], tool_input["fields"])
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

    prompt = sys.argv[1] if len(sys.argv) > 1 else "Enrich Acme Corp with company_size and tech_stack"
    print(run(prompt))
