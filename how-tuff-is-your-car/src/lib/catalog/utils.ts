import type { CarRatings, RatingKey } from "@/types/car";

export const ratingKeys: RatingKey[] = ["vibe", "tuffness", "speed", "style", "fun"];

export const ratingLabels: Record<RatingKey, string> = {
  vibe: "Vibe",
  tuffness: "Tuffness",
  speed: "Speed",
  style: "Style",
  fun: "Fun",
};

export function clamp(value: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

export function roundRating(value: number) {
  return Number(clamp(value).toFixed(1));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getOverallScoreFromRatings(ratings: CarRatings) {
  const values = Object.values(ratings);
  return Number((values.reduce((sum, score) => sum + score, 0) / values.length).toFixed(1));
}

export function normalizeDrive(value?: string) {
  const drive = (value ?? "").toLowerCase();
  if (drive.includes("front")) return "FWD";
  if (drive.includes("rear")) return "RWD";
  if (drive.includes("all")) return "AWD";
  if (drive.includes("4-wheel") || drive.includes("four-wheel") || drive.includes("part-time")) return "4WD";
  return value?.trim() || "Unknown";
}

export function inferBodyStyle(vehicleClass?: string, model?: string) {
  const value = `${vehicleClass ?? ""} ${model ?? ""}`.toLowerCase();
  if (value.includes("pickup") || value.includes("truck")) return "Truck";
  if (value.includes("sport utility") || value.includes("suv") || value.includes("utility")) return "SUV";
  if (value.includes("station wagon") || value.includes("wagon") || value.includes("avant")) return "Wagon";
  if (value.includes("van") || value.includes("minivan")) return "Van";
  if (value.includes("two-seater") || value.includes("roadster") || value.includes("convertible")) return "Sports car";
  if (value.includes("compact") || value.includes("subcompact") || value.includes("hatch")) return "Compact";
  return "Car";
}

export function colorPair(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hues = [76, 160, 198, 262, 18, 334, 42, 220];
  const hue = hues[hash % hues.length];
  const hue2 = (hue + 42 + (hash % 38)) % 360;
  return [`hsl(${hue} 82% 62%)`, `hsl(${hue2} 78% 58%)`] as const;
}
