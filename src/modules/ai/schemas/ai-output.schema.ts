import type { CustomAgentProject, GameProject, NormalizedSiteProject, QualityGateResult } from "@/modules/creation-engine";
import type { AITaskType } from "./ai-task.schema";

export type DashboardRecommendation = {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  source: string;
};

export type IntegrationMapping = {
  integrationId: string;
  category: string;
  status: "available" | "soon" | "requested" | "beta" | "to_configure";
  permissions: string[];
  nextStep: string;
};

export type CodeReviewResult = {
  summary: string;
  findings: Array<{
    severity: "critical" | "warning" | "info";
    file?: string;
    message: string;
    fix?: string;
  }>;
  safeToApply: boolean;
};

export type PixelrisesAIOutput =
  | NormalizedSiteProject
  | CustomAgentProject
  | GameProject
  | DashboardRecommendation[]
  | IntegrationMapping
  | CodeReviewResult
  | QualityGateResult;

export type NormalizedProviderOutput = {
  taskType: AITaskType;
  outputType:
    | "site"
    | "agent"
    | "game"
    | "dashboard_recommendations"
    | "integration_mapping"
    | "code_review"
    | "quality_gate"
    | "generic";
  data: unknown;
  warnings: string[];
};
