# GemLabs Authority Sprint — 90 Days to a Paid-Audit Business

**Goal:** build the trust score and public presence (currently 34/100 per MARKETING-AUDIT.md) so
that by ~day 90 the cold CTA can flip from *free audit* to *paid systems & content audits*
($1,500–$2,500), with implementation deals closing faster behind them.

**The engine:** the outreach machine and the authority machine feed each other. Every free audit
produces proof material; every piece of proof raises reply, booking, and close rates on the next
batch. Run both tracks in parallel — neither works as well alone.

---

## The proof-capture loop (do this on EVERY audit and client — non-negotiable)

1. **During the audit call:** note 1–2 specific numbers (current lead response time, ad waste
   found, hours/week on manual work). These become case-study raw material.
2. **On every closed client, at day 30:** capture the before/after metric while it's fresh
   ("response time 4h → 8min", "12 hours/week reclaimed"). One paragraph + numbers = a case study.
3. **Testimonial ask (from the action plan):** "Could you write 1–2 sentences on what changed
   after working with us?" → route to **Clutch first**, website second.
4. **Content flywheel:** every audit teardown (anonymized) becomes a LinkedIn post — "we audited a
   $5M SaaS company's sales stack; here are the 3 leaks we found." Audits are content.

## Day 0–14 — Foundations (mostly one-time setup)

| Action | Owner | Impact |
|---|---|---|
| Claim Clutch.co profile; request reviews from last 3 clients | Founder | #1 B2B agency trust signal; est. $3–8K/mo pipeline alone |
| Create Google Business Profile | Founder | Branded-search trust |
| Fix site rendering (Prerender.io fastest — 1–2 hrs) + sitemap + meta descriptions | Dev | Unlocks all SEO; without it Google sees an empty page |
| Publish ONE case study with real numbers on the site | Founder | The single highest-converting agency asset |
| Rewrite homepage hero to outcome-led (Option A/B in GEMLABS-ACTION-PLAN.md) | Copy | +15–25% conversion on the traffic outreach generates |
| Add real email + testimonials above the fold | Dev | Prospects WILL check the site before booking an audit |

**Why this matters for the cold campaign specifically:** a meaningful share of positive repliers
visit the website before booking. A 34/100 site silently kills booked audits that the emails earned.

## Day 15–45 — Presence

- **LinkedIn 3×/week (founder account):** rotate three post types — audit teardowns (anonymized),
  build walkthroughs ("how we cut response time to 8 minutes"), and lessons/opinions. Prospects
  from the sequences will look the founder up; the profile should confirm the emails' claims.
- **Directory listings:** g2.com, sortlist.com, designrush.com, upcity.com (free, one afternoon).
- **Publish audit findings as posts within 48h of each audit** — fastest content loop available.
- **Collect 3+ Clutch reviews** (from audit-only engagements too — reviewers don't need to be
  $10K clients).

## Day 46–90 — Authority

- 2 more case studies published (from the first outreach-batch clients hitting day 30)
- First 2 SEO articles targeting "AI lead generation agency", "revenue automation for SaaS"
- 1 partnership conversation/week with complementary agencies (web design, CRO, HubSpot partners)
  — referral deals at 10–20% rev share
- **Flip test:** run 1 inbox segment with the paid-audit CTA ($1,500 systems & content audit,
  credited toward builds) against the free-audit control. Flip fully when the paid CTA books ≥60%
  of what free books.

## GEO & Content Track — become the answer AI engines cite

**Prerequisite (blocking):** the site rendering fix from Day 0–14. AI crawlers (GPTBot,
PerplexityBot, ClaudeBot) read raw HTML and handle JS worse than Google — until Prerender.io/SSR
ships, nothing below is visible to them. Verify: `curl -A "GPTBot" https://gemlabsagency.com`
must return real content, and robots.txt must NOT block GPTBot/PerplexityBot/ClaudeBot.

### Two mechanisms, two clocks
1. **Defensive (works immediately):** positive repliers Google us or ask an AI "is GemLabs legit?"
   before booking. Crawlable case studies + reviews turn that check into a close assist
   (+10–30% on replier→booking conversion — applies to traffic the inboxes already generate).
2. **Offensive (compounds, 90–180 days):** being cited in AI answers to "best AI automation
   agency for SaaS"-type queries. AI-referral visitors convert like referrals, not traffic.

### Site structure (build once, days 0–21)
- **/work — portfolio hub**: one page per project. Fixed template: client type → problem →
  system built (diagram/screenshot) → **numbers** (before/after) → stack used → pull-quote.
  Concrete numbers are what AI engines quote; "improved efficiency" gets ignored.
- **/blog** — teardowns and guides (cadence below).
- **/services pages with FAQ blocks** — 5–8 real questions each ("How much does an AI SDR system
  cost?", "How long does deployment take?") with direct, number-bearing answers.
- **Schema markup:** `ProfessionalService` sitewide, `Article` on posts, `FAQPage` on FAQ blocks,
  `Review`/`AggregateRating` once Clutch reviews exist.
- **About page that names real humans** — AI engines weight entity credibility; an agency with a
  named founder, photo, and LinkedIn outranks an anonymous brand for trust-type queries.

### Publishing cadence (tied to the proof-capture loop — no separate content budget)
| Trigger | Asset | Cadence |
|---|---|---|
| Every free audit | Anonymized teardown post ("We audited a $5M SaaS company's sales stack — the 3 leaks") | 1–2/week once audits flow |
| Every client at day 30 | Case study on /work + companion blog post | ~2/month |
| Monthly | One aggregate-data post ("What 15 SaaS sales-stack audits taught us — with numbers") | 1/month — the most citable asset type we can make |
| Weekly | LinkedIn repost of each blog piece (AI engines cite LinkedIn + Reddit threads too) | 3×/week |

Drafting is automated: our own pipeline turns audit notes into first drafts; founder edits voice
and verifies every number. **Never publish a number that isn't real** — fabricated stats in
crawlable content are permanent reputation damage.

### Target queries to own (SaaS revenue automation niche)
- "AI automation agency for SaaS" / "best AI automation agencies"
- "AI SDR setup service" / "AI SDR agency"
- "revenue automation for SaaS companies"
- "AI lead qualification system" (+ "cost")
- "sales pipeline automation audit"
- Long-tail from teardowns: "why is our lead response time so slow", "how to audit b2b ad spend"

### GEO checklist (run quarterly)
- [ ] `curl -A "GPTBot" <every key page>` returns full content
- [ ] robots.txt allows GPTBot, PerplexityBot, ClaudeBot, Google-Extended
- [ ] Every /work page has ≥2 concrete before/after numbers
- [ ] Schema validates (validator.schema.org)
- [ ] Listed on Clutch + G2 + 2 "best AI agency" roundups (these are what AI answers cite most)
- [ ] Ask ChatGPT/Perplexity/Claude the target queries monthly; log whether GemLabs appears

## Scorecard (check monthly)

| Metric | Now | Day 90 target |
|---|---|---|
| Clutch reviews | 0 | 5+ |
| Published case studies w/ numbers | 0 | 3 |
| Indexed pages | ~1 | 10+ |
| LinkedIn posts/week | 0 | 3 |
| /work portfolio pages | 0 | 3+ |
| Blog posts published | 0 | 8–10 |
| AI-engine citations (monthly query check) | 0 | appearing for 2+ target queries |
| Cold reply rate | baseline TBD | +30–50% vs. baseline |
| Paid-audit conversion (test segment) | — | ≥60% of free-audit booking rate |

**Definition of done:** a cold prospect who Googles GemLabs after email #1 finds reviews, case
studies with numbers, and an active founder — at that point charging for audits stops costing
bookings and starts qualifying them.
