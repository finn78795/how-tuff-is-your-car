import type { Metadata } from "next";
import { FavoritesGrid } from "@/components/favorites-grid";
import { SavedBuildsGrid } from "@/components/saved-builds-grid";

export const metadata: Metadata = { title: "Garage", description: "Favorite cars and photo-rated builds saved in this browser." };

export default function FavoritesPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="eyebrow">Your garage</p>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.065em] text-white sm:text-7xl">The stuff you kept.</h1>
        <p className="mt-4 max-w-2xl text-zinc-500">Favorites and photo-rated builds stay in this browser. No account, no feed, no need to make it deeper than that.</p>

        <section className="pt-12">
          <div className="mb-6"><p className="eyebrow">Your builds</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-white">Cars you rated from a photo.</h2></div>
          <SavedBuildsGrid />
        </section>

        <section className="border-t border-white/8 pt-12 mt-14">
          <div className="mb-6"><p className="eyebrow">Favorite cars</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-white">Cars you wanted to remember.</h2></div>
          <FavoritesGrid />
        </section>
      </div>
    </main>
  );
}
