# Email Sequences: Midnight Motors Digital Showroom — Cold Outreach
**Date:** 2026-06-25
**Business Type:** Web design/build service (GemLabs), B2B sale to luxury/exotic car dealerships
**Target Audience:** Owners/GMs of independent luxury/exotic dealerships, luxury car brokers, marketing leads at multi-location exotic groups (see ICP.md)
**Sequences Generated:** Cold Outreach (5 emails, 21 days)
**Lead source:** Clay-enriched list — all personalization fields below map to Clay enrichment columns

---

## Sequence 1: Cold Outreach

### Overview
- **Goal:** Book a 15-20 minute call to walk through the demo and pricing tiers
- **Emails:** 5
- **Duration:** 21 days
- **Expected Open Rate:** 35-45% (cold B2B, small list, high personalization)
- **Expected Click Rate:** 8-12% (demo link is the core CTA)

### Merge Field Reference (Clay columns)
| Field | Source / Clay enrichment | Example |
|---|---|---|
| `{{first_name}}` | Contact enrichment | Marcus |
| `{{dealership_name}}` | Company enrichment | Velocity Exotics |
| `{{city}}` | Company enrichment | Scottsdale |
| `{{brand_sold}}` | Company enrichment / inventory scrape | Lamborghini, McLaren |
| `{{current_site_url}}` | Company enrichment | velocityexotics.com |
| `{{site_issue}}` | Manual tag or Clay AI column (e.g. "stock DealerSocket template", "no mobile video fallback", "site hasn't changed since 2021") | stock DealerSocket template |
| `{{competitor_name}}` | Clay AI column — nearest competitor with a newer/better site | Reverie Motorcars |
| `{{demo_url}}` | Static — your live demo link | midnightmotors-demo.vercel.app |
| `{{sender_name}}` | Static — your name | — |
| `{{sender_calendar_link}}` | Static — Calendly/etc | — |

---

### Email 1 (Day 1): RELEVANCE + VALUE — Lead with the demo

**Subject Line A:** Quick one for {{dealership_name}}
**Subject Line B (A/B test):** {{first_name}} — saw {{current_site_url}}
**Preview Text:** Built a demo of what your site could look like — 90 seconds to see it

---

Hi {{first_name}},

I took a look at {{current_site_url}} — solid inventory, but the site itself reads like {{site_issue}}, which undersells what you're actually selling. For a buyer dropping six figures on a {{brand_sold}}, the site should feel like the showroom, not a used-car lot search filter.

So instead of pitching you, I built a live demo of what a {{brand_sold}}-tier digital showroom looks like: a 3D hero stage, cinematic motion, the works. Take a look — 90 seconds:

{{demo_url}}

Would it make sense to grab 15 minutes this week to walk through what this could look like for {{dealership_name}} specifically?

{{sender_name}}

---

**CTA:** "Would it make sense to grab 15 minutes this week?"
**CTA Link:** {{sender_calendar_link}} (or just reply — keep it conversational, don't force a booking link in email 1)
**Goal:** Get the demo link clicked; open a reply thread
**Segmentation Notes:** Send to all primary + secondary ICP contacts. Hold tertiary ICP (multi-location groups) for a separate sequence emphasizing the productized template tier instead.

---

### Email 2 (Day 4): FOLLOW-UP + SOCIAL PROOF

**Subject Line A:** Re: Quick one for {{dealership_name}}
**Subject Line B (A/B test):** What {{competitor_name}} did differently

---

{{first_name}} — following up in case this got buried.

One more thing worth mentioning: {{competitor_name}} in {{city}} redid their site in a similar direction last year and it visibly changed how their inventory pages read — less "lot," more "collection." That gap is closing fast in this category.

Happy to send over a quick breakdown of what a build like this would look like for {{dealership_name}} — pricing, timeline, the works. Want me to send it over?

{{sender_name}}

---

**CTA:** "Want me to send it over?"
**CTA Link:** None yet — keep them replying. If they say yes, follow up with CLIENT-PROPOSAL.md attached/linked.
**Goal:** Get a reply or at minimum a second demo click
**Segmentation Notes:** Skip this email for anyone who already clicked the demo link twice or replied to Email 1 — move them straight to a manual proposal send.

---

### Email 3 (Day 8): BREAKUP + VALUE DROP

**Subject Line A:** Closing the loop on {{dealership_name}}
**Subject Line B (A/B test):** No-strings resource for {{first_name}}

---

{{first_name}}, I know inboxes like yours get hit constantly, so I'll keep this short.

Even if now isn't the right time, here's the pricing breakdown we use for builds like this — custom build, build + self-service backend, or a faster productized version if you're managing multiple locations:

[Attach or link CLIENT-PROPOSAL.md tier table]

No pressure either way — if it's useful later, it's useful later.

{{sender_name}}

---

**CTA:** "Here's the pricing breakdown" (link to proposal/pricing one-pager)
**CTA Link:** Hosted version of the pricing table from CLIENT-PROPOSAL.md
**Goal:** Leave them with enough info to self-qualify and come back later
**Segmentation Notes:** This is the highest-value "no-ask" touch — fine to send broadly, including to tertiary ICP with the template-tier pricing emphasized instead.

---

### Email 4 (Day 14): RE-APPROACH — New angle

**Subject Line A:** Saw {{dealership_name}} is {{trigger_event}}
**Subject Line B (A/B test):** Different angle, {{first_name}}

---

{{first_name}} — noticed {{dealership_name}} {{trigger_event}} (new location / new brand line / a push into {{brand_sold}} / etc — pull from Clay trigger-event column).

That's usually exactly the moment a refreshed digital presence pays off fastest — new inventory or a new location needs a launch moment, not just a quiet site update.

If timing's better now than it was a couple weeks ago, the demo's still live: {{demo_url}}

{{sender_name}}

---

**CTA:** Demo link, reframed around the trigger event
**CTA Link:** {{demo_url}}
**Goal:** Re-engage on a fresh, specific reason — only send if Clay surfaced an actual trigger event; skip this email entirely if no trigger event exists for that contact
**Segmentation Notes:** Requires a populated `{{trigger_event}}` field — set up a Clay enrichment column watching for: new location openings, new franchise/brand announcements, leadership changes, funding/acquisition news.

---

### Email 5 (Day 21): FINAL BREAKUP

**Subject Line A:** Not the right time?
**Subject Line B (A/B test):** Last note, {{first_name}}

---

{{first_name}} — I'll take the silence as "not right now," and that's completely fine.

I'll close this out on my end. If things change down the line, my calendar's always open: {{sender_calendar_link}}

Good luck with {{dealership_name}} either way.

{{sender_name}}

---

**CTA:** "My calendar's always open"
**CTA Link:** {{sender_calendar_link}}
**Goal:** Graceful close, leave the door open, protect sender reputation by stopping the sequence cleanly
**Segmentation Notes:** After this email, move the contact to a long-term nurture/newsletter list rather than continuing cold touches — re-approach only on a new trigger event 60-90 days out.

---

## Segmentation Strategy

| Segment | Basis | Sequence variant |
|---|---|---|
| Primary ICP (independent dealership, owner/GM) | Company size + decision-maker title from Clay | Full sequence as written, emphasize custom build / CMS tiers |
| Secondary ICP (brokers/concierges) | No physical address / "by appointment" signal | Same sequence, reframe Email 1 around discretion/trust rather than inventory showcase |
| Tertiary ICP (multi-location groups) | 3+ locations detected in Clay company enrichment | Emphasize productized template tier ($2K-5K/location) starting in Email 1 |
| Has a known trigger event | Clay AI trigger-event column populated | Lead with Email 4's framing as Email 1 instead, skip generic opener |

## A/B Testing Plan
1. Subject lines (test A/B pairs above first — biggest lever on a cold list)
2. CTA phrasing in Email 1 ("15 minutes" vs. "I'll send a quick breakdown")
3. Attaching the proposal PDF directly in Email 3 vs. linking to a hosted page
4. Send day (Tue/Wed/Thu morning vs. afternoon — dealership GMs often check email later in the day after floor hours)

## Metrics to Track
- Open rate (target 35-45% — cold but highly personalized/small list)
- Click rate on demo link (target 8-12%)
- Reply rate (target 3-5% — the real signal for a 5-figure deal sequence)
- Meetings booked per 100 sends

## Compliance Checklist
- CAN-SPAM: include physical mailing address in footer, working unsubscribe/opt-out, accurate "From" name — required even for B2B cold outreach in the US
- Verify state-level cold-email rules if targeting CA/other states with stricter B2B consent norms
- Recommend legal review of the specific list-sourcing method (Clay enrichment + public business contact data is generally fine for the US, confirm before sending to EU-based contacts under GDPR)

## Implementation Notes
- Load this sequence into your ESP/outbound tool (Instantly, Smartlead, Apollo, etc.) with the Clay merge fields above mapped 1:1 to Clay's exported columns
- Set up a Clay enrichment workflow to populate: `site_issue` (AI column scoring current site against a luxury-site checklist), `competitor_name` (nearest dealership with a notably better site), `trigger_event` (news/PR monitoring column)
- Route any reply automatically to a Slack/email alert — 5-figure deal threads should never sit in a shared inbox unattended
- Follow-up: once a reply comes in, hand off to the full `CLIENT-PROPOSAL.md` rather than continuing the cold sequence
