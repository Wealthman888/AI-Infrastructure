# Agent Dispatcher

Invoke any of the 233 installed specialist personas in `.claude/agents/` (from the agency-agents roster) on a real task.

## Why this exists

This environment's `Agent` tool only exposes a fixed `subagent_type` catalog (`claude`, `claude-code-guide`, `Explore`, `general-purpose`, `Plan`, `statusline-setup`) — it does not dynamically load project-defined subagents from `.claude/agents/*.md` the way the local Claude Code CLI/desktop app does. This skill works around that by reading the target agent's persona file directly and injecting it into a `general-purpose` agent call.

## Usage

`/dispatch <agent-name-or-keyword> <task description>`

Examples:
- `/dispatch sales-outbound-strategist draft a cold email sequence for GemLabs targeting VPs of Sales`
- `/dispatch seo audit the homepage copy at gemlabs.io`
- `/dispatch chief-financial-officer review our service pricing model`

## Steps to follow when this skill fires

1. **Split the input** into `<query>` (the agent name/keyword — first word or hyphenated slug) and `<task>` (everything after it, the actual work to do).

2. **Look up the agent**: run `scripts/agent-lookup.sh "<query>"` from the repo root. It returns tab-separated `filename<TAB>name<TAB>description` lines.
   - **No output / error**: tell the user no agent matched, and suggest running `scripts/agent-lookup.sh` with no arguments to browse the full roster, or trying a broader keyword.
   - **Exactly one line**: proceed to step 3 with that `filename`.
   - **Multiple lines**: show the user each candidate's `name` and `description`, and ask which one they meant. Do not guess when there's real ambiguity — but if one result is an exact or near-exact filename/name match among several loose keyword matches, prefer it without asking.

3. **Read the full agent file**: `.claude/agents/<filename>.md`.

4. **Spawn a `general-purpose` Agent** (via the `Agent` tool) with a prompt structured like this:
   - An instruction to fully adopt the persona: *"Adopt the following persona and methodology completely for this task. This is your identity and rulebook — follow it exactly."*
   - The agent file's content from the first heading after the YAML frontmatter onward (skip the `---`-delimited frontmatter block itself; the persona's own rules and voice are what matter, not the raw metadata).
   - The user's task, with any relevant business context pulled from the conversation or repo (e.g. `GEMLABS-ACTION-PLAN.md`, `MARKETING-AUDIT.md`) if the task references "our" business, product, or existing docs.
   - An explicit instruction to produce the actual deliverable (real copy, real analysis, real numbers) — not a description of what the persona would do.

5. **Return the result** to the user, prefixed with which persona handled it, e.g. `Handled by: Outbound Strategist (.claude/agents/sales-outbound-strategist.md)`.

## Notes

- This is a workaround, not native subagent dispatch — each call costs one extra agent spawn's worth of tokens to load the persona.
- Frontmatter `name:` fields are Title Case and don't reliably match the kebab-case filename (e.g. `sales-outbound-strategist.md` has `name: Outbound Strategist`). Always resolve to a file via `scripts/agent-lookup.sh`, and only use the frontmatter `name:` for display.
- If the user asks to run more than one persona on related sub-tasks (e.g. an SEO agent and a content agent on the same page), dispatch each one separately and combine the outputs — don't try to merge personas into a single call.
