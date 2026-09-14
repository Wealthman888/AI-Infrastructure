# Growth Partner Revenue Calculator

A production tool for personalized marketing audits and growth-partner sales calls. It turns a
prospect's verified business economics into conservative, expected, and best-case advertising
projections, generates a personalized AI audit, and drives the audit through presentation and
sales-call workflows — without ever presenting a projection as a guaranteed result.

Every number on screen is deterministic: a plain TypeScript calculation engine computes all
figures, and every input is tagged **verified**, **client provided**, **publicly observed**,
**estimated**, or **missing** so the credibility of a projection is always visible alongside the
projection itself.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui-style components · Recharts ·
Zod · React Hook Form · localStorage persistence · a server-side API route calling the
Anthropic API for the AI audit.

## Installation

```bash
npm install
```

## Environment setup

Copy `.env.example` to `.env.local` and set your Anthropic API key:

```bash
cp .env.example .env.local
```

```
ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-opus-4-7   # optional override
```

The key is read only in `app/api/generate-audit/route.ts` (a server-side route handler) and is
never sent to, or bundled into, client-side code. If the key is missing, the AI-audit endpoint
returns a clear error and the rest of the application (calculations, saved audits, presentation
mode, sales-call mode) continues to work fully offline.

## Development commands

```bash
npm run dev         # start the dev server on http://localhost:3000
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm run build        # production build
npm run start         # run the production build
```

## Testing

```bash
npm run test         # vitest run — the calculation engine, qualification score, and
                      # credibility panel logic
npm run test:watch
```

The suite covers the required cases: the full high-ticket-coach worked example, a missing-CPM
scenario (dependent outputs must read "Unavailable", never zero), a capacity-constrained
scenario, a negative-contribution scenario, refund deductions, all five performance-fee models,
the contribution-profit fee's zero-floor, zero-denominator guards, scenario ordering, break-even
math, the qualification score, and the credibility/data-quality panel.

## Calculation definitions

All arithmetic lives in `lib/calculations/engine.ts`. The AI endpoint is given the *results* of
this engine and only interprets them — see `AI_SYSTEM_PROMPT` in `lib/ai/prompt.ts`, which
explicitly instructs the model never to recompute or alter a number.

| Metric | Formula |
| --- | --- |
| Impressions | `monthlyAdSpend / CPM × 1000` |
| Clicks | `impressions × clickThroughRate` |
| Leads / purchases | `clicks × landingConversionRate` |
| Booked calls | `leads × leadToBookedCallRate` (forced to 100% for direct-purchase funnels) |
| Attended calls | `bookedCalls × showRate` (forced to 100% for direct-purchase funnels) |
| Uncapped new customers | `attendedCalls × closeRate` (forced to 100% for direct-purchase funnels) |
| New customers (capacity-adjusted) | `MIN(uncappedNewCustomers, maxCustomerCapacity)` |
| Gross attributed revenue | `newCustomers × averageCollectedSale` |
| Net attributed revenue | `grossAttributedRevenue × (1 − refundRate)` |
| Gross profit before marketing | `netAttributedRevenue × grossMargin` |
| Performance fee (collected-revenue / net-sales models) | `netAttributedRevenue × performanceFeeRate` |
| Performance fee (contribution-profit model) | `MAX(0, (grossProfitBeforeMarketing − adSpend − managementFee) × performanceFeeRate)` |
| Performance fee (fixed bonus) | a flat dollar amount, independent of revenue |
| Contribution after marketing | `grossProfitBeforeMarketing − adSpend − setupFeeAllocated − managementFee − performanceFee` |
| Net ROAS | `netAttributedRevenue / adSpend` |
| Cost per click / lead / booked call / attended call | `adSpend / (that stage's count)` |
| Customer-acquisition cost | `adSpend / newCustomers` |
| Break-even customers | `(adSpend + setupFeeAllocated + managementFee) / (averageCollectedSale × (1 − refundRate) × grossMargin)` |
| Profit multiple | `grossProfitBeforeMarketing / (adSpend + setupFeeAllocated + managementFee + performanceFee)` |
| Incremental revenue | `MAX(0, netAttributedRevenue − verifiedCurrentAttributedRevenue)` |

**Rounding** happens only at display time (`lib/calculations/formatting.ts`); the engine always
returns unrounded numbers internally. Impressions round to the nearest whole number; clicks,
leads, and customers to one decimal; currency to the nearest whole dollar; rates to one decimal
percentage point; ROAS and profit multiple to two decimals.

**Missing data never becomes zero.** Every calculation is done through `Metric` (`number |
"unavailable"`) arithmetic helpers in `lib/calculations/engine.ts` — a missing input or a
division by zero propagates as `"unavailable"` and renders as the literal string "Unavailable,"
never as `0`, `NaN`, or `Infinity`.

**Setup-fee allocation** is a modeling choice: by default the full setup fee is allocated to a
single month's contribution (`setupFeeAmortizationMonths: 1` in `FeeInputs`), matching how a
30-day pilot's economics are usually discussed. Change `setupFeeAmortizationMonths` when calling
`calculateScenario` if you want it spread over a longer period instead.

**Economic status** (`insufficient_data`, `economically_unattractive`, `below_break_even`,
`near_break_even`, `potentially_viable`, `strong_potential`, `capacity_constrained`) is decided by
explicit rules in `determineEconomicStatus()` in `lib/calculations/engine.ts`, based on
contribution sign and magnitude relative to spend, break-even customers vs. projected customers,
and capacity constraints.

## Projection limitations

- Projections are scenario planning, not forecasts or guarantees — every screen that shows them
  repeats this in plain language.
- The qualification score's "assessed" criteria (proven offer, creative assets, sales process,
  buying-signal strength, TikTok advertising gap, launch readiness) are entered by the auditor as
  None/Partial/Strong bands; they are not derived from external data sources.
- The AI audit interprets the calculator's numbers; it is explicitly instructed never to recompute
  or invent figures, but it is still a language model — treat its qualitative narrative (risks,
  discovery questions, creative concepts) as a first draft to review, not as verified fact.
- Saved audits, settings, and scenario presets live in `localStorage` only. There is no backend,
  no multi-user sync, and no database — exporting/importing JSON (Saved Audits page) is the
  supported way to move data between browsers or back up your work.
- The AI-generation rate limiter (`lib/ai/rate-limit.ts`) is in-memory and per server instance;
  it resets on redeploy and does not coordinate across multiple server instances.
- "Cost of waiting," objection responses, the agreement summary, and the follow-up email are all
  deterministic templates driven by this audit's own numbers (`lib/objections.ts`,
  `lib/thirty-day-plan.ts`) — none of them call the AI endpoint, so they're always available even
  without an API key.
- The app does not integrate with any advertising platform, CRM, payment processor, or email
  provider. "Send payment link" and "Book onboarding" open a URL you configure in Settings; "Send
  agreement" copies text to the clipboard. Nothing is sent anywhere automatically.

## How to add a scenario preset

Illustrative planning defaults live in `lib/calculations/presets.ts` as
`DEFAULT_SCENARIO_PRESETS`, keyed by `PresetKey` (`high_ticket_coaching`, `digital_products`,
`ecommerce`, `local_lead_generation`, `saas`). To add a new preset:

1. Add the key to `PresetKey` and `PRESET_LABELS`.
2. Add a `conservative` / `expected` / `best_case` entry to `DEFAULT_SCENARIO_PRESETS` (each is
   `{ cpm, clickThroughRate, conversionRate, leadToBookedCallRate, showRate, closeRate }`; use
   `1` for the last three rates if the preset is for a direct-purchase business).
3. Map one or more `BusinessModel` values to it in `presetKeyForBusinessModel()`.
4. Update the Settings page's editor (`app/settings/page.tsx`) — it renders every key in
   `PRESET_LABELS` automatically, so no further UI change is usually needed.

Users can also edit any preset's numbers directly on the **Settings** page; edits are saved to
`localStorage` and used both as new-audit defaults and by the "Use preset" buttons in Step 4.
"Reset to defaults" clears the override and reverts to the values in this file. All presets are
labeled as illustrative defaults, never as benchmark guarantees.

## Project structure

```
app/                    Routes (dashboard, audits, settings, API)
components/
  ui/                   Small shadcn-style primitives (button, card, input, ...)
  forms/                The five-step audit wizard
  results/              Scenario cards, charts, credibility/qualification panels
  presentation/         Client-presentation-mode components
  ai/                    AI audit panel
lib/
  calculations/         Deterministic engine, presets, formatting, qualification, credibility
  validation/           Zod schemas (form + API request/response)
  storage/               localStorage CRUD for audits and settings
  ai/                     System prompt, tool schema, rate limiter
types/                  Core Audit data model
```

## Known limitations

- No authentication or database, per the brief — this is intentionally a local-first, single-user
  tool.
- The Recharts funnel is rendered as a log-scaled horizontal bar chart rather than Recharts'
  dedicated `Funnel` component: with realistic ratios (tens of thousands of impressions down to a
  handful of customers), `Funnel`'s trapezoid geometry collapsed the lower stages into an
  illegible sliver during testing.
- Import/export is JSON only; there is no CSV or CRM-integration path.
