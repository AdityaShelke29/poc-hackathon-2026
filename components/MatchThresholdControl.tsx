"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const minThreshold = 0.45;
const maxThreshold = 0.9;
const defaultThreshold = 0.6;

function thresholdToInclusiveness(threshold: number) {
  return Math.round(((threshold - minThreshold) / (maxThreshold - minThreshold)) * 100);
}

function inclusivenessToThreshold(inclusiveness: string) {
  const value = Math.min(100, Math.max(0, Number(inclusiveness)));
  return minThreshold + (value / 100) * (maxThreshold - minThreshold);
}

function modeLabel(inclusiveness: number) {
  if (inclusiveness < 25) return "Precise";
  if (inclusiveness < 55) return "Balanced";
  if (inclusiveness < 80) return "Inclusive";
  return "Broad";
}

export default function MatchThresholdControl({ threshold }: { threshold: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(String(thresholdToInclusiveness(threshold)));
  const [isPending, startTransition] = useTransition();
  const inclusiveness = Math.min(100, Math.max(0, Number(value)));
  const currentMode = modeLabel(inclusiveness);

  function applyThreshold(nextValue = value) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("threshold", inclusivenessToThreshold(nextValue).toFixed(2));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function resetThreshold() {
    setValue(String(thresholdToInclusiveness(defaultThreshold)));
    const params = new URLSearchParams(searchParams.toString());
    params.delete("threshold");
    startTransition(() => router.push(params.size ? `${pathname}?${params.toString()}` : pathname));
  }

  return (
    <section className="mt-8 rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <label className="block text-sm font-black" htmlFor="match-threshold">
            Match style
          </label>
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800">{currentMode}</span>
            <span className="text-sm font-semibold text-stone-700">
              {inclusiveness}% more inclusive
            </span>
          </div>
          <div className="mt-4">
            <input
              id="match-threshold"
              type="range"
              min="0"
              max="100"
              step="1"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onPointerUp={() => applyThreshold()}
              onKeyUp={(event) => {
                if (event.key === "Enter") applyThreshold();
              }}
              className="w-full accent-emerald-700"
            />
            <div className="mt-2 flex justify-between text-xs font-black uppercase text-stone-500">
              <span>More precise</span>
              <span>Less precise</span>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-stone-700">
            Move right to include photos where the face is smaller, turned, blurry, or partly blocked.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => applyThreshold()}
            disabled={isPending}
            className="rounded-md bg-emerald-700 px-4 py-2 font-black text-white disabled:cursor-wait disabled:bg-stone-400"
          >
            {isPending ? "Applying..." : "Apply"}
          </button>
          <button
            type="button"
            onClick={resetThreshold}
            disabled={isPending}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 font-black disabled:cursor-wait disabled:text-stone-500"
          >
            Default
          </button>
        </div>
      </div>
    </section>
  );
}
