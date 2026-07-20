import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CarArt } from "@/components/car-art";
import { FavoriteButton } from "@/components/favorite-button";
import { getOverallScore, getVerdict } from "@/lib/cars";
import type { Car } from "@/types/car";

export function CarCard({ car }: { car: Car }) {
  const score = getOverallScore(car);

  return (
    <article className="group rounded-[1.55rem] border border-white/8 bg-[#101216] p-2 transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-[#14161b]">
      <div className="relative">
        <Link href={`/car/${car.slug}`}>
          <CarArt car={car} compact />
        </Link>
        <div className="absolute right-3 top-3">
          <FavoriteButton slug={car.slug} iconOnly />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{car.year} · {car.trim}</p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-white">{car.make} {car.model}</h3>
          </div>
          <div className="rounded-xl bg-white px-2.5 py-1.5 text-lg font-black text-black">{score}</div>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">{car.tagline}</p>
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
          <span className="text-sm font-bold text-lime-300">{getVerdict(score)}</span>
          <Link href={`/car/${car.slug}`} className="grid size-8 place-items-center rounded-full bg-white/5 text-white transition group-hover:bg-white group-hover:text-black" aria-label={`View ${car.make} ${car.model}`}>
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
