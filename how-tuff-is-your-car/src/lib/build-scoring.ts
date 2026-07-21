import type { CarRatings, RatingKey } from "@/types/car";
import type { AccessoryCategory, AccessoryObservation, BuildRatingResult, FactoryStatus } from "@/lib/ai/types";
import { getVerdict } from "@/lib/catalog/scoring";

const ratingKeys: RatingKey[] = ["vibe", "tuffness", "speed", "style", "fun"];
const emptyImpact: CarRatings = { vibe: 0, tuffness: 0, speed: 0, style: 0, fun: 0 };

const categoryWeights: Record<AccessoryCategory, CarRatings> = {
  wheels: { vibe: 0.11, tuffness: 0.03, speed: 0.02, style: 0.22, fun: 0.06 },
  tires: { vibe: 0.04, tuffness: 0.14, speed: 0.03, style: 0.06, fun: 0.09 },
  suspension: { vibe: 0.07, tuffness: 0.05, speed: 0.10, style: 0.18, fun: 0.13 },
  aero: { vibe: 0.06, tuffness: 0.05, speed: 0.14, style: 0.15, fun: 0.08 },
  body: { vibe: 0.08, tuffness: 0.05, speed: 0.01, style: 0.20, fun: 0.07 },
  lighting: { vibe: 0.04, tuffness: 0.02, speed: 0, style: 0.10, fun: 0.04 },
  exhaust: { vibe: 0.08, tuffness: 0.07, speed: 0.04, style: 0.04, fun: 0.16 },
  utility: { vibe: 0.04, tuffness: 0.16, speed: -0.03, style: 0.03, fun: 0.09 },
  offroad: { vibe: 0.08, tuffness: 0.23, speed: -0.02, style: 0.07, fun: 0.16 },
  wrap: { vibe: 0.07, tuffness: 0.01, speed: 0, style: 0.20, fun: 0.07 },
  tint: { vibe: 0.04, tuffness: 0.02, speed: 0, style: 0.10, fun: 0.01 },
  interior: { vibe: 0.04, tuffness: 0.01, speed: 0.01, style: 0.10, fun: 0.12 },
  other: { vibe: 0.04, tuffness: 0.03, speed: 0.01, style: 0.07, fun: 0.05 },
};

const overallWeights: CarRatings = { vibe: 0.28, tuffness: 0.22, speed: 0.17, style: 0.20, fun: 0.13 };

export function scoreAccessory(input: Omit<AccessoryObservation, "ratingImpact" | "overallImpact">): AccessoryObservation {
  const qualityAverage = average([input.quality, input.fit, input.execution, input.condition]);
  const executionFactor = clamp((qualityAverage - 4.5) / 5.5, -0.8, 1);
  const confidenceFactor = clamp(input.confidence, 0.25, 1);
  const statusFactor = factoryFactor(input.factoryStatus);
  const activeFactor = input.enabled ? 1 : 0;
  const multiplier = executionFactor * confidenceFactor * statusFactor * activeFactor * 1.75;
  const base = categoryWeights[input.category] ?? categoryWeights.other;

  const ratingImpact = ratingKeys.reduce((result, key) => {
    result[key] = round2(clamp(base[key] * multiplier, -0.45, 0.45));
    return result;
  }, { ...emptyImpact });

  const overallImpact = round2(clamp(ratingKeys.reduce((sum, key) => sum + ratingImpact[key] * overallWeights[key], 0), -0.32, 0.32));
  return { ...input, ratingImpact, overallImpact };
}

export function calculateBuildRating(
  accessories: AccessoryObservation[],
  baseRatings?: CarRatings,
  styleScore = 6.5,
): { accessories: AccessoryObservation[]; ratingImpact: CarRatings; buildRating: BuildRatingResult } {
  const scored = accessories.map((item) => scoreAccessory(item));
  const ratingImpact = scored.reduce((total, item) => {
    for (const key of ratingKeys) total[key] += item.ratingImpact[key];
    return total;
  }, { ...emptyImpact });

  for (const key of ratingKeys) ratingImpact[key] = round2(clamp(ratingImpact[key], -1.2, 1.2));
  const totalImpact = round2(clamp(ratingKeys.reduce((sum, key) => sum + ratingImpact[key] * overallWeights[key], 0), -1.2, 1.2));

  if (baseRatings) {
    const adjustedRatings = ratingKeys.reduce((ratings, key) => {
      ratings[key] = round1(clamp(baseRatings[key] + ratingImpact[key], 0, 10));
      return ratings;
    }, { ...baseRatings });
    const baseScore = overallFromRatings(baseRatings);
    const finalScore = overallFromRatings(adjustedRatings);
    return {
      accessories: scored,
      ratingImpact,
      buildRating: {
        baseScore,
        finalScore,
        totalImpact: round1(finalScore - baseScore),
        baseRatings,
        adjustedRatings,
        verdict: getVerdict(finalScore),
      },
    };
  }

  const finalScore = round1(clamp(styleScore + totalImpact, 0, 10));
  return {
    accessories: scored,
    ratingImpact,
    buildRating: {
      finalScore,
      totalImpact,
      verdict: getVerdict(finalScore),
    },
  };
}

export function makeAccessoryId(name: string, index: number) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "part"}-${index + 1}`;
}

function factoryFactor(status: FactoryStatus) {
  if (status === "factory") return 0;
  if (status === "unknown") return 0.65;
  return 1;
}

function overallFromRatings(ratings: CarRatings) {
  return round1(ratingKeys.reduce((sum, key) => sum + ratings[key] * overallWeights[key], 0));
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + clamp(value, 0, 10), 0) / Math.max(values.length, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
