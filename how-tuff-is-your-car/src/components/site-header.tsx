"use client";

import Link from "next/link";
import { Heart, Scale, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getFavorites } from "@/lib/storage";

export function SiteHeader() {
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const sync = () => setFavoriteCount(getFavorites().length);
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("htiyc-storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("htiyc-storage", sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#08090b]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="How Tuff Is Your Car home">
          <span className="grid size-9 place-items-center rounded-xl border border-lime-300/30 bg-lime-300 text-black shadow-[0_0_28px_rgba(190,242,100,0.22)] transition-transform group-hover:rotate-3">
            <Sparkles className="size-4" strokeWidth={2.6} />
          </span>
          <span className="font-black tracking-[-0.04em] text-white sm:text-lg">
            HOW TUFF <span className="text-lime-300">IS YOUR CAR?</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold text-zinc-400">
          <Link href="/#search" className="hidden rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-white sm:flex sm:items-center sm:gap-2">
            <Search className="size-4" /> Search
          </Link>
          <Link href="/compare" className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-white">
            <Scale className="size-4" /> <span className="hidden sm:inline">Compare</span>
          </Link>
          <Link href="/favorites" className="relative flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-white">
            <Heart className="size-4" /> <span className="hidden sm:inline">Favorites</span>
            {favoriteCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-lime-300 text-[10px] font-black text-black">
                {favoriteCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
