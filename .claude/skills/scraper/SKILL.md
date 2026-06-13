# Scraper

## Skill Purpose
Scrape any website for structured data using **ScrapeGraph AI** — an open-source, MIT-licensed Python library that drives LLMs to extract JSON from web pages without writing CSS selectors or XPath rules. Describe what you want in plain English; the model figures out the rest.

## When to Use
- User asks to scrape, extract, or pull data from a URL
- User wants structured data (JSON) from a website
- User needs to monitor, aggregate, or pipeline web content
- User asks to build a scraper for LinkedIn, Amazon, Zillow, job boards, email directories, or any public site
- Triggered by `/scraper <url> <what to extract>` or `/scraper`

## How to Execute

### Step 1: Install Dependencies

```bash
pip install scrapegraphai
playwright install
```

Use a virtual environment to isolate dependencies:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install scrapegraphai
playwright install
```

### Step 2: Choose an LLM Backend

| Backend | Cost | Speed | Privacy | Best For |
|---|---|---|---|---|
| `claude-haiku-4-5-20251001` | Pennies/scrape | Fast | Cloud | High-volume, cost-sensitive jobs |
| `claude-sonnet-4-6` | Low | Fast | Cloud | Complex multi-field extraction |
| `gpt-4o-mini` | Pennies/scrape | Fast | Cloud | General use |
| `ollama` (local) | Free | Slower | Full | Private/sensitive data |

Per CLAUDE.md: use `claude-haiku-4-5-20251001` for high-frequency scraping; use `claude-opus-4-7` only when deep reasoning is needed for very complex pages.

### Step 3: Single-Page Extraction (SmartScraperGraph)

```python
from scrapegraphai.graphs import SmartScraperGraph

# Anthropic backend (preferred in this project)
config = {
    "llm": {
        "api_key": "YOUR_ANTHROPIC_API_KEY",  # or use os.environ["ANTHROPIC_API_KEY"]
        "model": "anthropic/claude-haiku-4-5-20251001",
    },
    "verbose": True,
}

scraper = SmartScraperGraph(
    prompt="Extract the product name, price, rating, and number of reviews.",
    source="https://example.com/product-page",
    config=config,
)

result = scraper.run()
print(result)
# → {"product_name": "...", "price": "...", "rating": "...", "reviews": "..."}
```

### Step 4: Multi-URL Parallel Scraping (SmartScraperMultiGraph)

```python
from scrapegraphai.graphs import SmartScraperMultiGraph

urls = [
    "https://example.com/page-1",
    "https://example.com/page-2",
    "https://example.com/page-3",
]

scraper = SmartScraperMultiGraph(
    prompt="Extract the job title, company, location, and salary if listed.",
    source=urls,
    config=config,
)

results = scraper.run()
# → list of dicts, one per URL
```

### Step 5: Search-Based Scraping (SearchGraph)

```python
from scrapegraphai.graphs import SearchGraph

scraper = SearchGraph(
    prompt="Find the top 10 Python web scraping libraries with their GitHub star counts.",
    config=config,
)

result = scraper.run()
```

### Step 6: Generate a Reusable Script (ScriptCreatorGraph)

Use this when you want to produce a standalone `.py` file the user can run repeatedly:

```python
from scrapegraphai.graphs import ScriptCreatorGraph

scraper = ScriptCreatorGraph(
    prompt="Extract all job listings: title, company, location, salary, and URL.",
    source="https://jobs.example.com",
    config=config,
)

script = scraper.run()
print(script)  # prints Python source code; save it to a .py file
```

### Step 7: Using Ollama (Fully Free, Local)

Requires Ollama installed and running (`ollama serve`):

```python
config = {
    "llm": {
        "model": "ollama/llama3.2",
        "model_tokens": 8192,
        "base_url": "http://localhost:11434",
    },
    "verbose": True,
}
```

## Common Scraping Targets

| Target | Useful Fields to Extract |
|---|---|
| LinkedIn profiles | Name, title, company, location, skills, experience |
| Amazon products | Name, price, rating, review count, ASIN, availability |
| Zillow listings | Address, price, beds/baths, sqft, agent, listing URL |
| Glassdoor reviews | Company, rating, pros, cons, role, date |
| Twitter/X profiles | Bio, follower count, recent posts |
| Job boards | Title, company, location, salary, description, apply URL |
| Email directories | Name, email, company, phone |

## Prompt Caching (Per CLAUDE.md)

When building an agent that calls ScrapeGraph in a loop with a large system prompt, cache the static config block:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [{
            "type": "text",
            "text": "<your large scraping prompt>",
            "cache_control": {"type": "ephemeral"},
        }]
    }]
)
```

## Rate Limiting & Ethics

- Always check `robots.txt` before scraping: `https://<domain>/robots.txt`
- Add `time.sleep(1)` between requests for polite crawling
- Use proxy rotation for large-scale jobs (required for LinkedIn, Amazon)
- Never scrape behind authentication without explicit permission
- Prefer official APIs when available (they're more stable than scrapers)

## Scaling & Cost

| Scale | Approach | Est. Cost |
|---|---|---|
| 1–100 pages | Direct API (haiku) | < $0.01 |
| 100–10,000 pages | Multi-graph + async | $0.01–$1 |
| 10,000+ pages | Ollama local + proxy pool | ~$0 inference |

## Output Format

When the user runs `/scraper`, deliver:
1. A working Python script saved to `scripts/scraper_<target>.py`
2. Sample JSON output (first result printed or saved to `output.json`)
3. A one-line summary of what was extracted and from where

## Troubleshooting

| Error | Fix |
|---|---|
| `playwright._impl._errors.TimeoutError` | Increase timeout: add `"browser_type": "playwright"` and set `"headless": False` to debug |
| `RateLimitError` from Anthropic | Switch to `claude-haiku-4-5-20251001` or add `time.sleep()` between calls |
| Empty result dict | Rewrite prompt to be more specific; add field names explicitly |
| JavaScript-heavy page not loading | ScrapeGraph uses Playwright by default — ensure `playwright install` ran |
| `ModuleNotFoundError: scrapegraphai` | Activate venv: `source .venv/bin/activate` |
