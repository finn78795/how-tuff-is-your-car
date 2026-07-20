"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Crown, ExternalLink, RotateCcw } from "lucide-react";
import { CarArt } from "@/components/car-art";
import { FavoriteButton } from "@/components/favorite-button";
import { cars, getCarLabel, getOverallScore, getVerdict, ratingKeys, ratingLabels } from "@/lib/cars";

export function ComparisonTool({ initialA, initialB }: { initialA?: string; initialB?: string }) {
  const [slugA, setSlugA] = useState(initialA && cars.some((car) => car.slug === initialA) ? initialA : "2024-audi-rs6-avant-performance");
  const [slugB, setSlugB] = useState(initialB && cars.some((car) => car.slug === initialB) ? initialB : "2024-ford-mustang-gt");

  const carA = useMemo(() => cars.find((car) => car.slug === slugA) ?? cars[0], [slugA]);
  const carB = useMemo(() => cars.find((car) => car.slug === slugB) ?? cars[1], [slugB]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("car1", slugA);
    url.searchParams.set("car2", slugB);
    window.history.replaceState({}, "", url);
  }, [slugA, slugB]);

  const scoreA = getOverallScore(carA);
  const scoreB = getOverallScore(carB);
  const winner = scoreA === scoreB ? null : scoreA > scoreB ? carA : carB;
  const gap = Math.abs(scoreA - scoreB).toFixed(1);

  const swap = () => {
    setSlugA(slugB);
    setSlugB(slugA);
  };

  return (
    <div>
      <div className="grid gap-3 rounded-[1.6rem] border border-white/8 bg-[#101216] p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-4">
        <CarSelect value={slugA} onChange={setSlugA} label="Car one" />
        <button type="button" onClick={swap} className="mx-auto grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition hover:rotate-180 hover:border-lime-300/40 hover:text-lime-300" aria-label="Swap cars">
          <ArrowLeftRight className="size-4" />
        </button>
        <CarSelect value={slugB} onChange={setSlugB} label="Car two" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[carA, carB].map((car) => {
          const score = getOverallScore(car);
          return (
            <article key={car.slug} className="rounded-[1.75rem] border border-white/8 bg-[#101216] p-2">
              <CarArt car={car} compact />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600">{car.year} · {car.trim}</p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-white">{car.make} {car.model}</h2>
                    <p className="mt-2 text-sm font-bold text-lime-300">{getVerdict(score)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-2xl font-black text-black">{score}</div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Link href={`/car/${car.slug}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-black transition hover:bg-zinc-200">
                    Full rating <ExternalLink className="size-3.5" />
                  </Link>
                  <FavoriteButton slug={car.slug} iconOnly />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-6 rounded-[1.8rem] border border-white/8 bg-[#101216] p-5 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Head-to-head</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] text-white">Who actually clears?</h2>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-zinc-300">
            {winner ? <><Crown className="size-4 text-lime-300" /> {winner.make} {winner.model} by {gap}</> : <><RotateCcw className="size-4 text-zinc-500" /> Dead even</>}
          </div>
        </div>

        <div className="mt-7 space-y-7">
          {ratingKeys.map((key) => (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                <span>{carA.ratings[key].toFixed(1)}</span>
                <span>{ratingLabels[key]}</span>
                <span>{carB.ratings[key].toFixed(1)}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex h-4 justify-end overflow-hidden rounded-l-full bg-white/5">
                  <div
                    key={`${slugA}-${slugB}-${key}-a`}
                    className="compare-bar-left h-full rounded-l-full bg-gradient-to-l from-lime-300 to-lime-300/40"
                    style={{ width: `${carA.ratings[key] * 10}%` }}
                  />
                </div>
                <div className="h-4 overflow-hidden rounded-r-full bg-white/5">
                  <div
                    key={`${slugA}-${slugB}-${key}-b`}
                    className="compare-bar-right h-full rounded-r-full bg-gradient-to-r from-white to-zinc-500"
                    style={{ width: `${carB.ratings[key] * 10}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CarSelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-14 w-full rounded-xl border border-white/9 bg-[#08090b] px-4 text-sm font-bold text-white outline-none transition focus:border-lime-300/50">
        {cars.map((car) => <option key={car.slug} value={car.slug}>{getCarLabel(car)}</option>)}
      </select>
    </label>
  );
}
