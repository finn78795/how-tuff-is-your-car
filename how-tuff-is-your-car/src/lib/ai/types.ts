export interface VehicleRecognitionResult {
  make: string;
  model: string;
  yearRange?: string;
  confidence: number;
}

export interface AccessoryDetectionResult {
  accessories: Array<{ name: string; confidence: number }>;
}

export interface StyleRatingResult {
  score: number;
  verdict: string;
  notes: string[];
}

export interface VehicleAiProvider {
  recognizeVehicle(image: File): Promise<VehicleRecognitionResult>;
  detectAccessories(image: File): Promise<AccessoryDetectionResult>;
  rateStyle(image: File): Promise<StyleRatingResult>;
}
