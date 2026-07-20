"use client";

import Link from "next/link";
import { Heart, LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { CarCard } from "@/components/car-card";
import { getFavorites } from "@/lib/storage";
import type { Car } from "@/types/car";

export function FavoritesGrid() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!slugs.length) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/catalog/batch?slugs=${encodeURIComponent(slugs.join(","))}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Favorites lookup failed")))
      .then((body: { cars: Car[] }) => {
        const bySlug = new Map(body.cars.map((car) => [car.slug, car]));
        setFavorites(slugs.map((slug) => bySlug.get(slug)).filter((car): car is Car => Boolean(car)));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFavorites([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [slugs]);

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-2 rounded-[2rem] border border-white/8 bg-white/[0.02] text-sm font-bold text-zinc-500">
        <LoaderCircle className="size-4 animate-spin" /> Opening your garage…
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-24 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/5 text-zinc-600"><Heart className="size-7" /></span>
        <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">Your saved garage is empty.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Tap the heart on any result to keep interesting cars in one place. Everything stays in this browser.</p>
        <Link href="/#browse" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-black text-black transition hover:bg-lime-200"><Search className="size-4" /> Browse cars</Link>
      </div>
    );
  }

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{favorites.map((car) => <CarCard key={car.slug} car={car} />)}</div>;
}
