import { MemoComposer } from "@/app/components/MemoComposer";
import { getSupabaseServer } from "@/lib/supabase/server";

type MemoRow = {
  id: string;
  content: string;
  created_at: string;
};

type CardRow = {
  id: string;
  title: string;
  connection: string;
  opposition: string;
  reasoning: string | null;
  confidence: number | null;
  memo_a_content: string;
  memo_b_content: string;
  created_at: string;
};

export default async function Home() {
  const supabase = getSupabaseServer();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">ODNAR Memo</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">먼저 환경변수를 채워주세요.</p>
          </header>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm leading-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="font-semibold">1) Supabase 테이블 생성</p>
            <p className="mt-1">
              Supabase SQL Editor에서 <span className="font-mono">supabase/sql/000_mvp_schema.sql</span> 실행
            </p>
            <p className="mt-4 font-semibold">2) .env.local 채우기</p>
            <p className="mt-1">
              <span className="font-mono">C:\\Users\\winn\\ODNAR-MVP\\odnar-mvp\\.env.local</span>
            </p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / ANTHROPIC_API_KEY
            </p>
            <p className="mt-4 font-semibold">3) 실행</p>
            <p className="mt-1 font-mono">npm run dev</p>
          </div>
        </div>
      </div>
    );
  }

  const [{ data: memos, error: memosErr }, { data: cards, error: cardsErr }] = await Promise.all([
    supabase.from("memos").select("id, content, created_at").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("contradiction_cards")
      .select("id, title, connection, opposition, reasoning, confidence, memo_a_content, memo_b_content, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">ODNAR Memo</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            메모 5개 이상이면 Claude가 읽고 “연결되지만 서로 반대”인 두 메모를 카드로 뽑아줘요.
          </p>
        </header>

        <section className="mb-8">
          <MemoComposer />
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            {memosErr || cardsErr ? (
              <p>
                Supabase 테이블이 아직 없을 수 있어요. Supabase SQL Editor에서{" "}
                <span className="font-mono">supabase/sql/000_mvp_schema.sql</span>을 실행해 주세요.
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-8">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">최근 메모</h2>
            <div className="grid gap-2">
              {((memos ?? []) as MemoRow[]).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  아직 메모가 없어요.
                </div>
              ) : (
                ((memos ?? []) as MemoRow[]).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm leading-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className="mt-2 text-xs text-zinc-500">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">연결되지만 반대인 카드</h2>
            <div className="grid gap-3">
              {((cards ?? []) as CardRow[]).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  카드가 아직 없어요. 메모가 5개 이상 쌓이면 생성돼요.
                </div>
              ) : (
                ((cards ?? []) as CardRow[]).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold">{c.title}</h3>
                      <p className="text-xs text-zinc-500">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold">연결:</span> {c.connection}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold">반대:</span> {c.opposition}
                    </p>
                    {c.reasoning ? (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{c.reasoning}</p>
                    ) : null}
                    <div className="mt-3 grid gap-2 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
                      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">메모 A</p>
                        <p className="mt-1 whitespace-pre-wrap leading-6">{c.memo_a_content}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">메모 B</p>
                        <p className="mt-1 whitespace-pre-wrap leading-6">{c.memo_b_content}</p>
                      </div>
                    </div>
                    {c.confidence != null ? (
                      <p className="mt-2 text-xs text-zinc-500">confidence: {c.confidence.toFixed(2)}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
