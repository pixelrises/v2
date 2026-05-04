import {
  createDefaultAgentProject,
  createMockGameProject,
  createMockSiteProject,
  createProjectPlan,
  type GamePlatform,
} from "@/modules/creation-engine";
import { BaseProviderAdapter, type ProviderJSONRequest, type ProviderRequest, type ProviderResponse } from "./BaseProviderAdapter";

const extractString = (input: Record<string, unknown> | undefined, key: string, fallback: string) => {
  const value = input?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
};

export class MockProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("mock");
  }

  async generateText(input: ProviderRequest): Promise<ProviderResponse<string>> {
    const startedAt = Date.now();
    const message = `Mock Pixelrises AI response for ${input.task.type}: ${input.task.description}`;
    return {
      providerId: this.providerId,
      model: this.defaultModel,
      success: true,
      data: message,
      raw: { mock: true, taskType: input.task.type },
      durationMs: Date.now() - startedAt,
      estimatedTokens: Math.ceil(input.prompt.length / 4),
      estimatedCost: 0,
    };
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest): Promise<ProviderResponse<T>> {
    const startedAt = Date.now();
    const taskInput = input.task.input;
    const prompt = input.prompt || extractString(taskInput, "prompt", "Pixelrises mock generation");

    let data: unknown;

    if (input.task.type.startsWith("site_") || input.task.type === "brief_analysis" || input.task.type === "final_fusion") {
      data = createMockSiteProject({
        businessName: extractString(taskInput, "businessName", "Pixelrises Project"),
        niche: extractString(taskInput, "niche", "business digital"),
        city: extractString(taskInput, "city", "France"),
        goal: extractString(taskInput, "goal", "generer des demandes qualifiees"),
        style: extractString(taskInput, "style", "dark gold premium"),
        offer: prompt,
      });
    } else if (input.task.type.startsWith("agent_")) {
      data = {
        ...createDefaultAgentProject(),
        goal: prompt,
        role: extractString(taskInput, "role", "Business strategy"),
        updatedAt: new Date().toISOString(),
      };
    } else if (input.task.type.startsWith("game_")) {
      data = createMockGameProject({
        title: extractString(taskInput, "title", "Pixel Quest"),
        platform: extractString(taskInput, "platform", "Roblox") as GamePlatform,
        gameType: extractString(taskInput, "gameType", "Adventure"),
        theme: extractString(taskInput, "theme", "premium"),
        targetAudience: extractString(taskInput, "targetAudience", "joueurs casual"),
      });
    } else if (input.task.type === "project_type_detection") {
      data = createProjectPlan({ idea: prompt });
    } else {
      data = {
        recommendations: [
          {
            priority: input.task.priority,
            title: `Action ${input.task.type}`,
            description: input.task.description,
            action: "Preparer une amelioration validable",
            source: "mock-provider",
          },
        ],
      };
    }

    return {
      providerId: this.providerId,
      model: this.defaultModel,
      success: true,
      data: data as T,
      raw: { mock: true, schema: input.schema },
      durationMs: Date.now() - startedAt,
      estimatedTokens: Math.ceil(prompt.length / 4),
      estimatedCost: 0,
    };
  }

  async validateConfig() {
    return {
      valid: true,
      status: this.status,
      message: "Mock Provider actif: aucune cle API requise et aucune cle exposee cote frontend.",
    } as const;
  }
}

export const mockProviderAdapter = new MockProviderAdapter();
