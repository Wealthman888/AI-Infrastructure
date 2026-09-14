import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateAuditRequestSchema } from "@/lib/validation/schemas";
import { aiAuditResultSchema } from "@/lib/validation/schemas";
import { AI_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { SUBMIT_AUDIT_TOOL } from "@/lib/ai/tool-schema";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";

function clientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(clientKey(req));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many AI generation requests. Please wait before trying again." },
      { status: 429, headers: rate.retryAfterSeconds ? { "Retry-After": String(rate.retryAfterSeconds) } : undefined },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI generation is not configured on this server." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = generateAuditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid audit data.", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      system: [{ type: "text", text: AI_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserPrompt(parsed.data) }],
      tools: [SUBMIT_AUDIT_TOOL],
      tool_choice: { type: "tool", name: "submit_audit" },
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === "submit_audit",
    );

    if (!toolUse) {
      return NextResponse.json({ error: "The AI response did not include a structured audit." }, { status: 502 });
    }

    const resultParsed = aiAuditResultSchema.omit({ generatedAt: true }).safeParse(toolUse.input);
    if (!resultParsed.success) {
      return NextResponse.json({ error: "The AI response did not match the expected audit structure." }, { status: 502 });
    }

    return NextResponse.json({ ...resultParsed.data, generatedAt: new Date().toISOString() });
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status ?? 502 : 502;
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status });
  }
}
