import type { AccessoryDetectionResult, StyleRatingResult, VehicleAiProvider, VehicleAnalysisResult, VehicleRecognitionResult } from "./types";

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024;

class ApiVehicleAiProvider implements VehicleAiProvider {
  private async analyze(image: File): Promise<VehicleAnalysisResult> {
    const optimized = await optimizeVehicleImage(image);
    const formData = new FormData();
    formData.append("image", optimized);
    const response = await fetch("/api/ai/analyze", { method: "POST", body: formData });
    const body = await response.json().catch(() => ({})) as { message?: string } & Partial<VehicleAnalysisResult>;
    if (!response.ok) throw new Error(body.message ?? "The image analyzer is unavailable right now.");
    return body as VehicleAnalysisResult;
  }

  analyzeVehicle(image: File) {
    return this.analyze(image);
  }

  async recognizeVehicle(image: File): Promise<VehicleRecognitionResult> {
    return (await this.analyze(image)).recognition;
  }

  async detectAccessories(image: File): Promise<AccessoryDetectionResult> {
    return (await this.analyze(image)).accessoryDetection;
  }

  async rateStyle(image: File): Promise<StyleRatingResult> {
    return (await this.analyze(image)).styleRating;
  }
}

async function optimizeVehicleImage(file: File) {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Choose an image under 20 MB.");
  if (typeof document === "undefined") return file;

  try {
    const image = await loadImage(file);
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    const firstScale = Math.min(1, 1600 / longest);
    let output = await renderJpeg(image, firstScale, 0.84, file.name);
    if (output.size > MAX_UPLOAD_BYTES) output = await renderJpeg(image, Math.min(firstScale, 1280 / longest), 0.72, file.name);
    if (output.size > MAX_UPLOAD_BYTES) output = await renderJpeg(image, Math.min(firstScale, 1024 / longest), 0.62, file.name);
    if (output.size > MAX_UPLOAD_BYTES) throw new Error("The photo is still too large after resizing. Try a screenshot or a smaller crop.");
    return output;
  } catch (error) {
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw error instanceof Error ? error : new Error("The photo could not be resized.");
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The selected image could not be read."));
    };
    image.src = url;
  });
}

function renderJpeg(image: HTMLImageElement, scale: number, quality: number, originalName: string) {
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.drawImage(image, 0, 0, width, height);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The photo could not be resized."));
        return;
      }
      const baseName = originalName.replace(/\.[^.]+$/, "") || "car-photo";
      resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() }));
    }, "image/jpeg", quality);
  });
}

export const vehicleAiProvider: VehicleAiProvider = new ApiVehicleAiProvider();
