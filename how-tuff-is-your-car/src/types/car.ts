export type RatingKey = "vibe" | "tuffness" | "speed" | "style" | "fun";

export type CarRatings = Record<RatingKey, number>;

export interface Car {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  drivetrain: string;
  horsepower: number;
  zeroToSixty: string;
  tagline: string;
  summary: string;
  tags: string[];
  ratings: CarRatings;
  accent: string;
  accent2: string;
}
