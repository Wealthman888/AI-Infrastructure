# Bloomwell n8n workflows

Three workflows run on the existing n8n instance (cloud or Hetzner). Node-by-node
definitions below; export the built workflows back into this directory as JSON
(`*.workflow.json`) once created so they're version-controlled.

## 1. `bloomwell-intake` — Telegram voice note → food/habit rows (Skill A)

Trigger: **Telegram Trigger** node (bot paired during onboarding).

| # | Node | Purpose |
|---|---|---|
| 1 | Telegram Trigger | Receives message updates from the Bloomwell bot |
| 2 | IF (voice?) | Route voice notes forward; text messages go to step 4 directly as transcript |
| 3 | Telegram → HTTP Request (OpenAI Whisper) | Download the `.oga` voice file, transcribe (`whisper-1`) |
| 4 | Supabase node | Look up `profiles.id` by `telegram_chat_id`; abort with a "pair your account first" reply if missing. Also verify a live `data_consents` row for source `food_log` (RULE 6) |
| 5 | Execute Command / HTTP | `python bloomwell/agents/intake_parser.py` wrapper → `parse_and_store(transcript, profile_id)` |
| 6 | Telegram Send | One-line confirmation: "Logged: 2 foods, 1 habit ✅" |

Error branch: on parser failure, reply "Couldn't parse that — try rephrasing?" and
log to n8n's error workflow. Never silently drop a log.

## 2. `bloomwell-weekly-review` — Monday Brief (Skill C)

Trigger: **Cron** node, hourly at minute 0 (`0 * * * *`).

The hourly trigger calls `weekly_review.run_all_due()`, which selects profiles whose
*local* time is Monday 06:00 in the current hour — this is how "Mondays 6am
user-local" is achieved from a single UTC cron.

| # | Node | Purpose |
|---|---|---|
| 1 | Cron (hourly) | Fires `run_all_due()` |
| 2 | Execute Command / HTTP | `python bloomwell/agents/weekly_review.py` |
| 3 | IF (errors?) | Any `{profile_id, error}` entries → notify David (Telegram admin chat) |

Delivery is handled inside the agent (Telegram / app / email / SMS per
`profiles.brief_channel`; SMS only with `sms_consent_at` set — RULE 6). The agent
refuses to deliver any brief with `copy_validated = false`, and the DB trigger
enforces the same independently.

## 3. `bloomwell-education-curator` — weekly feed staging (Skill D)

Trigger: **Cron** node, Wednesdays 09:00 America/Los_Angeles (`0 9 * * 3`).

| # | Node | Purpose |
|---|---|---|
| 1 | Cron (weekly) | Fires `curate_all()` |
| 2 | Execute Command / HTTP | `python bloomwell/agents/education_curator.py` |
| 3 | Telegram Send (admin) | "N items staged for review" → David/VA approves in the admin view (`reviewed = true`) before anything reaches a feed |

RULE 5 reminder: this pipeline reads NO user data beyond the distinct set of
opted-in topics. Items are identical for every user on a topic.

## 4. `bloomwell-lab-upload` — lab PDF intake (Skill B)

Trigger: **Webhook** node called by the web app after a PDF lands in Supabase
Storage (`lab-uploads` bucket), or by the Function MCP connector.

| # | Node | Purpose |
|---|---|---|
| 1 | Webhook | `{profile_id, storage_path}` |
| 2 | Supabase Storage download | Fetch the PDF bytes; confirm `data_consents` row for `lab_upload` (RULE 6) |
| 3 | Execute Command / HTTP | `python bloomwell/agents/lab_decoder.py <pdf> <profile_id>` |
| 4 | Respond | `{panel_id, biomarkers, doctor_flags}` back to the app for the Labs screen |
