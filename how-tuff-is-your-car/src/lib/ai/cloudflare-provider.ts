import type { AccessoryCategory, FactoryStatus } from "./types";
import { AiProviderError, type ServerVehicleVisionProvider } from "./server-provider";

const ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  "wheels", "tires", "suspension", "aero", "body", "lighting", "exhaust",
  "utility", "offroad", "wrap", "tint", "interior", "other",
];
const FACTORY_STATUSES: FactoryStatus[] = ["aftermarket", "factory", "unknown"];

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["recognition", "accessories", "styleRating"],
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
    accessories: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "factoryStatus", "confidence", "quality", "fit", "execution", "condition", "explanation"],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: ACCESSORY_CATEGORIES },
          factoryStatus: { type: "string", enum: FACTORY_STATUSES },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          quality: { type: "number", minimum: 0, maximum: 10 },
          fit: { type: "number", minimum: 0, maximum: 10 },
          execution: { type: "number", minimum: 0, maximum: 10 },
          condition: { type: "number", minimum: 0, maximum: 10 },
          explanation: { type: "string" },
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

const systemPrompt = `You are helping with a small car-enthusiast website. Analyze only what is visible in the supplied vehicle photo. Be careful, specific, and conversational. Never pretend an exact trim or year is certain when it is not.`;

const userPrompt = `Identify the most likely make, model, broad year range, and trim. Then list visible exterior or visible-interior accessories and modifications.

For every accessory:
- decide whether it looks aftermarket, factory, or uncertain
- score visible quality, how well it fits this particular car, execution, and condition from 0 to 10
- explain the visual evidence in one short sentence

Accessories can include wheels, tires, suspension/ride height, aero, body work, lighting, exhaust tips, roof or cargo equipment, off-road equipment, wraps, tint, and visible interior additions. Do not invent performance parts that cannot be seen. Do not read or repeat license plate text. Do not infer the owner, location, demographics, or personal information.

Give a calm 0–10 visual style score. Avoid forced slang and marketing language. Return only the requested structured JSON.`;

class CloudflareVehicleVisionProvider implements ServerVehicleVisionProvider {
  readonly id = "cloudflare-workers-ai";

  assertConfigured() {
    const missing = [
      !process.env.CLOUDFLARE_ACCOUNT_ID && "CLOUDFLARE_ACCOUNT_ID",
      !process.env.CLOUDFLARE_API_TOKEN && "CLOUDFLARE_API_TOKEN",
    ].filter(Boolean);
    if (missing.length) {
      throw new AiProviderError(`Photo ratings are ready, but ${missing.join(" and ")} ${missing.length > 1 ? "have" : "has"} not been added in Vercel yet.`, 503);
    }
  }

  async analyzeVehicle(dataUrl: string) {
    this.assertConfigured();
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    const token = process.env.CLOUDFLARE_API_TOKEN!;
    const model = process.env.CLOUDFLARE_VISION_MODEL || "@cf/meta/llama-3.2-11b-vision-instruct";
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`;

    const requestBody = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      image: dataUrl,
      response_format: { type: "json_schema", json_schema: responseSchema },
      temperature: 0.15,
      max_tokens: 1500,
    };

    let response = await callCloudflare(endpoint, token, requestBody);
    let payload = await readPayload(response);

    // JSON mode can occasionally fail on a complicated image. A strict JSON-only
    // prompt is a useful second attempt without changing providers or billing.
    if (!response.ok && response.status === 400 && providerMessage(payload).toLowerCase().includes("json mode")) {
      const fallbackBody = { ...requestBody, response_format: undefined };
      response = await callCloudflare(endpoint, token, fallbackBody);
      payload = await readPayload(response);
    }

    if (!response.ok || !isRecord(payload) || payload.success === false) {
      const message = providerMessage(payload);
      const lower = message.toLowerCase();
      if (lower.includes("agree") || lower.includes("license")) {
        throw new AiProviderError("Cloudflare needs the Llama vision license accepted once in the Workers AI dashboard before photo ratings can run.", 503);
      }
      if (lower.includes("neuron") || lower.includes("quota") || response.status === 429) {
        throw new AiProviderError("Today’s free photo-rating allowance has been used up. It resets automatically at 00:00 UTC.", 429);
      }
      if (response.status === 401 || response.status === 403) {
        throw new AiProviderError("Cloudflare rejected the Workers AI credentials. Check the Account ID and API token permissions.", 503);
      }
      throw new AiProviderError(message ? `Cloudflare: ${message}` : "The photo model could not analyze this image.", response.status >= 500 ? 502 : 400);
    }

    const value = extractResult(payload);
    return { value, model };
  }
}

async function callCloudflare(endpoint: string, token: string, body: unknown) {
  return fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function readPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

function extractResult(payload: unknown): unknown {
  if (!isRecord(payload)) throw new AiProviderError("The photo model returned an empty response.");
  const result = payload.result;
  if (isRecord(result) && "response" in result) {
    const response = result.response;
    if (typeof response === "string") return parseModelJson(response);
    return response;
  }
  if (typeof result === "string") return parseModelJson(result);
  if (isRecord(result)) return result;
  throw new AiProviderError("The photo model returned an empty response.");
}

function parseModelJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(cleaned) as unknown; } catch { /* try the first complete-looking object */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)) as unknown; } catch { /* handled below */ }
  }
  throw new AiProviderError("The photo model returned incomplete structured data. Try a clearer crop.");
}

function providerMessage(payload: unknown) {
  if (!isRecord(payload)) return "";
  if (typeof payload.message === "string") return payload.message;
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  for (const error of errors) {
    if (isRecord(error) && typeof error.message === "string") return error.message;
  }
  if (isRecord(payload.error) && typeof payload.error.message === "string") return payload.error.message;
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const cloudflareVehicleVisionProvider: ServerVehicleVisionProvider = new CloudflareVehicleVisionProvider();
