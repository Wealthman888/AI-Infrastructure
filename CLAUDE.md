# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

AI agents & automation infrastructure — Claude-powered agents, scheduled tasks, and workflow automation connecting to external services (Gmail, Google Calendar, Google Drive, etc.).

## Directory Layout

```
agents/      # Individual agent definitions and logic
tools/       # Reusable tool wrappers for external APIs
scripts/     # One-off or scheduled automation scripts
.claude/
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

## MCP Integrations

This environment has MCP servers configured for Gmail, Google Calendar, and Google Drive. When building tools that wrap these services, prefer the MCP tool calls over raw API calls — they handle auth automatically.

Available MCP namespaces: `mcp__claude_ai_Gmail__*`, `mcp__claude_ai_Google_Calendar__*`, `mcp__claude_ai_Google_Drive__*`.

## Skill Suites

`.claude/skills/` contains two productized skill suites, each with a main orchestrator skill that routes to specialist sub-skills:

- **`market`** — AI Marketing Suite. Audits and generates marketing content (`market-audit`, `market-seo`, `market-copy`, etc.). See `.claude/skills/market/SKILL.md`.
- **`infra-audit`** — AI Infrastructure & Operations Auditor. Audits client infrastructure across security (`trivy-scan`), cost (`infracost-audit`, `cloud-waste-scout`), code/stack health (`stack-hygiene-analyzer`), operational resilience (`silent-failure-hunter`), and compliance (`audit-tools`). See `.claude/skills/infra-audit/SKILL.md`.
- **`client-audit`** — `/client-audit <website-url>` automation. Single entry point that takes just a client's website and runs `market-audit` plus a passive external technical/security snapshot (no system access needed). Once a client grants `--repo`/`--cloud`/`--iac` access, the same command upgrades the technical half to the full `infra-audit` suite. Saves the report locally and to Google Drive. CRM-fed/cron batch mode is a documented but unbuilt extension point — see `.claude/skills/client-audit/SKILL.md`.
