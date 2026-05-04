import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest } from "./BaseProviderAdapter";
import { mockProviderAdapter } from "./MockProviderAdapter";

export class ClaudeProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("claude");
  }

  async generateText(input: ProviderRequest) {
    return mockProviderAdapter.generateText(input);
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest) {
    return mockProviderAdapter.generateJSON<T>(input);
  }
}

export const claudeProviderAdapter = new ClaudeProviderAdapter();
