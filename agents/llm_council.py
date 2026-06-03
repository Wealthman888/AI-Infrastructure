#!/usr/bin/env python3
"""
LLM Council: Multi-perspective reasoning agent.

Queries a panel of councillors (each with a distinct analytical lens) in parallel,
then synthesizes their perspectives into a single cohesive answer.

Usage:
    python agents/llm_council.py "Should we migrate our monolith to microservices?"

    # Or import and call programmatically:
    from agents.llm_council import council
    synthesis, opinions = asyncio.run(council("Your question here"))
"""

import asyncio
import sys

import anthropic

# Each councillor has a unique analytical lens
COUNCILLORS = [
    {
        "name": "Analyst",
        "system": (
            "You are a rigorous analytical thinker. Break problems into components, "
            "examine evidence carefully, and reason from first principles. Be precise and logical. "
            "Keep your response focused and under 300 words."
        ),
    },
    {
        "name": "Strategist",
        "system": (
            "You are a strategic advisor. Focus on goals, trade-offs, and long-term implications. "
            "Consider all stakeholders and second-order effects. "
            "Keep your response focused and under 300 words."
        ),
    },
    {
        "name": "Critic",
        "system": (
            "You are a devil's advocate. Identify weaknesses, risks, hidden assumptions, and failure modes. "
            "Challenge conventional wisdom and surface what others miss. "
            "Keep your response focused and under 300 words."
        ),
    },
    {
        "name": "Pragmatist",
        "system": (
            "You are a practical implementer. Focus on what is actionable, feasible, and delivers results. "
            "Prioritize simplicity and proven approaches over theoretical ideals. "
            "Keep your response focused and under 300 words."
        ),
    },
]

SYNTHESIZER_SYSTEM = (
    "You are a council chair. You receive responses from multiple expert advisors on a question "
    "and synthesize their perspectives into a cohesive, balanced answer. "
    "Highlight where advisors agree, where they diverge meaningfully, and provide an integrated recommendation. "
    "Be direct and actionable."
)


async def _query_councillor(
    client: anthropic.AsyncAnthropic, councillor: dict, question: str
) -> dict:
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=councillor["system"],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": question,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
            }
        ],
    )
    return {
        "name": councillor["name"],
        "response": response.content[0].text,
    }


async def _synthesize(
    client: anthropic.AsyncAnthropic, question: str, opinions: list[dict]
) -> str:
    council_transcript = f"Question: {question}\n\n"
    for opinion in opinions:
        council_transcript += f"--- {opinion['name']} ---\n{opinion['response']}\n\n"

    response = await client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        system=SYNTHESIZER_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": council_transcript,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
            }
        ],
    )
    return response.content[0].text


async def council(question: str) -> tuple[str, list[dict]]:
    """
    Convene the council on a question.

    Returns:
        (synthesis, opinions) — the synthesized answer and each councillor's raw response.
    """
    client = anthropic.AsyncAnthropic()

    tasks = [_query_councillor(client, c, question) for c in COUNCILLORS]
    opinions = await asyncio.gather(*tasks)

    synthesis = await _synthesize(client, question, list(opinions))
    return synthesis, list(opinions)


async def _main():
    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])
    else:
        question = input("Ask the council: ").strip()
        if not question:
            print("No question provided.")
            sys.exit(1)

    print(f"\nConvening council on: {question}\n")
    print("Querying councillors in parallel...\n")

    synthesis, opinions = await council(question)

    for opinion in opinions:
        print(f"[{opinion['name']}]")
        print(opinion["response"])
        print()

    print("=" * 60)
    print("[Council Synthesis]")
    print(synthesis)


if __name__ == "__main__":
    asyncio.run(_main())
