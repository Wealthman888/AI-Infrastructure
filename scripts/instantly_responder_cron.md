# Instantly auto-responder — schedule & purpose

**Agent:** `agents/super_closer_responder.py`
**Purpose:** Poll Instantly.ai for new unread replies to cold outreach campaigns and
respond using the Super Closer skill's diagnose → de-escalate → reframe → trigger →
tone → position loop. Low-risk replies (no price/guarantee/competitor/scarcity
content) can auto-send; anything matching the objection routing table (price,
"cheaper", competitor, ghosting, "check with partner/boss") is always held and
flagged in Instantly Unibox for a human to answer, regardless of the auto-send
setting.

## Setup

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
export INSTANTLY_API_KEY=...            # Instantly workspace API key, emails:all + leads:all scope
export SUPER_CLOSER_EACCOUNT=you@yourdomain.com   # the Instantly-connected sending mailbox
export SUPER_CLOSER_AUTO_SEND=false     # keep false until you've reviewed a batch of held replies
export SUPER_CLOSER_CAMPAIGN_ID=...     # optional: restrict to one campaign
```

Run once to sanity-check before scheduling:

```bash
python agents/super_closer_responder.py
```

## Cron schedule

Instantly's `reply_received` webhook exists (see
`https://developer.instantly.ai/guides/webhook-events.md`) but this MVP polls
instead, since it doesn't need a public webhook receiver. Every 15 minutes is a
reasonable cadence for cold-email reply latency:

```cron
*/15 * * * * cd /path/to/AI-Infrastructure && /usr/bin/env python3 agents/super_closer_responder.py >> logs/instantly_responder.log 2>&1
```

## Rollout plan

1. Run with `SUPER_CLOSER_AUTO_SEND=false` for at least a few days. Every reply gets
   drafted and the lead flagged for review in Unibox — nothing sends automatically.
2. Read the held replies in Unibox against what the agent would have sent (check
   `logs/instantly_responder.log` for the drafted `body_text` in each
   `submit_reply_decision` call) to confirm tone and accuracy before trusting it.
3. Only then set `SUPER_CLOSER_AUTO_SEND=true` — and even then, only low-risk replies
   ever go out unattended. High-risk replies (the ones most likely to cost you a real
   deal if misjudged) always wait for a human.

## Upgrade path

Swapping the 15-minute poll for the `reply_received` webhook removes the latency and
the wasted no-op runs — needs a small receiver (e.g. a Flask endpoint or a Vercel
function) that calls `create-webhook` once and then invokes the same
`agents/super_closer_responder.py` logic per event instead of polling
`list_new_replies`.
