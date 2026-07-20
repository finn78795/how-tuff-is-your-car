"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, LoaderCircle, ScanSearch, Sparkles, UploadCloud, Wrench } from "lucide-react";
import { vehicleAiProvider } from "@/lib/ai/provider";

export function AiUploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "placeholder">("idle");
  const [message, setMessage] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const scan = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      await Promise.all([
        vehicleAiProvider.recognizeVehicle(file),
        vehicleAiProvider.detectAccessories(file),
        vehicleAiProvider.rateStyle(file),
      ]);
    } catch (error) {
      setStatus("placeholder");
      setMessage(error instanceof Error ? error.message : "AI model is not connected yet.");
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/9 bg-[#111318] p-6 sm:p-8 lg:p-10">
      <div className="absolute -right-20 -top-24 size-72 rounded-full bg-lime-300/8 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-lime-300">
            <Sparkles className="size-3.5" /> AI-ready scaffold
          </span>
          <h2 className="mt-5 max-w-xl text-3xl font-black tracking-[-0.055em] text-white sm:text-5xl">Drop a photo. Let the model judge the build.</h2>
          <p className="mt-4 max-w-xl leading-7 text-zinc-400">The upload flow, provider interface, and API routes are wired. Connect a vision model later for vehicle recognition, accessory detection, and an AI style score.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[{ icon: ScanSearch, text: "Identify car" }, { icon: Wrench, text: "Spot mods" }, { icon: Camera, text: "Rate the fitment" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 text-sm font-bold text-zinc-300">
                <Icon className="size-4 text-lime-300" /> {text}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.55rem] border border-dashed border-white/16 bg-black/25 p-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative flex min-h-64 w-full items-center justify-center overflow-hidden rounded-[1.2rem] bg-[#0a0b0e] text-center transition hover:bg-[#0d0f13]"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected car preview" className="absolute inset-0 h-full w-full object-cover opacity-65" />
            ) : null}
            <div className="relative z-10 max-w-xs p-6">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-black/45 text-lime-300 backdrop-blur-md">
                <UploadCloud className="size-6" />
              </span>
              <p className="mt-4 font-black text-white">{file ? file.name : "Upload a car photo"}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">JPG, PNG, or WEBP. The current route intentionally returns a placeholder response.</p>
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setStatus("idle");
              setMessage("");
            }}
          />
          <button
            type="button"
            onClick={scan}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 font-black text-black transition hover:bg-lime-200"
          >
            {status === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
            {status === "loading" ? "Scanning..." : file ? "Run AI scan" : "Choose photo"}
          </button>
          {status === "placeholder" && (
            <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/70">{message}</p>
          )}
        </div>
      </div>
    </section>
  );
}
