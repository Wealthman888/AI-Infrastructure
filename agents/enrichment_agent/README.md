# Enrichment Agent

Fills in missing fields on a record (company/contact) via a Claude tool-use loop.

## Setup

```bash
cd agents/enrichment_agent
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY
```

## Run

```bash
python agent.py "Enrich Acme Corp with company_size and tech_stack"
```

## Extending

- `enrich_record` in `agent.py` is a stub (returns null fields). Wire it up
  to a real data provider — this workspace already has Clay and Vibe
  Prospecting MCP connections available from Claude Code sessions; for a
  standalone script like this one, call their HTTP APIs directly instead.
- Feeds naturally from `agents/scraper_agent`: scrape raw leads, then pass
  each record through this agent to fill in missing data points.
- Uses `claude-opus-4-7` by default (multi-step reasoning per the project's
  model guidance in `/CLAUDE.md`). Override with `ENRICHMENT_MODEL` for
  cheaper/faster runs.
