/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Camera, CheckCircle2, ImagePlus, LoaderCircle, ScanLine, Sparkles, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import { vehicleAiProvider } from "@/lib/ai/provider";
import type { VehicleAnalysisResult } from "@/lib/ai/types";

export function AiUploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VehicleAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await vehicleAiProvider.analyzeVehicle(file)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The analyzer could not read this photo."); }
    finally { setLoading(false); }
  };

  const clear = () => { setFile(null); setResult(null); setError(""); };

  return (
    <section id="photo-rating" className="scroll-mt-24 pb-20">
      <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#101216]">
        <div className="grid lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative min-h-[28rem] border-b border-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(190,242,100,.10),transparent_42%)]" />
            <div className="relative flex h-full flex-col">
              <p className="eyebrow">Photo analyzer</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl">What are you looking at?</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">Upload a clear photo. The vision model can suggest the vehicle, visible modifications, and a restrained style score. You always get to confirm the match, and large photos are resized in your browser first.</p>

              <label className="group relative mt-7 flex min-h-64 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 transition hover:border-lime-300/45 hover:bg-lime-300/[0.025]">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setError(""); }} />
                {preview ? <img src={preview} alt="Uploaded car" className="absolute inset-0 h-full w-full object-cover" /> : <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lime-300 text-black"><ImagePlus className="size-6" /></span><p className="mt-4 font-black text-white">Choose a car photo</p><p className="mt-1 text-xs text-zinc-600">JPG, PNG, or WebP · resized before upload</p></div>}
                {preview && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />}
                {preview && <button type="button" onClick={(event) => { event.preventDefault(); clear(); }} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black" aria-label="Remove photo"><X className="size-4" /></button>}
              </label>

              <button type="button" onClick={analyze} disabled={!file || loading} className="mt-4 flex h-13 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-35">
                {loading ? <><LoaderCircle className="size-4 animate-spin" /> Looking closely…</> : <><ScanLine className="size-4" /> Analyze photo</>}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {!result && !error && <EmptyAnalysis />}
            {error && <div className="flex h-full min-h-80 flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><Camera className="size-6" /></span><h3 className="mt-5 text-2xl font-black text-white">Analyzer setup needed</h3><p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">{error}</p><p className="mt-4 max-w-md rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-xs leading-5 text-zinc-600">Add <code className="text-zinc-300">OPENAI_API_KEY</code> in Vercel Environment Variables, then redeploy. The key stays server-side.</p></div>}
            {result && <AnalysisResult result={result} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyAnalysis() {
  return <div className="flex h-full min-h-80 flex-col justify-center"><span className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lime-300"><Sparkles className="size-5" /></span><h3 className="mt-5 text-2xl font-black text-white">One photo, three useful guesses.</h3><div className="mt-6 space-y-3">{[[ScanLine, "Vehicle match", "Make, model, likely years, and confidence"], [Wrench, "Visible setup", "Wheels, aero, lighting, stance, and utility accessories"], [Sparkles, "Style notes", "A calm 1–10 opinion with visible reasons"]].map(([Icon, title, copy]) => { const C = Icon as typeof ScanLine; return <div key={String(title)} className="flex gap-3 rounded-xl border border-white/7 bg-white/[0.02] p-4"><C className="mt-0.5 size-4 shrink-0 text-lime-300" /><div><p className="font-bold text-white">{String(title)}</p><p className="mt-1 text-sm text-zinc-600">{String(copy)}</p></div></div>; })}</div></div>;
}

function AnalysisResult({ result }: { result: VehicleAnalysisResult }) {
  const { recognition, accessoryDetection, styleRating, matchedCar } = result;
  return (
    <div>
      <div className="flex items-start justify-between gap-5 border-b border-white/8 pb-6">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-lime-300">Likely match</p><h3 className="mt-2 text-3xl font-black tracking-[-.05em] text-white">{recognition.make} {recognition.model}</h3><p className="mt-2 text-sm text-zinc-500">{[recognition.yearRange, recognition.trim].filter(Boolean).join(" · ") || "Exact year or trim uncertain"}</p></div>
        <div className="rounded-2xl bg-white px-3 py-2 text-center text-black"><span className="block text-2xl font-black">{Math.round(recognition.confidence * 100)}%</span><span className="block text-[9px] font-black uppercase tracking-[.14em]">confidence</span></div>
      </div>

      {matchedCar && <Link href={`/car/${matchedCar.slug}`} className="mt-5 flex items-center justify-between rounded-xl border border-lime-300/20 bg-lime-300/[0.055] p-4 transition hover:border-lime-300/45"><div><p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[.15em] text-lime-300"><CheckCircle2 className="size-3.5" /> Catalog match</p><p className="mt-1 font-black text-white">{matchedCar.year} {matchedCar.make} {matchedCar.model}</p><p className="mt-1 text-xs text-zinc-500">Open it to confirm the exact configuration.</p></div><span className="text-sm font-black text-lime-300">View →</span></Link>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Style score</p><div className="mt-3 flex items-end gap-2"><span className="text-5xl font-black tracking-[-.07em] text-white">{styleRating.score.toFixed(1)}</span><span className="pb-1 font-black text-zinc-700">/10</span></div><p className="mt-2 font-bold text-lime-300">{styleRating.verdict}</p></div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Visible accessories</p><p className="mt-3 text-4xl font-black text-white">{accessoryDetection.accessories.length}</p><p className="mt-2 text-sm text-zinc-500">Only items the model could see with reasonable confidence.</p></div>
      </div>

      {styleRating.notes.length > 0 && <div className="mt-5"><p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-zinc-600">Why</p><ul className="space-y-2">{styleRating.notes.map((note) => <li key={note} className="rounded-xl border border-white/7 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-zinc-400">{note}</li>)}</ul></div>}
      {accessoryDetection.accessories.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{accessoryDetection.accessories.map((item) => <span key={`${item.category}-${item.name}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-400">{item.name} · {Math.round(item.confidence * 100)}%</span>)}</div>}
      <p className="mt-6 text-[11px] leading-5 text-zinc-700">AI can mistake generations, trims, and aftermarket parts. Treat this as a useful starting point, not vehicle documentation. Model: {result.model}.</p>
    </div>
  );
}
