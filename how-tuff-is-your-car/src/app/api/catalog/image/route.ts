import { NextResponse } from "next/server";
import { findVehicleImage } from "@/lib/catalog/images";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make")?.trim();
  const model = searchParams.get("model")?.trim();
  const query = searchParams.get("query")?.trim();

  if ((!make || !model) && !query) {
    return NextResponse.json({ message: "A vehicle make and model are required." }, { status: 400 });
  }

  const image = make && model
    ? await findVehicleImage({
        year: numberOrUndefined(searchParams.get("year")),
        make: make.slice(0, 80),
        model: model.slice(0, 100),
        trim: searchParams.get("trim")?.slice(0, 100),
        generation: searchParams.get("generation")?.slice(0, 100),
        imageQuery: query?.slice(0, 140),
      })
    : await findVehicleImage(query!.slice(0, 140));

  return NextResponse.json(image, {
    headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=604800" },
  });
}

function numberOrUndefined(value: string | null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 1800 && number < 2200 ? number : undefined;
}
