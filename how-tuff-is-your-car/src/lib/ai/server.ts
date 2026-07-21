import { createHash } from "node:crypto";
import { searchCatalog } from "@/lib/catalog";
import { calculateBuildRating, makeAccessoryId } from "@/lib/build-scoring";
import type { AccessoryCategory, FactoryStatus, VehicleAnalysisResult } from "./types";
import { AiProviderError, getServerVehicleVisionProvider } from "./server-provider";

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  "wheels", "tires", "suspension", "aero", "body", "lighting", "exhaust",
  "utility", "offroad", "wrap", "tint", "interior", "other",
];
const FACTORY_STATUSES: FactoryStatus[] = ["aftermarket", "factory", "unknown"];
const requests = new Map<string, { count: number; resetAt: number }>();
const analysisCache = new Map<string, { value: VehicleAnalysisResult; expiresAt: number }>();
const CACHE_TTL = 15 * 60 * 1000;

type UnknownRecord = Record<string, unknown>;

export async function analyzeVehicleImage(request: Request): Promise<VehicleAnalysisResult> {
  if (process.env.AI_FEATURE_ENABLED === "false") throw new AiRouteError("Photo ratings are taking a break right now.", 503);

  const provider = await getServerVehicleVisionProvider();
  try {
    provider.assertConfigured?.();
  } catch (error) {
    if (error instanceof AiProviderError) throw new AiRouteError(error.message, error.status);
    throw error;
  }

  enforceRateLimit(request);
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new AiRouteError("Send the car photo as multipart form data.", 400);
  }
  const image = formData.get("image");
  if (!(image instanceof File)) throw new AiRouteError("Choose a car photo first.", 400);
  if (!ACCEPTED_TYPES.has(image.type)) throw new AiRouteError("Use a JPG, PNG, or WebP image.", 400);
  if (image.size > MAX_FILE_SIZE) throw new AiRouteError("Keep the processed image under 3 MB.", 413);

  const bytes = Buffer.from(await image.arrayBuffer());
  const cacheKey = createHash("sha256").update(bytes).digest("hex");
  const cached = analysisCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) analysisCache.delete(cacheKey);

  const dataUrl = `data:${image.type};base64,${bytes.toString("base64")}`;

  try {
    const analyzed = await provider.analyzeVehicle(dataUrl);
    const validated = validateAnalysis(analyzed.value);
    const query = `${validated.recognition.make} ${validated.recognition.model}`.trim();
    const catalogMatches = query.length > 2 ? await searchCatalog(query, 6) : [];
    const matchedCar = catalogMatches[0];
    const calculated = calculateBuildRating(validated.accessories, matchedCar?.ratings, validated.styleRating.score);

    const result: VehicleAnalysisResult = {
      recognition: validated.recognition,
      accessoryDetection: {
        accessories: calculated.accessories,
        totalImpact: calculated.buildRating.totalImpact,
        ratingImpact: calculated.ratingImpact,
      },
      styleRating: validated.styleRating,
      matchedCar,
      catalogMatches,
      buildRating: calculated.buildRating,
      model: analyzed.model,
      provider: provider.id,
    };

    analysisCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL });
    if (analysisCache.size > 80) pruneCache();
    return result;
  } catch (error) {
    if (error instanceof AiProviderError) throw new AiRouteError(error.message, error.status);
    throw error;
  }
}

function validateAnalysis(value: unknown) {
  const root = isRecord(value) ? value : {};
  const recognition = getRecord(root.recognition);
  const styleRating = getRecord(root.styleRating);
  const rawAccessories = Array.isArray(root.accessories)
    ? root.accessories
    : Array.isArray(getRecord(root.accessoryDetection).accessories)
      ? getRecord(root.accessoryDetection).accessories as unknown[]
      : [];

  const alternateMatches = Array.isArray(recognition.alternateMatches)
    ? recognition.alternateMatches.slice(0, 3).map((item) => {
        const record = getRecord(item);
        return { label: cleanString(record.label, "Alternative"), confidence: clampNumber(record.confidence, 0, 1) };
      })
    : [];

  const accessories = rawAccessories.slice(0, 12).map((item, index) => {
    const record = getRecord(item);
    const category = enumValue(record.category, ACCESSORY_CATEGORIES, "other");
    const factoryStatus = enumValue(record.factoryStatus, FACTORY_STATUSES, "unknown");
    const name = cleanString(record.name, "Visible modification");
    return {
      id: makeAccessoryId(name, index),
      name,
      category,
      factoryStatus,
      confidence: clampNumber(record.confidence, 0, 1),
      quality: clampNumber(record.quality, 0, 10, 6),
      fit: clampNumber(record.fit, 0, 10, 6),
      execution: clampNumber(record.execution, 0, 10, 6),
      condition: clampNumber(record.condition, 0, 10, 6),
      explanation: cleanString(record.explanation, "Visible in the photo, but the exact part is uncertain."),
      ratingImpact: { vibe: 0, tuffness: 0, speed: 0, style: 0, fun: 0 },
      overallImpact: 0,
      enabled: true,
    };
  });

  return {
    recognition: {
      make: cleanString(recognition.make, "Unknown"),
      model: cleanString(recognition.model, "Vehicle"),
      trim: cleanOptionalString(recognition.trim),
      yearRange: cleanOptionalString(recognition.yearRange),
      confidence: clampNumber(recognition.confidence, 0, 1),
      alternateMatches,
    },
    accessories,
    styleRating: {
      score: clampNumber(styleRating.score, 0, 10, 6.5),
      verdict: cleanString(styleRating.verdict, "It has a clear point of view."),
      notes: cleanStringArray(styleRating.notes, 4),
      observations: cleanStringArray(styleRating.observations, 6),
    },
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 220) : fallback;
}

function cleanOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : undefined;
}

function cleanStringArray(value: unknown, max: number) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, max).map((item) => item.trim().slice(0, 260))
    : [];
}

function clampNumber(value: unknown, min: number, max: number, fallback = min) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function enumValue<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

function enforceRateLimit(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt < now) {
    requests.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (current.count >= 4) throw new AiRouteError("Give it a minute before rating another photo.", 429);
  current.count += 1;
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of analysisCache) {
    if (entry.expiresAt <= now || analysisCache.size > 60) analysisCache.delete(key);
  }
}

export class AiRouteError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AiRouteError";
  }
}
