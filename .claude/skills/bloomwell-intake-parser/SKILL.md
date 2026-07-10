---
name: bloomwell-intake-parser
description: Bloomwell Skill A — structure a food/habit voice-note transcript into food_log and habit_log rows. Use when processing Telegram voice notes, testing the intake pipeline, or backfilling logs from raw transcripts.
---

# Bloomwell Intake Parser (Skill A)

Structures Whisper transcripts of user voice notes into `food_log` / `habit_log` rows
using `claude-haiku-4-5-20251001` (high-frequency, cost-sensitive task).

## How to run

```bash
# Parse only (prints JSON, no DB writes)
python bloomwell/agents/intake_parser.py "two eggs, toast, then a 25 minute run"

# Parse + insert (used by the n8n webhook)
python -c "from intake_parser import parse_and_store; \
           print(parse_and_store('<transcript>', '<profile_id>'))"
```

## Behavior contract

- Splits multi-item notes into separate rows; infers units from casual amounts
  ("a handful of almonds" ≈ 28g) and estimates macros.
- `quality_score` heuristic 0–100: starts at 50, up for whole foods / protein /
  fiber, down for ultra-processed / added sugar / alcohol.
- Structures data ONLY — never emits coaching, judgment, or advice.
- Pipeline (n8n `bloomwell-intake`): Telegram voice → Whisper → this parser →
  Supabase insert → one-line Telegram confirmation. Requires an active
  `data_consents` row for `food_log` (RULE 6).

## When modifying

Keep the system prompt in `bloomwell/agents/intake_parser.py` static and cached
(`cache_control: {"type": "ephemeral"}` on the last block). Never add coaching
language to parser output — coaching lives exclusively in Skill C behind the
copy validator.
