import {
  createDefaultAgentProject,
  createMockGameProject,
  createMockSiteProject,
  type CustomAgentProject,
  type GameProject,
  type NormalizedSiteProject,
} from "@/modules/creation-engine";
import type { AIProjectType } from "../schemas/ai-task.schema";
import type { NormalizedProviderOutput } from "../schemas/ai-output.schema";

const firstOfType = <T>(outputs: NormalizedProviderOutput[], outputType: NormalizedProviderOutput["outputType"]) =>
  outputs.find((output) => output.outputType === outputType)?.data as T | undefined;

export class FusionEngine {
  fuse(projectType: AIProjectType, prompt: string, outputs: NormalizedProviderOutput[]) {
    if (projectType === "agent") return this.fuseAgent(prompt, outputs);
    if (projectType === "game") return this.fuseGame(prompt, outputs);
    if (projectType === "integration") return firstOfType(outputs, "integration_mapping") ?? this.genericRecommendations(outputs);
    if (projectType === "code") return firstOfType(outputs, "code_review") ?? this.genericRecommendations(outputs);
    return this.fuseSite(prompt, outputs);
  }

  fuseSite(prompt: string, outputs: NormalizedProviderOutput[]): NormalizedSiteProject {
    const base = firstOfType<NormalizedSiteProject>(outputs, "site") ?? createMockSiteProject({ offer: prompt });
    const recommendations = outputs.flatMap((output) => {
      const data = output.data as { recommendations?: unknown };
      return Array.isArray(data?.recommendations) ? data.recommendations : [];
    });

    return {
      ...base,
      business: {
        ...base.business,
        offer: prompt || base.business.offer,
      },
      recommendations: recommendations.length
        ? (recommendations as NormalizedSiteProject["recommendations"]).slice(0, 8)
        : base.recommendations,
    };
  }

  fuseAgent(prompt: string, outputs: NormalizedProviderOutput[]): CustomAgentProject {
    const base = firstOfType<CustomAgentProject>(outputs, "agent") ?? createDefaultAgentProject();
    return {
      ...base,
      goal: prompt || base.goal,
      permissions: {
        ...base.permissions,
        readProject: true,
        suggestChanges: true,
        editWithApproval: false,
        publishWithApproval: false,
      },
    };
  }

  fuseGame(prompt: string, outputs: NormalizedProviderOutput[]): GameProject {
    const base = firstOfType<GameProject>(outputs, "game") ?? createMockGameProject();
    return {
      ...base,
      concept: {
        ...base.concept,
        pitch: prompt ? `${base.concept.pitch} Brief utilisateur: ${prompt}` : base.concept.pitch,
      },
      publishing: {
        ...base.publishing,
        warnings: Array.from(
          new Set([
            ...base.publishing.warnings,
            "Pixelrises ne publie pas automatiquement sur Roblox, Minecraft ou Fortnite.",
          ]),
        ),
      },
    };
  }

  genericRecommendations(outputs: NormalizedProviderOutput[]) {
    return outputs.flatMap((output) => {
      const data = output.data as { recommendations?: unknown };
      return Array.isArray(data?.recommendations) ? data.recommendations : [];
    });
  }
}

export const fusionEngine = new FusionEngine();
