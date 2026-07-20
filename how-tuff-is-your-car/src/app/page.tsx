import Link from "next/link";
import { ArrowRight, Camera, Database, Gauge, Heart, Sparkles } from "lucide-react";
import { AiUploadCard } from "@/components/ai-upload-card";
import { BrowseCars } from "@/components/browse-cars";
import { CarCard } from "@/components/car-card";
import { CarSearch } from "@/components/car-search";
import { CatalogStats } from "@/components/catalog-stats";
import { LocalCollections } from "@/components/local-collections";
import { VinDecoderCard } from "@/components/vin-decoder-card";
import { RandomCarLink } from "@/components/random-car-link";
import { getClassicFeaturedCars, getFeaturedCars } from "@/lib/catalog";

export default function Home() {
  const featured = getFeaturedCars(4);
  const classics = getClassicFeaturedCars(8);

  return (
    <main>
      <section className="hero-grid relative overflow-hidden border-b border-white/8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[560px] max-w-5xl bg-[radial-gradient(ellipse_at_center,rgba(190,242,100,.12),transparent_62%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-zinc-400"><span className="size-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_12px_#bef264]" /> A car hobby project with strong opinions</div>
            <h1 className="text-balance text-5xl font-black uppercase leading-[0.87] tracking-[-0.075em] text-white sm:text-7xl lg:text-[7.5rem]">How tuff is<br />your <span className="text-lime-300">car?</span></h1>
            <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-zinc-400 sm:text-lg">Search classics, daily drivers, trucks, oddballs, and modern performance cars. The scores are just for fun, but the catalog and source notes are taken seriously.</p>
            <div id="search" className="mx-auto mt-9 max-w-3xl scroll-mt-24"><CarSearch /><CatalogStats /></div>
            <div className="mt-6 flex justify-center"><RandomCarLink /></div>
          </div>
          <LocalCollections />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="py-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Enthusiast picks</p><h2 className="section-title">Cars with a strong case.</h2></div><Link href="#browse" className="inline-flex items-center gap-2 self-start text-sm font-black text-lime-300 hover:text-lime-200">Browse the full catalog <ArrowRight className="size-4" /></Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((car) => <CarCard key={car.slug} car={car} />)}</div>
        </section>

        <section className="border-y border-white/8 py-20">
          <div className="mb-8 max-w-3xl"><p className="eyebrow">Classic corner</p><h2 className="section-title">The 1960s and ’70s are covered.</h2><p className="mt-4 leading-7 text-zinc-500">The offline classic catalog expands model production ranges into year-by-year entries, then uses Wikimedia and Wikidata to help with photos and global coverage.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{classics.map((car) => <CarCard key={car.slug} car={car} />)}</div>
        </section>

        <section className="grid gap-4 py-20 md:grid-cols-4">
          {[
            { icon: Database, title: "Big catalog", copy: "FuelEconomy.gov configurations, an offline classic index, NHTSA validation, and Wikidata discovery." },
            { icon: Gauge, title: "Explainable ratings", copy: "Curated scores when known; labeled estimates when detailed specs are missing." },
            { icon: Camera, title: "Photo recognition", copy: "Optional OpenAI vision analyzes the car and visible accessories on the server." },
            { icon: Heart, title: "Your own garage", copy: "Favorites and recent cars stay in local storage without making an account." },
          ].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-[1.6rem] border border-white/8 bg-[#101216] p-6"><span className="grid size-11 place-items-center rounded-xl bg-lime-300 text-black"><Icon className="size-5" /></span><h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{copy}</p></div>)}
        </section>

        <AiUploadCard />
        <VinDecoderCard />
        <BrowseCars />
      </div>

      <footer className="border-t border-white/8 px-4 py-12 text-center"><div className="mx-auto flex max-w-2xl flex-col items-center"><Sparkles className="size-5 text-lime-300" /><p className="mt-3 font-bold text-zinc-300">Built by someone who likes cars and reads listings for fun.</p><p className="mt-2 text-sm leading-6 text-zinc-600">Ratings are subjective entertainment, not buying advice. Vehicle data can vary by market, trim, and model year. Photo credits link back to Wikimedia Commons when available.</p></div></footer>
    </main>
  );
}
