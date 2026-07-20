import type { Metadata } from "next";
import { FavoritesGrid } from "@/components/favorites-grid";

export const metadata: Metadata = { title: "Favorites", description: "Your locally saved favorite cars." };

export default function FavoritesPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="eyebrow">Your garage</p>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.065em] text-white sm:text-7xl">Saved heat.</h1>
        <p className="mb-9 mt-4 max-w-2xl text-zinc-500">Favorites live in local storage, so this page stays personal without an account or database.</p>
        <FavoritesGrid />
      </div>
    </main>
  );
}
