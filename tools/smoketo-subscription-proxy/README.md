# smoketo-subscription-proxy

Backend for the SmoKeto "edit this week's meals" flow. Lets an already-subscribed
customer update their live Appstle subscription's meal line items directly from
the storefront — no cart, no checkout.

Deployed on Vercel (team **Gem Labs**, project `smoketo-subscription-proxy`):
`https://smoketo-subscription-proxy.vercel.app`

## Why a backend at all

The Appstle Subscriptions API key must never be sent to the browser — anyone
viewing page source could steal it and edit any customer's subscription or
billing. This is a small serverless proxy that holds the key server-side and
exposes two narrow endpoints the theme calls instead.

## Endpoints

- `GET /api/get-weekly-box` — returns the calling customer's active
  subscription contract id + current line items (read-only), so the
  storefront can pre-populate "My Box" before any edits.
- `POST /api/update-weekly-meals` — calls Appstle's
  `POST /api/external/v2/subscription-contract-details/replace-variants-v3`
  to replace the contract's meal line items with the new selection.
  Body: `{ newVariants: {variantId: qty, ...}, oldVariants: [variantId, ...] }`.

Both endpoints **require a signed Shopify App Proxy request** — see below.
Neither trusts a client-supplied customer id.

## Required setup (not doable via the Shopify Admin API — must be done in Shopify admin)

1. **Shopify admin → Settings → Apps and sales channels → Develop apps** —
   create (or reuse) a custom app. Under that app's **App proxy** config:
   - Subpath prefix: `apps`
   - Subpath: `smoketo-sub` (must match `SW_PROXY_BASE` in
     `templates/page.smoketo-subscribe.liquid` — currently `/apps/smoketo-sub`)
   - Proxy URL: `https://smoketo-subscription-proxy.vercel.app`
   Copy the app's **Client Secret**.
2. In the Vercel project's environment variables, set:
   - `APPSTLE_API_KEY` — the Appstle Subscriptions API key (`X-API-Key` auth).
   - `SHOPIFY_PROXY_SECRET` — the Client Secret from step 1. This is what
     `lib/verifyProxy.js` uses to verify Shopify actually signed the request
     (HMAC-SHA256 over the sorted, concatenated query params, excluding
     `signature`) and to trust the `logged_in_customer_id` param Shopify
     injects for a genuinely logged-in customer.
3. Redeploy (env var changes require a new deployment to take effect).

## Known gap — needs live verification

`GET .../subscription-contract-details/subscription-fulfillments/{contractId}`
(used by `get-weekly-box` to read a contract's current line items) had no
confirmed response schema available when this was built — the dev
environment's network policy blocks all of `appstle.com`, so it could not be
test-called directly. `extractVariantsFromFulfillment()` in
`api/get-weekly-box.js` defensively tries the two most likely shapes
(GraphQL-style `lines.edges[].node`, and classic REST `line_items[]`). Once
this is live and testable end-to-end, check the real response shape and
adjust that function if neither guess matches.

Everything else (base URL, `X-API-Key` auth, the `replace-variants-v3`
request/response schema) was confirmed directly from Appstle's own Swagger UI.

## Design choices baked into `update-weekly-meals.js` (adjust if wrong)

- `eventSource: 'MERCHANT_EXTERNAL_API'` — this proxy calling on the
  customer's behalf, not Appstle's own hosted `CUSTOMER_PORTAL`.
- `stopSwapEmails: true` — weekly meal-picking is routine/expected, and the
  storefront already shows its own confirmation toast, so Appstle's
  "your subscription changed" email is suppressed to avoid a weekly spam
  email. Flip to `false` if you'd rather Appstle send a receipt each time.
- `carryForwardDiscount: 'PRODUCT_THEN_EXISTING'` — taken from Appstle's own
  example value; no more specific guidance was available.
- Only the customer's **first** active contract id is used
  (`contractIds[0]`) — correct for this store's one-subscription-per-customer
  model. Revisit if a customer could ever have more than one.
