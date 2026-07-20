"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[75vh] place-items-center px-4 py-16 text-center">
      <div>
        <p className="eyebrow">Something stalled</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-white sm:text-7xl">The page needs another try.</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-zinc-500">A data source may be temporarily unavailable. Your favorites and recent cars are still safe in this browser.</p>
        <button type="button" onClick={reset} className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-lime-300 px-5 font-black text-black transition hover:bg-lime-200"><RotateCcw className="size-4" /> Try again</button>
      </div>
    </main>
  );
}
