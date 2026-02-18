"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { findContradictionCard } from "@/lib/contradiction";
import { envServer } from "@/lib/env/server";

export type AddMemoState = {
  ok: boolean;
  message?: string;
  error?: string;
};

const AddMemoSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export async function addMemo(_prev: AddMemoState, formData: FormData): Promise<AddMemoState> {
  const parsed = AddMemoSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { ok: false, error: "메모를 입력해줘 (1~1000자)." };
  }

  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: ".env.local에서 Supabase 환경변수를 먼저 채워줘." };

  const { data: inserted, error: insertErr } = await supabase
    .from("memos")
    .insert({ content: parsed.data.content })
    .select("id, content, created_at")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "메모 저장 실패" };
  }

  // Only create ONE Claude card for MVP (first time memos reach >= 5).
  const [{ count: memosCount }, { count: cardsCount }] = await Promise.all([
    supabase.from("memos").select("id", { count: "exact", head: true }),
    supabase.from("contradiction_cards").select("id", { count: "exact", head: true }),
  ]);

  if ((memosCount ?? 0) >= 5 && (cardsCount ?? 0) === 0 && envServer.ANTHROPIC_API_KEY) {
    const { data: memos } = await supabase
      .from("memos")
      .select("id, content")
      .order("created_at", { ascending: false })
      .limit(20);

    if (memos && memos.length >= 5) {
      const card = await findContradictionCard(memos);
      if (card) {
        const byId = new Map(memos.map((m) => [m.id, m.content]));
        const memoAContent = byId.get(card.memo_a_id);
        const memoBContent = byId.get(card.memo_b_id);
        if (memoAContent && memoBContent) {
          const [low, high] =
            card.memo_a_id < card.memo_b_id ? [card.memo_a_id, card.memo_b_id] : [card.memo_b_id, card.memo_a_id];

          await supabase.from("contradiction_cards").upsert(
            {
              memo_a_id: card.memo_a_id,
              memo_b_id: card.memo_b_id,
              memo_low_id: low,
              memo_high_id: high,
              memo_a_content: memoAContent,
              memo_b_content: memoBContent,
              title: card.title,
              connection: card.connection,
              opposition: card.opposition,
              reasoning: card.reasoning ?? null,
              confidence: card.confidence ?? null,
              model: envServer.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
            },
            { onConflict: "memo_low_id,memo_high_id", ignoreDuplicates: true },
          );
        }
      }
    }
  }

  revalidatePath("/");
  return { ok: true, message: "저장됨" };
}

