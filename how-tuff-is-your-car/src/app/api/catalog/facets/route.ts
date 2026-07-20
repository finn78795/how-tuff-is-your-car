import { NextResponse } from "next/server";
import { getCarsForSelection, getCatalogMakes, getCatalogModels, getCatalogYears } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const year = Number(searchParams.get("year"));
  const make = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";

  if (type === "years") return NextResponse.json({ values: await getCatalogYears() }, cacheHeaders());
  if (type === "makes") return NextResponse.json({ values: await getCatalogMakes(Number.isFinite(year) ? year : undefined) }, cacheHeaders());
  if (type === "models") {
    if (!Number.isFinite(year) || !make) return NextResponse.json({ values: [] });
    return NextResponse.json({ values: await getCatalogModels(year, make) }, cacheHeaders());
  }
  if (type === "cars") {
    if (!Number.isFinite(year) || !make || !model) return NextResponse.json({ cars: [] });
    return NextResponse.json({ cars: await getCarsForSelection(year, make, model) }, cacheHeaders());
  }
  return NextResponse.json({ message: "Unknown facet type." }, { status: 400 });
}

function cacheHeaders() {
  return { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } };
}
