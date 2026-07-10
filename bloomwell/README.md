# Bloomwell v1 — Life & Wellness Longevity Coordinator

> **Bloomwell reads your data and prepares you for your doctor. It never replaces one.**

Bloomwell is a **wellness coordinator, not a medical provider**. It reads health data the
user already owns (wearable, food log, lab PDFs), finds patterns, and delivers **one or two
changes per week** plus doctor-ready questions. It never diagnoses, never prescribes, and
never recommends a supplement, dosage, or protocol in response to an individual's biomarker
data.

## Go-to-market tracks

- **Track 1 (launch now):** B2C consumer wellness subscription. No PHI, no HIPAA.
  Standard privacy policy + wellness disclaimer.
- **Track 2 (Phase 3+):** White-label licensing to NON-clinical health businesses — gyms,
  personal trainers, med spas, health coaches. Same codebase, tenant-scoped.
  Clinics/providers (HIPAA BAA territory) are explicitly OUT of scope for v1.

## Directory layout

```
bloomwell/
  supabase/migrations/   # Postgres schema — compliance rules live HERE, not in vibes
  validators/            # copy_validator.py — the RULE 1 language firewall
  agents/                # Skills A–D agent logic (Anthropic API)
  n8n/                   # Pipeline + scheduler workflow definitions
  scripts/               # Cron definitions and their purpose
.claude/skills/
  bloomwell-intake-parser/     # Skill A — voice note → food_log / habit_log
  bloomwell-lab-decoder/       # Skill B — lab PDF → biomarkers + doctor_flags
  bloomwell-weekly-review/     # Skill C — the coach (Monday Brief)
  bloomwell-education-curator/ # Skill D — general education feed
```

## Hard compliance rules (enforced at DB + validator layer)

| Rule | What | Where enforced |
|---|---|---|
| **1 — Language firewall** | Banned words ("diagnose", "treat", "prescribe", "dosage", …) never appear in coaching output | `validators/copy_validator.py` (regex + Haiku classifier); `weekly_briefs.copy_validated` gate + `enforce_copy_validated_before_delivery` trigger |
| **2 — Out-of-range = doctor referral** | Every out-of-range biomarker → `doctor_flags` row with plain English + a doctor question; NEVER paired with a supplement/food/protocol suggestion | `check_no_rec_on_flagged()` trigger on `weekly_briefs` |
| **3 — One-or-two changes only** | `weekly_briefs.recommendations` max length 2 | `CHECK (jsonb_array_length(recommendations) BETWEEN 1 AND 2)` |
| **4 — Pattern over noise** | Recommendations need a ≥7-day trend window | `CHECK (trend_window_days >= 7)` + review agent system prompt |
| **5 — Education is general** | Education feed is the same content for all users, topic-tagged, never personalized-prescriptive | `education_items` has no `profile_id`; curator system prompt; human review gate (`reviewed = false`) |
| **6 — Consent + deletion** | Timestamped consent per data source; one-tap export + hard delete | `data_consents` ledger; `sms_consent_at NULL = no SMS ever`; deletion cascade + connector revocation |

## Architecture

```
[User devices]                    [Bloomwell Core]                     [Delivery]
Oura/Whoop/Garmin ──Terra MCP──►                                  ┌──► Telegram/SMS* brief
Food voice notes ──n8n+Whisper──►   Postgres (Supabase)   ──agents─┼──► In-app dashboard
Lab PDFs ──upload/Function MCP──►   + Row Level Security           └──► Email digest
MyFitnessPal/Cronometer ─MCP────►
                                    Anthropic API (Sonnet 4.6)
                                    n8n (schedulers + pipelines)
                                                            *SMS only w/ consent, A2P-clean
```

**Stack:** Supabase (Postgres + RLS + Auth), n8n (cloud/Hetzner), Anthropic API, Telegram
Bot API, Node.js API layer, Vercel (web app + landing page), Stripe billing.

**Multi-tenancy from day one:** tenancy hangs off `profiles.tenant_id`
(default = the seeded `bloomwell-direct` tenant). Track 2 white-label = new `tenants` row
+ `brand_config`. Zero refactor later.

## Models

| Component | Model | Why |
|---|---|---|
| Weekly review, lab decoder, education curator | `claude-sonnet-4-6` | Product spec (Sonnet 4.6) — multi-step reasoning agents |
| Intake parser, copy-validator classifier | `claude-haiku-4-5-20251001` | High-frequency / cost-sensitive (per CLAUDE.md) |

All agents use prompt caching (`cache_control: {"type": "ephemeral"}` on the last static
system block, 5-minute TTL) and are built to stay within a cache window when looping.

## Setup

```bash
pip install -r bloomwell/requirements.txt

export ANTHROPIC_API_KEY=sk-...
export SUPABASE_URL=https://<project>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...      # server-side agents only; never ships to clients
export TELEGRAM_BOT_TOKEN=...             # intake + brief delivery
```

Apply the schema:

```bash
supabase db push   # or run supabase/migrations/0001_bloomwell_init.sql in the SQL editor
```

## App surfaces (v1)

1. **Onboarding** — connect wearable (Terra), pair Telegram bot for voice food logging,
   upload most recent lab PDF, pick education topics, pick brief channel.
   Consent checkbox per source (RULE 6, stored + timestamped).
2. **Today screen** — vitality ring (sleep / readiness / nutrition quality), last logged
   meal, streaks.
3. **Monday Brief** — trend deltas, the 1–2 changes, doctor flags with tap-to-copy questions.
4. **Labs screen** — biomarker table grouped by system, in/above/below chips, history over time.
5. **Learn feed** — curated education items by topic.
6. **Privacy center** — consent ledger, export all data, delete everything.
   (This is a trust product feature, not a legal chore — it goes on the landing page.)

## Pricing (draft — validate)

| Plan | Price | Includes |
|---|---|---|
| **Bloom** | $29/mo | Wearable + food coach, Monday Brief |
| **Bloom+** | $59/mo | + lab decoding, doctor flags, labs history |
| **Bloom Concierge** | $149/mo | + monthly human check-in call (clearly non-medical) |
| **White-label (Track 2)** | $497 setup + $297/mo per tenant | Axiom L2 pattern |

Anchor against the $10–15K/yr longevity coach in all marketing copy.

## Build phases

- **Phase 1 (wk 1–2):** Supabase schema + RLS, Telegram intake pipeline (Skill A),
  lab decoder (Skill B), copy validator. David dogfoods.
- **Phase 2 (wk 3–4):** Weekly review agent (Skill C), web app (Next.js on Vercel),
  Stripe, onboarding flow. 10 beta users.
- **Phase 3 (wk 5–8):** Education curator (Skill D), Terra production keys, mobile
  wrapper (PWA first), white-label tenant config. First trainer/gym pilot.
- **Not in scope:** clinics, HIPAA, SMS before A2P consent flow, any supplement
  recommendation engine (permanently out).

## Legal footer (use verbatim on app + landing page)

> Bloomwell is a wellness and education service. It is not a medical device and does not
> provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare
> provider about your health. Bloomwell flags patterns in data you choose to connect and
> helps you prepare questions for your doctor.
