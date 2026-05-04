import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest } from "./BaseProviderAdapter";
import { mockProviderAdapter } from "./MockProviderAdapter";

export class MistralProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("mistral");
  }

  async generateText(input: ProviderRequest) {
    return mockProviderAdapter.generateText(input);
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest) {
    return mockProviderAdapter.generateJSON<T>(input);
  }
}

export const mistralProviderAdapter = new MistralProviderAdapter();
