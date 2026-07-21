# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

AI agents & automation infrastructure — Claude-powered agents, scheduled tasks, and workflow automation connecting to external services (Gmail, Google Calendar, Google Drive, etc.).

## Directory Layout

```
agents/      # Individual agent definitions and logic
tools/       # Reusable tool wrappers for external APIs
scripts/     # One-off or scheduled automation scripts
council/     # Operator-council memory: company context + decision log
.claude/
  agents/    # Operator subagents (CEO, CFO, CMO, CTO, COO, GC, Chief of Staff)
  skills/    # Custom Claude Code skills for this project
```

## Development Setup

This project uses the Anthropic SDK. Install dependencies before running any agent:

```bash
pip install anthropic          # Python
# or
npm install @anthropic-ai/sdk  # Node.js/TypeScript
```

Set your API key:
```bash
export ANTHROPIC_API_KEY=sk-...
```

## Agent Architecture

Agents in `agents/` follow a tool-use loop pattern:
1. Send a user message + tool definitions to the Claude API
2. If the response contains `tool_use` blocks, execute the tool and return a `tool_result`
3. Continue the loop until the model returns a final `text` response

Use `claude-opus-4-7` for complex multi-step reasoning agents; use `claude-haiku-4-5-20251001` for high-frequency or cost-sensitive tasks.

## Prompt Caching

All agents that use a large system prompt or static tool list **must** include prompt caching. Mark the last static block with `"cache_control": {"type": "ephemeral"}`:

```python
messages=[{"role": "user", "content": [
    {"type": "text", "text": prompt, "cache_control": {"type": "ephemeral"}}
]}]
```

Cache TTL is 5 minutes. Build agents to stay within a cache window when running loops.

## Scheduled Automation

Use Claude Code's `/schedule` skill to create cron-based remote agents. Store cron definitions and their purpose in `scripts/` alongside the agent code they invoke.

## Operator Council

This repo runs a virtual executive team ("the council") built from the
[claude-skills](https://github.com/alirezarezvani/claude-skills) pack (MIT):

- **Operators** — subagents in `.claude/agents/`: `cs-ceo-advisor`, `cs-cfo-advisor`,
  `cs-cmo-advisor`, `cs-cto-advisor`, `cs-coo-advisor`, `cs-general-counsel-advisor`,
  chaired by `cs-chief-of-staff`. Each is backed by a matching skill in
  `.claude/skills/` (with frameworks, reference docs, and Python calculators).
- **`/council [question]`** — convenes the relevant operators on a decision:
  isolated parallel contributions, adversarial critique, Chief-of-Staff synthesis,
  founder approval, then a logged decision record. Protocol details:
  `.claude/skills/council/SKILL.md` (built on `board-meeting` + `agent-protocol`).
- **Memory** — `council/company-context.md` is loaded at the start of every sitting
  (keep it current); approved decisions are logged to `council/decisions/approved/`
  and only those are reloaded later. Also available: `scenario-war-room` for
  compound what-if modeling.

Ask a single-domain question (e.g. "what's our runway?") to engage one operator
directly; use `/council` for cross-functional decisions.

## MCP Integrations

This environment has MCP servers configured for Gmail, Google Calendar, and Google Drive. When building tools that wrap these services, prefer the MCP tool calls over raw API calls — they handle auth automatically.

Available MCP namespaces: `mcp__claude_ai_Gmail__*`, `mcp__claude_ai_Google_Calendar__*`, `mcp__claude_ai_Google_Drive__*`.
