"use client";

import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { CarCard } from "@/components/car-card";
import { cars } from "@/lib/cars";
import { getFavorites } from "@/lib/storage";

export function FavoritesGrid() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setSlugs(getFavorites());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("htiyc-storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("htiyc-storage", sync);
    };
  }, []);

  const favorites = slugs.map((slug) => cars.find((car) => car.slug === slug)).filter(Boolean);

  if (favorites.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-24 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/5 text-zinc-600"><Heart className="size-7" /></span>
        <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">Your saved garage is empty.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Tap the heart on any car to keep the tuffest picks in one place. Everything stays in this browser.</p>
        <Link href="/#browse" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-black text-black transition hover:bg-lime-200"><Search className="size-4" /> Browse cars</Link>
      </div>
    );
  }

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{favorites.map((car) => car && <CarCard key={car.slug} car={car} />)}</div>;
}
