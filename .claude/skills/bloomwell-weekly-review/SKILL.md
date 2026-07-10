---
name: bloomwell-weekly-review
description: Bloomwell Skill C — the coach. Generates the Monday Brief (1-2 behavior changes + doctor flags) from 7 days of data vs a 3-week baseline. Use when running, testing, or modifying the weekly review agent.
---

# Bloomwell Weekly Review (Skill C — the coach)

The core product loop: every Monday 6am user-local (n8n hourly cron →
`run_all_due()`), reads the last 7 days of `wearable_daily` + `food_log` +
`habit_log` vs the prior 3-week baseline and produces the Monday Brief with
`claude-sonnet-4-6`.

## How to run

```bash
python bloomwell/agents/weekly_review.py <profile_id>   # one user, now
python bloomwell/agents/weekly_review.py                # all users due this hour
```

## Hard rules (compliance-critical — do not weaken)

- **RULE 3:** exactly 1–2 recommendations (`CHECK` on `weekly_briefs.recommendations`).
- **RULE 4:** recommendations require a ≥7-day trend window
  (`trend_window_days >= 7` CHECK + system prompt). Never coach off one day.
- **Behavior only:** sleep timing, protein consistency, training frequency,
  hydration, meal/movement timing. Never substances.
- **RULE 2:** unacknowledged `doctor_flags` are surfaced verbatim, separately.
  A recommendation may never target a flagged biomarker — enforced by the
  `check_no_rec_on_flagged()` DB trigger; the agent only passes flagged biomarker
  *names* to the model as an off-limits list.
- **RULE 1:** all outbound strings run through `copy_validator.py`. The agent
  refuses to deliver if `copy_validated = false`, and the
  `weekly_briefs_copy_validated_gate` trigger independently blocks `delivered_at`.
- **RULE 6:** SMS delivery only when `profiles.sms_consent_at` is set; otherwise
  falls back to in-app.

## When modifying

Keep the system prompt static (prompt caching). The per-user loop is built to stay
within one 5-minute cache window. Any change to recommendation shape must keep
`{"kind": "behavior", ...}` — the DB trigger rejects anything else.
