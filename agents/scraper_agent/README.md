# Scraper Agent

Fetches pages and extracts structured data via a Claude tool-use loop.

## Setup

```bash
cd agents/scraper_agent
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY
```

## Run

```bash
python agent.py "Scrape https://example.com and list the headings"
```

## Extending

- `fetch_url` in `agent.py` is a stub (returns raw page text). Replace it
  with site-specific selectors, pagination handling, and rate limiting.
- Restrict targets via `SCRAPER_ALLOWED_DOMAINS` in `.env` before pointing
  this at anything beyond local testing.
- Uses `claude-haiku-4-5-20251001` by default (high-frequency/cost-sensitive
  per the project's model guidance in `/CLAUDE.md`). Override with
  `SCRAPER_MODEL` if a run needs more reasoning.
