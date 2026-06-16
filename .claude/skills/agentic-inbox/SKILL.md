# Agentic Inbox — AI Inbox That Lives In Your Cloud

## Skill Purpose
Triage email, draft replies, and propose calendar holds using the Gmail and Google Calendar MCP integrations already configured in this environment — instead of a paid AI-inbox SaaS (e.g. Superhuman's AI inbox). Modeled on Cloudflare's open-source `cloudflare/agentic-inbox` reference: an AI inbox that runs in *your* cloud, where the agent reads and drafts, but **nothing sends without you**.

Core principle: **confirm before send.** This skill only ever creates drafts and proposed calendar events. It never sends an email or finalizes a calendar invite without explicit user approval.

## When to Use
- User wants help triaging their inbox, summarizing unread threads, or drafting replies.
- User asks to "draft a reply to X" or "see what needs a response."
- User wants to turn an email thread into a calendar hold (e.g. "they asked about Tuesday at 2pm — propose a hold").
- Triggered by `/agentic-inbox` or `/agentic-inbox <thread or task>`.

## How to Execute

### Step 1: Find what needs attention
Use the Gmail MCP tools to find unread or otherwise actionable threads:
```
mcp__Gmail__search_threads   (e.g. query: "is:unread")
mcp__Gmail__get_thread       (read full thread content/context)
mcp__Gmail__list_labels      (understand existing triage labels, if any)
```
Summarize each candidate thread in 1-2 lines: who it's from, what they're asking, and whether it needs a reply, a calendar hold, or no action.

### Step 2: Draft, don't send
For threads that need a reply, write a draft using the thread's tone/context and create it with:
```
mcp__Gmail__create_draft
```
Never call a "send" action — this skill only produces drafts. Tell the user the draft is ready for their review in Gmail.

### Step 3: Propose calendar holds when relevant
If a thread implies scheduling (e.g. "can we lock Tuesday at 2pm?"), check availability and propose — don't finalize — a hold:
```
mcp__Google_Calendar__list_events     (check the proposed slot is free)
mcp__Google_Calendar__suggest_time    (if no specific time was given)
mcp__Google_Calendar__create_event    (only after the user confirms the slot)
```
Surface the proposed time to the user and wait for explicit confirmation before creating the event.

### Step 4: Label for traceability (optional)
If the inbox uses triage labels, apply them with `mcp__Gmail__label_thread` / `mcp__Gmail__label_message` so handled threads are easy to find later. Don't invent a new labeling scheme unless the user asks for one.

## Notes
- This skill is read-and-draft only by design — it mirrors the "confirm before send" gate from the Agentic Inbox reference. Do not add an auto-send path.
- All actions go through the existing `mcp__Gmail__*` and `mcp__Google_Calendar__*` tools — no separate API keys or services to configure.
