"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RefreshMatchesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="rounded-md border border-stone-300 bg-white px-5 py-3 text-center font-black text-stone-900 hover:border-emerald-700 disabled:cursor-wait disabled:text-stone-500"
    >
      {isPending ? "Refreshing..." : "Refresh matches"}
    </button>
  );
}
