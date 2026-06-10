import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type {
  CustomAgentProject,
  GameProject,
  NormalizedSiteProject,
  ProjectType,
} from "@/modules/creation-engine";
import { redactSecrets } from "@/modules/ai/security/redactSecrets";

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
    success: boolean;
    error?: string;
  }>;
  errors?: string[];
};

const cleanBackendMessage = (value: unknown, fallback = "Orchestrateur IA indisponible.") => {
  const cleaned = redactSecrets(value).replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, 240) : fallback;
};

const cleanErrors = (errors?: string[]) =>
  Array.isArray(errors) ? errors.map((error) => cleanBackendMessage(error)) : undefined;

const cleanResponse = (
  response: BackendAIOrchestratorResponse | null | undefined,
  request: BackendAIOrchestratorRequest,
): BackendAIOrchestratorResponse => {
  if (!response || typeof response !== "object") {
    return {
      success: false,
      projectType: request.projectType,
      mode: request.mode ?? "build",
      source: "mock-fallback",
      errors: ["Réponse backend IA invalide."],
    };
  }

  const safeResponse: BackendAIOrchestratorResponse = { ...response };
  delete safeResponse.provider;
  delete safeResponse.model;

  return {
    ...safeResponse,
    projectType: response.projectType ?? request.projectType,
    mode: response.mode ?? request.mode ?? "build",
    source: response.source ?? "mock-fallback",
    errors: cleanErrors(response.errors),
    routingTrace: response.routingTrace?.map((task) => ({
      taskType: task.taskType,
      role: task.role,
      success: task.success,
      error: task.error ? cleanBackendMessage(task.error) : undefined,
    })),
  };
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
      errors: ["Configuration Supabase manquante : orchestration backend ignorée."],
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
      errors: [cleanBackendMessage(error.message)],
    };
  }

  return cleanResponse(data as BackendAIOrchestratorResponse, request);
};
