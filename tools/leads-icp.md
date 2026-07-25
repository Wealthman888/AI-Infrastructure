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

3. **`scripts/leads/score_and_format_leads.py`** — merges both exports, re-applies the quality filter defensively, keyword-scores each business for high-margin service mix, drops anything with no email found, and writes an Instantly-ready CSV (`email, website, company, score, matched_keywords`).

```bash
python3 scripts/leads/score_and_format_leads.py maps_export.json emails_export.json leads.csv --min-score 1
```

## High-margin signal (service mix)

Botox, fillers, laser, CoolSculpting, body contouring, microneedling, PRP, HydraFacial, IV therapy, and similar keyword-matched against business name/category — see `HIGH_MARGIN_KEYWORDS` in the script. `--min-score 0` includes everything with an email, ignoring this signal, if you want volume over qualification.

## Red flags (filter out manually — not automatable from Maps data alone)

- Under 6 months old
- Single-service tiny studios (lash/brow only)
- No paid ad activity (check via a Facebook Ads Library scraper actor per domain)
- No hiring/expansion signals if you want growth-stage-only (check via a job-board scraper)
