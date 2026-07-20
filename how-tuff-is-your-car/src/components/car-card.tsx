import Link from "next/link";
import { ArrowUpRight, Database } from "lucide-react";
import { VehicleImage } from "@/components/vehicle-image";
import { FavoriteButton } from "@/components/favorite-button";
import { getOverallScore, getVerdict } from "@/lib/catalog/client";
import type { Car } from "@/types/car";

export function CarCard({ car }: { car: Car }) {
  const score = getOverallScore(car);
  return (
    <article className="group rounded-[1.55rem] border border-white/8 bg-[#101216] p-2 transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-[#14171b]">
      <div className="relative">
        <Link href={`/car/${car.slug}`} aria-label={`Open ${car.year} ${car.make} ${car.model}`}><VehicleImage car={car} compact /></Link>
        <div className="absolute right-3 top-3"><FavoriteButton slug={car.slug} iconOnly /></div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{car.year} · {car.trim}</p>
            <h3 className="mt-1 truncate text-xl font-black tracking-[-0.04em] text-white">{car.make} {car.model}</h3>
          </div>
          <div className="rounded-xl bg-white px-2.5 py-1.5 text-lg font-black text-black">{score}</div>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">{car.tagline}</p>
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
          <div>
            <span className="block text-sm font-bold text-lime-300">{getVerdict(score)}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600"><Database className="size-3" /> {car.ratingConfidence} score</span>
          </div>
          <Link href={`/car/${car.slug}`} className="grid size-8 place-items-center rounded-full bg-white/5 text-white transition group-hover:bg-white group-hover:text-black"><ArrowUpRight className="size-4" /></Link>
        </div>
      </div>
    </article>
  );
}
