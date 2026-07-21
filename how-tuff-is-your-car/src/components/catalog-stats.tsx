"use client";

import { Database, Landmark, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface Stats { curated: number; classicYearModels: number; epaConfigurations: number; totalSearchable: number }

export function CatalogStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/catalog/stats")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-zinc-600">
      <span className="flex items-center gap-1.5"><Database className="size-3.5" /> {stats ? `${stats.totalSearchable.toLocaleString()}+ searchable entries` : "a lot of searchable cars"}</span>
      <span className="flex items-center gap-1.5"><Landmark className="size-3.5" /> classics from 1950</span>
      <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" /> scores with reasons</span>
    </div>
  );
}
