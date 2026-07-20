import Link from "next/link";
import { ArrowRight, BadgeCheck, Database, ScanLine, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { AiUploadCard } from "@/components/ai-upload-card";
import { BrowseCars } from "@/components/browse-cars";
import { CarCard } from "@/components/car-card";
import { CarSearch } from "@/components/car-search";
import { LocalCollections } from "@/components/local-collections";
import { cars, getOverallScore } from "@/lib/cars";

export default function Home() {
  const featured = [...cars].sort((a, b) => getOverallScore(b) - getOverallScore(a)).slice(0, 4);

  return (
    <main>
      <section className="hero-grid relative overflow-hidden border-b border-white/8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[520px] max-w-5xl bg-[radial-gradient(ellipse_at_center,rgba(190,242,100,.12),transparent_62%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              <span className="size-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_12px_#bef264]" /> Vibe science, not horsepower cope
            </div>
            <h1 className="text-balance text-5xl font-black uppercase leading-[0.87] tracking-[-0.075em] text-white sm:text-7xl lg:text-[7.5rem]">
              Your car got <span className="text-lime-300">aura</span><br />or nah?
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-zinc-400 sm:text-lg">
              Search your exact car and get a brutally unserious, weirdly accurate score for vibe, tuffness, speed, style, and fun.
            </p>

            <div id="search" className="mx-auto mt-9 max-w-3xl scroll-mt-24">
              <CarSearch />
              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-zinc-600">
                <span className="flex items-center gap-1.5"><Database className="size-3.5" /> {cars.length} seed cars</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> stays on-device</span>
                <span className="flex items-center gap-1.5"><Zap className="size-3.5" /> instant results</span>
              </div>
            </div>
          </div>

          <LocalCollections />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="py-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Certified leaderboard</p>
              <h2 className="section-title">Cars currently clearing.</h2>
            </div>
            <Link href="#browse" className="inline-flex items-center gap-2 self-start text-sm font-black text-lime-300 hover:text-lime-200">Browse everything <ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((car) => <CarCard key={car.slug} car={car} />)}
          </div>
        </section>

        <section className="grid gap-4 pb-20 md:grid-cols-3">
          {[{ icon: BadgeCheck, title: "Vibe first", copy: "Ratings balance speed with lore, styling, fun, and how hard the car hits in a 7-second edit." }, { icon: ScanLine, title: "AI-ready", copy: "Swap the placeholder provider for your vision model without rebuilding the upload experience." }, { icon: Sparkles, title: "Actually shareable", copy: "The verdict speaks fluent group chat: certified tuff, lowkey hard, mid, or fully cooked." }].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-[1.6rem] border border-white/8 bg-[#101216] p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-lime-300 text-black"><Icon className="size-5" /></span>
              <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{copy}</p>
            </div>
          ))}
        </section>

        <AiUploadCard />
        <BrowseCars />
      </div>

      <footer className="border-t border-white/8 px-4 py-10 text-center text-sm text-zinc-600">
        <p>Built for questionable takes and immaculate specs. Scores are editable demo data.</p>
      </footer>
    </main>
  );
}
