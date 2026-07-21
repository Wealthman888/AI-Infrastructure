# GemLabs Outreach Playbook — 250–300 Hyper-Personalized Emails

**Goal:** Book discovery calls ("Free Revenue Audit") for GemLabs' AI revenue-system offers using a
Clay-MCP-style GTM workflow: build list → enrich → research → personalize at scale → send → follow up.

This is the strategy from the "Clay MCP for GTM" approach, adapted to the tools connected in this
workspace (Clay MCP, Vibe Prospecting/Explorium MCP, Gmail MCP) plus **Origami Agents** and
**Perplexity** for research.

---

## The math first (why 250–300 works)

| Stage | Rate | Result |
|---|---|---|
| Emails delivered | 95% | ~275 inboxes |
| Reply rate (personalized cold) | 3–8% | 8–22 replies |
| Positive reply rate | ~40% of replies | 3–9 interested |
| Booked calls | ~60% of positive | **2–6 calls per batch** |

At GemLabs' $7.5K–$20K deal size, one closed deal pays for the whole system many times over.
The lever that moves reply rate from 1% → 5%+ is **research-driven relevance**, not volume.

---

## Stage 1 — List building (Apify — primary; Clay MCP / Vibe Prospecting — alternate)

**Primary: Apify** (`apify_pull.py`). Build the search in Apollo.io (free account is enough to
build the search URL), then run the Apollo scraper actor via Apify to extract the leads with
work emails — typically $1–2 per 1,000 leads in actor costs vs. credit-based pricing elsewhere.

1. In Apollo: People search → titles (Founder, CEO, Co-Founder), company size 11–50, location US,
   industry Software/SaaS. Add signals where possible (e.g. currently hiring sales roles).
2. Copy the search URL into `apollo_input.json` with `totalRecords` (300–400) and
   `getWorkEmails: true`, then `python apify_pull.py --input apollo_input.json --out prospects.csv`.
3. Other useful actors for signal-based lists: LinkedIn job-posts scrapers (companies hiring
   SDRs/AEs right now = best "systems audit" targets), G2/product-review scrapers, and ad-library
   scrapers (companies actively running Meta ads = best "ad audit" targets).

**Alternate: Clay MCP / Vibe Prospecting MCP** — conversational list building in Claude
(credit-based; better firmographic filters and intent topics).

**ICP (pick ONE per batch — segment-consistent batches convert better):**
- SaaS founders/RevOps, 11–50 employees, US, hiring SDRs or showing sales-automation intent
- Marketing agency owners, 11–50, US (they resell automation)
- E-commerce brands $1M–$10M revenue (retention/upsell automation)

**How, with Vibe Prospecting (Explorium) — best for bulk 250–300:**
1. Fetch prospects: entity_type `prospects`, filters: job_level (founder/c-suite/vice president),
   company_size `11-50`, country `US`, LinkedIn category via autocomplete, and — key signal —
   `business_intent_topics` (e.g. "Sales Automation", "Lead Generation") or `events`
   (hiring_in_sales_department, new_funding_round). `has_email: true`.
2. Enrich contacts (emails) + business enrichments (technographics, linkedin posts, workforce trends).
3. Export to CSV (~300–400 rows; expect fallout at validation).

**How, with Clay MCP — best for targeted accounts:**
- `find-and-enrich-contacts-at-company` per target account, add Email + Summarize Work History +
  custom data points ("recent GTM hires", "what does their outbound motion look like").

**Signals that make the email write itself (prioritize prospects that have ≥1):**
- Hiring SDRs/AEs right now (they're scaling sales manually — perfect for "AI SDR" pitch)
- Recent funding round (pressure to scale pipeline)
- Sales/marketing team grew recently
- Tech stack shows HubSpot/Salesforce but no enrichment/automation tooling
- Founder posting on LinkedIn about pipeline/outbound pain

**Hygiene:** verify emails before sending (MillionVerifier/NeverBounce, ~$0.001/email). Remove
catch-alls or send them from a separate inbox. Target <2% bounce.

## Stages 2+3 — Research AND personalization in one pass (Perplexity)

**Primary: `generate_emails.py`** — one Perplexity Sonar call per prospect. Sonar searches the web
live, so research and writing happen together: it looks up the company/person (news, funding,
sales hiring, ad activity), extracts verifiable hooks, then writes the full 3-touch sequence
against the offer brief. ~$5–15 per 300 prospects with `sonar`; use `--model sonar-pro` for
deeper research on high-value targets.

```bash
export PERPLEXITY_API_KEY=pplx-...
python agents/outreach/generate_emails.py prospects.csv \
    --offer agents/outreach/offer.md --out emails.csv
```

Resumable — re-running skips rows that already have generated emails. Rows where research came up
thin are flagged `weak_research` for QA.

**Tier-2 deep research (`deep_research.py`) — for the top 10–15% of the list.** The bulk pass
costs pennies per prospect; the tier-2 pass spends dollars on the prospects worth $10K–$20K.
It fetches the target's actual website (home, pricing, careers — hiring signals live there),
then runs an OpenAI web-search agent over the evidence: founder activity, funding, ad-library
activity, competitor pressure, visible funnel gaps. Output feeds two places:
- `deep_hooks`/`deep_summary` columns → automatically picked up by the email writer → sharper
  tier-2 emails
- `teardown_preview` → 3 concrete findings about THEIR funnel — the "audit preview" asset for
  reply handling (send to hesitant repliers as proof of work) and the opening of the audit call.

```bash
export OPENAI_API_KEY=sk-...
python agents/outreach/deep_research.py top_targets.csv --limit 30 --out prospects_tier2.csv
```

**Origami Agents (origamiagents.com)** still slots in as a continuous signal source: export its
pre-qualified leads to CSV and feed them straight into `generate_emails.py` — any signal columns
it adds are passed into the prompt automatically.

**Alternate writer:** `research.py` + `personalize.py` decouple the steps and use Claude
(Batch API, 50% discount, prompt caching, `claude-opus-4-7`) for the writing — worth A/B testing
against the Perplexity-written emails on reply rate.

The writing rules baked into both writers are what actually drive replies:
- ≤120 words, one idea, one low-friction CTA (interest-based, not "book 30 minutes")
- Opens with the prospect-specific observation (the research hook), never "I hope this finds you well"
- No em-dashes-and-buzzwords AI voice; reads like a founder typed it
- Follow-up 1 (day 3): new value angle. Follow-up 2 (day 7): breakup/light
- Subject: 2–5 words, specific, lowercase, no spam triggers

**Edit `offer.md` first** — it carries your positioning, proof points, and CTA. It ships pre-filled
from the GemLabs action plan; sharpen the case-study numbers before a real send.

## Stage 4 — QA (do not skip)

Claude wrote 300 emails; you review ~30 minutes:
1. Spot-check 20–30 rows in `emails.csv`. Kill anything generic or with a wrong/thin hook.
2. Rows where research failed get a `weak_research` flag — rewrite or drop them.
3. Check no fabricated claims (the prompt forbids inventing numbers, but verify).

## Stage 5 — Sending (deliverability is the whole game)

**Current infrastructure: 15 pre-warmed inboxes.** Capacity and cadence:

- 15 inboxes × 25 cold sends/day = **~375 sends/day capacity**; plan to ~300/day (20% headroom
  for warmup upkeep and reply traffic)
- Each prospect consumes 3 sends over 7 days, so steady-state intake = **~100 new prospects/day**
- → the 300-prospect batch enters sequence in **3 days**; full monthly capacity ≈ **2,000–2,200
  prospects** if list building and research keep up
- **Ramp even though inboxes are warmed** — warming ≠ cold-send history. Week 1: 10–15 cold/inbox/day,
  week 2: ~20, week 3: 25–30. Keep warmup emails running in the background throughout.
- Spread inboxes across domains: max 2–3 inboxes per domain. 15 inboxes should sit on 5–8 lookalike
  domains (never the main gemlabsagency.com domain), each with SPF + DKIM + DMARC.
- If one inbox's bounce or spam-complaint rate spikes, pull it from rotation immediately — one burned
  inbox is recoverable, a burned domain is not.
- Plain text, no links in email #1, no images, no tracking pixel if you can live without opens

**Sequencer:** import `emails.csv` into Instantly or Smartlead ($37–$97/mo) — they handle rotation,
throttling, warmup, and reply detection. Map the generated columns to custom variables and send
each prospect their own pre-written sequence.

**Alternative for small/targeted batches:** ask Claude in this workspace to create Gmail drafts from
`emails.csv` via the Gmail MCP (`create_draft`), then review and send manually — good for the top
20–30 highest-value prospects; not for 300 (volume from one Gmail inbox will burn the domain).

**Compliance:** include a real business identity, honor opt-outs immediately (CAN-SPAM), and only
email business addresses relevant to the offer.

## Stage 6 — Replies, the offer ladder & iteration

**The offer ladder (see offer.md):** cold email sells ONLY the free scoped audit. On the audit
call, pitch implementation directly ($4,500 entry build → $7.5K–$20K stack). For interested-but-
not-ready prospects, downsell the **$1,500 Deep Audit, fully credited toward any build** — it
monetizes hesitation and keeps them in motion. Downsell line for reply handling:

> "Totally fair. If it helps, we also do a full written diagnostic — systems, ad accounts, and
> content — with a 90-day roadmap. It's $1,500 and we credit all of it toward any build if you
> move forward. Want the one-pager?"

**Authority track:** run AUTHORITY-SPRINT.md in parallel — every audit feeds the proof loop
(case-study numbers, Clutch reviews, LinkedIn teardown posts). Around day 90, A/B a paid-audit
CTA against the free control and flip when it books ≥60% as well.

- Answer positive replies within 1 hour where possible (reply speed ≈ booking rate)
- Log replies by segment/angle; after ~150 sends compare reply rate per ICP and per hook type,
  then re-run Stages 1–3 weighted toward what worked
- At full capacity (~300 sends/day, 3–8% reply rate) expect **9–24 replies/day** — assign an owner
  and a same-day SLA before scaling past the first batch, or booked-call rate collapses
- Feed objections back into `offer.md` (e.g. recurring "we already have a VA" → add that proof point)

---

## Cost of a 300-prospect batch (approx.)

| Item | Cost |
|---|---|
| List + enrichment (Vibe/Clay credits) | $30–$100 |
| Email verification | ~$1 |
| Perplexity research (sonar) | ~$2–3 |
| Claude batch generation (opus-4-7, batch discount) | ~$8–15 |
| Sequencer + inboxes + domains | ~$100–150/mo |
| **Total** | **~$150–270 for 2–6 booked calls** |
