# GemLabs Outbound Systems

Cold email machine for GemLabs' 200-point audit → digital receptionist retainer
funnel, built on Instantly.ai + GHL + HeyGen. See `CLAUDE.md` for the full
brand/offer/infrastructure spec this repo implements.

**Hard brand rule enforced everywhere in this repo:** client-facing copy says
"digital receptionist" — never "bot," "AI agent," or "chatbot." The spintax
agent's ban list hard-fails any variant that violates this.

## What's live vs. what needs your credentials

Everything below is real, working code, tested where it can be tested without
live keys (unit-level: `python3 -m py_compile` on every module; functional:
the dashboard ran end-to-end in demo mode, screenshotted, zero console
errors). It goes live the moment you add credentials to `.env` — nothing else
changes.

| Piece | Status | Needs |
|---|---|---|
| `agents/spintax_humanizer.py` | Code complete, not yet run live | `ANTHROPIC_API_KEY` |
| `sequences/*/spintax_sequence.txt` | Hand-authored this session to the agent's exact target format (no API key was available in this sandbox to run it live) | Re-run the agent once the key is set to regenerate/refresh |
| `tools/instantly_client.py`, `scripts/lead_pipeline.py`, `scripts/health_check.py`, dashboard live mode | Code complete, untested against real Instantly data | `INSTANTLY_API_KEY` |
| `tools/ghl_client.py`, reply → pipeline sync | Code complete | `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_PIPELINE_ID`, 7 `GHL_STAGE_*` ids |
| `tools/heygen_client.py` | Code complete | `HEYGEN_API_KEY`, `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID` |
| `dashboard/` | **Runs right now** in demo mode with generated data | Real data needs `INSTANTLY_API_KEY` |
| `data/inbox_inventory.json` | Placeholder rows only | The real 15 domains/inboxes + DNS status |
| `scripts/website_audit.py` | Code complete, works locally | Needs outbound network access to arbitrary websites — **this sandbox's network policy blocks that** (confirmed: direct fetches to any non-allowlisted host get a 403 from the proxy gateway). Run it somewhere with normal outbound HTTPS. |

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in real keys, .env is gitignored, never commit it
```

## Section 1 — Domain/inbox inventory & scaling calendar

`data/inbox_inventory.json` is a placeholder. Once you send over the real 15
domains/inboxes (or once `INSTANTLY_API_KEY` is set, since `dashboard/server.py`
can pull live account data directly), fill it in or wire the dashboard to
Instantly's `/accounts` endpoint.

The Week 1–8 scaling calendar doesn't need real data — it's pure math on the
rules in `CLAUDE.md` Section 1 (+5 inboxes/week, 14–21 day warmup, 5→30/day
ramp):

```bash
python3 scripts/scaling_calendar.py plan --start 2026-07-01 --existing 15 --weeks 8
python3 scripts/scaling_calendar.py status   # reads data/inbox_inventory.json
```

## Section 3/4 — Sequences & the Spintax Humanizer

Base sequences (plain, human-authored, following the copy rules exactly —
≤120 words, one CTA, no links in Email 1, subject lines lowercase/specific)
live in `sequences/<niche>/base_sequence.md` for detailing, cleaning, and
handyman.

`sequences/<niche>/spintax_sequence.txt` is the deep-spintax version each
lead actually receives. Regenerate/refresh any of them live once you have an
Anthropic key:

```bash
python3 agents/spintax_humanizer.py --base sequences/detailing/base_sequence.md \
  --day 1 --niche detailing --out sequences/detailing/spintax_day1_regenerated.txt
```

The agent enforces the ban list, the "digital receptionist" rule, an 8th-grade
reading level, and a 1–10 human-ness quality gate (regenerates anything under
8, up to 3 attempts) before writing output.

`data/niche_angles.json` holds the niche pain angle + local proof point +
average job value (used to compute the `{{monthly_leak}}` merge tag in Email
3) for all ten ICP niches from `CLAUDE.md`, not just the first three.

**Before going live:** the `local_proof` entries in `data/niche_angles.json`
are illustrative placeholders in GemLabs' own voice, not verified case
studies. Swap them for real client outcomes before they go in a live send —
an unverifiable "proof point" is a false-claim risk the moment a prospect
checks.

## Lead pipeline

```bash
python3 scripts/website_audit.py --csv raw_leads.csv --out scored_leads.csv   # dry run / preview
python3 scripts/lead_pipeline.py --in raw_leads.csv --skip-verify              # dry run, no Instantly calls
python3 scripts/lead_pipeline.py --in raw_leads.csv                            # full pipeline, needs INSTANTLY_API_KEY
```

Input CSV columns: `email,first_name,company,website,city,state,phone,niche`.
Output: deduped → scored (60/100 ICP threshold) → verified → niche-routed CSVs
at `sequences/<niche>/leads_ready.csv`, one row per lead with every merge tag
the spintax sequence needs already filled in.

You mentioned wanting to upload your own leads and enrich/validate them, plus
use Instantly's own ICP search — this pipeline is the validation/scoring/
routing layer that sits between "raw list" and "ready to import into
Instantly." Point `--in` at your uploaded list (from wherever you enrich it)
and it handles the rest. Clay is connected as an MCP server in this workspace
if you want enrichment done conversationally before export.

## Section 5 — Outreach Command Dashboard

```bash
python3 dashboard/server.py
# open http://localhost:8080
```

Runs in demo mode with generated data if `INSTANTLY_API_KEY` isn't set —
confirmed working end-to-end in this session (all 6 API routes return valid
JSON, page renders with zero console errors). Goes live automatically once
the key is set; the frontend never talks to Instantly directly, only to this
local server, so the API key never reaches the browser.

Revenue attribution and reply sentiment read from local JSON logs
(`data/revenue_log.json`, `data/reply_log.json`) that `scripts/webhook_server.py`
writes to as replies come in and deals close — see below.

## Section 5 (data plumbing) — reply → GHL → HeyGen bridge

```bash
python3 scripts/webhook_server.py
```

Exposes:
- `POST /webhooks/instantly-reply` — point Instantly's reply webhook here.
  Classifies the reply (`scripts/reply_classifier.py`), syncs it into the GHL
  7-stage pipeline (`tools/ghl_client.py`), fires a HeyGen personalized video
  in the background on interested replies, and sends a holding reply within
  the 15-minute SLA via `scripts/message_router.py` — **email only**, the
  TCPA no-SMS-without-consent rule is enforced in code, not just documented
  (there's no SMS send path in `message_router.py` to accidentally use).
- `POST /webhooks/ghl-closed` — point a GHL pipeline-stage-change automation
  on the "Closed" stage here so Panel 3 revenue attribution has real numbers.
- `GET /healthz`

Set `INSTANTLY_WEBHOOK_SECRET` and configure Instantly to send it as an
`X-Instantly-Secret` header, or the server logs a warning and accepts
unverified requests (fine for local testing, not for production).

## Daily/weekly rhythm

```bash
python3 scripts/health_check.py            # bounce <3%, spam <0.1%, warmup score floor -- auto-pauses/rests on breach
python3 scripts/health_check.py --dry-run  # report only
```

Run daily. Writes to `data/alerts_log.json`, which the dashboard's Panel 4
alert queue reads.

Weekly rhythm per `CLAUDE.md` Section 7: Monday = health check + new cohort
onboarding (`scripts/scaling_calendar.py`), Wednesday = A/B readout, Friday =
funnel + revenue report (dashboard Panels 2–3).

## What's still blocked on you

1. **Real credentials** in `.env` — Instantly, GHL (key + location + pipeline
   + 7 stage ids), HeyGen.
2. **The real 15 domains/inboxes** — `data/inbox_inventory.json`, or confirm
   the dashboard can just pull it live from Instantly once the key's in.
3. **A lead list** — export your enriched/validated list as CSV in the format
   `scripts/lead_pipeline.py` expects, or point me at wherever it lives.
4. **Real local proof points** — replace the placeholders in
   `data/niche_angles.json` before any live send.
5. **An environment with normal outbound network access** to run
   `website_audit.py` against real prospect sites and to make live Instantly/
   GHL/HeyGen API calls — this sandbox's network policy blocks arbitrary
   outbound HTTPS, so none of the network-calling code has been exercised
   against real external services yet, only against localhost (dashboard) and
   via `py_compile`/unit-level checks.
