---
name: bloomwell-education-curator
description: Bloomwell Skill D — curate general longevity/wellness education items via web search into education_items (reviewed=false, human-approved before feed). Use when running or modifying the weekly education pipeline.
---

# Bloomwell Education Curator (Skill D)

Weekly (n8n cron, Wed 09:00 PT): pulls new items on opted-in topics (longevity
research, procedures, breakthroughs) via `claude-sonnet-4-6` + web search,
summarizes at an 8th-grade level with source links, writes to `education_items`
with `reviewed = false`. David/VA approves before anything hits a feed.

## How to run

```bash
python bloomwell/agents/education_curator.py                        # full weekly run
python bloomwell/agents/education_curator.py "longevity research"   # one topic, no writes
```

## Hard rules (compliance-critical — do not weaken)

- **RULE 5:** education is GENERAL content, topic-tagged, identical for every user.
  The module reads NO user data beyond the distinct set of opted-in topics, and
  `education_items` deliberately has no `profile_id`. Never frame anything as
  "based on your labs, look into X procedure".
- Describe, don't prescribe: never recommend readers pursue a procedure,
  supplement, dosage, or protocol.
- **RULE 1:** title + summary run through `copy_validator.py`; failures are skipped.
- Human-in-loop: `reviewed = false` on insert; the RLS policy only exposes
  `reviewed = true` rows to users.

## When modifying

Dedup is by `source_url`. Every item must carry a real source link from the web
search results. Keep the system prompt static/cached.
