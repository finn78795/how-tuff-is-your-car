"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { cars, getCarLabel, getOverallScore, getVerdict } from "@/lib/cars";

export function CarSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cars.slice(0, 6);
    return cars
      .filter((car) => getCarLabel(car).toLowerCase().includes(normalized))
      .slice(0, 7);
  }, [query]);

  const choose = (slug: string) => {
    setFocused(false);
    router.push(`/car/${slug}`);
  };

  return (
    <div className="relative z-30 w-full">
      <div className={`flex items-center rounded-[1.35rem] border border-white/12 bg-[#111318] p-2 shadow-[0_24px_80px_rgba(0,0,0,.35)] transition focus-within:border-lime-300/55 focus-within:shadow-[0_24px_80px_rgba(190,242,100,.08)] ${compact ? "min-h-14" : "min-h-20"}`}>
        <div className={`grid place-items-center text-zinc-500 ${compact ? "w-11" : "w-14"}`}>
          <Search className={compact ? "size-5" : "size-6"} />
        </div>
        <input
          id={compact ? undefined : "search"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && matches[0]) choose(matches[0].slug);
            if (event.key === "Escape") setFocused(false);
          }}
          placeholder="Search year, make, model..."
          className={`min-w-0 flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-zinc-600 ${compact ? "text-base" : "text-lg sm:text-xl"}`}
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="grid size-10 place-items-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-white" aria-label="Clear search">
            <X className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => matches[0] && choose(matches[0].slug)}
          className={`grid place-items-center rounded-[1rem] bg-lime-300 text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "size-11" : "size-14"}`}
          disabled={!matches[0]}
          aria-label="Search"
        >
          <ArrowRight className="size-5" strokeWidth={2.7} />
        </button>
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#111318]/98 p-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            <span>{query ? "Best matches" : "Popular right now"}</span>
            <span>{matches.length} cars</span>
          </div>
          {matches.length > 0 ? (
            matches.map((car) => {
              const score = getOverallScore(car);
              return (
                <button
                  key={car.slug}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(car.slug)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/6"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-white/5 text-xs font-black text-white" style={{ boxShadow: `inset 0 0 0 1px ${car.accent}44` }}>
                    {car.make.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-white">{car.year} {car.make} {car.model}</span>
                    <span className="block truncate text-xs text-zinc-500">{car.trim} · {getVerdict(score)}</span>
                  </span>
                  <span className="rounded-lg bg-white px-2 py-1 text-sm font-black text-black">{score}</span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">No match yet. Try “Honda”, “2024”, or “GT-R”.</div>
          )}
        </div>
      )}
    </div>
  );
}
