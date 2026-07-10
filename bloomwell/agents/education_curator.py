"""Skill D — bloomwell-education-curator.

Weekly: pulls new items on opted-in topics (longevity research, procedures,
breakthroughs) via web search, summarizes at an 8th-grade level with source links,
and writes to education_items with reviewed=false. A human (David/VA) approves
before anything hits a feed.

RULE 5: education is GENERAL content, topic-tagged, the same for every user.
It is never generated from — or framed around — any individual's data. This module
never reads user tables; it only reads the distinct set of opted-in topics.

Entry point: curate_all() (weekly n8n cron — see ../scripts/README.md)
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "validators"))

from common import BLOOMWELL_TENANT_ID, MODEL_COACH, cached_system, get_anthropic, get_supabase
from copy_validator import validate_copy

MAX_ITEMS_PER_TOPIC = 3

SYSTEM_PROMPT = """\
You are Bloomwell's education curator. You research recent, credible developments
on ONE wellness/longevity topic (research findings, procedures, breakthroughs) and
summarize them for a general audience.

Use web search to find items from the last ~30 days from credible sources
(peer-reviewed journals, major research institutions, reputable science press).

Output ONLY a JSON array (max {max_items} items):
[
  {{
    "title": "<clear, non-clickbait title>",
    "summary": "<3-5 sentences at an 8th-grade reading level: what was found/
                announced, who it applies to in general, and why it's interesting>",
    "source_url": "<the primary source link>",
    "published_on": "YYYY-MM-DD"
  }}
]

HARD RULES:
- General education ONLY. Never frame anything as advice, and never as
  "based on your labs/data" — you don't know any individual's data.
- NEVER recommend that readers pursue a procedure, supplement, dosage, or protocol.
  Describe; don't prescribe.
- NEVER use: diagnose/diagnosis, treat/treatment (as advice to the reader), cure,
  prescribe/prescription, dosage/dose, "you should take", "medical advice".
  Reporting that a STUDY examined a treatment is fine when clearly attributed to
  the study, but prefer neutral wording ("approach", "intervention studied").
- Every item needs a real source_url from your search results.
"""


def curate_topic(topic: str) -> list[dict]:
    """Research one topic via web search and return candidate items (no DB writes)."""
    client = get_anthropic()
    response = client.messages.create(
        model=MODEL_COACH,
        max_tokens=4096,
        system=cached_system(SYSTEM_PROMPT.format(max_items=MAX_ITEMS_PER_TOPIC)),
        tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 5}],
        messages=[{
            "role": "user",
            "content": f"Topic: {topic}. Find and summarize recent items.",
        }],
    )
    raw = next(
        (b.text for b in reversed(response.content) if b.type == "text"), "[]"
    )
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return []


def curate_all(tenant_id: str = BLOOMWELL_TENANT_ID) -> dict:
    """Weekly run: curate every topic at least one user opted into, validate copy,
    stage rows with reviewed=false for human approval."""
    sb = get_supabase()

    # The ONLY user-derived input: the distinct set of opted-in topics.
    topics: set[str] = set()
    for p in sb.table("profiles").select("topics").execute().data:
        topics.update(p.get("topics") or [])

    staged, skipped = 0, 0
    existing_urls = {
        r["source_url"] for r in
        sb.table("education_items").select("source_url").execute().data
    }

    for topic in sorted(topics):
        for item in curate_topic(topic):
            if not item.get("source_url") or item["source_url"] in existing_urls:
                skipped += 1
                continue
            # RULE 1 applies to education copy too.
            result = validate_copy(
                f"{item.get('title','')} {item.get('summary','')}",
                source="education_curator",
            )
            if not result.ok:
                skipped += 1
                continue
            sb.table("education_items").insert({
                "tenant_id": tenant_id,
                "title": item["title"],
                "summary": item["summary"],
                "source_url": item["source_url"],
                "topics": [topic],
                "published_on": item.get("published_on") or date.today().isoformat(),
                "reviewed": False,  # human-in-loop gate before any feed
            }).execute()
            existing_urls.add(item["source_url"])
            staged += 1

    return {"topics": len(topics), "staged_for_review": staged, "skipped": skipped}


if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(json.dumps(curate_topic(sys.argv[1]), indent=2))
    else:
        print(json.dumps(curate_all(), indent=2))
