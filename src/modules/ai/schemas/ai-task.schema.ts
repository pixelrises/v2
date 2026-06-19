export type AITaskType =
  | "project_type_detection"
  | "brief_analysis"
  | "strategy_analysis"
  | "business_positioning"
  | "offer_generation"
  | "site_structure"
  | "site_copywriting"
  | "site_design"
  | "site_seo"
  | "site_conversion"
  | "site_improvement"
  | "design_system"
  | "ui_layout"
  | "component_suggestion"
  | "agent_config"
  | "agent_prompt"
  | "agent_permissions"
  | "game_design"
  | "game_research"
  | "game_mechanics"
  | "game_level_design"
  | "game_platform_constraints"
  | "game_script"
  | "game_assets"
  | "game_ui_ux"
  | "game_prototype_code"
  | "game_publishing"
  | "integration_mapping"
  | "dashboard_recommendations"
  | "analytics_insights"
  | "creator_image_concept"
  | "creator_premium_image"
  | "creator_avatar_video"
  | "creator_ad_creative"
  | "code_generation"
  | "code_review"
  | "bug_fix"
  | "refactor"
  | "quality_gate"
  | "output_normalization"
  | "final_fusion";

export type AIProviderId =
  | "vercel-gateway"
  | "gemini"
  | "openai"
  | "claude"
  | "claude-design"
  | "claude-code"
  | "mistral"
  | "pollojourney"
  | "mock"
  | "future";

export type AIExecutionMode = "simple" | "qualite" | "rapide" | "business" | "cout_optimise" | "avance";

export type AITaskPriority = "high" | "medium" | "low";
export type AITaskStatus = "pending" | "routed" | "running" | "completed" | "failed" | "fallback";
export type AIProjectType = "site" | "agent" | "game" | "integration" | "improvement" | "code" | "strategy" | "template";

export type AITask = {
  id: string;
  type: AITaskType;
  description: string;
  priority: AITaskPriority;
  recommendedProvider: AIProviderId;
  fallbackProvider: AIProviderId;
  input: Record<string, unknown>;
  expectedOutputSchema: string;
  status: AITaskStatus;
  result?: unknown;
  errors?: string[];
};

export type RoutedAITask = AITask & {
  selectedProvider: AIProviderId;
  fallbackChain: AIProviderId[];
  routingReason: string;
};

export type AIOrchestratorRequest = {
  prompt: string;
  projectType?: AIProjectType;
  mode?: AIExecutionMode;
  userLevel?: "debutant" | "intermediaire" | "avance";
  context?: Record<string, unknown>;
};

export type AIOrchestratorResult = {
  requestId: string;
  projectType: AIProjectType;
  mode: AIExecutionMode;
  tasks: RoutedAITask[];
  providerResults: AIProviderTaskResult[];
  output: unknown;
  quality: AIQualityResult;
  usage: AIUsageLogEntry[];
  warnings: string[];
};

export type AIProviderTaskResult = {
  taskId: string;
  taskType: AITaskType;
  providerId: AIProviderId;
  success: boolean;
  output: unknown;
  raw?: unknown;
  error?: string;
  durationMs: number;
  estimatedTokens: number;
  estimatedCost: number;
};

export type AIQualityIssue = {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  fix?: string;
};

export type AIQualityResult = {
  valid: boolean;
  score: number;
  issues: AIQualityIssue[];
  fixes: string[];
  recommendation: string;
};

export type AIUsageLogEntry = {
  provider: AIProviderId;
  model: string;
  taskType: AITaskType;
  durationMs: number;
  success: boolean;
  retryCount: number;
  estimatedTokens: number;
  estimatedCost: number;
  timestamp: string;
};
