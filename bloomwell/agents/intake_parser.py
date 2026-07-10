"""Skill A — bloomwell-intake-parser.

n8n webhook receives a Telegram voice note -> Whisper transcription -> this module
structures the transcript into food_log / habit_log rows via Claude Haiku.

Same pattern as the voice_notes -> processor pipeline. Includes unit inference and
a quality_score heuristic (described to the model in the system prompt).

Entry point for n8n (HTTP -> Execute Command or a small FastAPI wrapper):
    parse_and_store(transcript, profile_id)
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from common import MODEL_FAST, cached_system, get_anthropic, get_supabase

SYSTEM_PROMPT = """\
You are Bloomwell's intake parser. You receive one transcript of a user's voice note
about food they ate and/or habits they did (exercise, meditation, hydration, etc.),
and you output structured log rows.

Output ONLY a JSON object with this shape:
{
  "food": [
    {
      "description": "<clean, concise restatement of what was eaten>",
      "calories": <int estimate>,
      "protein_g": <int estimate>,
      "carbs_g": <int estimate>,
      "fat_g": <int estimate>,
      "quality_score": <0-100>
    }
  ],
  "habits": [
    {
      "kind": "exercise" | "meditation" | "hydration" | "custom",
      "detail": { ...structured detail, e.g. {"minutes": 30, "sets": 3, "reps": 10} }
    }
  ]
}

Rules:
- Unit inference: convert casual amounts to grams/ml sensibly ("a handful of almonds"
  ~= 28g, "a glass of water" ~= 250ml, "a bowl of rice" ~= 200g cooked). Estimate
  macros from typical nutrition data; round to integers.
- quality_score heuristic (0-100): start at 50; + for whole foods, protein adequacy,
  vegetables/fiber; - for ultra-processed items, added sugar, alcohol, very large
  refined-carb loads. A grilled-chicken salad ~85; fast-food burger + soda ~25.
- Split multiple meals/activities in one note into separate array entries.
- If the note contains no food and no habit, return {"food": [], "habits": []}.
- Never output coaching, judgment, or advice — you only structure data.
"""


def parse_transcript(transcript: str) -> dict:
    """Structure one Whisper transcript into food/habit rows (no DB writes)."""
    client = get_anthropic()
    response = client.messages.create(
        model=MODEL_FAST,
        max_tokens=2048,
        system=cached_system(SYSTEM_PROMPT),
        messages=[{"role": "user", "content": transcript}],
    )
    raw = next((b.text for b in response.content if b.type == "text"), "{}")
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```")
    return json.loads(raw)


def parse_and_store(transcript: str, profile_id: str, logged_at: str | None = None) -> dict:
    """Parse a transcript and insert the rows. Returns counts for the n8n reply
    (the Telegram bot echoes a one-line confirmation back to the user)."""
    parsed = parse_transcript(transcript)
    sb = get_supabase()
    ts = logged_at or datetime.now(timezone.utc).isoformat()

    food_rows = [{
        "profile_id": profile_id,
        "logged_at": ts,
        "description": f["description"],
        "calories": f.get("calories"),
        "protein_g": f.get("protein_g"),
        "carbs_g": f.get("carbs_g"),
        "fat_g": f.get("fat_g"),
        "quality_score": f.get("quality_score"),
        "source": "voice",
    } for f in parsed.get("food", [])]

    habit_rows = [{
        "profile_id": profile_id,
        "logged_at": ts,
        "kind": h["kind"],
        "detail": h.get("detail", {}),
    } for h in parsed.get("habits", [])]

    if food_rows:
        sb.table("food_log").insert(food_rows).execute()
    if habit_rows:
        sb.table("habit_log").insert(habit_rows).execute()

    return {"food_logged": len(food_rows), "habits_logged": len(habit_rows)}


if __name__ == "__main__":
    import sys
    demo = sys.argv[1] if len(sys.argv) > 1 else (
        "Had two scrambled eggs with spinach and a slice of sourdough toast, "
        "then did a 25 minute run and drank a big glass of water."
    )
    print(json.dumps(parse_transcript(demo), indent=2))
