import {
  createDefaultAgentProject,
  createMockGameProject,
  createMockSiteProject,
  validateAgentProject,
  validateGameProject,
  validateSiteProject,
  type CustomAgentProject,
  type GameProject,
  type NormalizedSiteProject,
} from "@/modules/creation-engine";
import type { AIProviderTaskResult, AITaskType } from "../schemas/ai-task.schema";
import type { NormalizedProviderOutput } from "../schemas/ai-output.schema";

const safeParseJSON = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  const candidate = jsonStart >= 0 && jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd + 1) : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    return value;
  }
};

const isSiteTask = (taskType: AITaskType) => taskType.startsWith("site_") || taskType === "final_fusion";
const isAgentTask = (taskType: AITaskType) => taskType.startsWith("agent_");
const isGameTask = (taskType: AITaskType) => taskType.startsWith("game_");

export class OutputNormalizer {
  normalize(result: AIProviderTaskResult): NormalizedProviderOutput {
    const parsed = safeParseJSON(result.output);
    const warnings: string[] = [];

    if (!result.success) {
      warnings.push(result.error ?? "Provider failed; fallback output generated.");
    }

    if (isSiteTask(result.taskType)) {
      const site = this.normalizeSite(parsed);
      return { taskType: result.taskType, outputType: "site", data: site, warnings };
    }

    if (isAgentTask(result.taskType)) {
      const agent = this.normalizeAgent(parsed);
      return { taskType: result.taskType, outputType: "agent", data: agent, warnings };
    }

    if (isGameTask(result.taskType)) {
      const game = this.normalizeGame(parsed);
      return { taskType: result.taskType, outputType: "game", data: game, warnings };
    }

    if (result.taskType === "quality_gate") {
      return {
        taskType: result.taskType,
        outputType: "quality_gate",
        data: parsed,
        warnings,
      };
    }

    return {
      taskType: result.taskType,
      outputType: "generic",
      data: parsed ?? {},
      warnings,
    };
  }

  normalizeSite(value: unknown): NormalizedSiteProject {
    const candidate = value as Partial<NormalizedSiteProject> | undefined;
    const fallback = createMockSiteProject({
      businessName: candidate?.meta?.businessName,
      niche: candidate?.meta?.niche,
      city: candidate?.meta?.city,
      goal: candidate?.meta?.goal,
      style: candidate?.meta?.style,
    });

    const site = {
      ...fallback,
      ...(candidate ?? {}),
      meta: { ...fallback.meta, ...(candidate?.meta ?? {}), projectType: "site" as const, language: "fr" as const },
      strategy: { ...fallback.strategy, ...(candidate?.strategy ?? {}) },
      brand: { ...fallback.brand, ...(candidate?.brand ?? {}) },
      seo: { ...fallback.seo, ...(candidate?.seo ?? {}) },
      business: { ...fallback.business, ...(candidate?.business ?? {}) },
      conversion: { ...fallback.conversion, ...(candidate?.conversion ?? {}) },
      design: { ...fallback.design, ...(candidate?.design ?? {}) },
      pages: Array.isArray(candidate?.pages) && candidate.pages.length ? candidate.pages : fallback.pages,
      recommendations: Array.isArray(candidate?.recommendations) ? candidate.recommendations : fallback.recommendations,
    };

    const quality = validateSiteProject(site);
    if (!quality.passed) {
      return {
        ...site,
        recommendations: [
          ...quality.requiredFixes.map((fix) => ({
            priority: "high" as const,
            title: "Correction requise",
            description: fix,
            action: "Corriger avant publication",
          })),
          ...site.recommendations,
        ],
      };
    }

    return site;
  }

  normalizeAgent(value: unknown): CustomAgentProject {
    const candidate = value as Partial<CustomAgentProject> | undefined;
    const fallback = createDefaultAgentProject();
    const agent = {
      ...fallback,
      ...(candidate ?? {}),
      projectContext: { ...fallback.projectContext, ...(candidate?.projectContext ?? {}) },
      permissions: {
        ...fallback.permissions,
        ...(candidate?.permissions ?? {}),
        editWithApproval: false,
        publishWithApproval: false,
      },
    };

    validateAgentProject(agent);
    return agent;
  }

  normalizeGame(value: unknown): GameProject {
    const candidate = value as Partial<GameProject> | undefined;
    const fallback = createMockGameProject({
      title: candidate?.meta?.title,
      platform: candidate?.meta?.platform,
      gameType: candidate?.meta?.gameType,
      targetAudience: candidate?.meta?.targetAudience,
    });
    const game = {
      ...fallback,
      ...(candidate ?? {}),
      meta: { ...fallback.meta, ...(candidate?.meta ?? {}), projectType: "game" as const },
      concept: { ...fallback.concept, ...(candidate?.concept ?? {}) },
      gameplay: { ...fallback.gameplay, ...(candidate?.gameplay ?? {}) },
      levelDesign: { ...fallback.levelDesign, ...(candidate?.levelDesign ?? {}) },
      monetization: { ...fallback.monetization, ...(candidate?.monetization ?? {}) },
      publishing: { ...fallback.publishing, ...(candidate?.publishing ?? {}) },
      scripts: Array.isArray(candidate?.scripts) && candidate.scripts.length ? candidate.scripts : fallback.scripts,
      assets: Array.isArray(candidate?.assets) && candidate.assets.length ? candidate.assets : fallback.assets,
    };

    validateGameProject(game);
    return game;
  }
}

export const outputNormalizer = new OutputNormalizer();
