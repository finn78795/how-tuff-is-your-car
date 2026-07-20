import type {
  AccessoryDetectionResult,
  StyleRatingResult,
  VehicleAiProvider,
  VehicleRecognitionResult,
} from "./types";

class ApiVehicleAiProvider implements VehicleAiProvider {
  private async post<T>(endpoint: string, image: File): Promise<T> {
    const formData = new FormData();
    formData.append("image", image);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "AI provider is not connected yet.");
    }

    return response.json() as Promise<T>;
  }

  recognizeVehicle(image: File) {
    return this.post<VehicleRecognitionResult>("/api/ai/recognize", image);
  }

  detectAccessories(image: File) {
    return this.post<AccessoryDetectionResult>("/api/ai/accessories", image);
  }

  rateStyle(image: File) {
    return this.post<StyleRatingResult>("/api/ai/style", image);
  }
}

export const vehicleAiProvider: VehicleAiProvider = new ApiVehicleAiProvider();
