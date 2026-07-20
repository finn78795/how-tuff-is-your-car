"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/storage";

export function FavoriteButton({ slug, iconOnly = false }: { slug: string; iconOnly?: boolean }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isFavorite(slug));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("htiyc-storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("htiyc-storage", sync);
    };
  }, [slug]);

  return (
    <button
      type="button"
      onClick={() => setActive(toggleFavorite(slug))}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-lime-300 bg-lime-300 text-black"
          : "border-white/12 bg-white/5 text-white hover:border-white/25 hover:bg-white/10"
      } ${iconOnly ? "size-10 p-0" : ""}`}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={`size-4 ${active ? "fill-current" : ""}`} />
      {!iconOnly && (active ? "Saved" : "Save car")}
    </button>
  );
}
