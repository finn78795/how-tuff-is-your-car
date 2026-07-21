import type { CarRatings, CarSearchResult, RatingKey } from "@/types/car";

export type AccessoryCategory =
  | "wheels"
  | "tires"
  | "suspension"
  | "aero"
  | "body"
  | "lighting"
  | "exhaust"
  | "utility"
  | "offroad"
  | "wrap"
  | "tint"
  | "interior"
  | "other";

export type FactoryStatus = "aftermarket" | "factory" | "unknown";

export interface VehicleRecognitionResult {
  make: string;
  model: string;
  trim?: string;
  yearRange?: string;
  confidence: number;
  alternateMatches?: Array<{ label: string; confidence: number }>;
}

export interface AccessoryObservation {
  id: string;
  name: string;
  category: AccessoryCategory;
  factoryStatus: FactoryStatus;
  confidence: number;
  quality: number;
  fit: number;
  execution: number;
  condition: number;
  explanation: string;
  ratingImpact: Record<RatingKey, number>;
  overallImpact: number;
  enabled: boolean;
}

export interface AccessoryDetectionResult {
  accessories: AccessoryObservation[];
  totalImpact: number;
  ratingImpact: Record<RatingKey, number>;
}

export interface StyleRatingResult {
  score: number;
  verdict: string;
  notes: string[];
  observations: string[];
}

export interface BuildRatingResult {
  baseScore?: number;
  finalScore: number;
  totalImpact: number;
  baseRatings?: CarRatings;
  adjustedRatings?: CarRatings;
  verdict: string;
}

export interface VehicleAnalysisResult {
  recognition: VehicleRecognitionResult;
  accessoryDetection: AccessoryDetectionResult;
  styleRating: StyleRatingResult;
  matchedCar?: CarSearchResult;
  catalogMatches?: CarSearchResult[];
  buildRating: BuildRatingResult;
  model: string;
  provider: string;
}

export interface VehicleAiProvider {
  analyzeVehicle(image: File): Promise<VehicleAnalysisResult>;
  recognizeVehicle(image: File): Promise<VehicleRecognitionResult>;
  detectAccessories(image: File): Promise<AccessoryDetectionResult>;
  rateStyle(image: File): Promise<StyleRatingResult>;
}
