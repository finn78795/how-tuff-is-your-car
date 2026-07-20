import carData from "@/data/cars.json";
import type { Car, RatingKey } from "@/types/car";

export const cars = carData as Car[];

export const ratingKeys: RatingKey[] = [
  "vibe",
  "tuffness",
  "speed",
  "style",
  "fun",
];

export const ratingLabels: Record<RatingKey, string> = {
  vibe: "Vibe",
  tuffness: "Tuffness",
  speed: "Speed",
  style: "Style",
  fun: "Fun",
};

export function getCarBySlug(slug: string) {
  return cars.find((car) => car.slug === slug);
}

export function getCarLabel(car: Car) {
  return `${car.year} ${car.make} ${car.model} ${car.trim}`;
}

export function getOverallScore(car: Car) {
  const values = Object.values(car.ratings);
  return Number((values.reduce((sum, score) => sum + score, 0) / values.length).toFixed(1));
}

export function getVerdict(score: number) {
  if (score >= 9.3) return "🥶 certified tuff";
  if (score >= 8.5) return "😮‍💨 clean work";
  if (score >= 7.5) return "🔥 lowkey hard";
  if (score >= 6.5) return "🤝 valid";
  if (score >= 5.2) return "😐 mid but movable";
  if (score >= 4) return "😭 kinda cooked";
  return "😭 cooked 🙏";
}

export function getVerdictCopy(score: number) {
  if (score >= 9.3) return "No notes. The car has motion, lore, and elite camera-roll presence.";
  if (score >= 8.5) return "This pulls up and the group chat immediately gets quieter.";
  if (score >= 7.5) return "Not flawless, but absolutely enough aura to post without hesitation.";
  if (score >= 6.5) return "Respectable. A clean spec can carry this into genuinely tuff territory.";
  if (score >= 5.2) return "It gets the job done, but the edit needs to work overtime.";
  if (score >= 4) return "There is potential, but stock form is fighting for its life.";
  return "The reliability may be valid. The aura allegations are not being beaten.";
}

export const makes = [...new Set(cars.map((car) => car.make))].sort();
export const years = [...new Set(cars.map((car) => car.year))].sort((a, b) => b - a);
