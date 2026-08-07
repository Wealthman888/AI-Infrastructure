import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { instantlyRequest, handleInstantlyError } from "../services/instantlyClient.js";
import { toJsonContent, toErrorContent } from "../services/format.js";

const DOCS_NOTE =
  "Field shapes follow the Instantly API v2 reference (https://developer.instantly.ai/api-reference) — verify exact field names there if a request is rejected as invalid.";

const ListCampaignsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum campaigns to return"),
    starting_after: z.string().optional().describe("Cursor from a previous response's next_starting_after, for pagination"),
    search: z.string().optional().describe("Filter campaigns by name substring")
  })
  .strict();

const GetCampaignInputSchema = z
  .object({
    campaign_id: z.string().min(1).describe("The Instantly campaign ID")
  })
  .strict();

const CreateCampaignInputSchema = z
  .object({
    name: z.string().min(1).describe("Campaign name"),
    body: z
      .record(z.unknown())
      .optional()
      .describe(
        `Additional raw campaign fields per the Instantly v2 create-campaign schema (e.g. campaign_schedule, sequences, email_list). Merged into the request body alongside "name". ${DOCS_NOTE}`
      )
  })
  .strict();

const UpdateCampaignInputSchema = z
  .object({
    campaign_id: z.string().min(1).describe("The Instantly campaign ID to update"),
    body: z.record(z.unknown()).describe(`Raw fields to patch on the campaign. ${DOCS_NOTE}`)
  })
  .strict();

const CampaignActionInputSchema = z
  .object({
    campaign_id: z.string().min(1).describe("The Instantly campaign ID")
  })
  .strict();

export function registerCampaignTools(server: McpServer): void {
  server.registerTool(
    "instantly_list_campaigns",
    {
      title: "List Instantly Campaigns",
      description: `List cold email campaigns in the connected Instantly workspace, with optional name search and cursor pagination.

Args:
  - limit (number): Max campaigns to return, 1-100 (default 20)
  - starting_after (string, optional): Pagination cursor from a prior call's next_starting_after
  - search (string, optional): Filter by campaign name substring

Returns JSON with: items (campaign objects including id, name, status), next_starting_after (cursor, if more results exist).

Error Handling:
  - "Error: Authentication failed" if INSTANTLY_API_KEY is missing/invalid
  - "Error: Rate limit exceeded" on 429 responses`,
      inputSchema: ListCampaignsInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("GET", "/campaigns", {
          params: { limit: params.limit, starting_after: params.starting_after, search: params.search }
        });
        const items = data.items ?? data.campaigns ?? data ?? [];
        return toJsonContent({
          count: Array.isArray(items) ? items.length : 0,
          items,
          next_starting_after: data.next_starting_after ?? null
        });
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, "list campaigns"));
      }
    }
  );

  server.registerTool(
    "instantly_get_campaign",
    {
      title: "Get Instantly Campaign",
      description: `Fetch full details for a single Instantly campaign by ID, including its sequences, schedule, and current status.

Args:
  - campaign_id (string): The Instantly campaign ID

Returns JSON with the full campaign object.

Error Handling:
  - "Error: Resource not found" if campaign_id doesn't exist in this workspace`,
      inputSchema: GetCampaignInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("GET", `/campaigns/${encodeURIComponent(params.campaign_id)}`);
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `get campaign '${params.campaign_id}'`));
      }
    }
  );

  server.registerTool(
    "instantly_create_campaign",
    {
      title: "Create Instantly Campaign",
      description: `Create a new cold email campaign in Instantly. Does NOT start sending — use instantly_start_campaign afterward to launch it.

Args:
  - name (string): Campaign name
  - body (object, optional): Additional raw campaign fields (schedule, sequences, sending accounts, etc.) per the Instantly v2 API. ${DOCS_NOTE}

Returns JSON with the created campaign object, including its new id.

Error Handling:
  - "Error: Invalid request" (422) if required fields like a sequence or sending schedule are missing`,
      inputSchema: CreateCampaignInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", "/campaigns", {
          data: { name: params.name, ...(params.body ?? {}) }
        });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `create campaign '${params.name}'`));
      }
    }
  );

  server.registerTool(
    "instantly_update_campaign",
    {
      title: "Update Instantly Campaign",
      description: `Patch fields on an existing Instantly campaign (e.g. rename it, change its schedule or sequence).

Args:
  - campaign_id (string): The Instantly campaign ID to update
  - body (object): Fields to patch, per the Instantly v2 API. ${DOCS_NOTE}

Returns JSON with the updated campaign object.`,
      inputSchema: UpdateCampaignInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("PATCH", `/campaigns/${encodeURIComponent(params.campaign_id)}`, {
          data: params.body
        });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `update campaign '${params.campaign_id}'`));
      }
    }
  );

  server.registerTool(
    "instantly_start_campaign",
    {
      title: "Start/Launch Instantly Campaign",
      description: `Activate an Instantly campaign so it starts sending emails to its leads on schedule.

Args:
  - campaign_id (string): The Instantly campaign ID to launch

Returns JSON confirming the campaign's new status (should be "active").

Warning: This has a real-world side effect — it starts sending outbound email to leads in the campaign.`,
      inputSchema: CampaignActionInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", `/campaigns/${encodeURIComponent(params.campaign_id)}/activate`);
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `start campaign '${params.campaign_id}'`));
      }
    }
  );

  server.registerTool(
    "instantly_pause_campaign",
    {
      title: "Pause Instantly Campaign",
      description: `Pause an active Instantly campaign, stopping further sends until it's resumed with instantly_start_campaign.

Args:
  - campaign_id (string): The Instantly campaign ID to pause

Returns JSON confirming the campaign's new status (should be "paused").`,
      inputSchema: CampaignActionInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", `/campaigns/${encodeURIComponent(params.campaign_id)}/pause`);
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `pause campaign '${params.campaign_id}'`));
      }
    }
  );
}
