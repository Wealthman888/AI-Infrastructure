# Camofox — Stealth Browser Scraping

## Skill Purpose
Scrape pages that block headless browsers or require passing bot-detection checks, using a stealth browser instead of a paid per-request scraping API. Modeled on `jo-inc/camofox-browser`, which is built on [Camoufox](https://github.com/daijro/camoufox) — a hardened Firefox build that spoofs `navigator`, WebGL, AudioContext, and WebRTC fingerprints at the C++ engine level (not patched in JS), so the automated browser is not detectable as automated.

## When to Use
- A scrape fails or is blocked by bot/fingerprint detection (Cloudflare challenge, "are you a robot", inconsistent headless fingerprint).
- User asks to scrape a site known to be aggressive about blocking automation.
- User wants to avoid paying for a stealth-scraping API and would rather run a local stealth browser.
- Triggered by `/camofox <url>` or `/camofox <scraping task>`.

## How to Execute

### Step 1: Install Camoufox
```bash
pip install camoufox[geoip]
python3 -m camoufox fetch
```

### Step 2: Scrape with the stealth browser
Use `scripts/scrape.py`, which drives Camoufox through its Playwright-compatible API:
```bash
python3 scripts/scrape.py "https://example.com" --out page.html
```

This launches a real (patched-at-the-engine) Firefox instance rather than a vanilla headless browser, so `navigator.webdriver`, WebGL renderer strings, AudioContext fingerprints, and WebRTC leaks all read as a genuine browser instead of an automation tool.

### Step 3: Extract data
Parse the saved HTML (or extend `scripts/scrape.py` to run a CSS/XPath extraction in-page before saving) with your normal scraping logic — Camoufox only solves the detection problem, not the parsing problem.

### Step 4: Respect scope
Only scrape pages the user has the right to access, follow `robots.txt` / site terms where applicable, and avoid hammering a target with concurrent requests. This skill is for legitimate data collection, not for evading access controls on systems you're not authorized to access.

## Notes
- Camoufox's fingerprint spoofing happens in the browser engine itself, so it survives JS-level fingerprinting checks that catch most "stealth-mode Puppeteer/Playwright" setups.
- Prefer this over a paid stealth-scraping API when running scrapes locally/in this environment is acceptable; use a hosted API instead when you need IP rotation at scale.
