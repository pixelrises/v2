import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest } from "./BaseProviderAdapter";
import { mockProviderAdapter } from "./MockProviderAdapter";

export class CloudCodeProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("cloud-code");
  }

  async generateText(input: ProviderRequest) {
    return mockProviderAdapter.generateText(input);
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest) {
    return mockProviderAdapter.generateJSON<T>(input);
  }
}

export const cloudCodeProviderAdapter = new CloudCodeProviderAdapter();
