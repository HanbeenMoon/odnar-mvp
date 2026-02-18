"use client";

import { useActionState, useEffect, useRef } from "react";
import { addMemo, type AddMemoState } from "@/app/actions";
import { SubmitButton } from "@/app/components/SubmitButton";

const initialState: AddMemoState = { ok: false };

export function MemoComposer() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [state, formAction] = useActionState(addMemo, initialState);

  useEffect(() => {
    if (state.ok && textareaRef.current) textareaRef.current.value = "";
  }, [state.ok]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <form action={formAction} className="flex flex-col gap-3">
        <textarea
          ref={textareaRef}
          name="content"
          placeholder="메모를 적고 저장하세요…"
          rows={4}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 shadow-sm outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {state.error ? <p className="text-red-600">{state.error}</p> : null}
            {state.ok && state.message ? <p className="text-emerald-700">{state.message}</p> : null}
          </div>
          <SubmitButton>저장</SubmitButton>
        </div>
      </form>
    </div>
  );
}

