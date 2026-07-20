import type { Car } from "@/types/car";
import { curatedCars } from "./curated";
import { getVerdict, getVerdictCopy } from "./scoring";
import { getOverallScoreFromRatings, ratingKeys, ratingLabels } from "./utils";

export { curatedCars, getVerdict, getVerdictCopy, getOverallScoreFromRatings, ratingKeys, ratingLabels };

export function getCarLabel(car: Pick<Car, "year" | "make" | "model" | "trim">) {
  const trim = car.trim && car.trim !== "Model range" ? ` ${car.trim}` : "";
  return `${car.year} ${car.make} ${car.model}${trim}`;
}

export function getOverallScore(car: Pick<Car, "ratings">) {
  return getOverallScoreFromRatings(car.ratings);
}
