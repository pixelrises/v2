export type AISpaceType =
  | "business"
  | "student"
  | "management"
  | "enterprise"
  | "creator"
  | "general";

export type AISpaceStatus = "active" | "beta" | "soon" | "disabled";

export type AISpaceTone =
  | "business"
  | "pedagogical"
  | "organized"
  | "professional"
  | "creative"
  | "general";

export type AISpaceBuilderLink = {
  label: string;
  href: string;
  status: "ready" | "prepared" | "soon";
};

export type AISpaceToolStatus = "ready" | "prepared" | "requires-connection" | "soon";

export type AISpaceWorkspaceItem = {
  title: string;
  description: string;
  meta?: string;
  status?: AISpaceToolStatus;
  actionLabel?: string;
  href?: string;
  tags?: string[];
};

export type AISpaceWorkspaceSection = {
  id: string;
  title: string;
  description: string;
  kind:
    | "business"
    | "study"
    | "management"
    | "enterprise"
    | "creator"
    | "general"
    | "tools"
    | "resources"
    | "security";
  items: AISpaceWorkspaceItem[];
};

export type AISpacePromptTip = {
  title: string;
  description: string;
  example: string;
};

export type AISpaceAccessPolicy = {
  recommendedPlan: "starter" | "pro" | "business" | "enterprise";
  includedIn: string[];
  creditCost: number;
  modelPolicy: string;
  businessRule: string;
};

export type AISpaceWorkspace = {
  headline: string;
  description: string;
  primaryOutput: string;
  expertFocus: string;
  sections: AISpaceWorkspaceSection[];
  promptTips: AISpacePromptTip[];
  accessPolicy: AISpaceAccessPolicy;
};

export type AISpaceQuickAction = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  resultType: string;
  builderLink?: AISpaceBuilderLink;
};

export type AISpaceRecommendation = {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

export type AISpaceDashboardConfig = {
  primaryMetric: string;
  secondaryMetrics: string[];
  nextBestAction: string;
  emptyState: string;
};

export type AISpaceConfig = {
  id: AISpaceType;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  status: AISpaceStatus;
  tone: AISpaceTone;
  icon: string;
  accent: string;
  targetUsers: string[];
  capabilities: string[];
  quickActions: AISpaceQuickAction[];
  recommendedAgents: string[];
  recommendedTemplates: string[];
  builderLinks: AISpaceBuilderLink[];
  dashboard: AISpaceDashboardConfig;
  safetyRules: string[];
  systemPrompt: string;
  workspace: AISpaceWorkspace;
};

export type AISpaceMessageRole = "user" | "assistant" | "system";

export type AISpaceMessage = {
  id: string;
  role: AISpaceMessageRole;
  content: string;
  createdAt: string;
  source?: "real" | "mock-fallback";
};

export type AISpaceConversation = {
  id: string;
  spaceType: AISpaceType;
  title: string;
  messages: AISpaceMessage[];
  createdAt: string;
  updatedAt: string;
};

export type AISpaceAssistantRequest = {
  spaceType: AISpaceType;
  prompt: string;
  quickActionId?: string;
  conversationId?: string;
  history?: AISpaceMessage[];
  profileLevel?: "beginner" | "advanced";
};

export type AISpaceAssistantResponse = {
  success: boolean;
  spaceType: AISpaceType;
  answer: string;
  recommendations: AISpaceRecommendation[];
  builderLinks: AISpaceBuilderLink[];
  source: "real" | "mock-fallback";
  provider?: string;
  model?: string;
  usage?: {
    estimatedTokens?: number;
    estimatedCost?: number;
  };
  error?: string;
};
