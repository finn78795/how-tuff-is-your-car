import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeInfo, Database, ExternalLink, Gauge, Scale, Sparkles } from "lucide-react";
import { CarCard } from "@/components/car-card";
import { FavoriteButton } from "@/components/favorite-button";
import { RatingGauge } from "@/components/rating-gauge";
import { RecordHistory } from "@/components/record-history";
import { ShareButton } from "@/components/share-button";
import { VehicleImage } from "@/components/vehicle-image";
import { curatedCars, getCarBySlug, getOverallScore, getRelatedCars, getVerdict, getVerdictCopy, ratingKeys, ratingLabels } from "@/lib/catalog";
import type { CarSpecs } from "@/types/car";

export const dynamicParams = true;
export function generateStaticParams() { return curatedCars.map((car) => ({ slug: car.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return { title: "Car not found" };
  return { title: `${car.year} ${car.make} ${car.model}`, description: car.tagline };
}

export default async function CarResultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const overall = getOverallScore(car);
  const topRating = ratingKeys.reduce((best, key) => car.ratings[key] > car.ratings[best] ? key : best, ratingKeys[0]);
  const lowRating = ratingKeys.reduce((worst, key) => car.ratings[key] < car.ratings[worst] ? key : worst, ratingKeys[0]);
  const related = await getRelatedCars(car, 4);
  const specs = formatSpecs(car.specs);

  return (
    <main className="min-h-screen">
      <RecordHistory car={car} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-white"><ArrowLeft className="size-4" /> Back to search</Link>

        <section className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_.92fr] lg:items-stretch">
          <VehicleImage car={car} />
          <div className="flex flex-col rounded-[2rem] border border-white/8 bg-[#101216] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{car.year} · {car.trim}</span>
              <div className="flex gap-2"><FavoriteButton slug={car.slug} iconOnly /><ShareButton title={`${car.year} ${car.make} ${car.model} rating`} /></div>
            </div>
            <div className="mt-9 flex flex-1 flex-col justify-center">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-lime-300">Enthusiast verdict</p>
              <h1 className="mt-3 text-4xl font-black leading-[.95] tracking-[-0.065em] text-white sm:text-6xl">{car.make}<br />{car.model}</h1>
              <p className="mt-5 max-w-xl text-lg font-medium leading-7 text-zinc-400">{car.tagline}</p>
            </div>
            <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/8 pt-6">
              <div><p className="text-3xl font-black tracking-[-0.05em] text-lime-300">{getVerdict(overall)}</p><p className="mt-1 text-sm text-zinc-600">Overall just-for-fun rating</p></div>
              <div className="text-right"><span className="text-7xl font-black tracking-[-0.08em] text-white">{overall}</span><span className="text-xl font-black text-zinc-600">/10</span></div>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{ratingKeys.map((key, index) => <RatingGauge key={key} label={ratingLabels[key]} score={car.ratings[key]} delay={index * 90} />)}</div></section>

        <section className="grid gap-6 lg:grid-cols-[1.12fr_.88fr]">
          <div className="rounded-[1.8rem] border border-white/8 bg-[#101216] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2"><p className="eyebrow">Why it scored this way</p><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] text-zinc-500">{car.ratingConfidence} confidence</span></div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{getVerdictCopy(overall)}</h2>
            <p className="mt-5 leading-7 text-zinc-400">{car.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">{car.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{tag}</span>)}</div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-lime-300/15 bg-lime-300/[0.045] p-4"><div className="flex items-center gap-2 text-sm font-black text-lime-300"><Sparkles className="size-4" /> Strongest category</div><p className="mt-2 text-2xl font-black text-white">{ratingLabels[topRating]} · {car.ratings[topRating].toFixed(1)}</p></div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-sm font-black text-zinc-500"><Gauge className="size-4" /> Lowest category</div><p className="mt-2 text-2xl font-black text-white">{ratingLabels[lowRating]} · {car.ratings[lowRating].toFixed(1)}</p></div>
            </div>
            <div className="mt-8 space-y-3 border-t border-white/8 pt-6">{ratingKeys.map((key) => <div key={key} className="grid gap-1 sm:grid-cols-[7rem_1fr]"><p className="text-sm font-black text-white">{ratingLabels[key]}</p><p className="text-sm leading-6 text-zinc-500">{car.ratingReasons[key] || "Estimated from the available vehicle information."}</p></div>)}</div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.8rem] border border-white/8 bg-[#101216] p-6 sm:p-8">
              <p className="eyebrow">Quick specs</p>
              <div className="mt-5 divide-y divide-white/8">{specs.length ? specs.map((spec) => <div key={spec.label} className="flex items-start justify-between gap-5 py-4"><span className="text-sm font-bold text-zinc-600">{spec.label}</span><span className="max-w-[62%] text-right font-black text-white">{spec.value}</span></div>) : <p className="py-5 text-sm leading-6 text-zinc-500">Detailed specifications are not available for this model-level entry.</p>}</div>
              <Link href={`/compare?car1=${encodeURIComponent(car.slug)}`} className="mt-6 flex h-13 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-black transition hover:bg-lime-200"><Scale className="size-4" /> Compare this car</Link>
              <div className="mt-3"><FavoriteButton slug={car.slug} /></div>
            </div>

            <div className="rounded-[1.8rem] border border-white/8 bg-[#101216] p-6">
              <div className="flex items-center gap-2 text-sm font-black text-white"><Database className="size-4 text-lime-300" /> Data source</div>
              <p className="mt-3 text-sm leading-6 text-zinc-500">{car.sourceLabel}. Model years, trims, and specifications can vary by market.</p>
              {car.sourceUrl && <a href={car.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-lime-300 hover:text-lime-200">Open source record <ExternalLink className="size-3.5" /></a>}
              <div className="mt-4 flex gap-2 rounded-xl border border-white/7 bg-white/[0.02] p-3 text-xs leading-5 text-zinc-600"><BadgeInfo className="mt-0.5 size-4 shrink-0" /> Ratings are entertainment and are not vehicle valuations, safety ratings, or buying advice.</div>
            </div>
          </aside>
        </section>

        {related.length > 0 && <section className="py-16"><div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">Keep browsing</p><h2 className="section-title">Related cars.</h2></div><Link href="/#browse" className="hidden items-center gap-2 text-sm font-black text-lime-300 sm:flex">Browse all <ArrowRight className="size-4" /></Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <CarCard key={item.slug} car={item} />)}</div></section>}
      </div>
    </main>
  );
}

function formatSpecs(specs: CarSpecs) {
  const values = [
    ["Body", specs.bodyStyle], ["Drivetrain", specs.drivetrain], ["Power", specs.horsepower ? `${specs.horsepower} hp` : undefined],
    ["Torque", specs.torqueLbFt ? `${specs.torqueLbFt} lb-ft` : undefined], ["0–60", specs.zeroToSixty], ["Engine", specs.engine],
    ["Displacement", specs.displacementLiters ? `${specs.displacementLiters} L` : undefined], ["Cylinders", specs.cylinders],
    ["Transmission", specs.transmission], ["Fuel", specs.fuelType], ["Combined economy", specs.combinedMpg ? `${specs.combinedMpg} mpg` : undefined],
    ["Weight", specs.weightLb ? `${specs.weightLb.toLocaleString()} lb` : undefined],
  ] as Array<[string, string | number | undefined]>;
  return values.filter((item): item is [string, string | number] => item[1] !== undefined && item[1] !== "Unknown" && item[1] !== "Varies").map(([label, value]) => ({ label, value: String(value) }));
}
