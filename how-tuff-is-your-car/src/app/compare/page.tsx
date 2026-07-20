import type { Metadata } from "next";
import { ComparisonTool } from "@/components/comparison-tool";

export const metadata: Metadata = { title: "Compare Cars", description: "Compare car ratings side by side." };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ car1?: string; car2?: string }> }) {
  const params = await searchParams;
  return <main className="min-h-screen"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"><div className="mb-8"><p className="eyebrow">Comparison mode</p><h1 className="mt-3 text-5xl font-black tracking-[-0.065em] text-white sm:text-7xl">Put them side by side.</h1><p className="mt-4 max-w-2xl text-zinc-500">Search the full catalog, compare every category, and open either result to see how confident the rating is.</p></div><ComparisonTool initialA={params.car1} initialB={params.car2} /></div></main>;
}
