"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CarCard } from "@/components/car-card";
import { cars, makes, years } from "@/lib/cars";

export function BrowseCars() {
  const [year, setYear] = useState("all");
  const [make, setMake] = useState("all");
  const [model, setModel] = useState("all");

  const modelOptions = useMemo(
    () => [...new Set(cars.filter((car) => make === "all" || car.make === make).map((car) => car.model))].sort(),
    [make],
  );

  const filtered = useMemo(
    () =>
      cars.filter(
        (car) =>
          (year === "all" || car.year === Number(year)) &&
          (make === "all" || car.make === make) &&
          (model === "all" || car.model === model),
      ),
    [year, make, model],
  );

  const reset = () => {
    setYear("all");
    setMake("all");
    setModel("all");
  };

  return (
    <section id="browse" className="scroll-mt-24 py-20">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Browse the garage</p>
          <h2 className="section-title">Find your exact spec.</h2>
          <p className="mt-3 max-w-2xl text-zinc-500">Filter the local seed database by year, make, and model. No login, no loading spinner from 2014.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ value: year, setter: setYear, label: "Year", options: years.map(String) }, { value: make, setter: (value: string) => { setMake(value); setModel("all"); }, label: "Make", options: makes }, { value: model, setter: setModel, label: "Model", options: modelOptions }].map((filter) => (
            <label key={filter.label} className="relative">
              <span className="sr-only">{filter.label}</span>
              <select
                value={filter.value}
                onChange={(event) => filter.setter(event.target.value)}
                className="h-11 appearance-none rounded-full border border-white/10 bg-[#121419] pl-4 pr-10 text-sm font-bold text-zinc-300 outline-none transition hover:border-white/20 focus:border-lime-300/60"
              >
                <option value="all">All {filter.label}s</option>
                {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            </label>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between text-sm text-zinc-500">
        <span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
        {(year !== "all" || make !== "all" || model !== "all") && (
          <button type="button" onClick={reset} className="font-bold text-lime-300 hover:text-lime-200">Reset filters</button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((car) => <CarCard key={car.slug} car={car} />)}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-20 text-center">
          <p className="text-4xl">🫥</p>
          <h3 className="mt-4 text-xl font-black text-white">That spec ghosted us.</h3>
          <p className="mt-2 text-sm text-zinc-500">Reset the filters or add it to the JSON database.</p>
        </div>
      )}
    </section>
  );
}
