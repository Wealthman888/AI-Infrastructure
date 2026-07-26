# Tools

Reusable tool wrappers for external APIs and data sources, per `CLAUDE.md`.

## Ad scraper sources

Two vendored scrapers feed the ad-scraper email outreach pipeline
(`scripts/ad-outreach/`). Both are git submodules — run
`git submodule update --init --recursive` after cloning this repo to pull
their code.

| Submodule | Upstream | Finds | Output |
|---|---|---|---|
| [`facebook-ads-library-scraper`](facebook-ads-library-scraper) | [domini-67/facebook-ads-library-scraper](https://github.com/domini-67/facebook-ads-library-scraper) | Businesses running active Facebook/Instagram ads | JSON: `page_name`, `page_profile_uri`, ad copy, CTA, image URLs |
| [`google-ad-transparency-scraper`](google-ad-transparency-scraper) | [sufixZoi/google-ad-transparency-scraper](https://github.com/sufixZoi/google-ad-transparency-scraper) | Businesses running active Google/YouTube ads | JSON: `advertiserName`, `advertiserId`, targeting, YouTube creative URLs |

Both ship as **offline-sample implementations by default** — `main.py` reads
bundled sample JSON (`data/*.sample.json`) unless you configure a live
backend (`api_url` for the Facebook scraper) or set `mode: "online"` in the
Google scraper's settings, which is currently a stub that falls back to
offline data. Neither scrapes live endpoints out of the box; wire up a real
backend before relying on them for production lead volume.

Each has its own `requirements.txt` (Facebook scraper needs `requests`; the
Google scraper is stdlib-only) and `src/config/settings.example.json` for
configuration — see each submodule's README for full CLI/config details.

**Known upstream bug:** at the pinned submodule commits, every `.py` file in
both scrapers has a corrupted first line — a stray `thon` prefix glued onto
the first import (e.g. `thonimport argparse` instead of `import argparse`),
apparently from a broken ```` ```python ```` fence export. Neither `main.py`
will run as committed. `scripts/ad-outreach/find_leads.py` works around this
by reading each submodule's bundled `data/*.sample.json` directly instead of
invoking `src/main.py`. To use the real scrapers, strip the leading `thon`
from each `.py` file's first line in your local submodule checkout (or wait
for/send an upstream fix) before pointing them at a live backend.

See `scripts/ad-outreach/README.md` for how their output feeds the audit +
email outreach pipeline.
