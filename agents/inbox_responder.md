# Inbox Responder — Gmail (draft-only)

Unlike the Instantly integration, the Gmail MCP connection available in Claude Code
sessions has **no send tool** — only `create_draft`. So this agent can't run as a
portable script the way `super_closer_responder.py` does; it runs as a **Claude Code
Routine** that fires into a fresh session on a schedule, uses the Gmail MCP tools
directly, and always stops at a draft. A human sends.

This file is the instruction set (the Routine's prompt). See
`scripts/inbox_responder_routine.md` for the schedule and setup.

## Scope: forward-only

The inbox has a large pre-existing unread backlog. This agent must **never** process
it. Every run is scoped to mail that arrived after the Routine was first turned on —
enforced with a Gmail search `after:` date filter plus a label, so nothing is
processed twice and nothing from before activation is touched.

## What each run does

1. Search: `in:inbox -label:super-closer/drafted -label:super-closer/needs-review after:<activation-date>`
   (substitute the actual activation date — the day this Routine was created).
2. For each matching thread, skip anything that clearly isn't a prospect/customer
   message needing a reply — newsletters, notifications, receipts, internal/team
   threads, anything already answered. Use judgment; when unsure, treat it as a real
   message rather than silently dropping it.
3. For each real message: run the Super Closer core loop
   (`.claude/skills/super-closer/SKILL.md`) — diagnose, de-escalate, reframe, trigger,
   tone, position, one clear next step.
4. Classify risk the same way the Instantly agent does:
   - **low** — acknowledgment, scheduling, plain info request, no price/guarantee/
     competitor/scarcity content.
   - **high** — anything matching the objection routing table (price, "cheaper",
     competitor, ghosting re-engagement, "check with partner/boss", "not the right
     time"). Default to high when unsure.
5. Create a Gmail draft via `create_draft` with `replyToMessageId` set to the
   original message, so it threads correctly. There is no auto-send path here —
   low risk and high risk both produce a draft; the label is what tells you which
   ones are safe to skim-and-send vs. read carefully first.
6. Label the thread so it's never reprocessed:
   - low risk -> `super-closer/drafted`
   - high risk -> `super-closer/needs-review`
7. Never fabricate a proof point, guarantee, or scarcity claim. If a real one isn't
   available from context, leave `[insert your specific result here]` in the draft
   rather than inventing one.
8. Stay silent unless something looks like it needs immediate human judgment (e.g. a
   message that isn't sales-related but urgent, or one where guessing wrong is
   clearly costly). Routine runs are otherwise silent — the drafts and labels are the
   output.
