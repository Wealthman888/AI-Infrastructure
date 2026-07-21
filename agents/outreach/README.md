# Outreach Pipeline — 250–300 Hyper-Personalized Emails

Full strategy: see [PLAYBOOK.md](PLAYBOOK.md). Quick run:

```bash
pip install anthropic requests
export ANTHROPIC_API_KEY=sk-...
export PERPLEXITY_API_KEY=pplx-...

# 1. Build the list conversationally in Claude (Clay MCP / Vibe Prospecting MCP),
#    merge any Origami Agents export, save as prospects.csv
#    (required columns: first_name, title, company, website, email — extra columns
#    like Origami signals are passed through into the personalization prompt)

# 2. Research every prospect with Perplexity (resumable)
python research.py prospects.csv --out prospects_researched.csv

# 3. Edit offer.md (positioning, proof points, CTA)

# 4. Generate 3-touch sequences via the Claude Batch API (50% discount, cached prefix)
python personalize.py prospects_researched.csv --offer offer.md --out emails.csv

# 5. QA emails.csv (drop weak_research rows), then import into Instantly/Smartlead
#    and send 20-30/inbox/day from warmed secondary domains.
```

Files:
- `PLAYBOOK.md` — the end-to-end GTM strategy (list → research → personalize → send)
- `research.py` — Perplexity per-prospect research
- `personalize.py` — Claude batch email generation (claude-opus-4-7, prompt caching)
- `offer.md` — GemLabs offer brief injected into every generation (edit per campaign)
- `prospects.example.csv` — expected input shape
