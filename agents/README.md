# Web Scraping Agents

Claude-powered agents for web research and document extraction, built on
the tool-use loop pattern from [CLAUDE.md](../CLAUDE.md).

## Setup

```bash
pip install -r agents/requirements.txt
crawl4ai-setup          # installs Playwright browsers for Crawl4AI
export ANTHROPIC_API_KEY=sk-...
export FIRECRAWL_API_KEY=fc-...   # optional — enables Firecrawl tools
```

## Agents

### `web_scraper_agent.py` — Firecrawl agent
Uses the Firecrawl API (requires `FIRECRAWL_API_KEY`). Best for clean
markdown extraction, full site crawls, and web search.
```bash
python -m agents.web_scraper_agent "Scrape https://example.com and summarize it"
python -m agents.web_scraper_agent "Map https://docs.example.com and list its sections"
```

### `crawl4ai_agent.py` — Free alternative (no API key)
Uses Crawl4AI with local Playwright. No external API key required.
```bash
python -m agents.crawl4ai_agent "Scrape https://example.com and summarize it"
python -m agents.crawl4ai_agent "Scrape these three pages and compare them: ..."
```

### `research_agent.py` — Unified multi-tool agent
Combines all scraping tools and lets Claude pick the right one per task.
Includes Firecrawl (if API key set), Crawl4AI, Scrapling, AutoScraper,
MarkItDown, and Browser Use.
```bash
python -m agents.research_agent "Extract all prices from https://example.com/shop"
python -m agents.research_agent "Download the PDF at <url> and summarize it"
python -m agents.research_agent "Fill in the contact form at https://example.com/contact"
```

## Tools (in `tools/`)

| File | Library | What it does |
|------|---------|--------------|
| `firecrawl_tool.py` | Firecrawl | Scrape, crawl, map, search via API |
| `crawl4ai_tool.py` | Crawl4AI | Local Playwright scraping, concurrent |
| `scrapling_tool.py` | Scrapling | Fast CSS/XPath element extraction |
| `autoscraper_tool.py` | AutoScraper | ML pattern scraping from examples |
| `markitdown_tool.py` | MarkItDown | PDF/DOCX/XLSX/PPTX → Markdown |
| `browser_use_tool.py` | Browser Use | AI-controlled browser for dynamic sites |
