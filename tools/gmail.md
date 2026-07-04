# Gmail Integration

MCP namespace: `mcp__Gmail__*`. Connected mailbox: `davidonewaycapital@gmail.com`.

## Available operations

| Tool | Use |
|------|-----|
| `search_threads` | Find threads by query (sender, subject, label, date range) |
| `get_thread` | Read a specific thread's full content |
| `list_drafts` | List existing drafts |
| `create_draft` | Create a new draft (reply or new message) |
| `list_labels` | List user labels (needed to resolve a label name to an id) |
| `create_label` | Create a new label |
| `label_message` / `label_thread` | Apply a label |
| `unlabel_message` / `unlabel_thread` | Remove a label |
| `apply_sensitive_message_label` / `apply_sensitive_thread_label` | Flag sensitive content |

## Hard rule: draft-only, no autonomous sending

There is no "send" tool in this MCP server — by design, agents can only create drafts. Treat this as a hard boundary, not a gap to work around: every agent-authored email (outreach, follow-up, proposal cover note) must land as a draft for a human to review and send. Never attempt to send mail through another channel to bypass this.

## Conventions

- Label every agent-created draft with `GemLabs/Agent-Draft` (create the label via `create_label` on first use, then `list_labels` to resolve its id for future calls) so drafts needing review are easy to find in one place.
- When drafting outbound sales/marketing copy, dispatch to the relevant specialist persona first (see `.claude/skills/dispatch/SKILL.md` or invoke the agent by name directly) to write the content, then create the draft — don't write sales copy inline as a generic assistant.
- Before drafting a reply, use `search_threads` / `get_thread` to read the actual thread context — never draft a reply blind.
