---
name: prospect-scoring
description: Score and rank new signups or inbound leads by buying-intent signals (recent funding, headcount growth, relevant hiring, traffic growth) to answer "who's worth a call?". Use when the user pastes/uploads a list of signups, leads, or contacts and wants to know which ones to prioritize, or asks things like "check my new signups", "who should I call first", "score these leads", "which of these companies are worth reaching out to". Uses the Clay MCP connection for company enrichment instead of a third-party API.
---

# Prospect Scoring Skill

Turns a raw list of signups/leads into a ranked "who's worth a call" table, using
company firmographic signals pulled via the **Clay** MCP connection
(`mcp__Clay__*` tools). This replaces paid list-enrichment tools (ZoomInfo,
Crunchbase-style flat-fee APIs) with enrichment against data you already have
access to.

## When to use this

Trigger on requests like:
- "Check my new signups, who's worth a call?"
- "Score these leads" / "which of these are worth reaching out to"
- A pasted or uploaded list of emails/companies with a prioritization ask

## Workflow

### Step 1: Get the signup list

Ask the user for the list if not already provided. Accepts:
- Pasted emails/domains (one per line, or a simple table)
- A CSV path
- A Google Sheet / Drive file (use `mcp__Google_Drive__*` to read it if the user points at one)

Minimum needed per row: an **email** or a **company domain**. If only a personal
webmail domain is present (gmail.com, outlook.com, yahoo.com, icloud.com, etc.),
flag that row as **not enrichable** — there's no company to look up — and keep it
in the output with a "personal email, skip" note rather than silently dropping it.

### Step 2: Derive company domains

For each row, take the domain after `@` in the email (unless a company domain
was given directly). De-duplicate — enrich each unique company once even if
multiple signups share a domain.

### Step 3: Enrich each company via Clay

For each unique company domain, call `find-and-enrich-company` with:

```
companyIdentifier: "<domain>"
companyDataPoints: [
  { type: "Latest Funding" },
  { type: "Headcount Growth" },
  { type: "Open Jobs" },
  { type: "Website Traffic" }
]
```

**Before running this on more than ~15 companies**, tell the user how many
companies will be enriched and that each consumes Clay credits (4 data points
x N companies), and wait for confirmation — same rule as quoting cost before
a paid API call. Under ~15 companies, just proceed.

If the user cares about a specific department's hiring (e.g. "score by
ops hiring" or "we sell to sales teams"), ask which department once up front
so `Open Jobs` results can be read for relevance — Clay returns the job list;
you (the agent) count how many of the returned open roles match that
department when building the JSON in Step 4.

### Step 4: Build the scoring input

Assemble one JSON object per company from the Clay enrichment results:

```json
{
  "email": "jane@meridianlabs.io",
  "company": "Meridian Labs",
  "headcount_growth_pct_6mo": 38,
  "funding": {
    "last_round": "Series B",
    "last_round_amount": 30000000,
    "last_round_date": "2026-03-15"
  },
  "open_jobs_relevant": 3,
  "website_traffic_growth_pct": 22
}
```

Map Clay's free-text/field results into these numeric fields yourself (e.g.
"raised $30M Series B in March 2026" -> `last_round_amount: 30000000,
last_round_date: "2026-03-15"`). Omit a field entirely if Clay didn't return
it — don't guess or default to 0, since the scorer treats a missing field as
"no signal" rather than "bad signal".

Write this array to a temp JSON file (e.g. in the scratchpad directory).

### Step 5: Run the scorer

```bash
python3 .claude/skills/prospect-scoring/scripts/score_signups.py --input <path-to-json>
```

This applies a fixed, transparent point rubric (see `scripts/score_signups.py`
for the exact thresholds) and outputs a Markdown table sorted highest-score
first, with a one-line reason per signal and a tier: **Call today / Call this
week / Nurture / Not yet**. The rubric weights funding recency highest, then
headcount growth, relevant hiring, then traffic growth — tune the thresholds
in the script if the user's ICP prioritizes differently (e.g. a dev-tools
seller may want to weight hiring higher than funding).

### Step 6: Present and offer next steps

Show the ranked table. For the top tier ("Call today"), offer — don't
auto-run — to find the best contact at each company via
`find-and-enrich-contacts-at-company` (e.g. filtered to decision-maker titles
relevant to what the user sells) with an `Email` data point, since that's a
separate credit spend the user should approve per company.

## Notes

- This skill assumes a live, authorized Clay MCP connection. If Clay tools
  aren't available in the session, tell the user and stop — don't fall back
  to guessing company data from general knowledge.
- The scoring rubric is a starting point, not a validated model. Say so, and
  invite the user to adjust weights in `scripts/score_signups.py` once they've
  seen it flag a few calls correctly (or incorrectly).
