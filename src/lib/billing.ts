export type PlanKey = "free" | "starter" | "pro" | "business" | "enterprise";

export type QualityMode = "economy" | "standard" | "quality" | "premium";

export type BillingBuilderType =
  | "site"
  | "game"
  | "agent"
  | "ai_space"
  | "automation"
  | "analytics"
  | "export";

export type BillingActionType =
  | "general_question"
  | "quick_rewrite"
  | "student_sheet"
  | "student_quiz"
  | "creator_script"
  | "business_plan"
  | "site_generation"
  | "site_section_improve"
  | "site_seo_analysis"
  | "site_export_advanced"
  | "game_blueprint"
  | "game_prototype"
  | "game_package"
  | "game_script_generation"
  | "agent_generation"
  | "agent_improve"
  | "agent_test_chat"
  | "automation_scenario"
  | "analytics_recommendation";

export type ComplexityLevel = "simple" | "medium" | "advanced" | "premium";

export type ActionAbuseRisk = "low" | "medium" | "high";

export type PlanLimitKey =
  | "max_daily_actions"
  | "max_monthly_heavy_generations"
  | "max_site_generations"
  | "max_game_generations"
  | "max_agent_creations"
  | "max_premium_actions"
  | "max_parallel_actions"
  | "max_history_retention_days";

export type PlanConfig = {
  key: PlanKey;
  name: string;
  description: string;
  priceMonthlyEur: number | null;
  stripePriceEnv?: string;
  stripePaymentLink?: string;
  monthlyCredits: number | null;
  isRecommended?: boolean;
  isCustom?: boolean;
  isActive: boolean;
  sortOrder: number;
  limits: Record<PlanLimitKey, number | null>;
  features: string[];
  qualityModes: QualityMode[];
};

export type CreditCostRule = {
  actionType: BillingActionType;
  builderType: BillingBuilderType;
  label: string;
  baseCost: number;
  complexityLevel: ComplexityLevel;
  defaultQualityMode: QualityMode;
  multiAiRoles: number;
  outputSize: "short" | "standard" | "long";
  safetyMargin: number;
  planRequired: PlanKey;
  maxUsagePerDay: number | null;
  maxUsagePerMonth: number | null;
  abuseRisk: ActionAbuseRisk;
  estimatedInternalCostEur: number;
  minimumMarginRatio: number;
};

export type CreditCostInput = {
  actionType: BillingActionType;
  qualityMode?: QualityMode;
  complexityLevel?: ComplexityLevel;
  multiAiRoles?: number;
  outputSize?: CreditCostRule["outputSize"];
  planKey?: PlanKey;
};

export type CreditCostResult = {
  actionType: BillingActionType;
  label: string;
  credits: number;
  planRequired: PlanKey;
  allowedForPlan: boolean;
  qualityMode: QualityMode;
  abuseRisk: ActionAbuseRisk;
  estimatedInternalCostEur: number;
  minimumMarginRatio: number;
};

export type ActionProfitabilityEstimate = {
  actionType: BillingActionType;
  label: string;
  planKey: PlanKey;
  credits: number;
  creditValueEur: number | null;
  estimatedRevenueEur: number | null;
  estimatedInternalCostEur: number;
  grossProfitEur: number | null;
  grossMarginRatio: number | null;
  revenueToCostRatio: number | null;
  targetGrossMarginRatio: number | null;
  minimumMarginRatio: number;
  meetsTargetMargin: boolean | null;
  meetsMinimumRatio: boolean | null;
  verdict: "safe" | "watch" | "blocked";
};

export type AIModelTier = "economy" | "standard" | "quality" | "premium" | "enterprise";

export type AIModelAccessConfig = {
  model: string;
  label: string;
  tier: AIModelTier;
  planRequired: PlanKey;
  qualityMode: QualityMode;
  manualApprovalRequired: boolean;
  recommendedUse: string;
};

export type PlanBudgetConfig = {
  planKey: PlanKey;
  monthlyRevenueEur: number | null;
  includedCredits: number | null;
  creditValueEur: number | null;
  monthlyAiBudgetEur: number | null;
  dailyAiBudgetEur: number | null;
  targetGrossMarginRatio: number | null;
  expensiveActionConfirmationCredits: number;
  maxEstimatedInternalCostPerActionEur: number | null;
  premiumModelPolicy: "blocked" | "allowed_with_margin_guard" | "custom_contract";
};

export type CreditPackStatus = "active" | "quote";

export type CreditPackConfig = {
  key: string;
  label: string;
  credits: number | null;
  priceEur: number | null;
  stripePriceEnv?: string;
  status: CreditPackStatus;
  description: string;
  quoteUrl?: string;
  ctaLabel?: string;
};

const PLAN_ORDER: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
  enterprise: 4,
};

const COMPLEXITY_MULTIPLIERS: Record<ComplexityLevel, number> = {
  simple: 0.8,
  medium: 1,
  advanced: 1.35,
  premium: 1.75,
};

const OUTPUT_SIZE_MULTIPLIERS: Record<CreditCostRule["outputSize"], number> = {
  short: 0.85,
  standard: 1,
  long: 1.25,
};

export const QUALITY_MODES: Record<
  QualityMode,
  { label: string; description: string; multiplier: number; minPlan: PlanKey }
> = {
  economy: {
    label: "Economique",
    description: "Rapide, utile pour les petites demandes.",
    multiplier: 0.75,
    minPlan: "free",
  },
  standard: {
    label: "Standard",
    description: "Bon equilibre qualite / credits.",
    multiplier: 1,
    minPlan: "free",
  },
  quality: {
    label: "Qualite",
    description: "Plus de controle et de verification.",
    multiplier: 1.45,
    minPlan: "starter",
  },
  premium: {
    label: "Premium",
    description: "Generation avancee avec controles renforces.",
    multiplier: 2.2,
    minPlan: "pro",
  },
};

export const BILLING_PLANS: PlanConfig[] = [
  {
    key: "free",
    name: "Decouverte",
    description: "Decouvrir Pixelrises, tester une premiere generation et comprendre la valeur avant de passer sur un plan payant.",
    priceMonthlyEur: 0,
    monthlyCredits: 5,
    isActive: true,
    sortOrder: 0,
    limits: {
      max_daily_actions: 5,
      max_monthly_heavy_generations: 1,
      max_site_generations: 1,
      max_game_generations: 0,
      max_agent_creations: 1,
      max_premium_actions: 0,
      max_parallel_actions: 1,
      max_history_retention_days: 7,
    },
    features: ["Premier test IA", "Agent simple", "Limites anti-abus", "Historique court"],
    qualityModes: ["economy", "standard"],
  },
  {
    key: "starter",
    name: "Starter",
    description: "Creer un premier site ou agent, tester Pixelrises en conditions reelles et publier rapidement sans complexite.",
    priceMonthlyEur: 19,
    stripePriceEnv: "STRIPE_PRICE_STARTER",
    stripePaymentLink: "https://buy.stripe.com/dRm14p8bb68Dc2rbONaZi0C",
    monthlyCredits: 80,
    isActive: true,
    sortOrder: 1,
    limits: {
      max_daily_actions: 18,
      max_monthly_heavy_generations: 6,
      max_site_generations: 4,
      max_game_generations: 1,
      max_agent_creations: 3,
      max_premium_actions: 2,
      max_parallel_actions: 1,
      max_history_retention_days: 30,
    },
    features: ["Site ou agent principal", "Ameliorations IA", "Publication simple", "Exports standards"],
    qualityModes: ["economy", "standard", "quality"],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Plan recommande pour lancer, iterer, optimiser SEO/conversion et travailler regulierement avec les builders.",
    priceMonthlyEur: 49,
    stripePriceEnv: "STRIPE_PRICE_PRO",
    stripePaymentLink: "https://buy.stripe.com/dRmeVf3UV54zgiHf0ZaZi0B",
    monthlyCredits: 240,
    isRecommended: true,
    isActive: true,
    sortOrder: 2,
    limits: {
      max_daily_actions: 45,
      max_monthly_heavy_generations: 18,
      max_site_generations: 12,
      max_game_generations: 4,
      max_agent_creations: 8,
      max_premium_actions: 10,
      max_parallel_actions: 2,
      max_history_retention_days: 90,
    },
    features: ["Builders complets", "Modes qualite", "SEO et versions", "Exports avances"],
    qualityModes: ["economy", "standard", "quality", "premium"],
  },
  {
    key: "business",
    name: "Business",
    description: "Usage intensif pour plusieurs projets, production frequente, quotas renforces et controle de rentabilite.",
    priceMonthlyEur: 149,
    stripePriceEnv: "STRIPE_PRICE_BUSINESS",
    stripePaymentLink: "https://buy.stripe.com/28E7sN3UV9kPfeD1a9aZi0A",
    monthlyCredits: 850,
    isActive: true,
    sortOrder: 3,
    limits: {
      max_daily_actions: 120,
      max_monthly_heavy_generations: 60,
      max_site_generations: 35,
      max_game_generations: 12,
      max_agent_creations: 20,
      max_premium_actions: 35,
      max_parallel_actions: 4,
      max_history_retention_days: 180,
    },
    features: ["Plusieurs projets", "Premium Multi-IA", "Quotas renforces", "Support prioritaire"],
    qualityModes: ["economy", "standard", "quality", "premium"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Accompagnement sur mesure pour equipes, volumes importants, exigences de securite et quotas negocies.",
    priceMonthlyEur: null,
    stripePriceEnv: "STRIPE_PRICE_ENTERPRISE",
    monthlyCredits: null,
    isCustom: true,
    isActive: true,
    sortOrder: 4,
    limits: {
      max_daily_actions: null,
      max_monthly_heavy_generations: null,
      max_site_generations: null,
      max_game_generations: null,
      max_agent_creations: null,
      max_premium_actions: null,
      max_parallel_actions: null,
      max_history_retention_days: 365,
    },
    features: ["Contrat dedie", "Quotas sur mesure", "Securite renforcee", "Accompagnement prioritaire"],
    qualityModes: ["economy", "standard", "quality", "premium"],
  },
];

const PLAN_AI_BUDGETS: Record<
  PlanKey,
  Pick<
    PlanBudgetConfig,
    | "monthlyAiBudgetEur"
    | "dailyAiBudgetEur"
    | "targetGrossMarginRatio"
    | "expensiveActionConfirmationCredits"
    | "maxEstimatedInternalCostPerActionEur"
    | "premiumModelPolicy"
  >
> = {
  free: {
    monthlyAiBudgetEur: 0.2,
    dailyAiBudgetEur: 0.05,
    targetGrossMarginRatio: null,
    expensiveActionConfirmationCredits: 4,
    maxEstimatedInternalCostPerActionEur: 0.12,
    premiumModelPolicy: "blocked",
  },
  starter: {
    monthlyAiBudgetEur: 3,
    dailyAiBudgetEur: 0.5,
    targetGrossMarginRatio: 0.75,
    expensiveActionConfirmationCredits: 10,
    maxEstimatedInternalCostPerActionEur: 0.5,
    premiumModelPolicy: "blocked",
  },
  pro: {
    monthlyAiBudgetEur: 8,
    dailyAiBudgetEur: 1.5,
    targetGrossMarginRatio: 0.78,
    expensiveActionConfirmationCredits: 12,
    maxEstimatedInternalCostPerActionEur: 1.5,
    premiumModelPolicy: "allowed_with_margin_guard",
  },
  business: {
    monthlyAiBudgetEur: 25,
    dailyAiBudgetEur: 5,
    targetGrossMarginRatio: 0.8,
    expensiveActionConfirmationCredits: 20,
    maxEstimatedInternalCostPerActionEur: 5,
    premiumModelPolicy: "allowed_with_margin_guard",
  },
  enterprise: {
    monthlyAiBudgetEur: null,
    dailyAiBudgetEur: null,
    targetGrossMarginRatio: null,
    expensiveActionConfirmationCredits: 30,
    maxEstimatedInternalCostPerActionEur: null,
    premiumModelPolicy: "custom_contract",
  },
};

export const AI_MODEL_ACCESS_RULES: AIModelAccessConfig[] = [
  {
    model: "mistral/mistral-small",
    label: "Mistral Small",
    tier: "economy",
    planRequired: "free",
    qualityMode: "economy",
    manualApprovalRequired: false,
    recommendedUse: "Chat rapide, petites reformulations, Product Lab leger.",
  },
  {
    model: "mistral/ministral-8b",
    label: "Ministral 8B",
    tier: "economy",
    planRequired: "free",
    qualityMode: "economy",
    manualApprovalRequired: false,
    recommendedUse: "Long contexte economique et brouillons internes.",
  },
  {
    model: "openai/gpt-oss-safeguard-20b",
    label: "Safety Guard",
    tier: "economy",
    planRequired: "free",
    qualityMode: "economy",
    manualApprovalRequired: false,
    recommendedUse: "Controle securite et moderation.",
  },
  {
    model: "openai/gpt-4o-mini",
    label: "OpenAI Standard",
    tier: "standard",
    planRequired: "free",
    qualityMode: "standard",
    manualApprovalRequired: false,
    recommendedUse: "Logique produit, structure, Site Builder standard.",
  },
  {
    model: "meta/llama-3.3-70b",
    label: "Llama 70B",
    tier: "standard",
    planRequired: "free",
    qualityMode: "standard",
    manualApprovalRequired: false,
    recommendedUse: "General AI, synthese et raisonnement bon rapport qualite/prix.",
  },
  {
    model: "anthropic/claude-3.5-haiku",
    label: "Claude Design",
    tier: "quality",
    planRequired: "starter",
    qualityMode: "quality",
    manualApprovalRequired: false,
    recommendedUse: "Design, copywriting premium court, controles qualite.",
  },
  {
    model: "mistral/pixtral-12b",
    label: "Pixtral 12B",
    tier: "quality",
    planRequired: "starter",
    qualityMode: "quality",
    manualApprovalRequired: false,
    recommendedUse: "Analyse visuelle et idees de mise en page.",
  },
  {
    model: "mistral/codestral",
    label: "Codestral",
    tier: "quality",
    planRequired: "starter",
    qualityMode: "quality",
    manualApprovalRequired: false,
    recommendedUse: "Snippets, scripts jeu, corrections techniques courtes.",
  },
  {
    model: "mistral/pixtral-large",
    label: "Pixtral Large",
    tier: "premium",
    planRequired: "pro",
    qualityMode: "premium",
    manualApprovalRequired: false,
    recommendedUse: "Design premium et analyse visuelle avancee.",
  },
  {
    model: "openai/gpt-4o",
    label: "OpenAI Premium",
    tier: "premium",
    planRequired: "pro",
    qualityMode: "premium",
    manualApprovalRequired: false,
    recommendedUse: "Raisonnement premium rentable sur actions importantes.",
  },
  {
    model: "anthropic/claude-opus-4.5",
    label: "Claude Opus",
    tier: "premium",
    planRequired: "business",
    qualityMode: "premium",
    manualApprovalRequired: true,
    recommendedUse: "Travail premium a forte valeur, seulement si marge confirmee.",
  },
  {
    model: "openai/o1",
    label: "OpenAI o1",
    tier: "enterprise",
    planRequired: "enterprise",
    qualityMode: "premium",
    manualApprovalRequired: true,
    recommendedUse: "Raisonnement profond sous contrat custom.",
  },
  {
    model: "openai/o3-deep-research",
    label: "Deep Research",
    tier: "enterprise",
    planRequired: "enterprise",
    qualityMode: "premium",
    manualApprovalRequired: true,
    recommendedUse: "Recherche avancee sous contrat custom.",
  },
  {
    model: "openai/gpt-5-pro",
    label: "GPT Pro",
    tier: "enterprise",
    planRequired: "enterprise",
    qualityMode: "premium",
    manualApprovalRequired: true,
    recommendedUse: "Travail tres couteux sous validation humaine et contrat.",
  },
];

export const CREDIT_COST_RULES: CreditCostRule[] = [
  {
    actionType: "general_question",
    builderType: "ai_space",
    label: "Question rapide",
    baseCost: 1,
    complexityLevel: "simple",
    defaultQualityMode: "economy",
    multiAiRoles: 1,
    outputSize: "short",
    safetyMargin: 0,
    planRequired: "free",
    maxUsagePerDay: 20,
    maxUsagePerMonth: 300,
    abuseRisk: "low",
    estimatedInternalCostEur: 0.01,
    minimumMarginRatio: 5,
  },
  {
    actionType: "quick_rewrite",
    builderType: "ai_space",
    label: "Reformulation courte",
    baseCost: 1,
    complexityLevel: "simple",
    defaultQualityMode: "standard",
    multiAiRoles: 1,
    outputSize: "short",
    safetyMargin: 0,
    planRequired: "free",
    maxUsagePerDay: 15,
    maxUsagePerMonth: 200,
    abuseRisk: "low",
    estimatedInternalCostEur: 0.015,
    minimumMarginRatio: 5,
  },
  {
    actionType: "student_sheet",
    builderType: "ai_space",
    label: "Fiche de revision",
    baseCost: 3,
    complexityLevel: "medium",
    defaultQualityMode: "standard",
    multiAiRoles: 1,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "free",
    maxUsagePerDay: 8,
    maxUsagePerMonth: 80,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.04,
    minimumMarginRatio: 6,
  },
  {
    actionType: "student_quiz",
    builderType: "ai_space",
    label: "Quiz",
    baseCost: 4,
    complexityLevel: "medium",
    defaultQualityMode: "standard",
    multiAiRoles: 1,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "free",
    maxUsagePerDay: 8,
    maxUsagePerMonth: 80,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.05,
    minimumMarginRatio: 6,
  },
  {
    actionType: "creator_script",
    builderType: "ai_space",
    label: "Script contenu",
    baseCost: 5,
    complexityLevel: "medium",
    defaultQualityMode: "standard",
    multiAiRoles: 2,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "starter",
    maxUsagePerDay: 10,
    maxUsagePerMonth: 120,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.08,
    minimumMarginRatio: 7,
  },
  {
    actionType: "business_plan",
    builderType: "ai_space",
    label: "Plan business",
    baseCost: 7,
    complexityLevel: "advanced",
    defaultQualityMode: "quality",
    multiAiRoles: 3,
    outputSize: "long",
    safetyMargin: 2,
    planRequired: "starter",
    maxUsagePerDay: 6,
    maxUsagePerMonth: 60,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.15,
    minimumMarginRatio: 7,
  },
  {
    actionType: "site_generation",
    builderType: "site",
    label: "Generation de site",
    baseCost: 5,
    complexityLevel: "advanced",
    defaultQualityMode: "standard",
    multiAiRoles: 4,
    outputSize: "standard",
    safetyMargin: 2,
    planRequired: "free",
    maxUsagePerDay: 4,
    maxUsagePerMonth: 35,
    abuseRisk: "high",
    estimatedInternalCostEur: 0.45,
    minimumMarginRatio: 3.5,
  },
  {
    actionType: "site_section_improve",
    builderType: "site",
    label: "Amelioration de section",
    baseCost: 2,
    complexityLevel: "medium",
    defaultQualityMode: "standard",
    multiAiRoles: 2,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "free",
    maxUsagePerDay: 12,
    maxUsagePerMonth: 120,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.09,
    minimumMarginRatio: 4,
  },
  {
    actionType: "site_seo_analysis",
    builderType: "site",
    label: "Analyse SEO",
    baseCost: 5,
    complexityLevel: "medium",
    defaultQualityMode: "quality",
    multiAiRoles: 2,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "starter",
    maxUsagePerDay: 8,
    maxUsagePerMonth: 80,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.14,
    minimumMarginRatio: 4,
  },
  {
    actionType: "site_export_advanced",
    builderType: "export",
    label: "Export avance",
    baseCost: 6,
    complexityLevel: "advanced",
    defaultQualityMode: "standard",
    multiAiRoles: 1,
    outputSize: "long",
    safetyMargin: 1,
    planRequired: "pro",
    maxUsagePerDay: 6,
    maxUsagePerMonth: 50,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.06,
    minimumMarginRatio: 5,
  },
  {
    actionType: "game_blueprint",
    builderType: "game",
    label: "Blueprint jeu",
    baseCost: 8,
    complexityLevel: "advanced",
    defaultQualityMode: "standard",
    multiAiRoles: 4,
    outputSize: "long",
    safetyMargin: 2,
    planRequired: "starter",
    maxUsagePerDay: 4,
    maxUsagePerMonth: 35,
    abuseRisk: "high",
    estimatedInternalCostEur: 0.35,
    minimumMarginRatio: 4,
  },
  {
    actionType: "game_prototype",
    builderType: "game",
    label: "Prototype web jouable",
    baseCost: 16,
    complexityLevel: "premium",
    defaultQualityMode: "quality",
    multiAiRoles: 5,
    outputSize: "long",
    safetyMargin: 4,
    planRequired: "pro",
    maxUsagePerDay: 3,
    maxUsagePerMonth: 18,
    abuseRisk: "high",
    estimatedInternalCostEur: 1.2,
    minimumMarginRatio: 4,
  },
  {
    actionType: "game_package",
    builderType: "game",
    label: "Package plateforme",
    baseCost: 18,
    complexityLevel: "premium",
    defaultQualityMode: "quality",
    multiAiRoles: 6,
    outputSize: "long",
    safetyMargin: 5,
    planRequired: "pro",
    maxUsagePerDay: 3,
    maxUsagePerMonth: 16,
    abuseRisk: "high",
    estimatedInternalCostEur: 1.4,
    minimumMarginRatio: 4,
  },
  {
    actionType: "game_script_generation",
    builderType: "game",
    label: "Scripts jeu",
    baseCost: 10,
    complexityLevel: "advanced",
    defaultQualityMode: "quality",
    multiAiRoles: 3,
    outputSize: "long",
    safetyMargin: 2,
    planRequired: "starter",
    maxUsagePerDay: 5,
    maxUsagePerMonth: 45,
    abuseRisk: "high",
    estimatedInternalCostEur: 0.45,
    minimumMarginRatio: 4,
  },
  {
    actionType: "agent_generation",
    builderType: "agent",
    label: "Creation agent IA",
    baseCost: 7,
    complexityLevel: "advanced",
    defaultQualityMode: "standard",
    multiAiRoles: 3,
    outputSize: "standard",
    safetyMargin: 2,
    planRequired: "free",
    maxUsagePerDay: 5,
    maxUsagePerMonth: 35,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.25,
    minimumMarginRatio: 4,
  },
  {
    actionType: "agent_improve",
    builderType: "agent",
    label: "Amelioration agent",
    baseCost: 4,
    complexityLevel: "medium",
    defaultQualityMode: "standard",
    multiAiRoles: 2,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "free",
    maxUsagePerDay: 8,
    maxUsagePerMonth: 80,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.08,
    minimumMarginRatio: 7,
  },
  {
    actionType: "agent_test_chat",
    builderType: "agent",
    label: "Test agent",
    baseCost: 1,
    complexityLevel: "simple",
    defaultQualityMode: "economy",
    multiAiRoles: 1,
    outputSize: "short",
    safetyMargin: 0,
    planRequired: "free",
    maxUsagePerDay: 25,
    maxUsagePerMonth: 250,
    abuseRisk: "low",
    estimatedInternalCostEur: 0.015,
    minimumMarginRatio: 5,
  },
  {
    actionType: "automation_scenario",
    builderType: "automation",
    label: "Scenario automatisation",
    baseCost: 5,
    complexityLevel: "medium",
    defaultQualityMode: "standard",
    multiAiRoles: 2,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "starter",
    maxUsagePerDay: 8,
    maxUsagePerMonth: 60,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.08,
    minimumMarginRatio: 7,
  },
  {
    actionType: "analytics_recommendation",
    builderType: "analytics",
    label: "Recommandation analytics",
    baseCost: 3,
    complexityLevel: "medium",
    defaultQualityMode: "standard",
    multiAiRoles: 2,
    outputSize: "standard",
    safetyMargin: 1,
    planRequired: "free",
    maxUsagePerDay: 10,
    maxUsagePerMonth: 100,
    abuseRisk: "low",
    estimatedInternalCostEur: 0.05,
    minimumMarginRatio: 7,
  },
];

export const CREDIT_PACKS: readonly CreditPackConfig[] = [
  {
    key: "credits_100",
    label: "Boost",
    credits: 100,
    priceEur: 29,
    stripePriceEnv: "STRIPE_PRICE_CREDITS_100",
    status: "active",
    description: "Prolonger vos generations et ameliorations sans changer d'abonnement.",
  },
  {
    key: "credits_300",
    label: "Growth",
    credits: 300,
    priceEur: 79,
    stripePriceEnv: "STRIPE_PRICE_CREDITS_300",
    status: "active",
    description: "Creer et ameliorer plusieurs contenus, sites ou agents avec plus de confort.",
  },
  {
    key: "credits_750",
    label: "Scale",
    credits: 750,
    priceEur: 179,
    stripePriceEnv: "STRIPE_PRICE_CREDITS_750",
    status: "active",
    description: "Volume avance pour produire intensivement sur une periode courte.",
  },
  {
    key: "credits_1500",
    label: "Entreprise",
    credits: null,
    priceEur: null,
    status: "quote",
    description: "Volume sur mesure pour agences, equipes ou besoins intensifs. Credits et prix ajustes apres validation humaine.",
    quoteUrl:
      "https://wa.me/33775256214?text=Bonjour,%20je%20souhaite%20un%20devis%20Entreprise%20pour%20des%20credits%20Pixelrises%20V2.",
    ctaLabel: "Demander un devis",
  },
] as const;

export const getPlanByKey = (planKey: PlanKey) =>
  BILLING_PLANS.find((plan) => plan.key === planKey) || BILLING_PLANS[0];

export const getPlanCreditValueEur = (planKey: PlanKey) => {
  const plan = getPlanByKey(planKey);
  if (!plan.priceMonthlyEur || !plan.monthlyCredits) return null;
  return Number((plan.priceMonthlyEur / plan.monthlyCredits).toFixed(4));
};

export const getPlanBudgetConfig = (planKey: PlanKey): PlanBudgetConfig => {
  const plan = getPlanByKey(planKey);
  const budget = PLAN_AI_BUDGETS[plan.key];

  return {
    planKey: plan.key,
    monthlyRevenueEur: plan.priceMonthlyEur,
    includedCredits: plan.monthlyCredits,
    creditValueEur: getPlanCreditValueEur(plan.key),
    ...budget,
  };
};

const normalizeModelName = (model: string) => model.trim().toLowerCase();

export const getModelAccessConfig = (model: string): AIModelAccessConfig => {
  const normalizedModel = normalizeModelName(model);
  const rule = AI_MODEL_ACCESS_RULES.find((item) => normalizeModelName(item.model) === normalizedModel);

  if (rule) return rule;

  return {
    model,
    label: "Modele non catalogue",
    tier: "enterprise",
    planRequired: "enterprise",
    qualityMode: "premium",
    manualApprovalRequired: true,
    recommendedUse: "A valider manuellement avant usage pour proteger les couts.",
  };
};

export const canPlanUseModel = (planKey: PlanKey, model: string) =>
  isPlanAtLeast(planKey, getModelAccessConfig(model).planRequired);

export const requiresPremiumModelConfirmation = (planKey: PlanKey, model: string) => {
  const rule = getModelAccessConfig(model);
  const planBudget = getPlanBudgetConfig(planKey);
  const isCostlyModel = rule.tier === "premium" || rule.tier === "enterprise";

  if (!isCostlyModel && !rule.manualApprovalRequired) return false;

  return (
    rule.manualApprovalRequired ||
    isCostlyModel ||
    planBudget.premiumModelPolicy !== "allowed_with_margin_guard"
  );
};

export const estimateCreditRevenueEur = (planKey: PlanKey, credits: number) => {
  const creditValue = getPlanCreditValueEur(planKey);
  return creditValue === null ? null : Number((creditValue * credits).toFixed(2));
};

export const estimateActionProfitability = ({
  planKey,
  actionType,
  qualityMode,
}: {
  planKey: PlanKey;
  actionType: BillingActionType;
  qualityMode?: QualityMode;
}): ActionProfitabilityEstimate => {
  const rule = getCostRule(actionType);
  const planBudget = getPlanBudgetConfig(planKey);
  const cost = calculateCreditCost({ actionType, qualityMode, planKey });
  const creditValueEur = getPlanCreditValueEur(planKey);
  const estimatedRevenueEur =
    creditValueEur === null ? null : Number((creditValueEur * cost.credits).toFixed(2));
  const estimatedInternalCostEur = rule.estimatedInternalCostEur;
  const grossProfitEur =
    estimatedRevenueEur === null ? null : Number((estimatedRevenueEur - estimatedInternalCostEur).toFixed(2));
  const grossMarginRatio =
    estimatedRevenueEur === null || estimatedRevenueEur <= 0
      ? null
      : Number(((estimatedRevenueEur - estimatedInternalCostEur) / estimatedRevenueEur).toFixed(3));
  const revenueToCostRatio =
    estimatedInternalCostEur <= 0 || estimatedRevenueEur === null
      ? null
      : Number((estimatedRevenueEur / estimatedInternalCostEur).toFixed(2));
  const meetsTargetMargin =
    planBudget.targetGrossMarginRatio === null || grossMarginRatio === null
      ? null
      : grossMarginRatio >= planBudget.targetGrossMarginRatio;
  const meetsMinimumRatio =
    revenueToCostRatio === null ? null : revenueToCostRatio >= rule.minimumMarginRatio;
  const verdict =
    !cost.allowedForPlan || meetsMinimumRatio === false
      ? "blocked"
      : meetsTargetMargin === false
        ? "watch"
        : "safe";

  return {
    actionType,
    label: rule.label,
    planKey,
    credits: cost.credits,
    creditValueEur,
    estimatedRevenueEur,
    estimatedInternalCostEur,
    grossProfitEur,
    grossMarginRatio,
    revenueToCostRatio,
    targetGrossMarginRatio: planBudget.targetGrossMarginRatio,
    minimumMarginRatio: rule.minimumMarginRatio,
    meetsTargetMargin,
    meetsMinimumRatio,
    verdict,
  };
};

export const getCostRule = (actionType: BillingActionType) => {
  const rule = CREDIT_COST_RULES.find((item) => item.actionType === actionType);

  if (!rule) {
    throw new Error(`Unknown billing action: ${actionType}`);
  }

  return rule;
};

export const isPlanAtLeast = (currentPlan: PlanKey, requiredPlan: PlanKey) =>
  PLAN_ORDER[currentPlan] >= PLAN_ORDER[requiredPlan];

export const canPlanUseAction = (planKey: PlanKey, actionType: BillingActionType) => {
  const rule = getCostRule(actionType);
  const plan = getPlanByKey(planKey);
  const qualityAllowed = plan.qualityModes.includes(rule.defaultQualityMode);

  return isPlanAtLeast(planKey, rule.planRequired) && qualityAllowed;
};

export const calculateCreditCost = ({
  actionType,
  qualityMode,
  complexityLevel,
  multiAiRoles,
  outputSize,
  planKey = "free",
}: CreditCostInput): CreditCostResult => {
  const rule = getCostRule(actionType);
  const selectedQualityMode = qualityMode || rule.defaultQualityMode;
  const selectedComplexity = complexityLevel || rule.complexityLevel;
  const selectedOutputSize = outputSize || rule.outputSize;
  const selectedRoles = Math.max(1, multiAiRoles ?? rule.multiAiRoles);
  const quality = QUALITY_MODES[selectedQualityMode];
  const multiAiMultiplier = 1 + Math.max(0, selectedRoles - 1) * 0.18;
  const rawCost =
    rule.baseCost *
      COMPLEXITY_MULTIPLIERS[selectedComplexity] *
      quality.multiplier *
      multiAiMultiplier *
      OUTPUT_SIZE_MULTIPLIERS[selectedOutputSize] +
    rule.safetyMargin;
  const credits = Math.max(1, Math.ceil(rawCost));
  const planAllowsQuality = isPlanAtLeast(planKey, quality.minPlan);
  const allowedForPlan =
    isPlanAtLeast(planKey, rule.planRequired) &&
    planAllowsQuality &&
    getPlanByKey(planKey).qualityModes.includes(selectedQualityMode);

  return {
    actionType,
    label: rule.label,
    credits,
    planRequired: rule.planRequired,
    allowedForPlan,
    qualityMode: selectedQualityMode,
    abuseRisk: rule.abuseRisk,
    estimatedInternalCostEur: rule.estimatedInternalCostEur,
    minimumMarginRatio: rule.minimumMarginRatio,
  };
};

export const isPlanBudgetSafeForAction = ({
  planKey,
  actionType,
  qualityMode,
}: {
  planKey: PlanKey;
  actionType: BillingActionType;
  qualityMode?: QualityMode;
}) => {
  const rule = getCostRule(actionType);
  const budget = getPlanBudgetConfig(planKey);
  const cost = calculateCreditCost({ actionType, qualityMode, planKey });
  const estimatedRevenueEur = estimateCreditRevenueEur(planKey, cost.credits);
  const maxInternalCost = budget.maxEstimatedInternalCostPerActionEur;

  return {
    planKey,
    actionType,
    credits: cost.credits,
    estimatedRevenueEur,
    estimatedInternalCostEur: rule.estimatedInternalCostEur,
    profitability: estimateActionProfitability({ planKey, actionType, qualityMode }),
    withinSingleActionBudget: maxInternalCost === null || rule.estimatedInternalCostEur <= maxInternalCost,
    requiresConfirmation: cost.credits >= budget.expensiveActionConfirmationCredits || cost.abuseRisk === "high",
  };
};

export const buildUsagePreview = ({
  balance,
  actionType,
  qualityMode = "standard",
  planKey = "free",
}: {
  balance: number;
  actionType: BillingActionType;
  qualityMode?: QualityMode;
  planKey?: PlanKey;
}) => {
  const cost = calculateCreditCost({ actionType, qualityMode, planKey });
  const balanceAfter = balance - cost.credits;

  return {
    ...cost,
    balance,
    balanceAfter,
    hasEnoughCredits: balanceAfter >= 0,
    requiresConfirmation: cost.credits >= 10 || cost.abuseRisk === "high",
  };
};

export const simulateUsageSettlement = ({
  balance,
  estimatedCredits,
  status,
}: {
  balance: number;
  estimatedCredits: number;
  status: "succeeded" | "failed" | "cancelled" | "refunded";
}) => {
  if (status === "succeeded") {
    return {
      balance: Math.max(0, balance - estimatedCredits),
      charged: estimatedCredits,
      refunded: 0,
    };
  }

  if (status === "refunded") {
    return {
      balance: balance + estimatedCredits,
      charged: 0,
      refunded: estimatedCredits,
    };
  }

  return {
    balance,
    charged: 0,
    refunded: 0,
  };
};
