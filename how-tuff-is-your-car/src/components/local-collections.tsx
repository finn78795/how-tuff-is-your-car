"use client";

import Link from "next/link";
import { Clock3, Heart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getOverallScore } from "@/lib/catalog/client";
import { clearSearchHistory, getFavorites, getSearchHistory } from "@/lib/storage";
import type { Car } from "@/types/car";
import { RandomCarLink } from "@/components/random-car-link";

export function LocalCollections() {
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [resolved, setResolved] = useState<Car[]>([]);

  useEffect(() => {
    const sync = () => { setHistory(getSearchHistory()); setFavorites(getFavorites()); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("htiyc-storage", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("htiyc-storage", sync); };
  }, []);

  useEffect(() => {
    const slugs = [...new Set([...history, ...favorites])];
    if (!slugs.length) { setResolved([]); return; }
    fetch(`/api/catalog/batch?slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((response) => response.json())
      .then((body: { cars: Car[] }) => setResolved(body.cars))
      .catch(() => setResolved([]));
  }, [history, favorites]);

  const map = useMemo(() => new Map(resolved.map((car) => [car.slug, car])), [resolved]);
  const historyCars = history.map((slug) => map.get(slug)).filter((car): car is Car => Boolean(car));
  const favoriteCars = favorites.map((slug) => map.get(slug)).filter((car): car is Car => Boolean(car));

  return (
    <section className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-[1.75rem] border border-white/8 bg-[#101216] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white"><Clock3 className="size-4 text-lime-300" /> Recently viewed</div>
          {history.length > 0 && <button type="button" onClick={clearSearchHistory} className="flex items-center gap-1 text-xs font-bold text-zinc-600 transition hover:text-white"><Trash2 className="size-3" /> Clear</button>}
        </div>
        {historyCars.length ? <div className="flex flex-wrap gap-2">{historyCars.slice(0, 8).map((car) => <Link key={car.slug} href={`/car/${car.slug}`} className="rounded-full border border-white/9 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-lime-300/40 hover:text-white">{car.year} {car.make} {car.model}</Link>)}</div> : <p className="text-sm leading-6 text-zinc-600">Cars you open will appear here. It stays in this browser and does not require an account.</p>}
      </div>

      <div className="rounded-[1.75rem] border border-white/8 bg-[#101216] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white"><Heart className="size-4 text-lime-300" /> Your garage</div><Link href="/favorites" className="text-xs font-bold text-lime-300 hover:text-lime-200">View all</Link></div>
        {favoriteCars.length ? <div className="space-y-2">{favoriteCars.slice(0, 3).map((car) => <Link key={car.slug} href={`/car/${car.slug}`} className="flex items-center justify-between rounded-xl border border-white/7 px-3 py-3 transition hover:bg-white/5"><span className="truncate font-semibold text-zinc-300">{car.year} {car.make} {car.model}</span><span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-black">{getOverallScore(car)}</span></Link>)}</div> : <RandomCarLink compact />}
      </div>
    </section>
  );
}
