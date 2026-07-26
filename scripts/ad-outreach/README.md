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
2. In the Apify Store, find an actor for the Facebook Ads Library and one
   for Google's Ads Transparency Center (search those terms in the Store).
   Note each actor's ID (shown as `username/actor-name` on its page) and
   check its **Input** tab for the exact fields it expects.
3. `cp scripts/ad-outreach/apify_config.example.json scripts/ad-outreach/apify_config.json`
   and fill in the real `facebook_actor_id` / `google_actor_id` and their
   `*_actor_input` objects to match what each actor's Input tab documents
   (search terms + countries for Facebook; advertiser IDs for Google — note
   the Google actor is an *enrichment* tool, not discovery: you need to
   already know advertiser IDs, e.g. from the Facebook side or manually
   found in the Ads Transparency Center UI).
4. `export APIFY_API_TOKEN=...` and run:
   ```
   python3 scripts/ad-outreach/find_leads.py --live
   ```

`find_leads.py --live` calls `tools/apify_client.py` (a minimal, stdlib-only
Apify REST client) and feeds the returned dataset items into the same
`normalize_facebook_ads` / `normalize_google_ads` functions used for the
sample data — this assumes the actor's output uses the same field names as
Meta's/Google's real Ad Library APIs (`ad_archive_id`, `page_name`,
`snapshot.body.text`, ... / `advertiserId`, `advertiserName`, ...), which is
typical for actors scraping those same endpoints, but not guaranteed for
every actor. If a chosen actor uses different field names, adjust the
relevant `normalize_*` function in `find_leads.py` to match. This path
hasn't been tested against a real Apify run (this repo's dev sandbox has no
network access to apify.com) — the HTTP layer (`tools/apify_client.py`) was
verified against a local mock server, but verify the first real `--live`
run's output before relying on it.

## Adding more sources

Add a `load_*` + `normalize_*` function pair in `find_leads.py` that returns
the common lead schema above, and call it from `main()`.
