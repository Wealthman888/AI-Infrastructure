import { CHARACTER_LIMIT } from "../constants.js";

export function toJsonContent(output: unknown): { content: { type: "text"; text: string }[]; structuredContent: Record<string, unknown> } {
  let text = JSON.stringify(output, null, 2);
  const structuredContent = output as Record<string, unknown>;

  if (text.length > CHARACTER_LIMIT && Array.isArray((structuredContent as any).items)) {
    const items = (structuredContent as any).items as unknown[];
    const truncated = items.slice(0, Math.max(1, Math.floor(items.length / 2)));
    const truncatedOutput = {
      ...structuredContent,
      items: truncated,
      truncated: true,
      truncation_message: `Response truncated from ${items.length} to ${truncated.length} items. Narrow your filters or use pagination to see more.`
    };
    text = JSON.stringify(truncatedOutput, null, 2);
    return { content: [{ type: "text", text }], structuredContent: truncatedOutput };
  }

  return { content: [{ type: "text", text }], structuredContent };
}

export function toErrorContent(message: string): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: message }] };
}
