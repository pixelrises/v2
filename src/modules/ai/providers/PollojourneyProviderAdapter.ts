import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest, type ProviderResponse } from "./BaseProviderAdapter";

const creatorImageNotice = {
  status: "server-only",
  provider: "pollojourney",
  model: "pollojourney-v7-image",
  message:
    "Pollojourney est prepare pour Creator AI via Edge Function serveur. Aucune cle Pollo n'est appelee ni exposee cote frontend.",
  allowedUseCases: [
    "image premium",
    "publicite produit",
    "avatar ou visuel campagne",
    "outpainting",
    "upscale",
    "multi-image blending",
  ],
};

export class PollojourneyProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("pollojourney");
  }

  async generateText(input: ProviderRequest): Promise<ProviderResponse<string>> {
    const startedAt = Date.now();
    return {
      providerId: this.providerId,
      model: this.defaultModel,
      success: false,
      data: undefined,
      raw: creatorImageNotice,
      error: "Pollojourney est server-only: utilisez l'Edge Function Creator AI avec POLLO_API_KEY configure.",
      durationMs: Date.now() - startedAt,
      estimatedTokens: Math.ceil(input.prompt.length / 4),
      estimatedCost: this.estimateCost(input),
    };
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest): Promise<ProviderResponse<T>> {
    const startedAt = Date.now();
    return {
      providerId: this.providerId,
      model: this.defaultModel,
      success: false,
      data: creatorImageNotice as T,
      raw: creatorImageNotice,
      error: "Pollojourney pret cote serveur, generation reelle a lancer uniquement apres validation utilisateur.",
      durationMs: Date.now() - startedAt,
      estimatedTokens: Math.ceil(input.prompt.length / 4),
      estimatedCost: this.estimateCost(input),
    };
  }

  estimateCost(input: ProviderRequest) {
    const baseCredits = input.task.type === "creator_premium_image" ? 10 : 8;
    const promptWeight = Math.max(1, Math.ceil(input.prompt.length / 700));
    return Number(((baseCredits * promptWeight) / 100).toFixed(4));
  }
}

export const pollojourneyProviderAdapter = new PollojourneyProviderAdapter();
