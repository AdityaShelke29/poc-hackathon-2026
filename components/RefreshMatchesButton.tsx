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
      className="btn btn-ghost"
    >
      {isPending ? "Refreshing..." : "Refresh matches"}
    </button>
  );
}
