/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
  Camera, Check, CheckCircle2, ChevronDown, ImagePlus, LoaderCircle, Plus,
  Save, ScanLine, Sparkles, Trash2, Wrench, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { calculateBuildRating, makeAccessoryId } from "@/lib/build-scoring";
import { createBuildThumbnail, vehicleAiProvider } from "@/lib/ai/provider";
import type { AccessoryCategory, AccessoryObservation, FactoryStatus, VehicleAnalysisResult } from "@/lib/ai/types";
import { saveBuild } from "@/lib/storage";
import type { CarSearchResult } from "@/types/car";

const categories: Array<{ value: AccessoryCategory; label: string }> = [
  ["wheels", "Wheels"], ["tires", "Tires"], ["suspension", "Suspension / stance"],
  ["aero", "Aero"], ["body", "Body work"], ["lighting", "Lighting"],
  ["exhaust", "Exhaust"], ["utility", "Utility / cargo"], ["offroad", "Off-road equipment"],
  ["wrap", "Wrap / paint"], ["tint", "Tint"], ["interior", "Interior"], ["other", "Other"],
].map(([value, label]) => ({ value: value as AccessoryCategory, label }));

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
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await vehicleAiProvider.analyzeVehicle(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The photo rating could not read this image.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setFile(null); setResult(null); setError(""); };

  return (
    <section id="photo-rating" className="scroll-mt-24 pb-20">
      <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#101216]">
        <div className="grid lg:grid-cols-[.82fr_1.18fr]">
          <div className="relative min-h-[32rem] border-b border-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(190,242,100,.10),transparent_42%)]" />
            <div className="relative flex h-full flex-col">
              <p className="eyebrow">Rate my build</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl">Drop in a photo.</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">It will take a guess at the car, point out the visible parts, and show how those choices change the score. You can fix anything it gets wrong before saving it.</p>

              <label className="group relative mt-7 flex min-h-72 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 transition hover:border-lime-300/45 hover:bg-lime-300/[0.025]">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setError(""); }} />
                {preview ? <img src={preview} alt="Uploaded car" className="absolute inset-0 h-full w-full object-cover" /> : <div className="px-5 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lime-300 text-black"><ImagePlus className="size-6" /></span><p className="mt-4 font-black text-white">Choose a car photo</p><p className="mt-1 text-xs text-zinc-600">A clear three-quarter or side view works best</p></div>}
                {preview && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />}
                {preview && <button type="button" onClick={(event) => { event.preventDefault(); clear(); }} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black" aria-label="Remove photo"><X className="size-4" /></button>}
              </label>

              <button type="button" onClick={analyze} disabled={!file || loading} className="mt-4 flex h-13 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-35">
                {loading ? <><LoaderCircle className="size-4 animate-spin" /> Looking over the car…</> : <><ScanLine className="size-4" /> Rate this photo</>}
              </button>
              <p className="mt-3 text-center text-[11px] leading-5 text-zinc-700">Photos are resized in your browser, sent only for this rating, and are not added to a public gallery.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {!result && !error && <EmptyAnalysis />}
            {error && <AnalysisError message={error} />}
            {result && file && <AnalysisResult original={result} file={file} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyAnalysis() {
  const rows = [
    [ScanLine, "A likely car match", "Make, model, rough years, and a confidence level"],
    [Wrench, "A parts list you can edit", "Wheels, stance, aero, utility gear, lighting, and more"],
    [Sparkles, "The before-and-after score", "The base car stays important; visible changes can only move it so far"],
  ] as const;
  return <div className="flex h-full min-h-96 flex-col justify-center"><span className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lime-300"><Sparkles className="size-5" /></span><h3 className="mt-5 text-2xl font-black text-white">Here’s what it will look for.</h3><div className="mt-6 space-y-3">{rows.map(([Icon, title, copy]) => <div key={title} className="flex gap-3 rounded-xl border border-white/7 bg-white/[0.02] p-4"><Icon className="mt-0.5 size-4 shrink-0 text-lime-300" /><div><p className="font-bold text-white">{title}</p><p className="mt-1 text-sm text-zinc-600">{copy}</p></div></div>)}</div><p className="mt-6 text-xs leading-5 text-zinc-700">The model is open-weight Llama Vision running through Cloudflare Workers AI’s free daily allowance. It can still miss subtle factory options or confuse similar generations.</p></div>;
}

function AnalysisError({ message }: { message: string }) {
  return <div className="flex h-full min-h-96 flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><Camera className="size-6" /></span><h3 className="mt-5 text-2xl font-black text-white">Photo ratings are not connected yet.</h3><p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">{message}</p><div className="mt-4 max-w-md rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-left text-xs leading-5 text-zinc-600">Add <code className="text-zinc-300">CLOUDFLARE_ACCOUNT_ID</code> and <code className="text-zinc-300">CLOUDFLARE_API_TOKEN</code> in Vercel, accept the Llama Vision license once in Cloudflare, then redeploy.</div></div>;
}

function AnalysisResult({ original, file }: { original: VehicleAnalysisResult; file: File }) {
  const [recognition, setRecognition] = useState(original.recognition);
  const [accessories, setAccessories] = useState(original.accessoryDetection.accessories);
  const [selectedSlug, setSelectedSlug] = useState(original.matchedCar?.slug ?? "");
  const [nickname, setNickname] = useState(`${original.recognition.make} ${original.recognition.model}`);
  const [addOpen, setAddOpen] = useState(false);
  const [newPart, setNewPart] = useState("");
  const [newCategory, setNewCategory] = useState<AccessoryCategory>("other");
  const [saved, setSaved] = useState(false);
  const matches = original.catalogMatches ?? (original.matchedCar ? [original.matchedCar] : []);
  const selectedMatch = matches.find((car) => car.slug === selectedSlug);
  const calculated = useMemo(() => calculateBuildRating(accessories, selectedMatch?.ratings, original.styleRating.score), [accessories, original.styleRating.score, selectedMatch?.ratings]);

  const updateAccessory = (id: string, patch: Partial<AccessoryObservation>) => {
    setAccessories((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    setSaved(false);
  };

  const removeAccessory = (id: string) => {
    setAccessories((current) => current.filter((item) => item.id !== id));
    setSaved(false);
  };

  const addAccessory = () => {
    const name = newPart.trim();
    if (!name) return;
    setAccessories((current) => [...current, {
      id: makeAccessoryId(name, current.length + 20),
      name,
      category: newCategory,
      factoryStatus: "aftermarket",
      confidence: 1,
      quality: 7,
      fit: 7,
      execution: 7,
      condition: 7,
      explanation: "Added by you after checking the photo.",
      ratingImpact: { vibe: 0, tuffness: 0, speed: 0, style: 0, fun: 0 },
      overallImpact: 0,
      enabled: true,
    }]);
    setNewPart("");
    setAddOpen(false);
    setSaved(false);
  };

  const save = async () => {
    const previewDataUrl = await createBuildThumbnail(file);
    saveBuild({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nickname: nickname.trim() || `${recognition.make} ${recognition.model}`,
      createdAt: new Date().toISOString(),
      previewDataUrl,
      recognition,
      matchedCar: selectedMatch,
      accessories: calculated.accessories,
      styleRating: original.styleRating,
      buildRating: calculated.buildRating,
    });
    setSaved(true);
  };

  return (
    <div>
      <div className="border-b border-white/8 pb-6">
        <p className="text-xs font-black uppercase tracking-[.18em] text-lime-300">Here’s what I think I’m looking at</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <EditableText label="Make" value={recognition.make} onChange={(make) => setRecognition((current) => ({ ...current, make }))} />
          <EditableText label="Model" value={recognition.model} onChange={(model) => setRecognition((current) => ({ ...current, model }))} />
          <EditableText label="Year range" value={recognition.yearRange ?? ""} placeholder="e.g. 2018–2023" onChange={(yearRange) => setRecognition((current) => ({ ...current, yearRange }))} />
          <EditableText label="Trim" value={recognition.trim ?? ""} placeholder="Leave blank if unsure" onChange={(trim) => setRecognition((current) => ({ ...current, trim }))} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-600"><span>The photo guess is editable.</span><span>{Math.round(recognition.confidence * 100)}% model confidence</span></div>
      </div>

      {matches.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-lime-300/16 bg-lime-300/[0.045] p-4">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-lime-300"><CheckCircle2 className="size-3.5" /> Base car from the catalog</label>
          <div className="relative mt-3">
            <select value={selectedSlug} onChange={(event) => { setSelectedSlug(event.target.value); setSaved(false); }} className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0c0e11] px-4 pr-10 text-sm font-bold text-white outline-none focus:border-lime-300/45">
              <option value="">No catalog match — use photo score only</option>
              {matches.map((car) => <option key={car.slug} value={car.slug}>{car.year} {car.make} {car.model} {car.trim}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-4 size-4 text-zinc-600" />
          </div>
          {selectedMatch && <div className="mt-3 flex items-center justify-between gap-4"><p className="text-xs leading-5 text-zinc-500">This is the starting score before visible accessories are applied.</p><Link href={`/car/${selectedMatch.slug}`} className="shrink-0 text-xs font-black text-lime-300">Open car →</Link></div>}
        </div>
      ) : <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-6 text-zinc-500">I could not confidently match this one to the catalog, so the build score starts from the visual photo rating.</div>}

      <BuildScoreCard selectedMatch={selectedMatch} finalScore={calculated.buildRating.finalScore} totalImpact={calculated.buildRating.totalImpact} baseScore={calculated.buildRating.baseScore} verdict={calculated.buildRating.verdict} />

      <div className="mt-7 flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Visible parts</p><p className="mt-1 text-sm text-zinc-500">Turn off anything it misread. Factory equipment does not change the build score.</p></div><button type="button" onClick={() => setAddOpen((open) => !open)} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white hover:border-lime-300/35"><Plus className="size-3.5" /> Add one</button></div>

      {addOpen && <div className="mt-4 grid gap-2 rounded-2xl border border-lime-300/15 bg-lime-300/[0.035] p-4 sm:grid-cols-[1fr_12rem_auto]"><input value={newPart} onChange={(event) => setNewPart(event.target.value)} placeholder="e.g. roof rack" className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-lime-300/45" /><select value={newCategory} onChange={(event) => setNewCategory(event.target.value as AccessoryCategory)} className="h-11 rounded-xl border border-white/10 bg-[#0c0e11] px-3 text-sm text-white outline-none">{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select><button type="button" onClick={addAccessory} className="h-11 rounded-xl bg-lime-300 px-4 text-sm font-black text-black hover:bg-lime-200">Add</button></div>}

      <div className="mt-4 space-y-3">
        {calculated.accessories.map((item) => <AccessoryRow key={item.id} item={item} onUpdate={updateAccessory} onRemove={removeAccessory} />)}
        {!calculated.accessories.length && <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-600">No clearly visible accessories were found. Add one manually if the photo shows something the model missed.</div>}
      </div>

      {original.styleRating.notes.length > 0 && <details className="mt-6 rounded-xl border border-white/8 bg-white/[0.02] p-4"><summary className="cursor-pointer text-sm font-black text-white">A few visual notes</summary><ul className="mt-3 space-y-2">{original.styleRating.notes.map((note) => <li key={note} className="text-sm leading-6 text-zinc-500">• {note}</li>)}</ul></details>}

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label><span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-zinc-600">Name this build</span><input value={nickname} onChange={(event) => { setNickname(event.target.value); setSaved(false); }} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm font-bold text-white outline-none focus:border-lime-300/40" /></label>
        <button type="button" onClick={save} className="mt-auto flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-black hover:bg-zinc-200">{saved ? <><Check className="size-4" /> Saved</> : <><Save className="size-4" /> Save to garage</>}</button>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-zinc-700">Photo recognition can confuse similar trims and generations. The model identifies visible parts; the score change itself is calculated by the site’s fixed rules and capped at ±1.2 points. Model: {original.model}.</p>
    </div>
  );
}

function EditableText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.14em] text-zinc-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm font-bold text-white outline-none placeholder:text-zinc-700 focus:border-lime-300/40" /></label>;
}

function BuildScoreCard({ selectedMatch, baseScore, finalScore, totalImpact, verdict }: { selectedMatch?: CarSearchResult; baseScore?: number; finalScore: number; totalImpact: number; verdict: string }) {
  return (
    <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-[#0b0d10] p-5">
      <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Build rating</p><p className="mt-2 text-2xl font-black text-lime-300">{verdict}</p><p className="mt-1 text-xs text-zinc-600">{selectedMatch ? "Base car plus the visible setup" : "Visual score plus the visible setup"}</p></div><div className="text-right"><span className="text-6xl font-black tracking-[-.08em] text-white">{finalScore.toFixed(1)}</span><span className="font-black text-zinc-700">/10</span></div></div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <ScoreStep label="Base" value={baseScore?.toFixed(1) ?? "Photo"} />
        <ScoreStep label="Parts" value={`${totalImpact > 0 ? "+" : ""}${totalImpact.toFixed(1)}`} accent={totalImpact > 0 ? "good" : totalImpact < 0 ? "bad" : undefined} />
        <ScoreStep label="Final" value={finalScore.toFixed(1)} />
      </div>
    </div>
  );
}

function ScoreStep({ label, value, accent }: { label: string; value: string; accent?: "good" | "bad" }) {
  return <div className="rounded-xl border border-white/7 bg-white/[0.025] px-2 py-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-zinc-700">{label}</p><p className={`mt-1 text-lg font-black ${accent === "good" ? "text-lime-300" : accent === "bad" ? "text-amber-300" : "text-white"}`}>{value}</p></div>;
}

function AccessoryRow({ item, onUpdate, onRemove }: { item: AccessoryObservation; onUpdate: (id: string, patch: Partial<AccessoryObservation>) => void; onRemove: (id: string) => void }) {
  const partScore = (item.quality + item.fit + item.execution + item.condition) / 4;
  return (
    <div className={`rounded-2xl border p-4 transition ${item.enabled ? "border-white/9 bg-white/[0.025]" : "border-white/5 bg-black/10 opacity-55"}`}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => onUpdate(item.id, { enabled: !item.enabled })} className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border ${item.enabled ? "border-lime-300 bg-lime-300 text-black" : "border-white/15 text-transparent"}`} aria-label={`${item.enabled ? "Remove" : "Include"} ${item.name} in rating`}><Check className="size-3.5" /></button>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-white">{item.name}</p><span className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-[.12em] text-zinc-600">{categoryLabel(item.category)}</span></div><p className="mt-1 text-xs leading-5 text-zinc-600">{item.explanation}</p></div>
        <div className="shrink-0 text-right"><p className="text-lg font-black text-white">{partScore.toFixed(1)}<span className="text-[10px] text-zinc-700">/10</span></p><p className={`mt-1 text-[10px] font-black ${item.overallImpact > 0 ? "text-lime-300" : item.overallImpact < 0 ? "text-amber-300" : "text-zinc-600"}`}>{formatImpact(item.overallImpact)} overall</p></div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 pl-9">
        <MiniPartScore label="Quality" value={item.quality} />
        <MiniPartScore label="Fit" value={item.fit} />
        <MiniPartScore label="Install" value={item.execution} />
        <MiniPartScore label="Condition" value={item.condition} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-9">
        <select value={item.factoryStatus} onChange={(event) => onUpdate(item.id, { factoryStatus: event.target.value as FactoryStatus })} className="h-9 rounded-lg border border-white/8 bg-[#0b0d10] px-2 text-xs font-bold text-zinc-400 outline-none">
          <option value="aftermarket">Aftermarket</option><option value="factory">Factory equipment</option><option value="unknown">Not sure</option>
        </select>
        <span className="text-[10px] text-zinc-700">{Math.round(item.confidence * 100)}% detection confidence</span>
        <button type="button" onClick={() => onRemove(item.id)} className="ml-auto grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-red-400/10 hover:text-red-300" aria-label={`Delete ${item.name}`}><Trash2 className="size-3.5" /></button>
      </div>
    </div>
  );
}

function MiniPartScore({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-white/6 bg-black/15 px-1.5 py-2 text-center"><p className="text-[8px] font-black uppercase tracking-[.1em] text-zinc-700">{label}</p><p className="mt-0.5 text-xs font-black text-zinc-400">{value.toFixed(1)}</p></div>;
}

function categoryLabel(category: AccessoryCategory) {
  return categories.find((item) => item.value === category)?.label ?? "Other";
}

function formatImpact(value: number) {
  if (Math.abs(value) < 0.01) return "0.0";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}
