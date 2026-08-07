#!/usr/bin/env node
/**
 * MCP server for Instantly.ai (cold email outreach) API v2.
 * Exposes campaign, lead, sending-account, and analytics tools over stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCampaignTools } from "./tools/campaigns.js";
import { registerLeadTools } from "./tools/leads.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerAnalyticsTools } from "./tools/analytics.js";

const server = new McpServer({
  name: "instantly-mcp-server",
  version: "1.0.0"
});

registerCampaignTools(server);
registerLeadTools(server);
registerAccountTools(server);
registerAnalyticsTools(server);

async function main(): Promise<void> {
  if (!process.env.INSTANTLY_API_KEY) {
    console.error(
      "ERROR: INSTANTLY_API_KEY environment variable is required. " +
        "Create a scoped API key at https://app.instantly.ai/app/settings/integrations and export it before starting this server."
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("instantly-mcp-server running via stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
