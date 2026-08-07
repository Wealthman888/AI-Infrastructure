import axios, { AxiosError, AxiosInstance } from "axios";
import { API_BASE_URL, DEFAULT_TIMEOUT_MS } from "../constants.js";

let client: AxiosInstance | null = null;

export function getInstantlyClient(): AxiosInstance {
  if (client) return client;

  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "INSTANTLY_API_KEY environment variable is required. Generate a scoped API key at https://app.instantly.ai/app/settings/integrations and set it before starting this server."
    );
  }

  client = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  });

  return client;
}

export async function instantlyRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: { data?: unknown; params?: Record<string, unknown> } = {}
): Promise<T> {
  const http = getInstantlyClient();
  const response = await http.request<T>({
    method,
    url: path,
    data: options.data,
    params: options.params
  });
  return response.data;
}

export function handleInstantlyError(error: unknown, context: string): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string; error?: string }>;
    if (err.response) {
      const apiMessage = err.response.data?.message || err.response.data?.error;
      switch (err.response.status) {
        case 401:
          return "Error: Authentication failed. Check that INSTANTLY_API_KEY is set to a valid, unrevoked Instantly API key.";
        case 403:
          return `Error: Permission denied for ${context}. This API key may lack the required scope for this operation.`;
        case 404:
          return `Error: Resource not found while trying to ${context}. Double-check the ID/identifier passed in.`;
        case 422:
          return `Error: Invalid request while trying to ${context}${apiMessage ? `: ${apiMessage}` : ". Check the parameters you supplied."}`;
        case 429:
          return "Error: Rate limit exceeded on the Instantly API. Wait a bit before retrying.";
        default:
          return `Error: Instantly API request failed (status ${err.response.status}) while trying to ${context}${apiMessage ? `: ${apiMessage}` : ""}`;
      }
    } else if (err.code === "ECONNABORTED") {
      return `Error: Request to Instantly API timed out while trying to ${context}. Please try again.`;
    }
  }
  return `Error: Unexpected error while trying to ${context}: ${error instanceof Error ? error.message : String(error)}`;
}
