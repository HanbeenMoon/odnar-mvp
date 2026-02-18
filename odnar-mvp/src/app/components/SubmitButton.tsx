"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending ? "저장 중..." : children}
    </button>
  );
}

