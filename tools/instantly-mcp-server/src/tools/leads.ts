import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { instantlyRequest, handleInstantlyError } from "../services/instantlyClient.js";
import { toJsonContent, toErrorContent } from "../services/format.js";

const DOCS_NOTE =
  "Field shapes follow the Instantly API v2 reference (https://developer.instantly.ai/api-reference) — verify exact field names there if a request is rejected as invalid.";

const ListLeadsInputSchema = z
  .object({
    campaign_id: z.string().optional().describe("Filter leads to this campaign ID"),
    list_id: z.string().optional().describe("Filter leads to this lead list ID"),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum leads to return"),
    starting_after: z.string().optional().describe("Pagination cursor from a previous response")
  })
  .strict();

const AddLeadInputSchema = z
  .object({
    email: z.string().email().describe("Lead's email address"),
    campaign_id: z.string().optional().describe("Campaign to enroll this lead in"),
    list_id: z.string().optional().describe("Lead list to add this lead to"),
    first_name: z.string().optional().describe("Lead's first name"),
    last_name: z.string().optional().describe("Lead's last name"),
    company_name: z.string().optional().describe("Lead's company name"),
    body: z
      .record(z.unknown())
      .optional()
      .describe(`Additional raw lead fields (custom variables, phone, website, etc.), merged into the request body. ${DOCS_NOTE}`)
  })
  .strict();

const UpdateLeadInputSchema = z
  .object({
    lead_id: z.string().min(1).describe("The Instantly lead ID to update"),
    body: z.record(z.unknown()).describe(`Fields to update on the lead (e.g. status, custom variables). ${DOCS_NOTE}`)
  })
  .strict();

const ListLeadListsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum lead lists to return"),
    starting_after: z.string().optional().describe("Pagination cursor from a previous response")
  })
  .strict();

const CreateLeadListInputSchema = z
  .object({
    name: z.string().min(1).describe("Name for the new lead list")
  })
  .strict();

export function registerLeadTools(server: McpServer): void {
  server.registerTool(
    "instantly_list_leads",
    {
      title: "List/Search Instantly Leads",
      description: `Search leads in the Instantly workspace, optionally scoped to a campaign or lead list.

Args:
  - campaign_id (string, optional): Only return leads enrolled in this campaign
  - list_id (string, optional): Only return leads in this lead list
  - limit (number): Max leads to return, 1-100 (default 20)
  - starting_after (string, optional): Pagination cursor from a prior call

Returns JSON with: items (lead objects with email, name, status, campaign), next_starting_after (cursor, if more results exist).`,
      inputSchema: ListLeadsInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", "/leads/list", {
          data: {
            campaign: params.campaign_id,
            list_id: params.list_id,
            limit: params.limit,
            starting_after: params.starting_after
          }
        });
        const items = data.items ?? data.leads ?? data ?? [];
        return toJsonContent({
          count: Array.isArray(items) ? items.length : 0,
          items,
          next_starting_after: data.next_starting_after ?? null
        });
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, "list leads"));
      }
    }
  );

  server.registerTool(
    "instantly_add_lead",
    {
      title: "Add Instantly Lead",
      description: `Add a new lead (email contact) to Instantly, optionally enrolling it directly into a campaign or lead list.

Args:
  - email (string, required): Lead's email address
  - campaign_id (string, optional): Campaign to enroll the lead in
  - list_id (string, optional): Lead list to add the lead to
  - first_name, last_name, company_name (string, optional)
  - body (object, optional): Additional raw fields (custom variables, phone, etc.). ${DOCS_NOTE}

Returns JSON with the created lead object.

Error Handling:
  - "Error: Invalid request" (422) if neither campaign_id nor list_id is supplied and one is required by the workspace's setup`,
      inputSchema: AddLeadInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", "/leads", {
          data: {
            email: params.email,
            campaign: params.campaign_id,
            list_id: params.list_id,
            first_name: params.first_name,
            last_name: params.last_name,
            company_name: params.company_name,
            ...(params.body ?? {})
          }
        });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `add lead '${params.email}'`));
      }
    }
  );

  server.registerTool(
    "instantly_update_lead",
    {
      title: "Update Instantly Lead",
      description: `Update fields on an existing Instantly lead, such as its interest status or custom variables.

Args:
  - lead_id (string): The Instantly lead ID to update
  - body (object): Fields to patch on the lead. ${DOCS_NOTE}

Returns JSON with the updated lead object.`,
      inputSchema: UpdateLeadInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", "/leads/update", {
          data: { id: params.lead_id, ...params.body }
        });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `update lead '${params.lead_id}'`));
      }
    }
  );

  server.registerTool(
    "instantly_list_lead_lists",
    {
      title: "List Instantly Lead Lists",
      description: `List the lead lists (static contact lists) in the Instantly workspace.

Args:
  - limit (number): Max lead lists to return, 1-100 (default 20)
  - starting_after (string, optional): Pagination cursor from a prior call

Returns JSON with: items (lead list objects with id, name, lead count), next_starting_after.`,
      inputSchema: ListLeadListsInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("GET", "/lead-lists", {
          params: { limit: params.limit, starting_after: params.starting_after }
        });
        const items = data.items ?? data ?? [];
        return toJsonContent({
          count: Array.isArray(items) ? items.length : 0,
          items,
          next_starting_after: data.next_starting_after ?? null
        });
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, "list lead lists"));
      }
    }
  );

  server.registerTool(
    "instantly_create_lead_list",
    {
      title: "Create Instantly Lead List",
      description: `Create a new, empty lead list in the Instantly workspace that leads can be added to.

Args:
  - name (string): Name for the new lead list

Returns JSON with the created lead list object, including its new id.`,
      inputSchema: CreateLeadListInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("POST", "/lead-lists", { data: { name: params.name } });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `create lead list '${params.name}'`));
      }
    }
  );
}
