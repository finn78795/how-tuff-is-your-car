import type { AccessoryDetectionResult } from "./types";
import { AiProviderError, type ServerVehicleVisionProvider } from "./server-provider";

const ACCESSORY_CATEGORIES: AccessoryDetectionResult["accessories"][number]["category"][] = [
  "wheels", "aero", "lighting", "suspension", "body", "utility", "other",
];

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["recognition", "accessoryDetection", "styleRating"],
  properties: {
    recognition: {
      type: "object",
      additionalProperties: false,
      required: ["make", "model", "trim", "yearRange", "confidence", "alternateMatches"],
      properties: {
        make: { type: "string" },
        model: { type: "string" },
        trim: { type: "string" },
        yearRange: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        alternateMatches: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["label", "confidence"],
            properties: {
              label: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
      },
    },
    accessoryDetection: {
      type: "object",
      additionalProperties: false,
      required: ["accessories"],
      properties: {
        accessories: {
          type: "array",
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "category", "confidence"],
            properties: {
              name: { type: "string" },
              category: { type: "string", enum: ACCESSORY_CATEGORIES },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
      },
    },
    styleRating: {
      type: "object",
      additionalProperties: false,
      required: ["score", "verdict", "notes", "observations"],
      properties: {
        score: { type: "number", minimum: 0, maximum: 10 },
        verdict: { type: "string" },
        notes: { type: "array", maxItems: 4, items: { type: "string" } },
        observations: { type: "array", maxItems: 6, items: { type: "string" } },
      },
    },
  },
} as const;

const prompt = `Analyze this vehicle photo for a casual car-enthusiast website. Be cautious and admit uncertainty.

Identify the most likely make, model, broad year range, and trim only when visible evidence supports them. List only accessories or modifications that can actually be seen. Give a restrained 0–10 style opinion based on the visible car setup, condition, color, wheels, stance, and photo composition.

Do not infer the owner, exact location, license-plate details, demographics, or other personal information. Do not claim certainty when generations or trims look similar. Keep the wording calm, useful, and lightly conversational rather than slang-heavy.`;

class OpenAiVehicleVisionProvider implements ServerVehicleVisionProvider {
  readonly id = "openai";

  assertConfigured() {
    if (!process.env.OPENAI_API_KEY) {
      throw new AiProviderError("AI image analysis is ready, but OPENAI_API_KEY has not been added in Vercel yet.", 503);
    }
  }

  async analyzeVehicle(dataUrl: string) {
    this.assertConfigured();
    const apiKey = process.env.OPENAI_API_KEY!;
    const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl, detail: "high" },
          ],
        }],
        text: {
          format: {
            type: "json_schema",
            name: "vehicle_photo_analysis",
            strict: true,
            schema: responseSchema,
          },
        },
        temperature: 0.2,
        max_output_tokens: 1200,
      }),
    });

    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = getNestedString(payload, ["error", "message"]);
      throw new AiProviderError(providerMessage ? `OpenAI: ${providerMessage}` : "The AI model could not analyze this photo.", response.status >= 500 ? 502 : 400);
    }

    const text = extractOutputText(payload);
    return { value: parseModelJson(text), model };
  }
}

function extractOutputText(payload: unknown) {
  if (!isRecord(payload)) throw new AiProviderError("The AI response was empty. Try the photo again.");
  if (typeof payload.output_text === "string") return payload.output_text;

  const chunks: string[] = [];
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
    }
  }
  if (!chunks.length) throw new AiProviderError("The AI response was empty. Try the photo again.");
  return chunks.join("\n");
}

function parseModelJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)) as unknown; } catch { /* continue below */ }
    }
    throw new AiProviderError("The AI response was incomplete. Try the photo again.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedString(value: unknown, path: string[]) {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

export const openAiVehicleVisionProvider: ServerVehicleVisionProvider = new OpenAiVehicleVisionProvider();
