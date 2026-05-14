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
    description: "Tester Pixelrises sans risque, avec des limites anti-abus.",
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
    features: ["Test site IA", "Agent simple", "Historique court"],
    qualityModes: ["economy", "standard"],
  },
  {
    key: "starter",
    name: "Starter",
    description: "Usage leger pour creer et ameliorer un premier projet.",
    priceMonthlyEur: 19,
    stripePriceEnv: "STRIPE_PRICE_STARTER",
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
    features: ["Sites IA", "Ameliorations", "Agents simples", "Exports standards"],
    qualityModes: ["economy", "standard", "quality"],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Le meilleur equilibre pour lancer, iterer et convertir.",
    priceMonthlyEur: 49,
    stripePriceEnv: "STRIPE_PRICE_PRO",
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
    features: ["Builders complets", "Mode qualite", "Exports avances", "Historique et versions"],
    qualityModes: ["economy", "standard", "quality", "premium"],
  },
  {
    key: "business",
    name: "Business",
    description: "Usage intensif avec quotas plus hauts et marge protegee.",
    priceMonthlyEur: 149,
    stripePriceEnv: "STRIPE_PRICE_BUSINESS",
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
    features: ["Usage equipe", "Premium Multi-IA", "Alertes rentabilite", "Support prioritaire"],
    qualityModes: ["economy", "standard", "quality", "premium"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Contrat sur mesure, securite et quotas negocies.",
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
    features: ["Contrat dedie", "Quotas sur mesure", "Securite renforcee", "Accompagnement"],
    qualityModes: ["economy", "standard", "quality", "premium"],
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
    baseCost: 2,
    complexityLevel: "advanced",
    defaultQualityMode: "standard",
    multiAiRoles: 4,
    outputSize: "standard",
    safetyMargin: 0,
    planRequired: "free",
    maxUsagePerDay: 4,
    maxUsagePerMonth: 35,
    abuseRisk: "high",
    estimatedInternalCostEur: 0.35,
    minimumMarginRatio: 8,
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
    safetyMargin: 0,
    planRequired: "free",
    maxUsagePerDay: 12,
    maxUsagePerMonth: 120,
    abuseRisk: "medium",
    estimatedInternalCostEur: 0.08,
    minimumMarginRatio: 7,
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
    estimatedInternalCostEur: 0.1,
    minimumMarginRatio: 7,
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
    minimumMarginRatio: 10,
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
    estimatedInternalCostEur: 0.28,
    minimumMarginRatio: 8,
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
    estimatedInternalCostEur: 0.65,
    minimumMarginRatio: 9,
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
    estimatedInternalCostEur: 0.75,
    minimumMarginRatio: 9,
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
    estimatedInternalCostEur: 0.3,
    minimumMarginRatio: 8,
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
    estimatedInternalCostEur: 0.18,
    minimumMarginRatio: 8,
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

export const CREDIT_PACKS = [
  {
    key: "credits_100",
    label: "Pack 100 credits",
    credits: 100,
    priceEur: 19,
    status: "coming_soon",
  },
  {
    key: "credits_500",
    label: "Pack 500 credits",
    credits: 500,
    priceEur: 79,
    status: "coming_soon",
  },
  {
    key: "credits_1000",
    label: "Pack 1000 credits",
    credits: 1000,
    priceEur: 139,
    status: "coming_soon",
  },
] as const;

export const getPlanByKey = (planKey: PlanKey) =>
  BILLING_PLANS.find((plan) => plan.key === planKey) || BILLING_PLANS[0];

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
