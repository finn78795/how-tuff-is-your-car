/* eslint-disable @next/next/no-img-element */
"use client";

import { ImageIcon, MessageSquarePlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Car, CarImageCredit, CarSearchResult } from "@/types/car";

type ImageCar = Pick<Car, "make" | "model" | "year" | "trim" | "generation" | "imageQuery" | "accent" | "accent2" | "image"> |
  (Pick<CarSearchResult, "make" | "model" | "year" | "trim" | "imageQuery"> & { generation?: string; accent?: string; accent2?: string; image?: CarImageCredit });

const browserImageCache = new Map<string, CarImageCredit>();
const fallbackImage: CarImageCredit = {
  url: "/images/fallback-car.svg",
  fallback: true,
  author: "How Tuff Is Your Car",
  license: "Original illustration",
  matchLevel: "fallback",
  matchLabel: "Original vehicle illustration",
};

export function VehicleImage({ car, compact = false, className = "" }: { car: ImageCar; compact?: boolean; className?: string }) {
  const cacheKey = `${car.year}|${car.make}|${car.model}|${car.trim}|${car.generation ?? ""}|${car.imageQuery}`;
  const cached = car.image ?? browserImageCache.get(cacheKey);
  const [image, setImage] = useState<CarImageCredit | undefined>(cached);
  const [loading, setLoading] = useState(!cached);

  const lookupUrl = useMemo(() => {
    const params = new URLSearchParams({
      year: String(car.year),
      make: car.make,
      model: car.model,
      trim: car.trim,
      query: car.imageQuery,
    });
    if (car.generation) params.set("generation", car.generation);
    return `/api/catalog/image?${params.toString()}`;
  }, [car.generation, car.imageQuery, car.make, car.model, car.trim, car.year]);

  useEffect(() => {
    if (car.image) {
      browserImageCache.set(cacheKey, car.image);
      setImage(car.image);
      setLoading(false);
      return;
    }

    const cachedImage = browserImageCache.get(cacheKey);
    if (cachedImage) {
      setImage(cachedImage);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    fetch(lookupUrl, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Image lookup failed")))
      .then((value: CarImageCredit) => {
        if (!active) return;
        browserImageCache.set(cacheKey, value);
        setImage(value);
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        browserImageCache.set(cacheKey, fallbackImage);
        setImage(fallbackImage);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [cacheKey, car.image, lookupUrl]);

  const src = image?.url || fallbackImage.url;
  const accent = "accent" in car && car.accent ? car.accent : "#bef264";
  const accent2 = "accent2" in car && car.accent2 ? car.accent2 : "#5eead4";
  const credit = [image?.author, image?.license].filter(Boolean).join(" · ");
  const matchLabel = image?.matchLabel || (image?.fallback ? "Original vehicle illustration" : "Community photo");
  const issueUrl = `https://github.com/finn78795/how-tuff-is-your-car/issues/new?${new URLSearchParams({
    title: `Better photo: ${car.year} ${car.make} ${car.model}`,
    body: `The current photo for **${car.year} ${car.make} ${car.model} ${car.trim}** could be improved.\n\nSuggested Wikimedia Commons or freely licensed photo URL:\n\nReason:`,
  }).toString()}`;

  return (
    <div className={`group/image relative overflow-hidden bg-[#0c0f12] ${compact ? "aspect-[16/10] rounded-[1.2rem]" : "aspect-[16/10] rounded-[2rem]"} ${className}`} style={{ boxShadow: `inset 0 0 0 1px ${accent}20` }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 45% 35%, ${accent}22, transparent 48%), linear-gradient(135deg, ${accent2}10, transparent 55%)` }} />
      <img
        src={src}
        alt={`${car.year} ${car.make} ${car.model}`}
        className={`relative h-full w-full object-cover transition duration-700 ${loading ? "scale-105 opacity-25 blur-sm" : "opacity-90 group-hover/image:scale-[1.025] group-hover/image:opacity-100"}`}
        loading={compact ? "lazy" : "eager"}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackImage.url;
        }}
      />
      {loading && <div className="absolute inset-0 grid place-items-center"><span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/8"><span className="block h-full w-1/2 animate-[image-load_1s_ease-in-out_infinite] rounded-full bg-lime-300/70" /></span></div>}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

      <div className="absolute left-3 top-3 rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-[10px] font-black text-white/75 backdrop-blur-md">
        {matchLabel}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {!compact && <p className="truncate text-[10px] font-bold text-white/55">{image?.fallback ? "No reliable public photo found yet" : credit || "Community-sourced vehicle photo"}</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {!compact && <a href={issueUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="pointer-events-auto grid size-7 place-items-center rounded-full border border-white/10 bg-black/50 text-white/55 backdrop-blur-md transition hover:text-white" aria-label="Suggest a better photo"><MessageSquarePlus className="size-3.5" /></a>}
          {image?.sourceUrl ? (
            <a href={image.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="pointer-events-auto shrink-0 rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white/70 backdrop-blur-md transition hover:text-white" aria-label="Open photo credit on Wikimedia Commons">
              Photo details ↗
            </a>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-bold text-white/45 backdrop-blur-md"><ImageIcon className="size-3" /> Illustration</span>
          )}
        </div>
      </div>
    </div>
  );
}
