import { NextResponse } from "next/server";
import { getCarBySlug } from "@/lib/catalog";

export async function GET(request: Request) {
  const slugs = (new URL(request.url).searchParams.get("slugs") ?? "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 40);
  const cars = (await Promise.all(slugs.map(getCarBySlug))).filter(Boolean);
  return NextResponse.json({ cars }, { headers: { "Cache-Control": "private, max-age=60" } });
}
