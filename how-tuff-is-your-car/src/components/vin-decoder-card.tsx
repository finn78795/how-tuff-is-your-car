"use client";

import Link from "next/link";
import { CheckCircle2, KeyRound, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { VinDecodeResult } from "@/lib/catalog/nhtsa";
import type { CarSearchResult } from "@/types/car";

type VinResponse = { decoded: VinDecodeResult; matches: CarSearchResult[] };

export function VinDecoderCard() {
  const [vin, setVin] = useState("");
  const [result, setResult] = useState<VinResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const decode = async () => {
    if (!vin.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/catalog/vin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vin: vin.trim() }) });
      const body = await response.json() as VinResponse & { message?: string };
      if (!response.ok) throw new Error(body.message || "VIN lookup failed.");
      setResult(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "VIN lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const decoded = result?.decoded;
  const best = result?.matches[0];
  const details = decoded ? [
    ["Year", decoded.modelYear],
    ["Make", decoded.make],
    ["Model", decoded.model],
    ["Trim", decoded.trim],
    ["Body", decoded.bodyClass],
    ["Drive", decoded.driveType],
    ["Engine", decoded.engine],
    ["Power", decoded.horsepower ? `${decoded.horsepower} hp` : undefined],
    ["Transmission", decoded.transmission],
    ["Fuel", decoded.fuelType],
  ].filter((item): item is [string, string | number] => item[1] !== undefined && item[1] !== "") : [];

  return (
    <section className="pb-20">
      <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#101216]">
        <div className="grid lg:grid-cols-[.82fr_1.18fr]">
          <div className="relative border-b border-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(190,242,100,.09),transparent_48%)]" />
            <div className="relative">
              <span className="grid size-12 place-items-center rounded-2xl bg-lime-300 text-black"><KeyRound className="size-5" /></span>
              <p className="eyebrow mt-7">Official VIN lookup</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl">Decode what it left the factory as.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">This uses the free NHTSA vPIC service. It is most useful for 17-character VINs from 1981 and newer, and it does not reveal owner information.</p>

              <div className="mt-7 flex gap-2">
                <input
                  value={vin}
                  onChange={(event) => setVin(event.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17))}
                  onKeyDown={(event) => { if (event.key === "Enter") void decode(); }}
                  placeholder="17-character VIN"
                  aria-label="Vehicle identification number"
                  className="h-13 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 font-mono text-sm font-bold uppercase tracking-[.08em] text-white outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-700 focus:border-lime-300/55"
                />
                <button type="button" onClick={decode} disabled={vin.length !== 17 || loading} className="grid size-13 shrink-0 place-items-center rounded-xl bg-lime-300 text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Decode VIN">
                  {loading ? <LoaderCircle className="size-5 animate-spin" /> : <Search className="size-5" />}
                </button>
              </div>
              {error && <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-sm leading-6 text-amber-100/80">{error}</p>}
              <p className="mt-3 text-[11px] leading-5 text-zinc-700">The VIN is sent only to the site server and NHTSA for this lookup. It is not added to favorites or history.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {!decoded ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lime-300"><ShieldCheck className="size-6" /></span>
                <h3 className="mt-5 text-2xl font-black text-white">Factory details, no account needed.</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">Useful when a listing is vague, a badge looks suspicious, or you just want the original body and powertrain details.</p>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-6">
                  <div><p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[.16em] text-lime-300"><CheckCircle2 className="size-3.5" /> NHTSA result</p><h3 className="mt-2 text-3xl font-black tracking-[-.05em] text-white">{decoded.modelYear || "Unknown year"} {decoded.make || "Unknown make"} {decoded.model || "Unknown model"}</h3><p className="mt-2 text-sm text-zinc-500">{decoded.trim || "Trim not supplied"}</p></div>
                  {best && <Link href={`/car/${best.slug}`} className="rounded-full border border-lime-300/25 bg-lime-300/[0.06] px-4 py-2 text-sm font-black text-lime-300 transition hover:border-lime-300/50">Open closest match →</Link>}
                </div>
                <dl className="mt-5 grid gap-2 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded-xl border border-white/7 bg-white/[0.02] px-4 py-3"><dt className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-700">{label}</dt><dd className="mt-1 font-semibold text-zinc-300">{value}</dd></div>)}</dl>
                {decoded.errorText && !decoded.make && <p className="mt-5 text-sm leading-6 text-amber-200/70">{decoded.errorText}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
