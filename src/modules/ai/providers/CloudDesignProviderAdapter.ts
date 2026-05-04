import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest } from "./BaseProviderAdapter";
import { mockProviderAdapter } from "./MockProviderAdapter";

export class CloudDesignProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("cloud-design");
  }

  async generateText(input: ProviderRequest) {
    return mockProviderAdapter.generateText(input);
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest) {
    return mockProviderAdapter.generateJSON<T>(input);
  }
}

export const cloudDesignProviderAdapter = new CloudDesignProviderAdapter();
