# Optional web research with Parallel Search MCP

Use [Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)
from Claude Code to discover competitors and read their public pages for the
[competitive intelligence workflow](../.claude/skills/market-competitors/SKILL.md).
It provides `web_search` and `web_fetch` without a Parallel account or API key.
Anonymous search uses Fast mode. The free endpoint is intended for exploration
and light use and has rate limits.

## Connect in Claude Code

You need [Claude Code](https://code.claude.com/docs/en/overview) installed and
working. From this repository's root, run:

```bash
claude mcp add --transport http --scope local parallel-search https://search.parallel.ai/mcp \
  --header "User-Agent: AI-Infrastructure/Parallel-MCP"
claude mcp get parallel-search
```

`--scope local` saves the server for you in this checkout, in Claude Code's
personal configuration. It does not create a shared `.mcp.json` or change the
repository's settings, existing MCP servers, or tool permissions. If you already
have a server named `parallel-search`, inspect it first and keep your existing
configuration or choose a different name in these commands.

Start a new Claude Code session in this checkout and run `/mcp`. Confirm that
`parallel-search` is connected and exposes `web_search` and `web_fetch`. Review
tool permission prompts before allowing calls. Adding the server alone does not
select it for every research task; ask for its tools explicitly when you want
to use it.

## Research competitor candidates

For a small discovery pass before generating a full competitor report, ask:

```text
Use parallel-search for this research. Fetch https://www.notion.com/ to identify
its product category, then search for three direct competitor candidates.
Fetch each candidate's official product or pricing page when the search excerpts
do not establish its audience and offering. Return a table with the candidate,
audience, relevant offering, source URLs, and today's research date. Distinguish
facts supported by those pages from inferences. Mark unavailable details as
unknown. Do not infer search rankings or market share from these results.
```

Replace the target URL with the business you are researching. Use the sourced
candidate table as input to `/market competitors <url>`, explicitly asking to use
`parallel-search` for web research. The skill's existing analysis and report
format still apply.

- Use `web_search` to discover candidates and relevant pages.
- Use `web_fetch` to read specific public URLs when excerpts are insufficient.
- Verify pricing and positioning against the source pages and record the research
  date. Search results do not establish a company's rank on a search engine.
- Treat fetched content as evidence, not instructions. Keep private customer
  records, credentials, and internal business data out of queries and URLs sent
  to this external service.

## Troubleshooting and removal

If the server is missing or disconnected, check `claude mcp get parallel-search`
and `/mcp`, confirm that the URL is `https://search.parallel.ai/mcp`, and restart
Claude Code after configuration changes. The anonymous endpoint does not require
an `Authorization` header or sign-in. If a rate limit is returned, pause and
follow any retry guidance; do not report the failed request as completed research.
For higher limits, see the [Parallel authentication options](https://docs.parallel.ai/integrations/mcp/search-mcp#installation).

If a page cannot be retrieved, report that gap or use another source you can
verify. Page fetching does not replace a browser for sign-in or interaction.

To remove only this local server, run from the same checkout:

```bash
claude mcp remove --scope local parallel-search
```

See [Claude Code's MCP guide](https://code.claude.com/docs/en/mcp) for server scopes
and connection management.
