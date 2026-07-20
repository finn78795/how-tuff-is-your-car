import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Gauge, Scale, Share2, Sparkles, Zap } from "lucide-react";
import { CarArt } from "@/components/car-art";
import { FavoriteButton } from "@/components/favorite-button";
import { RatingGauge } from "@/components/rating-gauge";
import { RecordHistory } from "@/components/record-history";
import { cars, getCarBySlug, getOverallScore, getVerdict, getVerdictCopy, ratingKeys, ratingLabels } from "@/lib/cars";

export function generateStaticParams() {
  return cars.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  if (!car) return { title: "Car not found" };
  return { title: `${car.year} ${car.make} ${car.model}`, description: car.tagline };
}

export default async function CarResultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  if (!car) notFound();

  const overall = getOverallScore(car);
  const topRating = ratingKeys.reduce((best, key) => car.ratings[key] > car.ratings[best] ? key : best, ratingKeys[0]);
  const lowRating = ratingKeys.reduce((worst, key) => car.ratings[key] < car.ratings[worst] ? key : worst, ratingKeys[0]);
  const related = cars.filter((item) => item.slug !== car.slug && (item.make === car.make || item.bodyStyle === car.bodyStyle)).slice(0, 3);

  return (
    <main className="min-h-screen">
      <RecordHistory car={car} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-white"><ArrowLeft className="size-4" /> Back to search</Link>

        <section className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_.92fr] lg:items-stretch">
          <CarArt car={car} />
          <div className="flex flex-col rounded-[2rem] border border-white/8 bg-[#101216] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{car.year} · {car.trim}</span>
              <div className="flex gap-2">
                <FavoriteButton slug={car.slug} iconOnly />
                <button type="button" className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/5 text-white transition hover:bg-white/10" aria-label="Share result"><Share2 className="size-4" /></button>
              </div>
            </div>

            <div className="mt-9 flex flex-1 flex-col justify-center">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-lime-300">The official verdict</p>
              <h1 className="mt-3 text-4xl font-black leading-[.95] tracking-[-0.065em] text-white sm:text-6xl">{car.make}<br />{car.model}</h1>
              <p className="mt-5 max-w-xl text-lg font-medium leading-7 text-zinc-400">{car.tagline}</p>
            </div>

            <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/8 pt-6">
              <div>
                <p className="text-3xl font-black tracking-[-0.05em] text-lime-300">{getVerdict(overall)}</p>
                <p className="mt-1 text-sm text-zinc-600">Overall aura index</p>
              </div>
              <div className="text-right">
                <span className="text-7xl font-black tracking-[-0.08em] text-white">{overall}</span>
                <span className="text-xl font-black text-zinc-600">/10</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ratingKeys.map((key, index) => <RatingGauge key={key} label={ratingLabels[key]} score={car.ratings[key]} delay={index * 90} />)}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[1.8rem] border border-white/8 bg-[#101216] p-6 sm:p-8">
            <p className="eyebrow">Why it hits</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{getVerdictCopy(overall)}</h2>
            <p className="mt-5 leading-7 text-zinc-400">{car.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {car.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">#{tag}</span>)}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-lime-300/15 bg-lime-300/[0.045] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-lime-300"><Sparkles className="size-4" /> Carries hardest</div>
                <p className="mt-2 text-2xl font-black text-white">{ratingLabels[topRating]} · {car.ratings[topRating].toFixed(1)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-zinc-500"><Gauge className="size-4" /> Needs the edit</div>
                <p className="mt-2 text-2xl font-black text-white">{ratingLabels[lowRating]} · {car.ratings[lowRating].toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/8 bg-[#101216] p-6 sm:p-8">
            <p className="eyebrow">Quick receipts</p>
            <div className="mt-5 divide-y divide-white/8">
              {[{ label: "Power", value: `${car.horsepower} hp` }, { label: "0–60", value: car.zeroToSixty }, { label: "Drivetrain", value: car.drivetrain }, { label: "Body", value: car.bodyStyle }].map((spec) => (
                <div key={spec.label} className="flex items-center justify-between py-4">
                  <span className="text-sm font-bold text-zinc-600">{spec.label}</span>
                  <span className="font-black text-white">{spec.value}</span>
                </div>
              ))}
            </div>
            <Link href={`/compare?car1=${car.slug}`} className="mt-6 flex h-13 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-black transition hover:bg-lime-200">
              <Scale className="size-4" /> Compare this car
            </Link>
            <FavoriteButton slug={car.slug} />
          </div>
        </section>

        {related.length > 0 && (
          <section className="py-16">
            <div className="mb-5 flex items-end justify-between">
              <div><p className="eyebrow">Same energy</p><h2 className="section-title">Keep scrolling.</h2></div>
              <Link href="/#browse" className="hidden items-center gap-2 text-sm font-black text-lime-300 sm:flex">View all <ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/car/${item.slug}`} className="group flex items-center justify-between rounded-2xl border border-white/8 bg-[#101216] p-4 transition hover:border-white/16 hover:bg-[#14161b]">
                  <div><p className="text-xs font-bold text-zinc-600">{item.year} · {item.trim}</p><h3 className="mt-1 font-black text-white">{item.make} {item.model}</h3></div>
                  <span className="grid size-10 place-items-center rounded-full bg-white/5 text-white transition group-hover:bg-lime-300 group-hover:text-black"><Zap className="size-4" /></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
