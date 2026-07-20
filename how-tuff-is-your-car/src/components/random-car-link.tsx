"use client";

import { LoaderCircle, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RandomCarLink({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const openRandom = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/catalog/random", { cache: "no-store" });
      const body = await response.json() as { slug?: string };
      if (!response.ok || !body.slug) throw new Error("No random car");
      router.push(`/car/${body.slug}`);
    } catch {
      router.push("/car/2024-ford-mustang-gt");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button type="button" onClick={openRandom} disabled={loading} className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] p-4 text-left transition hover:border-lime-300/30 disabled:opacity-60">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-600">Not sure where to start?</p><p className="mt-1 font-black text-white">Open a random pick</p></div>
        {loading ? <LoaderCircle className="size-5 animate-spin text-lime-300" /> : <Shuffle className="size-5 text-lime-300" />}
      </button>
    );
  }

  return (
    <button type="button" onClick={openRandom} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-lime-300/30 hover:text-white disabled:opacity-60">
      {loading ? <LoaderCircle className="size-4 animate-spin text-lime-300" /> : <Shuffle className="size-4 text-lime-300" />} Surprise me
    </button>
  );
}
