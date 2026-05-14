import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest } from "./BaseProviderAdapter";
import { mockProviderAdapter } from "./MockProviderAdapter";

export class VercelGatewayProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("vercel-gateway");
  }

  async generateText(input: ProviderRequest) {
    return mockProviderAdapter.generateText(input);
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest) {
    return mockProviderAdapter.generateJSON<T>(input);
  }

  async validateConfig() {
    return {
      valid: false,
      status: this.status,
      message:
        "Le moteur IA réel doit rester côté serveur. Aucun secret n'est lu dans le frontend.",
    };
  }
}

export const vercelGatewayProviderAdapter = new VercelGatewayProviderAdapter();
