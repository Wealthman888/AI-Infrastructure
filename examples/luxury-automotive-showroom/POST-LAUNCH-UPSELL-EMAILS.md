# Post-Launch Upsell Email Sequence

**Goal:** Move a client who just launched their showroom site (CLIENT-PROPOSAL.md) into the Growth Stack (GROWTH-STACK-UPSELL.md), without it feeling like a new sales pitch.
**Audience:** Existing clients only — this sequence starts at site launch, not before.
**Emails:** 4, spread over 30 days
**Tone shift from cold outreach:** These are warm, relationship emails. No subject-line tricks, no breakup framing — write as their vendor-turned-partner checking in.

## Merge fields
| Field | Source | Example |
|---|---|---|
| `{{first_name}}` | CRM/client record | Marcus |
| `{{dealership_name}}` | CRM/client record | Velocity Exotics |
| `{{launch_date}}` | Project record | June 2 |
| `{{lead_count}}` | Form submissions since launch (manual or webhook count) | 14 |
| `{{sender_name}}` | Static | — |
| `{{sender_calendar_link}}` | Static | — |

---

### Email 1 (Day 3 post-launch): CHECK-IN, NO PITCH

**Subject:** How's the new site feeling so far?
**Preview:** Just checking in — no ask, promise

---

{{first_name}},

Three days in — how's the site feeling? Curious if you've had any walk-ins or calls mention it, or if your team's gotten any of the private-viewing form submissions yet.

No ask here, just want to make sure everything's running the way it should. Let me know if anything needs a tweak.

{{sender_name}}

---

**CTA:** None — this is a relationship email. A reply is the win.
**Goal:** Re-open the conversation, surface any early issues before they become complaints, set up the data point ({{lead_count}}) you'll reference in Email 2.

---

### Email 2 (Day 14): SURFACE THE GAP, INTRODUCE TIER 1

**Subject:** Quick question about your {{lead_count}} private viewing requests
**Preview:** Noticed the form's getting real traffic — how's response time looking?

---

{{first_name}},

Looks like the site's picked up {{lead_count}} private viewing requests since launch — that's real interest that didn't exist before. How's your team's response time looking on those? Same day, next day, or does it depend on who's on the floor that day?

Ask because most dealerships lose a chunk of high-intent leads simply to response delay — not interest, just timing. We've built an add-on that catches the form the second it's submitted, sends a personalized reply referencing the specific car, and books a call automatically if they're qualified. It plugs straight into the form you already have — no rebuild.

Want me to walk you through it on a quick call? 15 minutes.

{{sender_name}}

---

**CTA:** "Want me to walk you through it?"
**CTA Link:** {{sender_calendar_link}}
**Goal:** Introduce Tier 1 (AI Lead Response) only — do not mention Tier 2 or the retainer in this email.
**Segmentation:** Skip this email if the client already mentioned response-time pain in Email 1's reply — escalate straight to a call instead of another email.

---

### Email 3 (Day 30, only if Tier 1 was purchased and live for 1-2 weeks): INTRODUCE TIER 2

**Subject:** What's next for {{dealership_name}}'s inventory
**Preview:** Now that leads are covered, here's the next bottleneck worth solving

---

{{first_name}},

Now that the lead-response side is running on its own, the next thing worth looking at is what happens *before* someone fills out the form — specifically, how often your past buyers and social followers see new inventory.

Most dealerships post a new arrival once and let it sit. We can automate a weekly post for each new car plus an email to your existing buyer list, matched to what they've shown interest in before — so new inventory actually gets in front of the people most likely to buy it, without anyone on your team writing copy or scheduling posts.

Happy to show you what that'd look like specifically for {{dealership_name}} — want me to put a quick mockup together?

{{sender_name}}

---

**CTA:** "Want me to put a quick mockup together?"
**CTA Link:** None — keep it conversational, let them opt in before you build anything
**Goal:** Introduce Tier 2 (Content & Inventory Automation) as a natural next step, not a new pitch
**Segmentation:** Only send to clients who adopted Tier 1. If they declined Tier 1, do not send this — revisit Tier 1 instead after another 30 days.

---

### Email 4 (Day 45-60, only if both Tier 1 and Tier 2 are live): INTRODUCE THE RETAINER

**Subject:** Bringing it all together for {{dealership_name}}
**Preview:** One conversation to simplify how we work together going forward

---

{{first_name}},

Between the lead response automation and the inventory content running now, you've effectively got a small growth team running in the background. At this point it usually makes sense to bring it under one simple monthly arrangement instead of piecing it together — a single retainer that covers both, plus a monthly check-in on what's working and a quarterly refresh of the site itself as your inventory and brand evolve.

No pressure to change anything that's working — just want to put the option in front of you. Worth a quick call?

{{sender_name}}

---

**CTA:** "Worth a quick call?"
**CTA Link:** {{sender_calendar_link}}
**Goal:** Consolidate into the Tier 3 Growth Retainer
**Segmentation:** Only send if both prior tiers are active and performing — this is a consolidation offer, not a recovery pitch for an unhappy client.

---

## Rules for this sequence
- Never send Email 2, 3, or 4 to a client who hasn't replied positively to the prior step — these are sequential gates, not a fixed-interval drip.
- If a client goes quiet after Email 2, don't escalate with urgency tactics (no "breakup" framing here) — these are existing paying clients, treat silence as "not now," and re-check in 30 days with a fresh, real observation (not a templated nudge).
- Personalize {{lead_count}} and any reference to their actual site performance every time — generic stats kill trust with existing clients faster than with cold prospects.
