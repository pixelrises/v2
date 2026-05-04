import {
  validateAgentProject,
  validateGameProject,
  validateSiteProject,
  type CustomAgentProject,
  type GameProject,
  type NormalizedSiteProject,
} from "@/modules/creation-engine";
import type { AIQualityResult } from "../schemas/ai-task.schema";

const containsSecretLikeValue = (value: string) =>
  /(api[_-]?key|secret|bearer\s+[a-z0-9._-]+|sk-[a-z0-9]|AIza[0-9A-Za-z_-]+)/i.test(value);

const toAIQuality = (
  valid: boolean,
  score: number,
  issues: AIQualityResult["issues"],
  recommendation = "Continuer avec validation utilisateur avant action sensible.",
): AIQualityResult => ({
  valid,
  score,
  issues,
  fixes: issues.map((issue) => issue.fix).filter(Boolean) as string[],
  recommendation,
});

export class ValidationLayer {
  validate(output: unknown): AIQualityResult {
    const text = JSON.stringify(output);
    const securityIssues: AIQualityResult["issues"] = [];

    if (containsSecretLikeValue(text)) {
      securityIssues.push({
        id: "secret-like-value",
        severity: "critical",
        message: "Une valeur ressemblant a un secret a ete detectee dans la sortie.",
        fix: "Redacter la valeur et forcer un appel serveur securise.",
      });
    }

    if (this.isSite(output)) {
      const quality = validateSiteProject(output);
      return toAIQuality(
        quality.passed && securityIssues.length === 0,
        securityIssues.length ? Math.min(quality.score, 50) : quality.score,
        [
          ...securityIssues,
          ...quality.requiredFixes.map((fix, index) => ({
            id: `site-fix-${index}`,
            severity: "critical" as const,
            message: fix,
            fix,
          })),
          ...quality.warnings.map((warning, index) => ({
            id: `site-warning-${index}`,
            severity: "warning" as const,
            message: warning,
            fix: warning,
          })),
        ],
      );
    }

    if (this.isAgent(output)) {
      const quality = validateAgentProject(output);
      return toAIQuality(
        quality.passed && securityIssues.length === 0,
        securityIssues.length ? Math.min(quality.score, 50) : quality.score,
        [
          ...securityIssues,
          ...quality.requiredFixes.map((fix, index) => ({
            id: `agent-fix-${index}`,
            severity: "critical" as const,
            message: fix,
            fix,
          })),
          ...quality.warnings.map((warning, index) => ({
            id: `agent-warning-${index}`,
            severity: "warning" as const,
            message: warning,
            fix: warning,
          })),
        ],
      );
    }

    if (this.isGame(output)) {
      const quality = validateGameProject(output);
      return toAIQuality(
        quality.passed && securityIssues.length === 0,
        securityIssues.length ? Math.min(quality.score, 50) : quality.score,
        [
          ...securityIssues,
          ...quality.requiredFixes.map((fix, index) => ({
            id: `game-fix-${index}`,
            severity: "critical" as const,
            message: fix,
            fix,
          })),
          ...quality.warnings.map((warning, index) => ({
            id: `game-warning-${index}`,
            severity: "warning" as const,
            message: warning,
            fix: warning,
          })),
        ],
      );
    }

    return toAIQuality(securityIssues.length === 0, securityIssues.length ? 50 : 80, securityIssues);
  }

  private isSite(output: unknown): output is NormalizedSiteProject {
    return Boolean((output as NormalizedSiteProject)?.meta?.projectType === "site" && (output as NormalizedSiteProject)?.pages);
  }

  private isAgent(output: unknown): output is CustomAgentProject {
    return Boolean((output as CustomAgentProject)?.permissions && (output as CustomAgentProject)?.instructions);
  }

  private isGame(output: unknown): output is GameProject {
    return Boolean((output as GameProject)?.meta?.projectType === "game" && (output as GameProject)?.gameplay);
  }
}

export const validationLayer = new ValidationLayer();
