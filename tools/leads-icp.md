# Med Spa Lead Sourcing (Apify)

ICP: "cash ready" independent med spas — real revenue flow and budget, not just any spa with a website. Used for the Data Audits / Audit To Client funnel.

## Apify pipeline

1. **Google Maps Scraper** — search terms `med spa`, `medical spa`, `aesthetics clinic`, `injectables`, scoped to target metro areas (cash-ready spas cluster by income zip, not spread evenly by state).
   - Minimum rating: **4.0+**
   - Minimum review count: **100+**
   - Must have website: **on**
   - Must have phone: **on**
   - Exclude permanently/temporarily closed: **on**
   - Category: exact-match "Medical spa" / "Skin care clinic" where the actor supports it, not generic "Spa" (pulls in massage/nail places)

2. **Email/contact-scraper actor**, run against each business's website from step 1's output — Google Maps rarely includes email directly. Output should include, per site: the source URL and any emails found on the page (contact/about pages).

3. **Meta Ads Scraper** (optional but recommended) — run against each business's name/page. Already running paid ads is a stronger buy signal than the keyword match alone: it means they've already accepted "spend money to get customers" as normal.

4. **`scripts/leads/score_and_format_leads.py`** — merges the exports, re-applies the quality filter defensively, keyword-scores each business for high-margin service mix, adds a bonus for active Meta ads, drops anything with no email found, and writes an Instantly-ready CSV (`email, website, company, score, matched_keywords, running_meta_ads`).

```bash
python3 scripts/leads/score_and_format_leads.py maps_export.json emails_export.json leads.csv \
    --ads-export ads_export.json --min-score 1
```

## Scoring

- **Service-mix keywords** (+1 each): Botox, fillers, laser, CoolSculpting, body contouring, microneedling, PRP, HydraFacial, IV therapy, and similar — matched against business name/category, see `HIGH_MARGIN_KEYWORDS` in the script.
- **Active Meta ads** (+3): outweighs a single keyword match, since ad spend is a more direct budget signal than service mix alone.
- `--min-score 0` includes everything with an email, ignoring both signals, if you want volume over qualification.

## Field-name caveat

`load_email_map()` and `load_ads_map()` in the script guess at common Apify actor output field names (`emails`/`contactEmails`, `pageName`/`isActive`, etc.). Different actors use different schemas — send a real sample export (even just the first record or two) and the field mapping will get corrected to match exactly, rather than staying a guess.

## Red flags (filter out manually — not automatable from Maps data alone)

- Under 6 months old
- Single-service tiny studios (lash/brow only)
- No hiring/expansion signals if you want growth-stage-only (check via a job-board scraper)
