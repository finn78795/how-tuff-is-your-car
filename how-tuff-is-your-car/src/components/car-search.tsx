"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Database, LoaderCircle, Search, X } from "lucide-react";
import { curatedCars, getOverallScoreFromRatings, getVerdict } from "@/lib/catalog/client";
import type { CarSearchResult } from "@/types/car";

const popular: CarSearchResult[] = curatedCars.slice(0, 6).map((car) => ({
  id: car.id, slug: car.slug, year: car.year, make: car.make, model: car.model, trim: car.trim,
  bodyStyle: car.bodyStyle, source: car.source, sourceLabel: car.sourceLabel, ratings: car.ratings,
  ratingConfidence: car.ratingConfidence, imageQuery: car.imageQuery,
}));

export function CarSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [matches, setMatches] = useState<CarSearchResult[]>(popular);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setMatches(popular);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/catalog/search?q=${encodeURIComponent(normalized)}&limit=14`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("Search failed")))
        .then((body: { results: CarSearchResult[] }) => setMatches(body.results))
        .catch((error) => { if (error.name !== "AbortError") setMatches([]); })
        .finally(() => setLoading(false));
    }, 220);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  const best = useMemo(() => matches[0], [matches]);
  const choose = (slug: string) => { setFocused(false); router.push(`/car/${slug}`); };

  return (
    <div ref={rootRef} className="relative z-30 w-full">
      <div className={`flex items-center rounded-[1.35rem] border border-white/12 bg-[#111318] p-2 shadow-[0_24px_80px_rgba(0,0,0,.35)] transition focus-within:border-lime-300/55 focus-within:shadow-[0_24px_80px_rgba(190,242,100,.08)] ${compact ? "min-h-14" : "min-h-20"}`}>
        <div className={`grid place-items-center text-zinc-500 ${compact ? "w-11" : "w-14"}`}>
          {loading ? <LoaderCircle className={`${compact ? "size-5" : "size-6"} animate-spin`} /> : <Search className={compact ? "size-5" : "size-6"} />}
        </div>
        <input
          id={compact ? undefined : "search"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && best) choose(best.slug);
            if (event.key === "Escape") setFocused(false);
          }}
          placeholder="Try 1969 Charger, RX-7, Civic Type R..."
          className={`min-w-0 flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-zinc-600 ${compact ? "text-base" : "text-lg sm:text-xl"}`}
          autoComplete="off"
        />
        {query && <button type="button" onClick={() => setQuery("")} className="grid size-10 place-items-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-white" aria-label="Clear search"><X className="size-4" /></button>}
        <button type="button" onClick={() => best && choose(best.slug)} className={`grid place-items-center rounded-[1rem] bg-lime-300 text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "size-11" : "size-14"}`} disabled={!best} aria-label="Open best match"><ArrowRight className="size-5" strokeWidth={2.7} /></button>
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] max-h-[min(65vh,34rem)] overflow-y-auto rounded-[1.35rem] border border-white/10 bg-[#111318]/98 p-2 shadow-2xl backdrop-blur-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-[#111318] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            <span>{query.trim().length >= 2 ? "Catalog matches" : "A few favorites"}</span>
            <span>{matches.length} shown</span>
          </div>
          {matches.length > 0 ? matches.map((car) => {
            const score = getOverallScoreFromRatings(car.ratings);
            return (
              <button key={car.slug} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(car.slug)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/6">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-xs font-black text-white">{car.make.slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-white">{car.year} {car.make} {car.model}</span>
                  <span className="block truncate text-xs text-zinc-500">{car.trim} · {getVerdict(score)}</span>
                  <span className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-700"><Database className="size-3" /> {car.sourceLabel}</span>
                </span>
                <span className="rounded-lg bg-white px-2 py-1 text-sm font-black text-black">{score}</span>
              </button>
            );
          }) : <div className="px-4 py-8 text-center text-sm text-zinc-500">No close match yet. Try a make and model, or use the year/make/model browser below.</div>}
        </div>
      )}
    </div>
  );
}
