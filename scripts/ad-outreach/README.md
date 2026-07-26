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
   `tools/README.md`). Pass `--live` to fetch real ads via Apify Actors
   instead — see "Going live" below.

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

## Going live

Real leads come from Apify Actors rather than the (broken) vendored
scrapers' own scraping code:

1. Sign up at [apify.com](https://apify.com) and grab an API token from
   *Settings → Integrations*.
2. `cp scripts/ad-outreach/apify_config.example.json scripts/ad-outreach/apify_config.json`.
   The example file already has candidate actors filled in:
   - **Facebook**: `apify/facebook-ads-scraper` (official Apify actor).
     Discovery works by giving it a Facebook Ad Library *search URL* you
     build yourself (keyword + country baked into the URL), not a plain
     `searchTerms` field.
   - **Google**: `parseforge/google-ads-scraper` — notable because it
     supports keyword-based *discovery* (mixing keywords, advertiser IDs,
     and domains in one run), unlike most Google Ads Transparency actors
     which only enrich advertiser IDs you already know.

   **These are unverified, best-effort picks** — reconstructed from
   search-engine snippets because no environment available to us could
   actually load apify.com's pages (both this repo's sandbox and a
   separate "unrestricted" environment we tried got blocked fetching it).
   Before running, open each actor's page in the Apify Console yourself and
   confirm the actor ID and its **Input** tab's exact field names against
   what's in `apify_config.example.json`; fix anything that's changed or
   wrong. Cheaper/alternate actors are noted in the `_facebook_actor_notes`
   / `_google_actor_notes` fields if the primary picks don't work out.
3. `export APIFY_API_TOKEN=...` and run:
   ```
   python3 scripts/ad-outreach/find_leads.py --live
   ```

`find_leads.py --live` calls `tools/apify_client.py` (a minimal, stdlib-only
Apify REST client, verified against a local mock server) and feeds the
returned dataset items into the same `normalize_facebook_ads` /
`normalize_google_ads` functions used for the sample data — this assumes
each actor's *output* uses field names close to Meta's/Google's real Ad
Library APIs (`ad_archive_id`, `page_name`, `snapshot.body.text`, ... /
`advertiserId`, `advertiserName`, ...), which is typical but, again,
unverified for these specific actors. Treat the first `--live` run as a
smoke test: inspect `leads.json` closely and adjust the relevant
`normalize_*` function in `find_leads.py` if fields come back empty or
misnamed.

## Adding more sources

Add a `load_*` + `normalize_*` function pair in `find_leads.py` that returns
the common lead schema above, and call it from `main()`.
