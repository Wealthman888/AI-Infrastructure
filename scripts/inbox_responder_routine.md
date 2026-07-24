# Inbox Responder — schedule & purpose

**Agent:** `agents/inbox_responder.md` (a Claude Code Routine, not a standalone
script — see that file for why)
**Purpose:** Draft Super Closer replies to new prospect/customer email as it arrives
in Gmail, forward-only from activation. Never auto-sends; always creates a Gmail
draft for a human to review.

## One-time setup (do before scheduling)

1. Create two Gmail labels: `super-closer/drafted` and `super-closer/needs-review`.
2. Note today's date — it's the activation cutoff `agents/inbox_responder.md` uses in
   its search query, so the 6,900+ existing unread backlog is never touched.

## Schedule

Created as a Claude Code Routine (`create_trigger`), hourly — the platform's minimum
interval — firing into a **fresh session** each time (not this conversation), since
each run is a self-contained "check for new mail, draft, label" task with no need for
prior context. The Routine's prompt is the content of `agents/inbox_responder.md`
with the activation date filled in.

## Rollout plan

Same posture as the Instantly agent: let it run in draft-only mode and spot-check the
drafts in `super-closer/drafted` and `super-closer/needs-review` for a few days before
trusting it to skim-and-send. There's no auto-send flag to flip here — draft-only is
the permanent mode until the Gmail connector gains a send tool.
