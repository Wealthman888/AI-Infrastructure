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

## Stage 1 — List building (Clay MCP / Vibe Prospecting)

Do this conversationally in Claude — both MCPs are connected in this workspace.

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

## Stage 2 — Research (Origami Agents + Perplexity)

Two complementary layers:

**Origami Agents (origamiagents.com)** — runs continuously against your ICP definition and surfaces
buying signals (funding, strategic hires, tech shifts) from unstructured web data. Use it as a
*source of pre-qualified rows*: export Origami leads to CSV and merge with the Clay/Vibe export.
Any columns you keep (signal descriptions, qualification notes) are automatically fed into the
personalization prompt by `personalize.py`.

**Perplexity (`research.py` in this folder)** — per-prospect deep research at generation time. For
each row it asks Perplexity Sonar for: what the company does, recent news/launches/funding, how they
likely generate revenue today, and 2–3 specific personalization hooks. Costs ~$1.50–$3 per 300
prospects with `sonar`; use `sonar-pro` for higher-value targets.

```bash
export PERPLEXITY_API_KEY=pplx-...
python agents/outreach/research.py prospects.csv --out prospects_researched.csv
```

Resumable — re-running skips rows that already have research.

## Stage 3 — Personalization at scale (`personalize.py`)

Claude generates a 3-touch sequence per prospect (initial + 2 follow-ups) using:
- **Message Batches API** → 50% cost discount, perfect for 300 non-urgent generations
- **Prompt caching** → the offer doc + writing rules are a shared cached prefix (per CLAUDE.md)
- **`claude-opus-4-7`** → per this repo's convention for reasoning-heavy generation

```bash
export ANTHROPIC_API_KEY=sk-...
python agents/outreach/personalize.py prospects_researched.csv \
    --offer agents/outreach/offer.md --out emails.csv
```

The system prompt enforces the rules that actually drive replies:
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

**Never send 300 cold emails from your main domain.** Setup:
- 2–3 lookalike domains (getgemlabs.com, gemlabshq.com), SPF + DKIM + DMARC on each
- 2 inboxes per domain, **warmed 2–3 weeks** before the first cold send
- **20–30 emails/inbox/day** → 6 inboxes = 120–180/day → the full 300-sequence runs comfortably
- Plain text, no links in email #1, no images, no tracking pixel if you can live without opens

**Sequencer:** import `emails.csv` into Instantly or Smartlead ($37–$97/mo) — they handle rotation,
throttling, warmup, and reply detection. Map the generated columns to custom variables and send
each prospect their own pre-written sequence.

**Alternative for small/targeted batches:** ask Claude in this workspace to create Gmail drafts from
`emails.csv` via the Gmail MCP (`create_draft`), then review and send manually — good for the top
20–30 highest-value prospects; not for 300 (volume from one Gmail inbox will burn the domain).

**Compliance:** include a real business identity, honor opt-outs immediately (CAN-SPAM), and only
email business addresses relevant to the offer.

## Stage 6 — Replies & iteration

- Answer positive replies within 1 hour where possible (reply speed ≈ booking rate)
- Log replies by segment/angle; after ~150 sends compare reply rate per ICP and per hook type,
  then re-run Stages 1–3 weighted toward what worked
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
