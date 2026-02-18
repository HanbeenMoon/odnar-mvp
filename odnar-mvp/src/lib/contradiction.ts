import "server-only";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/claude";
import { envServer } from "@/lib/env/server";

export type MemoForAnalysis = {
  id: string;
  content: string;
};

const CardSchema = z
  .object({
    memo_a_id: z.string().uuid(),
    memo_b_id: z.string().uuid(),
    title: z.string().min(1).max(80),
    connection: z.string().min(1).max(280),
    opposition: z.string().min(1).max(280),
    reasoning: z.string().min(1).max(800).optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
  .refine((v) => v.memo_a_id !== v.memo_b_id, { message: "memos must be distinct" });

export type ContradictionCard = z.infer<typeof CardSchema>;

export async function findContradictionCard(memos: MemoForAnalysis[]): Promise<ContradictionCard | null> {
  if (memos.length < 5) return null;

  const anthropic = getAnthropicClient();
  if (!anthropic) return null;

  const toolName = "create_contradiction_card";
  const model = envServer.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

  const memoLines = memos
    .map((m, idx) => `${idx + 1}. id=${m.id}\n${m.content}`)
    .join("\n\n");

  const res = await anthropic.messages.create({
    model,
    max_tokens: 700,
    temperature: 0.2,
    system:
      "You read a set of short personal memos. Your job: pick TWO memos that are clearly connected (same topic) but express opposite stances or conclusions. If you cannot find a strong pair, still pick the best pair but lower confidence. Output via the provided tool only.",
    messages: [
      {
        role: "user",
        content:
          "Here are the memos. Pick two memos that are connected but opposite.\n\n" +
          memoLines +
          "\n\nReturn a short title, 1-2 sentence connection, 1-2 sentence opposition, and optional reasoning + confidence (0..1).",
      },
    ],
    tools: [
      {
        name: toolName,
        description: "Create a 'connected but opposite' card using two memo IDs from the provided list.",
        input_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            memo_a_id: { type: "string", description: "UUID of memo A" },
            memo_b_id: { type: "string", description: "UUID of memo B" },
            title: { type: "string" },
            connection: { type: "string" },
            opposition: { type: "string" },
            reasoning: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["memo_a_id", "memo_b_id", "title", "connection", "opposition"],
        },
      },
    ],
    tool_choice: { type: "tool", name: toolName },
  });

  const toolUse = res.content.find((c) => c.type === "tool_use" && c.name === toolName);
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const parsed = CardSchema.safeParse(toolUse.input);
  if (!parsed.success) return null;

  const ids = new Set(memos.map((m) => m.id));
  if (!ids.has(parsed.data.memo_a_id) || !ids.has(parsed.data.memo_b_id)) return null;

  return parsed.data;
}

