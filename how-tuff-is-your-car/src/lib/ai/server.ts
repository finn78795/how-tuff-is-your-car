import { searchCatalog } from "@/lib/catalog";
import type { AccessoryDetectionResult, VehicleAnalysisResult } from "./types";
import { AiProviderError, getServerVehicleVisionProvider } from "./server-provider";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCESSORY_CATEGORIES: AccessoryDetectionResult["accessories"][number]["category"][] = [
  "wheels", "aero", "lighting", "suspension", "body", "utility", "other",
];
const requests = new Map<string, { count: number; resetAt: number }>();

type UnknownRecord = Record<string, unknown>;

export async function analyzeVehicleImage(request: Request): Promise<VehicleAnalysisResult> {
  if (process.env.AI_FEATURE_ENABLED === "false") throw new AiRouteError("AI image analysis is currently paused.", 503);

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
  if (image.size > MAX_FILE_SIZE) throw new AiRouteError("Keep the processed image under 4 MB.", 413);

  const bytes = Buffer.from(await image.arrayBuffer());
  const dataUrl = `data:${image.type};base64,${bytes.toString("base64")}`;

  try {
    const analyzed = await provider.analyzeVehicle(dataUrl);
    const validated = validateAnalysis(analyzed.value, analyzed.model);
    const query = `${validated.recognition.make} ${validated.recognition.model}`.trim();
    const matches = query.length > 2 ? await searchCatalog(query, 5) : [];
    validated.matchedCar = matches[0];
    return validated;
  } catch (error) {
    if (error instanceof AiProviderError) throw new AiRouteError(error.message, error.status);
    throw error;
  }
}

function validateAnalysis(value: unknown, model: string): VehicleAnalysisResult {
  const root = isRecord(value) ? value : {};
  const recognition = getRecord(root.recognition);
  const accessoryDetection = getRecord(root.accessoryDetection);
  const styleRating = getRecord(root.styleRating);
  const confidence = clampNumber(recognition.confidence, 0, 1);
  const score = clampNumber(styleRating.score, 0, 10);

  const alternateMatches = Array.isArray(recognition.alternateMatches)
    ? recognition.alternateMatches.slice(0, 3).map((item) => {
        const record = getRecord(item);
        return { label: cleanString(record.label, "Alternative"), confidence: clampNumber(record.confidence, 0, 1) };
      })
    : [];

  const accessories: AccessoryDetectionResult["accessories"] = Array.isArray(accessoryDetection.accessories)
    ? accessoryDetection.accessories.slice(0, 10).map((item) => {
        const record = getRecord(item);
        const rawCategory = typeof record.category === "string" ? record.category : "other";
        const category = ACCESSORY_CATEGORIES.includes(rawCategory as AccessoryDetectionResult["accessories"][number]["category"])
          ? rawCategory as AccessoryDetectionResult["accessories"][number]["category"]
          : "other";
        return {
          name: cleanString(record.name, "Visible modification"),
          category,
          confidence: clampNumber(record.confidence, 0, 1),
        };
      })
    : [];

  return {
    recognition: {
      make: cleanString(recognition.make, "Unknown"),
      model: cleanString(recognition.model, "Vehicle"),
      trim: cleanOptionalString(recognition.trim),
      yearRange: cleanOptionalString(recognition.yearRange),
      confidence,
      alternateMatches,
    },
    accessoryDetection: { accessories },
    styleRating: {
      score,
      verdict: cleanString(styleRating.verdict, "A clean, interesting setup."),
      notes: cleanStringArray(styleRating.notes, 4),
      observations: cleanStringArray(styleRating.observations, 6),
    },
    model,
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : fallback;
}

function cleanOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : undefined;
}

function cleanStringArray(value: unknown, max: number) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, max).map((item) => item.trim().slice(0, 240))
    : [];
}

function clampNumber(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
}

function enforceRateLimit(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt < now) {
    requests.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (current.count >= 5) throw new AiRouteError("Please wait a minute before analyzing another photo.", 429);
  current.count += 1;
}

export class AiRouteError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AiRouteError";
  }
}
