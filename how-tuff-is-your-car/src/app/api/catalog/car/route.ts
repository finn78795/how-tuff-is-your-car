import { NextResponse } from "next/server";
import { getCarBySlug } from "@/lib/catalog";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ message: "A car slug is required." }, { status: 400 });
  const car = await getCarBySlug(slug);
  if (!car) return NextResponse.json({ message: "Car not found." }, { status: 404 });
  return NextResponse.json({ car }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
