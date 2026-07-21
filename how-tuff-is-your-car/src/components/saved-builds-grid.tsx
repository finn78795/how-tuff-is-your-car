/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Camera, Trash2, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteBuild, getSavedBuilds, type SavedBuild } from "@/lib/storage";

export function SavedBuildsGrid() {
  const [builds, setBuilds] = useState<SavedBuild[]>([]);

  useEffect(() => {
    const sync = () => setBuilds(getSavedBuilds());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("htiyc-storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("htiyc-storage", sync);
    };
  }, []);

  if (!builds.length) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.018] px-6 py-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500"><Camera className="size-5" /></span>
        <h3 className="mt-4 text-xl font-black text-white">No photo-rated builds yet.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">Rate a car photo on the homepage, fix anything the model missed, then save it here.</p>
        <Link href="/#photo-rating" className="mt-5 inline-flex rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-black text-black hover:bg-lime-200">Rate a build</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {builds.map((build) => (
        <article key={build.id} className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#101216]">
          <div className="relative aspect-[16/10] bg-[#0b0d0f]">
            {build.previewDataUrl ? <img src={build.previewDataUrl} alt={build.nickname} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Camera className="size-8 text-zinc-800" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[.14em] text-lime-300">Saved build</p><h3 className="mt-1 text-xl font-black text-white">{build.nickname}</h3></div>
              <div className="rounded-xl bg-white px-2.5 py-1.5 text-xl font-black text-black">{build.buildRating.finalScore.toFixed(1)}</div>
            </div>
          </div>
          <div className="p-5">
            <p className="font-bold text-zinc-300">{build.recognition.make} {build.recognition.model}</p>
            <p className="mt-1 text-xs text-zinc-600">{[build.recognition.yearRange, build.recognition.trim].filter(Boolean).join(" · ") || "Year and trim not confirmed"}</p>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.02] px-3 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-zinc-500"><Wrench className="size-3.5" /> {build.accessories.filter((item) => item.enabled).length} visible parts</span>
              <span className={`font-black ${build.buildRating.totalImpact > 0 ? "text-lime-300" : build.buildRating.totalImpact < 0 ? "text-amber-300" : "text-zinc-500"}`}>{formatImpact(build.buildRating.totalImpact)}</span>
            </div>
            <div className="mt-4 flex gap-2">
              {build.matchedCar ? <Link href={`/car/${build.matchedCar.slug}`} className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-sm font-black text-white hover:border-lime-300/35">Open base car</Link> : <Link href="/#photo-rating" className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-sm font-black text-white hover:border-lime-300/35">Rate another</Link>}
              <button type="button" onClick={() => deleteBuild(build.id)} className="grid size-10 place-items-center rounded-xl border border-white/10 text-zinc-600 hover:border-red-400/30 hover:text-red-300" aria-label={`Delete ${build.nickname}`}><Trash2 className="size-4" /></button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatImpact(value: number) {
  if (Math.abs(value) < 0.05) return "No score change";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} overall`;
}
