import type { Car } from "@/types/car";
import { calculateRatings } from "./scoring";
import { colorPair } from "./utils";

const VPIC_API = "https://vpic.nhtsa.dot.gov/api/vehicles";

export interface VinDecodeResult {
  vin: string;
  make?: string;
  model?: string;
  modelYear?: number;
  trim?: string;
  bodyClass?: string;
  driveType?: string;
  engine?: string;
  horsepower?: number;
  displacementLiters?: number;
  cylinders?: number;
  transmission?: string;
  fuelType?: string;
  errorText?: string;
}

function encodeNhtsaSlug(year: number, make: string, model: string) {
  const payload = Buffer.from(JSON.stringify({ year, make, model }), "utf8").toString("base64url");
  return `nhtsa-${payload}`;
}

function decodeNhtsaSlug(slug: string): { year: number; make: string; model: string } | undefined {
  if (!slug.startsWith("nhtsa-")) return undefined;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(slug.slice(6), "base64url").toString("utf8"));
    if (!isRecord(decoded)) return undefined;
    const year = Number(decoded.year);
    const make = typeof decoded.make === "string" ? decoded.make : "";
    const model = typeof decoded.model === "string" ? decoded.model : "";
    return Number.isInteger(year) && make && model ? { year, make, model } : undefined;
  } catch {
    return undefined;
  }
}

export async function getNhtsaModels(year: number, make: string) {
  if (year < 1996 || !make.trim()) return [];
  try {
    const response = await fetch(`${VPIC_API}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`, {
      headers: { "User-Agent": "HowTuffIsYourCar/2.0" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    const results = isRecord(payload) && Array.isArray(payload.Results) ? payload.Results : [];
    return [...new Set(results
      .map((item) => isRecord(item) ? item.Model_Name : undefined)
      .filter((value): value is string => typeof value === "string" && Boolean(value.trim())))]
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("NHTSA model lookup unavailable", error);
    return [];
  }
}

export function createNhtsaModelCar(year: number, make: string, model: string): Car {
  const bodyStyle = inferNhtsaBodyStyle(model);
  const tags = ["manufacturer-listed", bodyStyle.toLowerCase()];
  const scored = calculateRatings({ year, make, model, bodyStyle, tags });
  const [accent, accent2] = colorPair(`${make}-${model}`);

  return {
    id: encodeNhtsaSlug(year, make, model),
    slug: encodeNhtsaSlug(year, make, model),
    year,
    make,
    model,
    trim: "Model listing",
    bodyStyle,
    drivetrain: "Varies",
    tagline: "A manufacturer-listed model with a transparent estimated score.",
    summary: `NHTSA lists the ${year} ${make} ${model} in its vehicle-product information catalog. Exact engines, trims, body styles, and performance vary, so this page keeps the rating broad and clearly marked as estimated.`,
    tags,
    ratings: scored.ratings,
    ratingConfidence: "estimated",
    ratingReasons: scored.reasons,
    accent,
    accent2,
    specs: { bodyStyle, drivetrain: "Varies" },
    source: "nhtsa",
    sourceLabel: "NHTSA vPIC",
    sourceUrl: "https://vpic.nhtsa.dot.gov/",
    imageQuery: `${year} ${make} ${model} automobile`,
  };
}

export function getNhtsaCarBySlug(slug: string) {
  const decoded = decodeNhtsaSlug(slug);
  return decoded ? createNhtsaModelCar(decoded.year, decoded.make, decoded.model) : undefined;
}

export async function decodeVin(vinInput: string): Promise<VinDecodeResult> {
  const vin = vinInput.trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new Error("Enter a valid 17-character VIN. VINs do not use I, O, or Q.");

  const response = await fetch(`${VPIC_API}/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`, {
    headers: { "User-Agent": "HowTuffIsYourCar/2.0" },
    next: { revalidate: 60 * 60 * 24 * 365 },
  });
  if (!response.ok) throw new Error("NHTSA could not decode that VIN right now.");
  const payload: unknown = await response.json();
  const first = isRecord(payload) && Array.isArray(payload.Results) ? payload.Results[0] : undefined;
  const result = isRecord(first) ? first : {};

  return {
    vin,
    make: clean(result.Make),
    model: clean(result.Model),
    modelYear: toNumber(result.ModelYear),
    trim: clean(result.Trim) || clean(result.Series),
    bodyClass: clean(result.BodyClass),
    driveType: clean(result.DriveType),
    engine: [clean(result.DisplacementL) && `${clean(result.DisplacementL)}L`, clean(result.EngineConfiguration), clean(result.EngineModel)].filter(Boolean).join(" · ") || undefined,
    horsepower: toNumber(result.EngineHP),
    displacementLiters: toNumber(result.DisplacementL),
    cylinders: toNumber(result.EngineCylinders),
    transmission: clean(result.TransmissionStyle),
    fuelType: clean(result.FuelTypePrimary),
    errorText: clean(result.ErrorText),
  };
}

function inferNhtsaBodyStyle(model: string) {
  const value = model.toLowerCase();
  if (/pickup|truck|f-?\d{3}|silverado|sierra|tacoma|tundra|ram/.test(value)) return "Truck";
  if (/van|transit|sprinter|promaster/.test(value)) return "Van";
  if (/suv|bronco|wrangler|tahoe|suburban|expedition|4runner/.test(value)) return "SUV";
  return "Passenger vehicle";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}
