/* eslint-disable @next/next/no-img-element */
"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Car, CarImageCredit, CarSearchResult } from "@/types/car";

type ImageCar = Pick<Car, "make" | "model" | "year" | "imageQuery" | "accent" | "accent2" | "image"> | (Pick<CarSearchResult, "make" | "model" | "year" | "imageQuery"> & { accent?: string; accent2?: string; image?: CarImageCredit });

const browserImageCache = new Map<string, CarImageCredit>();
const fallbackImage: CarImageCredit = {
  url: "/images/fallback-car.svg",
  fallback: true,
  author: "How Tuff Is Your Car",
  license: "Original illustration",
};

export function VehicleImage({ car, compact = false, className = "" }: { car: ImageCar; compact?: boolean; className?: string }) {
  const cached = car.image ?? browserImageCache.get(car.imageQuery);
  const [image, setImage] = useState<CarImageCredit | undefined>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (car.image) {
      browserImageCache.set(car.imageQuery, car.image);
      setImage(car.image);
      setLoading(false);
      return;
    }

    const cachedImage = browserImageCache.get(car.imageQuery);
    if (cachedImage) {
      setImage(cachedImage);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    fetch(`/api/catalog/image?query=${encodeURIComponent(car.imageQuery)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Image lookup failed")))
      .then((value: CarImageCredit) => {
        if (!active) return;
        browserImageCache.set(car.imageQuery, value);
        setImage(value);
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        browserImageCache.set(car.imageQuery, fallbackImage);
        setImage(fallbackImage);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [car.image, car.imageQuery]);

  const src = image?.url || fallbackImage.url;
  const accent = "accent" in car && car.accent ? car.accent : "#bef264";
  const accent2 = "accent2" in car && car.accent2 ? car.accent2 : "#5eead4";
  const credit = [image?.author, image?.license].filter(Boolean).join(" · ");

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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {!compact && <p className="truncate text-[10px] font-bold text-white/55">{image?.fallback ? "Original vehicle illustration" : credit || "Community-sourced vehicle photo"}</p>}
        </div>
        {image?.sourceUrl ? (
          <a href={image.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="pointer-events-auto shrink-0 rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white/70 backdrop-blur-md transition hover:text-white" aria-label="Open photo credit on Wikimedia Commons">
            Photo credit ↗
          </a>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-bold text-white/45 backdrop-blur-md"><ImageIcon className="size-3" /> Illustration</span>
        )}
      </div>
    </div>
  );
}
