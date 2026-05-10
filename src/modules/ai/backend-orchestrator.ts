import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type {
  CustomAgentProject,
  GameProject,
  NormalizedSiteProject,
  ProjectType,
} from "@/modules/creation-engine";

export type BackendGenerationMode = "plan" | "build" | "improve";
export type BackendGenerationSource = "real" | "mock-fallback";

export type BackendAIOrchestratorRequest = {
  projectType: Extract<ProjectType, "site" | "agent" | "game">;
  mode?: BackendGenerationMode;
  prompt: string;
  formData?: Record<string, unknown>;
  brief?: Record<string, unknown>;
  options?: Record<string, unknown>;
};

export type BackendQualityGateResult = {
  valid: boolean;
  score: number;
  issues: string[];
  fixes: string[];
  recommendations: string[];
};

export type BackendNormalizedOutput =
  | NormalizedSiteProject
  | CustomAgentProject
  | GameProject;

export type BackendAIOrchestratorResponse = {
  success: boolean;
  projectType: "site" | "agent" | "game";
  mode: BackendGenerationMode;
  normalizedOutput?: BackendNormalizedOutput;
  qualityGateResult?: BackendQualityGateResult;
  generationId?: string;
  projectId?: string;
  persisted?: boolean;
  provider?: string;
  model?: string;
  source?: BackendGenerationSource;
  routingTrace?: Array<{
    taskType: string;
    role: string;
    model: string;
    success: boolean;
    error?: string;
  }>;
  errors?: string[];
};

export const runBackendAIOrchestrator = async (
  request: BackendAIOrchestratorRequest,
): Promise<BackendAIOrchestratorResponse> => {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      projectType: request.projectType,
      mode: request.mode ?? "build",
      source: "mock-fallback",
      errors: ["Supabase frontend config missing. Backend orchestration skipped."],
    };
  }

  const { data, error } = await supabase.functions.invoke("ai-orchestrator", {
    body: request,
  });

  if (error) {
    return {
      success: false,
      projectType: request.projectType,
      mode: request.mode ?? "build",
      source: "mock-fallback",
      errors: [error.message],
    };
  }

  return data as BackendAIOrchestratorResponse;
};
