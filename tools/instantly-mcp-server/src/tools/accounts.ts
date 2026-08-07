import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { instantlyRequest, handleInstantlyError } from "../services/instantlyClient.js";
import { toJsonContent, toErrorContent } from "../services/format.js";

const ListAccountsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum sending accounts to return"),
    starting_after: z.string().optional().describe("Pagination cursor from a previous response")
  })
  .strict();

const GetAccountInputSchema = z
  .object({
    email: z.string().email().describe("Email address of the sending account")
  })
  .strict();

const WarmupStatusInputSchema = z
  .object({
    emails: z
      .array(z.string().email())
      .min(1)
      .max(50)
      .describe("Email addresses of sending accounts to fetch warmup analytics for")
  })
  .strict();

export function registerAccountTools(server: McpServer): void {
  server.registerTool(
    "instantly_list_accounts",
    {
      title: "List Instantly Sending Accounts",
      description: `List the email sending accounts (mailboxes) connected to the Instantly workspace, used to send campaigns.

Args:
  - limit (number): Max accounts to return, 1-100 (default 20)
  - starting_after (string, optional): Pagination cursor from a prior call

Returns JSON with: items (account objects with email, warmup status, daily limit, connection health), next_starting_after.`,
      inputSchema: ListAccountsInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("GET", "/accounts", {
          params: { limit: params.limit, starting_after: params.starting_after }
        });
        const items = data.items ?? data ?? [];
        return toJsonContent({
          count: Array.isArray(items) ? items.length : 0,
          items,
          next_starting_after: data.next_starting_after ?? null
        });
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, "list sending accounts"));
      }
    }
  );

  server.registerTool(
    "instantly_get_account",
    {
      title: "Get Instantly Sending Account",
      description: `Fetch details for a single Instantly sending account by email, including its warmup and connection status.

Args:
  - email (string): The sending account's email address

Returns JSON with the full account object.`,
      inputSchema: GetAccountInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("GET", `/accounts/${encodeURIComponent(params.email)}`);
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `get sending account '${params.email}'`));
      }
    }
  );

  server.registerTool(
    "instantly_get_warmup_status",
    {
      title: "Get Instantly Warmup Status",
      description: `Fetch email warmup analytics (health/deliverability signals) for one or more sending accounts.

Args:
  - emails (string[]): Up to 50 sending-account email addresses to check

Returns JSON with per-account warmup stats (e.g. warmup score, emails sent/landed in inbox vs. spam).

Error Handling:
  - "Error: Resource not found" if none of the emails belong to this workspace's connected accounts`,
      inputSchema: WarmupStatusInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", "/accounts/warmup-analytics", {
          data: { emails: params.emails }
        });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, "get warmup status"));
      }
    }
  );
}
