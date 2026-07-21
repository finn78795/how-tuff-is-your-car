"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, SlidersHorizontal } from "lucide-react";
import { CarCard } from "@/components/car-card";
import type { Car } from "@/types/car";

export function BrowseCars() {
  const [years, setYears] = useState<number[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/facets?type=years")
      .then((response) => response.json())
      .then((body: { values: number[] }) => setYears(body.values))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setMake(""); setModel(""); setCars([]);
    if (!year) { setMakes([]); return; }
    setLoading(true);
    fetch(`/api/catalog/facets?type=makes&year=${year}`)
      .then((response) => response.json())
      .then((body: { values: string[] }) => setMakes(body.values))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    setModel(""); setCars([]);
    if (!year || !make) { setModels([]); return; }
    setLoading(true);
    fetch(`/api/catalog/facets?type=models&year=${year}&make=${encodeURIComponent(make)}`)
      .then((response) => response.json())
      .then((body: { values: string[] }) => setModels(body.values))
      .finally(() => setLoading(false));
  }, [year, make]);

  useEffect(() => {
    setCars([]);
    if (!year || !make || !model) return;
    setLoading(true);
    fetch(`/api/catalog/facets?type=cars&year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then((response) => response.json())
      .then((body: { cars: Car[] }) => setCars(body.cars))
      .finally(() => setLoading(false));
  }, [year, make, model]);

  return (
    <section id="browse" className="scroll-mt-24 py-20">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Browse the garage</p>
          <h2 className="section-title">Go year by year.</h2>
          <p className="mt-3 max-w-2xl text-zinc-500">Start with a year and wander from there. Older cars are usually model-level; newer ones may split into several engines and drivetrains.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <FilterSelect label="Year" value={year} onChange={setYear} options={years.map(String)} disabled={!years.length} />
          <FilterSelect label="Make" value={make} onChange={setMake} options={makes} disabled={!year} />
          <FilterSelect label="Model" value={model} onChange={setModel} options={models} disabled={!make} />
        </div>
      </div>

      <div className="min-h-40">
        {loading && <div className="flex items-center justify-center gap-2 rounded-[1.5rem] border border-white/8 bg-white/[0.02] py-14 text-sm font-bold text-zinc-500"><LoaderCircle className="size-4 animate-spin" /> Finding the cars…</div>}
        {!loading && cars.length > 0 && <><p className="mb-5 text-sm text-zinc-500">{cars.length} configuration{cars.length === 1 ? "" : "s"}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{cars.map((car) => <CarCard key={car.slug} car={car} />)}</div></>}
        {!loading && !cars.length && <div className="rounded-[2rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center"><h3 className="text-xl font-black text-white">Pick a year, make, and model.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">Older cars may show one broad model entry. Newer ones can split into several trims, engines, and drivetrains.</p></div>}
      </div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <label className="relative block min-w-40">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-12 w-full appearance-none rounded-full border border-white/10 bg-[#121419] pl-4 pr-10 text-sm font-bold text-zinc-300 outline-none transition hover:border-white/20 focus:border-lime-300/60 disabled:cursor-not-allowed disabled:opacity-40">
        <option value="">Select {label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
    </label>
  );
}
