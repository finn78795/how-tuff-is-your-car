import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 16), 1), 40);
  if (query.length < 2) return NextResponse.json({ results: [] });
  const results = await searchCatalog(query, limit);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
