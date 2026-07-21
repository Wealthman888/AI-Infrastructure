# Outreach Pipeline — 250–300 Hyper-Personalized Emails

Full strategy: see [PLAYBOOK.md](PLAYBOOK.md).

**Current stack: Apify (lists) → Perplexity (research + writing) → sequencer (15 inboxes).**

```bash
pip install requests
export APIFY_TOKEN=apify_api_...
export PERPLEXITY_API_KEY=pplx-...

# 1. Pull the list via Apify (default: Apollo.io scraper actor).
#    Build the search in Apollo (founders, 11-50, US, Software), copy the URL into
#    apollo_input.json, then:
python apify_pull.py --input apollo_input.json --out prospects.csv

# 2. Verify emails (MillionVerifier/NeverBounce) — target <2% bounce. Re-save CSV.

# 3. Edit offer.md (positioning, proof points, CTA)

# 4. Research + write 3-touch sequences in one pass (Perplexity, resumable)
python generate_emails.py prospects.csv --offer offer.md --out emails.csv

# 4b. OPTIONAL tier-2: deep research on your top targets (OpenAI web-search agent +
#     direct site evidence). Adds deep hooks + the audit-preview teardown bullets.
export OPENAI_API_KEY=sk-...
python deep_research.py top_targets.csv --limit 30 --out prospects_tier2.csv
python generate_emails.py prospects_tier2.csv --out emails_tier2.csv

# 5. QA emails.csv (drop weak_research rows), import into Instantly/Smartlead,
#    send 20-30/inbox/day across the 15 warmed inboxes per the playbook ramp.
```

Files:
- `PLAYBOOK.md` — the end-to-end GTM strategy (list → research → personalize → send)
- `apify_pull.py` — run an Apify actor (Apollo scraper by default) → normalized prospects.csv
- `generate_emails.py` — Perplexity end-to-end: live research + 3-touch sequence per prospect
- `deep_research.py` — tier-2 deep research for top targets (OpenAI agent + site scraping);
  produces deep hooks + the audit-preview teardown bullets (conversion lever #6)
- `offer.md` — GemLabs offer brief injected into every generation (edit per campaign)
- `prospects.example.csv` — expected CSV shape

Alternates (kept for when useful):
- `research.py` — research-only Perplexity pass (if you want research and writing decoupled)
- `personalize.py` — Claude Batch API writer (higher writing quality, 50% batch discount,
  prompt caching; feed it `research.py` output). Requires ANTHROPIC_API_KEY + `pip install anthropic`.
- Clay MCP / Vibe Prospecting MCP — conversational list building in Claude (credit-based)
