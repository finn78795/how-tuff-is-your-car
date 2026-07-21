export interface ServerVehicleVisionProvider {
  readonly id: string;
  assertConfigured?(): void;
  analyzeVehicle(dataUrl: string): Promise<{ value: unknown; model: string }>;
}

export class AiProviderError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
    this.name = "AiProviderError";
  }
}

export async function getServerVehicleVisionProvider(): Promise<ServerVehicleVisionProvider> {
  const provider = (process.env.AI_PROVIDER || "cloudflare").toLowerCase();
  if (["cloudflare", "workers-ai", "cloudflare-workers-ai"].includes(provider)) {
    const { cloudflareVehicleVisionProvider } = await import("./cloudflare-provider");
    return cloudflareVehicleVisionProvider;
  }
  throw new AiProviderError(`Unknown AI_PROVIDER: ${provider}. Add a provider adapter in src/lib/ai/server-provider.ts.`, 503);
}
