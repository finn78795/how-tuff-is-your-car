"use client";

import Link from "next/link";
import { ArrowLeftRight, Crown, ExternalLink, LoaderCircle, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/favorite-button";
import { VehicleImage } from "@/components/vehicle-image";
import { curatedCars, getCarLabel, getOverallScore, getOverallScoreFromRatings, getVerdict, ratingKeys, ratingLabels } from "@/lib/catalog/client";
import type { Car, CarSearchResult } from "@/types/car";

const defaults: CarSearchResult[] = curatedCars.slice(0, 8).map((car) => ({
  id: car.id, slug: car.slug, year: car.year, make: car.make, model: car.model, trim: car.trim,
  bodyStyle: car.bodyStyle, source: car.source, sourceLabel: car.sourceLabel, ratings: car.ratings,
  ratingConfidence: car.ratingConfidence, imageQuery: car.imageQuery,
}));

export function ComparisonTool({ initialA, initialB }: { initialA?: string; initialB?: string }) {
  const [slugA, setSlugA] = useState(initialA || "2024-audi-rs6-avant-performance");
  const [slugB, setSlugB] = useState(initialB || "2024-ford-mustang-gt");
  const [carA, setCarA] = useState<Car | null>(null);
  const [carB, setCarB] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadCar(slugA), loadCar(slugB)]).then(([a, b]) => {
      if (!active) return;
      const fallbackA = curatedCars.find((car) => car.slug === "2024-audi-rs6-avant-performance") ?? curatedCars[0];
      const fallbackB = curatedCars.find((car) => car.slug === "2024-ford-mustang-gt") ?? curatedCars[1] ?? curatedCars[0];
      setCarA(a ?? fallbackA);
      setCarB(b ?? fallbackB);
      setLoading(false);
      const url = new URL(window.location.href);
      url.searchParams.set("car1", (a ?? fallbackA).slug);
      url.searchParams.set("car2", (b ?? fallbackB).slug);
      window.history.replaceState({}, "", url);
    }).catch(() => {
      if (!active) return;
      setCarA(curatedCars[0] ?? null);
      setCarB(curatedCars[1] ?? curatedCars[0] ?? null);
      setLoading(false);
    });
    return () => { active = false; };
  }, [slugA, slugB]);

  const winner = useMemo(() => {
    if (!carA || !carB) return null;
    const a = getOverallScore(carA); const b = getOverallScore(carB);
    return a === b ? null : a > b ? carA : carB;
  }, [carA, carB]);

  const swap = () => { setSlugA(slugB); setSlugB(slugA); };
  if (loading || !carA || !carB) return <div className="flex min-h-96 items-center justify-center gap-2 rounded-[1.8rem] border border-white/8 bg-[#101216] text-sm font-bold text-zinc-500"><LoaderCircle className="size-4 animate-spin" /> Loading both cars…</div>;

  const scoreA = getOverallScore(carA); const scoreB = getOverallScore(carB); const gap = Math.abs(scoreA - scoreB).toFixed(1);

  return (
    <div>
      <div className="grid gap-3 rounded-[1.6rem] border border-white/8 bg-[#101216] p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:p-4">
        <AsyncCarPicker label="Car one" selected={carA} onSelect={setSlugA} />
        <button type="button" onClick={swap} className="mx-auto grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition hover:rotate-180 hover:border-lime-300/40 hover:text-lime-300" aria-label="Swap cars"><ArrowLeftRight className="size-4" /></button>
        <AsyncCarPicker label="Car two" selected={carB} onSelect={setSlugB} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">{[carA, carB].map((car) => { const score = getOverallScore(car); return <article key={car.slug} className="rounded-[1.75rem] border border-white/8 bg-[#101216] p-2"><VehicleImage car={car} compact /><div className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-xs font-black uppercase tracking-[0.2em] text-zinc-600">{car.year} · {car.trim}</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-white">{car.make} {car.model}</h2><p className="mt-2 text-sm font-bold text-lime-300">{getVerdict(score)}</p></div><div className="rounded-2xl bg-white px-3 py-2 text-2xl font-black text-black">{score}</div></div><div className="mt-5 flex items-center gap-2"><Link href={`/car/${car.slug}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-black transition hover:bg-zinc-200">Full rating <ExternalLink className="size-3.5" /></Link><FavoriteButton slug={car.slug} iconOnly /></div></div></article>; })}</div>

      <section className="mt-6 rounded-[1.8rem] border border-white/8 bg-[#101216] p-5 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Head-to-head</p><h2 className="mt-2 text-3xl font-black tracking-[-0.055em] text-white">Where each one wins.</h2></div><div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-zinc-300">{winner ? <><Crown className="size-4 text-lime-300" /> {winner.make} {winner.model} by {gap}</> : <><RotateCcw className="size-4 text-zinc-500" /> Dead even</>}</div></div>
        <div className="mt-7 space-y-7">{ratingKeys.map((key) => <div key={key}><div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-zinc-500"><span>{carA.ratings[key].toFixed(1)}</span><span>{ratingLabels[key]}</span><span>{carB.ratings[key].toFixed(1)}</span></div><div className="grid grid-cols-2 gap-1"><div className="flex h-4 justify-end overflow-hidden rounded-l-full bg-white/5"><div key={`${slugA}-${slugB}-${key}-a`} className="compare-bar-left h-full rounded-l-full bg-gradient-to-l from-lime-300 to-lime-300/40" style={{ width: `${carA.ratings[key] * 10}%` }} /></div><div className="h-4 overflow-hidden rounded-r-full bg-white/5"><div key={`${slugA}-${slugB}-${key}-b`} className="compare-bar-right h-full rounded-r-full bg-gradient-to-r from-white to-zinc-500" style={{ width: `${carB.ratings[key] * 10}%` }} /></div></div></div>)}</div>
        <p className="mt-8 text-xs leading-5 text-zinc-700">Comparison scores may mix curated and estimated data. Open either full rating to see its confidence and source.</p>
      </section>
    </div>
  );
}

function AsyncCarPicker({ label, selected, onSelect }: { label: string; selected: Car; onSelect: (slug: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CarSearchResult[]>(defaults);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setResults(defaults); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/catalog/search?q=${encodeURIComponent(value)}&limit=10`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("Search failed")))
        .then((body: { results: CarSearchResult[] }) => setResults(body.results))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
        })
        .finally(() => setLoading(false));
    }, 220);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  return <div className="relative"><span className="mb-2 block px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</span><button type="button" onClick={() => setOpen((value) => !value)} className="flex h-14 w-full items-center gap-3 rounded-xl border border-white/9 bg-[#08090b] px-4 text-left outline-none transition hover:border-white/20"><Search className="size-4 shrink-0 text-zinc-600" /><span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{getCarLabel(selected)}</span></button>{open && <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-white/10 bg-[#111318] p-2 shadow-2xl"><div className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/25 px-3"><Search className="size-4 text-zinc-600" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any car" className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-zinc-700" />{loading && <LoaderCircle className="size-4 animate-spin text-zinc-600" />}</div><div className="mt-2 max-h-72 overflow-y-auto">{results.length ? results.map((car) => <button key={car.slug} type="button" onClick={() => { onSelect(car.slug); setOpen(false); setQuery(""); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5"><span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{car.year} {car.make} {car.model}</span><span className="block truncate text-[11px] text-zinc-600">{car.trim}</span></span><span className="text-xs font-black text-lime-300">{getOverallScoreFromRatings(car.ratings)}</span></button>) : <p className="px-3 py-7 text-center text-sm text-zinc-600">No close match found.</p>}</div></div>}</div>;
}

async function loadCar(slug: string) {
  const response = await fetch(`/api/catalog/car?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) return null;
  return (await response.json() as { car: Car }).car;
}
