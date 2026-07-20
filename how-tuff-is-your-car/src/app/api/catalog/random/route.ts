import { NextResponse } from "next/server";
import { getRandomCar } from "@/lib/catalog";

export async function GET() {
  const car = getRandomCar();
  if (!car) return NextResponse.json({ message: "No random car is available." }, { status: 404 });
  return NextResponse.json({ slug: car.slug }, { headers: { "Cache-Control": "no-store" } });
}
