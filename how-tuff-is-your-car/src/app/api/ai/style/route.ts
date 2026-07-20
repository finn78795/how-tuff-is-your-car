import { NextResponse } from "next/server";
import { AiRouteError, analyzeVehicleImage } from "@/lib/ai/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { return NextResponse.json((await analyzeVehicleImage(request)).styleRating); }
  catch (error) { return NextResponse.json({ message: error instanceof AiRouteError ? error.message : "Style rating failed." }, { status: error instanceof AiRouteError ? error.status : 500 }); }
}
