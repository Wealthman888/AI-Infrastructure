# Cold Email Sequence — Ad Audit Offer
# Target: High-ticket businesses actively running paid ads (law firms, med spas, SaaS, real estate, finance)
# Objective: Book a discovery call → sell audit ($1,500–$2,500) → upsell management retainer ($3k–$10k/mo)
# Cadence: Day 1 → Day 3 → Day 5 → Day 8 → Day 12

---

## EMAIL 1 — Pattern Interrupt (Day 1)

**Subject:** your [Google/Meta] ads are leaking money

**Body:**

Hey {{first_name}},

Ran a quick check on {{company_name}}'s ad account from the outside.

Three things jumped out:

1. Your ads are running without a retargeting sequence — you're paying for cold traffic and letting it walk away
2. No sign of Consent Mode V2 — Meta is likely misattributing 20–40% of your conversions
3. Creative fatigue patterns that usually show up 6–8 weeks before ROAS collapses

Not guessing — this is what I see across every account in {{industry}} spending ${{spend_range}}/month.

Worth a 15-minute call to see if it's fixable fast?

{{your_name}}

---

## EMAIL 2 — Social Proof (Day 3)

**Subject:** how {{similar_company}} went from {{before}} to {{after}}

**Body:**

Hey {{first_name}},

Didn't hear back — figured I'd share what happened with a {{industry}} client before you decide if this is worth your time.

They were spending $18k/month on Google and Meta. Looked fine on the surface.

When we ran the full audit:
- 34% of budget was going to irrelevant search terms (negative keyword list hadn't been updated in 8 months)
- Performance Max was cannibalizing branded search and inflating ROAS numbers
- Their landing page had a 7-second load time on mobile — killing 60%+ of conversions

Fixed those three things in 30 days. Same $18k budget. Revenue went from $54k to $91k that month.

The audit itself took 48 hours.

That's what I'm offering you — a full diagnostic of everything wrong with your account, prioritized by revenue impact, with a step-by-step fix list.

Worth a quick call?

{{your_name}}

---

## EMAIL 3 — Specific Insight (Day 5)

**Subject:** one thing I noticed about {{company_name}}'s ads

**Body:**

Hey {{first_name}},

Quick one.

I looked at {{company_name}}'s Meta Ad Library.

You've been running the same {{ad_type}} creative since {{approximate_date}}. On Meta, creative fatigue typically hits at 6–8 weeks with the same audience. Past that, your CPM climbs and your ROAS drops — even if you don't change anything else.

If your numbers have been slipping and you can't figure out why, that's likely a big piece of it.

I do a full creative audit as part of the ad account diagnostic — scores each asset, flags fatigue, and gives you a 90-day creative rotation plan.

If you want me to run it on your account, reply and I'll send over a link to grab time.

{{your_name}}

P.S. — If your numbers are actually great right now, ignore this. But if there's any softness in your ROAS, it's worth 15 minutes.

---

## EMAIL 4 — The Offer (Day 8)

**Subject:** here's exactly what I'll do

**Body:**

Hey {{first_name}},

I'll make this simple.

Here's what the audit covers:

**Google Ads** — 80-point check: wasted spend, search term leakage, bid strategy gaps, Quality Score issues, PMax cannibalization, conversion tracking health

**Meta Ads** — 50-point check: Pixel + CAPI health, creative diversity score, Advantage+ settings, audience overlap, attribution window alignment

**Tracking** — Consent Mode V2, server-side tracking, GA4 attribution model, conversion deduplication

**Creative** — fatigue detection, creative diversity scoring, platform-native compliance

**Budget** — allocation by platform and funnel stage, scaling readiness, kill/scale recommendations

**Landing pages** — message match score, mobile speed, CTA alignment

Deliverable: A prioritized action plan scored 0–100. Every finding is tagged Critical / High / Medium / Low with an exact fix.

Investment: ${{audit_price}}

Takes 48 hours. Most clients recover the fee in the first week of fixes.

Want to move forward? Reply "yes" and I'll send the onboarding link.

{{your_name}}

---

## EMAIL 5 — Break-Up (Day 12)

**Subject:** closing your file

**Body:**

Hey {{first_name}},

I've reached out a few times and haven't heard back — totally fine, timing might just be off.

I'm closing your file today so I stop cluttering your inbox.

If you ever want a second set of eyes on your ad accounts — especially if ROAS softens or spend efficiency drops — I'm easy to find.

One last thing: if you want to see what the audit actually looks like before committing, I'm happy to send a sample report from a similar {{industry}} account. No pitch, just the deliverable so you can judge for yourself.

Either way, good luck with the campaigns.

{{your_name}}

---

## Personalization Variables

| Variable | Source |
|---|---|
| `{{first_name}}` | LinkedIn / Apollo / Clay |
| `{{company_name}}` | Company website |
| `{{industry}}` | LinkedIn / Crunchbase |
| `{{spend_range}}` | Estimate from SimilarWeb / ad library |
| `{{ad_type}}` | Meta Ad Library check |
| `{{approximate_date}}` | Meta Ad Library — "started running" date |
| `{{audit_price}}` | $1,500 entry / $2,500 full / $4,000 enterprise |
| `{{similar_company}}` | Real case study or anonymized |
| `{{before}}` / `{{after}}` | Real results from past client |

---

## Send Rules

- Send from a warmed domain (not your main domain)
- Max 40–50 emails/day per inbox; use 4–5 inboxes to hit 200/day
- Plain text only — no images, no heavy HTML, no unsubscribe banners (kills deliverability)
- Personalized first line on every email (use Clay or Instantly AI for scale)
- Pause sequence the moment someone replies
