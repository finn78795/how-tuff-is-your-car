import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog";
import { decodeVin } from "@/lib/catalog/nhtsa";

export async function POST(request: Request) {
  let vin = "";
  try {
    const body: unknown = await request.json();
    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      const value = (body as Record<string, unknown>).vin;
      vin = typeof value === "string" ? value : "";
    }
    const decoded = await decodeVin(vin);
    const query = [decoded.modelYear, decoded.make, decoded.model].filter(Boolean).join(" ");
    const matches = query ? await searchCatalog(query, 5) : [];
    return NextResponse.json({ decoded, matches }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "VIN lookup failed." }, { status: 400 });
  }
}
