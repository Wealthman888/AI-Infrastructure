# Ad-Scraper Email Outreach

Find businesses that are actively running ads, audit their marketing, and
send them outreach emails.

## Pipeline

1. **Find leads.** `python3 scripts/ad-outreach/find_leads.py` normalizes ad
   data from the two scraper sources in `tools/` (see `tools/README.md`)
   into `scripts/ad-outreach/leads.json` — one row per business, deduped by
   name, with a `profile_url` (Facebook page or the advertiser's landing
   page) and a sample ad snippet where available.

   By default the sources are the scrapers' bundled sample data, since the
   pinned submodule commits ship a broken `src/main.py` (see the warning in
   `tools/README.md`) and have no live backend configured. Point a working
   scraper backend at real search terms / advertiser IDs to get real leads.

2. **Audit each lead.** For each lead's `profile_url` (or, better, their
   real business website if you can resolve one from the Facebook page /
   landing page), run `/market audit <url>` to generate a scored
   `MARKETING-AUDIT.md` — this is what the outreach email leads with.

3. **Draft outreach.** Use `/market emails` (or write manually) to turn the
   audit's top findings into a short, specific cold email — mention the ad
   they're running as the hook ("saw your ad for X...") and the single
   biggest opportunity from the audit. Create the draft with the Gmail MCP
   `create_draft` tool rather than sending directly, so a human reviews and
   sends it.

## Lead schema (`leads.json`)

```json
{
  "business_name": "Debonair Men's Salon",
  "source": "facebook_ads_library",
  "source_id": "571062419989773",
  "profile_url": "https://www.facebook.com/debonairmensalon/",
  "sample_ad_text": "Time is money, and we're saving you both! ...",
  "ad_platforms": ["FACEBOOK", "INSTAGRAM"],
  "engagement": 87467
}
```

`source` is `facebook_ads_library` or `google_ad_transparency`. Leads found
by both sources get a `sources` list instead of a single `source`.

## Adding more sources

Add a `load_*` + `normalize_*` function pair in `find_leads.py` that returns
the common lead schema above, and call it from `main()`.
