# Bloomwell cron definitions

Per CLAUDE.md convention, cron definitions and their purpose live here alongside the
agent code they invoke. The actual schedulers run in n8n (see `../n8n/README.md` for
node-by-node workflow definitions).

| Cron | Schedule | Invokes | Purpose |
|---|---|---|---|
| `bloomwell-weekly-review` | `0 * * * *` (hourly, UTC) | `agents/weekly_review.py` → `run_all_due()` | Fires the Monday Brief for every profile whose **local** time is Monday 06:00 in the current hour (Skill C). Hourly UTC + per-profile timezone check = "Mondays 6am user-local" from one cron. |
| `bloomwell-education-curator` | `0 9 * * 3` (Wed 09:00 America/Los_Angeles) | `agents/education_curator.py` → `curate_all()` | Stages general education items (`reviewed = false`) for human approval (Skill D). |

Event-driven (not cron): `bloomwell-intake` (Telegram voice notes, Skill A) and
`bloomwell-lab-upload` (PDF webhook, Skill B).

Manual invocation for testing:

```bash
python bloomwell/agents/weekly_review.py <profile_id>    # one user, now
python bloomwell/agents/education_curator.py "longevity research"  # one topic, no writes
```
