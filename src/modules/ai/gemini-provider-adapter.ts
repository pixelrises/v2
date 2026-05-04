import {
  createMockGameProject,
  createMockSiteProject,
  createProjectPlan,
  type CreationRequest,
  type GamePlatform,
} from "@/modules/creation-engine";

export type GeminiAdapterMode = "mock" | "backend-ready";

export type GeminiAdapterStatus = {
  provider: "gemini";
  mode: GeminiAdapterMode;
  safeForFrontend: boolean;
  message: string;
};

export class GeminiProviderAdapter {
  readonly status: GeminiAdapterStatus;

  constructor(mode: GeminiAdapterMode = "mock") {
    this.status = {
      provider: "gemini",
      mode,
      safeForFrontend: true,
      message:
        mode === "mock"
          ? "Pixelrises AI est prepare en adapter + mock. Aucune cle API n'est exposee cote frontend."
          : "Pixelrises AI attend une route backend securisee avant tout appel reel.",
    };
  }

  async plan(request: CreationRequest) {
    return createProjectPlan(request);
  }

  async generateSite(input: {
    businessName?: string;
    niche?: string;
    city?: string;
    goal?: string;
    targetAudience?: string;
    tier?: string;
    style?: string;
    offer?: string;
  }) {
    return createMockSiteProject(input);
  }

  async generateGame(input: {
    title?: string;
    platform?: GamePlatform;
    gameType?: string;
    theme?: string;
    targetAudience?: string;
  }) {
    return createMockGameProject(input);
  }
}

export const pixelrisesAIProviderAdapter = new GeminiProviderAdapter("mock");
export const geminiProviderAdapter = pixelrisesAIProviderAdapter;
