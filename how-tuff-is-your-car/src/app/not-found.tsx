import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-[75vh] place-items-center px-4 py-16 text-center">
      <div>
        <p className="eyebrow">404 · missed the turn</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-white sm:text-7xl">That car page is not here.</h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-zinc-500">The link may be old, the model may have moved, or the catalog did not recognize it. Search again and there is probably a close match.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-lime-300 px-5 font-black text-black transition hover:bg-lime-200"><Search className="size-4" /> Search cars</Link><Link href="/compare" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 px-5 font-black text-white transition hover:bg-white/5"><ArrowLeft className="size-4" /> Compare page</Link></div>
      </div>
    </main>
  );
}
