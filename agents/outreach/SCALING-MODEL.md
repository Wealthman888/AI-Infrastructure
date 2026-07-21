# GemLabs Scaling Model — Months 1–6

Working financial model for the outreach + authority strategy. **Every number here is a
benchmark-derived assumption until replaced by actuals** — update this file monthly (real reply
rate after the first ~500 sends, real close rate after the first 10 audits, real CAC after the
first month of ads).

## Growth inputs

- **Sending:** 15 warmed inboxes at start; +5 domains (~12 inboxes) purchased each month, 3-week
  warmup, productive the following month. 20–30 cold sends/inbox/day, 3-touch sequences.
- **Hiring (staggered — same team by M5 as all-at-once, ~$35–45K less burn):**
  - M3: closer #1 ($4K + 10% commission), systems engineer #1 ($7K)
  - M4: closer #2, engineer #2
  - M5: COO/ops manager ($10K)
  - M6: engineer #3; support/CS hire trigger = 60+ retainer clients
- **Ads:** 20% of prior-month profit from M4. First job: retargeting outreach clickers +
  amplifying case studies (cheap), then cold audit-funnel traffic. CAC assumption $600/booked
  audit in M4 → ~$400 by M6.
- **Offer timeline:** free audit M1–M3 → paid-audit flip on outbound in M4 ($1,500, credited).
- **Retainers:** $800+/mo per build client, 5% monthly churn.

## Monthly P&L (base case, rounded)

| | M1 | M2 | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|---|
| Inboxes (full / warming) | 15/12 | 27/12 | 39/12 | 51/12 | 63/12 | 75/12 |
| Prospects contacted | 2,000 | 3,300 | 5,500 | 7,700 | ~9,500 | ~11,500 |
| Audits held (outbound/ads) | 15/— | 28/— | 48/— | 45 paid/20 | 45 paid/35 | 50 paid/45 |
| Builds closed (demand) | 4 | 9 | 13 | 19 | 22 | 26 |
| **Builds delivered (capacity)** | 4 | 9 | 12 | 12–14 | 14 | ~18 |
| Build revenue (avg $5.3K→$8K) | $21K | $50K | $78K | $98K | $105K | $130K |
| Audit revenue (deep→paid) | $3K | $7K | $8K | $67K | $70K | $75K |
| Retainer MRR (net of churn) | $3K | $10K | $20K | $28K | $38K | $48K |
| **Total revenue** | **$27K** | **$67K** | **$106K** | **$193K** | **$213K** | **$253K** |
| Payroll + commissions | — | — | $19K | $36K | $48K | $58K |
| Ads | — | — | — | $17K | $28K | $27K |
| Tools/data/domains | $0.4K | $0.7K | $1K | $1.5K | $2K | $2K |
| **Profit** | **~$24K** | **~$60K** | **~$86K** | **~$139K** | **~$135K** | **~$166K** |

## Fulfillment capacity (the real constraint map)

| Capacity unit | Rate | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|
| Closer calls | 60/closer/mo | 48/60 ✅ | 65/120 ✅ | 80/120 ✅ | 95/120 ✅ |
| Builds | 4–5/engineer/mo | 13/12 ⚠️ | 19/14 🔴 | 22/14 🔴 | 26/18 ⚠️ |
| Retainer clients | ~1hr/client/wk | 25 | 40 | 50 | 60 🔴 |

**Build delivery is the permanent bottleneck — by design.** Manage excess demand with a 2–3 week
waitlist (closers sell against the scarcity), price rises toward $10–12K average, and the M6
engineer. Do NOT hire engineers to absorb all demand — let price absorb it. At 60+ retainer
clients, add support/CS or a premium support tier.

**Cash-flow rules:** collect 50% deposits on builds at close (funds payroll ahead of delivery);
hire each role only after two consecutive months of the revenue that justifies it; the first 500
sends validate reply rate BEFORE the first offer letter goes out.

---

# Conversion Levers — squeezing every stage of the funnel

Ordered by funnel stage. Each lever names its expected lift; treat lifts as hypotheses to A/B.

## Send → Reply
1. **A/B in 50-send cells.** Every batch: 2 subject lines × 2 opening-hook styles. Kill the
   bottom performer weekly; the compounding gain is +1–2 points of reply rate over a quarter.
2. **Weekly inbox-placement tests** (GlockApps/MailReach seed lists). Deliverability decays
   silently; catching a slide at week 2 saves a domain.
3. **Segment-specific angles beat person-specific cleverness at the margin.** Track reply rate
   per hook TYPE (hiring / funding / ads-activity / tech-stack) in a sheet; weight future
   batches toward the winning hook type.
4. **LinkedIn pre-touch:** founder views profile + connection request 1–2 days before email #1
   (automatable via Apify LinkedIn actors, keep to <50/day). Name recognition lifts cold reply
   rates ~20–30%.

## Reply → Booked
5. **Speed to lead: reply within 1 hour, target 15 minutes.** Booking rate roughly doubles vs.
   next-day. Build the Gmail-MCP draft-responder agent (this repo) so replies get an
   instant-drafted response the founder/closer only approves.
6. **The "audit preview" asset:** for interested-but-hesitant replies, send a 3-bullet preview of
   what the audit found already ("we ran a first pass — your response time to inbound is ~6
   hours, and two competitors are outranking you on X"). Proof of work before the call books it.
7. **Booking friction:** calendar link with same/next-day slots; 3 qualification questions max.

## Booked → Held (kill no-shows)
8. Instant confirmation + calendar invite with a 1-page agenda ("the 3 things we'll show you"),
   reminder 24h and 1h before (SMS if collected). No-shows drop from ~25% to 10–15% = **2–5 extra
   audits/month at M3 volume for zero acquisition cost.**

## Held → Closed
9. **Standardize the audit call:** findings (10 min, screen-share the teardown) → quantify cost
   of inaction in THEIR numbers ("6-hour response time × your lead volume ≈ $X/mo lost") → two
   options only (entry build vs. stack) → next onboarding slot date. Scripted structure lifts
   close rates 5–10 points vs. freestyle.
10. **Deposit on the call.** Send the payment link while still on Zoom; 48-hour proposal expiry
    honestly enforced by the waitlist.
11. **2-minute Loom recap** after every call that doesn't close on the spot — restates the two
    numbers that matter and the offer. Cheap, and closes the "need to think about it" segment.
12. **Public slot scarcity:** "taking 4 builds in [month]" on the site and in proposals. True
    (capacity table above) and converts fence-sitters.

## Closed → More revenue (cheapest growth available)
13. **90-day re-audit for every client** — free, scheduled at onboarding. It protects the
    retainer, generates the case-study numbers, and is the natural pitch for system #2.
    Second-system attach target: 30% of clients within 6 months.
14. **Referral engine:** at every delivered build, ask for 2 intros + offer 10% referral fee.
    5–10 warm referrals/month by M4 at near-100% audit-booking rate.
15. **Partnership channel** (from AUTHORITY-SPRINT): web-design/CRO/HubSpot agencies, 10–20% rev
    share — each productive partner ≈ 2–4 referred audits/month.
16. **Retainer ladder:** $800 maintenance → $1,500 optimize (monthly improvements) → $2,500
    growth (quarterly new automation). Move clients up at the 90-day re-audit.

## Recycling (nothing dies)
17. **No-reply reactivation:** 90 days later, re-run non-repliers with a different hook type and
    fresh research — typically converts at ~50–70% of a fresh list at zero data cost.
18. **Closed-lost nurture:** monthly plain-text email with one anonymized teardown insight.
    6–12 month conversions on "not now" replies are real and free.
19. **Every "no" is data:** log objections verbatim; feed recurring ones into offer.md proof
    points and the email angles monthly.

## Operating cadence (how the goals stay on track)
- **Weekly (30 min):** reply rate by segment/hook, booking rate, no-show rate, inbox placement,
  pipeline value. Kill the worst angle, scale the best.
- **Monthly:** update THIS file with actuals; re-forecast the next 3 months; price review
  against the waitlist length; authority scorecard (AUTHORITY-SPRINT.md).
- **Quarterly:** GEO citation check; offer-ladder review (free vs. paid audit performance);
  retainer churn autopsy.
