import { NextResponse } from "next/server";
import { getCatalogStats } from "@/lib/catalog";

export async function GET() {
  const stats = await getCatalogStats();
  return NextResponse.json(stats, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
