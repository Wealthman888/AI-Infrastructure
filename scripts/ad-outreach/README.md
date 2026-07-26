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
     Discovery works either via a Facebook Ad Library *search URL* you
     build yourself (`startUrls`, keyword + country baked into the URL) or
     a plain `searchTerms` + `countryCode` pair.
   - **Google**: `parseforge/google-ads-scraper` — notable because it
     supports keyword-based *discovery* (via `searchTerms`, optionally
     mixed with `advertiserIds` / `searchDomains` for known targets in the
     same run), unlike most Google Ads Transparency actors which only
     enrich advertiser IDs you already know.

   **Both actor IDs are confirmed to be real, live Apify Store listings**
   (checked via web search). Their exact input/output field names,
   however, are still **best-effort, not live-verified** — we could not
   confirm them directly because this repo's sandbox (and every other
   environment we've tried so far) has its outbound network policy block
   `api.apify.com` *and* `apify.com` entirely, so neither the Apify API nor
   the Console/Store pages are reachable to double-check the **Input**
   tab. Before running for real, open each actor's page in the Apify
   Console yourself from an unrestricted network and confirm the exact
   field names in `apify_config.example.json`; fix anything that's changed
   or wrong. Cheaper/alternate actors are noted in the
   `_facebook_actor_notes` / `_google_actor_notes` fields if the primary
   picks don't work out.
3. `export APIFY_API_TOKEN=...` and run:
   ```
   python3 scripts/ad-outreach/find_leads.py --live
   ```

`find_leads.py --live` calls `tools/apify_client.py` (a minimal, stdlib-only
Apify REST client, verified against a local mock server) and feeds the
returned dataset items into the same `normalize_facebook_ads` /
`normalize_google_ads` functions used for the sample data.
`normalize_facebook_ads` assumes Meta's own Ad Library API field names
(`ad_archive_id`, `page_name`, `snapshot.body.text`, ...), which the
official Apify actor is likely to mirror but which remains unverified here.
`normalize_google_ads` expects one dataset item per ad *creative* with
fields matching `parseforge/google-ads-scraper`'s own output schema
(`advertiserId`, `advertiserName`, `creativeId`, `domain`, `format`,
`globalImpressions`, ...) — this is a real, corroborated schema (found via
its output-schema doc page) and is notably **not** the same shape as
Google's raw Ads Transparency Center API that an earlier version of this
function assumed. Both remain unverified against a real run for the reason
above. Treat the first `--live` run as a smoke test: inspect `leads.json`
closely and adjust the relevant `normalize_*` function in `find_leads.py`
if fields come back empty or misnamed.

## Adding more sources

Add a `load_*` + `normalize_*` function pair in `find_leads.py` that returns
the common lead schema above, and call it from `main()`.
