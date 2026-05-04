import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest } from "./BaseProviderAdapter";
import { mockProviderAdapter } from "./MockProviderAdapter";

export class GeminiProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("gemini");
  }

  async generateText(input: ProviderRequest) {
    return mockProviderAdapter.generateText({
      ...input,
      task: { ...input.task, selectedProvider: "mock", status: "fallback" },
    });
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest) {
    return mockProviderAdapter.generateJSON<T>({
      ...input,
      task: { ...input.task, selectedProvider: "mock", status: "fallback" },
    });
  }

  async validateConfig() {
    return {
      valid: true,
      status: "mock" as const,
      message: "Pixelrises AI General est en adapter + mock tant qu'aucune route backend securisee n'est configuree.",
    };
  }
}

export const geminiMultiAIProviderAdapter = new GeminiProviderAdapter();
