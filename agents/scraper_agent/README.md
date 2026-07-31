# Scraper Agent

Fetches pages and extracts structured data via a Claude tool-use loop,
using [ScrapeGraphAI](https://github.com/ScrapeGraphAI/Scrapegraph-ai)'s
`SmartScraperGraph` as the underlying scrape+extract engine.

## Setup

```bash
cd agents/scraper_agent
pip install -r requirements.txt
playwright install   # required by scrapegraphai for page fetching
cp .env.example .env # fill in ANTHROPIC_API_KEY
```

## Run

```bash
python agent.py "Scrape https://example.com and list the headings"
```

## How it works

The outer loop (`run` in `agent.py`) is a normal Claude tool-use agent: it
decides which URLs are relevant and what to extract from each. Each
`smart_scrape` tool call hands the URL and an extraction prompt to
`SmartScraperGraph`, which does its own fetch + LLM-driven parsing and
returns structured data.

## Extending

- Restrict targets via `SCRAPER_ALLOWED_DOMAINS` in `.env` before pointing
  this at anything beyond local testing.
- `smart_scrape` in `agent.py` builds a fresh `SmartScraperGraph` per call
  with `headless: True`. Add scraper-level config (rate limiting, proxies,
  caching) via `graph_config` there if needed.
- Uses `claude-haiku-4-5-20251001` by default for both the orchestrator and
  ScrapeGraphAI's own LLM (high-frequency/cost-sensitive per the project's
  model guidance in `/CLAUDE.md`). Override with `SCRAPER_MODEL` if a run
  needs more reasoning.
