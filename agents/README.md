# Web Scraper Agent

Claude-powered agent that researches the web using [Firecrawl](https://firecrawl.dev)
to scrape, crawl, map, and search pages, following the tool-use loop pattern
described in the project [CLAUDE.md](../CLAUDE.md).

## Setup

```bash
pip install -r agents/requirements.txt
export ANTHROPIC_API_KEY=sk-...
export FIRECRAWL_API_KEY=fc-...
```

## Usage

```bash
python -m agents.web_scraper_agent "Scrape https://example.com and summarize the page"
python -m agents.web_scraper_agent "Map https://docs.example.com and list its main sections"
```

## Files

- `web_scraper_agent.py` — the agent loop (Claude + tool-use).
- `../tools/firecrawl_tool.py` — reusable Firecrawl wrapper (scrape/crawl/map/search)
  shared by any agent that needs web access.
