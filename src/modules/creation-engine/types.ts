export type ProjectType = "site" | "agent" | "game" | "template" | "integration";
export type CreationMode = "plan" | "build" | "improve";
export type UserExperienceLevel = "beginner" | "intermediate" | "advanced";
export type ProjectStatus = "draft" | "planned" | "generated" | "improved" | "published";

export type CanonicalCTA = {
  label: string;
  action: string;
};

export type SiteSection = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  content: string;
  cta: CanonicalCTA;
  items: string[];
  media: string[];
  layout: string;
  conversionRole: string;
};

export type NormalizedSiteProject = {
  meta: {
    projectId: string;
    projectType: "site";
    businessName: string;
    niche: string;
    goal: string;
    targetAudience: string;
    city: string;
    tier: string;
    style: string;
    language: "fr";
  };
  strategy: {
    mainPromise: string;
    marketingAngle: string;
    conversionGoal: string;
    primaryCTA: string;
    trustStrategy: string;
    objectionsToHandle: string[];
  };
  brand: {
    name: string;
    tagline: string;
    colors: string[];
    fonts: string[];
    tone: string;
  };
  pages: Array<{
    slug: string;
    title: string;
    sections: SiteSection[];
  }>;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    localKeywords: string[];
    h1: string;
    h2: string[];
  };
  business: {
    offer: string;
    valueProposition: string;
    pricingSuggestion: string;
    leadCapture: string;
    trustElements: string[];
  };
  conversion: {
    primaryGoal: string;
    ctaStrategy: string;
    objections: string[];
    proofElements: string[];
    recommendedSections: string[];
  };
  design: {
    style: string;
    layoutDirection: string;
    spacing: string;
    radius: string;
    visualMood: string;
    components: string[];
  };
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    action: string;
  }>;
};

export type CustomAgentProject = {
  id: string;
  name: string;
  role: string;
  goal: string;
  tone: string;
  domain: string;
  level: "simple" | "advanced";
  instructions: string;
  avoid: string;
  projectContext: {
    projectId: string;
    projectType: ProjectType;
    businessName: string;
    niche: string;
    offer: string;
    goal: string;
  };
  permissions: {
    readProject: boolean;
    suggestChanges: boolean;
    editWithApproval: boolean;
    publishWithApproval: boolean;
    accessAnalytics: boolean;
    useIntegrations: boolean;
  };
  autonomyLevel?: "advice_only" | "proposals_validated" | "internal_actions_validated" | "external_actions_validated";
  allowedActions?: string[];
  forbiddenActions?: string[];
  connectedTools?: string[];
  status?: "ready" | "beta" | "soon" | "disabled";
  riskLevel?: "low" | "medium" | "high";
  dataState?: "real" | "example" | "mock" | "pending" | "error" | "empty";
  testHistory?: Array<{
    id: string;
    prompt: string;
    response: string;
    riskLevel: "low" | "medium" | "high";
    requiresConfirmation: boolean;
    createdAt: string;
  }>;
  proposedActions?: Array<{
    id: string;
    title: string;
    description: string;
    actionType: string;
    targetModule: string;
    riskLevel: "low" | "medium" | "high";
    requiresConfirmation: boolean;
    status: "draft" | "proposed" | "approved" | "rejected" | "executed" | "failed" | "cancelled" | "blocked" | "requires_external_connection";
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type GamePlatform = "Roblox" | "Minecraft" | "Fortnite / UEFN" | "Web game";

export type GameProject = {
  meta: {
    projectId: string;
    projectType: "game";
    platform: GamePlatform;
    gameType: string;
    title: string;
    targetAudience: string;
    difficulty: string;
    mode: "solo" | "multiplayer" | "both";
  };
  concept: {
    pitch: string;
    theme: string;
    world: string;
    playerGoal: string;
    coreFantasy: string;
  };
  gameplay: {
    loop: string;
    rules: string[];
    mechanics: string[];
    progression: string[];
    rewards: string[];
    economy: string[];
  };
  levelDesign: {
    mapStructure: string;
    zones: string[];
    objectives: string[];
    flow: string;
  };
  scripts: Array<{
    language: string;
    name: string;
    purpose: string;
    code: string;
    explanation: string;
  }>;
  assets: Array<{
    type: string;
    name: string;
    description: string;
    prompt: string;
  }>;
  monetization: {
    strategy: string;
    items: string[];
    passes: string[];
    ethicalNotes: string;
  };
  publishing: {
    checklist: string[];
    warnings: string[];
    nextSteps: string[];
  };
};

export type QualityGateCheck = {
  id: string;
  label: string;
  passed: boolean;
  severity: "required" | "recommended";
  message: string;
};

export type QualityGateResult = {
  projectType: ProjectType;
  passed: boolean;
  score: number;
  checks: QualityGateCheck[];
  requiredFixes: string[];
  warnings: string[];
};

export type PlanModeOutput = {
  projectId: string;
  projectType: ProjectType;
  mode: "plan";
  summary: string;
  targetAudience: string;
  strategy: string[];
  recommendedModules: string[];
  risks: string[];
  nextSteps: string[];
};

export type CreationRequest = {
  idea: string;
  projectType?: ProjectType;
  userLevel?: UserExperienceLevel;
  context?: Record<string, string>;
};
