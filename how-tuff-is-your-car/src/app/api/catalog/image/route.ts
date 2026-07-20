import { NextResponse } from "next/server";
import { findVehicleImage } from "@/lib/catalog/images";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  if (!query) return NextResponse.json({ message: "A vehicle query is required." }, { status: 400 });
  const image = await findVehicleImage(query.slice(0, 140));
  return NextResponse.json(image, {
    headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=604800" },
  });
}
