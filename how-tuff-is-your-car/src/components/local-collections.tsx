"use client";

import Link from "next/link";
import { Clock3, Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cars, getOverallScore } from "@/lib/cars";
import { clearSearchHistory, getFavorites, getSearchHistory } from "@/lib/storage";

export function LocalCollections() {
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setHistory(getSearchHistory());
      setFavorites(getFavorites());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("htiyc-storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("htiyc-storage", sync);
    };
  }, []);

  const historyCars = history.map((slug) => cars.find((car) => car.slug === slug)).filter(Boolean);
  const favoriteCars = favorites.map((slug) => cars.find((car) => car.slug === slug)).filter(Boolean);

  if (historyCars.length === 0 && favoriteCars.length === 0) return null;

  return (
    <section className="grid gap-4 py-6 lg:grid-cols-2">
      {historyCars.length > 0 && (
        <div className="rounded-[1.75rem] border border-white/8 bg-[#101216] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white"><Clock3 className="size-4 text-lime-300" /> Recent searches</div>
            <button type="button" onClick={clearSearchHistory} className="flex items-center gap-1 text-xs font-bold text-zinc-600 transition hover:text-white"><Trash2 className="size-3" /> Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {historyCars.map((car) => car && (
              <Link key={car.slug} href={`/car/${car.slug}`} className="rounded-full border border-white/9 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-lime-300/40 hover:text-white">
                {car.year} {car.make} {car.model}
              </Link>
            ))}
          </div>
        </div>
      )}

      {favoriteCars.length > 0 && (
        <div className="rounded-[1.75rem] border border-white/8 bg-[#101216] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white"><Heart className="size-4 fill-lime-300 text-lime-300" /> Saved heat</div>
            <Link href="/favorites" className="text-xs font-bold text-lime-300 hover:text-lime-200">View all</Link>
          </div>
          <div className="space-y-2">
            {favoriteCars.slice(0, 3).map((car) => car && (
              <Link key={car.slug} href={`/car/${car.slug}`} className="flex items-center justify-between rounded-xl border border-white/7 px-3 py-3 transition hover:bg-white/5">
                <span className="font-semibold text-zinc-300">{car.year} {car.make} {car.model}</span>
                <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-black">{getOverallScore(car)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
