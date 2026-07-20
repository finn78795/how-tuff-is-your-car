"use client";

import { useEffect, useId, useState } from "react";

export function RatingGauge({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const [visibleScore, setVisibleScore] = useState(0);
  const gradientId = `gauge-${useId().replace(/:/g, "")}`;
  const radius = 46;
  const circumference = Math.PI * radius;
  const offset = circumference - (visibleScore / 10) * circumference;

  useEffect(() => {
    const timer = window.setTimeout(() => setVisibleScore(score), 180 + delay);
    return () => window.clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.025] p-4 text-center">
      <div className="relative mx-auto aspect-[2/1] max-w-44 overflow-hidden">
        <svg viewBox="0 0 120 62" className="h-full w-full overflow-visible" aria-label={`${label}: ${score} out of 10`}>
          <path d="M 14 58 A 46 46 0 0 1 106 58" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 14 58 A 46 46 0 0 1 106 58"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1">
              <stop offset="0%" stopColor="#71717a" />
              <stop offset="65%" stopColor="#bef264" />
              <stop offset="100%" stopColor="#d9f99d" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-3xl font-black tracking-[-0.06em] text-white" aria-hidden="true">
          {visibleScore.toFixed(1)}
        </div>
      </div>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
    </div>
  );
}
