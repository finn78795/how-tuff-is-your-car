import type { CarSearchResult } from "@/types/car";

export interface VehicleRecognitionResult {
  make: string;
  model: string;
  trim?: string;
  yearRange?: string;
  confidence: number;
  alternateMatches?: Array<{ label: string; confidence: number }>;
}

export interface AccessoryDetectionResult {
  accessories: Array<{
    name: string;
    category: "wheels" | "aero" | "lighting" | "suspension" | "body" | "utility" | "other";
    confidence: number;
  }>;
}

export interface StyleRatingResult {
  score: number;
  verdict: string;
  notes: string[];
  observations: string[];
}

export interface VehicleAnalysisResult {
  recognition: VehicleRecognitionResult;
  accessoryDetection: AccessoryDetectionResult;
  styleRating: StyleRatingResult;
  matchedCar?: CarSearchResult;
  model: string;
}

export interface VehicleAiProvider {
  analyzeVehicle(image: File): Promise<VehicleAnalysisResult>;
  recognizeVehicle(image: File): Promise<VehicleRecognitionResult>;
  detectAccessories(image: File): Promise<AccessoryDetectionResult>;
  rateStyle(image: File): Promise<StyleRatingResult>;
}
