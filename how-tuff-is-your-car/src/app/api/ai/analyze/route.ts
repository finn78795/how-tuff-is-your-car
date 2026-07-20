import { NextResponse } from "next/server";
import { AiRouteError, analyzeVehicleImage } from "@/lib/ai/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await analyzeVehicleImage(request));
  } catch (error) {
    if (error instanceof AiRouteError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ message: "The image analyzer ran into an unexpected error." }, { status: 500 });
  }
}
