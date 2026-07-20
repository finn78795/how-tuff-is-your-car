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
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (provider === "openai") {
    const { openAiVehicleVisionProvider } = await import("./openai-provider");
    return openAiVehicleVisionProvider;
  }
  throw new AiProviderError(`Unknown AI_PROVIDER: ${provider}. Add a provider adapter in src/lib/ai/server-provider.ts.`, 503);
}
