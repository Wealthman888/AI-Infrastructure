# instantly-mcp-server

MCP server wrapping the [Instantly.ai](https://instantly.ai) v2 API (cold email
outreach: campaigns, leads, sending accounts, analytics), authenticated with
your Instantly API key. There is no official Instantly connector in the
Anthropic connector directory, so this is a self-hosted MCP server that runs
locally (stdio transport) and is registered per-project.

## 1. Get an Instantly API key

1. Log in to Instantly at https://app.instantly.ai
2. Go to **Settings → Integrations → API Keys**
3. Create a new key. Scope it to only the resources you need (campaigns,
   leads, accounts, analytics) if your plan supports scoped keys.
4. Copy the key — you won't be able to see it again.

## 2. Install and build

```bash
cd tools/instantly-mcp-server
npm install
npm run build
```

This produces `dist/index.js`, the server's entry point.

## 3. Set your API key

Never commit the key. Export it as an environment variable, or store it in a
local `.env` file (already gitignored in this folder):

```bash
export INSTANTLY_API_KEY=sk_...
```

## 4. Register the server with Claude Code

Add it to this project's `.mcp.json` (create the file at the repo root if it
doesn't exist yet):

```json
{
  "mcpServers": {
    "instantly": {
      "command": "node",
      "args": ["tools/instantly-mcp-server/dist/index.js"],
      "env": {
        "INSTANTLY_API_KEY": "${INSTANTLY_API_KEY}"
      }
    }
  }
}
```

Claude Code substitutes `${INSTANTLY_API_KEY}` from your shell environment at
launch, so the key itself never lands in the repo. Restart Claude Code (or
run `/mcp` to reconnect) after adding this.

For the Claude Desktop app instead, add the same block (with an absolute path
to `dist/index.js`) to your `claude_desktop_config.json`.

## Tools

| Tool | Description |
|---|---|
| `instantly_list_campaigns` | List campaigns, with name search and pagination |
| `instantly_get_campaign` | Get full details for one campaign |
| `instantly_create_campaign` | Create a new campaign |
| `instantly_update_campaign` | Patch fields on a campaign |
| `instantly_start_campaign` | Launch/activate a campaign (starts sending) |
| `instantly_pause_campaign` | Pause a running campaign |
| `instantly_list_leads` | Search leads, optionally scoped to a campaign or list |
| `instantly_add_lead` | Add a lead, optionally enrolling into a campaign/list |
| `instantly_update_lead` | Update fields on a lead |
| `instantly_list_lead_lists` | List lead lists |
| `instantly_create_lead_list` | Create a new empty lead list |
| `instantly_list_accounts` | List connected sending accounts (mailboxes) |
| `instantly_get_account` | Get details for one sending account |
| `instantly_get_warmup_status` | Get warmup/deliverability analytics for accounts |
| `instantly_get_campaign_analytics` | Aggregate performance analytics for campaigns |
| `instantly_get_daily_campaign_analytics` | Day-by-day performance breakdown for one campaign |

Tools that accept a `body` field (`instantly_create_campaign`,
`instantly_update_campaign`, `instantly_add_lead`, `instantly_update_lead`)
pass it through as raw JSON merged into the request — use this for any
Instantly field not lifted to a top-level parameter.

## Notes on endpoint accuracy

This server was built against Instantly's documented v2 API shape (base URL
`https://api.instantly.ai/api/v2`, Bearer token auth, `/campaigns`, `/leads`,
`/lead-lists`, `/accounts` resource groups). The build environment used to
write this server could not reach `developer.instantly.ai` /
`api.instantly.ai` to pull the live OpenAPI spec (network policy blocked it),
so a couple of endpoint paths — especially `POST /leads/list` for search and
the exact analytics query params — are inferred from public documentation
rather than verified live. If a tool call comes back with a 404 or 422, check
the path/body shape against https://developer.instantly.ai/api-reference and
adjust the relevant function in `src/tools/`.

## Development

```bash
npm run dev    # tsx watch, runs src/index.ts directly
npm run build  # compile to dist/
```

Test with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector --cli node dist/index.js -e INSTANTLY_API_KEY=sk_... --method tools/list
```
