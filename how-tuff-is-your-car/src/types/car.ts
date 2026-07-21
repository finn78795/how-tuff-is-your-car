export type RatingKey = "vibe" | "tuffness" | "speed" | "style" | "fun";
export type CarRatings = Record<RatingKey, number>;
export type RatingConfidence = "high" | "medium" | "estimated";
export type CarSource = "curated" | "epa" | "wikidata" | "classic-catalog" | "nhtsa";

export type CarImageMatchLevel = "exact" | "year-model" | "generation" | "model-family" | "fallback";

export interface CarImageCredit {
  url: string;
  sourceUrl?: string;
  author?: string;
  license?: string;
  fallback?: boolean;
  matchLevel?: CarImageMatchLevel;
  matchLabel?: string;
  queryUsed?: string;
}

export interface CarSpecs {
  bodyStyle?: string;
  drivetrain?: string;
  horsepower?: number;
  torqueLbFt?: number;
  zeroToSixty?: string;
  engine?: string;
  displacementLiters?: number;
  cylinders?: number;
  transmission?: string;
  fuelType?: string;
  combinedMpg?: number;
  weightLb?: number;
  doors?: number;
}

export interface Car {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  drivetrain: string;
  horsepower?: number;
  zeroToSixty?: string;
  tagline: string;
  summary: string;
  tags: string[];
  ratings: CarRatings;
  ratingConfidence: RatingConfidence;
  ratingReasons: Partial<Record<RatingKey, string>>;
  accent: string;
  accent2: string;
  specs: CarSpecs;
  source: CarSource;
  sourceLabel: string;
  sourceId?: string;
  sourceUrl?: string;
  imageQuery: string;
  image?: CarImageCredit;
  productionStart?: number;
  productionEnd?: number;
  generation?: string;
}

export interface CarSearchResult {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  source: CarSource;
  sourceLabel: string;
  ratings: CarRatings;
  ratingConfidence: RatingConfidence;
  imageQuery: string;
}

export interface ClassicModelRange {
  make: string;
  model: string;
  startYear: number;
  endYear: number;
  bodyStyle: string;
  drivetrain?: string;
  country?: string;
  tags?: string[];
  generation?: string;
}
