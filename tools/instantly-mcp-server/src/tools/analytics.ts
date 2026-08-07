import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { instantlyRequest, handleInstantlyError } from "../services/instantlyClient.js";
import { toJsonContent, toErrorContent } from "../services/format.js";

const CampaignAnalyticsInputSchema = z
  .object({
    campaign_ids: z
      .array(z.string())
      .optional()
      .describe("Restrict to these campaign IDs. Omit to get analytics across all campaigns in the workspace."),
    start_date: z.string().optional().describe("ISO date (YYYY-MM-DD) to start the analytics window"),
    end_date: z.string().optional().describe("ISO date (YYYY-MM-DD) to end the analytics window")
  })
  .strict();

const DailyCampaignAnalyticsInputSchema = z
  .object({
    campaign_id: z.string().min(1).describe("The Instantly campaign ID to get daily analytics for"),
    start_date: z.string().optional().describe("ISO date (YYYY-MM-DD) to start the analytics window"),
    end_date: z.string().optional().describe("ISO date (YYYY-MM-DD) to end the analytics window")
  })
  .strict();

export function registerAnalyticsTools(server: McpServer): void {
  server.registerTool(
    "instantly_get_campaign_analytics",
    {
      title: "Get Instantly Campaign Analytics",
      description: `Get aggregate performance analytics (sent, opens, clicks, replies, bounces, unsubscribes, interested leads) for one or more campaigns over a date range.

Args:
  - campaign_ids (string[], optional): Restrict to these campaign IDs. Omit for all campaigns.
  - start_date (string, optional): ISO date (YYYY-MM-DD) window start
  - end_date (string, optional): ISO date (YYYY-MM-DD) window end

Returns JSON with per-campaign aggregate metrics.

Error Handling:
  - "Error: Invalid request" (422) if start_date is after end_date`,
      inputSchema: CampaignAnalyticsInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("GET", "/campaigns/analytics", {
          params: {
            campaign_ids: params.campaign_ids?.join(","),
            start_date: params.start_date,
            end_date: params.end_date
          }
        });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, "get campaign analytics"));
      }
    }
  );

  server.registerTool(
    "instantly_get_daily_campaign_analytics",
    {
      title: "Get Instantly Daily Campaign Analytics",
      description: `Get a day-by-day performance breakdown (sent, opens, clicks, replies, bounces) for a single campaign over a date range — useful for spotting trends or drop-offs.

Args:
  - campaign_id (string): The Instantly campaign ID
  - start_date (string, optional): ISO date (YYYY-MM-DD) window start
  - end_date (string, optional): ISO date (YYYY-MM-DD) window end

Returns JSON with an array of daily metric snapshots.`,
      inputSchema: DailyCampaignAnalyticsInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await instantlyRequest<any>("GET", "/campaigns/analytics/daily", {
          params: {
            campaign_id: params.campaign_id,
            start_date: params.start_date,
            end_date: params.end_date
          }
        });
        return toJsonContent(data);
      } catch (error) {
        return toErrorContent(handleInstantlyError(error, `get daily analytics for campaign '${params.campaign_id}'`));
      }
    }
  );
}
