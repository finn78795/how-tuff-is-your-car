import type { CarRatings, CarSpecs, RatingConfidence, RatingKey } from "@/types/car";
import { clamp, roundRating } from "./utils";

interface ScoreInput {
  year: number;
  make: string;
  model: string;
  bodyStyle: string;
  drivetrain?: string;
  tags?: string[];
  specs?: CarSpecs;
  curatedRatings?: CarRatings;
}

const enthusiastWords = [
  "gt", "gti", "type r", "sti", "wrx", "amg", "m3", "m5", "rs", "srt", "hellcat",
  "cobra", "shelby", "ss", "z06", "zr1", "turbo", "rally", "sport", "performance",
  "roadster", "miata", "911", "supra", "skyline", "rx-7", "gto", "trans am", "countach",
];


const iconicModelNames = [
  "charger", "challenger", "superbird", "road runner", "barracuda", "gt40", "mustang", "bronco",
  "corvette", "camaro", "chevelle", "gto", "trans am", "grand national", "cobra", "gt500",
  "911", "959", "countach", "miura", "dino 246", "e-type", "xkss", "db5", "esprit",
  "stratos", "a110", "2000gt", "240z", "skyline", "rx-7", "land cruiser", "niva",
  "range rover", "defender", "g-class", "m1", "dmc-12", "p1800", "citroën ds",
];

const heritageTagWeights: Record<string, number> = {
  icon: 1.5,
  "poster car": 1.45,
  racing: 1.2,
  homologation: 1.2,
  muscle: 1.0,
  "pony car": 0.8,
  v12: 0.9,
  rally: 0.85,
  "sports car": 0.65,
  design: 0.65,
  "driver's car": 0.6,
  "off-road": 0.55,
  durable: 0.35,
  classic: 0.15,
};

function heritageScore(make: string, model: string, tags: string[] = []) {
  const haystack = `${make} ${model}`.toLowerCase();
  const iconic = iconicModelNames.some((name) => haystack.includes(name)) ? 1.35 : 0;
  const tagScore = tags.reduce((sum, tag) => sum + (heritageTagWeights[tag.toLowerCase()] ?? 0), 0);
  return { iconic, heritage: clamp(tagScore, 0, 2.2) };
}

function textScore(make: string, model: string, tags: string[] = []) {
  const haystack = `${make} ${model} ${tags.join(" ")}`.toLowerCase();
  return enthusiastWords.reduce((score, word) => score + (haystack.includes(word) ? 0.22 : 0), 0);
}

function bodyScores(bodyStyle: string) {
  const body = bodyStyle.toLowerCase();
  if (body.includes("sports") || body.includes("roadster")) return { tuff: 0.4, speed: 1.5, style: 1.2, fun: 1.8 };
  if (body.includes("coupe") || body.includes("grand tourer")) return { tuff: 0.7, speed: 0.9, style: 1.2, fun: 1.0 };
  if (body.includes("truck")) return { tuff: 1.7, speed: -0.4, style: 0.2, fun: 0.8 };
  if (body.includes("suv")) return { tuff: 1.5, speed: -0.2, style: 0.4, fun: 0.8 };
  if (body.includes("wagon")) return { tuff: 0.5, speed: 0.2, style: 0.8, fun: 0.6 };
  if (body.includes("hatch")) return { tuff: 0.1, speed: 0.2, style: 0.3, fun: 0.8 };
  if (body.includes("micro")) return { tuff: -0.6, speed: -1.6, style: 0.8, fun: 1.1 };
  if (body.includes("van")) return { tuff: 0.7, speed: -0.8, style: -0.1, fun: 0.5 };
  return { tuff: 0.2, speed: 0, style: 0.1, fun: 0.2 };
}

function ageCharacter(year: number) {
  if (year <= 1979) return 1.25;
  if (year <= 1999) return 0.9;
  if (year <= 2009) return 0.45;
  return 0;
}

function performanceScore(specs: CarSpecs = {}) {
  let value = 0;
  if (specs.horsepower) value += clamp((specs.horsepower - 120) / 95, -0.6, 3.4);
  else {
    if (specs.cylinders) value += clamp((specs.cylinders - 4) * 0.35, -0.3, 1.5);
    if (specs.displacementLiters) value += clamp((specs.displacementLiters - 1.8) * 0.32, -0.3, 1.3);
    if ((specs.engine ?? "").toLowerCase().includes("turbo")) value += 0.65;
    if ((specs.engine ?? "").toLowerCase().includes("supercharg")) value += 0.8;
  }
  if (specs.zeroToSixty) {
    const seconds = Number.parseFloat(specs.zeroToSixty);
    if (Number.isFinite(seconds)) value += clamp((8.5 - seconds) * 0.45, -0.8, 2.8);
  }
  return value;
}

export function calculateRatings(input: ScoreInput): {
  ratings: CarRatings;
  confidence: RatingConfidence;
  reasons: Partial<Record<RatingKey, string>>;
} {
  if (input.curatedRatings) {
    return {
      ratings: input.curatedRatings,
      confidence: "high",
      reasons: {
        vibe: "Curated from the car's reputation, design, and enthusiast appeal.",
        tuffness: "Balances capability, durability, presence, and the way the car carries itself.",
        speed: "Uses known performance rather than assuming horsepower tells the whole story.",
        style: "Looks at proportions, originality, and how well the design has aged.",
        fun: "Rewards driver involvement, character, sound, and memorable experiences.",
      },
    };
  }

  const specs = input.specs ?? {};
  const body = bodyScores(input.bodyStyle);
  const character = ageCharacter(input.year);
  const enthusiast = textScore(input.make, input.model, input.tags);
  const performance = performanceScore(specs);
  const legacy = heritageScore(input.make, input.model, input.tags);
  const drive = (input.drivetrain ?? specs.drivetrain ?? "").toUpperCase();
  const offRoad = /4WD|AWD/.test(drive) && /SUV|Truck|Ute/i.test(input.bodyStyle) ? 0.8 : 0;
  const manual = (specs.transmission ?? "").toLowerCase().includes("manual") ? 0.55 : 0;
  const efficient = specs.combinedMpg ? clamp((specs.combinedMpg - 22) / 25, -0.25, 0.55) : 0;

  const speed = roundRating(4.8 + body.speed + performance + enthusiast * 0.35 + legacy.heritage * 0.2 + legacy.iconic * 0.28);
  const tuffness = roundRating(5.4 + body.tuff + offRoad + character * 0.45 + performance * 0.18 + enthusiast * 0.3 + legacy.heritage * 0.5 + legacy.iconic * 0.8);
  const style = roundRating(5.7 + body.style + character * 0.75 + enthusiast * 0.45 + legacy.heritage * 0.45 + legacy.iconic * 0.65);
  const fun = roundRating(5.2 + body.fun + manual + performance * 0.38 + character * 0.35 + enthusiast * 0.55 + legacy.heritage * 0.42 + legacy.iconic * 0.62);
  const vibe = roundRating((tuffness * 0.27 + speed * 0.14 + style * 0.31 + fun * 0.28) + efficient * 0.1 + character * 0.12 + legacy.heritage * 0.16 + legacy.iconic * 0.34);

  const detailCount = [specs.horsepower, specs.zeroToSixty, specs.cylinders, specs.displacementLiters, specs.transmission, specs.drivetrain].filter(Boolean).length;
  const confidence: RatingConfidence = detailCount >= 4 ? "medium" : "estimated";

  return {
    ratings: { vibe, tuffness, speed, style, fun },
    confidence,
    reasons: {
      vibe: legacy.iconic > 0 ? "A weighted blend of design, capability, fun, and the model's lasting enthusiast reputation." : "A weighted blend of style, character, capability, and fun.",
      tuffness: offRoad > 0 ? "Four-wheel-drive capability and utility add to its toughness score." : "Estimated from body style, drivetrain, age, and enthusiast character.",
      speed: specs.horsepower || specs.zeroToSixty ? "Estimated from available performance specifications." : "Estimated from engine, drivetrain, vehicle class, and model reputation.",
      style: input.year < 1990 ? "Classic proportions and period character are part of the score." : "Estimated from body style, proportions, and model identity.",
      fun: manual > 0 ? "A manual transmission and driver-focused layout help here." : "Estimated from performance, layout, character, and intended use.",
    },
  };
}

export function getVerdict(score: number) {
  if (score >= 9.2) return "Seriously tuff";
  if (score >= 8.4) return "Certified tuff";
  if (score >= 7.5) return "Clean";
  if (score >= 6.5) return "Solid";
  if (score >= 5.4) return "Has potential";
  if (score >= 4.2) return "An acquired taste";
  return "Not its strongest showing";
}

export function getVerdictCopy(score: number) {
  if (score >= 9.2) return "A standout car with real presence, character, and a strong enthusiast case.";
  if (score >= 8.4) return "Distinctive, memorable, and easy to appreciate even with a few compromises.";
  if (score >= 7.5) return "A genuinely appealing car that gets more right than wrong.";
  if (score >= 6.5) return "A respectable choice with enough personality to keep things interesting.";
  if (score >= 5.4) return "The right trim, color, or setup could make a noticeable difference.";
  if (score >= 4.2) return "There is something to like, but the appeal is fairly specific.";
  return "Useful or interesting in its own way, but the fun score needs some help.";
}
