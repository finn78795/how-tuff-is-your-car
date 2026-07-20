import carData from "@/data/cars.json";
import type { Car } from "@/types/car";
import { calculateRatings } from "./scoring";
import { colorPair } from "./utils";

type SeedCar = Omit<Car, "ratingConfidence" | "ratingReasons" | "specs" | "source" | "sourceLabel" | "imageQuery"> & {
  horsepower?: number;
  zeroToSixty?: string;
};

export const curatedCars: Car[] = (carData as SeedCar[]).map((car) => {
  const scored = calculateRatings({
    year: car.year,
    make: car.make,
    model: car.model,
    bodyStyle: car.bodyStyle,
    drivetrain: car.drivetrain,
    tags: car.tags,
    specs: {
      bodyStyle: car.bodyStyle,
      drivetrain: car.drivetrain,
      horsepower: car.horsepower,
      zeroToSixty: car.zeroToSixty,
    },
    curatedRatings: car.ratings,
  });
  const [accent, accent2] = car.accent && car.accent2 ? [car.accent, car.accent2] : colorPair(`${car.make}-${car.model}`);
  return {
    ...car,
    horsepower: car.horsepower,
    zeroToSixty: car.zeroToSixty,
    accent,
    accent2,
    ratingConfidence: scored.confidence,
    ratingReasons: scored.reasons,
    specs: {
      bodyStyle: car.bodyStyle,
      drivetrain: car.drivetrain,
      horsepower: car.horsepower,
      zeroToSixty: car.zeroToSixty,
    },
    source: "curated",
    sourceLabel: "HTIYC enthusiast notes",
    imageQuery: `${car.year} ${car.make} ${car.model} ${car.trim} car`,
  };
});

export function getCuratedCar(slug: string) {
  return curatedCars.find((car) => car.slug === slug);
}
