import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  createAIChatCompletion,
  createAIImageGeneration,
} from "../_shared/ai-provider.ts";
import { getRequiredEnvMap } from "../_shared/env.ts";
import { sanitizeTextDeep } from "../_shared/text.ts";
import {
  AI_BUILDER_CURATED_PATTERNS,
  AI_BUILDER_INSPIRATIONS,
} from "./ai-builder-inspiration.ts";
import { NICEPAGE_TEMPLATE_INSPIRATIONS } from "./nicepage-inspiration.ts";
import { TEMPLATEMO_TEMPLATE_INSPIRATIONS } from "./templatemo-inspiration.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type FormPayload = {
  businessName: string;
  businessType: string;
  city: string;
  targetAudience: string;
  services: string;
  positioning: string;
  style: string;
  colors: string;
  objective: string;
  cta: string;
  description: string;
  enhancers?: string[];
  debugPromptOnly?: boolean;
  requestId?: string;
  idempotencyKey?: string;
  regenerate?: boolean;
  variationSeed?: string;
  siteId: string;
  currentVersion: number;
  improvementPrompt: string;
};

type RawSitePayload = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    promise: string;
    cta_primary: string;
    cta_secondary: string;
  };
  problem_solution: {
    title: string;
    problem: string;
    solution: string;
  };
  services: Array<{
    name: string;
    description: string;
    outcome: string;
  }>;
  benefits: Array<{
    title: string;
    description: string;
  }>;
  testimonials: Array<{
    name: string;
    role: string;
    text: string;
  }>;
  process: Array<{
    step: string;
    title: string;
    description: string;
  }>;
  reassurance: {
    title: string;
    content: string;
    items: string[];
  };
  local_seo: {
    title: string;
    content: string;
    items: string[];
  };
  faq: Array<{
    question: string;
    answer: string;
  }>;
  final_cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  metadata: {
    target_audience: string;
    conversion_goal: string;
    positioning: string;
    niche: string;
    offer: string;
    differentiators: string[];
    seo_keywords: string[];
    seo_title?: string;
    meta_description?: string;
  };
  design: {
    colors: {
      primary: string;
      secondary: string;
      surface: string;
      accent: string;
    };
    style: string;
    layout_type: string;
    animation_style: string;
    visual_direction: string;
    typography?: string;
    image_style?: string;
    spacing_style?: string;
    button_style?: string;
    card_style?: string;
    section_style?: string;
    mobile_behavior?: string;
    designArchetype?: string;
  };
  visuals: {
    accent_label: string;
    hero_scene: string;
    hero_alt: string;
    gallery: Array<{
      scene: string;
      alt: string;
    }>;
  };
  sectionOrder?: string[];
};

type GeneratedVisualAsset = {
  alt: string;
  prompt: string;
  url: string;
};

type GeneratedContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroEyebrow: string;
  heroPromise: string;
  heroSecondaryCta: string;
  trustBadges: string[];
  servicesTitle: string;
  servicesSubtitle: string;
  services: { name: string; description: string }[];
  benefitsTitle: string;
  benefits: { title: string; description: string }[];
  testimonials: { name: string; role: string; text: string }[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  processSteps: { step: string; title: string; description: string }[];
  faqItems: { question: string; answer: string }[];
  footerTagline: string;
  statsItems: { value: string; label: string }[];
  problemTitle: string;
  problemContent: string;
  reassuranceTitle: string;
  reassuranceContent: string;
  reassuranceItems: string[];
  localSeoTitle: string;
  localSeoContent: string;
  localSeoItems: string[];
  sectionOrder: string[];
  tone: string;
  urgencyHint: string;
  metadata: {
    targetAudience: string;
    conversionGoal: string;
    positioning: string;
    niche: string;
    offer: string;
    differentiators: string[];
    seoKeywords: string[];
    seoTitle: string;
    metaDescription: string;
  };
  design: {
    colors: {
      primary: string;
      secondary: string;
      surface: string;
      accent: string;
    };
    style: string;
    layout_type: string;
    animation_style: string;
    visual_direction: string;
    typography: string;
    image_style: string;
    spacing_style: string;
    button_style: string;
    card_style: string;
    section_style: string;
    mobile_behavior: string;
    designArchetype: string;
  };
  visuals: {
    accentLabel: string;
    hero: GeneratedVisualAsset;
    gallery: GeneratedVisualAsset[];
  };
};

type GeneratedSiteSummary = {
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  ctas: {
    primary: string;
    secondary: string;
    final: string;
  };
  design: {
    description: string;
    visualDirection: string;
    typography: string;
    images: string;
  };
  sections: string[];
};

const SECTION_IDS = [
  "hero",
  "problem_solution",
  "services",
  "benefits",
  "testimonials",
  "process",
  "reassurance",
  "local_seo",
  "faq",
  "final_cta",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

type ObjectiveMode =
  | "attirer-clients"
  | "generer-leads"
  | "renforcer-credibilite"
  | "prendre-rendez-vous"
  | "vendre-plus";

type ResolvedStructure = {
  objectiveMode: ObjectiveMode;
  sectionOrder: SectionId[];
  sectionRationale: string[];
  heroObjective: string;
  proofStyle: string;
  offerStyle: string;
  reassuranceStyle: string;
  ctaIntensity: string;
  allowedSections: SectionId[];
  prioritySections: SectionId[];
};

type BusinessProfile = {
  niche: string;
  positioning: string;
  targetAudience: string;
  conversionGoal: string;
  objectiveMode: ObjectiveMode;
  offer: string;
  primaryOfferAngle: string;
  premiumLevel: string;
  tone: string;
  serviceList: string[];
  isLocalIntent: boolean;
  localHook: string;
  visualDirection: string;
  layoutType: string;
  designArchetype: string;
  animationStyle: string;
  proofAngle: string;
  differentiators: string[];
  audiencePains: string[];
  audienceDesires: string[];
  objections: string[];
  proofAssets: string[];
  seoKeywords: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  imageStyle: string;
  palette: {
    primary: string;
    secondary: string;
    surface: string;
    accent: string;
  };
};

type UserVision = {
  originalBrief: string;
  businessType: string;
  niche: string;
  targetAudience: string;
  city: string;
  zone: string;
  mainGoal: string;
  desiredStyle: string;
  desiredColors: string[];
  desiredMood: string[];
  priceLevel: string;
  services: string[];
  offers: string[];
  desiredCTA: string;
  whatsappRequested: boolean;
  specificIdeas: string[];
  visualReferences: string[];
  conversionIntent: string;
  prioritySignals: string[];
  priority: string;
  explicitColors: string[];
  explicitAmbiance: string[];
  explicitStyleTerms: string[];
  explicitCta: string;
  explicitChannel: string;
  explicitCity: string;
  explicitTarget: string;
  explicitConstraints: string[];
  avoidTerms: string[];
  mustRespect: string[];
  missingHints: string[];
  hasStrongVisualDirection: boolean;
  hasStrongConversionDirection: boolean;
};

type BusinessAnalysisPayload = {
  niche: string;
  target_audience: string;
  conversion_goal: string;
  positioning: string;
  primary_offer: string;
  premium_level: string;
  tone: string;
  service_list: string[];
  local_hook: string;
  visual_direction: string;
  layout_type: string;
  animation_style: string;
  proof_angle: string;
  differentiators: string[];
  audience_pains: string[];
  audience_desires: string[];
  objections: string[];
  proof_assets: string[];
  seo_keywords: string[];
  cta_primary: string;
  cta_secondary: string;
  image_style: string;
};

type BusinessStrategyPayload = {
  promise: string;
  marketing_angle: string;
  site_hierarchy: string[];
  section_rationale: string[];
  visual_style: string;
  image_direction: string;
  animation_direction: string;
  writing_tone: string;
  hero_objective: string;
  primary_cta: string;
  secondary_cta: string;
  differentiation_hooks: string[];
  premium_signals: string[];
  avoid_sections: string[];
  priority_sections: string[];
};

type PromptBlueprintPayload = {
  headline_brief: string;
  conversion_requirements: string[];
  design_requirements: string[];
  image_requirements: string[];
  animation_requirements: string[];
  copy_requirements: string[];
  seo_requirements: string[];
  differentiation_requirements: string[];
  forbidden_patterns: string[];
  validation_checks: string[];
};

type GenerationStrategy = {
  promise: string;
  marketingAngle: string;
  objectiveMode: ObjectiveMode;
  siteHierarchy: string[];
  sectionRationale: string[];
  visualStyle: string;
  imageDirection: string;
  animationDirection: string;
  writingTone: string;
  heroObjective: string;
  primaryCta: string;
  secondaryCta: string;
  differentiationHooks: string[];
  premiumSignals: string[];
  avoidSections: string[];
  prioritySections: string[];
  allowedSections: string[];
  proofStyle: string;
  offerStyle: string;
  reassuranceStyle: string;
  ctaIntensity: string;
};

type PromptBlueprint = {
  headlineBrief: string;
  conversionRequirements: string[];
  designRequirements: string[];
  imageRequirements: string[];
  animationRequirements: string[];
  copyRequirements: string[];
  seoRequirements: string[];
  differentiationRequirements: string[];
  forbiddenPatterns: string[];
  validationChecks: string[];
};

const GENERATION_CREDIT_COST = 5;
const IMPROVEMENT_CREDIT_COST = 3;
const BUSINESS_ANALYSIS_MODEL = "google/gemini-3-flash-preview";
const BUSINESS_ANALYSIS_FALLBACK_MODELS = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
const SITE_GENERATION_MODEL = "google/gemini-3-pro-preview";
const SITE_GENERATION_FALLBACK_MODEL = "google/gemini-3-flash-preview";
const SITE_GENERATION_STABLE_FALLBACK_MODEL = "google/gemini-2.5-pro";
const SITE_GENERATION_FAST_FALLBACK_MODEL = "google/gemini-2.5-flash";
const SITE_GENERATION_LIGHT_FALLBACK_MODEL = "google/gemini-2.5-flash-lite";
const IMAGE_GENERATION_MODEL = "gemini-3-pro-image-preview";
const IMAGE_GENERATION_FALLBACK_MODEL = "gemini-2.5-flash-image";
const SITE_GENERATION_TEMPERATURE = 0.8;
const GENERATION_TOP_P = 0.9;
const GENERATION_MAX_TOKENS = 16000;
const PROMPT_VALIDATION_MAX_ATTEMPTS = 3;
const CONTENT_QUALITY_REPAIR_MAX_ATTEMPTS = 3;
const DASHBOARD_BASE_PATH = "/dashboard?tab=sites";
const MODEL_QUOTA_BACKOFF_MS = 60_000;
const ENABLE_AI_PLANNING = true;
const ENABLE_AI_IMAGE_GENERATION = false;
const modelQuotaBackoffUntil = new Map<string, number>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isAIQuotaStatus = (status: number) => status === 429 || status === 503;

const isAIQuotaMessage = (value: unknown) => {
  const message =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? value.message
        : "";

  return /quota|rate.?limit|resource_exhausted|too.?many.?requests|overloaded|unavailable|exceeded|429|503|satur/i.test(
    message,
  );
};

const isAIModelFallbackStatus = (status: number) =>
  isAIQuotaStatus(status) || status === 400 || status === 404;

const isAIModelFallbackMessage = (value: unknown) => {
  const message =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? value.message
        : "";

  return (
    isAIQuotaMessage(message) ||
    /model|not.?found|unsupported|not.?supported|permission|access|preview|endpoint|does not exist|invalid.*model/i.test(
      message,
    )
  );
};

const getSafeGenerationErrorMessage = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (isAIQuotaMessage(message)) {
    return "Le moteur IA est temporairement sature. Aucun credit n'a ete debite. Reessayez dans quelques instants.";
  }

  if (
    !message ||
    /Cannot read properties|TypeError|undefined|null|reading/i.test(message) ||
    message.length > 240 ||
    /googleapis|api\/docs|RESOURCE_EXHAUSTED|quotaMetric|quotaId|gemini|{\s*"/i.test(message)
  ) {
    return "La generation n'a pas pu se terminer correctement. Aucun credit n'a ete debite. Reessayez dans quelques instants.";
  }

  return message;
};

const createAIChatCompletionWithModelFallback = async (
  request: Record<string, unknown>,
  primaryModel: string,
  fallbackModels: string | string[],
) => {
  const attempts = [primaryModel, ...(Array.isArray(fallbackModels) ? fallbackModels : [fallbackModels])]
    .filter(Boolean);
  let lastFallbackResponse: Response | null = null;

  for (const model of attempts) {
    const backoffUntil = modelQuotaBackoffUntil.get(model) || 0;
    if (backoffUntil > Date.now()) {
      console.warn("Skipping AI analysis model still in quota backoff.", {
        model,
        retryInMs: backoffUntil - Date.now(),
      });
      continue;
    }

    const response = await createAIChatCompletion({
      ...request,
      model,
    });

    if (response.ok) {
      if (model !== primaryModel) {
        console.info("AI analysis fallback model used.", { model });
      }
      return response;
    }

    const errorText = await response
      .clone()
      .text()
      .catch(() => "");

    if (!isAIModelFallbackStatus(response.status) && !isAIModelFallbackMessage(errorText)) {
      return response;
    }

    lastFallbackResponse = response;
    modelQuotaBackoffUntil.set(model, Date.now() + MODEL_QUOTA_BACKOFF_MS);

    console.warn("AI analysis model unavailable or quota exceeded, trying next fallback.", {
      status: response.status,
      model,
      primaryModel,
    });
  }

  return (
    lastFallbackResponse ||
    json(
      {
        error:
          "Le moteur IA est temporairement sature. Aucun credit n'a ete debite. Reessayez dans quelques instants.",
      },
      503,
    )
  );
};

const buildPreviewPath = (siteId: string) => `/preview/${siteId}`;
const buildDashboardPath = (siteId: string, managerTab: "edit" | "publish" = "edit") =>
  `${DASHBOARD_BASE_PATH}&manage=${siteId}&managerTab=${managerTab}`;
const buildPublicPath = (slug: string | null) => (slug ? `/s/${slug}` : null);

const normalizeText = (value: unknown, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || fallback;
};

const normalizeMinimumText = (value: unknown, fallback: string, minLength: number) => {
  const cleaned = normalizeText(value);
  return cleaned.length >= minLength ? cleaned : fallback;
};

const normalizeList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => normalizeText(item))
        .filter(Boolean)
    : [];

const splitServices = (value: string) =>
  value
    .split(/[\n,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const isPromptLikeServiceValue = (value: string) => {
  const key = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return (
    key.length > 70 &&
    /\b(cree|creer|generer|site|landing|page|prompt|pixelrises|lovable|objectif|style|cta|cible|brief)\b/.test(key)
  );
};

const getCleanServiceList = (value: string) =>
  splitServices(value).filter((item) => !isPromptLikeServiceValue(item));

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const hashString = (value: string) =>
  value.split("").reduce((hash, char) => {
    const nextHash = (hash << 5) - hash + char.charCodeAt(0);
    return nextHash | 0;
  }, 0);

const rotateItems = <T,>(items: T[], seed: string) => {
  if (items.length <= 1) return items;
  const offset = Math.abs(hashString(seed)) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

const toSectionIdList = (items: string[]) =>
  unique(items.map((item) => normalizeKey(item).replace(/\s+/g, "_")))
    .filter((item): item is SectionId => SECTION_IDS.includes(item as SectionId));

const pickNiche = (form: Required<FormPayload>) => {
  const source = `${form.businessType} ${form.services} ${form.description}`.toLowerCase();

  if (/restaurant|brasserie|traiteur|food|pizza|cafe|boulanger|patisserie/.test(source)) return "restaurant";
  if (/paris sportif|pari sportif|pronostic|pronostics|tipster|betting|bookmaker|cote sportive|cotes sportives|prono foot|telegram vip|analyses sportives|analyse sportive/.test(source)) return "sports-betting-advice";
  if (/formation|ecole|ecole|cours|tutorat|mentor|coaching pro|bootcamp|elearning|e-learning|apprentissage|academie|academie/.test(source)) return "education-training";
  if (/hotel|hotel|gite|gite|chambre d.hote|chambre d.hote|conciergerie|tourisme|voyage|sejour|sejour|location saisonniere|location saisonniere|airbnb/.test(source)) return "travel-hospitality";
  if (/photographe|photographie|shooting|portrait|studio photo|reportage photo|seance photo|seance photo/.test(source)) return "creative-services";
  if (/evenement|evenement|mariage|dj|concert|festival|spectacle|traiteur evenementiel|photobooth|animation/.test(source)) return "events-entertainment";
  if (/saas|logiciel|application|app mobile|plateforme|startup|outil digital|api|crm|erp|solution logicielle/.test(source)) return "saas-tech";
  if (/personal brand|marque personnelle|influenceur|createur de contenu|createur de contenu|auteur|conference|conference|speaker|consultant independant|consultant independant/.test(source)) return "personal-brand";
  if (/massage|bien etre|bien-etre|sophrologue|therapie|therapie|relaxation|meditation|meditation|naturopathe/.test(source)) return "wellness";
  if (/garage|mecanique|mecanique|carrosserie|detailing|lavage auto|pneu|pneus|reparation auto|reparation auto/.test(source)) return "automotive-services";
  if (/animal|animaux|chien|chat|toilettage|pension canine|educateur canin|educateur canin|veterinaire|veterinaire/.test(source)) return "pet-services";
  if (/coach|fitness|sport|yoga|pilates|nutrition/.test(source)) return "coach";
  if (/immobilier|agence immobiliere|mandat|estimation|vente|achat/.test(source)) return "immobilier";
  if (/location de voiture|location voiture|voiture de location|vehicule de location|vehicule de location|loueur auto|rent car|car rental|utilitaire/.test(source)) return "car-rental";
  if (/e-commerce|boutique|eshop|shop|produit/.test(source)) return "ecommerce";
  if (/medecin|dentiste|kine|osteopathe|sante|cabinet medical/.test(source)) return "medical";
  if (/beaute|coiffeur|barbier|spa|esthetique|onglerie/.test(source)) return "beauty";
  if (/avocat|notaire|comptable|conseil|cabinet|juridique|finance/.test(source)) return "professional-services";
  if (/plombier|electricien|artisan|renovation|garage|carrosserie|serrurier|depannage/.test(source)) return "local-services";
  if (/photographe|video|studio|creation|design|agence|marketing|seo|developp/.test(source)) return "creative-services";

  return "general-business";
};

const CANONICAL_NICHES = [
  "restaurant",
  "sports-betting-advice",
  "education-training",
  "travel-hospitality",
  "events-entertainment",
  "saas-tech",
  "personal-brand",
  "wellness",
  "automotive-services",
  "pet-services",
  "coach",
  "immobilier",
  "car-rental",
  "ecommerce",
  "medical",
  "beauty",
  "professional-services",
  "local-services",
  "creative-services",
  "industrial",
  "general-business",
] as const;

const canonicalizeNiche = (
  value: string,
  fallback: string,
  form?: Required<FormPayload>,
) => {
  const key = normalizeKey(value);
  const fallbackKey = normalizeKey(fallback);
  const formNiche = form ? pickNiche(form) : "";

  if (formNiche && formNiche !== "general-business") return formNiche;

  if (CANONICAL_NICHES.includes(value as (typeof CANONICAL_NICHES)[number])) return value;
  if (CANONICAL_NICHES.includes(fallback as (typeof CANONICAL_NICHES)[number])) {
    if (!key || key === "general business") return fallback;
  }

  if (/\brestaurant|brasserie|bistro|table|gastronomie|pizzeria|cuisine|traiteur|food|cafe|menu\b/.test(key)) return "restaurant";
  if (/\bparis sportif|pari sportif|pronostic|tipster|betting|bookmaker|cote sportive|prono\b/.test(key)) return "sports-betting-advice";
  if (/\bformation|education|academy|academie|cours|ecole|bootcamp|learning|apprentissage|tutorat\b/.test(key)) return "education-training";
  if (/\bhotel|gite|sejour|voyage|tourisme|airbnb|conciergerie|location saisonniere\b/.test(key)) return "travel-hospitality";
  if (/\bevenement|mariage|dj|concert|festival|spectacle|photobooth|animation\b/.test(key)) return "events-entertainment";
  if (/\bsaas|logiciel|application|app|plateforme|startup|api|crm|erp|software\b/.test(key)) return "saas-tech";
  if (/\bpersonal brand|marque personnelle|influenceur|createur|auteur|speaker|conference\b/.test(key)) return "personal-brand";
  if (/\bmassage|bien etre|sophrologue|therapie|relaxation|meditation|naturopathe\b/.test(key)) return "wellness";
  if (/\bgarage|mecanique|carrosserie|detailing|lavage auto|pneu|reparation auto\b/.test(key)) return "automotive-services";
  if (/\banimal|animaux|chien|chat|toilettage|pension canine|educateur canin|veterinaire\b/.test(key)) return "pet-services";
  if (/\bcoach|coaching|fitness|sport|yoga|pilates|nutrition|entrainement\b/.test(key)) return "coach";
  if (/\bimmobilier|agence immobiliere|mandat|estimation|vente de bien|achat de bien|appartement|maison\b/.test(key)) return "immobilier";
  if (/\blocation de voiture|location voiture|voiture de location|vehicule de location|loueur auto|car rental|rent car|utilitaire\b/.test(key)) return "car-rental";
  if (/\be commerce|ecommerce|boutique|eshop|shop|produit|vente en ligne\b/.test(key)) return "ecommerce";
  if (/\bmedecin|dentiste|kine|osteopathe|sante|cabinet medical|patient\b/.test(key)) return "medical";
  if (/\bbeaute|coiffeur|barbier|spa|esthetique|onglerie|soin visage|institut\b/.test(key)) return "beauty";
  if (/\bavocat|notaire|comptable|conseil|cabinet|juridique|finance|consultant\b/.test(key)) return "professional-services";
  if (/\bplombier|electricien|artisan|renovation|serrurier|depannage|intervention locale\b/.test(key)) return "local-services";
  if (/\bphotographe|photographie|shooting|portrait|studio photo|reportage photo|seance photo|video|design|agence creative|portfolio\b/.test(key)) return "creative-services";
  if (/\bindustrie|industriel|usine|production|fabrication|btp|chantier\b/.test(key)) return "industrial";

  if (CANONICAL_NICHES.includes(fallbackKey as (typeof CANONICAL_NICHES)[number])) return fallbackKey;
  return form ? pickNiche(form) : "general-business";
};

const resolvePositioning = (form: Required<FormPayload>) => {
  const explicit = normalizeText(form.positioning).toLowerCase();
  if (/premium|haut de gamme|luxe/.test(explicit)) return "premium";
  if (/accessible|simple|essentiel/.test(explicit)) return "accessible";

  const source = `${form.style} ${form.colors} ${form.description}`.toLowerCase();
  if (/premium|luxe|haut de gamme|elegant|or|noir/.test(source)) return "premium";
  if (/accessible|simple|efficace|direct|rapide/.test(source)) return "accessible";
  return "professionnel";
};

const resolveConversionGoal = (form: Required<FormPayload>) => {
  const source = `${form.objective} ${form.cta}`.toLowerCase();
  if (/rendez-vous|rdv|r\u00e9servation|reserver/.test(source)) return "prise de rendez-vous";
  if (/lead|devis|contact|demande/.test(source)) return "generation de demandes qualifiees";
  if (/vente|acheter|commande|panier/.test(source)) return "vente";
  return "prise de contact";
};

const resolveObjectiveMode = (form: Required<FormPayload>): ObjectiveMode => {
  const source = `${form.objective} ${form.cta}`.toLowerCase();
  if (/rendez-vous|rdv|r\u00e9servation|reserver/.test(source)) return "prendre-rendez-vous";
  if (/lead|devis|contact|demande/.test(source)) return "generer-leads";
  if (/credibilite|confiance|autorite/.test(source)) return "renforcer-credibilite";
  if (/vente|vendre|acheter|commande|panier/.test(source)) return "vendre-plus";
  return "attirer-clients";
};

const buildPalette = (niche: string, positioning: string, seed = "", colorHint = "") => {
  const colorKey = normalizeText(colorHint).toLowerCase();
  if (/(rose|pink)/i.test(colorKey) && /(violet|purple|lavande|lilac)/i.test(colorKey)) {
    return {
      primary: "#EC4899",
      secondary: "#C084FC",
      surface: "#130817",
      accent: "#FDF2F8",
    };
  }
  if (/(tiktok|tik tok|neon|neon)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return {
      primary: "#FF2D75",
      secondary: "#24F4EE",
      surface: "#050508",
      accent: "#FFF1F7",
    };
  }
  if (/(rose|pink)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#EC4899", secondary: "#FBCFE8", surface: "#160A12", accent: "#FDF2F8" };
  }
  if (/(noir|black).*(or|gold|dor[e?])|(or|gold|dor[e?]).*(noir|black)/i.test(colorKey)) {
    return {
      primary: "#D4AF37",
      secondary: "#F4E6B4",
      surface: "#0B0B0B",
      accent: "#FFF7DD",
    };
  }
  if (/(bleu|blue)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#3B82F6", secondary: "#BFDBFE", surface: "#07111F", accent: "#EFF6FF" };
  }
  if (/(vert|green)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#22C55E", secondary: "#CFF9DA", surface: "#07140B", accent: "#F0FDF4" };
  }
  if (/(rouge|red)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#EF4444", secondary: "#FECACA", surface: "#170B0B", accent: "#FEF2F2" };
  }
  if (/(violet|purple)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#8B5CF6", secondary: "#DDD6FE", surface: "#100D1E", accent: "#F5F3FF" };
  }
  if (/(orange|ambre|amber)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#F97316", secondary: "#FED7AA", surface: "#17110D", accent: "#FFF1E8" };
  }
  if (/(beige|creme|cr[e?]me|sable|ivoire|cream)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#C89B47", secondary: "#F3E2C2", surface: "#15120D", accent: "#FFF9EA" };
  }
  if (/(blanc|white|clair|clean)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#111827", secondary: "#E5E7EB", surface: "#F8FAFC", accent: "#FFFFFF" };
  }
  if (/(gris|gray|grey|argent|silver)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#64748B", secondary: "#CBD5E1", surface: "#0F172A", accent: "#F8FAFC" };
  }
  if (/(turquoise|cyan|aqua)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#06B6D4", secondary: "#A5F3FC", surface: "#07151A", accent: "#ECFEFF" };
  }
  if (/(jaune|yellow)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#EAB308", secondary: "#FEF08A", surface: "#171407", accent: "#FEFCE8" };
  }
  if (/(marron|brown|terre|terracotta)/i.test(colorKey) && !/(auto|aucune)/i.test(colorKey)) {
    return { primary: "#A16207", secondary: "#F3D3A2", surface: "#171109", accent: "#FFF7ED" };
  }

  const paletteVariants: Record<string, Array<{ primary: string; secondary: string; surface: string; accent: string }>> = {
    restaurant: [
      { primary: "#C96E3B", secondary: "#F5D8BE", surface: "#171513", accent: "#FFF5EB" },
      { primary: "#A53E2B", secondary: "#F3B59B", surface: "#1A1110", accent: "#FFF0EA" },
      { primary: "#7D5A33", secondary: "#EFD3AA", surface: "#15120E", accent: "#FFF7EA" },
    ],
    coach: [
      { primary: "#1E9AFE", secondary: "#C9E5FF", surface: "#0E1622", accent: "#EAF5FF" },
      { primary: "#F26B3A", secondary: "#FFD3C2", surface: "#17100D", accent: "#FFF0EA" },
      { primary: "#7ED957", secondary: "#D9F8C8", surface: "#0E170F", accent: "#F1FFE9" },
    ],
    immobilier: [
      { primary: "#D2A55A", secondary: "#F3E2C2", surface: "#12161D", accent: "#FCF6EB" },
      { primary: "#6E8FBF", secondary: "#DCE8F8", surface: "#0F1720", accent: "#F2F7FF" },
      { primary: "#A47C4B", secondary: "#E9D4B5", surface: "#15120F", accent: "#FFF7EA" },
    ],
    "car-rental": [
      { primary: "#F1B84B", secondary: "#FFE6AE", surface: "#11151B", accent: "#FFF7DE" },
      { primary: "#45A3FF", secondary: "#CDE8FF", surface: "#0D1420", accent: "#ECF7FF" },
      { primary: "#F97316", secondary: "#FED7AA", surface: "#17110D", accent: "#FFF1E8" },
    ],
    "sports-betting-advice": [
      { primary: "#7ED957", secondary: "#D9F8C8", surface: "#07120B", accent: "#F1FFE9" },
      { primary: "#D4AF37", secondary: "#F4E6B4", surface: "#0D0D0F", accent: "#FFF7DD" },
      { primary: "#38BDF8", secondary: "#CFF1FF", surface: "#07121A", accent: "#EFFBFF" },
    ],
    "education-training": [
      { primary: "#6366F1", secondary: "#DADAFE", surface: "#111225", accent: "#F2F2FF" },
      { primary: "#F59E0B", secondary: "#FDE2A8", surface: "#17120A", accent: "#FFF7E5" },
      { primary: "#14B8A6", secondary: "#C9F4EE", surface: "#091716", accent: "#ECFFFC" },
    ],
    "travel-hospitality": [
      { primary: "#D4AF37", secondary: "#F4E6B4", surface: "#11100B", accent: "#FFF9E7" },
      { primary: "#0EA5E9", secondary: "#CDEFFF", surface: "#07131C", accent: "#F0FBFF" },
      { primary: "#C084FC", secondary: "#E9D5FF", surface: "#140D1D", accent: "#FAF5FF" },
    ],
    "events-entertainment": [
      { primary: "#F43F5E", secondary: "#FBCFE8", surface: "#1A0B12", accent: "#FFF1F5" },
      { primary: "#F59E0B", secondary: "#FDE68A", surface: "#17110A", accent: "#FFF8DB" },
      { primary: "#8B5CF6", secondary: "#DDD6FE", surface: "#110E1B", accent: "#F5F3FF" },
    ],
    "saas-tech": [
      { primary: "#60A5FA", secondary: "#DBEAFE", surface: "#07111F", accent: "#EFF6FF" },
      { primary: "#22D3EE", secondary: "#CFFAFE", surface: "#071416", accent: "#ECFEFF" },
      { primary: "#A78BFA", secondary: "#EDE9FE", surface: "#100D1E", accent: "#F5F3FF" },
    ],
    "personal-brand": [
      { primary: "#D4AF37", secondary: "#F4E6B4", surface: "#111111", accent: "#FFF7DD" },
      { primary: "#F97316", secondary: "#FED7AA", surface: "#17100D", accent: "#FFF1E8" },
      { primary: "#EC4899", secondary: "#FBCFE8", surface: "#170B13", accent: "#FFF1F7" },
    ],
    wellness: [
      { primary: "#34D399", secondary: "#C7F7DF", surface: "#091713", accent: "#ECFDF5" },
      { primary: "#C084FC", secondary: "#E9D5FF", surface: "#140D1D", accent: "#FAF5FF" },
      { primary: "#F0ABFC", secondary: "#F5D0FE", surface: "#170D18", accent: "#FDF4FF" },
    ],
    "automotive-services": [
      { primary: "#F97316", secondary: "#FED7AA", surface: "#15100C", accent: "#FFF1E8" },
      { primary: "#38BDF8", secondary: "#CFF1FF", surface: "#07121A", accent: "#EFFBFF" },
      { primary: "#EAB308", secondary: "#FDE68A", surface: "#151307", accent: "#FFF8DB" },
    ],
    "pet-services": [
      { primary: "#F59E0B", secondary: "#FDE2A8", surface: "#17120A", accent: "#FFF7E5" },
      { primary: "#22C55E", secondary: "#CFF9DA", surface: "#0A160D", accent: "#F0FDF4" },
      { primary: "#60A5FA", secondary: "#DBEAFE", surface: "#07111F", accent: "#EFF6FF" },
    ],
    ecommerce: [
      { primary: "#7C5CFF", secondary: "#DDD5FF", surface: "#10111A", accent: "#F3F0FF" },
      { primary: "#F05A7E", secondary: "#FFD2DE", surface: "#190F15", accent: "#FFF0F5" },
      { primary: "#23C6A7", secondary: "#C6F5EC", surface: "#0E1716", accent: "#EFFFFB" },
    ],
    medical: [
      { primary: "#16A3A0", secondary: "#C6F1EF", surface: "#0F1718", accent: "#ECFEFD" },
      { primary: "#5B8DEF", secondary: "#D7E4FF", surface: "#101722", accent: "#F1F6FF" },
    ],
    beauty: [
      { primary: "#C26BAA", secondary: "#F1CEE7", surface: "#181219", accent: "#FFF3FB" },
      { primary: "#D8A04F", secondary: "#F4D9AE", surface: "#17120E", accent: "#FFF7EA" },
      { primary: "#B76E79", secondary: "#F2C9D0", surface: "#171012", accent: "#FFF2F4" },
    ],
    "professional-services": [
      { primary: "#4F7DFF", secondary: "#D3E0FF", surface: "#0F1622", accent: "#EEF4FF" },
      { primary: "#C89B47", secondary: "#F1DEB8", surface: "#12151B", accent: "#FFF8E8" },
      { primary: "#2BB7A8", secondary: "#C9F1EC", surface: "#0E1717", accent: "#F0FFFC" },
    ],
    "local-services": [
      { primary: "#F08D31", secondary: "#F9D5B4", surface: "#171411", accent: "#FFF4E8" },
      { primary: "#2F80ED", secondary: "#CFE3FF", surface: "#0F1520", accent: "#F0F7FF" },
      { primary: "#EAB308", secondary: "#FDE68A", surface: "#16140B", accent: "#FFF9D9" },
    ],
    "creative-services": [
      { primary: "#6E7BFF", secondary: "#D9DEFF", surface: "#10111B", accent: "#EEF0FF" },
      { primary: "#E85D9E", secondary: "#F8CDE1", surface: "#17101A", accent: "#FFF0F7" },
      { primary: "#35D0BA", secondary: "#C9F7EE", surface: "#0C1718", accent: "#EFFFFB" },
    ],
    "general-business": [
      { primary: "#4E84FF", secondary: "#D6E4FF", surface: "#101522", accent: "#EFF4FF" },
      { primary: "#D4AF37", secondary: "#F4E6B4", surface: "#11151C", accent: "#FFF7DD" },
      { primary: "#23C6A7", secondary: "#C6F5EC", surface: "#0E1716", accent: "#EFFFFB" },
    ],
  };

  const variants = paletteVariants[niche] || paletteVariants["general-business"];
  const base = variants[Math.abs(hashString(seed || niche)) % variants.length];

  if (positioning !== "premium") {
    return base;
  }

  // Premium should feel elevated without forcing every generated site into the same black/gold skin.
  const premiumAccents: Record<string, Partial<typeof base>> = {
    restaurant: { primary: "#B86B42", secondary: "#F2C9A6", accent: "#FFF1E5" },
    coach: { primary: "#35A7FF", secondary: "#BFE7FF", accent: "#EBF8FF" },
    immobilier: { primary: "#C99A4A", secondary: "#F1DEC0", accent: "#FFF8EC" },
    "car-rental": { primary: "#F0B64C", secondary: "#FFE1A3", accent: "#FFF6D9" },
    "sports-betting-advice": { primary: "#7ED957", secondary: "#D9F8C8", accent: "#F1FFE9" },
    "education-training": { primary: "#7C7CFF", secondary: "#E0E0FF", accent: "#F4F4FF" },
    "travel-hospitality": { primary: "#D7B45A", secondary: "#F4E7BF", accent: "#FFF9EA" },
    "events-entertainment": { primary: "#F65F7A", secondary: "#FBD4DF", accent: "#FFF2F6" },
    "saas-tech": { primary: "#7CB8FF", secondary: "#E0EEFF", accent: "#F2F8FF" },
    "personal-brand": { primary: "#D7B45A", secondary: "#F4E7BF", accent: "#FFF9EA" },
    wellness: { primary: "#49D99A", secondary: "#D0F8E5", accent: "#F1FFF8" },
    "automotive-services": { primary: "#FF8A3D", secondary: "#FFD6BA", accent: "#FFF2E8" },
    "pet-services": { primary: "#F6A92A", secondary: "#FCE5B0", accent: "#FFF8E8" },
    ecommerce: { primary: "#8E6CFF", secondary: "#E2DAFF", accent: "#F6F2FF" },
    medical: { primary: "#22B8B2", secondary: "#C6F5F1", accent: "#F0FFFD" },
    beauty: { primary: "#D274B8", secondary: "#F4CDE9", accent: "#FFF2FB" },
    "professional-services": { primary: "#7193FF", secondary: "#DCE6FF", accent: "#F2F6FF" },
    "local-services": { primary: "#EE8E38", secondary: "#F9D4B3", accent: "#FFF2E7" },
    "creative-services": { primary: "#7A82FF", secondary: "#DDE1FF", accent: "#F2F4FF" },
  };

  return {
    ...base,
    ...(premiumAccents[niche] || {}),
    surface: base.surface,
  };
};

const DESIGN_ARCHETYPES_BY_NICHE: Record<string, string[]> = {
  restaurant: ["immersive-restaurant-story", "editorial-menu-reservation", "warm-local-proof", "chef-table-editorial", "neighborhood-booking-map", "menu-proof-bento"],
  coach: ["dynamic-transformation-path", "bento-coach-program", "proof-first-coaching", "high-energy-hero-track", "before-after-goal-stack", "coach-calendar-conversion"],
  immobilier: ["premium-property-authority", "local-estimation-stack", "editorial-agency-trust", "property-led-showcase", "seller-valuation-flow", "neighborhood-trust-map"],
  "car-rental": ["fast-booking-showcase", "fleet-bento-reservation", "urban-mobility-split", "mobile-reservation-tunnel", "fleet-comparison-stack", "city-drive-editorial"],
  "sports-betting-advice": ["responsible-analysis-desk", "community-data-hub", "method-first-sports"],
  "education-training": ["learning-path-dashboard", "program-bento-grid", "mentor-proof-stack"],
  "travel-hospitality": ["cinematic-stay-story", "booking-experience-split", "destination-proof-rail"],
  "events-entertainment": ["event-energy-showcase", "format-bento-flow", "cinematic-moment-stack"],
  "saas-tech": ["product-bento-dashboard", "use-case-conversion-grid", "security-proof-product"],
  "personal-brand": ["editorial-authority-profile", "method-led-personal-brand", "content-proof-stack"],
  wellness: ["calm-trust-sanctuary", "appointment-wellness-flow", "sensory-proof-stack"],
  "automotive-services": ["garage-diagnostic-stack", "before-after-service-flow", "technical-trust-grid"],
  "pet-services": ["pet-care-trust-path", "warm-service-bento", "safety-first-animal-care"],
  ecommerce: ["product-showcase-conversion", "offer-bento-storefront", "proof-led-product-page"],
  medical: ["clinical-trust-minimal", "appointment-care-flow", "reassurance-first-health"],
  beauty: ["beauty-editorial-gallery", "transformation-service-flow", "premium-salon-showcase"],
  "professional-services": ["authority-consulting-stack", "method-proof-editorial", "local-expert-conversion"],
  "local-services": ["local-proof-action-stack", "intervention-flow-grid", "urgent-service-conversion"],
  "creative-services": ["portfolio-editorial-impact", "visual-proof-bento", "brand-transformation-story", "full-bleed-portfolio-story", "studio-proof-gallery", "booking-session-editorial"],
  "general-business": ["clear-offer-bento", "proof-first-business", "conversion-story-split", "quiet-premium-white-space", "bold-social-conversion", "editorial-luxury-flow", "local-action-map", "conversion-offer-ladder", "magazine-proof-grid"],
};

const DESIGN_ARCHETYPE_GUIDES: Record<string, string> = {
  "immersive-restaurant-story": "hero tres visuel, ambiance de lieu, carte/experience puis reservation visible",
  "editorial-menu-reservation": "composition editoriale avec menu, moments forts et CTA de reservation proche",
  "warm-local-proof": "preuve locale, avis et experience rassurante avant l'offre",
  "dynamic-transformation-path": "parcours de transformation rythme, preuves de progression et CTA rendez-vous",
  "bento-coach-program": "bento de programme, methode, objectifs et suivi personnel",
  "proof-first-coaching": "preuve et methode placees tres tot pour rassurer avant le contact",
  "premium-property-authority": "hero immobilier premium, estimation, biens et autorite locale",
  "local-estimation-stack": "estimation et methode locale en pile claire, forte reassurance",
  "editorial-agency-trust": "agence immobiliere editoriale, preuves, accompagnement et qualite de biens",
  "fast-booking-showcase": "reservation rapide, vehicule mis en avant, disponibilite et etapes courtes",
  "fleet-bento-reservation": "grille flotte/options, conditions claires et CTA reservation repete",
  "urban-mobility-split": "split hero urbain, simplicite mobile, remise des cles et mobilite",
  "responsible-analysis-desk": "tableau d'analyse responsable, methode, 18+ et aucun gain garanti",
  "community-data-hub": "communaute, calendrier, analyses et discipline sans promesse de gain",
  "method-first-sports": "methode d'analyse avant offres, transparence et pedagogie sportive",
  "learning-path-dashboard": "parcours pedagogique, modules, progression et preuves d'apprentissage",
  "program-bento-grid": "modules en bento, format, duree, accompagnement et CTA inscription",
  "mentor-proof-stack": "mentor, methode et resultats realistes places avant l'offre",
  "cinematic-stay-story": "hero immersif, experience, lieu, details sensoriels et reservation",
  "booking-experience-split": "split reservation/experience, conditions et disponibilite visibles",
  "destination-proof-rail": "rail de preuves locales, avis, acces et contexte destination",
  "event-energy-showcase": "hero evenementiel energique, formats, ambiance et demande de devis",
  "format-bento-flow": "formats d'evenements en bento, deroule et disponibilite",
  "cinematic-moment-stack": "moments forts en sequence, preuve visuelle et CTA devis",
  "product-bento-dashboard": "bento produit, cas d'usage, benefices et CTA demo",
  "use-case-conversion-grid": "grille cas d'usage, integrations, preuve produit et conversion",
  "security-proof-product": "fiabilite, securite, donnees et demonstration produit",
  "editorial-authority-profile": "profil editorial, expertise, methode et contact qualifie",
  "method-led-personal-brand": "methode personnelle en premier, preuve et offre signature",
  "content-proof-stack": "preuves de contenu, prises de parole et resultats credibles",
  "calm-trust-sanctuary": "rythme calme, soin, cadre et prise de rendez-vous rassurante",
  "appointment-wellness-flow": "deroule rendez-vous, benefice ressenti, cadre et FAQ confiance",
  "sensory-proof-stack": "preuves sensorielles, environnement, approche et reassurance",
  "garage-diagnostic-stack": "diagnostic, transparence, delai et resultat avant/apres",
  "before-after-service-flow": "intervention en etapes, avant/apres implicite et devis",
  "technical-trust-grid": "grille prestations techniques, preuves terrain et CTA devis",
  "pet-care-trust-path": "securite animale, conditions, soin et relation proprietaire",
  "warm-service-bento": "prestations chaleureuses, garanties, cadre et contact simple",
  "safety-first-animal-care": "securite, suivi, environnement propre et preuve de confiance",
  "product-showcase-conversion": "produit en vedette, benefices, preuve et achat rapide",
  "offer-bento-storefront": "offres en bento, reassurance paiement/livraison et CTA achat",
  "proof-led-product-page": "preuves produit, objections et benefices avant l'achat",
  "clinical-trust-minimal": "sobriete clinique, reassurance, prise de rendez-vous et clarte",
  "appointment-care-flow": "parcours de soin, disponibilite, garanties et FAQ patient",
  "reassurance-first-health": "reassurance sante placee haut, ton sobre et action simple",
  "beauty-editorial-gallery": "galerie editoriale, resultat, experience et reservation",
  "transformation-service-flow": "transformation, prestations, avant/apres implicite et CTA",
  "premium-salon-showcase": "salon premium, ambiance, prestations et preuve visuelle",
  "authority-consulting-stack": "autorite, methode, preuves et demande de diagnostic",
  "method-proof-editorial": "editorial de methode, cas, objections et prise de contact",
  "local-expert-conversion": "expertise locale, preuves, services et CTA devis/contact",
  "local-proof-action-stack": "zone, delai, avis, intervention et CTA immediat",
  "intervention-flow-grid": "prestations terrain, process en trois etapes et preuve",
  "urgent-service-conversion": "urgence maitrisee, contact rapide, disponibilite et confiance",
  "portfolio-editorial-impact": "portfolio editorial, preuves visuelles et transformation",
  "visual-proof-bento": "bento creatif, livrables, resultats et differenciation",
  "brand-transformation-story": "avant/apres de marque, methode, preuve et CTA projet",
  "clear-offer-bento": "offre structuree en bento, benefices, preuves et CTA clair",
  "proof-first-business": "preuve des le haut, services et reassurance avant CTA",
  "conversion-story-split": "narration split hero, probleme, offre et conversion",
  "chef-table-editorial": "experience editoriale type table du chef, ambiance, signature culinaire et reservation",
  "neighborhood-booking-map": "restaurant local avec quartier, acces, horaires, preuves de proximite et reservation",
  "menu-proof-bento": "menu en bento, plats signatures, formats sur place/emporter/evenement et avis utiles",
  "high-energy-hero-track": "hero sportif energique, trajectoire d'objectif, CTA seance et preuve de methode",
  "before-after-goal-stack": "pile objectifs, obstacles, methode, progression realiste et prise de rendez-vous",
  "coach-calendar-conversion": "parcours coaching + disponibilites, choix du format et CTA seance visible",
  "property-led-showcase": "bien/estimation en vedette, preuve locale, accompagnement et contact qualifie",
  "seller-valuation-flow": "parcours vendeur, estimation, methode de commercialisation et rassurance mandat",
  "neighborhood-trust-map": "expertise quartier, preuves locales, typologies de biens et demande d'estimation",
  "mobile-reservation-tunnel": "reservation voiture mobile-first, choix vehicule, conditions, WhatsApp et disponibilite",
  "fleet-comparison-stack": "comparaison de flotte, usages, prix/conditions sans invention et CTA direct",
  "city-drive-editorial": "experience de conduite urbaine, contextes d'usage, retrait simple et SEO local",
  "full-bleed-portfolio-story": "portfolio immersif, preuves visuelles, intention artistique et CTA projet",
  "studio-proof-gallery": "galerie studio, livrables, processus, temoignages et preuve de qualite",
  "booking-session-editorial": "session/booking en hero, styles de prestation, deroule et CTA rendez-vous",
  "quiet-premium-white-space": "premium calme, beaucoup d'espace, titres courts, preuve fine et CTA sobre",
  "bold-social-conversion": "direction jeune/sociale, couleurs audacieuses, rythme rapide et CTA tres visible",
  "editorial-luxury-flow": "flow editorial haut de gamme, visuels larges, rarete, confiance et action selective",
  "local-action-map": "ancrage local, zone, proximite, preuve terrain et contact immediat",
  "conversion-offer-ladder": "offre par paliers, benefices, objections traitees et CTA final direct",
  "magazine-proof-grid": "composition magazine, blocs preuves, citations, detail metier et hierarchie forte",
};

const selectDesignArchetype = (
  form: Required<FormPayload>,
  niche: string,
  positioning: string,
  objectiveMode: ObjectiveMode,
) => {
  const styleKey = normalizeText(`${form.style} ${form.colors} ${form.enhancers.join(" ")}`).toLowerCase();
  const base = DESIGN_ARCHETYPES_BY_NICHE[niche] || DESIGN_ARCHETYPES_BY_NICHE["general-business"];
  const objectiveHints: Partial<Record<ObjectiveMode, string[]>> = {
    "prendre-rendez-vous": ["appointment-wellness-flow", "booking-experience-split", "fast-booking-showcase"],
    "vendre-plus": ["product-showcase-conversion", "offer-bento-storefront", "proof-led-product-page"],
    "renforcer-credibilite": ["proof-first-business", "authority-consulting-stack", "method-proof-editorial"],
    "generer-leads": ["conversion-story-split", "use-case-conversion-grid", "local-expert-conversion"],
  };
  const styleHints = [
    /minimal|sobre/.test(styleKey) ? "quiet-premium-white-space" : "",
    /premium|haut de gamme|luxe/.test(styleKey) ? "editorial-luxury-flow" : "",
    /dynamique|rythme|impact|tiktok|tik tok|jeune|social/.test(styleKey) ? "bold-social-conversion" : "",
    /local|ville|proximite|proximite/.test(styleKey) ? "local-action-map" : "",
    /conversion|vente|vendre|lead/.test(styleKey) ? "conversion-offer-ladder" : "",
  ];
  const candidates = unique([
    ...styleHints,
    ...(objectiveHints[objectiveMode] || []),
    ...base,
    ...(positioning === "premium" ? ["method-proof-editorial", "editorial-authority-profile"] : []),
    ...DESIGN_ARCHETYPES_BY_NICHE["general-business"],
  ]);
  const seed = `${form.businessName}|${form.businessType}|${form.city}|${form.description}|${form.style}|${form.colors}|${form.variationSeed}|${Date.now()}`;
  return candidates[Math.abs(hashString(seed)) % candidates.length] || "clear-offer-bento";
};

const ensureDesignArchetype = (layoutType: string, designArchetype: string) => {
  const cleaned = normalizeText(layoutType, designArchetype);
  return cleaned.toLowerCase().includes(designArchetype.toLowerCase())
    ? cleaned
    : `${cleaned} ${designArchetype}`.trim();
};

const ensureLayoutSignature = (layoutType: string, designArchetype: string, recipeId?: string) => {
  const withArchetype = ensureDesignArchetype(layoutType, designArchetype);
  const cleanedRecipe = normalizeText(recipeId);
  if (!cleanedRecipe || withArchetype.toLowerCase().includes(cleanedRecipe.toLowerCase())) {
    return withArchetype;
  }
  return `${withArchetype} ${cleanedRecipe}`.trim();
};

const buildDesignArchetypeGuide = (profile: BusinessProfile) =>
  `${profile.designArchetype} : ${
    DESIGN_ARCHETYPE_GUIDES[profile.designArchetype] ||
    "signature visuelle distincte, rythme propre, sections variees et preuve adaptee au metier"
  }`;

type CreativeLayoutRecipe = {
  id: string;
  tags: string[];
  composition: string;
  sectionTwist: string;
  visualSystem: string;
  mobileRule: string;
};

const CREATIVE_LAYOUT_RECIPES: CreativeLayoutRecipe[] = [
  {
    id: "split-offer-command",
    tags: ["conversion", "lead", "service", "vente"],
    composition: "hero split avec promesse + preuve courte a gauche, offre/action a droite, puis blocs courts en escalier",
    sectionTwist: "placer l'offre ou le rendez-vous avant les benefices, puis traiter les objections avant la FAQ",
    visualSystem: "cartes nettes, gros CTA, etiquettes de preuve, rythme direct",
    mobileRule: "CTA sticky ou repete apres chaque grande preuve, sections courtes et scannables",
  },
  {
    id: "editorial-immersive-scroll",
    tags: ["restaurant", "beauty", "creative", "premium", "lifestyle"],
    composition: "hero editorial avec image large, narration sensorielle, sections comme un magazine haut de gamme",
    sectionTwist: "alterner histoire, offre, preuve visuelle et action plutot qu'une simple liste de services",
    visualSystem: "images pleine largeur, titres courts, espace genereux, details de marque",
    mobileRule: "conserver une lecture verticale elegante avec CTA apres chaque moment fort",
  },
  {
    id: "bento-proof-lab",
    tags: ["saas", "business", "professional", "education", "tech"],
    composition: "grille bento premium : promesse, cas d'usage, methode, preuves et CTA dans des blocs asymetriques",
    sectionTwist: "transformer services/benefices en modules visuels differencies, pas en cartes identiques",
    visualSystem: "bento dense mais clair, badges, mini-statuts sans faux chiffres, separation par niveaux",
    mobileRule: "empiler les cartes par ordre de conversion : promesse, preuve, offre, action",
  },
  {
    id: "local-trust-map-flow",
    tags: ["local", "ville", "intervention", "restaurant", "immobilier", "service"],
    composition: "ancrage local visible : ville, zone, contexte, preuve de proximite et action rapide",
    sectionTwist: "integrer la ville dans hero, preuve, process, FAQ et CTA sans bourrage SEO",
    visualSystem: "cartes zone/process, repere local, avis plausibles, tons rassurants",
    mobileRule: "mettre contact, zone et CTA au-dessus du premier long scroll",
  },
  {
    id: "portfolio-gallery-conversion",
    tags: ["photographe", "creative", "portfolio", "studio", "design"],
    composition: "hero portfolio, galerie de preuves, offres de session/projet, deroule et reservation",
    sectionTwist: "faire vendre par le style, le resultat attendu et le processus de booking plutot que par une liste generique",
    visualSystem: "grands visuels, cartes offres, citations clients, ambiance studio",
    mobileRule: "galerie compacte, CTA reserver une seance visible apres hero et apres offres",
  },
  {
    id: "appointment-calendar-path",
    tags: ["booking", "rendez-vous", "coach", "medical", "wellness", "consultant"],
    composition: "promesse, choix de prestation, deroule court, rassurance, CTA rendez-vous",
    sectionTwist: "reduire la friction : trois etapes, disponibilite, reponse aux objections et contact",
    visualSystem: "cartes etapes, preuve de methode, boutons calendrier/WhatsApp si demande",
    mobileRule: "CTA rendez-vous plein largeur et repete avant FAQ",
  },
  {
    id: "youth-social-pulse",
    tags: ["tiktok", "jeune", "social", "rose", "violet", "creator", "dynamique"],
    composition: "hero audacieux, titres courts, preuve sociale, offres rapides, CTA direct",
    sectionTwist: "rythme rapide avec micro-blocs, accroches fortes et preuves visuelles",
    visualSystem: "couleurs explicites, contrastes, cards plus compactes, mouvement leger",
    mobileRule: "experience mobile-first, CTA WhatsApp ou DM visible sans chercher",
  },
  {
    id: "luxury-minimal-proof",
    tags: ["premium", "luxe", "minimal", "elegant", "haut de gamme"],
    composition: "hero calme, promesse selective, preuve fine, services peu nombreux mais tres lisibles",
    sectionTwist: "moins de blocs, plus de precision, rassurance subtile et CTA elegant",
    visualSystem: "espaces blancs, bordures fines, typographie raffinee, images soignees",
    mobileRule: "eviter les paves, prioriser titres courts, preuve et action",
  },
  {
    id: "offer-comparison-stack",
    tags: ["ecommerce", "car-rental", "vente", "pricing", "offre"],
    composition: "offres comparees par usage, benefices, conditions, objections et action",
    sectionTwist: "faire choisir vite : pour qui, quand, pourquoi, prochaine etape",
    visualSystem: "cartes offres, tags d'usage, reassurance paiement/disponibilite sans invention",
    mobileRule: "cartes en pile, CTA par offre et CTA final unique",
  },
  {
    id: "method-authority-page",
    tags: ["credibilite", "expert", "consultant", "immobilier", "coach", "law"],
    composition: "autorite, methode, preuves, cas typiques, objections et contact qualifie",
    sectionTwist: "placer la methode avant les services quand la confiance est l'objectif",
    visualSystem: "blocs methode, citations, preuve locale ou metier, ton pose",
    mobileRule: "resume methode en trois points avant les sections longues",
  },
  {
    id: "event-momentum-story",
    tags: ["event", "sport", "dynamic", "entertainment", "launch"],
    composition: "hero moment fort, formats, ambiance, process devis/reservation et preuves",
    sectionTwist: "raconter l'energie du moment avant de detailler l'offre",
    visualSystem: "visuels en mouvement, cards format, transitions legeres",
    mobileRule: "CTA demande de devis/reservation toujours accessible apres formats",
  },
  {
    id: "calm-care-reassurance",
    tags: ["medical", "wellness", "care", "sante", "beaute"],
    composition: "rassurance d'abord, cadre, prestations, deroule, FAQ confiance et prise de rendez-vous",
    sectionTwist: "eviter la survente : clarte, cadre, securite et action simple",
    visualSystem: "palette douce, cards calmes, images de contexte, pas de promesse aggressive",
    mobileRule: "texte court, boutons accessibles, informations pratiques avant FAQ",
  },
];

const scoreCreativeRecipe = (
  recipe: CreativeLayoutRecipe,
  signalText: string,
  profile: BusinessProfile,
  form: Required<FormPayload>,
  userVision?: UserVision,
) => {
  const explicitSignals = normalizeText(
    [
      form.businessType,
      form.objective,
      form.style,
      form.positioning,
      form.colors,
      form.cta,
      form.description,
      form.enhancers.join(" "),
      profile.niche,
      profile.objectiveMode,
      profile.designArchetype,
      userVision?.desiredCTA,
      userVision?.desiredColors.join(" "),
      userVision?.desiredMood.join(" "),
      userVision?.visualReferences.join(" "),
      userVision?.prioritySignals.join(" "),
    ].join(" "),
  ).toLowerCase();

  return recipe.tags.reduce((score, tag) => {
    const token = normalizeText(tag).toLowerCase();
    return score + (signalText.includes(token) || explicitSignals.includes(token) ? 3 : 0);
  }, 0);
};

const selectCreativeLayoutRecipe = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const signalText = normalizeText(
    `${form.businessName} ${form.businessType} ${form.city} ${form.objective} ${form.style} ${form.positioning} ${form.colors} ${form.cta} ${form.description} ${form.enhancers.join(" ")} ${profile.niche} ${profile.designArchetype}`,
  ).toLowerCase();
  const ranked = CREATIVE_LAYOUT_RECIPES
    .map((recipe) => ({
      recipe,
      score: scoreCreativeRecipe(recipe, signalText, profile, form, userVision),
    }))
    .sort((left, right) => right.score - left.score);
  const topScore = ranked[0]?.score || 0;
  const pool = ranked.filter((item) => item.score === topScore).map((item) => item.recipe);
  const fallbackPool = pool.length ? pool : CREATIVE_LAYOUT_RECIPES;
  const seed = `${form.businessName}|${form.businessType}|${form.city}|${form.description}|${form.style}|${form.colors}|${form.variationSeed}|${profile.designArchetype}`;
  return fallbackPool[Math.abs(hashString(seed)) % fallbackPool.length] || CREATIVE_LAYOUT_RECIPES[0];
};

const buildCreativeVariationGuide = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const recipe = selectCreativeLayoutRecipe(form, profile, userVision);
  const alternates = CREATIVE_LAYOUT_RECIPES
    .filter((item) => item.id !== recipe.id)
    .slice(0, 4)
    .map((item) => item.id)
    .join(", ");

  return `RECETTE CREATIVE PIXELRISES A APPLIQUER
- recette principale : ${recipe.id}
- composition : ${recipe.composition}
- variation de sections : ${recipe.sectionTwist}
- systeme visuel : ${recipe.visualSystem}
- mobile : ${recipe.mobileRule}
- design.layout_type doit inclure la recette "${recipe.id}" et la signature "${profile.designArchetype}".
- ne pas copier cette recette comme un titre visible : elle sert uniquement a varier le rendu.
- alternatives disponibles si le brief les justifie : ${alternates}`;
};

const getFallbackVisualLibrary = (niche: string) => {
  const fallback = {
    accentLabel: "Offre premium",
    hero:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    ],
  };

  const libraries: Record<string, typeof fallback> = {
    restaurant: {
      accentLabel: "Exp\u00e9rience gourmande",
      hero:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    coach: {
      accentLabel: "Transformation visible",
      hero:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517837016564-bfc1d1d13d5f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    immobilier: {
      accentLabel: "Confiance locale",
      hero:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "car-rental": {
      accentLabel: "Reservation simple",
      hero:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "sports-betting-advice": {
      accentLabel: "Analyse responsable",
      hero:
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "education-training": {
      accentLabel: "Progression claire",
      hero:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "travel-hospitality": {
      accentLabel: "Experience memorable",
      hero:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "events-entertainment": {
      accentLabel: "Moment fort",
      hero:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "saas-tech": {
      accentLabel: "Produit clair",
      hero:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "personal-brand": {
      accentLabel: "Autorite personnelle",
      hero:
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    wellness: {
      accentLabel: "Bien-etre visible",
      hero:
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1591343395082-e120087004b4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "automotive-services": {
      accentLabel: "Service auto fiable",
      hero:
        "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "pet-services": {
      accentLabel: "Confiance animal",
      hero:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "local-services": {
      accentLabel: "Fiabilit\u00e9 terrain",
      hero:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "professional-services": {
      accentLabel: "Autorit\u00e9 rassurante",
      hero:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    ecommerce: {
      accentLabel: "Achat fluide",
      hero:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    medical: {
      accentLabel: "Confiance patient",
      hero:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    beauty: {
      accentLabel: "Resultat soigne",
      hero:
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    "creative-services": {
      accentLabel: "Portfolio photo",
      hero:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  };

  return libraries[niche] || fallback;
};

const inferBusinessProfile = (form: Required<FormPayload>): BusinessProfile => {
  const niche = pickNiche(form);
  const positioning = resolvePositioning(form);
  const serviceList = getCleanServiceList(form.services);
  const photographyIntent =
    niche === "creative-services" &&
    /photographe|photographie|shooting|portrait|mariage|studio photo|reportage photo|seance photo|seance photo/.test(
      `${form.businessType} ${form.services} ${form.description}`.toLowerCase(),
    );
  const conversionGoal = resolveConversionGoal(form);
  const objectiveMode = resolveObjectiveMode(form);
  const isLocalIntent =
    Boolean(normalizeText(form.city)) ||
    [
      "restaurant",
      "immobilier",
      "car-rental",
      "local-services",
      "medical",
      "professional-services",
      "travel-hospitality",
      "events-entertainment",
      "automotive-services",
      "pet-services",
      "wellness",
    ].includes(niche);

  const targetAudienceByNiche: Record<string, string> = {
    restaurant: form.city
      ? `des habitants et visiteurs de ${form.city} qui veulent une bonne adresse fiable`
      : "des personnes qui cherchent une adresse fiable et exigeante",
    "sports-betting-advice":
      "des passionnes de sport majeurs qui veulent lire des analyses responsables avant de decider par eux-memes",
    "education-training":
      "des apprenants ou professionnels qui veulent progresser avec un cadre clair et rassurant",
    "travel-hospitality": form.city
      ? `des voyageurs qui veulent reserver une experience fiable a ${form.city} ou autour`
      : "des voyageurs qui veulent choisir un sejour fiable, clair et memorable",
    "events-entertainment":
      "des particuliers ou entreprises qui veulent organiser un moment reussi sans stress",
    "saas-tech":
      "des equipes qui veulent comprendre vite le produit, sa valeur et la prochaine etape",
    "personal-brand":
      "des prospects qui veulent comprendre l'expertise, la methode et la personnalite avant de prendre contact",
    wellness:
      "des personnes qui veulent se sentir mieux avec une approche rassurante et professionnelle",
    "automotive-services": form.city
      ? `des automobilistes de ${form.city} qui veulent un service clair, rapide et fiable`
      : "des automobilistes qui veulent comprendre le service, le delai et la prochaine etape",
    "pet-services":
      "des proprietaires d'animaux qui veulent confier leur compagnon avec confiance",
    coach: "des personnes qui veulent un vrai changement et un accompagnement visible",
    immobilier: "des vendeurs et acheteurs qui veulent un accompagnement rassurant et fluide",
    "car-rental": form.city
      ? `des clients de ${form.city} qui veulent louer un vehicule rapidement, sans agence compliquee`
      : "des clients qui veulent louer un vehicule rapidement, sans agence compliquee",
    ecommerce: "des acheteurs qui veulent comprendre vite le produit et passer commande sans h\u00e9siter",
    medical: "des patients qui veulent \u00eatre rassur\u00e9s rapidement avant de prendre contact",
    beauty: "des clientes qui veulent une exp\u00e9rience soign\u00e9e et un r\u00e9sultat visible",
    "professional-services": "des prospects qui veulent \u00eatre rassur\u00e9s par le s\u00e9rieux et la m\u00e9thode",
    "local-services": "des clients locaux qui veulent une intervention claire, rapide et fiable",
    "creative-services": photographyIntent
      ? form.city
        ? `des particuliers, couples ou marques de ${form.city} qui veulent des photos soignees et un photographe fiable`
        : "des particuliers, couples ou marques qui veulent des photos soignees et un photographe fiable"
      : "des prospects qui veulent une image plus forte et un prestataire cr\u00e9dible",
    "general-business": "des prospects qui veulent comprendre rapidement l'offre et la valeur",
  };

  const toneByPositioning: Record<string, string> = {
    premium: "premium, pr\u00e9cis et rassurant",
    accessible: "direct, simple et convaincant",
    professionnel: "clair, cr\u00e9dible et structur\u00e9",
  };

  const visualByNiche: Record<string, { visual: string; layout: string; proof: string }> = {
    restaurant: {
      visual: "editorial gourmand et chaleureux",
      layout: "editorial-premium",
      proof: "ambiance, qualit\u00e9 et r\u00e9servation facile",
    },
    coach: {
      visual: "dynamique, \u00e9nergique et transformation visible",
      layout: "conversion-grid",
      proof: "r\u00e9sultats, transformation et passage \u00e0 l'action",
    },
    immobilier: {
      visual: "\u00e9l\u00e9gant, rassurant et autorit\u00e9 locale",
      layout: "local-authority",
      proof: "confiance, estimation et accompagnement",
    },
    "car-rental": {
      visual: "moderne, mobile-first et oriente reservation rapide",
      layout: "conversion-grid",
      proof: "simplicite, disponibilite et reservation lisible",
    },
    "sports-betting-advice": {
      visual: "sportif premium, data lisible et responsable",
      layout: "trust-minimal",
      proof: "methode d'analyse, transparence, 18+ et absence de gain garanti",
    },
    "education-training": {
      visual: "clair, pedagogique et progression visible",
      layout: "conversion-grid",
      proof: "programme, methode, resultats d'apprentissage et accompagnement",
    },
    "travel-hospitality": {
      visual: "immersif, aspirationnel et rassurant",
      layout: "editorial-premium",
      proof: "experience, localisation, reservation et avis",
    },
    "events-entertainment": {
      visual: "rythme, emotionnel et tres visuel",
      layout: "conversion-grid",
      proof: "ambiance, organisation, moments forts et disponibilite",
    },
    "saas-tech": {
      visual: "SaaS moderne, precis et oriente produit",
      layout: "conversion-grid",
      proof: "cas d'usage, gain de temps, integrations et demonstration",
    },
    "personal-brand": {
      visual: "editorial premium, humain et autorite personnelle",
      layout: "editorial-premium",
      proof: "methode, prises de parole, resultats et preuve d'expertise",
    },
    wellness: {
      visual: "calme, sensoriel et rassurant",
      layout: "trust-minimal",
      proof: "approche, bien-etre, cadre et prise de rendez-vous",
    },
    "automotive-services": {
      visual: "technique, solide et premium terrain",
      layout: "conversion-grid",
      proof: "diagnostic, delai, transparence et resultat visible",
    },
    "pet-services": {
      visual: "chaleureux, rassurant et professionnel",
      layout: "trust-minimal",
      proof: "confiance, soin, securite et experience animal",
    },
    ecommerce: {
      visual: "clair, rythm\u00e9 et orient\u00e9 achat",
      layout: "conversion-grid",
      proof: "r\u00e9assurance, b\u00e9n\u00e9fices produit et achat rapide",
    },
    medical: {
      visual: "sobre, rassurant et tr\u00e8s lisible",
      layout: "trust-minimal",
      proof: "s\u00e9curit\u00e9, s\u00e9rieux et prise de rendez-vous",
    },
    beauty: {
      visual: "raffin\u00e9, lumineux et sensoriel",
      layout: "editorial-premium",
      proof: "r\u00e9sultat, image et confiance",
    },
    "professional-services": {
      visual: "sobre, fort et orient\u00e9 autorit\u00e9",
      layout: "local-authority",
      proof: "m\u00e9thode, s\u00e9rieux et accompagnement",
    },
    "local-services": {
      visual: "solide, concret et imm\u00e9diat",
      layout: "conversion-grid",
      proof: "rapidit\u00e9, fiabilit\u00e9 et proximit\u00e9",
    },
    "creative-services": {
      visual: photographyIntent
        ? "portfolio photo premium, editorial, lumineux et centre sur l'emotion du client"
        : "premium, diff\u00e9renciant et expressif",
      layout: "editorial-premium",
      proof: photographyIntent
        ? "portfolio, style photographique, deroule de seance, confiance et rendu final"
        : "image, clart\u00e9 et impact",
    },
    "general-business": {
      visual: "moderne, simple et cr\u00e9dible",
      layout: "balanced-modern",
      proof: "clart\u00e9, cr\u00e9dibilit\u00e9 et action",
    },
  };

  const nicheHints = visualByNiche[niche] || visualByNiche["general-business"];
  const designArchetype = selectDesignArchetype(form, niche, positioning, objectiveMode);
  const explicitAudience = normalizeText(form.targetAudience);
  const targetAudience =
    explicitAudience || targetAudienceByNiche[niche] || targetAudienceByNiche["general-business"];
  const offer =
    serviceList[0] ||
    (photographyIntent
      ? "seances photo, portraits, reportages et prestations sur devis"
      : form.businessType);
  const localHook = form.city
    ? `${form.businessName} rend son offre plus compr\u00e9hensible \u00e0 ${form.city}, avec des preuves locales et une action claire.`
    : `${form.businessName} rend son offre plus compr\u00e9hensible, avec des preuves utiles et une prise de contact simple.`;
  const premiumLevel =
    positioning === "premium" ? "premium" : positioning === "accessible" ? "accessible" : "professionnel";
  const ctaSecondaryDefault =
    conversionGoal === "prise de rendez-vous"
      ? "Voir comment cela se passe"
      : conversionGoal === "vente"
        ? "D\u00e9couvrir l'offre"
        : "Voir les d\u00e9tails";
  const ctaKey = normalizeKey(form.cta);
  const nichePrimaryCta: Record<string, string> = {
    "sports-betting-advice": "Voir les pronostics",
    "education-training": "Decouvrir le programme",
    "travel-hospitality": "Reserver le sejour",
    "events-entertainment": "Demander un devis",
    "saas-tech": "Demander une demo",
    "personal-brand": "Demander un echange",
    "automotive-services": "Demander un devis",
    "pet-services": "Prendre contact",
    "creative-services": photographyIntent ? "Reserver une seance photo" : "Demander un devis creatif",
  };
  const shouldUseNicheCta =
    nichePrimaryCta[niche] &&
    (/prendre rendez vous|prendre rdv|contacter|contact|voir les details/.test(ctaKey) || !ctaKey);
  const primaryCta = shouldUseNicheCta ? nichePrimaryCta[niche] : form.cta;
  const nicheSecondaryCta: Record<string, string> = {
    "sports-betting-advice": "Decouvrir la methode",
    "education-training": "Voir les modules",
    "travel-hospitality": "Voir l'experience",
    "events-entertainment": "Voir les formats",
    "saas-tech": "Voir les cas d'usage",
    "personal-brand": "Voir la methode",
    wellness: "Voir le deroule",
    "automotive-services": "Voir les prestations",
    "pet-services": "Voir le cadre",
    "creative-services": photographyIntent ? "Voir le portfolio" : "Voir la methode",
  };
  const ctaSecondary = nicheSecondaryCta[niche] || ctaSecondaryDefault;

  return {
    niche,
    positioning,
    targetAudience,
    conversionGoal,
    objectiveMode,
    offer,
    primaryOfferAngle: `${form.businessName} aide ${targetAudience} \u00e0 ${conversionGoal} avec une offre concr\u00e8te, des preuves visibles et une prochaine \u00e9tape simple.`,
    premiumLevel,
    tone: toneByPositioning[positioning],
    serviceList,
    isLocalIntent,
    localHook,
    visualDirection: nicheHints.visual,
    layoutType: ensureDesignArchetype(nicheHints.layout, designArchetype),
    designArchetype,
    animationStyle:
      positioning === "premium" ? "subtle depth and elegant reveals" : "clean reveals and light motion",
    proofAngle: nicheHints.proof,
    differentiators: unique([
      serviceList[0] ? `offre ${serviceList[0].toLowerCase()} clarifi\u00e9e` : "offre clarifi\u00e9e",
      form.city ? `ancrage local \u00e0 ${form.city}` : "structure business lisible",
      form.positioning ? `positionnement ${form.positioning.toLowerCase()}` : "niveau de gamme coh\u00e9rent",
      form.cta ? `CTA centr\u00e9 sur ${form.cta.toLowerCase()}` : "CTA direct",
    ]),
    audiencePains: unique([
      conversionGoal === "vente" ? "ne pas voir assez vite la valeur de l'offre" : "",
      conversionGoal === "prise de rendez-vous" ? "h\u00e9siter avant de r\u00e9server ou prendre rendez-vous" : "",
      form.city ? `ne pas savoir si ${form.businessName} intervient vraiment \u00e0 ${form.city}` : "",
      "manquer de confiance face \u00e0 une offre mal expliqu\u00e9e",
    ]).slice(0, 4),
    audienceDesires: unique([
      `comprendre rapidement comment ${form.businessName} peut aider`,
      conversionGoal,
      form.city ? `trouver une solution cr\u00e9dible \u00e0 ${form.city}` : "avoir un parcours clair",
      nicheHints.proof,
    ]).slice(0, 4),
    objections: unique([
      "est-ce vraiment s\u00e9rieux ",
      "est-ce adapt\u00e9 \u00e0 mon besoin ",
      conversionGoal === "vente" ? "pourquoi choisir cette offre plut\u00f4t qu'une autre " : "",
      conversionGoal === "prise de rendez-vous" ? "est-ce simple de prendre contact " : "",
    ]).slice(0, 4),
    proofAssets: unique([
      nicheHints.proof,
      form.city ? `ancrage local \u00e0 ${form.city}` : "preuves d'ex\u00e9cution concr\u00e8tes",
      serviceList[0] ? `clart\u00e9 sur ${serviceList[0].toLowerCase()}` : "offre bien structur\u00e9e",
    ]).slice(0, 4),
    seoKeywords: unique([
      form.city ? `${form.businessType} ${form.city}` : form.businessType,
      serviceList[0] ? `${serviceList[0]} ${form.city}` : "",
      form.city ? `${form.businessName} ${form.city}` : form.businessName,
      form.businessType,
    ]).slice(0, 6),
    ctaPrimary: primaryCta,
    ctaSecondary,
    imageStyle: `${nicheHints.visual}, photographie \u00e9ditoriale r\u00e9aliste, premium et cr\u00e9dible`,
    palette: buildPalette(
      niche,
      positioning,
      `${form.businessName}|${form.businessType}|${form.city}|${form.style}|${form.colors}|${form.description}|${form.variationSeed}`,
      `${form.colors} ${form.style} ${form.description} ${form.cta} ${form.enhancers.join(" ")}`,
    ),
  };
};
const mergeBusinessProfile = (
  base: BusinessProfile,
  analysis: BusinessAnalysisPayload,
  form: Required<FormPayload>,
): BusinessProfile => ({
  niche: canonicalizeNiche(analysis.niche, base.niche, form),
  positioning: normalizeText(analysis.positioning, base.positioning),
  targetAudience: normalizeText(analysis.target_audience, base.targetAudience),
  conversionGoal: normalizeText(analysis.conversion_goal, base.conversionGoal),
  objectiveMode: base.objectiveMode,
  offer: normalizeText(analysis.primary_offer, base.offer),
  primaryOfferAngle: normalizeText(analysis.primary_offer, base.primaryOfferAngle),
  premiumLevel: normalizeText(analysis.premium_level, base.premiumLevel),
  tone: normalizeText(analysis.tone, base.tone),
  serviceList: normalizeList(analysis.service_list).length
    ? normalizeList(analysis.service_list).slice(0, 6)
    : base.serviceList,
  isLocalIntent: base.isLocalIntent,
  localHook: normalizeText(analysis.local_hook, base.localHook),
  visualDirection: normalizeText(analysis.visual_direction, base.visualDirection),
  layoutType: ensureDesignArchetype(normalizeText(analysis.layout_type, base.layoutType), base.designArchetype),
  designArchetype: base.designArchetype,
  animationStyle: normalizeText(analysis.animation_style, base.animationStyle),
  proofAngle: normalizeText(analysis.proof_angle, base.proofAngle),
  differentiators: normalizeList(analysis.differentiators).length
    ? normalizeList(analysis.differentiators).slice(0, 5)
    : base.differentiators,
  audiencePains: normalizeList(analysis.audience_pains).length
    ? normalizeList(analysis.audience_pains).slice(0, 5)
    : base.audiencePains,
  audienceDesires: normalizeList(analysis.audience_desires).length
    ? normalizeList(analysis.audience_desires).slice(0, 5)
    : base.audienceDesires,
  objections: normalizeList(analysis.objections).length
    ? normalizeList(analysis.objections).slice(0, 5)
    : base.objections,
  proofAssets: normalizeList(analysis.proof_assets).length
    ? normalizeList(analysis.proof_assets).slice(0, 5)
    : base.proofAssets,
  seoKeywords: normalizeList(analysis.seo_keywords).length
    ? normalizeList(analysis.seo_keywords).slice(0, 6)
    : base.seoKeywords,
  ctaPrimary: normalizeText(analysis.cta_primary, base.ctaPrimary),
  ctaSecondary: normalizeText(analysis.cta_secondary, base.ctaSecondary),
  imageStyle: normalizeText(analysis.image_style, base.imageStyle),
  palette: base.palette,
});

const analyzeBusinessProfileWithAI = async (
  form: Required<FormPayload>,
  heuristicProfile: BusinessProfile,
  userVision: UserVision,
) => {
  const response = await createAIChatCompletionWithModelFallback({
    temperature: 0.74,
    top_p: GENERATION_TOP_P,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: buildBusinessAnalysisSystemPrompt(),
      },
      {
        role: "user",
        content: buildBusinessAnalysisUserPrompt(form, heuristicProfile, userVision),
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "analyze_business_profile",
          description: "Analyze the business brief and return the business strategy profile used for generation.",
          parameters: {
            type: "object",
            properties: {
              niche: {
                type: "string",
                description: "Canonical Pixelrises niche id only; never return a free-form label like 'Restaurant elegant'.",
              },
              target_audience: { type: "string" },
              conversion_goal: { type: "string" },
              positioning: { type: "string" },
              primary_offer: { type: "string" },
              premium_level: { type: "string" },
              tone: { type: "string" },
              service_list: { type: "array", items: { type: "string" } },
              local_hook: { type: "string" },
              visual_direction: { type: "string" },
              layout_type: { type: "string" },
              animation_style: { type: "string" },
              proof_angle: { type: "string" },
              differentiators: { type: "array", items: { type: "string" } },
              audience_pains: { type: "array", items: { type: "string" } },
              audience_desires: { type: "array", items: { type: "string" } },
              objections: { type: "array", items: { type: "string" } },
              proof_assets: { type: "array", items: { type: "string" } },
              seo_keywords: { type: "array", items: { type: "string" } },
              cta_primary: { type: "string" },
              cta_secondary: { type: "string" },
              image_style: { type: "string" },
            },
            required: [
              "niche",
              "target_audience",
              "conversion_goal",
              "positioning",
              "primary_offer",
              "premium_level",
              "tone",
              "service_list",
              "local_hook",
              "visual_direction",
              "layout_type",
              "animation_style",
              "proof_angle",
              "differentiators",
              "audience_pains",
              "audience_desires",
              "objections",
              "proof_assets",
              "seo_keywords",
              "cta_primary",
              "cta_secondary",
              "image_style",
            ],
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "analyze_business_profile" },
    },
  }, BUSINESS_ANALYSIS_MODEL, BUSINESS_ANALYSIS_FALLBACK_MODELS);

  let analysis: BusinessAnalysisPayload;
  try {
    analysis = await parseNamedToolPayload<BusinessAnalysisPayload>(
      response,
      "analyze_business_profile",
    );
  } catch (_error) {
    return heuristicProfile;
  }

  return mergeBusinessProfile(heuristicProfile, analysis, form);
};

const buildBusinessStrategySystemPrompt = () => `Tu es le stratege de conversion interne de Pixelrises AI.

Tu ne rediges pas encore le site final.
Tu transformes l'analyse business en strategie de rendu premium vendable immediatement.
Tu ne construis pas un site joli.
Tu prepares une machine a clients.

MISSION OBLIGATOIRE :
1. definir la promesse centrale
2. choisir l'angle marketing
3. definir la hierarchie du site
4. selectionner uniquement les blocs utiles
5. preciser le style visuel, les images et les animations
6. preciser le ton redactionnel
7. verifier que la strategie respecte objectif, niche, style et gamme
8. repondre uniquement via la fonction build_generation_strategy

REGLES :
- pas de texte generique
- pas de jargon technique
- pas de blocs gadget
- penser comme une agence premium orientee conversion
- chaque decision doit aider a vendre ou generer un lead
- le hero doit faire comprendre la valeur en moins de 3 secondes
- les CTA doivent etre evidents, utiles et coherents avec l'objectif
- la promesse du hero doit vendre un resultat concret, pas une esthetique abstraite
- la structure doit changer reellement selon l'objectif business
- si une section parait interchangeable entre deux niches, il faut la reecrire`;

const buildBusinessStrategyUserPrompt = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision: UserVision,
) => `Construis la strategie du site pour ${form.businessName}.

BRIEF CLIENT :
- Nom : ${form.businessName}
- Activite : ${form.businessType}
- Ville : ${form.city || "non renseignee"}
- Cible : ${form.targetAudience || "non renseignee"}
- Services : ${form.services || "non renseignes"}
- Objectif : ${form.objective}
- Positionnement : ${form.positioning}
- Style souhaite : ${form.style}
- Couleurs : ${form.colors}
- CTA souhaite : ${form.cta}
- Description libre : ${form.description || "non renseignee"}

${buildUserVisionPromptBlock(userVision)}

ANALYSE BUSINESS VALIDEE :
${JSON.stringify(profile, null, 2)}

REGLES PAR OBJECTIF :
${buildObjectivePromptRules(profile)}

REGLES PAR STYLE :
${buildStylePromptRules(form.style)}

REGLES PAR GAMME :
${buildPositioningPromptRules(form.positioning)}

CONSIGNES :
- structure un resultat vendable immediatement
- choisis d'abord la structure par objectif business, puis adapte-la a la niche
- garde seulement les blocs utiles
- cree une hierarchie lisible en 3 secondes
- impose une direction premium, moderne et credible
- prevois des visuels realistes et differencies
- pense conversion, confiance, credibilite, differenciation
- hero obligatoire : promesse + resultat + CTA principal + CTA secondaire
- les signaux prioritaires de la vision utilisateur doivent etre visibles dans le hero, le design, les CTA ou le contact
- les suggestions internes renforcent le brief mais ne remplacent jamais le brief original
- la strategie doit etre compatible avec le style ${form.style} et la gamme ${form.positioning}
- les sections prioritaires doivent suivre cette sequence validee : ${buildResolvedStructure(profile).prioritySections.join(" -> ")}
- la partie offres doit dire ce qui est fait, pour qui, et ce que cela change pour le client
- la preuve sociale doit sembler plausible et metier, jamais decorative`;

const normalizeStrategy = (
  profile: BusinessProfile,
  payload: BusinessStrategyPayload,
): GenerationStrategy => {
  const resolvedStructure = buildResolvedStructure(profile);
  const siteHierarchy = normalizeSectionOrder(
    normalizeList(payload.site_hierarchy),
    resolvedStructure.sectionOrder,
    resolvedStructure.allowedSections,
  );
  const prioritySections = normalizeSectionOrder(
    normalizeList(payload.priority_sections),
    resolvedStructure.prioritySections,
    resolvedStructure.allowedSections,
  );

  return {
    promise: normalizeText(
      payload.promise,
      `${profile.offer} avec une promesse claire, cr\u00e9dible et imm\u00e9diatement compr\u00e9hensible`,
    ),
    marketingAngle: normalizeText(
      payload.marketing_angle,
      profile.primaryOfferAngle || profile.offer,
    ),
    objectiveMode: profile.objectiveMode,
    siteHierarchy,
    sectionRationale: normalizeList(payload.section_rationale).length
      ? normalizeList(payload.section_rationale).slice(0, 8)
      : resolvedStructure.sectionRationale,
    visualStyle: normalizeText(payload.visual_style, profile.visualDirection),
    imageDirection: normalizeText(payload.image_direction, profile.imageStyle),
    animationDirection: normalizeText(payload.animation_direction, profile.animationStyle),
    writingTone: normalizeText(payload.writing_tone, profile.tone),
    heroObjective: normalizeText(payload.hero_objective, resolvedStructure.heroObjective),
    primaryCta: normalizeText(payload.primary_cta, profile.ctaPrimary),
    secondaryCta: normalizeText(payload.secondary_cta, profile.ctaSecondary),
    differentiationHooks: normalizeList(payload.differentiation_hooks).length
      ? normalizeList(payload.differentiation_hooks).slice(0, 6)
      : profile.differentiators,
    premiumSignals: normalizeList(payload.premium_signals).length
      ? normalizeList(payload.premium_signals).slice(0, 6)
      : unique([
          profile.proofAngle,
          profile.visualDirection,
          profile.positioning,
          profile.localHook,
        ].filter(Boolean)),
    avoidSections: unique([
      ...normalizeList(payload.avoid_sections).slice(0, 6),
      ...SECTION_IDS.filter((section) => !resolvedStructure.allowedSections.includes(section)),
    ]),
    prioritySections,
    allowedSections: resolvedStructure.allowedSections,
    proofStyle: resolvedStructure.proofStyle,
    offerStyle: resolvedStructure.offerStyle,
    reassuranceStyle: resolvedStructure.reassuranceStyle,
    ctaIntensity: resolvedStructure.ctaIntensity,
  };
};

const analyzeBusinessStrategyWithAI = async (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision: UserVision,
) => {
  const response = await createAIChatCompletionWithModelFallback({
    temperature: 0.76,
    top_p: GENERATION_TOP_P,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: buildBusinessStrategySystemPrompt(),
      },
      {
        role: "user",
        content: buildBusinessStrategyUserPrompt(form, profile, userVision),
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "build_generation_strategy",
          description: "Transform the business analysis into a premium conversion strategy for the website.",
          parameters: {
            type: "object",
            properties: {
              promise: { type: "string" },
              marketing_angle: { type: "string" },
              site_hierarchy: { type: "array", items: { type: "string" } },
              section_rationale: { type: "array", items: { type: "string" } },
              visual_style: { type: "string" },
              image_direction: { type: "string" },
              animation_direction: { type: "string" },
              writing_tone: { type: "string" },
              hero_objective: { type: "string" },
              primary_cta: { type: "string" },
              secondary_cta: { type: "string" },
              differentiation_hooks: { type: "array", items: { type: "string" } },
              premium_signals: { type: "array", items: { type: "string" } },
              avoid_sections: { type: "array", items: { type: "string" } },
              priority_sections: { type: "array", items: { type: "string" } },
            },
            required: [
              "promise",
              "marketing_angle",
              "site_hierarchy",
              "section_rationale",
              "visual_style",
              "image_direction",
              "animation_direction",
              "writing_tone",
              "hero_objective",
              "primary_cta",
              "secondary_cta",
              "differentiation_hooks",
              "premium_signals",
              "avoid_sections",
              "priority_sections",
            ],
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "build_generation_strategy" },
    },
  }, BUSINESS_ANALYSIS_MODEL, BUSINESS_ANALYSIS_FALLBACK_MODELS);

  let strategy: BusinessStrategyPayload;
  try {
    strategy = await parseNamedToolPayload<BusinessStrategyPayload>(
      response,
      "build_generation_strategy",
    );
  } catch (_error) {
    return buildFallbackStrategy(profile);
  }

  return normalizeStrategy(profile, strategy);
};

const buildPromptBlueprintSystemPrompt = () => `Tu es le prompt architecte interne de Pixelrises AI.

Tu ne generes pas encore le site.
Tu construis le blueprint de prompt qui servira a obtenir un rendu premium niveau agence.

MISSION :
1. traduire la strategie en consignes de generation
2. imposer copywriting, design, images, animations et SEO
3. imposer une vraie differenciation
4. lister les interdits
5. lister les validations obligatoires avant generation finale
6. repondre uniquement via la fonction build_generation_prompt_blueprint

REGLES :
- aucune consigne vague
- aucun bloc inutile
- aucune indulgence pour le texte generique
- chaque regle doit aider a produire un resultat vendable
- le blueprint doit couvrir explicitement objectif, niche, style et gamme
- le blueprint doit traiter le hero comme le bloc le plus critique
- le blueprint doit imposer des visuels varies, non dupliques et coherents
- le blueprint doit forcer une vraie differenciation metier dans les titres, services et preuves
- le blueprint doit verifier la sequence hero -> offre -> preuve -> CTA final`;

const buildPromptBlueprintUserPrompt = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  previousBlueprint: PromptBlueprint | null,
  feedback: string,
  userVision: UserVision,
) => `Cree le blueprint de prompt final pour generer le site de ${form.businessName}.

BRIEF :
${JSON.stringify(form, null, 2)}

${buildUserVisionPromptBlock(userVision)}

PROFIL BUSINESS :
${JSON.stringify(profile, null, 2)}

STRATEGIE VALIDEE :
${JSON.stringify(strategy, null, 2)}

REGLES PAR OBJECTIF :
${buildObjectivePromptRules(profile)}

REGLES PAR STYLE :
${buildStylePromptRules(form.style)}

REGLES PAR GAMME :
${buildPositioningPromptRules(form.positioning)}

${previousBlueprint ? `BLUEPRINT PRECEDENT :
${JSON.stringify(previousBlueprint, null, 2)}` : ""}

${feedback ? `RETOUR DE VALIDATION A CORRIGER :
${feedback}` : ""}

CONSIGNES :
- le blueprint doit couvrir copywriting, structure, hierarchie, differenciation, design, visuels, animations, SEO et validation
- il doit forcer un rendu premium et vendable
- il doit etre plus exigeant qu'un simple prompt de site
- il doit imposer la structure obligatoire : hero, probleme/opportunite, offres, benefices, preuve sociale, process, reassurance, FAQ, CTA final
- il doit imposer un hero compris en moins de 3 secondes
- il doit imposer l'adaptation a l'objectif ${form.objective}, au style ${form.style}, a la gamme ${form.positioning} et a la niche ${profile.niche}
- il doit imposer la sequence validee : ${strategy.prioritySections.join(" -> ")}
- il doit verrouiller les choix explicites du client : ${userVision.prioritySignals.length ? userVision.prioritySignals.join(" | ") : "brief original prioritaire"}
- si WhatsApp, un CTA client ou des couleurs sont explicites, le blueprint doit les rendre impossibles a ignorer
- il doit verifier que les services, benefices et preuves ne peuvent pas etre reutilises tels quels pour une autre niche
- si le feedback montre une faiblesse, corrige-la sans debat`;

const normalizeBlueprint = (
  strategy: GenerationStrategy,
  payload: PromptBlueprintPayload,
): PromptBlueprint => ({
  headlineBrief: normalizeText(
    payload.headline_brief,
    `${strategy.promise}. Angle principal : ${strategy.marketingAngle}.`,
  ),
  conversionRequirements: normalizeList(payload.conversion_requirements).slice(0, 8),
  designRequirements: normalizeList(payload.design_requirements).slice(0, 8),
  imageRequirements: normalizeList(payload.image_requirements).slice(0, 8),
  animationRequirements: normalizeList(payload.animation_requirements).slice(0, 8),
  copyRequirements: normalizeList(payload.copy_requirements).slice(0, 8),
  seoRequirements: normalizeList(payload.seo_requirements).slice(0, 8),
  differentiationRequirements: normalizeList(payload.differentiation_requirements).slice(0, 8),
  forbiddenPatterns: normalizeList(payload.forbidden_patterns).slice(0, 10),
  validationChecks: normalizeList(payload.validation_checks).slice(0, 10),
});

const buildFallbackStrategy = (profile: BusinessProfile): GenerationStrategy => {
  const resolvedStructure = buildResolvedStructure(profile);

  return {
    promise: `${profile.offer} avec une promesse claire, cr\u00e9dible et compr\u00e9hensible en moins de 3 secondes`,
    marketingAngle: profile.primaryOfferAngle || profile.offer,
    objectiveMode: profile.objectiveMode,
    siteHierarchy: resolvedStructure.sectionOrder,
    sectionRationale: resolvedStructure.sectionRationale,
    visualStyle: `${profile.visualDirection}, hi\u00e9rarchie forte, rendu premium et mobile-first`,
    imageDirection: `${profile.imageStyle}, sc\u00e8nes diff\u00e9rentes pour chaque etape, aucune duplication`,
    animationDirection: `${profile.animationStyle}, fade-in l\u00e9ger, hover subtil, scroll fluide`,
    writingTone: profile.tone,
    heroObjective: resolvedStructure.heroObjective,
    primaryCta: profile.ctaPrimary,
    secondaryCta: profile.ctaSecondary,
    differentiationHooks: profile.differentiators,
    premiumSignals: unique([
      profile.proofAngle,
      profile.visualDirection,
      profile.localHook,
      profile.positioning,
    ]),
    avoidSections: unique([
      "texte g\u00e9n\u00e9rique",
      "blocs gadget",
      "promesses floues",
      "blocs techniques visibles",
      ...SECTION_IDS.filter((section) => !resolvedStructure.allowedSections.includes(section)),
    ]),
    prioritySections: resolvedStructure.prioritySections,
    allowedSections: resolvedStructure.allowedSections,
    proofStyle: resolvedStructure.proofStyle,
    offerStyle: resolvedStructure.offerStyle,
    reassuranceStyle: resolvedStructure.reassuranceStyle,
    ctaIntensity: resolvedStructure.ctaIntensity,
  };
};

const buildFallbackPromptBlueprint = (
  profile: BusinessProfile,
  strategy: GenerationStrategy,
): PromptBlueprint => ({
  headlineBrief: `${strategy.promise}. Angle : ${strategy.marketingAngle}. Le resultat doit \u00eatre vendable imm\u00e9diatement et donner confiance en moins de 3 secondes.`,
  conversionRequirements: [
    "ouvrir avec un hero promesse + resultat client + 2 CTA visibles",
    `adapter le parcours a l'objectif principal : ${profile.conversionGoal}`,
    `verifier l'objectif choisi par le client : ${profile.objectiveMode}`,
    `suivre cette sequence de conversion : ${strategy.prioritySections.join(" -> ")}`,
    "respecter la structure obligatoire : hero, probleme/opportunite, offres, benefices, preuve sociale, process, reassurance, FAQ, CTA final",
    `traiter les offres comme des offres clients et non comme des categories vagues : ${strategy.offerStyle}`,
    `faire monter la preuve et la reassurance avec cette logique : ${strategy.proofStyle} / ${strategy.reassuranceStyle}`,
    `appliquer une intensite CTA coherente : ${strategy.ctaIntensity}`,
    "garder seulement les sections qui servent la conversion et supprimer le reste",
    "refuser les blocs inutiles, gadgets ou decoratives qui ne servent pas la conversion",
    `prioriser ces sections dans un ordre de conversion clair : ${strategy.prioritySections.join(", ")}`,
  ],
  designRequirements: [
    "design premium, moderne, sobre et mobile-first",
    `direction visuelle coh\u00e9rente avec ${strategy.visualStyle}`,
    "adapter clairement le rendu au style demande et au niveau de gamme",
    "spacing propre, alternance de sections et hi\u00e9rarchie forte",
    "cartes lisibles, contrastes propres et CTA imm\u00e9diatement visibles",
    "aucun bloc surcharg\u00e9 ni d\u00e9coratif sans utilit\u00e9 business",
  ],
  imageRequirements: [
    `utiliser des visuels r\u00e9alistes coh\u00e9rents avec ${profile.niche}`,
    "pr\u00e9voir une image hero et des images diff\u00e9rentes pour les autres sections",
    "aucune duplication d'image ni de sc\u00e8ne",
    "visuels originaux ou stock/licencies uniquement, jamais une image ou URL de template source",
    `ancrer les visuels dans cette direction : ${strategy.imageDirection}`,
  ],
  animationRequirements: [
    "animations modernes et fluides",
    "fade-in discrets au scroll",
    "hover subtil sur les CTA et cartes",
    "jamais d'animation lourde ou gadget",
  ],
  copyRequirements: [
    "appliquer AIDA et PAS explicitement",
    "ecrire en francais naturel, credible et oriente business",
    "interdire tout texte generique, vague ou interchangeable",
    "ne jamais recopier une phrase, un titre ou une description depuis une inspiration template",
    "le client doit comprendre ce qui est propos\u00e9, pour qui et pourquoi c'est utile en moins de 3 secondes",
    "chaque etape doit repondre a une objection ou pousser a l'action",
    "hero : promesse claire, resultat explicite, tension business ou desir visible",
    "services : offres concretes, lisibles, orientees client et jamais abstraites",
    "benefices : gains clients distincts des services, jamais dupliques",
    "FAQ : objections reelles et utiles, pas de remplissage",
    `mettre en avant ${profile.offer} avec un ton ${strategy.writingTone}`,
  ],
  seoRequirements: [
    `int\u00e9grer les mots-cl\u00e9s locaux : ${profile.seoKeywords.join(", ")}`,
    `aligner le contenu sur l'objectif de conversion : ${profile.conversionGoal}`,
    "pr\u00e9voir des titres clairs, un H1 fort et des blocs utiles au SEO local",
    "faire appara\u00eetre la ville et la promesse sans bourrage",
  ],
  differentiationRequirements: unique([
    `adapter la structure au marche ${profile.niche}`,
    `reprendre les termes concrets du metier et des services : ${[profile.offer, ...profile.serviceList].filter(Boolean).join(", ")}`,
    `adapter l'offre ${profile.offer} a la cible ${profile.targetAudience}`,
    `adapter la structure a l'objectif ${profile.objectiveMode}`,
    `verifier l'objectif choisi par le client : ${profile.conversionGoal}`,
    ...profile.differentiators,
    ...strategy.differentiationHooks,
  ]).slice(0, 10),
  forbiddenPatterns: [
    "lorem ipsum",
    "texte g\u00e9n\u00e9rique",
    "promesse floue",
    "bloc inutile",
    "blocs inutiles",
    "r\u00e9p\u00e9tition",
    "indicateur interne",
    "\u00e9l\u00e9ment technique visible",
    "texte ou image copie depuis une inspiration template",
  ],
  validationChecks: [
    "JSON valide et complet",
    "aucune section vide",
    "hero compr\u00e9hensible en moins de 3 secondes",
    "hero oriente promesse + resultat + CTA et pas esthetique",
    "verification explicite de l'alignement objectif, niche, style et gamme",
    "verifier l'objectif choisi par le client",
    "verifier les termes concrets du metier, des services et de la cible",
    "refuser explicitement les blocs inutiles",
    "CTA principal et secondaire credibles",
    "images diff\u00e9rentes et coh\u00e9rentes",
    "images et textes 100% originaux pour le client",
    "services et benefices nettement distincts",
    "FAQ et reassurance utiles a la conversion",
    "resultat vendable imm\u00e9diatement",
    "aucun texte g\u00e9n\u00e9rique ou r\u00e9p\u00e9titif",
  ],
});

const reinforcePromptBlueprint = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  blueprint: PromptBlueprint,
  issues: string[] = [],
): PromptBlueprint => {
  const concreteTerms = unique([
    form.businessType,
    form.services,
    form.city ? `${form.businessType} a ${form.city}` : "",
    profile.offer,
    profile.targetAudience,
    profile.conversionGoal,
    profile.niche,
    ...profile.serviceList,
    ...profile.seoKeywords,
  ])
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length >= 3)
    .slice(0, 14);
  const concreteTermsText = concreteTerms.join(", ");

  return {
    ...blueprint,
    headlineBrief: normalizeText(
      `${blueprint.headlineBrief} Le resultat doit reprendre clairement ces termes metier et services : ${concreteTermsText}. Objectif client : ${form.objective}. Style : ${form.style}. Gamme : ${form.positioning}.`,
      `${strategy.promise}. Angle principal : ${strategy.marketingAngle}.`,
    ),
    conversionRequirements: unique([
      ...blueprint.conversionRequirements,
      `suivre cette sequence de conversion : ${strategy.prioritySections.join(" -> ")}`,
      `relier chaque etape prioritaire ?  la conversion : ${strategy.prioritySections.join(", ")}`,
      "lier le hero, la preuve sociale et le CTA final dans un parcours de conversion clair",
      `verifier l'objectif choisi par le client : ${profile.conversionGoal}`,
      "supprimer tout bloc inutile, gadget ou sans utilite business",
    ]),
    designRequirements: unique([
      ...blueprint.designRequirements,
      `adapter le design au style ${form.style} et ?  la gamme ${form.positioning}`,
      `appliquer la signature visuelle ${profile.designArchetype} pour eviter un rendu similaire aux autres generations`,
      `respecter la direction visuelle : ${strategy.visualStyle}`,
      "produire un rendu premium, lisible, mobile-first et oriente action",
    ]),
    imageRequirements: unique([
      ...blueprint.imageRequirements,
      `prevoir une image hero et des visuels de moments cles coherents avec ${profile.niche}`,
      "utiliser des visuels varies, differents, non dupliques et relies aux sections cles du site",
      `ancrer les images dans ces termes metier : ${concreteTermsText}`,
      "utiliser uniquement des descriptions de scenes originales ou des sources stock/licenciees deja autorisees",
      "ne jamais reprendre une image, une URL ou une scene de template source",
    ]),
    animationRequirements: unique([
      ...blueprint.animationRequirements,
      "animations fluides, modernes, legeres et jamais gadget",
      "hover subtil sur les cartes et CTA, transitions propres sur mobile",
    ]),
    copyRequirements: unique([
      ...blueprint.copyRequirements,
      "appliquer AIDA et PAS dans la structure de copywriting",
      "hero : promesse claire, resultat concret, activite identifiable et CTA visible",
      `reprendre les termes concrets du metier et des services : ${concreteTermsText}`,
      "services : offres concretes, lisibles, orientees client et distinctes des benefices",
      "benefices : gains clients concrets, jamais dupliques avec les services",
      "FAQ : objections reelles liees au prix, delai, confiance, reservation, zone ou disponibilite",
      "interdire les phrases generiques, vagues, repetitives ou interchangeables",
      "ne jamais recopier une phrase, un titre ou une description depuis une inspiration template",
    ]),
    seoRequirements: unique([
      ...blueprint.seoRequirements,
      `aligner le SEO sur l'objectif business : ${profile.conversionGoal}`,
      `integrer naturellement les mots-cles : ${profile.seoKeywords.join(", ")}`,
      form.city ? `integrer naturellement la ville ${form.city} dans le H1, les H2 et la FAQ` : "",
      "prevoir un H1 clair, des H2 structures, une FAQ utile et une meta description orientee conversion",
    ]),
    differentiationRequirements: unique([
      ...blueprint.differentiationRequirements,
      `adapter la structure ?  la niche ${profile.niche}`,
      `adapter l'offre ${profile.offer} ?  la cible ${profile.targetAudience}`,
      `adapter la structure ?  l'objectif ${profile.objectiveMode}`,
      `reprendre les termes concrets du metier et des services : ${concreteTermsText}`,
      ...profile.differentiators,
      ...strategy.differentiationHooks,
    ]),
    forbiddenPatterns: unique([
      ...blueprint.forbiddenPatterns,
      "lorem ipsum",
      "texte generique",
      "promesse floue",
      "bloc inutile",
      "blocs inutiles",
      "repetition",
      "bloc Indicateur",
      "score qualite visible",
      "debug visible",
      "nom de template visible",
      "texte ou image copie depuis une inspiration template",
    ]),
    validationChecks: unique([
      ...blueprint.validationChecks,
      "JSON valide et complet",
      "aucune section vide",
      "hero comprehensible en moins de 3 secondes",
      "hero controle sur promesse, resultat, activite et CTA",
      "verifier l'objectif, la niche, le style et la gamme",
      `verifier les termes concrets du metier, des services et de la cible : ${concreteTermsText}`,
      "verifier que les services et benefices sont distincts",
      "refuser explicitement les blocs inutiles",
      "refuser le texte generique ou repetitif",
      "refuser toute trace visible de source template ou de texte copie",
      "FAQ utile pour lever les objections",
      issues.length > 0 ? `corriger ces faiblesses internes : ${issues.join(" | ")}` : "",
    ]),
  };
};

const buildPromptBlueprintWithAI = async (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  previousBlueprint: PromptBlueprint | null,
  feedback: string,
  userVision: UserVision,
) => {
  const response = await createAIChatCompletionWithModelFallback({
    temperature: 0.74,
    top_p: GENERATION_TOP_P,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: buildPromptBlueprintSystemPrompt(),
      },
      {
        role: "user",
        content: buildPromptBlueprintUserPrompt(
          form,
          profile,
          strategy,
          previousBlueprint,
          feedback,
          userVision,
        ),
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "build_generation_prompt_blueprint",
          description: "Build the prompt blueprint and validation rules used before final site generation.",
          parameters: {
            type: "object",
            properties: {
              headline_brief: { type: "string" },
              conversion_requirements: { type: "array", items: { type: "string" } },
              design_requirements: { type: "array", items: { type: "string" } },
              image_requirements: { type: "array", items: { type: "string" } },
              animation_requirements: { type: "array", items: { type: "string" } },
              copy_requirements: { type: "array", items: { type: "string" } },
              seo_requirements: { type: "array", items: { type: "string" } },
              differentiation_requirements: { type: "array", items: { type: "string" } },
              forbidden_patterns: { type: "array", items: { type: "string" } },
              validation_checks: { type: "array", items: { type: "string" } },
            },
            required: [
              "headline_brief",
              "conversion_requirements",
              "design_requirements",
              "image_requirements",
              "animation_requirements",
              "copy_requirements",
              "seo_requirements",
              "differentiation_requirements",
              "forbidden_patterns",
              "validation_checks",
            ],
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "build_generation_prompt_blueprint" },
    },
  }, BUSINESS_ANALYSIS_MODEL, BUSINESS_ANALYSIS_FALLBACK_MODELS);

  let payload: PromptBlueprintPayload;
  try {
    payload = await parseNamedToolPayload<PromptBlueprintPayload>(
      response,
      "build_generation_prompt_blueprint",
    );
  } catch (_error) {
    return buildFallbackPromptBlueprint(profile, strategy);
  }

  return normalizeBlueprint(strategy, payload);
};

const validatePromptBlueprint = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  blueprint: PromptBlueprint,
) => {
  const issues: string[] = [];
  const copyBlock = normalizeKey(blueprint.copyRequirements.join(" "));
  const designBlock = normalizeKey(blueprint.designRequirements.join(" "));
  const imageBlock = normalizeKey(blueprint.imageRequirements.join(" "));
  const animationBlock = normalizeKey(blueprint.animationRequirements.join(" "));
  const validationBlock = normalizeKey(blueprint.validationChecks.join(" "));
  const differentiationBlock = normalizeKey(blueprint.differentiationRequirements.join(" "));
  const conversionBlock = normalizeKey(blueprint.conversionRequirements.join(" "));
  const blueprintBlock = normalizeKey(
    [
      blueprint.headlineBrief,
      ...blueprint.conversionRequirements,
      ...blueprint.designRequirements,
      ...blueprint.imageRequirements,
      ...blueprint.animationRequirements,
      ...blueprint.copyRequirements,
      ...blueprint.seoRequirements,
      ...blueprint.differentiationRequirements,
      ...blueprint.forbiddenPatterns,
      ...blueprint.validationChecks,
    ].join(" "),
  );
  const heroQualityBlock = normalizeKey(
    [
      blueprint.headlineBrief,
      ...blueprint.copyRequirements,
      ...blueprint.conversionRequirements,
      ...blueprint.validationChecks,
    ].join(" "),
  );
  const qualityBlock = normalizeKey(
    [
      ...blueprint.validationChecks,
      ...blueprint.forbiddenPatterns,
      ...blueprint.conversionRequirements,
      ...blueprint.copyRequirements,
    ].join(" "),
  );
  const includesAny = (block: string, terms: string[]) =>
    terms.some((term) => {
      const normalizedTerm = normalizeKey(term);
      return normalizedTerm.length > 0 && block.includes(normalizedTerm);
    });
  const objectiveKey = normalizeKey(form.objective);
  const styleKey = normalizeKey(form.style);
  const positioningKey = normalizeKey(form.positioning);
  const nicheKey = normalizeKey(profile.niche);
  const objectiveTerms = unique([
    objectiveKey,
    normalizeKey(profile.objectiveMode),
    normalizeKey(profile.conversionGoal),
    ...objectiveKey.split(" ").filter((term) => term.length >= 5),
  ]).filter(Boolean);
  const objectiveCovered = includesAny(blueprintBlock, objectiveTerms);
  const nicheTerms = unique(
    `${form.businessType} ${form.services} ${profile.offer} ${profile.targetAudience}`
      .split(/[,\n/|]/)
      .map((entry) => normalizeKey(entry))
      .filter((entry) => entry.length >= 5),
  ).slice(0, 6);
  const sectionAliases: Record<SectionId, string[]> = {
    hero: ["hero"],
    problem_solution: ["problem solution", "probleme", "opportunite", "douleur", "solution"],
    services: ["services", "offres", "prestations"],
    benefits: ["benefits", "benefices", "gains", "avantages"],
    testimonials: ["testimonials", "temoignages", "preuve sociale", "avis"],
    process: ["process", "etapes", "parcours", "methode"],
    reassurance: ["reassurance", "confiance", "garantie", "rassurer"],
    local_seo: ["local seo", "seo local", "ville", "zone"],
    faq: ["faq", "objections", "questions"],
    final_cta: ["final cta", "cta final", "appel a l action final"],
  };
  const hasSectionReference = (section: SectionId) => includesAny(conversionBlock, sectionAliases[section]);

  if (blueprint.headlineBrief.length < 40) {
    issues.push("Le blueprint n'explique pas encore assez clairement la promesse centrale.");
  }

  if (blueprint.conversionRequirements.length < 5) {
    issues.push("Le blueprint manque de r\u00e8gles de conversion concr\u00e8tes.");
  }

  if (!copyBlock.includes("aida") || !copyBlock.includes("pas")) {
    issues.push("Le blueprint ne force pas explicitement AIDA et PAS.");
  }

  if (!heroQualityBlock.includes("hero") || !heroQualityBlock.includes("promesse") || !heroQualityBlock.includes("cta")) {
    issues.push("Le blueprint ne cadre pas assez le hero autour de la promesse et des CTA.");
  }

  if (!heroQualityBlock.includes("resultat") && !heroQualityBlock.includes("benefice concret")) {
    issues.push("Le blueprint ne force pas assez le hero \u00e0 vendre un r\u00e9sultat concret.");
  }

  if (!heroQualityBlock.includes("3 secondes") && !heroQualityBlock.includes("moins de 3 secondes")) {
    issues.push("Le blueprint ne force pas assez la comprehension immediate en moins de 3 secondes.");
  }

  if (blueprint.designRequirements.length < 4 || !designBlock.includes("premium")) {
    issues.push("Le blueprint design n'impose pas encore un rendu premium assez clair.");
  }

  if (!designBlock.includes(styleKey) && !designBlock.includes(normalizeKey(strategy.visualStyle))) {
    issues.push("Le blueprint design n'integre pas assez le style demande.");
  }

  if (!designBlock.includes(positioningKey) && !copyBlock.includes(positioningKey)) {
    issues.push("Le blueprint n'integre pas assez le niveau de gamme demande.");
  }

  if (
    blueprint.imageRequirements.length < 3 ||
    (!imageBlock.includes("differ") && !imageBlock.includes("varie") && !imageBlock.includes("non dupli"))
  ) {
    issues.push("Le blueprint image n'impose pas assez des visuels vari\u00e9s et non dupliqu\u00e9s.");
  }

  if (!imageBlock.includes("hero") || !imageBlock.includes("section")) {
    issues.push("Le blueprint image ne relie pas assez les visuels aux sections cl\u00e9s du site.");
  }

  if (blueprint.animationRequirements.length < 2 || !animationBlock.includes("fluide")) {
    issues.push("Le blueprint animation n'impose pas assez une animation moderne et fluide.");
  }

  if (blueprint.differentiationRequirements.length < 3 || !differentiationBlock.includes(nicheKey)) {
    issues.push("Le blueprint ne pousse pas assez la diff\u00e9renciation m\u00e9tier.");
  }

  if (nicheTerms.length > 0 && !nicheTerms.some((term) => blueprintBlock.includes(term))) {
    issues.push("Le blueprint ne reprend pas assez les termes concrets du m\u00e9tier et des services.");
  }

  if (!objectiveCovered) {
    issues.push("Le blueprint ne relie pas assez la structure \u00e0 l'objectif business.");
  }

  if (
    blueprint.validationChecks.length < 4 ||
    (!validationBlock.includes("generique") && !validationBlock.includes("repetitif"))
  ) {
    issues.push("Le blueprint de validation n'interdit pas encore assez clairement le texte g\u00e9n\u00e9rique.");
  }

  if (!blueprint.forbiddenPatterns.some((entry) => normalizeKey(entry).includes("lorem ipsum"))) {
    issues.push("Le blueprint doit interdire explicitement le lorem ipsum.");
  }

  if (!blueprint.forbiddenPatterns.some((entry) => normalizeKey(entry).includes("texte generique"))) {
    issues.push("Le blueprint doit interdire explicitement le texte g\u00e9n\u00e9rique.");
  }

  if (!blueprint.seoRequirements.some((entry) => normalizeKey(entry).includes(normalizeKey(profile.conversionGoal)))) {
    issues.push("Le blueprint SEO ou conversion ne relie pas assez le site \u00e0 l'objectif business.");
  }

  if (!conversionBlock.includes("sequence") || !conversionBlock.includes(normalizeKey(strategy.prioritySections[0] || "hero"))) {
    issues.push("Le blueprint ne relie pas assez les sections prioritaires \u00e0 la conversion.");
  }

  if (strategy.prioritySections.slice(0, 3).some((section) => !hasSectionReference(section))) {
    issues.push("Le blueprint n'impose pas encore assez la s\u00e9quence de conversion valid\u00e9e.");
  }

  if (!objectiveCovered) {
    issues.push("Le blueprint ne verifie pas assez l'objectif choisi par le client.");
  }

  if (!conversionBlock.includes("cta final") || !conversionBlock.includes("preuve sociale")) {
    issues.push("Le blueprint ne relie pas assez CTA final et preuve sociale au parcours de conversion.");
  }

  if (!copyBlock.includes("services") || !copyBlock.includes("benefices")) {
    issues.push("Le blueprint ne distingue pas assez les offres et les b\u00e9n\u00e9fices.");
  }

  if (!copyBlock.includes("faq") || !copyBlock.includes("objection")) {
    issues.push("Le blueprint ne cadre pas assez la FAQ comme levier d'objections.");
  }

  if (!validationBlock.includes("services") || !validationBlock.includes("benefices")) {
    issues.push("Le blueprint de validation ne v\u00e9rifie pas assez la diff\u00e9rence entre offres et b\u00e9n\u00e9fices.");
  }

  if (!validationBlock.includes("hero") || !validationBlock.includes("cta")) {
    issues.push("Le blueprint de validation ne contr\u00f4le pas assez la qualit\u00e9 du hero et des CTA.");
  }

  if (
    !includesAny(qualityBlock, [
      "blocs inutiles",
      "bloc inutile",
      "blocs utiles",
      "supprimer le reste",
      "sans utilite business",
      "gadget",
    ])
  ) {
    issues.push("Le blueprint de validation ne refuse pas encore explicitement les blocs inutiles.");
  }

  if (
    !validationBlock.includes("objectif") ||
    !validationBlock.includes("niche") ||
    !validationBlock.includes("style") ||
    !validationBlock.includes("gamme")
  ) {
    issues.push("Le blueprint de validation ne verifie pas encore explicitement objectif, niche, style et gamme.");
  }

  return issues;
};

const buildTrustBadges = (form: Required<FormPayload>, profile: BusinessProfile) =>
  unique([
    form.city ? `${form.city} et alentours` : `${form.businessType} bien positionne`,
    profile.serviceList[0] ? `${profile.serviceList[0]} clairement presente` : profile.proofAngle,
    profile.conversionGoal,
    form.cta,
  ]).slice(0, 4);

const buildFallbackFaq = (form: Required<FormPayload>, profile: BusinessProfile) => [
  {
    question: `\u00c0 qui s'adresse ${form.businessName} ?`,
    answer: `${form.businessName} s'adresse \u00e0 ${profile.targetAudience}.`,
  },
  {
    question: "Quel est l'objectif de cette offre ?",
    answer: `${form.businessName} cherche surtout \u00e0 ${profile.conversionGoal} avec une proposition facile \u00e0 comprendre pour ${profile.targetAudience}.`,
  },
  {
    question: "Comment passer \u00e0 l'\u00e9tape suivante ?",
    answer: `Le plus simple est de cliquer sur "${form.cta}" pour lancer une demande li\u00e9e \u00e0 ${profile.offer}.`,
  },
];

const buildObjectiveAction = (profile: BusinessProfile) => {
  const byObjective: Record<
    ObjectiveMode,
    {
      verb: string;
      nextStep: string;
      result: string;
      problem: string;
      proof: string;
    }
  > = {
    "attirer-clients": {
      verb: "prendre contact",
      nextStep: "demander un devis ou un premier echange",
      result: "transformer une recherche en demande claire",
      problem: "les prospects hesitent quand l'offre, la zone et le benefice ne sont pas compris immediatement",
      proof: "zone couverte, services lisibles, preuves metier et contact simple",
    },
    "generer-leads": {
      verb: "laisser une demande",
      nextStep: "deposer une demande qualifiee",
      result: "obtenir des contacts plus qualifies",
      problem: "un visiteur ne laisse pas ses coordonnees s'il ne voit pas vite ce qu'il va recevoir",
      proof: "proposition de valeur, benefice immediat, reassurance et formulaire logique",
    },
    "renforcer-credibilite": {
      verb: "faire confiance",
      nextStep: "demander un premier echange",
      result: "rassurer avant le premier contact",
      problem: "la credibilite se perd si la methode, les preuves et les details concrets arrivent trop tard",
      proof: "methode, references, temoignages realistes et signaux de serieux",
    },
    "prendre-rendez-vous": {
      verb: "prendre rendez-vous",
      nextStep: "reserver un creneau",
      result: "passer de l'interet au rendez-vous",
      problem: "la prise de rendez-vous baisse quand le parcours semble long ou incertain",
      proof: "process en trois etapes, benefices concrets, disponibilite et CTA visible",
    },
    "vendre-plus": {
      verb: "choisir l'offre",
      nextStep: "passer ?  l'achat ou demander une offre",
      result: "comprendre la valeur et acheter plus sereinement",
      problem: "l'achat se bloque si le client ne comprend pas vite la valeur, les modalites et les garanties",
      proof: "offre structuree, benefices visibles, objections traitees et CTA direct",
    },
  };

  if (profile.niche === "car-rental") {
    return {
      verb: "reserver une voiture",
      nextStep: "choisir un vehicule disponible et confirmer la reservation",
      result: "reserver une voiture disponible rapidement",
      problem:
        "la reservation se bloque quand les vehicules, les conditions, la remise des cles et le prix ne sont pas compris vite",
      proof:
        "vehicules disponibles, reservation mobile, conditions de location, remise des cles et assistance",
    };
  }

  if (profile.niche === "restaurant") {
    return {
      ...byObjective[profile.objectiveMode],
      verb: "reserver une table",
      nextStep: "reserver une table",
      result: "choisir une table et reserver sans hesitation",
      problem:
        "la reservation baisse si l'ambiance, la carte, l'adresse et les disponibilites ne sont pas visibles rapidement",
      proof: "ambiance, carte, avis, localisation, horaires et reservation simple",
    };
  }

  return byObjective[profile.objectiveMode];
};

const buildNicheHeroTitle = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  action: ReturnType<typeof buildObjectiveAction>,
) => {
  const citySuffix = form.city ? ` a ${form.city}` : "";
  const photographyTitle = form.city
    ? `${form.businessName} capture vos moments a ${form.city} avec un rendu naturel, clair et professionnel`
    : `${form.businessName} transforme vos moments en images soignees, naturelles et faciles ?  reserver`;
  const byNiche: Record<string, string> = {
    restaurant: `Reservez chez ${form.businessName}${citySuffix} pour une experience claire, desirable et sans hesitation`,
    "sports-betting-advice": `${form.businessName} transforme ses analyses sportives en pronostics responsables et lisibles`,
    "education-training": `${form.businessName}${citySuffix} aide ?  progresser avec un parcours clair et un objectif concret`,
    "travel-hospitality": `${form.businessName}${citySuffix} donne envie de reserver une experience fiable et memorable`,
    "events-entertainment": `${form.businessName}${citySuffix} aide ?  organiser un moment fort, clair et sans stress`,
    "saas-tech": `${form.businessName} rend son produit simple a comprendre, tester et adopter`,
    "personal-brand": `${form.businessName}${citySuffix} transforme son expertise en premier echange qualifie`,
    wellness: `${form.businessName}${citySuffix} rassure des les premieres secondes avant la prise de rendez-vous`,
    "automotive-services": `${form.businessName}${citySuffix} clarifie le service auto, le delai et la demande de devis`,
    "pet-services": `${form.businessName}${citySuffix} aide ?  confier son animal avec plus de confiance`,
    coach: `${form.businessName}${citySuffix} aide ?  passer a l'action avec un accompagnement concret`,
    immobilier: `${form.businessName}${citySuffix} rassure vendeurs et acheteurs avant le premier echange`,
    "car-rental": `Louez une voiture${citySuffix} rapidement, sans agence compliquee ni paperasse inutile`,
    "local-services": `${form.businessName}${citySuffix} transforme un besoin urgent en demande claire`,
    beauty: `Reservez une prestation chez ${form.businessName}${citySuffix} avec une experience soignee et rassurante`,
    "professional-services": `${form.businessName}${citySuffix} clarifie l'expertise et facilite le premier echange`,
    "creative-services": isPhotographyBusiness(form)
      ? photographyTitle
      : `${form.businessName}${citySuffix} donne plus d'impact ?  votre image avec une direction claire`,
    ecommerce: `${form.businessName} rend l'offre plus lisible, plus desirable et plus simple ?  acheter`,
  };

  return byNiche[profile.niche] || `${form.businessType}${citySuffix} pour ${action.result}`;
};

const buildNicheProofPhrase = (form: Required<FormPayload>, profile: BusinessProfile) => {
  const citySuffix = form.city ? ` a ${form.city}` : "";
  const photographyProof = `portfolio, deroule de seance, style photo, livraison de galerie et confiance${citySuffix}`;
  const byNiche: Record<string, string> = {
    restaurant: `ambiance, carte, reservation et localisation${citySuffix}`,
    "sports-betting-advice": "methode d'analyse, discipline, transparence, suivi et rappel responsable 18+",
    "education-training": "programme, progression, format, accompagnement et resultats d'apprentissage",
    "travel-hospitality": `experience, localisation, avis, disponibilite et reservation${citySuffix}`,
    "events-entertainment": "ambiance, formats, organisation, preuves et disponibilite",
    "saas-tech": "cas d'usage, gain de temps, preuve produit, securite et demonstration",
    "personal-brand": "expertise, methode, preuves, prises de parole et premier echange",
    wellness: "cadre, approche, ecoute, deroule et prise de rendez-vous",
    "automotive-services": `diagnostic, transparence, delai, resultat et devis${citySuffix}`,
    "pet-services": "securite, soin, experience, cadre et confiance",
    coach: "methode, progression, accompagnement et prise de rendez-vous",
    immobilier: `estimation, accompagnement, qualite des biens et connaissance locale${citySuffix}`,
    "car-rental": `disponibilites, reservation, remise des cles et trajets${citySuffix}`,
    "local-services": `zone d'intervention, devis, delai et preuve de fiabilite${citySuffix}`,
    beauty: "resultat, experience, reservation et conseils personnalises",
    "professional-services": "methode, cadrage, preuve d'expertise et contact qualifie",
    "creative-services": isPhotographyBusiness(form)
      ? photographyProof
      : "direction creative, resultat visuel, methode et preuves de style",
    ecommerce: "valeur produit, benefices, garanties et achat simple",
  };

  return byNiche[profile.niche] || buildObjectiveAction(profile).proof;
};

const buildContinuityServiceCards = (
  services: string[],
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const action = buildObjectiveAction(profile);
  const cityContext = form.city ? ` a ${form.city}` : "";
  const target = profile.targetAudience.toLowerCase();
  const proofPhrase = buildNicheProofPhrase(form, profile);

  return services.map((service, index) => {
    const name = repairServiceName(service, index, form, profile);
    const descriptions = [
      `${name} explique concretement ce que ${form.businessName} propose${cityContext}, pour qui, et pourquoi cela aide ${target} ?  ${action.verb}.`,
      `${name} met en avant ${proofPhrase} afin de reduire les hesitations avant de ${action.nextStep}.`,
      `${name} transforme le besoin client en reponse lisible : benefice, modalites, preuve et prochaine etape.`,
      `${name} donne au visiteur les reperes utiles pour comparer, comprendre la valeur et avancer sans chercher ailleurs.`,
    ];

    return {
      name,
      description: descriptions[index % descriptions.length],
      outcome:
        index === 0
          ? `Le client comprend immediatement l'offre principale et sait comment ${action.verb}.`
          : `La demande devient plus qualifiee parce que le service est explique avec contexte et benefice.`,
    };
  });
};

const buildContinuityBenefits = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const cityContext = form.city ? ` a ${form.city}` : "";
  const action = buildObjectiveAction(profile);
  const businessType = form.businessType.toLowerCase();
  const target = profile.targetAudience.toLowerCase();
  const localBenefit = form.city
    ? `La ville de ${form.city} apparait dans la promesse, le SEO local et les reponses aux objections.`
    : `Le contexte metier est assez clair pour situer l'offre sans jargon.`;

  const byNiche: Record<string, Array<{ title: string; description: string }>> = {
    restaurant: [
      {
        title: "Une reservation plus evidente",
        description: `Le client voit l'ambiance, la carte, la localisation${cityContext} et le bouton de reservation avant de se disperser.`,
      },
      {
        title: "Une experience qui donne envie",
        description: `L'experience met en avant ce que l'on vient vivre chez ${form.businessName}, pas seulement une liste de plats.`,
      },
      {
        title: "Moins de questions avant de reserver",
        description: `Les informations utiles repondent au besoin de confiance : acces, experience, groupe, reservation et moment ideal.`,
      },
    ],
    coach: [
      {
        title: "Un objectif personnel plus clair",
        description: `Le client comprend le point de depart, la methode et le resultat attendu avant de prendre rendez-vous.`,
      },
      {
        title: "Une transformation credible",
        description: `Le contenu reste concret : accompagnement, suivi, progression et preuve, sans promesse irrealiste.`,
      },
      {
        title: "Un passage a l'action plus simple",
        description: `Le CTA revient au bon moment pour convertir l'interet en premier echange.`,
      },
    ],
    immobilier: [
      {
        title: "Une confiance plus rapide",
        description: `L'estimation, l'accompagnement et la connaissance locale passent avant le bruit commercial.`,
      },
      {
        title: "Un projet mieux cadre",
        description: `Le vendeur ou l'acheteur comprend les etapes, les preuves et le niveau d'accompagnement.`,
      },
      {
        title: "Un premier contact plus qualifie",
        description: `Les objections sur prix, methode et serieux sont traitees avant le rendez-vous.`,
      },
    ],
    "car-rental": [
      {
        title: "Une reservation plus rapide",
        description: `Le client comprend les vehicules, les disponibilites et la remise des cles sans chercher les informations ailleurs.`,
      },
      {
        title: "Moins de friction avant de louer",
        description: `Le parcours explique les etapes, les garanties et les conditions de facon simple.`,
      },
      {
        title: "Une offre plus rassurante",
        description: `La preuve porte sur la fiabilite, la clarte du prix, l'etat des vehicules et la zone couverte.`,
      },
    ],
    "sports-betting-advice": [
      {
        title: "Une methode claire avant les pronostics",
        description: `Le client comprend comment ${form.businessName} analyse les matchs, gere le risque et evite les promesses de gain.`,
      },
      {
        title: "Une confiance basee sur la transparence",
        description: "Le contenu met en avant suivi, discipline, historique et rappel responsable plutot qu'un discours agressif.",
      },
      {
        title: "Un passage vers la communaute plus naturel",
        description: `Le CTA invite ?  rejoindre les analyses ou la communaute sans pousser ?  miser directement.`,
      },
    ],
    "education-training": [
      {
        title: "Un parcours d'apprentissage lisible",
        description: `Le client voit le niveau, le format, les etapes et le resultat attendu avant de s'inscrire.`,
      },
      {
        title: "Une progression plus credible",
        description: "Les modules, la methode et l'accompagnement montrent comment l'apprenant avance concretement.",
      },
      {
        title: "Moins d'hesitation avant l'inscription",
        description: `Les reponses aux objections clarifient duree, niveau requis, prix et prochaine etape.`,
      },
    ],
    "travel-hospitality": [
      {
        title: "Une reservation plus desirable",
        description: `Le client ressent l'experience, comprend le lieu et trouve vite les informations utiles avant de reserver.`,
      },
      {
        title: "Une confiance plus rapide",
        description: "Les avis, services, conditions et details pratiques reduisent les hesitations avant le sejour.",
      },
      {
        title: "Un ancrage local plus fort",
        description: localBenefit,
      },
    ],
    "events-entertainment": [
      {
        title: "Un evenement plus facile a projeter",
        description: `Le client comprend les formats, l'ambiance, le deroule et les conditions avant de demander un devis.`,
      },
      {
        title: "Une organisation plus rassurante",
        description: "Les preuves, etapes et disponibilites montrent que le moment peut etre prepare sans stress.",
      },
      {
        title: "Une demande plus qualifiee",
        description: `Le CTA guide vers les informations utiles : date, lieu, public, format et budget.`,
      },
    ],
    "saas-tech": [
      {
        title: "Une valeur produit comprise plus vite",
        description: `Le client identifie le probleme resolu, le cas d'usage principal et la raison d'essayer ${form.businessName}.`,
      },
      {
        title: "Des cas d'usage plus concrets",
        description: "Le contenu traduit les fonctionnalites en gains visibles : temps, fiabilite, clarte ou croissance.",
      },
      {
        title: "Une demo plus facile a demander",
        description: `Les preuves, integrations et garanties donnent assez de contexte pour passer ?  l'etape suivante.`,
      },
    ],
    "personal-brand": [
      {
        title: "Une expertise comprise sans effort",
        description: `Le client comprend la methode, le public accompagne et la valeur de ${form.businessName}.`,
      },
      {
        title: "Une image plus humaine et credible",
        description: "Le contenu montre la vision, les preuves et les prises de position sans autopromotion vide.",
      },
      {
        title: "Un premier echange plus qualifie",
        description: `Le CTA relie clairement l'expertise ?  une action : appel, contact, newsletter ou offre signature.`,
      },
    ],
    wellness: [
      {
        title: "Un premier rendez-vous plus rassurant",
        description: `L'approche, le cadre et les r\u00e9sultats attendus sont expliqu\u00e9s sans promesse excessive.`,
      },
      {
        title: "Une experience plus apaisante",
        description: "Le ton, les visuels et la structure inspirent confiance avant la prise de contact.",
      },
      {
        title: "Des reponses utiles avant de reserver",
        description: `La FAQ clarifie deroule, duree, preparation, tarifs et disponibilite.`,
      },
    ],
    "automotive-services": [
      {
        title: "Un diagnostic plus clair",
        description: `Le client comprend les prestations, les delais, les garanties et la demande de devis avant de se deplacer.`,
      },
      {
        title: "Une confiance technique plus visible",
        description: "L'offre montre methode, transparence et resultat final plutot qu'une simple liste de services.",
      },
      {
        title: "Moins d'allers-retours avant le devis",
        description: `Les etapes expliquent quoi envoyer, quoi verifier et comment avancer.`,
      },
    ],
    "pet-services": [
      {
        title: "Une confiance immediate pour l'animal",
        description: `Le client comprend le cadre, les soins, la securite et l'experience avant de confier son compagnon.`,
      },
      {
        title: "Des conditions plus lisibles",
        description: "L'offre repond aux questions sur disponibilite, deroule, suivi, besoins specifiques et contact.",
      },
      {
        title: "Un contact plus simple",
        description: `Le CTA guide vers les bonnes informations pour obtenir une reponse adaptee ?  l'animal.`,
      },
    ],
  };

  return [
    ...(byNiche[profile.niche] || [
      {
        title: `Comprendre ${businessType} en quelques secondes`,
        description: `${form.businessName} relie l'offre, le benefice et la prochaine action pour aider ${target} ?  ${action.verb}.`,
      },
      {
        title: "Rassurer avant le premier contact",
        description: `L'offre montre la methode, les preuves et les reponses utiles avant de demander un echange.`,
      },
      {
        title: `Avancer vers "${form.cta}" sans confusion`,
        description: `Chaque etape prepare le client : besoin, services, benefices, preuves, FAQ puis CTA final.`,
      },
    ]),
    {
      title: form.city ? `Un ancrage local visible${cityContext}` : "Un positionnement metier plus net",
      description: localBenefit,
    },
  ].slice(0, 4);
};

const buildContinuityTestimonials = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const city = form.city || "la zone";
  const byNiche: Record<string, Array<{ name: string; role: string; text: string }>> = {
    restaurant: [
      {
        name: "Camille",
        role: `Cliente a ${city}`,
        text: `J'ai compris l'ambiance, la carte et la reservation des les premieres secondes. C'est exactement ce qu'il faut pour choisir une table sans hesiter.`,
      },
      {
        name: "Nassim",
        role: "Sortie entre amis",
        text: `L'experience donne envie tout en restant pratique : on voit l'experience, les informations utiles et le bouton pour reserver.`,
      },
    ],
    coach: [
      {
        name: "Sarah",
        role: "Cliente accompagnee",
        text: `Le parcours explique la methode et le resultat attendu sans promettre l'impossible. Cela donne confiance pour prendre un premier rendez-vous.`,
      },
      {
        name: "Mickael",
        role: "Objectif remise en forme",
        text: `J'ai surtout apprecie de voir les etapes, le suivi et la facon de demarrer. La decision devient plus simple.`,
      },
    ],
    immobilier: [
      {
        name: "Thomas",
        role: `Vendeur a ${city}`,
        text: `L'offre met en avant l'estimation, la methode et l'accompagnement. On sent rapidement si l'agence peut gerer un projet serieux.`,
      },
      {
        name: "Elodie",
        role: "Projet d'achat",
        text: `Les preuves et les etapes rassurent avant le premier echange. On comprend mieux comment avancer.`,
      },
    ],
    "car-rental": [
      {
        name: "Mehdi",
        role: `Location a ${city}`,
        text: `L'offre repond vite aux questions importantes : vehicule, reservation, remise des cles et conditions. Cela evite les allers-retours.`,
      },
      {
        name: "Laura",
        role: "Deplacement professionnel",
        text: `Le parcours est clair et donne confiance avant de reserver. On sait quoi faire et ?  quoi s'attendre.`,
      },
    ],
    "sports-betting-advice": [
      {
        name: "Yanis",
        role: "Membre de la communaute",
        text: "J'apprecie surtout la methode : les analyses expliquent le contexte, les risques et les limites. On est loin des promesses de gains faciles.",
      },
      {
        name: "Nora",
        role: "Passionnee de football",
        text: "Les analyses donnent envie de suivre la m\u00e9thode parce que tout est clair : discipline, transparence, rappel responsable et prochaine analyse.",
      },
    ],
    "education-training": [
      {
        name: "Amine",
        role: "Apprenant",
        text: "J'ai compris le programme, le niveau attendu et les resultats possibles avant de m'inscrire. Le parcours rend la decision plus simple.",
      },
      {
        name: "Clara",
        role: "Professionnelle en reconversion",
        text: "Le format, les modules et l'accompagnement sont expliqu\u00e9s sans jargon. On voit rapidement si la formation correspond au besoin.",
      },
    ],
    "travel-hospitality": [
      {
        name: "Laura",
        role: `Voyageuse a ${city}`,
        text: "Les photos, les services et les informations pratiques donnent confiance avant de reserver. On comprend l'experience sans devoir chercher ailleurs.",
      },
      {
        name: "Marc",
        role: "Sejour en couple",
        text: "L'offre donne envie tout en restant precise : localisation, conditions, ambiance et prochaine etape sont faciles a trouver.",
      },
    ],
    "events-entertainment": [
      {
        name: "Sonia",
        role: "Organisation d'evenement",
        text: "J'ai vite compris les formats proposes, l'ambiance et le deroule. Cela aide a demander un devis avec les bonnes informations.",
      },
      {
        name: "Romain",
        role: "???evenement professionnel",
        text: "L'offre rassure sur l'organisation, les disponibilites et les moments forts. On se projette sans etre noye dans les details.",
      },
    ],
    "saas-tech": [
      {
        name: "Elodie",
        role: "Responsable operationnelle",
        text: "J'ai compris le probleme resolu, les cas d'usage et la valeur de la demo. Le produit parait plus concret des la premiere lecture.",
      },
      {
        name: "Karim",
        role: "Fondateur",
        text: "L'offre transforme les fonctionnalites en gains reels : temps, fiabilite et adoption. C'est ce qui donne envie de tester.",
      },
    ],
    "personal-brand": [
      {
        name: "Julie",
        role: "Prospect qualifie",
        text: "La methode, les preuves et le ton personnel m'ont aidee a comprendre pourquoi prendre contact maintenant.",
      },
      {
        name: "Thomas",
        role: "Dirigeant",
        text: "On sent une vraie expertise sans discours creux. L'offre donne envie de suivre la personne et de demander un premier echange.",
      },
    ],
    wellness: [
      {
        name: "Ines",
        role: "Premier rendez-vous",
        text: "Le cadre, l'approche et le deroule sont expliques avec calme. Cela rassure avant de prendre rendez-vous.",
      },
      {
        name: "Maya",
        role: "Cliente accompagnee",
        text: "L'offre reste professionnelle et apaisante. On comprend ce qui est propose sans promesse exageree.",
      },
    ],
    "automotive-services": [
      {
        name: "Nicolas",
        role: `Automobiliste a ${city}`,
        text: "J'ai compris les prestations, les delais et la demande de devis avant d'appeler. Cela evite les mauvaises surprises.",
      },
      {
        name: "Samira",
        role: "Entretien vehicule",
        text: "L'offre inspire confiance parce qu'elle montre le diagnostic, la transparence et les etapes du service.",
      },
    ],
    "pet-services": [
      {
        name: "Camille",
        role: "Proprietaire de chien",
        text: "J'avais besoin d'etre rassuree avant de confier mon chien. L'offre explique le cadre, les soins et le suivi simplement.",
      },
      {
        name: "Lina",
        role: "Garde de chat",
        text: "Les conditions et l'approche sont claires. On comprend vite si le service est adapte ?  son animal.",
      },
    ],
  };

  const fallback = [
    {
      name: "Julie",
      role: profile.targetAudience,
      text: `J'ai compris l'offre de ${form.businessName} rapidement, avec assez de details pour savoir si cela correspond ?  mon besoin.`,
    },
    {
      name: "Karim",
      role: form.city ? `Client a ${form.city}` : "Client interesse",
      text: `L'offre explique les services, la methode et la prochaine etape sans perdre le client dans du texte inutile.`,
    },
  ];

  return [...(byNiche[profile.niche] || fallback), {
    name: "Client local",
    role: profile.conversionGoal,
    text: `Les informations sont assez concretes pour comparer, se rassurer et choisir ${form.businessName} plutot qu'une alternative floue.`,
  }];
};

const buildContinuityProcess = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
) => {
  const action = buildObjectiveAction(profile);
  const primaryCta = strategy.primaryCta || form.cta;

  return [
    {
      step: "1",
      title: "Clarifier le besoin",
      description: `Le client identifie son besoin, le service adapte et les informations utiles avant de cliquer sur "${primaryCta}".`,
    },
    {
      step: "2",
      title: "Valider la confiance",
      description: `${form.businessName} presente les preuves, la methode, les conditions et les reponses aux objections principales.`,
    },
    {
      step: "3",
      title: "Passer a l'action",
      description: `Le prospect peut ${action.nextStep} avec une perception claire du resultat attendu.`,
    },
  ];
};

const buildContinuityFaq = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  primaryService: string,
  strategy: GenerationStrategy,
) => {
  const citySuffix = form.city ? ` a ${form.city}` : "";
  const action = buildObjectiveAction(profile);
  const primaryCta = strategy.primaryCta || form.cta;

  return [
    {
      question: `Combien coute ${primaryService.toLowerCase()}${citySuffix} ?`,
      answer: `Le prix depend du besoin, du niveau d'accompagnement et du delai. Le plus simple est de cliquer sur "${primaryCta}" pour obtenir une reponse adaptee.`,
    },
    {
      question: `Comment se deroule le premier echange avec ${form.businessName} ?`,
      answer: `Vous partagez votre besoin, ${form.businessName} confirme les options utiles, puis la prochaine etape devient claire.`,
    },
    {
      question: form.city
        ? `${form.businessName} intervient-il a ${form.city} et autour ?`
        : `${form.businessName} peut-il s'adapter ?  mon besoin ?`,
      answer: form.city
        ? `Oui, ${form.businessName} precise ${form.city}, les zones proches et les informations utiles avant le contact.`
        : `Oui, ${form.businessName} explique l'offre, le fonctionnement et les criteres de choix avant le contact.`,
    },
    {
      question: `Pourquoi choisir ${form.businessName} plutot qu'une alternative ?`,
      answer: `${buildNicheProofPhrase(form, profile)} est rendu visible des les premieres sections, puis ${action.nextStep} reste simple ?  suivre.`,
    },
  ];
};

const buildEmergencySitePayload = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
): RawSitePayload => {
  const citySuffix = form.city ? ` a ${form.city}` : "";
  const primaryKeyword = form.city ? `${form.businessType} ${form.city}` : form.businessType;
  const services = unique([
    ...getCleanServiceList(form.services),
    ...profile.serviceList,
    ...buildFallbackServiceNames(form, profile),
  ])
    .filter(Boolean)
    .slice(0, 4);
  const resolvedStructure = buildResolvedStructure(profile);
  const action = buildObjectiveAction(profile);
  const primaryService = services[0] || form.businessType;
  const continuityServices = buildContinuityServiceCards(services, form, profile);
  const continuityBenefits = buildContinuityBenefits(form, profile);
  const continuityTestimonials = buildContinuityTestimonials(form, profile);
  const continuityProcess = buildContinuityProcess(form, profile, strategy);
  const continuityFaq = buildContinuityFaq(form, profile, primaryService, strategy);
  const proofPhrase = buildNicheProofPhrase(form, profile);
  const primaryCta = strategy.primaryCta || form.cta;
  const secondaryCta = strategy.secondaryCta || buildHeroSecondaryCta(profile);

  return {
    hero: {
      eyebrow: `${form.businessType}${citySuffix}`,
      title: buildNicheHeroTitle(form, profile, action),
      subtitle: `${form.businessName} aide ${profile.targetAudience.toLowerCase()} avec ${primaryService.toLowerCase()} : une promesse lisible, des preuves concretes et une prochaine etape claire.`,
      promise: `${strategy.promise}. ${proofPhrase} aide ?  ${action.verb} avec plus de confiance.`,
      cta_primary: primaryCta,
      cta_secondary: secondaryCta,
    },
    problem_solution: {
      title: `Ce qui bloque avant de ${action.verb}`,
      problem: `${profile.targetAudience} hesite quand ${action.problem}.`,
      solution: `${form.businessName} clarifie ${profile.offer.toLowerCase()}, ${proofPhrase}, les benefices et les reponses aux objections avant la prise de contact.`,
    },
    services: continuityServices,
    benefits: continuityBenefits,
    testimonials: continuityTestimonials,
    process: continuityProcess,
    reassurance: {
      title: `Des reperes concrets avant de ${action.verb}`,
      content: `${form.businessName} rassure avec ${proofPhrase}, une methode lisible et un CTA unique pour aider ${profile.targetAudience.toLowerCase()} ?  ${profile.conversionGoal}.`,
      items: unique([
        profile.proofAngle,
        action.proof,
        form.city ? `Ancrage local a ${form.city}` : "Zone d'intervention expliquee",
        `CTA aligne sur ${profile.conversionGoal}`,
      ]).slice(0, 4),
    },
    local_seo: {
      title: `${primaryKeyword} : une page pensee pour repondre ?  une vraie recherche client`,
      content: form.city
        ? `${form.businessName} relie son activite a ${form.city}, precise les services disponibles et repond aux questions que les clients se posent avant de contacter.`
        : `${form.businessName} relie son activite aux intentions de recherche, aux services et aux questions qui precedent la prise de contact.`,
      items: unique([
        primaryKeyword,
        ...profile.seoKeywords,
        form.city ? `Service proche de ${form.city}` : form.businessType,
      ]).slice(0, 4),
    },
    faq: continuityFaq,
    final_cta: {
      title: form.city
        ? `${form.businessName} est pret ?  recevoir des demandes qualifiees a ${form.city}`
        : `${form.businessName} est pret ?  transformer l'interet en action`,
      subtitle: `Le parcours met en avant ${profile.offer.toLowerCase()}, repond aux objections et guide le client vers "${primaryCta}".`,
      button: primaryCta,
    },
    metadata: {
      target_audience: profile.targetAudience,
      conversion_goal: profile.conversionGoal,
      positioning: profile.positioning,
      niche: profile.niche,
      offer: profile.offer,
      differentiators: unique([
        ...profile.differentiators,
        ...strategy.differentiationHooks,
        proofPhrase,
        form.city ? `Presence locale a ${form.city}` : "",
      ]).slice(0, 4),
      seo_keywords: unique([primaryKeyword, ...profile.seoKeywords]).slice(0, 6),
      seo_title: form.city
        ? `${form.businessType} a ${form.city} | ${form.businessName}`
        : `${form.businessName} | ${form.businessType}`,
      meta_description: `${form.businessName} aide ${profile.targetAudience.toLowerCase()} ?  ${profile.conversionGoal} avec ${profile.offer.toLowerCase()}, un message clair et un CTA ${primaryCta}.`,
    },
    design: {
      colors: profile.palette,
      style: `${form.style} ${profile.positioning}`,
      layout_type: profile.layoutType,
      animation_style: profile.animationStyle,
      visual_direction: `${strategy.visualStyle}. Rendu ${profile.positioning}, mobile-first et oriente conversion.`,
      typography:
        profile.positioning === "premium"
          ? "Titres editoriaux marques, textes courts, contraste net et respiration haut de gamme"
          : "Titres directs, paragraphes courts, hierarchie lisible et rythme mobile-first",
      image_style: profile.imageStyle,
      spacing_style:
        profile.positioning === "accessible"
          ? "Sections compactes, lisibles et rapides ?  parcourir"
          : "Sections aerees, cartes equilibrees et respiration premium",
      button_style: "CTA principal contraste, bouton secondaire discret et etats hover visibles",
      card_style: "Cartes sobres, bordures fines, titres precis et descriptions orientees resultat",
      section_style: "Alternance hero, offres, preuves, methode, FAQ et CTA sans bloc decoratif inutile",
      mobile_behavior: "Mobile-first, CTA principal accessible, sections empilees et aucune navigation bloquante",
      designArchetype: profile.designArchetype,
    },
    visuals: {
      accent_label: profile.visualDirection,
      hero_scene: buildVisualFallbackScenes(form, profile).heroScene,
      hero_alt: buildVisualFallbackScenes(form, profile).heroAlt,
      gallery: buildVisualFallbackScenes(form, profile).gallery,
    },
    sectionOrder: normalizeSectionOrder(
      strategy.prioritySections,
      resolvedStructure.prioritySections,
      resolvedStructure.allowedSections,
    ),
  };
};

const normalizeSectionOrder = (
  order: string[],
  fallback: SectionId[],
  allowedSections: SectionId[],
) => {
  const allowed = new Set(allowedSections);
  const normalized = toSectionIdList(order).filter((section) => allowed.has(section));
  const completed = [...normalized];

  fallback.forEach((section) => {
    if (allowed.has(section) && !completed.includes(section)) {
      completed.push(section);
    }
  });

  if (!completed.includes("hero")) completed.unshift("hero");
  if (!completed.includes("final_cta")) completed.push("final_cta");

  return unique(completed) as SectionId[];
};

const buildResolvedStructure = (profile: BusinessProfile): ResolvedStructure => {
  const shouldUseLocalSeo =
    profile.isLocalIntent || profile.niche === "restaurant" || profile.niche === "immobilier";

  const objectiveTemplates: Record<
    ObjectiveMode,
    Omit<ResolvedStructure, "objectiveMode" | "sectionOrder" | "prioritySections">
  > = {
    "attirer-clients": {
      sectionRationale: [
        "ouvrir avec une promesse qui attire tout de suite",
        "mettre l'offre au contact du visiteur sans blabla",
        "faire monter la confiance avant de demander l'action",
      ],
      heroObjective: "faire comprendre la promesse et le resultat client en moins de 3 secondes",
      proofStyle: "preuves sociales concretes et benefices visibles des les premiers ecrans",
      offerStyle: "offres nettes, lisibles, orientees resultat plutot que categorie",
      reassuranceStyle: "reassurance utile, concrete et jamais decorative",
      ctaIntensity: "direct mais propre, pense pour obtenir une demande ou un contact qualifie",
      allowedSections: [
        "hero",
        "problem_solution",
        "services",
        "benefits",
        "testimonials",
        "process",
        "reassurance",
        ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
        "faq",
        "final_cta",
      ],
    },
    "generer-leads": {
      sectionRationale: [
        "accrocher vite avec une valeur immediate",
        "rendre l'offre facile a demander ou qualifier",
        "lever les objections avant le CTA final",
      ],
      heroObjective: "declencher une demande qualifiee avec une promesse, un hook et un CTA evidents",
      proofStyle: "preuve sociale et credibilite pour rassurer avant la capture",
      offerStyle: "offres structurees comme points d'entree vers un lead",
      reassuranceStyle: "garanties, modalites et clarte de prise de contact",
      ctaIntensity: "capture claire, simple et prioritaire",
      allowedSections: [
        "hero",
        "problem_solution",
        "services",
        "benefits",
        "testimonials",
        "reassurance",
        ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
        "faq",
        "final_cta",
      ],
    },
    "renforcer-credibilite": {
      sectionRationale: [
        "ouvrir avec une promesse nette puis prouver l'autorite",
        "placer methodes, offres et temoignages comme piliers de confiance",
        "finir sur une action simple apr\u00e8s avoir rassure",
      ],
      heroObjective: "faire sentir une autorite credible avant meme le premier contact",
      proofStyle: "preuves d'autorite, temoignages credibles et signaux de serieux",
      offerStyle: "offres formulees comme accompagnements rassurants",
      reassuranceStyle: "preuves, garanties, modalites et serieux local si pertinent",
      ctaIntensity: "sobre, rassurant et tres credible",
      allowedSections: [
        "hero",
        "testimonials",
        "services",
        "process",
        "reassurance",
        ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
        "faq",
        "final_cta",
      ],
    },
    "prendre-rendez-vous": {
      sectionRationale: [
        "ouvrir avec une promesse liee au rendez-vous ou a la r\u00e9servation",
        "montrer vite l'offre puis le parcours en 3 etapes max",
        "rassurer juste avant la prise de rendez-vous",
      ],
      heroObjective: "donner envie de reserver ou prendre rendez-vous sans hesitation",
      proofStyle: "preuves rapides, temoignages utiles et reponse aux freins immediats",
      offerStyle: "offres formulees pour faciliter une r\u00e9servation simple",
      reassuranceStyle: "clarte de deroulement, disponibilite et confiance pratique",
      ctaIntensity: "r\u00e9servation prioritaire, tres visible et sans detour",
      allowedSections: [
        "hero",
        "problem_solution",
        "services",
        "process",
        "reassurance",
        "testimonials",
        ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
        "faq",
        "final_cta",
      ],
    },
    "vendre-plus": {
      sectionRationale: [
        "ouvrir avec la proposition de valeur puis l'offre",
        "mettre rapidement les benefices et les preuves de valeur",
        "traiter les objections avant un CTA plus direct",
      ],
      heroObjective: "mettre la valeur de l'offre en avant pour vendre plus vite",
      proofStyle: "preuves de valeur et signaux de confiance qui aident a acheter",
      offerStyle: "offres ou services presentes comme moteurs de vente",
      reassuranceStyle: "objections levees, garanties et preuves avant decision",
      ctaIntensity: "plus direct, plus commercial, sans agressivite artificielle",
      allowedSections: [
        "hero",
        "services",
        "benefits",
        "testimonials",
        "reassurance",
        ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
        "faq",
        "final_cta",
      ],
    },
  };

  const baseOrderByObjective: Record<ObjectiveMode, SectionId[]> = {
    "attirer-clients": [
      "hero",
      "problem_solution",
      "services",
      "benefits",
      "testimonials",
      "process",
      "reassurance",
      ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
      "faq",
      "final_cta",
    ],
    "generer-leads": [
      "hero",
      "problem_solution",
      "services",
      "benefits",
      "testimonials",
      "reassurance",
      ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
      "faq",
      "final_cta",
    ],
    "renforcer-credibilite": [
      "hero",
      "testimonials",
      "services",
      "process",
      "reassurance",
      ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
      "faq",
      "final_cta",
    ],
    "prendre-rendez-vous": [
      "hero",
      "problem_solution",
      "services",
      "process",
      "reassurance",
      "testimonials",
      ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
      "faq",
      "final_cta",
    ],
    "vendre-plus": [
      "hero",
      "services",
      "benefits",
      "testimonials",
      "reassurance",
      ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
      "faq",
      "final_cta",
    ],
  };

  let nicheAdjustedOrder = [...baseOrderByObjective[profile.objectiveMode]];

  if (profile.niche === "coach" && nicheAdjustedOrder.includes("benefits")) {
    nicheAdjustedOrder = [
      "hero",
      "problem_solution",
      "benefits",
      ...nicheAdjustedOrder.filter(
        (section) => !["hero", "problem_solution", "benefits"].includes(section),
      ),
    ];
  }

  if (profile.niche === "immobilier") {
    nicheAdjustedOrder = [
      "hero",
      "testimonials",
      "services",
      "reassurance",
      ...nicheAdjustedOrder.filter(
        (section) => !["hero", "testimonials", "services", "reassurance"].includes(section),
      ),
    ];
  }

  if (profile.niche === "restaurant" && profile.objectiveMode === "prendre-rendez-vous") {
    nicheAdjustedOrder = [
      "hero",
      "services",
      "problem_solution",
      "testimonials",
      "process",
      "reassurance",
      ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
      "faq",
      "final_cta",
    ];
  }

  if (profile.niche === "local-services") {
    nicheAdjustedOrder = [
      "hero",
      "services",
      "problem_solution",
      "reassurance",
      ...(shouldUseLocalSeo ? (["local_seo"] as SectionId[]) : []),
      ...nicheAdjustedOrder.filter(
        (section) =>
          !["hero", "services", "problem_solution", "reassurance", "local_seo"].includes(section),
      ),
    ];
  }

  const template = objectiveTemplates[profile.objectiveMode];
  const sectionOrder = normalizeSectionOrder(
    nicheAdjustedOrder,
    baseOrderByObjective[profile.objectiveMode],
    template.allowedSections,
  );

  return {
    objectiveMode: profile.objectiveMode,
    sectionOrder,
    prioritySections: sectionOrder,
    sectionRationale: template.sectionRationale,
    heroObjective: template.heroObjective,
    proofStyle: template.proofStyle,
    offerStyle: template.offerStyle,
    reassuranceStyle: template.reassuranceStyle,
    ctaIntensity: template.ctaIntensity,
    allowedSections: template.allowedSections,
  };
};

const buildSectionOrder = (profile: BusinessProfile) => buildResolvedStructure(profile).sectionOrder;

const buildServicesTitle = (profile: BusinessProfile) => {
  const byObjective: Record<ObjectiveMode, string> = {
    "attirer-clients": "Des offres pensees pour convertir des visiteurs en vrais prospects",
    "generer-leads": "Des offres structurees pour faire entrer des demandes qualifiees",
    "renforcer-credibilite": "Des offres presentees avec plus de clarte, d'autorite et de serieux",
    "prendre-rendez-vous": "Des offres simples a comprendre avant de reserver ou prendre rendez-vous",
    "vendre-plus": "Des offres mises en avant pour aider le client a passer a l'achat",
  };

  const titles: Record<string, string> = {
    restaurant: "Une offre pens\u00e9e pour donner envie et faire r\u00e9server",
    coach: "Des accompagnements con\u00e7us pour d\u00e9clencher un vrai passage \u00e0 l'action",
    immobilier: "Des services qui rassurent et rendent le projet plus fluide",
    "local-services": "Des prestations claires pour obtenir des demandes qualifi\u00e9es",
  };

  return titles[profile.niche] || byObjective[profile.objectiveMode] || `Des services precis pour ${profile.conversionGoal}`;
};

const buildBenefitsTitle = (profile: BusinessProfile) => {
  const byObjective: Record<ObjectiveMode, string> = {
    "attirer-clients": "Ce que le client comprend, retient et juge credible",
    "generer-leads": "Ce qui pousse un prospect a laisser une demande plutot qu'a repartir",
    "renforcer-credibilite": "Ce qui renforce l'autorite percue avant le premier echange",
    "prendre-rendez-vous": "Ce qui donne envie d'avancer sans reporter la decision",
    "vendre-plus": "Ce qui rend l'offre plus desirable et plus facile a acheter",
  };

  const titles: Record<string, string> = {
    restaurant: "Pourquoi l'exp\u00e9rience donne envie d\u00e8s les premi\u00e8res secondes",
    coach: "Pourquoi la m\u00e9thode aide \u00e0 passer \u00e0 l'action",
    immobilier: "Pourquoi l'accompagnement inspire confiance avant le premier contact",
    "local-services": "Pourquoi les clients locaux peuvent demander un devis plus vite",
  };

  return titles[profile.niche] || byObjective[profile.objectiveMode] || `Pourquoi ${profile.offer} peut convaincre plus vite`;
};

const buildCtaTitle = (form: Required<FormPayload>, profile: BusinessProfile) => {
  const byObjective: Record<ObjectiveMode, string> = {
    "attirer-clients": `${form.businessName} peut maintenant transformer plus de visites en prises de contact`,
    "generer-leads": `Lancez une demande qualifiee avec ${form.businessName}`,
    "renforcer-credibilite": `Obtenez un premier echange rassurant avec ${form.businessName}`,
    "prendre-rendez-vous": `Reserve ou prenez rendez-vous avec ${form.businessName}`,
    "vendre-plus": `Passez a l'action sur l'offre de ${form.businessName}`,
  };

  const titles: Record<string, string> = {
    restaurant: `R\u00e9servez ou contactez ${form.businessName} en quelques secondes`,
    coach: `Passez \u00e0 l'\u00e9tape suivante avec ${form.businessName}`,
    immobilier: `Obtenez un premier \u00e9change clair avec ${form.businessName}`,
    "local-services": `Demandez une intervention ou un devis \u00e0 ${form.businessName}`,
  };

  return titles[profile.niche] || byObjective[profile.objectiveMode] || `${form.cta} avec ${form.businessName}`;
};

const buildHeroSecondaryCta = (profile: BusinessProfile) => {
  const byObjective: Record<ObjectiveMode, string> = {
    "attirer-clients": "Voir les offres",
    "generer-leads": "Voir ce que vous obtenez",
    "renforcer-credibilite": "Voir les preuves",
    "prendre-rendez-vous": "Voir comment ca se passe",
    "vendre-plus": "Voir l'offre",
  };

  const labels: Record<string, string> = {
    restaurant: "Voir la carte",
    coach: "Voir la m\u00e9thode",
    immobilier: "Voir l'accompagnement",
    "car-rental": "Voir les disponibilit\u00e9s",
    "local-services": "Voir les prestations",
  };

  return labels[profile.niche] || byObjective[profile.objectiveMode] || "Voir l'offre";
};

const buildVisualFallbackScenes = (form: Required<FormPayload>, profile: BusinessProfile) => {
  const cityHook = form.city ? `a ${form.city}` : "dans son marche local";

  const scenesByNiche: Record<
    string,
    {
      accentLabel: string;
      heroScene: string;
      heroAlt: string;
      gallery: Array<{ scene: string; alt: string }>;
    }
  > = {
    restaurant: {
      accentLabel: "Exp\u00e9rience gourmande",
      heroScene: `photo \u00e9ditoriale premium d'un restaurant ${cityHook}, salle chaleureuse, lumi\u00e8re dor\u00e9e, dressage haut de gamme, sans texte ni logo`,
      heroAlt: `${form.businessName} restaurant premium`,
      gallery: [
        {
          scene: "plat signature dress\u00e9 avec soin, lumi\u00e8re naturelle, rendu gastronomique premium, sans texte",
          alt: "Plat signature",
        },
        {
          scene: "vue de la salle, d\u00e9tails de d\u00e9coration, atmosph\u00e8re accueillante et premium, sans clients reconnaissables",
          alt: "Salle du restaurant",
        },
        {
          scene: "chef ou \u00e9quipe en pr\u00e9paration soign\u00e9e, cadrage professionnel, \u00e9nergie calme et ma\u00eetris\u00e9e",
          alt: "Pr\u00e9paration en cuisine",
        },
      ],
    },
    coach: {
      accentLabel: "Transformation visible",
      heroScene: `photo premium d'un coach accompagnant un client ${cityHook}, \u00e9nergie positive, mouvement naturel, rendu \u00e9ditorial, sans texte ni logo`,
      heroAlt: `${form.businessName} coach premium`,
      gallery: [
        {
          scene: "s\u00e9ance de coaching en action, posture forte, lumi\u00e8re sportive premium, sans branding visible",
          alt: "S\u00e9ance de coaching",
        },
        {
          scene: "accompagnement individuel, \u00e9change motivant, ambiance studio haut de gamme",
          alt: "Accompagnement personnalis\u00e9",
        },
        {
          scene: "moment de r\u00e9sultat ou progression visible, cadrage inspirant, sans clich\u00e9 excessif",
          alt: "Progression visible",
        },
      ],
    },
    immobilier: {
      accentLabel: "Confiance locale",
      heroScene: `photo premium d'un bien immobilier lumineux ${cityHook}, architecture \u00e9l\u00e9gante, sensation de confiance et valeur, sans texte ni logo`,
      heroAlt: `${form.businessName} immobilier premium`,
      gallery: [
        {
          scene: "int\u00e9rieur lumineux et haut de gamme, lignes propres, impression d'espace et de confiance",
          alt: "Int\u00e9rieur lumineux",
        },
        {
          scene: "agent immobilier en \u00e9change rassurant avec clients, cadrage \u00e9l\u00e9gant, ambiance professionnelle",
          alt: "Conseil immobilier",
        },
        {
          scene: "fa\u00e7ade ou vue ext\u00e9rieure valorisante, style premium, lumi\u00e8re naturelle",
          alt: "Bien immobilier",
        },
      ],
    },
    "car-rental": {
      accentLabel: "R\u00e9servation simple",
      heroScene: `photo premium d'un v\u00e9hicule propre disponible \u00e0 la location ${cityHook}, remise des cl\u00e9s simple, ambiance urbaine moderne, sans texte ni logo`,
      heroAlt: `${form.businessName} location de voiture`,
      gallery: [
        {
          scene: "v\u00e9hicule propre pr\u00eat \u00e0 partir, cadrage premium, sensation de simplicit\u00e9 et libert\u00e9",
          alt: "V\u00e9hicule disponible",
        },
        {
          scene: "remise des cl\u00e9s fluide entre un conseiller et un client, ambiance professionnelle et rassurante",
          alt: "Remise des cl\u00e9s",
        },
        {
          scene: "route urbaine moderne avec voiture en mouvement, rendu premium, sans plaque lisible ni logo",
          alt: "Trajet urbain",
        },
      ],
    },
    "sports-betting-advice": {
      accentLabel: "Analyse responsable",
      heroScene: `photo premium d'une analyse sportive responsable ${cityHook}, \u00e9cran de statistiques, terrain en arri\u00e8re-plan, ambiance noire et dor\u00e9e possible, sans texte ni logo`,
      heroAlt: `${form.businessName} analyses sportives responsables`,
      gallery: [
        {
          scene: "analyse d'avant-match sur ordinateur, statistiques lisibles, ambiance premium, sans cote visible ni promesse de gain",
          alt: "Analyse d'avant-match",
        },
        {
          scene: "stade ou terrain de football en soir\u00e9e, \u00e9nergie sportive, rendu cin\u00e9matique, sans marque",
          alt: "Contexte sportif",
        },
        {
          scene: "communaut\u00e9 sportive consultant un calendrier de matchs, rendu professionnel, sans argent ni pari direct",
          alt: "Communaut\u00e9 de pronostics",
        },
      ],
    },
    "education-training": {
      accentLabel: "Progression claire",
      heroScene: `photo premium d'une formation ou session d'apprentissage ${cityHook}, groupe concentr\u00e9, support clair, ambiance moderne, sans texte ni logo`,
      heroAlt: `${form.businessName} formation professionnelle`,
      gallery: [
        {
          scene: "apprenant en progression avec ordinateur et notes, lumi\u00e8re naturelle, rendu professionnel",
          alt: "Progression apprenant",
        },
        {
          scene: "formateur expliquant une m\u00e9thode claire \u00e0 un petit groupe, cadre premium",
          alt: "Accompagnement p\u00e9dagogique",
        },
        {
          scene: "atelier pratique ou exercice guid\u00e9, concentration, collaboration et r\u00e9sultat visible",
          alt: "Atelier pratique",
        },
      ],
    },
    "travel-hospitality": {
      accentLabel: "Exp\u00e9rience m\u00e9morable",
      heroScene: `photo premium d'un lieu d'accueil ou s\u00e9jour ${cityHook}, ambiance chaleureuse, d\u00e9tail d'exp\u00e9rience, sans texte ni logo`,
      heroAlt: `${form.businessName} s\u00e9jour premium`,
      gallery: [
        {
          scene: "chambre ou espace d'accueil lumineux, d\u00e9tails soign\u00e9s, rendu premium",
          alt: "Espace d'accueil",
        },
        {
          scene: "exp\u00e9rience locale ou moment de voyage, lumi\u00e8re naturelle, sensation de confiance",
          alt: "Exp\u00e9rience locale",
        },
        {
          scene: "service client ou arriv\u00e9e sur place, accueil professionnel et rassurant",
          alt: "Accueil sur place",
        },
      ],
    },
    "events-entertainment": {
      accentLabel: "Moment fort",
      heroScene: `photo premium d'un \u00e9v\u00e9nement r\u00e9ussi ${cityHook}, ambiance lumineuse, public ou d\u00e9cor soign\u00e9, sans texte ni logo`,
      heroAlt: `${form.businessName} \u00e9v\u00e9nement premium`,
      gallery: [
        {
          scene: "d\u00e9tail d'installation \u00e9v\u00e9nementielle, lumi\u00e8res, sc\u00e8ne ou d\u00e9cor, rendu professionnel",
          alt: "Installation \u00e9v\u00e9nementielle",
        },
        {
          scene: "moment d'ambiance avec invit\u00e9s flous non reconnaissables, \u00e9nergie positive",
          alt: "Ambiance d'\u00e9v\u00e9nement",
        },
        {
          scene: "organisateur pr\u00e9parant les derniers d\u00e9tails, cadre fiable et premium",
          alt: "Organisation soign\u00e9e",
        },
      ],
    },
    "saas-tech": {
      accentLabel: "Produit clair",
      heroScene: `photo premium d'une interface produit ou dashboard SaaS ${cityHook}, \u00e9cran moderne, \u00e9quipe en contexte, sans texte lisible ni logo`,
      heroAlt: `${form.businessName} produit SaaS`,
      gallery: [
        {
          scene: "dashboard moderne sur ordinateur, cartes de donn\u00e9es abstraites, rendu propre, sans texte lisible",
          alt: "Interface produit",
        },
        {
          scene: "\u00e9quipe utilisant un logiciel en r\u00e9union, ambiance startup premium et structur\u00e9e",
          alt: "Usage en \u00e9quipe",
        },
        {
          scene: "d\u00e9tail de workflow digital, automatisation ou int\u00e9gration, rendu technologique sobre",
          alt: "Workflow digital",
        },
      ],
    },
    "personal-brand": {
      accentLabel: "Autorit\u00e9 personnelle",
      heroScene: `photo \u00e9ditoriale premium d'un expert ou cr\u00e9ateur ${cityHook}, posture confiante, espace moderne, sans texte ni logo`,
      heroAlt: `${form.businessName} marque personnelle`,
      gallery: [
        {
          scene: "expert en conversation avec un client, lumi\u00e8re naturelle, rendu humain et professionnel",
          alt: "Premier \u00e9change",
        },
        {
          scene: "prise de parole ou atelier devant un petit groupe, ambiance premium et cr\u00e9dible",
          alt: "Prise de parole",
        },
        {
          scene: "d\u00e9tail de notes, m\u00e9thode ou pr\u00e9paration, cadrage \u00e9ditorial",
          alt: "M\u00e9thode personnelle",
        },
      ],
    },
    wellness: {
      accentLabel: "Bien-\u00eatre visible",
      heroScene: `photo premium d'un espace bien-\u00eatre ${cityHook}, ambiance calme, lumi\u00e8re douce, cadre professionnel, sans texte ni logo`,
      heroAlt: `${form.businessName} bien-\u00eatre`,
      gallery: [
        {
          scene: "s\u00e9ance ou pr\u00e9paration dans un cadre apaisant, rendu naturel et professionnel",
          alt: "S\u00e9ance bien-\u00eatre",
        },
        {
          scene: "\u00e9change rassurant avant rendez-vous, posture d'\u00e9coute, lumi\u00e8re douce",
          alt: "Accueil rassurant",
        },
        {
          scene: "d\u00e9tail d'environnement propre et apaisant, textures naturelles, rendu premium",
          alt: "Cadre apaisant",
        },
      ],
    },
    "automotive-services": {
      accentLabel: "Service auto fiable",
      heroScene: `photo premium d'un atelier automobile ${cityHook}, v\u00e9hicule propre, diagnostic pr\u00e9cis, ambiance fiable, sans texte ni logo`,
      heroAlt: `${form.businessName} service automobile`,
      gallery: [
        {
          scene: "diagnostic automobile pr\u00e9cis, outil en main, lumi\u00e8re atelier propre, rendu professionnel",
          alt: "Diagnostic auto",
        },
        {
          scene: "d\u00e9tail de r\u00e9paration ou entretien propre, sensation de ma\u00eetrise technique",
          alt: "Intervention automobile",
        },
        {
          scene: "remise du v\u00e9hicule ou \u00e9change client, confiance et transparence",
          alt: "Relation client auto",
        },
      ],
    },
    "pet-services": {
      accentLabel: "Confiance animal",
      heroScene: `photo premium d'un professionnel avec un animal ${cityHook}, cadre propre, attention et confiance, sans texte ni logo`,
      heroAlt: `${form.businessName} service animalier`,
      gallery: [
        {
          scene: "chien ou chat dans un cadre propre et rassurant, attention professionnelle, lumi\u00e8re naturelle",
          alt: "Soin animal",
        },
        {
          scene: "\u00e9change avec un propri\u00e9taire d'animal, confiance, consignes et suivi",
          alt: "Accueil propri\u00e9taire",
        },
        {
          scene: "espace de garde ou soin animal propre, calme et professionnel",
          alt: "Cadre animalier",
        },
      ],
    },
    "local-services": {
      accentLabel: "Fiabilit\u00e9 terrain",
      heroScene: `photo premium d'un professionnel de terrain ${cityHook}, intervention propre, outil ma\u00eetris\u00e9, rendu fiable et rassurant, sans texte`,
      heroAlt: `${form.businessName} service local`,
      gallery: [
        {
          scene: "d\u00e9tail d'une intervention propre et pr\u00e9cise, sensation de s\u00e9rieux et ma\u00eetrise",
          alt: "Intervention soign\u00e9e",
        },
        {
          scene: "\u00e9change client professionnel, confiance, proximit\u00e9, service clair",
          alt: "Relation client",
        },
        {
          scene: "r\u00e9sultat final net et valorisant, avant/apr\u00e8s implicite, rendu propre",
          alt: "R\u00e9sultat final",
        },
      ],
    },
    "creative-services": isPhotographyBusiness(form)
      ? {
          accentLabel: "Portfolio photo",
          heroScene: `photo editoriale premium d'un photographe en seance ${cityHook}, lumiere naturelle, appareil photo, sujet valorise, ambiance professionnelle, sans texte ni logo`,
          heroAlt: `${form.businessName} photographe`,
          gallery: [
            {
              scene: "seance portrait soignee, lumiere naturelle, cadrage professionnel, emotion credible, sans texte ni logo",
              alt: "Seance portrait",
            },
            {
              scene: "reportage mariage ou evenement, detail emotionnel, ambiance elegante, personnes non reconnaissables",
              alt: "Reportage photo",
            },
            {
              scene: "shooting marque ou contenu social, decor moderne, preparation et direction de pose, rendu premium",
              alt: "Shooting professionnel",
            },
          ],
        }
      : {
          accentLabel: "Impact visuel",
          heroScene: `photo premium d'une direction creative ${cityHook}, moodboard, studio ou production visuelle, ambiance expressive et maitrisee, sans texte`,
          heroAlt: `${form.businessName} direction creative`,
          gallery: [
            {
              scene: "atelier creatif avec moodboard, matieres, ecran et preparation visuelle, rendu premium",
              alt: "Direction creative",
            },
            {
              scene: "creation de contenu en studio, lumiere maitrisee, setup professionnel",
              alt: "Creation de contenu",
            },
            {
              scene: "resultat visuel ou identite de marque presentee proprement, rendu editorial",
              alt: "Resultat creatif",
            },
          ],
        },
  };

  return (
    scenesByNiche[profile.niche] || {
      accentLabel: profile.visualDirection,
      heroScene: `photo premium d'une activit\u00e9 ${cityHook}, ambiance ${profile.visualDirection}, cr\u00e9dibilit\u00e9 imm\u00e9diate, sans texte ni logo`,
      heroAlt: `${form.businessName} ${form.businessType}`,
      gallery: [
        {
          scene: "d\u00e9tail de service haut de gamme, cadrage propre, sensation de s\u00e9rieux et clart\u00e9",
          alt: "Service principal",
        },
        {
          scene: "interaction client rassurante et professionnelle, lumi\u00e8re naturelle, rendu \u00e9ditorial",
          alt: "Relation client",
        },
        {
          scene: "r\u00e9sultat ou environnement final valorisant, rendu premium et cr\u00e9dible",
          alt: "R\u00e9sultat final",
        },
      ],
    }
  );
};

const normalizeVisualBrief = (
  rawVisuals: Partial<RawSitePayload["visuals"]> | null | undefined,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const fallbackScenes = buildVisualFallbackScenes(form, profile);
  const gallerySource = Array.isArray(rawVisuals?.gallery) ? rawVisuals.gallery : [];

  return {
    accentLabel: normalizeText(rawVisuals?.accent_label, fallbackScenes.accentLabel),
    hero: {
      prompt: normalizeText(rawVisuals?.hero_scene, fallbackScenes.heroScene),
      alt: normalizeText(rawVisuals?.hero_alt, fallbackScenes.heroAlt),
    },
    gallery: Array.from({ length: 4 }).map((_, index) => ({
      prompt: normalizeText(gallerySource[index]?.scene, fallbackScenes.gallery[index]?.scene || fallbackScenes.gallery[0].scene),
      alt: normalizeText(gallerySource[index]?.alt, fallbackScenes.gallery[index]?.alt || `Visuel ${index + 1}`),
    })),
  };
};

const buildOriginalVisualCreativeDirection = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const source = normalizeText(
    [
      form.businessName,
      form.businessType,
      form.city,
      form.targetAudience,
      form.style,
      form.colors,
      form.description,
      form.enhancers.join(" "),
    ].join(" "),
  );
  const hasWhatsapp = /\bwhatsapp\b|\bmessage\b|\bdm\b/i.test(source);
  const hasSocialYouth = /\btiktok\b|\btik tok\b|\bjeune\b|\bgen z\b|\bsocial\b|\breels\b/i.test(source);
  const hasPortfolio = /\bportfolio\b|\bgalerie\b|\bphoto\b|\bphotographe\b|\bshooting\b|\bportrait\b/i.test(source);
  const explicitStyle = normalizeText([form.style, form.colors].filter(Boolean).join(", "));
  const localContext = form.city ? `contexte local ${form.city}` : "contexte client credible";
  const channelContext = hasWhatsapp ? "CTA mobile et contact WhatsApp naturel, sans afficher de logo commercial" : "";
  const socialContext = hasSocialYouth ? "energie social-first, composition jeune, rythme visuel type creator economy, sans copier une interface TikTok" : "";
  const portfolioContext = hasPortfolio ? "vraie logique portfolio : sujet, emotion, lumiere, resultat visuel et preuve de style" : "";

  return [
    `direction metier : ${profile.niche}, ${profile.offer}`,
    `vision utilisateur : ${explicitStyle || profile.visualDirection}`,
    localContext,
    channelContext,
    socialContext,
    portfolioContext,
    `niveau de gamme : ${profile.positioning}`,
    `interdiction : aucune image de template tiers, aucun texte dans l'image, aucun logo, aucune copie de template`,
  ]
    .filter(Boolean)
    .join(". ");
};

const buildClientSafeVisualPrompt = (
  kind: "hero" | "support",
  scenePrompt: string,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const composition =
    kind === "hero"
      ? "wide website hero, strong focal point, premium landing page crop"
      : "website section visual, distinct supporting scene, editorial crop";

  return [
    `Original client-safe visual for ${form.businessName}`,
    composition,
    scenePrompt,
    buildOriginalVisualCreativeDirection(form, profile),
    profile.imageStyle,
    "realistic commercial photography or premium editorial mockup",
    "licensed-stock compatible, AI-image compatible, original composition",
    "no copyrighted template asset, no third-party template image, no watermark, no readable text, no logo, no UI screenshot copy, no collage",
  ]
    .filter(Boolean)
    .join(". ");
};

const generateVisualDataUrl = async (prompt: string) => {
  const models = [IMAGE_GENERATION_MODEL, IMAGE_GENERATION_FALLBACK_MODEL];
  let lastErrorText = "";

  for (const model of models) {
    const response = await createAIImageGeneration({
      model,
      prompt,
      response_format: "b64_json",
      n: 1,
    });

    if (!response.ok) {
      const text = await response.text();
      lastErrorText = `Image generation failed (${response.status}) with ${model}: ${text}`;

      if (
        isAIModelFallbackStatus(response.status) ||
        isAIModelFallbackMessage(text)
      ) {
        console.warn("AI image model fallback used.", {
          status: response.status,
          model,
        });
        continue;
      }

      throw new Error(lastErrorText);
    }

    const payload = await response.json();
    const b64 = payload.data?.[0]?.b64_json;

    if (!b64 || typeof b64 !== "string") {
      lastErrorText = `Image generation returned no usable payload with ${model}.`;
      continue;
    }

    return `data:image/png;base64,${b64}`;
  }

  throw new Error(lastErrorText || "Image generation returned no usable payload.");
};

const buildVisualAssets = async (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  rawVisuals: Partial<RawSitePayload["visuals"]> | null | undefined,
  existingVisuals: GeneratedContent["visuals"] | null,
) => {
  const fallbackLibrary = getFallbackVisualLibrary(profile.niche);
  const visualSeed = `${form.businessName}|${form.businessType}|${form.city}|${form.description}|${form.variationSeed}|${Date.now()}|${Math.random()}`;
  const rotatedFallbackImages = rotateItems(
    unique([fallbackLibrary.hero, ...fallbackLibrary.gallery]),
    visualSeed,
  );
  const normalized = normalizeVisualBrief(rawVisuals, form, profile);

  const visualPrompts = [
    buildClientSafeVisualPrompt("hero", normalized.hero.prompt, form, profile),
    ...normalized.gallery.map(
      (item) => buildClientSafeVisualPrompt("support", item.prompt, form, profile),
    ),
  ];

  const previousGallery = existingVisuals?.gallery || [];
  const shouldPreserveExistingVisuals =
    Boolean(existingVisuals && form.improvementPrompt) &&
    !/(image|photo|visuel|style|design|couleur|palette|ambiance|changer|change|diff[e?]rent|nouveau|r[e?]g[e?]n[e?]rer)/i.test(
      form.improvementPrompt,
    );
  const preservedHeroUrl = shouldPreserveExistingVisuals ? existingVisuals?.hero?.url : null;

  if (!ENABLE_AI_IMAGE_GENERATION) {
    return {
      accentLabel: normalized.accentLabel,
      hero: {
        alt: normalized.hero.alt,
        prompt: visualPrompts[0],
        url: preservedHeroUrl || rotatedFallbackImages[0] || fallbackLibrary.hero,
      },
      gallery: normalized.gallery.map((item, index) => ({
        alt: item.alt,
        prompt: visualPrompts[index + 1],
        url:
          (shouldPreserveExistingVisuals ? previousGallery[index]?.url : null) ||
          rotatedFallbackImages[index + 1] ||
          fallbackLibrary.gallery[index] ||
          fallbackLibrary.gallery[0],
      })),
    };
  }

  const generated = await Promise.allSettled(
    visualPrompts.map((prompt) => generateVisualDataUrl(prompt)),
  );

  return {
    accentLabel: normalized.accentLabel,
    hero: {
      alt: normalized.hero.alt,
      prompt: visualPrompts[0],
      url:
        generated[0].status === "fulfilled"
          ? generated[0].value
          : preservedHeroUrl || rotatedFallbackImages[0] || fallbackLibrary.hero,
    },
    gallery: normalized.gallery.map((item, index) => ({
      alt: item.alt,
      prompt: visualPrompts[index + 1],
      url:
        generated[index + 1].status === "fulfilled"
          ? generated[index + 1].value
          : (shouldPreserveExistingVisuals ? previousGallery[index]?.url : null) ||
            rotatedFallbackImages[index + 1] ||
            fallbackLibrary.gallery[index] ||
            fallbackLibrary.gallery[0],
    })),
  };
};

const ensureServices = (
  rawServices: RawSitePayload["services"],
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  if (Array.isArray(rawServices) && rawServices.length >= 3) {
    return rawServices.slice(0, 6).map((item, index) => ({
      name: normalizeText(item.name, `Offre ${index + 1}`),
      description: normalizeText(
        item.description || item.outcome,
        `Une offre pens\u00e9e pour ${profile.conversionGoal}, avec un b\u00e9n\u00e9fice visible pour ${profile.targetAudience} et un r\u00e9sultat concret.`,
      ),
    }));
  }

  const source = profile.serviceList.length ? profile.serviceList : [form.businessType, form.objective, form.cta];
  return source.slice(0, 4).map((entry, index) => ({
    name: repairServiceName(normalizeText(entry, `Offre ${index + 1}`), index, form, profile),
    description: buildSpecificServiceDescription(
      normalizeText(entry, form.businessType),
      form,
      profile,
      index,
    ),
  }));
};

const ensureBenefits = (
  rawBenefits: RawSitePayload["benefits"],
  form: Required<FormPayload>,
  profile: BusinessProfile,
  problemContent: string,
  reassuranceContent: string,
) => {
  if (Array.isArray(rawBenefits) && rawBenefits.length >= 3) {
    return rawBenefits.slice(0, 6).map((item, index) => ({
      title: normalizeText(item.title, `B\u00e9n\u00e9fice ${index + 1}`),
      description: normalizeText(
        item.description,
        `Un b\u00e9n\u00e9fice concret pour aider le client \u00e0 comprendre la valeur de ${form.businessName}.`,
      ),
    }));
  }

  return [
    ...buildContinuityBenefits(form, profile).slice(0, 3),
    { title: "Reponse aux objections cles", description: reassuranceContent || problemContent },
  ];
};

const ensureTestimonials = (
  rawTestimonials: RawSitePayload["testimonials"],
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  if (Array.isArray(rawTestimonials) && rawTestimonials.length >= 2) {
    return rawTestimonials.slice(0, 3).map((item, index) => ({
      name: normalizeText(item.name, `Client ${index + 1}`),
      role: normalizeText(item.role, form.businessType),
      text: normalizeText(
        item.text,
        `${form.businessName} a clarifi\u00e9 notre offre et rendu la prise de contact beaucoup plus fluide.`,
      ),
    }));
  }

  return [
    ...buildContinuityTestimonials(form, profile),
  ].slice(0, 3);
};

const ensureProcessSteps = (
  rawProcess: RawSitePayload["process"],
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  if (Array.isArray(rawProcess) && rawProcess.length >= 3) {
    return rawProcess.slice(0, 4).map((item, index) => ({
      step: normalizeText(item.step, String(index + 1)),
      title: normalizeText(item.title, `\u00e9tape ${index + 1}`),
      description: normalizeText(
        item.description,
        `Une \u00e9tape simple pour accompagner le client vers ${profile.conversionGoal}.`,
      ),
    }));
  }

  return [
    {
      step: "1",
      title: "Comprendre l'offre imm\u00e9diatement",
      description: "Le client voit rapidement le b\u00e9n\u00e9fice principal, le niveau de s\u00e9rieux et \u00e0 qui le site s'adresse.",
    },
    {
      step: "2",
      title: "Se sentir rassur\u00e9",
      description: "Les offres, preuves et \u00e9l\u00e9ments de r\u00e9assurance confirment qu'il est au bon endroit.",
    },
    {
      step: "3",
      title: "Passer \u00e0 l'action avec les bonnes informations",
      description: `Le CTA principal facilite ${profile.conversionGoal} avec un contexte clair, les preuves utiles et une prochaine etape evidente.`,
    },
  ];
};

const normalizeGeneratedSite = (
  raw: RawSitePayload,
  form: Required<FormPayload>,
  profile: BusinessProfile,
  visuals: GeneratedContent["visuals"],
  strategy: GenerationStrategy,
): GeneratedContent => {
  const hero = raw.hero || {};
  const problem = raw.problem_solution || {};
  const reassurance = raw.reassurance || {};
  const localSeo = raw.local_seo || {};
  const finalCta = raw.final_cta || {};
  const metadata = raw.metadata || {};
  const design = raw.design || {};
  const designColors = design.colors || {};
  const creativeRecipe = selectCreativeLayoutRecipe(form, profile);

  const problemTitle = normalizeText(problem.title, "Une offre claire vend toujours mieux qu'un site flou");
  const problemContent = normalizeText(
    problem.solution || problem.problem,
    `${form.businessName} doit montrer rapidement ce qui la rend utile, cr\u00e9dible et simple \u00e0 contacter.`,
  );
  const reassuranceContent = normalizeText(
    reassurance.content,
    `L'offre rassure avec une promesse claire, une structure lisible et des signaux de confiance adapt\u00e9s \u00e0 ${profile.targetAudience}.`,
  );

  const services = ensureServices(raw.services, form, profile);
  const testimonials = ensureTestimonials(raw.testimonials, form, profile);
  const processSteps = ensureProcessSteps(raw.process, form, profile);
  const benefits = ensureBenefits(raw.benefits, form, profile, problemContent, reassuranceContent);

  const localSeoTitle = normalizeText(
    localSeo.title,
    form.city ? `${form.businessType} a ${form.city} : un positionnement local plus fort` : "Une presence locale plus credible",
  );
  const localSeoContent = normalizeText(
    localSeo.content,
    form.city
      ? `${form.businessName} met en avant son ancrage a ${form.city}, son offre principale et un chemin de contact simple pour capter des demandes locales plus qualifiees.`
      : `${form.businessName} structure son message pour etre mieux comprise, mieux percue et plus facile a contacter.`,
  );
  const localSeoItems = normalizeList(localSeo.items).length
    ? normalizeList(localSeo.items).slice(0, 4)
    : unique([
        form.city ? `${form.businessType} a ${form.city}` : `${form.businessType} clairement positionne`,
        form.city ? `mots-cles locaux autour de ${form.city}` : "contenu oriente intention de recherche",
        `offre principale : ${profile.offer}`,
        `objectif : ${profile.conversionGoal}`,
      ]).slice(0, 4);

  const heroTitle = normalizeText(
    hero.title,
    buildSpecificHeroTitle(form, profile),
  );
  const heroSubtitle = normalizeText(
    hero.subtitle,
    `${form.businessName} aide ${profile.targetAudience.toLowerCase()} avec ${profile.offer.toLowerCase()} : un parcours clair, des preuves utiles et une prochaine etape simple pour ${profile.conversionGoal}.`,
  );
  const heroPromise = normalizeText(
    hero.promise,
    `${profile.primaryOfferAngle} Le contenu met en avant ${buildNicheProofPhrase(form, profile)}.`,
  );
  const ctaButton = normalizeText(finalCta.button || hero.cta_primary, form.cta);
  const fallbackSeoTitle = form.city
    ? `${form.businessType} \u00e0 ${form.city} | ${form.businessName}`
    : `${form.businessName} | ${form.businessType}`;
  const fallbackMetaDescription = normalizeText(
    `${heroSubtitle} ${form.city ? `\u00c0 ${form.city}, ` : ""}${form.businessName} aide ${profile.targetAudience.toLowerCase()} \u00e0 ${profile.conversionGoal}.`,
  ).slice(0, 155);

  return {
    heroTitle,
    heroSubtitle,
    heroEyebrow: normalizeText(hero.eyebrow, `${form.businessType}${form.city ? ` a ${form.city}` : ""}`),
    heroPromise,
    heroSecondaryCta: normalizeText(hero.cta_secondary, profile.ctaSecondary || buildHeroSecondaryCta(profile)),
    trustBadges: buildTrustBadges(form, profile),
    servicesTitle: normalizeText(problem.title, buildServicesTitle(profile)),
    servicesSubtitle: `Chaque offre explique concretement ce qui est propose, pour qui, avec quel benefice et quelle prochaine etape.`,
    services,
    benefitsTitle: buildBenefitsTitle(profile),
    benefits,
    testimonials,
    ctaTitle: normalizeText(finalCta.title, buildCtaTitle(form, profile)),
    ctaSubtitle: normalizeText(
      finalCta.subtitle,
      `${form.businessName} met en avant ${profile.offer.toLowerCase()}, repond aux objections importantes et guide vers "${ctaButton}".`,
    ),
    ctaButton,
    processSteps,
    faqItems:
      Array.isArray(raw.faq) && raw.faq.length
        ? raw.faq.slice(0, 4).map((item) => ({
            question: normalizeText(item.question, "Question"),
            answer: normalizeText(item.answer, "R\u00e9ponse"),
          }))
        : buildFallbackFaq(form, profile),
    footerTagline: "Cr\u00e9\u00e9 avec Pixelrises",
    statsItems: [],
    problemTitle,
    problemContent,
    reassuranceTitle: normalizeText(reassurance.title, "Une base s\u00e9rieuse pour convaincre sans surjouer"),
    reassuranceContent,
    reassuranceItems: normalizeList(reassurance.items).length
      ? normalizeList(reassurance.items).slice(0, 4)
      : unique([
          "Promesse claire d\u00e8s les premi\u00e8res secondes",
          profile.proofAngle,
          "CTA visibles et coh\u00e9rents avec l'objectif business",
          "Structure assez forte pour \u00eatre montr\u00e9e \u00e0 un vrai client",
        ]).slice(0, 4),
    localSeoTitle,
    localSeoContent,
    localSeoItems,
    sectionOrder: normalizeSectionOrder(
      normalizeList(raw.sectionOrder),
      strategy.prioritySections as SectionId[],
      strategy.allowedSections as SectionId[],
    ),
    tone: profile.tone,
    urgencyHint: `Le plus rentable maintenant est de lancer une version claire et cr\u00e9dible, puis d'am\u00e9liorer ce qui acc\u00e9l\u00e8re ${profile.conversionGoal}.`,
    metadata: {
      targetAudience: normalizeText(metadata.target_audience, profile.targetAudience),
      conversionGoal: normalizeText(metadata.conversion_goal, profile.conversionGoal),
      positioning: normalizeText(metadata.positioning, profile.positioning),
      niche: canonicalizeNiche(metadata.niche, profile.niche, form),
      offer: normalizeText(metadata.offer, profile.offer),
      differentiators: normalizeList(metadata.differentiators).length
        ? normalizeList(metadata.differentiators).slice(0, 4)
        : profile.differentiators,
      seoKeywords: normalizeList(metadata.seo_keywords).length
        ? normalizeList(metadata.seo_keywords).slice(0, 6)
        : profile.seoKeywords,
      seoTitle: normalizeMinimumText(metadata.seo_title, fallbackSeoTitle, 18).slice(0, 70),
      metaDescription: normalizeMinimumText(
        metadata.meta_description,
        fallbackMetaDescription,
        70,
      ).slice(0, 155),
    },
    design: {
      colors: {
        primary: normalizeText(designColors.primary, profile.palette.primary),
        secondary: normalizeText(designColors.secondary, profile.palette.secondary),
        surface: normalizeText(designColors.surface, profile.palette.surface),
        accent: normalizeText(designColors.accent, profile.palette.accent),
      },
      style: stripInternalDesignNotes(normalizeText(
        design.style,
        `${form.style} ${profile.positioning === "premium" ? "premium conversion" : "business conversion"}`,
      )),
      layout_type: ensureLayoutSignature(
        normalizeText(design.layout_type, profile.layoutType),
        profile.designArchetype,
        creativeRecipe.id,
      ),
      animation_style: stripInternalDesignNotes(normalizeText(design.animation_style, profile.animationStyle)),
      visual_direction: stripInternalDesignNotes(normalizeText(design.visual_direction, `${form.style} ? ${profile.visualDirection}`)),
      typography: stripInternalDesignNotes(normalizeText(
        design.typography,
        profile.positioning === "premium"
          ? "Titres editoriaux premium, textes sobres et lisibles"
          : "Titres nets, textes courts et hierarchie tres lisible",
      )),
      image_style: stripInternalDesignNotes(normalizeText(design.image_style, profile.imageStyle)),
      spacing_style: stripInternalDesignNotes(normalizeText(
        design.spacing_style,
        profile.positioning === "accessible" ? "Espacement direct, compact et lisible" : "Espacement genereux et respiration premium",
      )),
      button_style: stripInternalDesignNotes(normalizeText(
        design.button_style,
        profile.positioning === "premium" ? "Boutons pleins, elegants et contrastes" : "Boutons visibles, simples et rapides a comprendre",
      )),
      card_style: stripInternalDesignNotes(normalizeText(
        design.card_style,
        "Cartes propres, bordures fines, ombres legeres et lecture immediate",
      )),
      section_style: stripInternalDesignNotes(normalizeText(
        design.section_style,
        "Sections alternees, hierarchie nette, aucun bloc decoratif inutile",
      )),
      mobile_behavior: stripInternalDesignNotes(normalizeText(
        design.mobile_behavior,
        profile.objectiveMode === "prendre-rendez-vous" || profile.objectiveMode === "vendre-plus"
          ? "Mobile-first avec CTA visible, sections courtes et contact rapide toujours facile a trouver"
          : "Lecture mobile fluide, cartes empilees proprement et CTA final accessible sans surcharge",
      )),
      designArchetype: stripInternalDesignNotes(normalizeText(design.designArchetype, profile.designArchetype)),
    },
    visuals,
  };
};

const computeQualityScore = (content: GeneratedContent) => {
  const specificity = Math.min(
    100,
    72 +
      content.services.filter((item) => item.name.length > 10).length * 5 +
      content.metadata.differentiators.length * 3,
  );
  const conversion = Math.min(
    100,
    74 +
      (content.ctaButton.length > 6 ? 8 : 0) +
      Math.min(content.processSteps.length, 3) * 4 +
      Math.min(content.trustBadges.length, 4) * 2,
  );
  const credibility = Math.min(
    100,
    72 +
      Math.min(content.testimonials.length, 3) * 5 +
      Math.min(content.reassuranceItems.length, 4) * 3 +
      (content.localSeoItems.length ? 4 : 0),
  );
  const structure = Math.min(
    100,
    78 +
      Math.min(content.faqItems.length, 4) * 2 +
      Math.min(content.benefits.length, 4) * 3 +
      (content.sectionOrder.includes("local_seo") ? 3 : 0),
  );
  const overall = Math.round((specificity + conversion + credibility + structure) / 4);

  return {
    overall,
    clarity: specificity,
    conversion,
    credibility,
    structure,
  };
};

const WEAK_GENERATED_COPY_PATTERNS = [
  /\bsolution sur mesure\b/i,
  /\bexpertise premium\b/i,
  /\baccompagnement complet\b/i,
  /\bboostez votre activite\b/i,
  /\bboostez votre activite\b/i,
  /\bpresence web moderne\b/i,
  /\bpr[e?]sence web moderne\b/i,
  /\bsite professionnel\b/i,
  /\bvotre activite\b/i,
  /\bvotre activite\b/i,
  /\boffre claire\b/i,
  /\bstructure pens[e?]e\b/i,
  /\bpassage [a? ] l.action\b/i,
  /\bsans friction\b/i,
  /\bcr[e?]dible et vendeur\b/i,
  /\bactivit[e?] locale\b/i,
  /\bsolution claire\b/i,
  /\bparcours simple\b/i,
];

const isWeakGeneratedCopy = (value: string, minLength = 28) => {
  const cleaned = normalizeText(value);
  const key = normalizeKey(cleaned);

  return (
    !cleaned ||
    cleaned.length < minLength ||
    WEAK_GENERATED_COPY_PATTERNS.some((pattern) => pattern.test(key))
  );
};

const buildEmergencySafeFallback = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  purpose: "heroTitle" | "heroSubtitle" | "generic" = "generic",
) => {
  const city = form.city ? ` a ${form.city}` : "";

  if (purpose === "heroTitle") {
    if (profile.niche === "car-rental" || isCarRentalBusiness(form)) {
      return `Reservez une voiture${city} avec ${form.businessName}`;
    }

    if (isPhotographyBusiness(form)) {
      return `Reservez une seance photo${city} avec ${form.businessName}`;
    }

    if (profile.niche === "restaurant") {
      return `Reservez une table${city} chez ${form.businessName}`;
    }

    if (profile.niche === "coach") {
      return `Prenez rendez-vous${city} avec ${form.businessName}`;
    }

    if (profile.niche === "immobilier") {
      return `${form.businessName}${city} accompagne votre projet immobilier`;
    }

    return `${form.businessName}${city} - ${form.businessType}`;
  }

  if (purpose === "heroSubtitle") {
    if (profile.niche === "car-rental" || isCarRentalBusiness(form)) {
      return `${form.businessName} presente les vehicules disponibles, les conditions de location, la remise des cles et un CTA clair pour reserver rapidement${city}.`;
    }

    if (isPhotographyBusiness(form)) {
      return `${form.businessName} presente son style, le deroule de la seance, la livraison des images et un CTA clair pour reserver${city}.`;
    }

    return `${form.businessName} presente ${profile.offer.toLowerCase()}, les preuves utiles et une prochaine etape claire pour ${profile.targetAudience.toLowerCase()}${city}.`;
  }

  return `${form.businessName} presente ${form.businessType}${city} avec une action claire.`;
};

const PROMPT_LEAKAGE_KEY_PATTERNS = [
  /\bcree un site\b/,
  /\bcreer un site\b/,
  /\bcree un site\b/,
  /\bcreer un site\b/,
  /\bcree moi un site\b/,
  /\bcreer moi un site\b/,
  /\bcree moi un site\b/,
  /\bcreer moi un site\b/,
  /\brendu premium pour\b/,
  /\bsite pour une agence\b/,
  /\bsite pour un\b/,
  /\bsite pour une\b/,
  /\bcible\b.*\bobjectif\b/,
  /\bobjectif\b.*\bstyle\b/,
  /\bstyle\b.*\bcta\b/,
  /\bdescription libre\b/,
  /\bniveau de gamme\b/,
  /\bnom du business\b/,
  /\btype d activite\b/,
  /\btype d activite\b/,
  /\bcta\b.*\breserver\b/,
  /\bbrief client\b/,
  /\bdemande utilisateur\b/,
];

const promptInstructionFragments = (form: Required<FormPayload>) =>
  normalizeKey(form.description)
    .split(/\b(?:cible|objectif|style|cta|couleur|couleurs|ville|services|niveau|gamme|description)\b/)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 36 && /\b(cree|creer|site|premium|agence|pour|client|business)\b/.test(fragment))
    .slice(0, 8);

const hasPromptFragmentLeakage = (key: string, form: Required<FormPayload>) => {
  const fragments = promptInstructionFragments(form);
  return fragments.some((fragment) => {
    const fragmentWords = fragment.split(" ").filter((word) => word.length > 3);
    if (fragmentWords.length < 5) return false;
    const matchingWords = fragmentWords.filter((word) => key.includes(word)).length;
    return key.includes(fragment.slice(0, 48)) || matchingWords / fragmentWords.length >= 0.72;
  });
};

const isPromptLeakageText = (value: string, form: Required<FormPayload>) => {
  const cleaned = normalizeText(value);
  const key = normalizeKey(cleaned);
  if (!key) return false;

  if (PROMPT_LEAKAGE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
    return true;
  }

  const descriptionKey = normalizeKey(form.description);
  if (descriptionKey.length > 45 && key.length > 35) {
    const instructionMarkers = ["cree", "creer", "site", "cible", "objectif", "style", "cta", "niveau", "gamme", "description", "brief"];
    const markerHits = instructionMarkers.filter((marker) => key.includes(marker)).length;
    const sameOpening = key.slice(0, 64) === descriptionKey.slice(0, 64);
    if (sameOpening || markerHits >= 4 || hasPromptFragmentLeakage(key, form)) {
      return true;
    }
  }

  return false;
};

const buildSpecificHeroTitle = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const nicheTitle = buildNicheHeroTitle(form, profile, buildObjectiveAction(profile));
  if (nicheTitle) return nicheTitle;

  const citySuffix = form.city ? ` a ${form.city}` : "";

  if (profile.objectiveMode === "prendre-rendez-vous") {
    return `${form.businessType}${citySuffix} pour reserver sans hesiter`;
  }

  if (profile.objectiveMode === "vendre-plus") {
    return `${form.businessType}${citySuffix} pense pour choisir plus vite`;
  }

  if (profile.objectiveMode === "renforcer-credibilite") {
    return `${form.businessType}${citySuffix} qui inspire confiance des l'ouverture`;
  }

  if (profile.objectiveMode === "generer-leads") {
    return `${form.businessType}${citySuffix} pour recevoir des demandes qualifiees`;
  }

  return `${form.businessType}${citySuffix} clair, credible et oriente clients`;
};

const buildSpecificServiceDescription = (
  serviceName: string,
  form: Required<FormPayload>,
  profile: BusinessProfile,
  index: number,
) => {
  const audience = profile.targetAudience.toLowerCase();
  const cityContext = form.city ? ` a ${form.city}` : "";
  const action =
    profile.objectiveMode === "prendre-rendez-vous"
      ? "prendre rendez-vous"
      : profile.objectiveMode === "vendre-plus"
        ? "passer ?  l'achat"
        : profile.objectiveMode === "generer-leads"
          ? "faire une demande"
          : "prendre contact";

  if (isPhotographyBusiness(form)) {
    const photoAngles = [
      `${serviceName} presente clairement le style de seance, le deroule, les usages possibles et la prochaine etape pour reserver sans hesitation${cityContext}.`,
      `${serviceName} rassure avec une approche concrete : preparation, direction pendant la prise de vue, selection des images et livraison d'une galerie soignee.`,
      `${serviceName} aide le client ?  se projeter dans le rendu final, avec des exemples visuels, un ton humain et un CTA coherent pour demander une seance ou un devis.`,
      `${serviceName} montre la valeur du photographe au-dela de la prise de vue : cadrage du besoin, ambiance, accompagnement et rendu exploitable.`,
    ];

    return photoAngles[index % photoAngles.length];
  }

  const angles = [
    `${serviceName} aide ${audience} a comprendre precisement l'offre${cityContext}, le niveau de service et la prochaine etape avant de ${action}.`,
    `${serviceName} met en avant une reponse concrete au besoin du client, avec un benefice lisible et une raison claire de choisir ${form.businessName}.`,
    `${serviceName} presente le fonctionnement, les delais ou les modalites utiles pour rassurer avant la decision.`,
    `${serviceName} transforme une intention floue en demande claire grace a un parcours simple, credible et oriente ${profile.conversionGoal}.`,
  ];

  return angles[index % angles.length];
};

const buildSpecificBenefit = (
  index: number,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const continuityBenefits = buildContinuityBenefits(form, profile);
  if (continuityBenefits.length) return continuityBenefits[index % continuityBenefits.length];

  const cityContext = form.city ? ` a ${form.city}` : "";
  const benefits = [
    {
      title: `Comprendre l'offre en quelques secondes`,
      description: `${form.businessName} rend ${form.businessType.toLowerCase()} plus lisible pour ${profile.targetAudience.toLowerCase()}, avec une promesse claire${cityContext}, une offre identifiable et un CTA coherent.`,
    },
    {
      title: `Se sentir rassure avant de passer a l'action`,
      description: `L'offre montre les preuves, la methode et les reponses aux objections pour reduire les hesitations avant de ${profile.conversionGoal}.`,
    },
    {
      title: `Avancer vers ${form.cta.toLowerCase()} sans friction`,
      description: `Chaque etape prepare la decision : besoin, services, benefices, preuves, fonctionnement puis action finale.`,
    },
    {
      title: form.city ? `Renforcer la credibilite locale a ${form.city}` : `Renforcer la credibilite metier`,
      description: `${form.businessType} est presente avec un contexte concret, des services precis et un SEO naturel adapte aux recherches des clients.`,
    },
  ];

  return benefits[index % benefits.length];
};

const buildSpecificFaq = (
  index: number,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const cityContext = form.city ? ` a ${form.city}` : "";

  if (isPhotographyBusiness(form)) {
    const photoFaqs = [
      {
        question: `Comment reserver une seance photo${cityContext} ?`,
        answer: `Vous envoyez votre demande avec le type de seance, la date souhaitee et le rendu attendu. ${form.businessName} confirme ensuite les details utiles avant de bloquer le creneau.`,
      },
      {
        question: "Quels types de prestations photo sont proposes ?",
        answer: `Le site met en avant les prestations les plus utiles : portraits, reportages, shootings de marque, evenements ou projets sur devis selon le besoin reel du client.`,
      },
      {
        question: "Combien de temps faut-il pour recevoir les photos ?",
        answer: "Le delai depend du format de la seance et du volume d'images. L'objectif est de preciser des le premier echange le calendrier, la selection et la livraison de la galerie.",
      },
      {
        question: `Pourquoi choisir ${form.businessName} ?`,
        answer: `${form.businessName} met en avant un style photo identifiable, un deroule rassurant et une approche claire pour aider le client ?  se projeter avant de reserver.`,
      },
    ];

    return photoFaqs[index % photoFaqs.length];
  }

  const faqs = [
    {
      question: `Comment se passe ${form.cta.toLowerCase()} ?`,
      answer: `${form.businessName} propose un parcours simple : vous indiquez votre besoin, l'equipe confirme les informations utiles, puis vous avancez vers ${profile.conversionGoal} sans etape inutile.`,
    },
    {
      question: `Quels services sont proposes${cityContext} ?`,
      answer: `L'offre met en avant ${profile.offer.toLowerCase()} avec des services precis, une promesse claire et les informations necessaires pour comprendre rapidement si l'offre correspond au besoin.`,
    },
    {
      question: "Combien de temps faut-il pour obtenir une reponse ?",
      answer: `Le CTA principal oriente vers une prise de contact rapide. L'objectif est de reduire l'attente, clarifier la demande et permettre ?  ${profile.targetAudience.toLowerCase()} d'obtenir une reponse exploitable.`,
    },
    {
      question: `Pourquoi choisir ${form.businessName} ?`,
      answer: `${form.businessName} met en avant une approche claire, des preuves adaptees au metier et un positionnement ${profile.positioning} pour rassurer avant la decision.`,
    },
  ];

  return faqs[index % faqs.length];
};

const buildSpecificTestimonial = (
  index: number,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const namesByNiche: Record<string, string[]> = {
    restaurant: ["Camille", "Lina", "Marc"],
    coach: ["Nora", "Yanis", "Sofia"],
    immobilier: ["Thomas", "Sophie", "Karim"],
    "car-rental": ["Mehdi", "Laura", "Nicolas"],
    "creative-services": isPhotographyBusiness(form) ? ["Camille", "Sarah", "Nora"] : ["Lina", "Hugo", "Maya"],
    beauty: ["Ines", "Clara", "Maya"],
  };
  const names = namesByNiche[profile.niche] || ["Julie", "Mehdi", "Sarah"];
  const cityContext = form.city ? `${form.city}` : "leur zone";
  const textsByNiche: Record<string, string[]> = {
    restaurant: [
      `On cherchait une table sans perdre de temps. La promesse, l'ambiance et le bouton de reservation nous ont tout de suite rassures.`,
      `L'offre donne envie de venir chez ${form.businessName} tout en montrant les informations utiles avant de reserver.`,
      "J'ai compris le style du lieu, les moments forts et la prochaine etape sans devoir chercher partout.",
    ],
    coach: [
      "J'avais besoin de comprendre la methode avant de prendre rendez-vous. Le parcours explique clairement le point de depart, le suivi et le resultat attendu.",
      `${form.businessName} rend l'accompagnement concret : on voit comment demarrer, ce qui est suivi et pourquoi cela peut fonctionner.`,
      "L'offre rassure sans vendre du miracle. Elle montre une progression credible et donne envie de faire le premier bilan.",
    ],
    immobilier: [
      `Je voulais une estimation serieuse ?  ${cityContext}. L'offre met vite en avant la methode, la connaissance locale et les preuves utiles.`,
      "Le parcours donne confiance : on comprend comment le bien est valorise, comment le projet est cadre et quoi faire ensuite.",
      `${form.businessName} presente une approche claire, avec une vraie sensation de serieux avant la prise de contact.`,
    ],
    "car-rental": [
      `J'avais besoin d'une voiture rapidement ?  ${cityContext}. L'offre explique les options, la reservation et la remise des cles sans complication.`,
      "Tout est oriente vers l'action : choix du vehicule, conditions claires et bouton de reservation visible.",
      `${form.businessName} rend la location plus simple a comprendre, surtout quand on compare plusieurs agences.`,
    ],
    "creative-services": isPhotographyBusiness(form)
      ? [
          `J'avais besoin d'un photographe fiable ?  ${cityContext}. L'offre montre le style, le deroule et la facon de reserver sans devoir poser dix questions.`,
          "On comprend vite le type de seance, l'ambiance recherchee et le rendu attendu. Cela donne confiance avant le premier echange.",
          `${form.businessName} presente une approche photo claire : preparation, seance, selection et livraison de la galerie.`,
        ]
      : [
          "L'offre donne une vraie direction visuelle au projet, sans rester dans des phrases vagues sur la cr?ativit?.",
          `${form.businessName} rend l'approche plus concrete : methode, preuves visuelles et prochaine etape claire.`,
          "On comprend le style, la valeur et la facon de demarrer un projet sans devoir decoder l'offre.",
        ],
    "local-services": [
      `Je voulais savoir si l'intervention etait possible a ${cityContext}. L'offre repond vite : zone, delai, devis et prochaine etape.`,
      "Le service est explique avec des mots concrets. On comprend ce qui est fait, comment cela se passe et comment demander un devis.",
      `${form.businessName} inspire confiance parce que les preuves et le fonctionnement sont visibles avant le contact.`,
    ],
  };
  const texts = textsByNiche[profile.niche] || [
    `J'ai compris l'offre de ${form.businessName} des les premieres secondes : ce qui est propose, pour qui, et comment avancer.`,
    `Le parcours explique ${profile.offer.toLowerCase()} avec des preuves utiles et une prochaine etape facile a suivre.`,
    `L'offre repond aux questions importantes avant de ${profile.conversionGoal}, sans texte inutile ni promesse exageree.`,
  ];

  return {
    name: names[index % names.length],
    role: form.city || profile.targetAudience,
    text: texts[index % texts.length],
  };
};

const autoImproveGeneratedSite = (
  content: GeneratedContent,
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
): GeneratedContent => {
  const userVision = buildUserVision(form, profile);
  const lockedCta = resolveVisionLockedCta(form, userVision);
  const creativeRecipe = selectCreativeLayoutRecipe(form, profile, userVision);
  const visionDesignNotes = unique([
    ...userVision.explicitColors,
    ...userVision.explicitAmbiance,
    userVision.explicitChannel,
  ]).filter(Boolean);
  const serviceCandidates = unique([
    ...content.services.map((item) => item.name),
    ...getCleanServiceList(form.services),
    ...profile.serviceList,
    ...buildFallbackServiceNames(form, profile),
  ])
    .map(toServiceTitle)
    .filter(Boolean)
    .slice(0, 6);

  const seenServiceNames: string[] = [];
  const seenServiceDescriptions: string[] = [];
  const repairedServices = Array.from({ length: Math.max(3, Math.min(6, serviceCandidates.length || content.services.length || 3)) }, (_, index) => {
    const source = content.services[index] || {};
    const repairedName = repairServiceName(
      serviceCandidates[index] || source.name || "",
      index,
      form,
      profile,
    );
    const name = makeDistinctText(
      repairedName,
      buildFallbackServiceNames(form, profile).map(toServiceTitle),
      seenServiceNames,
      0.58,
    );
    const baseDescription = isWeakGeneratedCopy(source.description || "", 55) ||
      isPromptLeakageText(source.description || "", form)
      ? buildSpecificServiceDescription(name, form, profile, index)
      : source.description;
    const description = makeDistinctText(
      baseDescription,
      [
        buildSpecificServiceDescription(name, form, profile, index),
        buildSpecificServiceDescription(name, form, profile, index + 1),
      ],
      seenServiceDescriptions,
      0.64,
    );

    return { name, description };
  });

  const seenBenefitTitles: string[] = [];
  const seenBenefitDescriptions: string[] = [];
  const repairedBenefits = Array.from({ length: Math.max(3, Math.min(4, content.benefits.length || 4)) }, (_, index) => {
    const source = content.benefits[index];
    const fallback = buildSpecificBenefit(index, form, profile);
    const baseTitle =
      source && !isWeakGeneratedCopy(source.title, 12) && !isPromptLeakageText(source.title, form)
        ? source.title
        : fallback.title;
    const baseDescription =
      source && !isWeakGeneratedCopy(source.description, 55) && !isPromptLeakageText(source.description, form)
        ? source.description
        : fallback.description;

    return {
      title: makeDistinctText(
        baseTitle,
        [fallback.title, buildSpecificBenefit(index + 1, form, profile).title],
        seenBenefitTitles,
        0.58,
      ),
      description: makeDistinctText(
        baseDescription,
        [fallback.description, buildSpecificBenefit(index + 1, form, profile).description],
        seenBenefitDescriptions,
        0.64,
      ),
    };
  });

  const fallbackFaq = Array.from({ length: 4 }, (_, index) => buildSpecificFaq(index, form, profile));
  const seenFaqQuestions: string[] = [];
  const seenFaqAnswers: string[] = [];
  const repairedFaqItems = Array.from({ length: Math.max(3, Math.min(4, content.faqItems.length || 4)) }, (_, index) => {
    const source = content.faqItems[index] || {};
    const fallback = fallbackFaq[index % fallbackFaq.length];
    const baseQuestion =
      source.question && !isWeakGeneratedCopy(source.question, 18) && !isPromptLeakageText(source.question, form)
        ? source.question
        : fallback.question;
    const baseAnswer =
      source.answer && !isWeakGeneratedCopy(source.answer, 45) && !isPromptLeakageText(source.answer, form)
        ? source.answer
        : fallback.answer;

    return {
      question: makeDistinctText(baseQuestion, fallbackFaq.map((item) => item.question), seenFaqQuestions, 0.6),
      answer: makeDistinctText(baseAnswer, fallbackFaq.map((item) => item.answer), seenFaqAnswers, 0.66),
    };
  });

  const seenTestimonials: string[] = [];
  const repairedTestimonials = Array.from({ length: Math.max(2, Math.min(3, content.testimonials.length || 3)) }, (_, index) => {
    const source = content.testimonials[index] || {};
    const fallback = buildSpecificTestimonial(index, form, profile);
    const baseText =
      source.text && !isWeakGeneratedCopy(source.text, 72) && !isPromptLeakageText(source.text, form)
        ? source.text
        : fallback.text;

    return {
      name: normalizeText(source.name, fallback.name),
      role: normalizeText(source.role, fallback.role),
      text: makeDistinctText(
        baseText,
        [
          fallback.text,
          buildSpecificTestimonial(index + 1, form, profile).text,
          buildSpecificTestimonial(index + 2, form, profile).text,
        ],
        seenTestimonials,
        0.66,
      ),
    };
  });

  const sectionTitleIsUsable = (value: string, minLength = 20) =>
    Boolean(value) &&
    !isWeakGeneratedCopy(value, minLength) &&
    !isPromptLeakageText(value, form) &&
    countPatternHits([value], GENERIC_VISIBLE_PATTERNS) === 0;
  const photographyTitles = isPhotographyBusiness(form)
    ? {
        problem: form.city
          ? `Une seance photo a ${form.city} doit rassurer avant le premier message`
          : "Une seance photo doit rassurer avant le premier message",
        services: "Des formats photo clairs selon votre moment",
        benefits: "Ce que vous obtenez avant, pendant et apres la seance",
        reassurance: "Un cadre simple pour etre a l'aise devant l'objectif",
        localSeo: form.city ? `Photographe a ${form.city} pour portraits et shootings` : "Photographe pour portraits et shootings",
        cta: form.city ? `Reserve une seance photo a ${form.city}` : "Reserve une seance photo",
      }
    : null;
  const titleAlternatives = photographyTitles
    ? Object.values(photographyTitles)
    : [
        buildServicesTitle(profile),
        buildBenefitsTitle(profile),
        buildCtaTitle(form, profile),
        form.city ? `${form.businessType} a ${form.city}` : form.businessType,
      ];
  const seenSectionTitles: string[] = [];
  const distinctSectionTitle = (value: string, fallback: string, minLength = 20) =>
    makeDistinctText(
      sectionTitleIsUsable(value, minLength) ? value : fallback,
      titleAlternatives,
      seenSectionTitles,
      0.52,
    );
  const repairedProblemTitle = distinctSectionTitle(
    content.problemTitle,
    photographyTitles?.problem || "Une decision plus simple pour vos clients",
  );
  const repairedServicesTitle = distinctSectionTitle(
    content.servicesTitle,
    photographyTitles?.services || buildServicesTitle(profile),
  );
  const repairedBenefitsTitle = distinctSectionTitle(
    content.benefitsTitle,
    photographyTitles?.benefits || buildBenefitsTitle(profile),
  );
  const repairedReassuranceTitle = distinctSectionTitle(
    content.reassuranceTitle,
    photographyTitles?.reassurance || "Des garanties visibles avant de reserver",
  );
  const repairedLocalSeoTitle = distinctSectionTitle(
    content.localSeoTitle,
    photographyTitles?.localSeo || (form.city ? `${form.businessType} a ${form.city}` : `${form.businessType} bien positionne`),
    18,
  );
  const repairedCtaTitle = distinctSectionTitle(
    content.ctaTitle,
    photographyTitles?.cta || `${form.businessName} vous aide maintenant a ${profile.conversionGoal}`,
    28,
  );

  return sanitizeTextDeep({
    ...content,
    heroTitle:
      !isWeakGeneratedCopy(content.heroTitle, 28) &&
      !isPromptLeakageText(content.heroTitle, form) &&
      normalizeKey(content.heroTitle).includes(normalizeKey(form.businessType).split(" ")[0])
        ? content.heroTitle
        : buildSpecificHeroTitle(form, profile),
    heroSubtitle:
      !isWeakGeneratedCopy(content.heroSubtitle, 85) && !isPromptLeakageText(content.heroSubtitle, form)
        ? content.heroSubtitle
        : `${form.businessName} aide ${profile.targetAudience.toLowerCase()} avec ${profile.offer.toLowerCase()}, une preuve lisible et un parcours pense pour ${profile.conversionGoal}${form.city ? ` a ${form.city}` : ""}.`,
    heroPromise:
      !isWeakGeneratedCopy(content.heroPromise, 65) && !isPromptLeakageText(content.heroPromise, form)
        ? content.heroPromise
        : `${strategy.marketingAngle}. ${profile.proofAngle}.`,
    heroEyebrow: isPromptLeakageText(content.heroEyebrow, form)
      ? `${form.businessType}${form.city ? ` - ${form.city}` : ""}`
      : content.heroEyebrow,
    trustBadges: unique([
      ...content.trustBadges,
      ...strategy.differentiationHooks.slice(0, 2),
      ...strategy.premiumSignals.slice(0, 2),
    ]).slice(0, 4),
    services: repairedServices,
    servicesTitle: repairedServicesTitle,
    benefits: repairedBenefits,
    benefitsTitle: repairedBenefitsTitle,
    testimonials: repairedTestimonials,
    faqItems: repairedFaqItems,
    ctaTitle: repairedCtaTitle,
    ctaSubtitle:
      content.ctaSubtitle && !isWeakGeneratedCopy(content.ctaSubtitle, 76) && !isPromptLeakageText(content.ctaSubtitle, form)
        ? content.ctaSubtitle
        : `${form.businessName} met en avant ${profile.offer} avec un parcours simple, des preuves utiles et une prochaine \u00e9tape claire pour ${profile.conversionGoal}.`,
    ctaButton:
      shouldReplaceGeneratedCta(content.ctaButton, form, userVision)
        ? lockedCta
        : content.ctaButton,
    problemContent:
      !isWeakGeneratedCopy(content.problemContent, 85) && !isPromptLeakageText(content.problemContent, form)
        ? content.problemContent
        : `${profile.targetAudience} hesite quand l'offre, les modalites ou les preuves ne sont pas visibles assez vite. ${form.businessName} clarifie ${profile.offer.toLowerCase()} pour faciliter ${profile.conversionGoal}.`,
    problemTitle: repairedProblemTitle,
    reassuranceTitle: repairedReassuranceTitle,
    reassuranceContent:
      content.reassuranceContent && !isPromptLeakageText(content.reassuranceContent, form) && !isWeakGeneratedCopy(content.reassuranceContent, 70)
        ? content.reassuranceContent
        : `${form.businessName} met en avant les preuves, les conditions utiles et les reponses concretes pour rassurer ${profile.targetAudience.toLowerCase()} avant ${profile.conversionGoal}.`,
    reassuranceItems: unique([
      ...content.reassuranceItems,
      ...strategy.premiumSignals,
      form.city ? `Intervention annonc\u00e9e sur ${form.city}` : `${profile.offer} expliqu\u00e9e avec precision`,
    ]).slice(0, 4),
    localSeoItems: unique([
      ...content.localSeoItems,
      ...profile.seoKeywords.slice(0, 2),
    ]).slice(0, 4),
    localSeoTitle: repairedLocalSeoTitle,
    localSeoContent:
      content.localSeoContent && !isPromptLeakageText(content.localSeoContent, form) && !isWeakGeneratedCopy(content.localSeoContent, 70)
        ? content.localSeoContent
        : form.city
          ? `${form.businessName} relie son offre, sa zone a ${form.city} et son CTA de reservation pour aider les visiteurs ?  agir vite.`
          : `${form.businessName} relie son offre, ses preuves et son CTA pour aider les visiteurs ?  agir vite.`,
    sectionOrder: strategy.prioritySections.length
      ? strategy.prioritySections
      : content.sectionOrder,
    statsItems: [],
    urgencyHint: `Le resultat doit maintenant mieux expliquer ${profile.offer} pour aider ${profile.targetAudience.toLowerCase()} a ${profile.conversionGoal}.`,
    metadata: {
      ...content.metadata,
      targetAudience: profile.targetAudience,
      conversionGoal: profile.conversionGoal,
      positioning: profile.positioning,
      niche: profile.niche,
      offer: profile.offer,
      differentiators: unique([
        ...content.metadata.differentiators,
        ...strategy.differentiationHooks,
      ]).slice(0, 4),
      seoKeywords: unique([
        form.city ? `${form.businessType} ${form.city}` : form.businessType,
        ...content.metadata.seoKeywords,
        ...profile.seoKeywords,
      ]).slice(0, 6),
      seoTitle:
        content.metadata.seoTitle && !isWeakGeneratedCopy(content.metadata.seoTitle, 18) && !isPromptLeakageText(content.metadata.seoTitle, form)
          ? content.metadata.seoTitle
          : form.city
            ? `${form.businessType} a ${form.city} | ${form.businessName}`
            : `${form.businessName} | ${form.businessType}`,
      metaDescription:
        content.metadata.metaDescription && !isWeakGeneratedCopy(content.metadata.metaDescription, 70) && !isPromptLeakageText(content.metadata.metaDescription, form)
          ? content.metadata.metaDescription
          : `${form.businessName} aide ${profile.targetAudience.toLowerCase()} ?  ${profile.conversionGoal} avec ${profile.offer.toLowerCase()}, un message clair et un CTA ${form.cta}.`,
    },
    design: {
      ...content.design,
      colors: userVision.explicitColors.length ? profile.palette : content.design.colors,
      style: stripInternalDesignNotes(strategy.visualStyle || content.design.style),
      layout_type: ensureLayoutSignature(content.design.layout_type, profile.designArchetype, creativeRecipe.id),
      animation_style: stripInternalDesignNotes(strategy.animationDirection || content.design.animation_style),
      visual_direction:
        isPromptLeakageText(content.design.visual_direction, form)
          ? stripInternalDesignNotes(strategy.visualStyle)
          : stripInternalDesignNotes(strategy.visualStyle || content.design.visual_direction) ||
            "Direction visuelle alignee avec le brief, la niche et l'objectif business.",
      typography: isPromptLeakageText(content.design.typography, form)
        ? "Hierarchie claire, titres forts, paragraphes courts et lecture mobile fluide"
        : content.design.typography,
      image_style: isPromptLeakageText(content.design.image_style, form)
        ? profile.imageStyle
        : [stripInternalDesignNotes(content.design.image_style), visionDesignNotes.length ? "Visuels alignes avec les choix explicites du brief." : ""]
            .filter(Boolean)
            .join(" | "),
      mobile_behavior: normalizeText(
        content.design.mobile_behavior,
        "Mobile-first avec CTA visible, sections lisibles et contact accessible",
      ),
      designArchetype: profile.designArchetype,
    },
    visuals: {
      ...content.visuals,
      accentLabel: isPromptLeakageText(content.visuals.accentLabel, form)
        ? profile.visualDirection
        : content.visuals.accentLabel,
      hero: {
        ...content.visuals.hero,
        prompt: isPromptLeakageText(content.visuals.hero.prompt, form) ||
          (isPhotographyBusiness(form) && isPhotographyVisualPromptWeak(content.visuals.hero.prompt))
          ? buildVisualFallbackScenes(form, profile).heroScene
          : content.visuals.hero.prompt,
        alt: isPromptLeakageText(content.visuals.hero.alt, form) ||
          (isPhotographyBusiness(form) && isPhotographyVisualPromptWeak(content.visuals.hero.alt))
          ? `${form.businessType}${form.city ? ` a ${form.city}` : ""}`
          : content.visuals.hero.alt,
      },
      gallery: content.visuals.gallery.map((item, index) => {
        const visualFallback = buildVisualFallbackScenes(form, profile);
        const fallbackScenes = visualFallback.gallery.length
          ? visualFallback.gallery
          : [{ scene: visualFallback.heroScene, alt: visualFallback.heroAlt }];
        const fallbackScene =
          fallbackScenes[index % fallbackScenes.length]?.scene || visualFallback.heroScene;
        return {
          ...item,
          prompt: isPromptLeakageText(item.prompt, form) ||
            (isPhotographyBusiness(form) && isPhotographyVisualPromptWeak(item.prompt))
            ? fallbackScene
            : item.prompt,
          alt: isPromptLeakageText(item.alt, form) ||
            (isPhotographyBusiness(form) && isPhotographyVisualPromptWeak(item.alt))
            ? `${form.businessType} - visuel ${index + 1}`
            : item.alt,
        };
      }),
    },
  }) as GeneratedContent;
};

const buildNichePlaybook = (profile: BusinessProfile) => {
  const playbooks: Record<string, string[]> = {
    restaurant: [
      "Mettre en avant l'ambiance, la carte, la r\u00e9servation et la localisation.",
      "Utiliser un ton gourmand, pr\u00e9cis et local sans clich\u00e9s creux.",
      "Faire sentir la qualit\u00e9, la fra\u00eecheur et la simplicit\u00e9 du passage \u00e0 l'action.",
    ],
    coach: [
      "Mettre en avant la transformation, les r\u00e9sultats, la m\u00e9thode et la prise de rendez-vous.",
      "Utiliser un ton \u00e9nergique, concret et cr\u00e9dible, sans promesses irr\u00e9alistes.",
      "Faire ressortir avant/apr\u00e8s, discipline, accompagnement et b\u00e9n\u00e9fices visibles.",
    ],
    immobilier: [
      "Mettre en avant la confiance, l'estimation, l'accompagnement et la qualit\u00e9 des biens.",
      "Utiliser un ton rassurant, haut de gamme et structur\u00e9.",
      "Faire sentir l'autorit\u00e9 locale, la fluidit\u00e9 du parcours et la s\u00e9curit\u00e9 per\u00e7ue.",
    ],
    "car-rental": [
      "Mettre en avant la disponibilit\u00e9, la simplicit\u00e9 de r\u00e9servation, la remise des cl\u00e9s et la zone couverte.",
      "Utiliser un ton direct, moderne et rassurant, sans promesse vague.",
      "Faire ressentir la rapidit\u00e9, la libert\u00e9 de mouvement et l'absence de paperasse inutile.",
    ],
    "sports-betting-advice": [
      "Construire un site de pronostics, analyses ou communaut\u00e9 sportive responsable, jamais une plateforme de prise de paris.",
      "Mettre en avant m\u00e9thode d'analyse, transparence, bilan, discipline et avertissements 18+ / aucun gain garanti.",
      "Utiliser des CTA vers communaut\u00e9, newsletter, analyses ou abonnement, sans incitation agressive ni promesse de profit.",
    ],
    "education-training": [
      "Mettre en avant le programme, les objectifs d'apprentissage, la progression et l'accompagnement.",
      "Utiliser un ton p\u00e9dagogique, clair et motivant, avec des preuves de transformation r\u00e9alistes.",
      "Faire comprendre le niveau, le format, la dur\u00e9e et la prochaine \u00e9tape.",
    ],
    "travel-hospitality": [
      "Mettre en avant l'exp\u00e9rience, la localisation, la r\u00e9servation, les avis et les moments forts.",
      "Utiliser un ton immersif et rassurant, avec des d\u00e9tails concrets sur le s\u00e9jour ou l'accueil.",
      "Faire ressentir le confort, la confiance et la simplicit\u00e9 de r\u00e9servation.",
    ],
    "events-entertainment": [
      "Mettre en avant l'ambiance, l'organisation, les formats, la disponibilit\u00e9 et la demande de devis.",
      "Utiliser un ton vivant, visuel et fiable, sans promettre un \u00e9v\u00e9nement magique impossible \u00e0 garantir.",
      "Faire comprendre le type d'\u00e9v\u00e9nement, le public, le d\u00e9roul\u00e9 et le prochain contact.",
    ],
    "saas-tech": [
      "Mettre en avant le probl\u00e8me utilisateur, la valeur produit, les cas d'usage et la d\u00e9monstration.",
      "Utiliser un ton clair, produit et business, sans jargon technique inutile.",
      "Faire ressortir gain de temps, simplicit\u00e9, int\u00e9grations, s\u00e9curit\u00e9 et preuve d'adoption.",
    ],
    "personal-brand": [
      "Mettre en avant la personne, son expertise, sa m\u00e9thode, ses preuves et sa vision.",
      "Utiliser un ton humain, \u00e9ditorial et confiant, sans autopromotion creuse.",
      "Faire comprendre pourquoi suivre, contacter, inviter ou acheter l'offre de cette personne.",
    ],
    wellness: [
      "Mettre en avant le cadre, l'approche, les b\u00e9n\u00e9fices ressentis et la prise de rendez-vous.",
      "Utiliser un ton calme, rassurant et professionnel, sans promesse m\u00e9dicale non prouv\u00e9e.",
      "Faire ressentir s\u00e9r\u00e9nit\u00e9, confiance, \u00e9coute et simplicit\u00e9 du premier contact.",
    ],
    "automotive-services": [
      "Mettre en avant diagnostic, transparence, d\u00e9lais, r\u00e9sultat visible et demande de devis.",
      "Utiliser un ton concret, fiable et technique sans jargon inutile.",
      "Faire comprendre ce qui est pris en charge, comment cela se passe et pourquoi le client peut faire confiance.",
    ],
    "pet-services": [
      "Mettre en avant confiance, s\u00e9curit\u00e9, soin animal, cadre et prise de contact.",
      "Utiliser un ton chaleureux et professionnel, avec des preuves de s\u00e9rieux et d'attention.",
      "Faire comprendre l'exp\u00e9rience, les conditions, le bien-\u00eatre de l'animal et la prochaine \u00e9tape.",
    ],
    ecommerce: [
      "Mettre en avant les produits, les b\u00e9n\u00e9fices, la r\u00e9assurance et l'achat rapide.",
      "Utiliser un ton clair, rythm\u00e9 et orient\u00e9 conversion.",
      "Faire ressortir la valeur per\u00e7ue, la simplicit\u00e9 d'achat et la confiance.",
    ],
    medical: [
      "Mettre en avant le s\u00e9rieux, la clart\u00e9, la s\u00e9curit\u00e9 et la prise de rendez-vous.",
      "Utiliser un ton calme, rassurant et tr\u00e8s lisible.",
      "Faire ressortir les signaux de confiance et la facilit\u00e9 de contact.",
    ],
    beauty: [
      "Mettre en avant l'exp\u00e9rience, le r\u00e9sultat, l'image et la r\u00e9servation.",
      "Utiliser un ton raffin\u00e9, \u00e9l\u00e9gant et sensoriel.",
      "Faire ressentir le soin, la qualit\u00e9 du rendu et la confiance imm\u00e9diate.",
    ],
    "professional-services": [
      "Mettre en avant la m\u00e9thode, le s\u00e9rieux, la clart\u00e9 de l'accompagnement et le contact.",
      "Utiliser un ton d'autorit\u00e9 sobre, pr\u00e9cis et rassurant.",
      "Faire ressortir la cr\u00e9dibilit\u00e9, la ma\u00eetrise et la qualit\u00e9 du cadrage.",
    ],
    "local-services": [
      "Mettre en avant la proximit\u00e9, la rapidit\u00e9, la fiabilit\u00e9 et la demande de devis.",
      "Utiliser un ton direct, concret et cr\u00e9dible.",
      "Faire ressortir la zone d'intervention, la simplicit\u00e9 et le gain de temps.",
    ],
    "creative-services": [
      "Mettre en avant le portfolio, les seances, la direction de pose, la retouche et la galerie livree.",
      "Utiliser un ton premium, visuel et humain, sans transformer le photographe en agence digitale.",
      "Faire ressentir le style photo, le deroule de la seance, l'aisance devant l'objectif et la valeur du rendu final.",
    ],
    "general-business": [
      "Mettre en avant la clart\u00e9 de l'offre, la confiance et le CTA principal.",
      "Utiliser un ton professionnel, vendeur et fluide.",
      "Faire comprendre rapidement la proposition de valeur et la prochaine action.",
    ],
  };

  const rules = playbooks[profile.niche] || playbooks["general-business"];
  return rules.map((rule, index) => `${index + 1}. ${rule}`).join("\n");
};

const buildOutputContract = () => `FORMAT JSON STRICT :
- hero
- problem_solution
- services
- benefits
- testimonials
- process
- reassurance
- local_seo
- faq
- final_cta
- metadata
- design
- visuals
- sectionOrder

Chaque cl\u00e9 doit \u00eatre pr\u00e9sente.
Chaque etape doit \u00eatre utile, cr\u00e9dible et orient\u00e9e conversion.
sectionOrder doit contr\u00f4ler l'ordre r\u00e9el d'affichage, commencer par hero et finir par final_cta.
metadata doit inclure seo_title, meta_description, seo_keywords, niche, offer et differentiators.
design doit inclure colors, typography, layout_type, animation_style, visual_direction, image_style, spacing_style, button_style, card_style, section_style, mobile_behavior et designArchetype.
visuals doit contenir uniquement des descriptions de scenes originales et des alt texts propres au client. Ne jamais y mettre d'URL Nicepage/TemplateMo, de titre de template, de texte copie ou de reference a une source externe non licenciee.
Le JSON doit contenir assez d'informations pour afficher la preview finale, le SEO, les CTA et une description concise du design.
Aucun texte hors JSON.`;

const buildClientSafeAssetPolicy = () => `POLITIQUE ASSETS CLIENT-SAFE :
- Nicepage sert uniquement de bibliotheque d'inspiration interne pour le rythme, les sections et la direction UX.
- Nicepage et TemplateMo servent uniquement de bibliotheques d'inspiration internes pour le rythme, les sections et la direction UX.
- Ne jamais copier un texte, titre, description, image, nom de template ou URL Nicepage/TemplateMo.
- Le contenu final doit etre original, ecrit pour l'activite reelle du client.
- Les visuels doivent etre decrits comme des prompts originaux ou provenir de sources stock/licenciees deja autorisees par Pixelrises.
- Si une image source externe n'est pas clairement licenciee ou fournie par le client, ne pas l'utiliser.
- Les textes de templates ne sont jamais repris tels quels : ils peuvent seulement inspirer une intention de section, puis doivent etre reecrits avec la vision utilisateur et la couche conversion Pixelrises.
- Si tu hesites entre copier une formulation et recreer une formulation originale, tu recrees toujours une formulation originale.`;

const buildQualityGate = () => `CONTR\u00d4LE QUALIT\u00c9 OBLIGATOIRE AVANT R\u00c9PONSE :
- v\u00e9rifier la coh\u00e9rence globale
- v\u00e9rifier la cr\u00e9dibilit\u00e9 business imm\u00e9diate
- v\u00e9rifier l'absence de texte g\u00e9n\u00e9rique ou vide
- v\u00e9rifier une vraie variation selon la niche
- v\u00e9rifier des CTA visibles et cr\u00e9dibles
- v\u00e9rifier que le site vend l'offre du client, jamais la cr\u00e9ation de site, l'IA ou Pixelrises
- ecrire comme le site reel du client : ne jamais dire "la page", "le site", "le visiteur" ou "chaque section" dans le contenu visible
- ne jamais afficher la mecanique marketing interne : "passer de l'interet au rendez-vous", "convertir les visiteurs", "generer des leads", "obtenir plus de clients", "parcours client", "strategie de conversion"
- le contenu visible doit parler comme l'entreprise finale au client final : un restaurant vend une table, un plat, une ambiance et une reservation, pas une conversion
- les temoignages doivent parler de l'experience avec le business du client, jamais de la page generee
- les benefices doivent parler du resultat obtenu par le client final, jamais de la structure du site
- v\u00e9rifier que le hero contient activit\u00e9 r\u00e9elle, ville/contexte, b\u00e9n\u00e9fice concret et CTA coh\u00e9rent
- rejeter les h\u00e9ros vagues comme "Une pr\u00e9sence web moderne", "Boostez votre activit\u00e9", "Solution adapt\u00e9e \u00e0 vos besoins" ou "Un site professionnel pour votre activit\u00e9"
- v\u00e9rifier une r\u00e9assurance concr\u00e8te
- v\u00e9rifier un SEO local coh\u00e9rent si une ville est fournie
- v\u00e9rifier un design premium, mobile-first et diff\u00e9renci\u00e9
- v\u00e9rifier que les visuels propos\u00e9s sont coh\u00e9rents avec la niche, premium et sans clich\u00e9 faible
- v\u00e9rifier que les visuels sont des scenes originales pour le client, jamais des images Nicepage ou des URLs/templates source
- v\u00e9rifier que le copywriting ne reprend aucun titre, description ou phrase de template source
- v\u00e9rifier la pr\u00e9sence de d\u00e9tails concrets : process, d\u00e9lai, zone, preuve, modalit\u00e9s, usage, r\u00e9sultat visible
- v\u00e9rifier que chaque service explique ce qui est fait, pour qui, et ce que cela change
- v\u00e9rifier que les b\u00e9n\u00e9fices ne r\u00e9p\u00e8tent pas les services
- v\u00e9rifier que chaque t\u00e9moignage contient un contexte et une raison de confiance, pas une flatterie vide
- v\u00e9rifier que la FAQ traite prix, d\u00e9lai, confiance, zone, disponibilit\u00e9 ou fonctionnement
- v\u00e9rifier que sectionOrder ne contient aucune section gadget ou interne
- v\u00e9rifier que design d\u00e9crit une direction exploitable et pas seulement une couleur
- v\u00e9rifier que visuals.hero et visuals.gallery d\u00e9crivent des sc\u00e8nes diff\u00e9rentes et vraiment li\u00e9es au m\u00e9tier
- v\u00e9rifier qu'aucun score qualit\u00e9, debug, analyse interne ou bloc "Indicateur" n'est visible
- rejeter "activit\u00e9 locale", "offre claire", "parcours simple", "pr\u00e9sence premium" ou "sans friction" si ces expressions ne sont pas remplac\u00e9es par des d\u00e9tails m\u00e9tier
- refuser les slogans abstraits de type "pr\u00e9sence premium", "passage \u00e0 l'action", "sans friction", "offre claire" s'ils ne sont pas ancr\u00e9s dans le m\u00e9tier
- si une section est faible, la r\u00e9\u00e9crire avant de r\u00e9pondre
- avant la r\u00e9ponse finale, relire comme un client final : si tu ne comprends pas l'offre en 3 secondes, r\u00e9\u00e9crire le hero et les services`;

const buildDesignPatternGuide = (profile: BusinessProfile) => {
  const commonPatterns = [
    "hero editorial avec promesse forte, preuve courte et CTA visible",
    "cartes de services lisibles, toutes reliees a un resultat client",
    "bento grid ou grille premium uniquement si cela aide la comprehension",
    "section preuve/reassurance plus haute si l'objectif est la credibilite ou le rendez-vous",
    "FAQ structurante pour lever prix, delai, confiance, zone et fonctionnement",
    "CTA final simple, direct et coherent avec l'objectif",
  ];

  const nichePatterns: Record<string, string[]> = {
    restaurant: [
      "header immersif avec ambiance de salle ou plat signature",
      "section reservation visible avant la FAQ",
      "cartes menu, experience et evenements sans surcharge",
    ],
    coach: [
      "hero transformation avec energie et objectif clair",
      "process en 3 etapes autour du bilan, du plan et du suivi",
      "preuves orientees progression credible, sans faux resultats agressifs",
    ],
    immobilier: [
      "mise en page premium avec estimation, methode et expertise locale",
      "preuves de confiance avant les services si l'objectif est la credibilite",
      "visuels de biens, quartier et accompagnement client",
    ],
    "car-rental": [
      "parcours reservation tres lisible avec disponibilite et remise des cles",
      "visuels voiture, mobile et trajet urbain",
      "benefices orientes rapidite, simplicite et absence de paperasse",
    ],
    "sports-betting-advice": [
      "hero type tableau d'analyse premium : promesse responsable, sport cibl\u00e9, CTA communaut\u00e9",
      "section m\u00e9thode avant offres : lecture des cotes, discipline, suivi et avertissement 18+",
      "visuels sport, data, calendrier et communaut\u00e9, jamais casino ou argent facile",
    ],
    "education-training": [
      "hero progression : r\u00e9sultat d'apprentissage, niveau cible et CTA d'inscription",
      "section programme claire avec modules, format, dur\u00e9e et accompagnement",
      "preuves orient\u00e9es parcours, cas d'\u00e9l\u00e8ves et comp\u00e9tences acquises",
    ],
    "travel-hospitality": [
      "hero immersif : exp\u00e9rience, lieu, r\u00e9servation et preuve avis",
      "cartes chambres, s\u00e9jours, services ou exp\u00e9riences sans surcharge",
      "section rassurance sur acc\u00e8s, disponibilit\u00e9, conditions et contact",
    ],
    "events-entertainment": [
      "hero \u00e9motionnel avec type d'\u00e9v\u00e9nement, ambiance et demande de devis",
      "sections formats, d\u00e9roul\u00e9, preuves et disponibilit\u00e9",
      "rythme visuel plus \u00e9nergique mais toujours lisible mobile",
    ],
    "saas-tech": [
      "hero produit avec probl\u00e8me, gain mesurable cr\u00e9dible et CTA d\u00e9mo",
      "bento de cas d'usage, int\u00e9grations et preuves produit",
      "section s\u00e9curit\u00e9 ou fiabilit\u00e9 si le produit touche des donn\u00e9es sensibles",
    ],
    "personal-brand": [
      "hero \u00e9ditorial centr\u00e9 sur la personne, sa promesse et son public",
      "section m\u00e9thode, preuves, prises de parole ou r\u00e9sultats",
      "CTA vers contact, appel, newsletter ou offre signature",
    ],
    wellness: [
      "hero calme avec b\u00e9n\u00e9fice ressenti, cadre et prise de rendez-vous",
      "sections approche, prestations, d\u00e9roul\u00e9 et r\u00e9assurance",
      "visuels apaisants, humains et professionnels, sans promesse m\u00e9dicale excessive",
    ],
    "automotive-services": [
      "hero technique et fiable : service, d\u00e9lai, zone et demande de devis",
      "sections diagnostic, prestations, process et r\u00e9sultat avant/apr\u00e8s",
      "visuels atelier, d\u00e9tail, v\u00e9hicule et relation client",
    ],
    "pet-services": [
      "hero rassurant : type d'animal, cadre, s\u00e9curit\u00e9 et prise de contact",
      "sections prestations, conditions, approche et preuves de confiance",
      "visuels animaux, soin, relation et environnement propre",
    ],
    "local-services": [
      "message local direct, zone d'intervention et devis clair",
      "preuve rapide avec delai, disponibilite et avis",
      "process intervention en 3 etapes maximum",
    ],
    "creative-services": [
      "hero portfolio avec image metier forte, promesse de seance et CTA de reservation",
      "offres presentees comme des formats photo concrets, jamais comme des champs de prompt",
      "rythme inspire portfolio : galerie, deroule, style, retouche/livraison et contact",
    ],
  };

  return [...commonPatterns, ...(nichePatterns[profile.niche] || [])]
    .map((rule, index) => `${index + 1}. ${rule}`)
    .join("\n");
};

const buildModernBuilderInspirationGuide = () => `INSPIRATION PRODUIT MODERNE A ADAPTER SANS COPIER :
1. Conversation -> resultat : input simple, resultat visible, iteration rapide, aucune interface decoratrice dans le site final.
2. Generation structuree : sections propres, composants modernes, hierarchie nette, rendu immediatement exploitable.
3. Bibliotheque d'ecrans : lisibilite, spacing coherent, parcours utilisateur evident, CTA uniques par moment.
4. Composants premium : details visuels subtils, cartes fortes mais jamais gratuites, motion utile.
5. Assistant business : comprendre l'intention et transformer une idee floue en page utilisable et vendable.

TRADUCTION PIXELRISES :
- produire une page qui semble construite par une mini-agence, pas par un formulaire
- chaque bloc doit avoir une fonction commerciale claire
- ne jamais afficher la logique interne, le prompt, les scores ou la methode Pixelrises
- si la niche est inconnue, deduire les objets, actions, preuves et objections depuis le brief exact du client
- varier vraiment le rendu : hero, palette, visuels, ordre des preuves, ton, CTA secondaire et FAQ`;

const AI_BUILDER_STOP_WORDS = new Set([
  "avec",
  "pour",
  "dans",
  "site",
  "page",
  "web",
  "business",
  "client",
  "clients",
  "design",
  "service",
  "services",
  "objectif",
  "style",
  "pixelrises",
  "component",
  "components",
  "agent",
  "agents",
  "workflow",
  "json",
  "meta",
]);

const AI_BUILDER_NICHE_HINTS: Record<string, string[]> = {
  restaurant: ["booking_or_contact_flow", "conversion_command_center", "mobile first", "single dominant CTA"],
  coach: ["conversation_builder", "visible_progress_steps", "agent_timeline", "booking_or_contact_flow"],
  immobilier: ["premium_pattern_library", "gallery proof rail", "proof stack", "clean saas panels"],
  "car-rental": ["conversion_command_center", "booking_or_contact_flow", "form_to_result_flow", "hero action strip"],
  "sports-betting-advice": ["data_dashboard", "security_trust", "dashboard_panels", "trust_and_error_surface"],
  "education-training": ["knowledge_assistant", "docs_search_layout", "visible_progress_steps", "guided_prompt_refinement"],
  "travel-hospitality": ["booking_or_contact_flow", "mobile first", "preview_canvas", "gallery proof rail"],
  "events-entertainment": ["premium_pattern_library", "motion_first_micro_interactions", "gallery proof rail"],
  "saas-tech": ["agentic_workflow_story", "data_dashboard", "tool_command_surface", "structured_component_generation"],
  "personal-brand": ["conversation_to_preview_builder", "premium_pattern_library", "gallery proof rail"],
  wellness: ["guided_prompt_refinement", "trust_and_error_surface", "form_to_result_flow"],
  "automotive-services": ["conversion_command_center", "form_to_result_flow", "before after panels"],
  "pet-services": ["human_assistant_surface", "booking_or_contact_flow", "trust_and_error_surface"],
  medical: ["trust_and_error_surface", "knowledge_assistant", "booking_or_contact_flow"],
  beauty: ["premium_pattern_library", "gallery proof rail", "booking_or_contact_flow"],
  "professional-services": ["conversion_command_center", "structured_component_generation", "trust_and_error_surface"],
  "local-services": ["conversion_command_center", "form_to_result_flow", "proof stack", "local trust first"],
  "creative-services": ["premium_pattern_library", "conversation_to_preview_builder", "gallery proof rail"],
  ecommerce: ["structured_component_generation", "conversion_command_center", "offer comparison"],
  "general-business": ["conversion_command_center", "structured_component_generation", "conversation_to_preview_builder"],
};

const buildAiBuilderSourceKey = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) =>
  normalizeKey(
    [
      profile.niche,
      profile.designArchetype,
      profile.layoutType,
      profile.visualDirection,
      profile.imageStyle,
      form.businessType,
      form.services,
      form.description,
      form.style,
      form.positioning,
      form.colors,
      form.objective,
      form.cta,
      ...(form.enhancers || []),
      userVision?.explicitAmbiance.join(" ") || "",
      userVision?.explicitConstraints.join(" ") || "",
      userVision?.explicitColors.join(" ") || "",
      userVision?.explicitChannel || "",
    ].join(" "),
  );

const getAiBuilderSearchTokens = (sourceKey: string) =>
  unique(
    sourceKey
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !AI_BUILDER_STOP_WORDS.has(token)),
  ).slice(0, 48);

const selectAiBuilderInspirations = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const sourceKey = buildAiBuilderSourceKey(form, profile, userVision);
  const tokens = getAiBuilderSearchTokens(sourceKey);
  const hints = (AI_BUILDER_NICHE_HINTS[profile.niche] || AI_BUILDER_NICHE_HINTS["general-business"]).map(
    normalizeKey,
  );

  const scored = AI_BUILDER_INSPIRATIONS.map((inspiration) => {
    const haystack = normalizeKey(
      [
        inspiration.sourceType,
        inspiration.keywordSignals.join(" "),
        inspiration.patternSignals.join(" "),
        inspiration.uxSignals.join(" "),
        inspiration.layoutSignals.join(" "),
        inspiration.visualSignals.join(" "),
        inspiration.useCaseSignals.join(" "),
      ].join(" "),
    );
    const hintScore = hints.reduce((score, hint) => (haystack.includes(hint) ? score + 7 : score), 0);
    const tokenScore = tokens.reduce((score, token) => (haystack.includes(token) ? score + 3 : score), 0);
    const builderBoost = /prompt|chat|preview|builder|conversation|workflow|dashboard|form/.test(haystack) ? 4 : 0;

    return {
      inspiration,
      score: hintScore + tokenScore + builderBoost,
    };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const fallback = AI_BUILDER_INSPIRATIONS.map((inspiration) => ({
    inspiration,
    score: inspiration.patternSignals.includes("conversation_builder") ? 2 : 1,
  }));

  return (scored.length ? scored : fallback).slice(0, 8);
};

const selectAiBuilderCuratedPatterns = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const sourceKey = buildAiBuilderSourceKey(form, profile, userVision);
  const tokens = getAiBuilderSearchTokens(sourceKey);

  return AI_BUILDER_CURATED_PATTERNS.map((pattern) => {
    const haystack = normalizeKey(
      [
        pattern.family,
        pattern.principle,
        pattern.bestFor.join(" "),
        pattern.layoutSignals.join(" "),
        pattern.variationSignals.join(" "),
      ].join(" "),
    );
    const nicheScore = pattern.bestFor.includes(profile.niche) ? 12 : 0;
    const tokenScore = tokens.reduce((score, token) => (haystack.includes(token) ? score + 3 : score), 0);
    const localBusinessBoost =
      /restaurant|coach|immobilier|car-rental|local-services|creative-services/.test(profile.niche) &&
      pattern.family === "conversion_command_center"
        ? 6
        : 0;

    return {
      pattern,
      score: nicheScore + tokenScore + localBusinessBoost + 1,
    };
  })
    .sort((a, b) => b.score - a.score || a.pattern.family.localeCompare(b.pattern.family))
    .slice(0, 4);
};

const buildAiBuilderInspirationGuide = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const matchedInspirations = selectAiBuilderInspirations(form, profile, userVision);
  const matchedPatterns = selectAiBuilderCuratedPatterns(form, profile, userVision);

  return `BIBLIOTHEQUE D'INSPIRATION AI BUILDER / PRODUCT UX (SIGNAUX DISTILLES, A NE PAS COPIER)
Base interne : ${AI_BUILDER_INSPIRATIONS.length} inspirations locales issues du pack fourni par le client + ${AI_BUILDER_CURATED_PATTERNS.length} familles UX premium.
Regle legale et qualite : utiliser ces signaux pour varier structure, interaction, rythme, composants et hierarchie. Ne jamais copier texte, nom, marque, screenshot, image, URL ou implementation source.
Patterns premium retenus :
${matchedPatterns
  .map(
    ({ pattern, score }, index) => `${index + 1}. Famille ${pattern.family} (${score})
   - principe : ${pattern.principle}
   - layouts : ${pattern.layoutSignals.join(" | ")}
   - variation : ${pattern.variationSignals.join(" | ")}`,
  )
  .join("\n")}
Signaux locaux retenus :
${matchedInspirations
  .map(
    ({ inspiration, score }, index) => `${index + 1}. Signal AI builder (${score})
   - patterns : ${inspiration.patternSignals.join(" | ") || "conversation -> resultat -> action"}
   - UX : ${inspiration.uxSignals.join(" | ") || "input guide, feedback clair, iteration"}
   - layouts : ${inspiration.layoutSignals.join(" | ") || "hero clair, preuve, contact"}
   - visuel : ${inspiration.visualSignals.join(" | ") || "surface propre, cartes premium, CTA visible"}
   - usage : ${inspiration.useCaseSignals.join(" | ") || "business ou service client"}`,
  )
  .join("\n")}
Application Pixelrises :
- choisir 1 famille UX + 1 motif de layout + 1 rythme visuel pour cette generation
- ne pas refaire toujours : hero centre + 3 cartes + FAQ standard
- si le brief est service local : convertir les patterns en offre, preuve, process, contact et reassurance
- si le brief est produit/tech/SaaS : utiliser workflow, dashboard, tool cards ou preview canvas uniquement si cela aide a vendre l'offre
- si le brief est createur/photographe/portfolio : utiliser galerie, preuve visuelle, offre claire, contact et CTA de seance/devis
- garder la vision utilisateur au-dessus de cette bibliotheque : couleurs, CTA, canal, ambiance et contraintes explicites gagnent toujours
- ne jamais afficher les noms des sources d'inspiration dans la preview
- generer une composition originale qui semble differente des generations precedentes Pixelrises`;
};

const NICEPAGE_CATEGORY_HINTS_BY_NICHE: Record<string, string[]> = {
  restaurant: ["food restaurant", "sale"],
  coach: ["sports", "education"],
  immobilier: ["real estate", "architecture building", "interior"],
  "car-rental": ["cars transportation", "sale"],
  "sports-betting-advice": ["sports", "technology", "business law"],
  "education-training": ["education", "technology"],
  "travel-hospitality": ["nature", "interior", "food restaurant"],
  "events-entertainment": ["wedding", "art design", "sports"],
  "saas-tech": ["technology", "business law"],
  "personal-brand": ["art design", "business law", "fashion beauty"],
  wellness: ["medicine science", "fashion beauty", "nature"],
  "automotive-services": ["cars transportation", "industrial"],
  "pet-services": ["pets animals"],
  medical: ["medicine science"],
  beauty: ["fashion beauty"],
  "professional-services": ["business law"],
  "local-services": ["industrial", "business law"],
  "creative-services": ["art design", "fashion beauty", "wedding"],
  ecommerce: ["sale", "fashion beauty", "technology"],
  "general-business": ["website design", "business law"],
};

const nicepageCategoryMatches = (category: string, hints: string[]) => {
  const key = normalizeKey(category);
  return hints.some((hint) => key.includes(normalizeKey(hint)));
};

const NICEPAGE_TEMPLATE_STOP_WORDS = new Set([
  "avec",
  "pour",
  "dans",
  "site",
  "page",
  "web",
  "business",
  "client",
  "clients",
  "template",
  "templates",
  "design",
  "service",
  "services",
  "objectif",
  "style",
]);

const buildNicepageInspirationSourceKey = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) =>
  normalizeKey(
    [
      profile.niche,
      form.businessType,
      form.services,
      form.description,
      form.style,
      form.positioning,
      form.colors,
      form.objective,
      form.cta,
      ...(form.enhancers || []),
      userVision?.explicitAmbiance.join(" ") || "",
      userVision?.explicitConstraints.join(" ") || "",
      userVision?.explicitColors.join(" ") || "",
    ].join(" "),
  );

const getNicepageSearchTokens = (sourceKey: string) =>
  unique(
    sourceKey
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !NICEPAGE_TEMPLATE_STOP_WORDS.has(token)),
  ).slice(0, 40);

const selectNicepageTemplateInspirations = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const sourceKey = buildNicepageInspirationSourceKey(form, profile, userVision);
  const hints = new Set<string>([
    ...(NICEPAGE_CATEGORY_HINTS_BY_NICHE[profile.niche] || NICEPAGE_CATEGORY_HINTS_BY_NICHE["general-business"]),
  ]);

  if (/restaurant|food|pizza|pizzeria|bakery|coffee|cafe|menu|traiteur/.test(sourceKey)) hints.add("food restaurant");
  if (/interior|architecture|home|immobilier|real estate|property|maison|appartement/.test(sourceKey)) {
    hints.add("interior");
    hints.add("architecture building");
    hints.add("real estate");
  }
  if (/doctor|medical|sante|cabinet|medicine|science|wellness|bien etre|therapie/.test(sourceKey)) hints.add("medicine science");
  if (/school|formation|education|course|coach|training|academy/.test(sourceKey)) hints.add("education");
  if (/tech|saas|software|app|ai|digital|startup|platform/.test(sourceKey)) hints.add("technology");
  if (/industrial|factory|artisan|construction|renovation|plombier|electricien/.test(sourceKey)) hints.add("industrial");
  if (/shop|sale|store|ecommerce|product|fashion|beauty|coiffeur|spa/.test(sourceKey)) {
    hints.add("sale");
    hints.add("fashion beauty");
  }
  if (/nature|travel|tour|hotel|outdoor|garden/.test(sourceKey)) hints.add("nature");
  if (/art|design|portfolio|photographe|photo|creative|agency|studio/.test(sourceKey)) hints.add("art design");
  if (/law|business|consulting|finance|avocat|notaire|comptable/.test(sourceKey)) hints.add("business law");
  if (/pet|animal|chien|chat|veterinaire/.test(sourceKey)) hints.add("pets animals");
  if (/car|voiture|vehicule|transport|taxi|location auto/.test(sourceKey)) hints.add("cars transportation");
  if (/wedding|mariage|event|ceremonie/.test(sourceKey)) hints.add("wedding");
  if (/sport|fitness|football|basket|tennis|pronostic|pari/.test(sourceKey)) hints.add("sports");

  const selected = NICEPAGE_TEMPLATE_INSPIRATIONS.filter((inspiration) =>
    nicepageCategoryMatches(inspiration.sourceCategory, Array.from(hints)),
  );

  return (selected.length ? selected : NICEPAGE_TEMPLATE_INSPIRATIONS.slice(0, 1)).slice(0, 3);
};

const selectNicepageTemplateSignals = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision: UserVision | undefined,
  preferredInspirations: ReturnType<typeof selectNicepageTemplateInspirations>,
) => {
  const sourceKey = buildNicepageInspirationSourceKey(form, profile, userVision);
  const tokens = getNicepageSearchTokens(sourceKey);
  const preferredCategories = new Set(preferredInspirations.map((item) => normalizeKey(item.sourceCategory)));

  const scoredTemplates = NICEPAGE_TEMPLATE_INSPIRATIONS.flatMap((inspiration) =>
    (inspiration.templateSignals || []).map((template) => {
      const titleKey = normalizeKey(template.title);
      const keywordKey = normalizeKey(template.keywords.join(" "));
      const blockKey = normalizeKey(template.blockPatterns.join(" "));
      const headingKey = normalizeKey(template.headingSignals.join(" "));
      const categoryKey = normalizeKey(template.sourceCategory);
      const categoryBoost = preferredCategories.has(categoryKey) ? 10 : 0;
      const tokenScore = tokens.reduce((score, token) => {
        if (titleKey.includes(token)) return score + 5;
        if (keywordKey.includes(token)) return score + 4;
        if (headingKey.includes(token)) return score + 3;
        if (blockKey.includes(token)) return score + 2;
        if (categoryKey.includes(token)) return score + 2;
        return score;
      }, 0);

      return {
        template,
        score: categoryBoost + tokenScore,
      };
    }),
  )
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.template.title.localeCompare(b.template.title));

  const fallbackTemplates = preferredInspirations.flatMap((inspiration) =>
    (inspiration.templateSignals || []).slice(0, 3).map((template) => ({
      template,
      score: 1,
    })),
  );

  return (scoredTemplates.length ? scoredTemplates : fallbackTemplates).slice(0, 9);
};

const buildNicepageTemplateInspirationGuide = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const inspirations = selectNicepageTemplateInspirations(form, profile, userVision);
  const matchedTemplates = selectNicepageTemplateSignals(form, profile, userVision, inspirations);
  const totalTemplates = NICEPAGE_TEMPLATE_INSPIRATIONS.reduce(
    (count, inspiration) => count + inspiration.templateCount,
    0,
  );

  return `BIBLIOTHEQUE D'INSPIRATION TEMPLATE - NICEPAGE (SIGNAUX DISTILLES, A NE PAS COPIER)
Base interne : ${totalTemplates} templates analyses depuis ${NICEPAGE_TEMPLATE_INSPIRATIONS.length} pages/categorie Nicepage.
Regle legale et qualite : utiliser ces signaux pour varier structure, rythme et direction visuelle. Ne jamais copier les textes, titres, images, noms de templates, descriptions, blocs visibles ou contenus Nicepage dans le site final.
Sources utiles detectees :
${inspirations
  .map(
    (inspiration, index) => `${index + 1}. ${inspiration.sourceCategory} (${inspiration.templateCount} templates analyses)
   - mots-cles : ${inspiration.keywordSignals.slice(0, 12).join(", ") || "aucun"}
   - blocs frequents : ${inspiration.blockPatterns.slice(0, 8).join(" -> ") || "hero -> services -> preuve -> contact"}
   - directions visuelles : ${inspiration.visualSignals.join(" | ") || "hierarchie claire, sections lisibles, CTA visible"}
   - signaux de sections : ${inspiration.headingSignals.slice(0, 8).join(" | ") || "hero, services, preuves, contact"}`,
  )
  .join("\n")}
Templates proches retenus dans toute la base :
${matchedTemplates
  .map(
    ({ template, score }, index) => `${index + 1}. Signal interne (${score}) : ${template.sourceCategory} / ${template.title}
   - mots-cles : ${template.keywords.slice(0, 8).join(", ") || "aucun"}
   - blocs : ${template.blockPatterns.slice(0, 7).join(" -> ") || "hero -> services -> preuve -> contact"}
   - sections inspirees : ${template.headingSignals.slice(0, 5).join(" | ") || "sections metier, preuve, contact"}`,
  )
  .join("\n")}
Application Pixelrises :
- choisir une combinaison originale de ces signaux, pas un template unique
- puiser dans les templates proches ci-dessus comme reference de rythme, puis recreer une structure Pixelrises originale
- garder la vision utilisateur prioritaire sur ces inspirations
- transformer les patterns en sections originales adaptees au metier, a la ville, au CTA et au niveau de gamme
- produire des visuels generes/selectionnes pour le client, jamais les images Nicepage ni les URLs source
- reecrire tous les textes a partir de la vision utilisateur : les titres de templates ci-dessus ne doivent jamais devenir des titres visibles
- si le rendu ressemble a une ancienne generation Pixelrises, changer le rythme : ordre des preuves, hero, cartes, FAQ, CTA secondaire et direction visuelle`;
};

const TEMPLATEMO_NICHE_HINTS: Record<string, string[]> = {
  restaurant: ["restaurant", "bakery", "food", "collection", "commerce"],
  coach: ["saas", "app", "premium", "journey", "landing"],
  immobilier: ["premium", "parallax", "gallery", "business"],
  "car-rental": ["journey", "transport", "premium", "parallax"],
  "sports-betting-advice": ["dashboard", "graph", "data", "sports", "crypto"],
  "education-training": ["ebook", "course", "landing", "chapter"],
  "travel-hospitality": ["journey", "parallax", "gallery", "event"],
  "events-entertainment": ["countdown", "piano", "christmas", "event", "gallery"],
  "saas-tech": ["saas", "app", "crypto", "graph", "quantix", "nexa", "dashboard", "prism"],
  "personal-brand": ["portfolio", "folio", "catalyst", "premium", "parallax"],
  wellness: ["moonlight", "parallax", "premium", "journey"],
  "automotive-services": ["industrial", "axis", "premium", "service"],
  "pet-services": ["friendly", "service", "gallery", "premium"],
  "local-services": ["industrial", "axis", "service", "hydro", "business"],
  "professional-services": ["sleek", "pro", "catalyst", "business", "premium"],
  ecommerce: ["gold", "bakery", "fashion", "collection", "sale"],
  medical: ["clean", "trust", "professional", "moonlight"],
  beauty: ["fashion", "noir", "gold", "portfolio", "gallery"],
  "creative-services": ["portfolio", "folio", "pixel", "forge", "artist", "parallax"],
  "general-business": ["sleek", "pro", "catalyst", "parallax", "hydro"],
};

const selectTemplatemoInspirations = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const sourceKey = normalizeKey(
    [
      buildNicepageInspirationSourceKey(form, profile, userVision),
      profile.designArchetype,
      profile.layoutType,
      profile.visualDirection,
      profile.imageStyle,
    ].join(" "),
  );
  const tokens = getNicepageSearchTokens(sourceKey);
  const preferredHints = (TEMPLATEMO_NICHE_HINTS[profile.niche] || TEMPLATEMO_NICHE_HINTS["general-business"]).map(
    normalizeKey,
  );

  const scored = TEMPLATEMO_TEMPLATE_INSPIRATIONS.map((inspiration) => {
    const haystack = normalizeKey(
      [
        inspiration.sourceTemplate,
        inspiration.likelyNiches.join(" "),
        inspiration.componentSignals.join(" "),
        inspiration.sectionPatterns.join(" "),
        inspiration.visualSignals.join(" "),
        inspiration.colorSignals.join(" "),
        inspiration.animationSignals.join(" "),
        inspiration.layoutSignals.join(" "),
        inspiration.keywordSignals.join(" "),
        inspiration.assetSignals.join(" "),
      ].join(" "),
    );
    const nicheBoost = inspiration.likelyNiches.includes(profile.niche) ? 14 : 0;
    const hintBoost = preferredHints.reduce((score, hint) => (haystack.includes(hint) ? score + 4 : score), 0);
    const tokenScore = tokens.reduce((score, token) => {
      if (haystack.includes(token)) return score + 3;
      return score;
    }, 0);

    return {
      inspiration,
      score: nicheBoost + hintBoost + tokenScore,
    };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.inspiration.sourceTemplate.localeCompare(b.inspiration.sourceTemplate));

  const fallback = TEMPLATEMO_TEMPLATE_INSPIRATIONS.map((inspiration) => ({
    inspiration,
    score: inspiration.likelyNiches.includes("premium-business") ? 2 : 1,
  }));

  return (scored.length ? scored : fallback).slice(0, 7);
};

const buildTemplatemoInspirationGuide = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => {
  const matched = selectTemplatemoInspirations(form, profile, userVision);
  const totalPages = TEMPLATEMO_TEMPLATE_INSPIRATIONS.reduce((sum, entry) => sum + entry.pageCount, 0);

  return `BIBLIOTHEQUE D'INSPIRATION TEMPLATE - TEMPLATEMO LOCAL (SIGNAUX DISTILLES, A NE PAS COPIER)
Base interne : ${TEMPLATEMO_TEMPLATE_INSPIRATIONS.length} templates ZIP fournis par le client, ${totalPages} page(s) HTML analysees.
Regle legale et qualite : utiliser uniquement la logique UX, les familles de composants, le rythme, les palettes et les animations. Ne jamais copier HTML, CSS, textes, noms de templates, images ou fichiers sources.
Signaux locaux retenus :
${matched
  .map(
    ({ inspiration, score }, index) => `${index + 1}. Signal TemplateMo local (${score}) - niches : ${inspiration.likelyNiches.join(", ")}
   - composants : ${inspiration.componentSignals.slice(0, 8).join(" | ") || "hero, services, preuve, contact"}
   - patterns de sections : ${inspiration.sectionPatterns.slice(0, 10).join(" -> ") || "hero -> services -> preuves -> CTA"}
   - direction visuelle : ${inspiration.visualSignals.join(" | ") || "layout moderne, cartes lisibles, CTA visible"}
   - couleurs/palette : ${inspiration.colorSignals.slice(0, 8).join(", ") || "palette adaptee a la vision utilisateur"}
   - animations/rythme : ${inspiration.animationSignals.slice(0, 6).join(", ") || "transitions legeres et scroll fluide"}
   - assets a recreer : ${inspiration.assetSignals.slice(0, 8).join(", ") || "visuels originaux adaptes au metier"}`,
  )
  .join("\n")}
Application Pixelrises :
- mixer ces signaux avec Nicepage et la vision utilisateur pour eviter les pages repetitives
- si la vision utilisateur demande une couleur, un canal ou un style precis, elle passe avant ces inspirations
- recreer les composants en JSON Pixelrises original : hero, cartes, galerie, process, FAQ, CTA, stats ou dashboard selon le metier
- utiliser les palettes comme direction, pas comme copie CSS brute
- generer des visuels originaux ou stock/licencies, jamais les images TemplateMo
- ne jamais afficher TemplateMo, un nom de template, une classe CSS source ou une phrase issue du template dans la preview`;
};

const buildSensitiveNicheGuard = (profile: BusinessProfile) => {
  if (profile.niche === "sports-betting-advice") {
    return `GARDE-FOU NICHE SENSIBLE - PRONOSTICS / PARIS SPORTIFS :
- Le resultat doit presenter une activite personnelle de pronostics, analyses sportives, communaute ou contenu, pas une plateforme de prise de paris.
- Interdire toute promesse de gain garanti, revenu facile, pari sans risque, 100% sur ou certitude de resultat.
- Ajouter naturellement une reassurance responsable : reserve aux personnes majeures, aucun gain garanti, les paris comportent des risques.
- CTA autorises : rejoindre la communaute, recevoir les analyses, voir les pronostics, s'abonner aux analyses, decouvrir la methode.
- CTA interdits : parier ici, miser maintenant, gagner a coup sur, doubler sa mise.
- Les preuves doivent etre transparentes : methode, discipline, suivi, historique ou pedagogie, jamais faux chiffres agressifs.`;
  }

  if (profile.niche === "medical" || profile.niche === "wellness") {
    return `GARDE-FOU SANTE / BIEN-ETRE :
- Rester rassurant et professionnel sans promettre de guerison ni resultat medical garanti.
- Preferer prise de contact, rendez-vous, cadre, methode et confiance.
- Les temoignages doivent rester plausibles et non medicaux.`;
  }

  if (profile.niche === "professional-services") {
    return `GARDE-FOU SERVICES REGLEMENTES :
- Ne pas promettre de resultat juridique, fiscal, financier ou patrimonial garanti.
- Mettre en avant methode, cadre, clarte, confiance et premier echange.`;
  }

  return `GARDE-FOU GENERAL :
- Ne jamais inventer de garantie absolue, chiffre spectaculaire ou promesse impossible.
- Si le secteur est sensible, rester responsable, transparent et oriente information utile.`;
};

const buildObjectivePromptRules = (profile: BusinessProfile) => {
  const rules: Record<ObjectiveMode, string[]> = {
    "attirer-clients": [
      "Priorite : visibilite, impact rapide, comprehension immediate.",
      "Hero : benefice clair, simplicite, rapidite de comprehension.",
      "CTA : privilegier reserver, decouvrir, contacter.",
      "Focus : clarte, accessibilite, passage a l'action rapide.",
      "Structure recommandee : hero -> probleme/opportunite -> services -> benefices -> preuve sociale -> process -> reassurance -> FAQ -> CTA final.",
    ],
    "vendre-plus": [
      "Priorite : conversion directe et valeur percue.",
      "Hero : offre, valeur, desir et urgence propre.",
      "CTA : privilegier acheter, commander, profiter.",
      "Focus : persuasion, benefices, levee des objections.",
      "Structure recommandee : hero -> offre -> benefices -> preuves -> objections/FAQ -> reassurance -> CTA final.",
    ],
    "prendre-rendez-vous": [
      "Priorite : action rapide et parcours simple.",
      "Hero : transformation, resultat concret et simplicite.",
      "CTA : privilegier prendre rendez-vous ou reserver.",
      "Focus : confiance, clarte, suppression des frictions.",
      "Structure recommandee : hero -> probleme/promesse -> services -> process 3 etapes -> reassurance -> temoignages -> FAQ -> CTA reservation.",
    ],
    "renforcer-credibilite": [
      "Priorite : autorite, confiance et preuve.",
      "Hero : autorite claire, serieux et preuve visible.",
      "CTA : privilegier decouvrir, voir les resultats, demander un echange.",
      "Focus : preuve sociale, expertise, reassurance.",
      "Structure recommandee : hero -> preuve/autorite -> methode -> services -> temoignages -> reassurance -> FAQ -> CTA.",
    ],
    "generer-leads": [
      "Priorite : capturer un contact qualifie.",
      "Hero : valeur offerte, gain immediat et promesse claire.",
      "CTA : privilegier recevoir, telecharger, demander.",
      "Focus : offre utile, reassurance, faible friction.",
      "Structure recommandee : hero -> valeur immediate -> offres -> benefices -> preuve -> reassurance -> FAQ -> CTA lead.",
    ],
  };

  return rules[profile.objectiveMode].join("\n");
};

const buildStylePromptRules = (style: string) => {
  const key = normalizeKey(style);

  if (key.includes("minimal")) {
    return [
      "Style : minimaliste.",
      "- tres epure",
      "- peu de texte inutile",
      "- beaucoup d'espace",
      "- focus sur le message",
    ].join("\n");
  }

  if (key.includes("premium")) {
    return [
      "Style : premium.",
      "- sombre ou contraste fort",
      "- sensation luxe et haut de gamme",
      "- images fortes",
      "- typographie marquee",
      "- animations legeres et maitrisees",
    ].join("\n");
  }

  if (key.includes("eleg")) {
    return [
      "Style : elegant.",
      "- doux",
      "- equilibre",
      "- harmonieux",
      "- sobre mais travaille",
    ].join("\n");
  }

  if (key.includes("dynam")) {
    return [
      "Style : dynamique.",
      "- rapide",
      "- visuel",
      "- impact fort",
      "- CTA visibles",
      "- rythme soutenu sans surcharge",
    ].join("\n");
  }

  return [
    "Style : moderne.",
    "- clean",
    "- contraste maitrise",
    "- animations fluides",
    "- interface actuelle et lisible",
  ].join("\n");
};

const buildPositioningPromptRules = (positioning: string) => {
  const key = normalizeKey(positioning);

  if (key.includes("access")) {
    return [
      "Niveau de gamme : accessible.",
      "- simple",
      "- rassurant",
      "- prix ou accessibilite clairs",
      "- direct et facile a comprendre",
    ].join("\n");
  }

  if (key.includes("premium")) {
    return [
      "Niveau de gamme : premium.",
      "- haut de gamme",
      "- exclusif",
      "- emotionnel",
      "- design fort",
      "- perception luxe",
    ].join("\n");
  }

  return [
    "Niveau de gamme : professionnel.",
    "- credible",
    "- structure",
    "- efficace",
    "- optimise conversion",
  ].join("\n");
};

const buildClientBusinessBoundary = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => `CADRE M\u00c9TIER ABSOLU - NON N\u00c9GOCIABLE :
- Tu cr\u00e9es le site POUR l'entreprise du client, pas un site qui vend Pixelrises, l'IA ou de la cr\u00e9ation de site.
- M\u00e9tier r\u00e9el \u00e0 vendre : ${form.businessType}.
- Entreprise : ${form.businessName}.
- Offre r\u00e9elle \u00e0 mettre en avant : ${profile.offer}.
- Objectif r\u00e9el : ${profile.conversionGoal}.
- CTA r\u00e9el : ${profile.ctaPrimary || form.cta}.
- Si le brief dit "cr\u00e9e un site pour X", alors X est l'activit\u00e9 du client, jamais le produit vendu par l'offre.
- L'offre doit vendre, r\u00e9server ou faire demander les services, produits ou rendez-vous de ${form.businessName}.
- Interdiction de parler de cr\u00e9ation de site, site web, pr\u00e9sence web, g\u00e9n\u00e9ration IA, builder, prompt, dashboard ou Pixelrises dans les contenus g\u00e9n\u00e9r\u00e9s, sauf si le m\u00e9tier demand\u00e9 est explicitement une agence web.
- Le hero doit nommer l'activit\u00e9 r\u00e9elle et le r\u00e9sultat client r\u00e9el, par exemple location de voitures, restaurant, coach, immobilier ou service local selon le brief.`;

const buildBriefTransformationRules = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => `TRANSFORMATION DU BRIEF - REGLE ANTI-COPIE :
- Le texte du client sert uniquement a comprendre l'idee. Il ne doit jamais apparaitre tel quel dans la preview.
- Extraire les faits utiles : activite=${form.businessType}, ville=${form.city || "non renseignee"}, cible=${profile.targetAudience}, objectif=${profile.conversionGoal}, CTA=${profile.ctaPrimary || form.cta}.
- Transformer ces faits en promesse, offres, objections, preuves, FAQ et direction visuelle.
- Si la description contient une phrase du type "Cree un rendu premium pour...", supprimer cette formulation et parler directement comme l'entreprise finale.
- Interdit de reprendre des libelles de brief visibles : "Cible :", "Objectif :", "Style :", "CTA :", "niveau de gamme", "description libre".
- Le site final doit sembler ecrit par ${form.businessName} pour ses clients, pas par un utilisateur qui demande un site.`;

const buildPixelrisesConversionBrief = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
) => {
  const services = getCleanServiceList(form.services).slice(0, 5);
  const serviceLine = services.length ? services.join(", ") : profile.offer;
  const localLine = form.city
    ? `Ancrage local obligatoire : ${form.city}, zone proche, intention de recherche locale et preuve de disponibilit\u00e9.`
    : "Ancrage local : si aucune ville n'est fournie, rester clair sur la zone servie sans inventer d'adresse.";

  return `INTELLIGENCE PIXELRISES - BRIEF DE CONVERSION :
- Prospect principal : ${profile.targetAudience}.
- Situation du prospect avant l'offre : ${profile.audiencePains.join(", ") || "il h\u00e9site, compare et veut comprendre vite"}.
- D\u00e9sir \u00e0 activer : ${profile.audienceDesires.join(", ") || "gagner du temps, choisir avec confiance et passer \u00e0 l'action"}.
- Offre \u00e0 rendre concr\u00e8te : ${serviceLine}.
- Action finale attendue : ${strategy.primaryCta || form.cta}.
- Objections \u00e0 lever dans le contenu : ${profile.objections.join(", ") || "prix, d\u00e9lai, confiance, disponibilit\u00e9, fonctionnement"}.
- Preuves \u00e0 rendre visibles : ${profile.proofAssets.join(", ") || strategy.proofStyle}.
- ${localLine}

FORMULE HERO OBLIGATOIRE :
Activit\u00e9 r\u00e9elle + ville ou contexte + b\u00e9n\u00e9fice concret + action claire.
Le hero ne doit jamais vendre un site web. Il doit vendre l'offre r\u00e9elle de ${form.businessName}.
Interdit dans le hero visible : parler de conversion, de visiteurs, de leads, de parcours client, de strategie ou de "passer de l'interet au rendez-vous".
Exemples de direction : pour un restaurant, parler de table, cuisine, ambiance, reservation et quartier; pour un coach, parler de seance, bilan, energie et progression; pour une location de voiture, parler de vehicule, reservation, remise des cles et trajet.

FORMULE SERVICES :
Chaque service doit suivre : action concr\u00e8te + objet du service + contexte d'usage + r\u00e9sultat attendu.
Interdit : "accompagnement", "solution", "expertise", "offre premium" sans d\u00e9tail m\u00e9tier.

FORMULE T\u00c9MOIGNAGES :
Contexte r\u00e9aliste + point de friction avant + ce qui a rassur\u00e9 + effet concret.
Interdit : avis trop parfait, faux chiffres agressifs, flatterie vide.

FORMULE FAQ :
Questions que le prospect poserait vraiment avant de ${profile.conversionGoal} : prix, d\u00e9lai, disponibilit\u00e9, zone, garantie, fonctionnement, confiance.

FORMULE DESIGN :
Le design doit rendre l'offre plus facile \u00e0 comprendre, pas seulement plus joli : hi\u00e9rarchie, respiration, preuve, CTA, contraste mobile.`;
};

const buildAlwaysOnPixelrisesPromptLayer = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  userVision: UserVision,
) => {
  const selectedDirections = form.enhancers.length
    ? form.enhancers.map((enhancer) => `- ${enhancer}`).join("\n")
    : "- aucune option selectionnee : appliquer la couche Pixelrises par defaut plus fortement.";

  return `COUCHE PIXELRISES TOUJOURS ACTIVE - MINI AGENCE IA :
- Le prompt utilisateur reste une intention brute. Tu dois le transformer en brief professionnel sans le recopier.
- Priorite absolue : respecter la vision utilisateur detectee : ${userVision.priority}.
- Ne remplace jamais cette vision par un template metier. Les heuristiques metier servent seulement a completer ce qui manque.
- Transformer un petit prompt en page vendable : promesse specifique, offre claire, preuves, objections, process court, FAQ utile et CTA coherent.
- Garder l'objectif Pixelrises : aider ${form.businessName || "ce business"} a obtenir plus de clients, de demandes, de reservations ou de ventes selon l'objectif.
- Adapter vraiment le design : style ${form.style || profile.visualDirection}, gamme ${form.positioning || profile.positioning}, couleurs ${form.colors || "deduites"}, mobile lisible, sections variees.
- Ajouter la touche Pixelrises : clarte en 3 secondes, conversion sans agressivite, reassurance visible, SEO naturel, aucun jargon IA.
- Si une option ci-dessous est active, elle renforce la direction. Si aucune option n'est active, appliquer quand meme cette couche de base.

OPTIONS INTERNES ACTIVEES :
${selectedDirections}

RESULTAT ATTENDU :
- le site final parle uniquement de ${form.businessType || profile.offer}
- le hero ne doit pas afficher le prompt du client
- chaque etape doit apporter quelque chose de concret a la decision
- le design doit etre different d'une generation a l'autre selon niche, vision, style, couleurs et graine ${form.variationSeed}.`;
};

const buildNicheSpecificQualityRules = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision: UserVision,
) => {
  const nicheRules: Record<string, string> = {
    restaurant: `REGLES SPECIFIQUES RESTAURANT - PRIORITE HAUTE :
- Le site vend une experience de restaurant reelle, pas une page business abstraite.
- Les offres doivent parler de reservation, carte/menu, ambiance, salle, plats, groupes/evenements ou dejeuner/diner.
- Les visuels doivent montrer plats, salle, table, chef, cuisine ou ambiance restaurant. Interdit : bureau, coworking, laptop, tableau blanc, post-it.
- Le hero doit donner envie de reserver une table ou de venir manger, pas seulement "Restaurant a ${form.city || "la ville"}".
- La FAQ doit traiter reservation, horaires, groupes, paiement, menus ou acces.`,
    coach: `REGLES SPECIFIQUES COACH SPORTIF - PRIORITE HAUTE :
- Le site vend une transformation accompagnee, pas un conseil vague.
- Les offres doivent parler de bilan, coaching individuel, programme, perte de poids, prise de masse, remise en forme, suivi ou seance.
- Les visuels doivent montrer mouvement, coach, entrainement, energie ou progression. Interdit : bureau/coworking/laptop sauf demande explicite.
- Le hero doit promettre un resultat sportif credible et une action de rendez-vous.`,
    immobilier: `REGLES SPECIFIQUES IMMOBILIER - PRIORITE HAUTE :
- Le site doit rassurer vendeurs/acheteurs avec estimation, accompagnement, biens, visites et connaissance locale.
- Les visuels doivent montrer biens, interieur, facade, visite, estimation ou quartier. Interdit : visuels startup/coworking generiques.
- Le hero doit parler d'estimation, vente, achat ou accompagnement immobilier, pas d'une "presence moderne".`,
    "car-rental": `REGLES SPECIFIQUES LOCATION VOITURE - PRIORITE HAUTE :
- Le site doit faciliter la reservation d'un vehicule : disponibilites, modeles, remise des cles, conditions, trajet.
- Les visuels doivent montrer voitures, route, clefs, parking ou experience de location. Interdit : restaurant, bureau, laptop.
- Le CTA doit rester lie a la reservation ou demande de disponibilites.`,
    beauty: `REGLES SPECIFIQUES BEAUTE / INSTITUT - PRIORITE HAUTE :
- Le site doit vendre un resultat de soin credible et rassurant.
- Les offres doivent parler de soins, visage, coiffure, onglerie, spa, diagnostic beaute ou reservation de prestation.
- Les visuels doivent montrer soin, peau, institut, geste professionnel ou ambiance beaute. Interdit : bureau/coworking/voiture.`,
  };

  if (!isPhotographyBusiness(form) && !nicheRules[profile.niche]) return "";
  if (!isPhotographyBusiness(form)) return nicheRules[profile.niche];

  const cityLine = form.city
    ? `- ancrer naturellement les textes et visuels dans ${form.city}, sans bourrage SEO.`
    : "- si la ville manque, rester prudent et ne pas inventer de quartier precis.";
  const whatsappLine = userVision.explicitChannel === "WhatsApp"
    ? "- WhatsApp doit etre le canal d'action visible dans hero, offres et CTA final."
    : "- le CTA principal doit rester coherent avec une demande de seance ou devis photo.";

  return `REGLES SPECIFIQUES PHOTOGRAPHE / PORTFOLIO - PRIORITE HAUTE :
- Ne jamais sortir une page d'agence digitale, coworking, formation ou conseil. Le site vend une prestation photo reelle.
- Les services doivent etre des offres photo concretes : seance portrait/lifestyle, shooting reseaux sociaux, reportage evenementiel/mariage, portraits professionnels, retouche + galerie, mini-session studio/urbaine.
- Interdit comme noms de services : "Style rose/violet/noir", "Photographe oriente prise de rendez-vous", "CTA", "objectif", "conversion", "clients prets a passer a l'action".
- Les titres de sections ne doivent pas se repeter : problemTitle, servicesTitle, benefitsTitle, reassuranceTitle, localSeoTitle et ctaTitle doivent porter des angles differents.
- Les visuels doivent montrer le metier : photographe, appareil photo, portrait, shooting, lumiere, modele, couple, galerie, retouche, preparation de seance ou lieu photo.
- Interdit dans les visuels pour un photographe sauf demande explicite corporate : open-space, coworking, tableau blanc, post-it, meeting, startup, laptop close-up, salle de reunion.
- Le hero doit donner un angle photo specifique, pas seulement "Photographe Paris" ni "Immortalisez votre style unique".
- La preuve sociale doit rester plausible : contexte de seance, aisance, rendu, delai ou galerie; pas de "je recommande a 100%" ni de chiffres inventes.
${cityLine}
${whatsappLine}`;
};

const buildSiteSpecificityMatrix = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  userVision: UserVision,
) => {
  const cityHook = form.city ? `a ${form.city}` : "dans la zone du client";
  const serviceAngles = buildFallbackServiceNames(form, profile)
    .slice(0, 6)
    .map((service, index) => `${index + 1}. ${service}`)
    .join("\n");
  const requiredSignals = unique([
    form.businessType ? `metier visible : ${form.businessType}` : "",
    form.city ? `ville visible : ${form.city}` : "",
    userVision.explicitColors.length ? `couleurs visibles : ${userVision.explicitColors.join(" + ")}` : "",
    userVision.explicitAmbiance.length ? `ambiance visible : ${userVision.explicitAmbiance.join(" + ")}` : "",
    userVision.explicitChannel ? `canal visible : ${userVision.explicitChannel}` : "",
    userVision.explicitCta ? `CTA visible : ${userVision.explicitCta}` : "",
    `objectif : ${profile.conversionGoal}`,
    `recette : ${selectCreativeLayoutRecipe(form, profile, userVision).id}`,
  ]).filter(Boolean);

  return `MATRICE ANTI-TEMPLATE PIXELRISES - OBLIGATOIRE :
- Ce site ne doit pas ressembler a une page standard hero -> cartes -> avis -> FAQ.
- Chaque grande section doit avoir un angle different : desir, probleme, offre, preuve, methode, objection, action.
- Ne jamais transformer les champs du brief en contenus visibles. "Style", "couleurs", "objectif", "CTA", "prompt", "lead" ne sont pas des noms d'offres.
- Ne jamais reutiliser le meme titre, la meme phrase, la meme promesse ou la meme image mentale sur deux sections.
- Les services doivent etre de vraies offres client, pas des categories de formulaire.
- Les benefices doivent expliquer ce que le client gagne, pas repeter les services.
- Les visuels doivent montrer des situations metier differentes : hero aspirationnel, offre en action, preuve/resultat, contexte local, passage a l'action.
- Les temoignages doivent parler d'un contexte concret, jamais flatter le site ou la page.

SIGNAUX A FAIRE APPARAITRE :
${requiredSignals.map((signal) => `- ${signal}`).join("\n") || "- respecter le brief original avant tout template"}

OFFRES / ANGLES A UTILISER COMME BASE, A ADAPTER AU BRIEF :
${serviceAngles || `1. ${profile.offer} ${cityHook}
2. Methode claire
3. Preuve client
4. Passage a l'action`}

SECTION ANGLES :
- hero : promesse specifique + contexte + action
- probleme/opportunite : tension concrete du prospect
- services : formats/offres utilisables immediatement
- benefices : resultats distincts des offres
- process : friction reduite en 3 etapes maximum
- reassurance : conditions, cadre, qualite, delai ou confiance
- FAQ : objections avant contact, devis, reservation ou achat
- CTA final : action principale claire, coherente avec ${strategy.primaryCta || form.cta}

CONTROLE AVANT REPONSE :
- si une phrase peut convenir a un restaurant, un coach et un photographe en meme temps, elle est trop generique.
- si deux cartes ont la meme fonction, fusionner ou remplacer par une preuve plus utile.
- si une image ressemble a une banque d'image bureau sans lien direct avec le metier, changer la scene.`;
};

const buildPromptEnhancerPixelrises = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  blueprint: PromptBlueprint,
  userVision: UserVision,
) => `PROMPT ENHANCER PIXELRISES - ANALYSE INTERNE NON VISIBLE

0. Vision utilisateur
${buildUserVisionPromptBlock(userVision)}

1. Analyse business
- activite : ${form.businessType}
- cible : ${profile.targetAudience}
- besoin reel : ${profile.conversionGoal}
- douleur principale : ${profile.audiencePains.join(", ") || "manque de clarte et de confiance avant l'action"}
- desir principal : ${profile.audienceDesires.join(", ") || "comprendre vite la valeur et passer a l'action"}
- objections probables : ${profile.objections.join(", ") || "prix, confiance, delai, pertinence, disponibilite"}
- niveau de gamme : ${profile.positioning}
- differenciation possible : ${profile.differentiators.join(", ") || strategy.differentiationHooks.join(", ")}
- contexte local : ${form.city || "non localise"}
- opportunite commerciale : ${strategy.marketingAngle}

2. Strategie de conversion
- promesse principale : ${strategy.promise}
- angle marketing : ${strategy.marketingAngle}
- CTA principal : ${strategy.primaryCta || form.cta}
- CTA secondaire : ${strategy.secondaryCta}
- preuve a mettre en avant : ${strategy.proofStyle}
- objections a lever : ${profile.objections.join(", ") || "credibilite, comprehension, passage a l'action"}
- niveau de persuasion : ${strategy.ctaIntensity}
- sequence de conversion : ${strategy.prioritySections.join(" -> ")}

3. Direction design
- style visuel : ${strategy.visualStyle}
- ambiance : ${profile.visualDirection}
- palette : ${JSON.stringify(profile.palette)}
- signature de design : ${buildDesignArchetypeGuide(profile)}
- typographie : titres nets, hierarchie forte, lecture mobile facile
- niveau premium : ${profile.premiumLevel}
- type d'images : ${strategy.imageDirection}
- rythme visuel : ${strategy.animationDirection}

4. Structure SEO
- mot-cle principal : ${form.city ? `${form.businessType} ${form.city}` : form.businessType}
- mots-cles secondaires : ${profile.seoKeywords.join(", ")}
- ville : ${form.city || "non renseignee"}
- FAQ utile : prix, delai, confiance, zone, fonctionnement, disponibilite
- title : ${form.city ? `${form.businessType} a ${form.city} | ${form.businessName}` : `${form.businessName} | ${form.businessType}`}
- meta description : promesse claire + activite + ville si disponible + CTA

5. Contraintes de generation
- JSON valide strict, pas de markdown
- contenu specifique au metier, a la ville, a l'objectif, au style et a la gamme
- blocs utiles uniquement
- aucune donnee interne visible
- aucun texte generique, aucun score, aucun debug, aucun bloc Indicateur
- le brief client est une matiere premiere : extraire l'intention, puis rediger comme l'entreprise finale, jamais comme la demande du client
- ne pas recopier une phrase complete de la description libre, meme si elle semble utile
- validations obligatoires : ${blueprint.validationChecks.join(" | ")}

6. Brief de conversion Pixelrises
${buildPixelrisesConversionBrief(form, profile, strategy)}

7. Couche Pixelrises toujours active
${buildAlwaysOnPixelrisesPromptLayer(form, profile, strategy, userVision)}

8. Regles niche haute priorite
${buildNicheSpecificQualityRules(form, profile, userVision) || "- aucune regle niche additionnelle."}

8B. Matrice anti-template obligatoire
${buildSiteSpecificityMatrix(form, profile, strategy, userVision)}

9. Inspirations de structure modernes
${buildDesignPatternGuide(profile)}

10. Recette creative Pixelrises
${buildCreativeVariationGuide(form, profile, userVision)}

11. Inspiration templates Nicepage distillee
${buildNicepageTemplateInspirationGuide(form, profile, userVision)}

12. Inspiration templates TemplateMo locale distillee
${buildTemplatemoInspirationGuide(form, profile, userVision)}

13. Inspiration AI builder et product UX distillee
${buildAiBuilderInspirationGuide(form, profile, userVision)}

14. Inspiration produit Pixelrises
${buildModernBuilderInspirationGuide()}

15. Garde-fou secteur
${buildSensitiveNicheGuard(profile)}

16. Sortie attendue par Pixelrises
- retourner un site pret pour la preview
- accompagner le site de metadata SEO exploitable pour l'activite reelle du client
- rendre les CTA coherents avec l'objectif
- fournir une description design concise dans design.visual_direction, design.typography, design.image_style, design.button_style, design.card_style et design.section_style
- design.layout_type doit contenir cette signature exacte : ${profile.designArchetype}
- design.mobile_behavior doit expliquer comment la version mobile garde CTA, lecture et contact visibles
- ne jamais retourner de code React ou Next.js : l'application Pixelrises convertit ce JSON en rendu preview`;

const buildBusinessAnalysisSystemPrompt = () => `Tu es l'analyste business interne de Pixelrises AI.

Tu ne r\u00e9diges pas encore le site.
Tu produis d'abord un cadrage business exploitable pour un site qui doit convertir.

OBJECTIF :
- comprendre la vraie cible
- comprendre la promesse la plus vendable
- comprendre les objections \u00e0 lever
- comprendre les preuves \u00e0 montrer
- comprendre le bon niveau de gamme
- comprendre l'angle local si une ville est fournie

M\u00c9THODE OBLIGATOIRE :
1. analyser le business
2. identifier audience, douleur, d\u00e8sir, objection et action cible
3. choisir l'angle de promesse le plus fort et le plus cr\u00e9dible
4. proposer une direction visuelle coh\u00e9rente avec la niche
5. r\u00e9pondre uniquement via la fonction analyze_business_profile

R\u00c8GLES :
- aucune sortie hors fonction
- aucune phrase g\u00e9n\u00e9rique
- aucun jargon technique
- aucune mention de mod\u00e8le IA
- rester cr\u00e9dible, concret et orient\u00e9 conversion`;

const buildBusinessAnalysisUserPrompt = (
  form: Required<FormPayload>,
  heuristicProfile: BusinessProfile,
  userVision: UserVision,
) => `Analyse ce brief pour pr\u00e9parer une page commerciale premium pour l'activit\u00e9 r\u00e9elle du client.

BRIEF CLIENT :
- Nom : ${form.businessName}
- Activit\u00e9 : ${form.businessType}
- Ville : ${form.city || "non renseign\u00e9e"}
- Cible mentionn\u00e9e : ${form.targetAudience || "non renseign\u00e9e"}
- Services : ${form.services || "non renseign\u00e9s"}
- Positionnement : ${form.positioning || "non renseign\u00e9"}
- Style souhait\u00e9 : ${form.style}
- Ambiance / couleurs : ${form.colors}
- Objectif business : ${form.objective}
- CTA attendu : ${form.cta}
- Description libre : ${form.description || "non renseign\u00e9e"}

${buildUserVisionPromptBlock(userVision)}

BASE HEURISTIQUE PIXELRISES :
${JSON.stringify(heuristicProfile, null, 2)}

CONSIGNES :
- choisis l'angle business le plus vendable
- adapte l'analyse \u00e0 la niche r\u00e9elle
- la base heuristique complete seulement les manques, elle ne remplace jamais les choix explicites de la vision utilisateur
- conserve les couleurs, le CTA, le canal, la ville, l'ambiance et les contraintes explicites dans l'analyse
- pr\u00e9pare un site orient\u00e9 b\u00e9n\u00e9fices, confiance et conversion
- pense comme un strat\u00e8ge agence + copywriter senior
- la sortie doit aider \u00e0 g\u00e9n\u00e9rer une page qui vend uniquement les services, produits ou rendez-vous de cette activit\u00e9`;

const buildSharedSystemContract = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision?: UserVision,
) => `Tu es un expert en pages commerciales premium orientees conversion pour l'activite reelle du client.

Ton objectif n'est pas de cr\u00e9er un site joli.
Tu crees une MACHINE A CLIENTS.

Le resultat doit etre :
- clair
- credible
- moderne
- rapide a comprendre
- oriente action

REGLE ABSOLUE :
Le client doit comprendre en moins de 3 secondes :
- ce qui est propos\u00e9
- pour qui
- pourquoi c'est utile

INTERDIT :
- textes generiques
- phrases vides
- jargon inutile
- blocs inutiles
- duplication d'idees
- contenu IA detectable
- markdown
- texte hors JSON
- mention de fournisseur IA ou de modele

OBLIGATOIRE :
- hierarchie visuelle forte
- blocs utiles uniquement
- CTA clairs
- design moderne inspire SaaS premium
- contenu adapte a la niche
- benefices clients avant caracteristiques
- francais naturel, professionnel et vendeur
- aucune repetition visible : si une idee revient, reformule avec un angle concret different ou remplace-la par une preuve, une objection levee ou une etape utile
- si une generation est demandee plusieurs fois sur le meme brief, produire une vraie variation : nouvelle direction de hero, ordre de preuves different, palette coherentement differente et visuels distincts
- aucun prompt utilisateur brut ne doit etre visible dans le site final, meme partiellement

COPYWRITING OBLIGATOIRE :
- AIDA dans la progression du site
- PAS dans les blocs probleme, benefices et CTA
- promesse claire des l'ouverture
- benefices concrets
- CTA directs et credibles
- preuve sociale plausible
- reassurance visible

PROFIL A RESPECTER :
- niche : ${profile.niche}
- positionnement : ${profile.positioning}
- objectif : ${profile.conversionGoal}
- ton : ${profile.tone}
- direction visuelle : ${profile.visualDirection}
- structure dominante : ${profile.layoutType}
- signature design distincte : ${buildDesignArchetypeGuide(profile)}
- angle de preuve : ${profile.proofAngle}

LOGIQUE INTERNE OBLIGATOIRE :
- \u00e9tape 1 : relire l'analyse business et valider audience, douleur, desir, objection, offre principale et niveau de gamme
- \u00e9tape 2 : choisir une promesse non generique qui explique la valeur en moins de 3 secondes
- \u00e9tape 3 : generer le site complet en respectant la niche, la ville et le niveau de gamme
- \u00e9tape 4 : relire chaque etape avec un filtre conversion, credibilite et clarte
- si une section parait faible, la reecrire avant la reponse finale

PLAYBOOK NICHE :
${buildNichePlaybook(profile)}

GUIDE BUILDER PREMIUM :
${buildModernBuilderInspirationGuide()}

GUIDE VARIATION CREATIVE PIXELRISES :
${buildCreativeVariationGuide(form, profile, userVision)}

GUIDE TEMPLATES NICEPAGE DISTILLE :
${buildNicepageTemplateInspirationGuide(form, profile, userVision)}

GUIDE TEMPLATES TEMPLATEMO DISTILLE :
${buildTemplatemoInspirationGuide(form, profile, userVision)}

GUIDE AI BUILDER / PRODUCT UX DISTILLE :
${buildAiBuilderInspirationGuide(form, profile, userVision)}

${buildClientSafeAssetPolicy()}

GARDE-FOU SECTEUR :
${buildSensitiveNicheGuard(profile)}

${buildClientBusinessBoundary(form, profile)}

${buildOutputContract()}

${buildQualityGate()}

Tu reponds uniquement via la fonction generate_site_content.`;

const buildGenerationSystemPrompt = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  blueprint: PromptBlueprint,
  userVision: UserVision,
) => `${buildSharedSystemContract(form, profile, userVision)}

PIPELINE INTERNE OBLIGATOIRE A RESPECTER :
1. relire l'analyse business
2. relire la strategie validee
3. relire le blueprint de prompt valide
4. verifier l'alignement objectif + niche + style + gamme
5. generer le site final
6. relire le site avant reponse

STRATEGIE VALIDEE :
${JSON.stringify(strategy, null, 2)}

BLUEPRINT VALIDE :
${JSON.stringify(blueprint, null, 2)}

${buildPromptEnhancerPixelrises(form, profile, strategy, blueprint, userVision)}

${buildBriefTransformationRules(form, profile)}

${buildPixelrisesConversionBrief(form, profile, strategy)}

MISSION DE CREATION :
0. Tu ne cr\u00e9es pas un simple site vitrine. Tu cr\u00e9es un site business fid\u00e8le \u00e0 la vision utilisateur, enrichi par une strat\u00e9gie de conversion, con\u00e7u pour aider ce business \u00e0 obtenir plus de clients.
0.bis Ne remplace jamais la vision utilisateur par un template g\u00e9n\u00e9rique. Respecte ses choix explicites, puis am\u00e9liore-les pour rendre le site plus clair, plus cr\u00e9dible et plus vendeur.
0.ter Chaque section doit avoir une fonction commerciale claire : comprendre, rassurer, convaincre ou faire passer \u00e0 l'action.
1. Partir du profil business valide en amont, pas d'un template vide.
2. Decider d'un angle de promesse fort, credible et adapte a ${form.businessName}.
3. Composer un site complet non generique avec une structure d'abord pilotee par l'objectif business, puis ajustee a ${profile.niche}.
4. Faire du hero un bloc ultra clair en 3 secondes, avec 2 CTA utiles.
5. Varier la structure, le ton, les CTA et la presentation visuelle pour eviter tout effet template.
6. Definir une direction image premium, avec un hero visuel et trois visuels de soutien coherents.
7. Generer un site qui aide reellement a ${profile.conversionGoal}.
8. Ne garder que les blocs utiles a la conversion et supprimer tout bloc qui ne sert pas le but business.
9. Si une phrase, un service ou un bloc peut convenir a n'importe quelle autre niche, le reecrire jusqu'a ce qu'il devienne specifique.
10. Appliquer cette signature visuelle distincte : ${buildDesignArchetypeGuide(profile)}.
11. Appliquer aussi cette recette de variation : ${buildCreativeVariationGuide(form, profile, userVision)}.
12. Qualite attendue Gemini Pro : copywriting naturel, details metier, structure premium, FAQ utile, SEO local et design exploitable sans retouche obligatoire.`;

const buildImprovementSystemPrompt = (
  form: Required<FormPayload>,
  existingSite: unknown,
  improvementRequest: string,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  blueprint: PromptBlueprint,
  userVision: UserVision,
) => `${buildSharedSystemContract(form, profile, userVision)}

VISION UTILISATEUR A PRESERVER PENDANT L'OPTIMISATION :
${buildUserVisionPromptBlock(userVision)}

STRAT\u00c9GIE VALID\u00c9E :
${JSON.stringify(strategy, null, 2)}

BLUEPRINT VALID\u00c9 :
${JSON.stringify(blueprint, null, 2)}

PROMPT ENHANCER PIXELRISES :
- demande d'optimisation : ${improvementRequest}
- strategie a conserver : ${strategy.promise}
- objectif a renforcer : ${profile.conversionGoal}
- preuves a densifier : ${strategy.proofStyle}
- design a respecter : ${strategy.visualStyle}
- sections prioritaires : ${strategy.prioritySections.join(" -> ")}
- recette creative a conserver/renforcer : ${buildCreativeVariationGuide(form, profile, userVision)}

${buildPixelrisesConversionBrief(form, profile, strategy)}

MISSION D'OPTIMISATION PAYANTE :
Tu am\u00e9liores un site existant d\u00e9j\u00e0 g\u00e9n\u00e9r\u00e9.

PRIORIT\u00c9S D'OPTIMISATION :
- clarifier l'offre
- renforcer la structure de conversion
- am\u00e9liorer la qualit\u00e9 des CTA
- densifier la r\u00e9assurance utile
- renforcer la cr\u00e9dibilit\u00e9 per\u00e7ue
- am\u00e9liorer le SEO local
- rendre le tout plus vendable, pas seulement plus joli

INTERDIT :
- simple reformulation cosm\u00e9tique
- changement gratuit sans gain business
- perte de clart\u00e9
- suppression d'\u00e9l\u00e9ments utiles sans remplacement plus fort

CONTENU EXISTANT :
${JSON.stringify(existingSite)}

DEMANDE PRIORITAIRE :
${improvementRequest}`;

const buildGenerationUserPrompt = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  blueprint: PromptBlueprint,
  userVision: UserVision,
) => `OBJECTIF : Cr\u00e9er le site de l'entreprise d\u00e9crite par le client, optimis\u00e9 pour vendre ses offres, recevoir des demandes ou d\u00e9clencher des r\u00e9servations.

==================================================
DONNEES UTILISATEUR
==================================================
Type d'activite : ${form.businessType}
Client cible : ${form.targetAudience || "non renseigne"}
Ville : ${form.city || "non renseignee"}
Objectif : ${form.objective}
Style : ${form.style}
Niveau de gamme : ${form.positioning}
Services : ${form.services || "non renseignes"}
CTA souhaite : ${form.cta}
Description libre : ${form.description || "non renseignee"}
Directions choisies : ${form.enhancers.length ? form.enhancers.join(" | ") : "aucune direction supplementaire"}
Variation : ${form.regenerate ? "regeneration demandee, proposer une version differente et plus forte que la precedente" : "premiere generation"}
Graine de variation : ${form.variationSeed}

==================================================
VISION UTILISATEUR A RESPECTER AVANT TOUT TEMPLATE
==================================================
${buildUserVisionPromptBlock(userVision)}

REGLE PRIORITAIRE :
${buildClientBusinessBoundary(form, profile)}

${buildBriefTransformationRules(form, profile)}

${buildPixelrisesConversionBrief(form, profile, strategy)}

- La description libre est la source principale si elle contient une activite, une ville, une offre, une cible ou un objectif plus precis que les champs courts.
- Si une ancienne donnee contredit la description libre, suivre la description libre.
- Le resultat doit changer fortement selon ce brief : niche, promesse, services, objections, FAQ, visuels et ordre des sections.
- Le rendu doit suivre cette signature de design : ${buildDesignArchetypeGuide(profile)}.
- Le rendu doit aussi suivre cette recette creative interne : ${buildCreativeVariationGuide(form, profile, userVision)}
- Ne jamais produire une page "activite locale" generale si le brief donne un metier precis.
- Ne jamais recopier la description libre dans la preview : elle sert a comprendre, pas a etre affichee.
- Si le brief mentionne explicitement un metier, une ville ou une cible, chaque grande section doit en tenir compte.

==================================================
MISSION
==================================================
1. Analyser le business : comprendre le marche, identifier le besoin reel, detecter les opportunites, differencier le positionnement.
2. Construire une strategie : angle marketing clair, promesse forte, differenciation reelle, CTA adaptes.
3. Generer un site complet structure.

==================================================
STRUCTURE OBLIGATOIRE
==================================================
1. HERO : promesse claire, resultat client, CTA principal, CTA secondaire, image forte
2. PROBLEME / OPPORTUNITE : douleur client, opportunite business
3. OFFRES / SERVICES : offres claires, comprehensibles, orientees client
4. BENEFICES : resultats concrets, pas de blabla marketing
5. PREUVE SOCIALE : temoignages realistes, credibilite
6. PROCESS : simple, 3 etapes max
7. REASSURANCE : garanties, securite, credibilite
8. FAQ : objections reelles
9. CTA FINAL : clair, simple, direct

==================================================
SEO BUSINESS
==================================================
- heroTitle = un seul H1, jamais plusieurs H1
- integrer le mot-cle principal dans le H1 si c'est naturel
- produire 3 a 5 mots-cles SEO dans metadata.seo_keywords
- injecter la ville dans le H1, les H2 et le contenu si la ville est disponible
- mentionner aussi la zone proche si cela renforce le SEO local
- FAQ reelles qui peuvent capter des recherches Google
- aucun keyword stuffing
- les services et benefices doivent repondre a une intention de recherche claire

==================================================
DESIGN / UX
==================================================
- design moderne / premium
- animations legeres
- structure fluide
- mobile-first
- hierarchie claire
- sections espacees
- pas de surcharge
- design.typography doit decrire les titres et le niveau de lecture
- design.image_style doit guider les visuels metier
- design.spacing_style doit guider l'aeration selon la gamme
- design.button_style doit guider les CTA
- design.card_style doit guider les cartes
- design.section_style doit guider l'alternance des sections

==================================================
IMAGES
==================================================
- images variees
- pas de duplication
- coherentes avec la niche
- style premium
- adaptees au business
- ne pas proposer la meme image mentale pour hero, services et preuve
- chaque visuel doit avoir un role : aspiration, service, preuve, contexte local ou resultat

==================================================
REGLES NICHE HAUTE PRIORITE
==================================================
${buildNicheSpecificQualityRules(form, profile, userVision) || "- aucune regle niche additionnelle."}

==================================================
MATRICE ANTI-TEMPLATE / ANTI-GENERIQUE
==================================================
${buildSiteSpecificityMatrix(form, profile, strategy, userVision)}

==================================================
REGLES STRICTES
==================================================
- pas de texte generique
- pas de repetition
- pas de bloc inutile
- pas de contenu vide
- pas d'indicateur ou d'elements inutiles
- contenu 100% utile

==================================================
ADAPTATION PAR OBJECTIF
==================================================
${buildObjectivePromptRules(profile)}

==================================================
ADAPTATION PAR STYLE
==================================================
${buildStylePromptRules(form.style)}

==================================================
ADAPTATION PAR GAMME
==================================================
${buildPositioningPromptRules(form.positioning)}

==================================================
CONTEXTE VALIDE
==================================================
PROFIL BUSINESS INFERE :
${JSON.stringify(profile, null, 2)}

STRATEGIE VALIDEE :
${JSON.stringify(strategy, null, 2)}

BLUEPRINT VALIDE :
${JSON.stringify(blueprint, null, 2)}

CONTRAINTES D'EXECUTION :
- penser d'abord comme un stratege business, ensuite comme un copywriter, ensuite comme un designer
- renvoyer sectionOrder explicitement avec cette base : ${strategy.prioritySections.join(" -> ")}
- le hero doit expliquer l'offre en moins de 3 secondes
- le hero doit contenir 2 CTA credibles et complementaires
- le hero doit vendre un resultat ou un desir concret, pas juste l'esthetique du site
- la structure doit d'abord suivre l'objectif ${profile.objectiveMode}, puis la niche ${profile.niche}
- chaque etape doit repondre a une vraie question du prospect
- le resultat doit sembler immediatement credible pour cette niche
- chaque etape doit servir la conversion
- les titres doivent etre specifiques et vendables
- les services doivent etre concrets et differencies
- les services doivent suivre cette logique : ${strategy.offerStyle}
- les services doivent etre formules en resultats, pas en categories vagues
- chaque service doit mentionner une action reelle, un usage concret ou un resultat observable
- interdire les formulations abstraites du type solution sur mesure, expertise premium, accompagnement complet si elles ne sont pas precisees
- les benefices doivent etre orientes business, credibilite et passage a l'action
- les benefices doivent rester distincts des services
- les temoignages doivent sembler plausibles
- les temoignages doivent donner une preuve concrete, pas une flatterie vide
- les temoignages doivent contenir un avant/apr\u00e8s, un contexte, ou un effet visible
- la FAQ doit traiter les objections reelles avant achat, devis ou r\u00e9servation
- la reassurance doit suivre cette logique : ${strategy.reassuranceStyle}
- les preuves doivent suivre cette logique : ${strategy.proofStyle}
- la partie local_seo doit integrer la ville si elle existe
- le contenu visible doit parler comme une vraie entreprise de ${form.businessType}, jamais comme un outil de g\u00e9n\u00e9ration
- chaque bloc doit contenir au moins un ancrage concret : cible, ville, service, usage, preuve, objection ou \u00e9tape
- les visuels doivent raconter le m\u00e9tier : hero d'aspiration, services en action, preuve ou ambiance, contexte local
- si le brief est court, produire une one-page business premium compl\u00e8te et utile, pas une page g\u00e9n\u00e9rique
- si le brief est pr\u00e9cis, respecter sa demande m\u00e9tier avant toute inspiration de template
- le resultat doit parler clairement a : ${profile.targetAudience}
- le design doit refleter : ${profile.visualDirection}
- le layout doit suggerer : ${profile.layoutType}
- design.layout_type doit conserver la signature : ${profile.designArchetype}
- design.layout_type doit aussi contenir la recette creative choisie pour aider la preview a varier le rendu
- la composition doit etre differente d'une page standard : appliquer ${buildDesignArchetypeGuide(profile)}
- appliquer la recette de variation : ${buildCreativeVariationGuide(form, profile, userVision)}
- le ton doit rester : ${profile.tone}
- utiliser la douleur principale : ${profile.audiencePains.join(", ") || "clarifier l'offre"}
- utiliser les desirs principaux : ${profile.audienceDesires.join(", ") || "comprendre vite la valeur"}
- lever les objections : ${profile.objections.join(", ") || "est-ce credible, est-ce pour moi, quelle est la prochaine \u00e9tape"}
- integrer des signaux de preuve adaptes : ${profile.proofAssets.join(", ") || profile.proofAngle}
- utiliser des mots-cles SEO utiles : ${profile.seoKeywords.join(", ") || profile.niche}
- respecter strictement la promesse : ${strategy.promise}
- respecter l'angle marketing : ${strategy.marketingAngle}
- suivre la hierarchie : ${strategy.siteHierarchy.join(" -> ")}
- sections autorisees uniquement : ${strategy.allowedSections.join(", ")}
- intensite CTA attendue : ${strategy.ctaIntensity}
- construire une narration claire : promesse -> probleme -> offre -> preuves -> methode -> reassurance -> FAQ -> CTA final
- n'utiliser que des blocs utiles, eviter : ${strategy.avoidSections.join(", ") || "aucune section gadget"}
- le resultat doit pouvoir aider cette activite a vendre, rassurer ou obtenir plus de demandes sans retouche obligatoire
- chaque titre doit porter une promesse, une preuve ou une action claire
- si deux services ou deux benefices se ressemblent trop, les differencier ou en supprimer un
- la FAQ doit lever les objections tarif, delai, confiance ou pertinence metier avant d'ajouter des questions secondaires
- si une phrase peut convenir a n'importe quel business, la reecrire jusqu'a ce qu'elle devienne specifique
- avant de repondre, relire le JSON comme un directeur artistique, un copywriter et un consultant SEO local : corriger les faiblesses avant l'envoi`;

const isLocalDevelopmentRequest = (req: Request) => {
  const host = req.headers.get("host") || "";
  return /localhost|127\.0\.0\.1|\[::1\]/i.test(host);
};

const buildPromptSimulationPayload = (form: Required<FormPayload>) => {
  const heuristicProfile = inferBusinessProfile(form);
  const preliminaryUserVision = buildUserVision(form, heuristicProfile);
  const profile = applyUserVisionToProfile(
    form,
    heuristicProfile,
    preliminaryUserVision,
  );
  const userVision = buildUserVision(form, profile);
  const finalProfile = applyUserVisionToProfile(form, profile, userVision);
  const strategy = applyUserVisionToStrategy(
    form,
    buildFallbackStrategy(finalProfile),
    userVision,
  );
  const blueprint = reinforcePromptBlueprint(
    form,
    finalProfile,
    strategy,
    buildFallbackPromptBlueprint(finalProfile, strategy),
  );
  const systemPrompt = buildGenerationSystemPrompt(
    form,
    finalProfile,
    strategy,
    blueprint,
    userVision,
  );
  const userPrompt = buildGenerationUserPrompt(
    form,
    finalProfile,
    strategy,
    blueprint,
    userVision,
  );
  const variationPrompt = `VARIATION CREATIVE UNIQUE : ${form.variationSeed}

Objectif de variation :
- Ne pas recycler une structure ou une formulation identique a une generation precedente.
- Adapter vraiment les titres, services, benefices, FAQ et visuels au brief prioritaire.
- Si le prompt mentionne un metier precis, le hero doit nommer ce metier et ne jamais rester generique.`;

  return {
    debugPromptOnly: true,
    model: SITE_GENERATION_MODEL,
    fallbackModels: [
      SITE_GENERATION_FALLBACK_MODEL,
      SITE_GENERATION_STABLE_FALLBACK_MODEL,
      SITE_GENERATION_FAST_FALLBACK_MODEL,
      SITE_GENERATION_LIGHT_FALLBACK_MODEL,
    ],
    userVision,
    enhancers: form.enhancers,
    requiredSignals: userVision.prioritySignals,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
      { role: "user", content: variationPrompt },
    ],
    promptPreview: [systemPrompt, userPrompt, variationPrompt].join("\n\n---\n\n"),
  };
};

const buildImprovementUserPrompt = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  existingContent: unknown,
  strategy: GenerationStrategy,
  blueprint: PromptBlueprint,
) => `Optimise cette offre business premium existant en fran\u00e7ais.

BRIEF BUSINESS :
- Nom : ${form.businessName}
- Activit\u00e9 : ${form.businessType}
- Ville : ${form.city || "non renseign\u00e9e"}
- Client cible : ${form.targetAudience || "non renseign\u00e9"}
- Services : ${form.services || "non renseign\u00e9s"}
- Objectif : ${form.objective}
- CTA principal souhait\u00e9 : ${form.cta}
- Niveau de gamme : ${form.positioning || "non renseign\u00e9"}
- Style souhait\u00e9 : ${form.style}
- Couleurs / ambiance : ${form.colors}
- Description libre : ${form.description || "non renseign\u00e9e"}

PROFIL BUSINESS INF\u00c9R\u00c9 :
${JSON.stringify(profile, null, 2)}

STRAT\u00c9GIE VALID\u00c9E :
${JSON.stringify(strategy, null, 2)}

BLUEPRINT VALID\u00c9 :
${JSON.stringify(blueprint, null, 2)}

CONTENU ACTUEL \u00c0 AM\u00c9LIORER :
${JSON.stringify(existingContent)}

DEMANDE D'AM\u00c9LIORATION PRIORITAIRE :
${form.improvementPrompt}

R\u00c9SULTAT ATTENDU :
- une nouvelle version plus claire, plus forte et plus vendable
- une vraie am\u00e9lioration de structure, copywriting, r\u00e9assurance et conversion
- pas une simple reformulation superficielle`;

const FORBIDDEN_VISIBLE_PATTERNS = [
  /lorem ipsum/i,
  /\bnous sommes les meilleurs\b/i,
  /\bopenai\b/i,
  /\bgemini\b/i,
  /\bnicepage\b/i,
  /\btemplatemo\b/i,
  /\b21st(?:\.dev)?\b/i,
  /\bmobbin\b/i,
  /\blovable\b/i,
  /\bv0\b/i,
  /\bbase44\b/i,
  /\bdelos\b/i,
  /\bvercel\b/i,
  /\btemplate source\b/i,
  /\bsource template\b/i,
  /\btemplate signal\b/i,
  /\bclaude\b/i,
  /\bmistral\b/i,
  /\bgoogle ai studio\b/i,
  /\bvertex\b/i,
  /\bgpt-[0-9a-z.]*\b/i,
  /\bindicateur\b/i,
  /\bscore qualite\b/i,
  /\bscore qualite\b/i,
  /\banalyse interne\b/i,
  /\bprompt enhancer\b/i,
  /\bquality gate\b/i,
  /\bdebugprompt\b/i,
  /\bvision client prioritaire\b/i,
  /\bvision utilisateur prioritaire\b/i,
  /\bchoix visuels explicites\b/i,
  /\brecette creative\b/i,
  /\bdebug\b/i,
  /\b100\s*%\s*s[u?]r\b/i,
  /\bsans risque\b/i,
  /\bdevenez riche\b/i,
  /\bargent facile\b/i,
];

const INTERNAL_DESIGN_NOTE_PATTERNS = [
  /\s*(?:\||;|-)\s*vision client prioritaire\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*vision utilisateur prioritaire\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*vision client\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*direction demandee\s*:\s*.*$/i,
  /\s*(?:\||;|-|\.)\s*direction visuelle client\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*respecter la direction demandee\s*:\s*.*$/i,
  /\s*(?:\||;|-|;)\s*respecter la direction visuelle client\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*choix visuels explicites\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*respecter les choix visuels explicites\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*visuels alignes avec la vision client\s*:\s*.*$/i,
  /\s*(?:\||;|-)\s*recette creative\s*:\s*.*$/i,
  /\s*(?:\||;|-|,)\s*activite exacte\s*:\s*.*$/i,
  /\s*(?:\||;|-|,)\s*ville\s*:\s*.*$/i,
  /\s*(?:\||;|-|,)\s*cible\s*:\s*.*$/i,
  /\s*(?:\||;|-|,)\s*cta\s*:\s*.*$/i,
  /\s*(?:\||;|-|,)\s*palette\s*:\s*.*$/i,
  /\s*(?:\||;|-|,)\s*objectif\s*:\s*.*$/i,
  /\s*(?:\||;|-|,)\s*services\/offres\s*:\s*.*$/i,
  /^\s*vision client\s*:\s*.*$/i,
  /^\s*vision client prioritaire\s*:\s*.*$/i,
  /^\s*direction demandee\s*:\s*.*$/i,
  /^\s*direction visuelle client\s*:\s*.*$/i,
  /^\s*activite exacte\s*:\s*.*$/i,
];

const stripInternalDesignNotes = (value: string) =>
  INTERNAL_DESIGN_NOTE_PATTERNS.reduce((text, pattern) => text.replace(pattern, ""), normalizeText(value, "")).trim();

const META_CONVERSION_LEAKAGE_PATTERNS = [
  /\bpasser de l['?]?\s*interet au rendez[ -]vous\b/i,
  /\bdu simple interet au\b/i,
  /\btransformer l['?]?\s*interet en\b/i,
  /\bconvertir (les )?visiteurs\b/i,
  /\bgenerer des leads\b/i,
  /\bgenerer des demandes\b/i,
  /\bconversion\b/i,
  /\bentonnoir\b/i,
  /\btunnel client\b/i,
  /\bobjections\b/i,
  /\bpreuves? sociales?\b/i,
];

const WEAK_CTA_PATTERNS = [
  /^en savoir plus$/i,
  /^voir plus$/i,
  /^decouvrir$/i,
  /^d\u00e9couvrir$/i,
  /^cliquez ici$/i,
  /^learn more$/i,
];

const GENERIC_VISIBLE_PATTERNS = [
  /\bpresence premium\b/i,
  /\bpresence web moderne\b/i,
  /\bpresence web moderne\b/i,
  /\bboostez votre activite\b/i,
  /\bboostez votre activite\b/i,
  /\bsolution adaptee a vos besoins\b/i,
  /\bsolution adaptee ?\s+vos besoins\b/i,
  /\bun site professionnel pour votre activite\b/i,
  /\bun site professionnel pour votre activite\b/i,
  /\bpasser a l action\b/i,
  /\bsans friction\b/i,
  /\boffre claire\b/i,
  /\bplus clair\b/i,
  /\bplus rassurant\b/i,
  /\bplus credible\b/i,
  /\brendu premium\b/i,
  /\bstructure pensee\b/i,
  /\bdonne confiance\b/i,
  /\bimage de marque\b/i,
  /\bresultat vendable\b/i,
  /\bactivite locale\b/i,
  /\bactivite locale\b/i,
  /\bmessage clair\b/i,
  /\bsite credible\b/i,
  /\bsite credible\b/i,
  /\brendu premium\b/i,
  /\boffre pensee pour\b/i,
  /\boffre pensee pour\b/i,
  /\bsolution complete\b/i,
  /\bsolution complete\b/i,
  /\bpasser de l['’]?interet\b/i,
  /\bpasser de l['’]?interet\b/i,
  /\bpasser de l\s+interet\b/i,
  /\bpasser de l\s+interet\b/i,
  /\btransformer l['’]?interet\b/i,
  /\btransformer l['’]?interet\b/i,
  /\btransformer l\s+interet\b/i,
  /\btransformer l\s+interet\b/i,
  /\binformation claire et utile\b/i,
  /\bpreuve lisible\b/i,
  /\bparcours pense\b/i,
  /\bparcours pense\b/i,
  /\bprochaine etape claire\b/i,
  /\bprochaine etape claire\b/i,
  /\bcomprendre la valeur\b/i,
  /\bacheter plus sereinement\b/i,
  /\bchoisir plus sereinement\b/i,
  /\bvotre [^,.!?]{2,32}, votre [^,.!?]{2,32}\b/i,
  /\bvotre [^,.!?]{2,32}, notre [^,.!?]{2,32}\b/i,
  /\bimmortalisez votre style unique\b/i,
  /\bphotographe qui vous comprend\b/i,
  /\bvotre serenite notre priorite\b/i,
  /\bvotre moment votre style\b/i,
  /\bpret(?:e)? a capturer votre vibe\b/i,
  /\bpret e a capturer votre vibe\b/i,
];

const WEAK_SERVICE_NAME_PATTERNS = [
  /^accompagnement$/i,
  /^solution$/i,
  /^offre$/i,
  /^offre premium$/i,
  /^offre sur mesure$/i,
  /^service$/i,
  /^service [0-9]+$/i,
  /^strategie$/i,
  /^expertise$/i,
  /^style\s+[a-z0-9\s/-]+$/i,
  /\b(style|palette|couleur|couleurs)\b.*\b(rose|violet|noir|dore|bleu|vert|rouge|orange|neon)\b/i,
  /\b(rose|violet|noir|dore|bleu|vert|rouge|orange|neon)\b.*\b(style|palette|couleur|couleurs)\b/i,
  /\b(objectif|cta|conversion|lead|leads|brief|prompt)\b/i,
  /\bdiagnostic clair du besoin\b/i,
  /\bmise en place guidee\b/i,
  /\bsuivi concret des resultats\b/i,
  /\b[a-z0-9 ]+\s+oriente(?:e)?\s+[a-z0-9 ]+\b/i,
  /\boriente(?:e)?\s+(attirer|prendre|vendre|generer|renforcer|reservation|lead|client|rendez vous|table)\b/i,
  /\bprise de rendez vous pour une seance photo\b/i,
  /\bphotographe\s+oriente(?:e)?\b/i,
  /\brestaurant\s+oriente(?:e)?\b/i,
  /\bcoach\s+oriente(?:e)?\b/i,
  /\bagence\s+oriente(?:e)?\b/i,
  /\bclients prets a passer a l action\b/i,
];

const DIRECTORY_STYLE_HERO_PATTERNS = [
  /^[a-z0-9\s'&.-]+\s+a\s+[a-z0-9\s'-]+\s*[-:]\s*[a-z0-9\s'&.-]+$/i,
  /^(restaurant|coach|photographe|agence immobiliere|service local|formation|institut de beaute)\s+a\s+[a-z0-9\s'-]+$/i,
  /^[a-z0-9\s'&.-]+\s*[-:]\s*(restaurant|coach|photographe|agence immobiliere|service local|formation|institut de beaute)$/i,
];

const isDirectoryStyleHeroTitle = (
  title: string,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const key = normalizeKey(title);
  const rawTitle = normalizeText(title);
  const brand = normalizeKey(form.businessName);
  const city = normalizeKey(form.city);
  const business = normalizeKey(form.businessType);
  const niche = normalizeKey(profile.niche);
  const wordCount = key.split(/\s+/).filter(Boolean).length;

  if (DIRECTORY_STYLE_HERO_PATTERNS.some((pattern) => pattern.test(rawTitle))) return true;

  if (brand && city && key.startsWith(`${brand} a ${city}`) && wordCount <= 8) {
    return Boolean(
      (business && key.includes(business.split(" ")[0])) ||
        (niche && key.includes(niche.split(" ")[0])),
    );
  }

  if (business && city && key === `${business} a ${city}`) return true;
  if (business && city && key === `${business} ${city}`) return true;

  return false;
};

const GENERIC_OFFICE_VISUAL_URL_MARKERS = [
  "photo-1497366754035",
  "photo-1497366811353",
  "photo-1516321318423",
  "photo-1552664730",
  "photo-1556761175",
  "photo-1557804506",
  "photo-1520607162513",
];

const VISUAL_REQUIRED_MARKERS_BY_NICHE: Record<string, string[]> = {
  restaurant: ["restaurant", "plat", "cuisine", "chef", "salle", "table", "menu", "gastronomie", "brasserie"],
  coach: ["coach", "sport", "fitness", "entrainement", "seance", "mouvement", "salle de sport", "progression"],
  immobilier: ["immobilier", "maison", "appartement", "bien", "interieur", "visite", "estimation", "agence"],
  "car-rental": ["voiture", "vehicule", "route", "cles", "location", "reservation", "parking", "trajet"],
  beauty: ["beaute", "soin", "visage", "spa", "institut", "coiffure", "onglerie", "peau"],
  "creative-services": ["photo", "photographe", "shooting", "portrait", "appareil", "studio", "galerie", "retouche"],
};

const VISUAL_FORBIDDEN_MARKERS_BY_NICHE: Record<string, string[]> = {
  restaurant: ["bureau", "office", "coworking", "meeting", "tableau blanc", "post it", "laptop", "startup"],
  coach: ["bureau", "office", "coworking", "meeting", "tableau blanc", "post it", "laptop", "restaurant"],
  immobilier: ["coworking", "tableau blanc", "post it", "laptop close up", "restaurant", "salle de sport"],
  "car-rental": ["restaurant", "cuisine", "coworking", "tableau blanc", "post it", "laptop"],
  beauty: ["bureau", "coworking", "tableau blanc", "post it", "voiture", "chantier"],
  "creative-services": ["coworking", "tableau blanc", "post it", "meeting", "startup", "laptop close up"],
};

const getNicheVisualQualityIssue = (
  visualPrompts: string[],
  visualUrls: string[],
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const niche = canonicalizeNiche(profile.niche, pickNiche(form), form);
  const required = VISUAL_REQUIRED_MARKERS_BY_NICHE[niche] || [];
  if (!required.length) return "";

  const forbidden = VISUAL_FORBIDDEN_MARKERS_BY_NICHE[niche] || [];
  const promptBlock = normalizeKey(visualPrompts.join(" "));
  const urlBlock = visualUrls.join(" ").toLowerCase();
  const hasRequiredPrompt = required.some((marker) => promptBlock.includes(normalizeKey(marker)));
  const hasForbiddenPrompt = forbidden.some((marker) => promptBlock.includes(normalizeKey(marker)));
  const hasGenericOfficeFallbackUrl = GENERIC_OFFICE_VISUAL_URL_MARKERS.some((marker) => urlBlock.includes(marker));

  if (hasGenericOfficeFallbackUrl && niche !== "education-training" && niche !== "saas-tech") {
    return "Le moteur Pixelrises a choisi des images bureau generiques au lieu de visuels metier.";
  }

  if (hasForbiddenPrompt && !hasRequiredPrompt) {
    return "Le moteur Pixelrises a propose des visuels hors metier pour cette niche.";
  }

  if (!hasRequiredPrompt && !visualUrls.some((url) => url.startsWith("data:image/"))) {
    return "Le moteur Pixelrises n'a pas assez relie les visuels au metier reel.";
  }

  return "";
};

const PROMPT_FIELD_VISIBLE_LEAK_PATTERNS = [
  /^\s*(style|couleurs?|palette|objectif|cta|brief|prompt|gamme|positionnement|cible|ville)\s*[:/-]/i,
  /\b(style|couleurs?|palette|objectif|cta|brief|prompt|gamme|positionnement)\s+(moderne|premium|accessible|professionnel|minimaliste|dynamique|elegant|rose|violet|noir|dore|rouge|bleu|vert)\b/i,
  /\b(mode simple|mode avance|ameliorer le brief|ameliorer le rendu|directions choisies)\b/i,
  /\b(client cible|niveau de gamme|objectif business|description libre|services a mettre en avant)\b/i,
  /\b(generer des leads|renforcer la conversion|structure de conversion|parcours client efficace)\b/i,
];

const collectContentStrings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectContentStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectContentStrings);
  }
  return [];
};

const collectVisibleContentStrings = (content: GeneratedContent): string[] =>
  [
    content.heroTitle,
    content.heroSubtitle,
    content.heroEyebrow,
    content.heroPromise,
    content.heroSecondaryCta,
    ...content.trustBadges,
    content.servicesTitle,
    content.servicesSubtitle,
    ...content.services.flatMap((item) => [item.name, item.description]),
    content.benefitsTitle,
    ...content.benefits.flatMap((item) => [item.title, item.description]),
    ...content.testimonials.flatMap((item) => [item.name, item.role, item.text]),
    content.ctaTitle,
    content.ctaSubtitle,
    content.ctaButton,
    ...content.processSteps.flatMap((item) => [item.step, item.title, item.description]),
    ...content.faqItems.flatMap((item) => [item.question, item.answer]),
    content.footerTagline,
    ...content.statsItems.flatMap((item) => [item.value, item.label]),
    content.problemTitle,
    content.problemContent,
    content.reassuranceTitle,
    content.reassuranceContent,
    ...content.reassuranceItems,
    content.localSeoTitle,
    content.localSeoContent,
    ...content.localSeoItems,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean);

const countPatternHits = (strings: string[], patterns: RegExp[]) =>
  strings.reduce(
    (count, entry) => count + patterns.filter((pattern) => pattern.test(normalizeKey(entry))).length,
    0,
  );

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const includesAnyKey = (value: string, needles: string[]) => {
  const key = normalizeKey(value);
  return needles.some((needle) => key.includes(normalizeKey(needle)));
};

const isPhotographyBusiness = (form: Required<FormPayload>) =>
  /\b(photographe|photographie|photo|shooting|portrait|mariage|studio photo|reportage photo|seance photo)\b/.test(
    normalizeKey(`${form.businessType} ${form.services} ${form.description}`),
  );

const isCarRentalBusiness = (form: Required<FormPayload>) =>
  /\b(location de voiture|location voiture|voiture de location|vehicule de location|loueur auto|rent car|car rental|utilitaire)\b/.test(
    normalizeKey(`${form.businessType} ${form.services} ${form.description}`),
  );

const PHOTOGRAPHY_VISUAL_REQUIRED_PATTERNS = [
  /\b(photo|photographe|photographie|camera|appareil|objectif|portrait|shooting|seance|studio|lumiere|retouche|galerie|portfolio|reportage|mariage|couple|modele|client)\b/,
];

const PHOTOGRAPHY_VISUAL_FORBIDDEN_PATTERNS = [
  /\b(open space|coworking|bureau|office|meeting|reunion|conference|salle de reunion|whiteboard|tableau blanc|post it|sticky notes|laptop|ordinateur portable|startup|workshop|atelier business|tableau kanban)\b/,
];

const PHOTOGRAPHY_META_SERVICE_PATTERNS = [
  /\b(style|palette|couleur|couleurs)\b/,
  /\b(objectif|cta|brief|prompt|lead|conversion)\b/,
  /\bprise de rendez vous pour une seance photo\b/,
  /\bphotographe\s+oriente(?:e)?\b/,
  /\bclients prets a passer a l action\b/,
];

const isPhotographyVisualPromptWeak = (value: string) => {
  const key = normalizeKey(value);
  if (!key) return true;
  if (PHOTOGRAPHY_VISUAL_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(key))) return true;
  return !PHOTOGRAPHY_VISUAL_REQUIRED_PATTERNS.some((pattern) => pattern.test(key));
};

const isPhotographyServiceNameWeak = (value: string) => {
  const key = normalizeKey(value);
  if (!key) return true;
  if (PHOTOGRAPHY_META_SERVICE_PATTERNS.some((pattern) => pattern.test(key))) return true;
  return /\bphotographe\s+(paris|lyon|marseille|lille|bordeaux|toulouse|nice|nantes)\b/.test(key);
};

const getRepeatedSectionTitles = (content: GeneratedContent) => {
  const titleEntries = [
    content.problemTitle,
    content.servicesTitle,
    content.benefitsTitle,
    content.reassuranceTitle,
    content.localSeoTitle,
    content.ctaTitle,
  ]
    .map((value) => normalizeKey(value))
    .filter((value) => value.length >= 12);
  return titleEntries.filter((entry, index) => titleEntries.indexOf(entry) !== index);
};

const isVehicleBookingCta = (value: string) =>
  /\b(reserver|reservation|louer|location|choisir)\b.*\b(voiture|vehicule|auto|utilitaire)\b|\b(reserver une voiture|louer une voiture|location voiture)\b/.test(
    normalizeKey(value),
  );

const isGenericDefaultCta = (value: string) =>
  /^(prendre rendez vous|demander un devis|prendre contact|contacter|reserver|reservation|reserver maintenant|en savoir plus|voir les offres)$/i.test(
    normalizeKey(value),
  );

const buildContextualCta = (form: Required<FormPayload>) => {
  const sourceKey = normalizeKey(
    `${form.businessType} ${form.services} ${form.description} ${form.objective} ${form.targetAudience}`,
  );

  if (isPhotographyBusiness(form)) {
    if (/\b(mariage|evenement|reportage|entreprise|corporate)\b/.test(sourceKey)) {
      return "Demander un devis photo";
    }
    return "R\u00e9server une s\u00e9ance";
  }

  if (isCarRentalBusiness(form)) return "R\u00e9server une voiture";
  if (/\brestaurant|brasserie|pizzeria|traiteur|cafe\b/.test(sourceKey)) return "R\u00e9server une table";
  if (/\bcoach|coaching|fitness|sportif|yoga|pilates\b/.test(sourceKey)) return "R\u00e9server un bilan";
  if (/\bimmobilier|agence immobiliere|estimation\b/.test(sourceKey)) return "Demander une estimation";
  if (/\bbeaute|coiffeur|barbier|spa|esthetique|onglerie\b/.test(sourceKey)) return "Prendre rendez-vous";
  if (/\bdevis|lead|prospect|contact|artisan|plombier|electricien|serrurier\b/.test(sourceKey)) return "Demander un devis";

  return normalizeText(form.cta, "Demander un devis");
};

const resolveContextualCta = (form: Required<FormPayload>) => {
  const currentCta = normalizeText(form.cta, "Demander un devis");

  if (isVehicleBookingCta(currentCta) && !isCarRentalBusiness(form)) {
    return buildContextualCta(form);
  }

  if (
    isPhotographyBusiness(form) &&
    (/\b(voiture|vehicule|auto|utilitaire)\b/.test(normalizeKey(currentCta)) || isGenericDefaultCta(currentCta))
  ) {
    return buildContextualCta(form);
  }

  return currentCta;
};

const uniqueMatches = (source: string, candidates: Array<{ label: string; patterns: RegExp[] }>) =>
  unique(
    candidates
      .filter((candidate) => candidate.patterns.some((pattern) => pattern.test(source)))
      .map((candidate) => candidate.label),
  );

const USER_VISION_COLORS: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "noir", patterns: [/\bnoir\b/i, /\bblack\b/i] },
  { label: "dore", patterns: [/\bdore\b/i, /\bdoree\b/i, /\bdor?\b/i, /\bdor?e\b/i, /\bor\b/i, /\bgold\b/i] },
  { label: "rose", patterns: [/\brose\b/i, /\bpink\b/i] },
  { label: "violet", patterns: [/\bviolet\b/i, /\bpurple\b/i, /\blavande\b/i, /\blilac\b/i] },
  { label: "bleu", patterns: [/\bbleu\b/i, /\bblue\b/i] },
  { label: "vert", patterns: [/\bvert\b/i, /\bgreen\b/i] },
  { label: "rouge", patterns: [/\brouge\b/i, /\bred\b/i] },
  { label: "orange", patterns: [/\borange\b/i, /\bambre\b/i, /\bamber\b/i] },
  { label: "blanc", patterns: [/\bblanc\b/i, /\bwhite\b/i] },
  { label: "pastel", patterns: [/\bpastel\b/i] },
  { label: "neon", patterns: [/\bneon\b/i, /\bneon\b/i] },
];

const USER_VISION_AMBIANCES: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "TikTok / social", patterns: [/\btiktok\b/i, /\btik tok\b/i, /\br[?e]seaux sociaux\b/i, /\bsocial\b/i] },
  { label: "jeune", patterns: [/\bjeune\b/i, /\bgen z\b/i, /\bgenz\b/i, /\burbain\b/i] },
  { label: "luxe", patterns: [/\bluxe\b/i, /\bluxueux\b/i, /\bhaut de gamme\b/i] },
  { label: "sportif", patterns: [/\bsportif\b/i, /\bsport\b/i, /\bperformance\b/i] },
  { label: "data", patterns: [/\bdata\b/i, /\banalyse\b/i, /\btableau\b/i, /\bstatistique\b/i] },
  { label: "communautaire", patterns: [/\bcommunaut[e?]\b/i, /\bclub\b/i, /\babonn[e?]s\b/i] },
  { label: "minimaliste", patterns: [/\bminimaliste\b/i, /\bsobre\b/i, /\bepure\b/i, /\b[?e]pur[?e]\b/i] },
  { label: "premium", patterns: [/\bpremium\b/i, /\b[?e]l[?e]gant\b/i, /\braffin[e?]\b/i] },
  { label: "dynamique", patterns: [/\bdynamique\b/i, /\b[?e]nergique\b/i, /\bimpactant\b/i] },
];

const USER_VISION_AVOID_PATTERNS = [
  /\bne\s+pas\s+(.{3,80})/gi,
  /\bsans\s+(.{3,80})/gi,
  /\b[?e]vite(?:r)?\s+(.{3,80})/gi,
  /\bpas\s+de\s+(.{3,80})/gi,
];

const extractUserVisionAvoidTerms = (source: string) =>
  unique(
    USER_VISION_AVOID_PATTERNS.flatMap((pattern) => {
      const matches: string[] = [];
      let match: RegExpExecArray | null;
      const regexp = new RegExp(pattern.source, pattern.flags);

      while ((match = regexp.exec(source)) !== null) {
        matches.push(normalizeText(match[1]).slice(0, 90));
      }

      return matches;
    }),
  ).slice(0, 5);

const buildUserVision = (form: Required<FormPayload>, profile: BusinessProfile): UserVision => {
  const originalBrief = normalizeText(
    [
      form.businessName,
      form.businessType,
      form.city,
      form.targetAudience,
      form.objective,
      form.style,
      form.positioning,
      form.colors,
      form.services,
      form.cta,
      form.description,
    ].join(" "),
  );
  const source = `${form.businessName} ${form.businessType} ${form.city} ${form.targetAudience} ${form.objective} ${form.positioning} ${form.colors} ${form.style} ${form.cta} ${form.description} ${form.services}`;
  const serviceList = getCleanServiceList(form.services).slice(0, 8);
  const specificIdeas = unique(
    [
      ...form.description
        .split(/[.!?\n]/)
        .map((entry) => normalizeText(entry))
        .filter((entry) => entry.length >= 18 && entry.length <= 140),
    ],
  ).slice(0, 8);
  const visualReferences = uniqueMatches(source, [
    { label: "TikTok / social", patterns: [/\btiktok\b|\btik tok\b|\br[?e]seaux sociaux\b|\bsocial\b/i] },
    { label: "WhatsApp / message direct", patterns: [/\bwhatsapp\b|\bmessage\b|\bdm\b/i] },
    { label: "mobile-first", patterns: [/\bmobile\b|\bsmartphone\b|\bapp\b/i] },
    { label: "portfolio / galerie", patterns: [/\bportfolio\b|\bgalerie\b|\bvisuel\b|\bshooting\b/i] },
    { label: "luxe / premium", patterns: [/\bluxe\b|\bpremium\b|\bhaut de gamme\b|\bprestige\b/i] },
    { label: "jeune / dynamique", patterns: [/\bjeune\b|\bdynamique\b|\bgen z\b|\bmoderne\b/i] },
  ]).slice(0, 6);
  const explicitColors = unique([
    ...uniqueMatches(source, USER_VISION_COLORS),
    normalizeKey(form.colors) && !/auto|aucune|none/.test(normalizeKey(form.colors)) ? form.colors : "",
  ]).slice(0, 6);
  const explicitAmbiance = uniqueMatches(source, USER_VISION_AMBIANCES).slice(0, 6);
  const explicitStyleTerms = unique([
    form.style,
    ...explicitAmbiance,
    profile.designArchetype,
  ]).filter(Boolean).slice(0, 6);
  const sourceKey = normalizeKey(source);
  const wantsWhatsapp = /\bwhatsapp\b|\bwa\b|\bmessage\b|\bdm\b/.test(sourceKey);
  const explicitChannel = wantsWhatsapp ? "WhatsApp" : "";
  const explicitCta = wantsWhatsapp && !includesAnyKey(form.cta, ["whatsapp"])
    ? "Contacter sur WhatsApp"
    : resolveContextualCta(form);
  const explicitConstraints = unique([
    wantsWhatsapp ? "CTA et contact WhatsApp visibles" : "",
    explicitColors.length ? `couleurs explicites : ${explicitColors.join(", ")}` : "",
    explicitAmbiance.length ? `ambiance explicite : ${explicitAmbiance.join(", ")}` : "",
    form.description.length > 40 ? "respecter les details du brief libre avant les heuristiques metier" : "",
  ]).slice(0, 8);
  const missingHints = unique([
    form.city ? "" : "ville non renseignee",
    form.targetAudience ? "" : "cible non renseignee",
    getCleanServiceList(form.services).length ? "" : "services non detailles",
  ]);
  const mustRespect = unique([
    form.businessType ? `activite exacte : ${form.businessType}` : "",
    form.city ? `ville : ${form.city}` : "",
    form.targetAudience ? `cible : ${form.targetAudience}` : "",
    explicitCta ? `CTA : ${explicitCta}` : "",
    explicitChannel ? `canal : ${explicitChannel}` : "",
    explicitColors.length ? `palette : ${explicitColors.join(" + ")}` : "",
    explicitAmbiance.length ? `ambiance : ${explicitAmbiance.join(" + ")}` : "",
    form.objective ? `objectif : ${form.objective}` : "",
    serviceList.length ? `services/offres : ${serviceList.join(" + ")}` : "",
    visualReferences.length ? `references visuelles : ${visualReferences.join(" + ")}` : "",
  ]);
  const prioritySignals = unique([
    ...mustRespect,
    ...explicitConstraints,
    ...specificIdeas,
    ...visualReferences,
  ]).slice(0, 14);

  return {
    originalBrief,
    businessType: form.businessType,
    niche: profile.niche,
    targetAudience: form.targetAudience || profile.targetAudience,
    city: form.city,
    zone: form.city ? `${form.city} et alentours` : "",
    mainGoal: form.objective || profile.conversionGoal,
    desiredStyle: form.style || profile.visualDirection,
    desiredColors: explicitColors,
    desiredMood: explicitAmbiance,
    priceLevel: form.positioning || profile.positioning,
    services: serviceList,
    offers: unique([profile.offer, ...serviceList]).filter(Boolean).slice(0, 8),
    desiredCTA: explicitCta,
    whatsappRequested: wantsWhatsapp,
    specificIdeas,
    visualReferences,
    conversionIntent: profile.conversionGoal,
    prioritySignals,
    priority: mustRespect.length
      ? mustRespect.join(" | ")
      : "respecter l'activite, l'objectif et le CTA avant toute inspiration de template",
    explicitColors,
    explicitAmbiance,
    explicitStyleTerms,
    explicitCta,
    explicitChannel,
    explicitCity: form.city,
    explicitTarget: form.targetAudience,
    explicitConstraints,
    avoidTerms: extractUserVisionAvoidTerms(source),
    mustRespect,
    missingHints,
    hasStrongVisualDirection: explicitColors.length > 0 || explicitAmbiance.length > 0 || form.style.length > 0,
    hasStrongConversionDirection: Boolean(explicitCta || explicitChannel || form.objective),
  };
};

const buildUserVisionPromptBlock = (userVision: UserVision) => `VISION UTILISATEUR PRIORITAIRE :
- brief original condense : ${userVision.originalBrief || "non renseigne"}
- priorite : ${userVision.priority}
- activite exacte : ${userVision.businessType || "a deduire prudemment"}
- niche detectee : ${userVision.niche || "general-business"}
- cible : ${userVision.targetAudience || "a deduire prudemment"}
- ville / zone : ${userVision.city || "non renseignee"}${userVision.zone ? ` / ${userVision.zone}` : ""}
- objectif principal : ${userVision.mainGoal || "conversion"}
- niveau de gamme : ${userVision.priceLevel || "professionnel"}
- couleurs explicites : ${userVision.explicitColors.length ? userVision.explicitColors.join(", ") : "aucune couleur explicite"}
- ambiance explicite : ${userVision.explicitAmbiance.length ? userVision.explicitAmbiance.join(", ") : "aucune ambiance explicite"}
- style explicite : ${userVision.explicitStyleTerms.length ? userVision.explicitStyleTerms.join(", ") : "style deduit du formulaire"}
- CTA explicite : ${userVision.explicitCta || "deduire le CTA le plus coherent"}
- canal explicite : ${userVision.explicitChannel || "aucun canal impose"}
- WhatsApp demande : ${userVision.whatsappRequested ? "oui, CTA WhatsApp visible obligatoire" : "non"}
- services / offres explicites : ${userVision.services.length ? userVision.services.join(" | ") : "a deduire prudemment"}
- idees specifiques : ${userVision.specificIdeas.length ? userVision.specificIdeas.join(" | ") : "aucune idee specifique longue detectee"}
- references visuelles : ${userVision.visualReferences.length ? userVision.visualReferences.join(" | ") : "aucune reference visuelle detectee"}
- contraintes explicites : ${userVision.explicitConstraints.length ? userVision.explicitConstraints.join(" | ") : "aucune contrainte supplementaire"}
- elements a eviter : ${userVision.avoidTerms.length ? userVision.avoidTerms.join(" | ") : "aucun element a eviter detecte"}
- signaux prioritaires : ${userVision.prioritySignals.length ? userVision.prioritySignals.join(" | ") : "respecter le brief avant les templates"}

REGLE DE PRIORITE :
La vision utilisateur prime toujours sur les templates metier. Les heuristiques Pixelrises servent a completer, jamais a remplacer.
Si une couleur, une ambiance, un CTA ou un canal est explicite, il doit apparaitre dans design, hero, final_cta ou la logique de contact.
Ne remplace jamais rose/violet/TikTok/WhatsApp par noir/dore ou par un template de niche classique.`;

const WEBSITE_SERVICE_BUSINESS_PATTERN =
  /\b(agence web|creation de site|creation site|site internet|site web|developpement web|web design|webmarketing|marketing digital|seo)\b/;

const META_WEBSITE_LEAKAGE_PATTERNS = [
  /\bcreation de site\b/,
  /\bcreation site\b/,
  /\bsite web\b/,
  /\bsite internet\b/,
  /\bpresence web\b/,
  /\bpresence digitale\b/,
  /\bsite professionnel\b/,
  /\bla page\b/,
  /\ble site\b/,
  /\bce site\b/,
  /\bnotre page\b/,
  /\ble visiteur\b/,
  /\bles visiteurs\b/,
  /\bchaque section\b/,
  /\bsection suivante\b/,
  /\bgeneration ia\b/,
  /\bbuilder\b/,
  /\bprompt\b/,
  /\bdashboard\b/,
];

const isWebsiteServiceBusiness = (form: Required<FormPayload>) =>
  WEBSITE_SERVICE_BUSINESS_PATTERN.test(
    normalizeKey(`${form.businessType} ${form.services} ${form.description}`),
  );

const isMetaWebsiteLeakageText = (value: string, form: Required<FormPayload>) => {
  if (isWebsiteServiceBusiness(form)) return false;
  const key = normalizeKey(value);
  return META_WEBSITE_LEAKAGE_PATTERNS.some((pattern) => pattern.test(key));
};

const isMetaConversionLeakageText = (value: string, form: Required<FormPayload>) => {
  if (isWebsiteServiceBusiness(form)) return false;
  const key = normalizeKey(value);
  return META_CONVERSION_LEAKAGE_PATTERNS.some((pattern) => pattern.test(key));
};

const isUnsafeGuaranteedGainText = (value: string) => {
  const key = normalizeKey(value);
  if (!/(gain garanti|gains garantis|profit garanti|revenu garanti)/.test(key)) return false;

  return !/(\baucun gain garanti\b|\bpas de gain garanti\b|\bsans gain garanti\b|\babsence de gain garanti\b|\bgain n est garanti\b|\baucuns gains garantis\b)/.test(
    key,
  );
};

const isWeakServiceName = (value: string) => {
  const key = normalizeKey(value);
  if (!key) return true;
  if (key.length < 5) return true;
  if (isPromptFieldVisibleLeak(value)) return true;
  return WEAK_SERVICE_NAME_PATTERNS.some((pattern) => pattern.test(key));
};

const isContextuallyWeakServiceName = (
  value: string,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  if (isWeakServiceName(value)) return true;
  if (isPhotographyBusiness(form) && isPhotographyServiceNameWeak(value)) return true;

  const key = normalizeKey(value);
  const businessTokens = unique([
    ...meaningfulVisionTokens(form.businessType),
    ...meaningfulVisionTokens(profile.offer),
    ...buildFallbackServiceNames(form, profile).flatMap(meaningfulVisionTokens),
  ]).filter((token) => token.length >= 5);

  if (businessTokens.length === 0) return false;

  const colorOnly =
    /\b(rose|violet|noir|dore|rouge|bleu|vert|orange|neon|pastel|clair|sombre)\b/.test(key) &&
    !businessTokens.some((token) => key.includes(token));

  return colorOnly;
};

const toServiceTitle = (value: string) => {
  const cleaned = normalizeText(value)
    .replace(/\s+/g, " ")
    .replace(/^(service|offre)\s*[:-]?\s*/i, "")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .map((word) => (word.length <= 2 ? word.toLowerCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
    .join(" ");
};

const DEDUPE_STOP_WORDS = new Set([
  "avec",
  "pour",
  "dans",
  "plus",
  "sans",
  "votre",
  "notre",
  "cette",
  "celui",
  "celle",
  "client",
  "clients",
  "offre",
  "site",
  "page",
  "faire",
  "aider",
  "aide",
  "clair",
  "claire",
  "simple",
  "visiteur",
  "visiteurs",
  "business",
  "service",
  "services",
]);

const semanticTokens = (value: string) =>
  normalizeKey(value)
    .split(" ")
    .filter((word) => word.length > 3 && !DEDUPE_STOP_WORDS.has(word));

const semanticSimilarity = (left: string, right: string) => {
  const leftKey = normalizeKey(left);
  const rightKey = normalizeKey(right);
  if (!leftKey || !rightKey) return 0;
  if (leftKey === rightKey) return 1;

  const leftTokens = new Set(semanticTokens(leftKey));
  const rightTokens = new Set(semanticTokens(rightKey));
  const smallest = Math.min(leftTokens.size, rightTokens.size);
  if (smallest < 2) return 0;

  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1;
  });

  return overlap / smallest;
};

const isNearDuplicateText = (candidate: string, seen: string[], threshold = 0.62) =>
  seen.some((entry) => semanticSimilarity(candidate, entry) >= threshold);

const isPromptFieldVisibleLeak = (value: string) => {
  const cleaned = normalizeText(value);
  if (!cleaned) return false;
  const key = normalizeKey(cleaned);
  return PROMPT_FIELD_VISIBLE_LEAK_PATTERNS.some((pattern) => pattern.test(cleaned) || pattern.test(key));
};

const getNearDuplicateVisibleTexts = (strings: string[]) => {
  const seen: string[] = [];
  const duplicates: string[] = [];

  strings
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length >= 44)
    .forEach((entry) => {
      if (isNearDuplicateText(entry, seen, 0.78)) {
        duplicates.push(entry);
        return;
      }

      seen.push(entry);
    });

  return duplicates;
};

const makeDistinctText = (
  candidate: string,
  fallbackCandidates: string[],
  seen: string[],
  threshold = 0.62,
) => {
  const options = unique([candidate, ...fallbackCandidates])
    .map(normalizeText)
    .filter(Boolean);

  const selected =
    options.find((option) => !isNearDuplicateText(option, seen, threshold)) ||
    options[0] ||
    candidate;

  seen.push(selected);
  return selected;
};

const buildFallbackServiceNames = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  const citySuffix = form.city ? ` a ${form.city}` : "";
  const fallbackByNiche: Record<string, string[]> = {
    restaurant: [
      `Reservation de table${citySuffix}`,
      "Menu signature et plats du moment",
      "Accueil groupes et evenements",
      "Experience en salle",
    ],
    coach: [
      "Bilan de depart personnalise",
      "Programme d'accompagnement",
      "Suivi des progres",
      "Seance de coaching ciblee",
    ],
    immobilier: [
      `Estimation immobiliere${citySuffix}`,
      "Accompagnement vendeur",
      "Recherche acquereur qualifie",
      "Mise en valeur du bien",
    ],
    "car-rental": [
      `Location de vehicule${citySuffix}`,
      "Reservation rapide",
      "Remise des cles simplifiee",
      "Assistance trajet",
    ],
    "sports-betting-advice": [
      "Pronostics responsables",
      "Analyse d'avant-match",
      "Suivi transparent des resultats",
      "Acces communaute",
    ],
    "education-training": [
      "Programme guide",
      "Modules pratiques",
      "Accompagnement pedagogique",
      "Bilan de progression",
    ],
    "travel-hospitality": [
      `Reservation de sejour${citySuffix}`,
      "Experience sur place",
      "Services inclus",
      "Conseils et acces",
    ],
    "events-entertainment": [
      "Format d'evenement",
      "Organisation complete",
      "Ambiance et animation",
      "Demande de devis",
    ],
    "saas-tech": [
      "Demonstration produit",
      "Cas d'usage prioritaires",
      "Mise en route guidee",
      "Securite et integrations",
    ],
    "personal-brand": [
      "Offre signature",
      "Methode d'accompagnement",
      "Conference ou intervention",
      "Premier echange",
    ],
    wellness: [
      "Seance decouverte",
      "Accompagnement bien-etre",
      "Approche personnalisee",
      "Reservation de creneau",
    ],
    "automotive-services": [
      `Diagnostic auto${citySuffix}`,
      "Reparation ou entretien",
      "Devis transparent",
      "Controle apres intervention",
    ],
    "pet-services": [
      "Garde ou pension",
      "Soin et suivi animal",
      "Rendez-vous d'accueil",
      "Conseils personnalises",
    ],
    "local-services": [
      `Intervention rapide${citySuffix}`,
      "Devis clair",
      "Diagnostic sur place",
      "Suivi apres intervention",
    ],
    beauty: [
      "Diagnostic beaute",
      "Prestation signature",
      "Reservation de soin",
      "Conseil personnalise",
    ],
    "professional-services": [
      "Diagnostic de depart",
      "Accompagnement strategique",
      "Mise en place operationnelle",
      "Suivi et optimisation",
    ],
    "creative-services": isPhotographyBusiness(form)
      ? [
          `Seance portrait lifestyle${citySuffix}`,
          "Shooting reseaux sociaux et contenu court",
          "Reportage evenementiel ou mariage",
          "Portraits professionnels pour marque personnelle",
          "Retouche soignee et galerie privee",
          "Mini-session urbaine ou studio",
        ]
      : [
          "Direction creative",
          "Identite visuelle",
          "Creation de contenu",
          "Refonte de l'image",
        ],
  };

  const cleanServices = getCleanServiceList(form.services).slice(0, 4);
  if (cleanServices.length) return cleanServices;

  return [
    `${toServiceTitle(form.businessType || profile.offer)} principal${citySuffix}`,
    `Accompagnement ${toServiceTitle(profile.offer || form.businessType).toLowerCase()}`,
    form.city ? `Demande qualifiee a ${form.city}` : "Demande qualifiee",
    `Parcours client vers ${profile.ctaPrimary || form.cta || "le contact"}`,
  ];
};

const repairServiceName = (
  currentName: string,
  index: number,
  form: Required<FormPayload>,
  profile: BusinessProfile,
) => {
  if (!isContextuallyWeakServiceName(currentName, form, profile)) return currentName;

  const candidates = unique([
    ...profile.serviceList,
    ...getCleanServiceList(form.services),
    ...buildFallbackServiceNames(form, profile),
  ])
    .map(toServiceTitle)
    .filter((entry) => entry && !isContextuallyWeakServiceName(entry, form, profile));

  return candidates[index % candidates.length] || `${form.businessType} concret`;
};

const meaningfulVisionTokens = (value: string) =>
  normalizeKey(value)
    .split(" ")
    .filter((token) => token.length >= 4 && !DEDUPE_STOP_WORDS.has(token))
    .slice(0, 8);

const resolveVisionLockedCta = (form: Required<FormPayload>, userVision: UserVision) => {
  if (userVision.explicitChannel === "WhatsApp") return "Contacter sur WhatsApp";

  const contextualCta = resolveContextualCta(form);
  const explicitCta = normalizeText(userVision.explicitCta);

  if (isPhotographyBusiness(form)) return contextualCta;
  if (isVehicleBookingCta(explicitCta) && !isCarRentalBusiness(form)) return contextualCta;
  if (explicitCta && !isGenericDefaultCta(explicitCta)) return explicitCta;

  return contextualCta;
};

const shouldReplaceGeneratedCta = (
  currentCta: string,
  form: Required<FormPayload>,
  userVision: UserVision,
) => {
  const currentKey = normalizeKey(currentCta);
  const expectedCta = resolveVisionLockedCta(form, userVision);
  const expectedTokens = meaningfulVisionTokens(expectedCta);

  if (!currentKey || WEAK_CTA_PATTERNS.some((pattern) => pattern.test(currentCta))) return true;
  if (isVehicleBookingCta(currentCta) && !isCarRentalBusiness(form)) return true;
  if (isPhotographyBusiness(form) && /\b(voiture|vehicule|auto|utilitaire)\b/.test(currentKey)) return true;
  if (isGenericDefaultCta(currentCta) && !isGenericDefaultCta(expectedCta)) return true;
  if (expectedTokens.length && !expectedTokens.some((token) => currentKey.includes(token))) return true;

  return false;
};

const buildUserVisionSignature = (userVision: UserVision) =>
  unique([
    ...userVision.desiredColors,
    ...userVision.desiredMood,
    ...userVision.explicitStyleTerms,
    ...userVision.visualReferences,
  ])
    .filter(Boolean)
    .slice(0, 12)
    .join(", ");

const applyUserVisionToProfile = (
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision: UserVision,
): BusinessProfile => {
  const visionSignature = buildUserVisionSignature(userVision);
  const lockedCta = resolveVisionLockedCta(form, userVision);
  const explicitServices = userVision.services.length ? userVision.services : getCleanServiceList(form.services);
  const hasVisionDesign = userVision.hasStrongVisualDirection && visionSignature.length > 0;

  return {
    ...profile,
    niche: canonicalizeNiche(userVision.niche, profile.niche, form),
    targetAudience: userVision.targetAudience || profile.targetAudience,
    conversionGoal: userVision.conversionIntent || profile.conversionGoal,
    localHook: userVision.city ? `${profile.localHook} | ancrage local prioritaire : ${userVision.city}` : profile.localHook,
    serviceList: unique([...explicitServices, ...profile.serviceList]).slice(0, 8),
    ctaPrimary: lockedCta || profile.ctaPrimary,
    visualDirection: hasVisionDesign
      ? `${profile.visualDirection}. Direction visuelle client : ${visionSignature}`
      : profile.visualDirection,
    imageStyle: hasVisionDesign
      ? `${profile.imageStyle}; scenes et visuels centres sur ${visionSignature}`
      : profile.imageStyle,
    differentiators: unique([...userVision.prioritySignals, ...profile.differentiators]).slice(0, 10),
    seoKeywords: unique([
      userVision.city && userVision.businessType ? `${userVision.businessType} ${userVision.city}` : "",
      form.city && form.businessType ? `${form.businessType} ${form.city}` : "",
      ...profile.seoKeywords,
    ]).slice(0, 8),
  };
};

const applyUserVisionToStrategy = (
  form: Required<FormPayload>,
  strategy: GenerationStrategy,
  userVision: UserVision,
): GenerationStrategy => {
  const visionSignature = buildUserVisionSignature(userVision);
  const lockedCta = resolveVisionLockedCta(form, userVision);
  const hasVisionDesign = userVision.hasStrongVisualDirection && visionSignature.length > 0;

  return {
    ...strategy,
    primaryCta: lockedCta || strategy.primaryCta,
    visualStyle: hasVisionDesign
      ? `${strategy.visualStyle}. Direction visuelle client : ${visionSignature}`
      : strategy.visualStyle,
    imageDirection: hasVisionDesign
      ? `${strategy.imageDirection}; respecter la direction visuelle client : ${visionSignature}`
      : strategy.imageDirection,
    differentiationHooks: unique([...userVision.prioritySignals, ...strategy.differentiationHooks]).slice(0, 10),
    premiumSignals: unique([...userVision.prioritySignals, ...strategy.premiumSignals]).slice(0, 10),
  };
};

const colorPaletteLooksAligned = (content: GeneratedContent, profile: BusinessProfile) => {
  const paletteValues = Object.values(profile.palette).map((value) => value.toLowerCase());
  const designValues = Object.values(content.design.colors).map((value) => value.toLowerCase());

  return paletteValues.some((expected) => designValues.includes(expected));
};

const assertUserVisionRespected = (
  content: GeneratedContent,
  form: Required<FormPayload>,
  profile: BusinessProfile,
  userVision: UserVision,
) => {
  const visibleBlock = normalizeKey(
    [
      ...collectVisibleContentStrings(content),
      content.design.style,
      content.design.layout_type,
      content.design.animation_style,
      content.design.visual_direction,
      content.design.typography,
      content.design.image_style,
      content.design.spacing_style,
      content.design.button_style,
      content.design.card_style,
      content.design.section_style,
      content.design.mobile_behavior,
      ...Object.values(content.design.colors || {}),
      content.visuals?.accentLabel,
      content.visuals?.hero?.alt,
      content.visuals?.hero?.prompt,
      ...(content.visuals?.gallery || []).flatMap((item) => [item.alt, item.prompt]),
    ].join(" "),
  );
  const heroBlock = normalizeKey(`${content.heroTitle} ${content.heroSubtitle} ${content.heroEyebrow}`);
  const ctaBlock = normalizeKey(`${content.ctaButton} ${content.heroSecondaryCta} ${content.ctaTitle} ${content.ctaSubtitle}`);
  const businessTokens = meaningfulVisionTokens(form.businessType);
  const expectedCta = resolveVisionLockedCta(form, userVision);
  const ctaTokens = meaningfulVisionTokens(expectedCta);

  if (businessTokens.length && !businessTokens.some((token) => heroBlock.includes(token))) {
    throw new Error("Le moteur Pixelrises n'a pas assez respecte l'activite exacte demandee dans le hero.");
  }

  if (userVision.explicitColors.length && !colorPaletteLooksAligned(content, profile)) {
    const colorHit = userVision.explicitColors.some((color) => visibleBlock.includes(normalizeKey(color)));

    if (!colorHit) {
      throw new Error("Le moteur Pixelrises n'a pas respecte les couleurs explicites du brief.");
    }
  }

  if (userVision.explicitAmbiance.length) {
    const ambianceHit = userVision.explicitAmbiance.some((ambiance) => {
      const tokens = meaningfulVisionTokens(ambiance);
      return tokens.length ? tokens.some((token) => visibleBlock.includes(token)) : visibleBlock.includes(normalizeKey(ambiance));
    });

    if (!ambianceHit) {
      throw new Error("Le moteur Pixelrises n'a pas respecte l'ambiance explicite du brief.");
    }
  }

  if (userVision.explicitChannel === "WhatsApp" && !/whatsapp/.test(ctaBlock)) {
    throw new Error("Le moteur Pixelrises a ignore le canal WhatsApp demande par l'utilisateur.");
  }

  if ((isPhotographyBusiness(form) || !isCarRentalBusiness(form)) && /\b(voiture|vehicule|auto|utilitaire)\b/.test(ctaBlock)) {
    throw new Error("Le moteur Pixelrises a garde un CTA automobile alors que le brief concerne un autre metier.");
  }

  if (
    isPhotographyBusiness(form) &&
    /\b(location voiture|location de voiture|voiture de location|vehicule de location|remise des cles|louer une voiture|choix du vehicule)\b/.test(
      visibleBlock,
    )
  ) {
    throw new Error("Le moteur Pixelrises a conserve du contenu automobile alors que le brief concerne un photographe.");
  }

  if (
    isPhotographyBusiness(form) &&
    !/\b(photo|photographe|photographie|seance|shooting|portrait|reportage|galerie|mariage)\b/.test(visibleBlock)
  ) {
    throw new Error("Le moteur Pixelrises n'a pas assez ancre le site dans la photographie.");
  }

  if (isCarRentalBusiness(form) && /\b(acheter|achat|commander|commande)\b/.test(heroBlock)) {
    throw new Error("Le moteur Pixelrises a utilise un vocabulaire d'achat alors que le brief demande une location de voiture.");
  }

  if (shouldReplaceGeneratedCta(content.ctaButton, form, userVision) || (ctaTokens.length >= 1 && !ctaTokens.some((token) => ctaBlock.includes(token)))) {
    throw new Error("Le moteur Pixelrises n'a pas respecte le CTA explicite du brief.");
  }

  if (userVision.explicitCity && !visibleBlock.includes(normalizeKey(userVision.explicitCity))) {
    throw new Error("Le moteur Pixelrises n'a pas respecte la ville explicite du brief.");
  }
};

const assertGeneratedContentQuality = (
  content: GeneratedContent,
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
  userVision: UserVision,
) => {
  const strings = collectVisibleContentStrings(content);
  const repeatedStrings = strings.filter((entry, index) => strings.indexOf(entry) !== index);
  const uniqueServiceNames = new Set(content.services.map((item) => normalizeKey(item.name)));
  const uniqueBenefitTitles = new Set(content.benefits.map((item) => normalizeKey(item.title)));
  const serviceAndBenefitOverlap = content.services.some((item) =>
    uniqueBenefitTitles.has(normalizeKey(item.name)),
  );
  const city = normalizeKey(form.city);
  const localStrings = [
    content.heroTitle,
    content.heroSubtitle,
    content.localSeoTitle,
    content.localSeoContent,
    ...content.localSeoItems,
  ]
    .map(normalizeKey)
    .join(" ");
  const genericHits = countPatternHits(strings, GENERIC_VISIBLE_PATTERNS);
  const promptFieldLeaks = strings.filter(isPromptFieldVisibleLeak);
  const nearDuplicateVisibleTexts = getNearDuplicateVisibleTexts(strings);
  const sectionOrder = normalizeSectionOrder(
    content.sectionOrder,
    buildResolvedStructure(profile).prioritySections,
    buildResolvedStructure(profile).allowedSections,
  );
  const heroBlock = normalizeKey(
    `${content.heroTitle} ${content.heroSubtitle} ${content.heroPromise} ${content.ctaButton} ${content.heroSecondaryCta}`,
  );
  const heroAndFinalCtaBlock = normalizeKey(
    `${content.heroTitle} ${content.heroSubtitle} ${content.ctaTitle} ${content.ctaSubtitle}`,
  );
  const visualPrompts = [
    content.visuals?.hero?.prompt,
    ...(content.visuals?.gallery || []).map((item) => item?.prompt || item?.alt || item?.url),
  ]
    .map((entry) => normalizeKey(entry || ""))
    .filter(Boolean);
  const visualUrls = [
    content.visuals?.hero?.url,
    ...(content.visuals?.gallery || []).map((item) => item?.url),
  ]
    .map((entry) => normalizeText(entry || ""))
    .filter(Boolean);
  const designBlock = normalizeKey(
    [
      content.design.style,
      content.design.layout_type,
      content.design.animation_style,
      content.design.visual_direction,
      content.design.typography,
      content.design.image_style,
      content.design.spacing_style,
      content.design.button_style,
      content.design.card_style,
      content.design.section_style,
      content.design.mobile_behavior,
    ].join(" "),
  );
  const repeatedSectionTitles = getRepeatedSectionTitles(content);
  const visualQualityIssue = getNicheVisualQualityIssue(visualPrompts, visualUrls, form, profile);

  assertUserVisionRespected(content, form, profile, userVision);

  if (content.services.length < 3) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 trop peu de services cr\u00e9dibles.");
  }

  if (content.benefits.length < 3 || content.processSteps.length < 3 || content.faqItems.length < 3) {
    throw new Error("Le moteur Pixelrises n'a pas rempli toutes les sections critiques.");
  }

  if (content.heroTitle.length < 18 || content.heroSubtitle.length < 40 || content.ctaButton.length < 6) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 une promesse ou un CTA trop faibles.");
  }

  const heroTitleKey = normalizeKey(content.heroTitle);
  const heroTitleContextTokens = unique([
    ...meaningfulVisionTokens(form.businessName),
    ...meaningfulVisionTokens(form.businessType),
    ...meaningfulVisionTokens(profile.niche),
    form.city ? normalizeKey(form.city) : "",
  ]).filter((token) => token.length >= 4);

  if (!heroTitleContextTokens.some((token) => heroTitleKey.includes(token))) {
    throw new Error("Le moteur Pixelrises a genere un titre hero sans contexte metier, ville ou marque.");
  }

  if (isDirectoryStyleHeroTitle(content.heroTitle, form, profile)) {
    throw new Error("Le moteur Pixelrises a genere un hero trop annuaire, sans promesse ni resultat client.");
  }

  if (content.heroSecondaryCta.length < 6) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 un CTA secondaire trop faible.");
  }

  if (!heroBlock.includes(normalizeKey(content.ctaButton))) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 un hero trop d\u00e9coratif ou pas assez orient\u00e9 action.");
  }

  if (content.testimonials.length < 2 || content.reassuranceItems.length < 3) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 trop peu de r\u00e9assurance cr\u00e9dible.");
  }

  if (uniqueServiceNames.size < Math.min(3, content.services.length)) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 des services trop proches ou r\u00e9p\u00e9titifs.");
  }

  if (uniqueBenefitTitles.size < Math.min(3, content.benefits.length)) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 des b\u00e9n\u00e9fices trop r\u00e9p\u00e9titifs.");
  }

  if (serviceAndBenefitOverlap) {
    throw new Error("Le moteur Pixelrises confond encore les offres et les b\u00e9n\u00e9fices.");
  }

  if (repeatedSectionTitles.length > 0) {
    throw new Error("Le moteur Pixelrises a reutilise le meme titre sur plusieurs sections.");
  }

  if (content.services.some((item) => item.description.length < 40)) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 des services trop faibles ou trop vagues.");
  }

  if (content.services.some((item) => isWeakServiceName(item.name))) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 des noms de services trop vagues.");
  }

  if (content.services.some((item) => isContextuallyWeakServiceName(item.name, form, profile))) {
    throw new Error("Le moteur Pixelrises a transforme des champs de brief en offres visibles.");
  }

  if (visualQualityIssue) {
    throw new Error(visualQualityIssue);
  }

  if (promptFieldLeaks.length > 0) {
    throw new Error("Le moteur Pixelrises a affiche des champs de formulaire ou de prompt dans le site.");
  }

  if (nearDuplicateVisibleTexts.length >= 3) {
    throw new Error("Le moteur Pixelrises a genere trop de blocs visibles qui se ressemblent.");
  }

  if (isPhotographyBusiness(form)) {
    if (content.services.some((item) => isPhotographyServiceNameWeak(item.name))) {
      throw new Error("Le moteur Pixelrises a transforme des champs de prompt en services photo visibles.");
    }

    if (visualPrompts.some((prompt) => isPhotographyVisualPromptWeak(prompt))) {
      throw new Error("Le moteur Pixelrises a propose des visuels trop generiques ou hors metier pour un photographe.");
    }
  }

  if (content.testimonials.some((item) => item.text.length < 55)) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 des t\u00e9moignages trop faibles.");
  }

  if (repeatedStrings.length > 6) {
    console.warn("Generated content contains repeated visible strings; continuing after repair passes.", {
      repeatedCount: repeatedStrings.length,
    });
  }

  if (genericHits >= 6) {
    throw new Error("Le moteur Pixelrises a genere trop de formulations generiques ou trop IA.");
  }

  if (countPatternHits([content.heroTitle, content.heroSubtitle, content.ctaTitle, content.ctaSubtitle], GENERIC_VISIBLE_PATTERNS) > 0) {
    throw new Error("Le moteur Pixelrises a genere un hero ou un CTA final trop generique.");
  }

  if (WEAK_CTA_PATTERNS.some((pattern) => pattern.test(content.ctaButton))) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 un CTA trop faible.");
  }

  if (content.metadata.niche !== profile.niche) {
    throw new Error("Le moteur Pixelrises a m\u00e9lang\u00e9 la niche d\u00e9tect\u00e9e avec une autre logique m\u00e9tier.");
  }

  if (sectionOrder[0] !== "hero" || sectionOrder[sectionOrder.length - 1] !== "final_cta") {
    throw new Error("Le moteur Pixelrises a cass\u00e9 la hi\u00e9rarchie critique hero -> CTA final.");
  }

  if (strategy.prioritySections.some((section) => !sectionOrder.includes(section))) {
    throw new Error("Le moteur Pixelrises a renvoy\u00e9 une structure qui ignore une section prioritaire valid\u00e9e.");
  }

  if (city && !localStrings.includes(city)) {
    throw new Error("Le moteur Pixelrises n'a pas assez ancr\u00e9 le site dans la ville fournie.");
  }

  if (city && !heroAndFinalCtaBlock.includes(city)) {
    throw new Error("Le moteur Pixelrises n'a pas assez reli\u00e9 la promesse ou le CTA final \u00e0 la ville cibl\u00e9e.");
  }

  if (content.faqItems.some((item) => item.question.length < 18 || item.answer.length < 45)) {
    throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 une FAQ trop faible ou trop vague.");
  }

  if (!content.metadata.seoTitle || content.metadata.seoTitle.length < 18) {
    throw new Error("Le moteur Pixelrises n'a pas produit de title SEO exploitable.");
  }

  if (!content.metadata.metaDescription || content.metadata.metaDescription.length < 70) {
    throw new Error("Le moteur Pixelrises n'a pas produit de meta description SEO exploitable.");
  }

  if (!content.design.typography || !content.design.image_style || !content.design.spacing_style) {
    throw new Error("Le moteur Pixelrises n'a pas produit une direction design assez exploitable.");
  }

  if (!designBlock.includes(normalizeKey(form.style)) && !designBlock.includes(normalizeKey(profile.visualDirection))) {
    throw new Error("Le moteur Pixelrises n'a pas assez respect\u00e9 le style visuel demand\u00e9.");
  }

  if (visualPrompts.length < 4 || new Set(visualPrompts).size < 4) {
    throw new Error("Le moteur Pixelrises a produit des visuels trop faibles ou dupliqu\u00e9s.");
  }

  if (visualUrls.length >= 4 && new Set(visualUrls).size < Math.min(4, visualUrls.length)) {
    throw new Error("Le moteur Pixelrises a produit des images dupliquees dans la preview.");
  }

  for (const value of strings) {
    if (
      isPromptLeakageText(value, form) ||
      isMetaWebsiteLeakageText(value, form) ||
      isMetaConversionLeakageText(value, form)
    ) {
      throw new Error("Le moteur Pixelrises a tente d'afficher le brief, la logique interne ou la mecanique de conversion dans la preview.");
    }

    if (isUnsafeGuaranteedGainText(value)) {
      throw new Error("Le moteur Pixelrises a genere une promesse de gain trop risquee.");
    }

    if (FORBIDDEN_VISIBLE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new Error("Le moteur Pixelrises a g\u00e9n\u00e9r\u00e9 un contenu interdit ou trop g\u00e9n\u00e9rique.");
    }
  }

  const visibleDesignStrings = [
    content.design.visual_direction,
    content.design.typography,
    content.design.image_style,
    content.design.button_style,
    content.design.card_style,
    content.design.section_style,
    content.design.mobile_behavior,
    content.visuals.accentLabel,
    content.visuals.hero.alt,
    content.visuals.hero.prompt,
    ...content.visuals.gallery.flatMap((item) => [item.alt, item.prompt]),
  ];

  if (
    visibleDesignStrings.some(
      (value) =>
        isPromptLeakageText(value, form) ||
        isMetaWebsiteLeakageText(value, form) ||
        isMetaConversionLeakageText(value, form) ||
        isUnsafeGuaranteedGainText(value),
    )
  ) {
    throw new Error("Le moteur Pixelrises a tent\u00e9 d'afficher le brief utilisateur ou la logique interne dans le design ou les visuels.");
  }
};

const hasUnsafeVisibleGeneratedContent = (
  content: GeneratedContent,
  form: Required<FormPayload>,
) => {
  const visibleDesignStrings = [
    content.design.visual_direction,
    content.design.typography,
    content.design.image_style,
    content.design.button_style,
    content.design.card_style,
    content.design.section_style,
    content.design.mobile_behavior,
    content.visuals.accentLabel,
    content.visuals.hero.alt,
    content.visuals.hero.prompt,
    ...content.visuals.gallery.flatMap((item) => [item.alt, item.prompt]),
  ];

  return [...collectVisibleContentStrings(content), ...visibleDesignStrings].some(
    (value) =>
        isPromptLeakageText(value, form) ||
        isMetaWebsiteLeakageText(value, form) ||
        isMetaConversionLeakageText(value, form) ||
        isUnsafeGuaranteedGainText(value) ||
        FORBIDDEN_VISIBLE_PATTERNS.some((pattern) => pattern.test(value)),
  );
};

const scrubGeneratedContentForPreview = (
  content: GeneratedContent,
  form: Required<FormPayload>,
  profile: BusinessProfile,
  strategy: GenerationStrategy,
): GeneratedContent => {
  const repaired = autoImproveGeneratedSite(content, form, profile, strategy);
  const fallbackProcess = ensureProcessSteps([], form, profile);
  const visualFallback = buildVisualFallbackScenes(form, profile);
  const userVision = buildUserVision(form, profile);
  const lockedCta = resolveVisionLockedCta(form, userVision);
  const creativeRecipe = selectCreativeLayoutRecipe(form, profile, userVision);
  const safe = (
    value: string,
    fallback: string,
    emergencyFallback = buildEmergencySafeFallback(form, profile),
  ) => {
    const normalized = stripInternalDesignNotes(normalizeText(value, fallback));
    const normalizedEmergencyFallback = stripInternalDesignNotes(
      normalizeText(emergencyFallback, `${form.businessName} - ${form.businessType}${form.city ? ` a ${form.city}` : ""}`),
    );
    const normalizedFallback = stripInternalDesignNotes(normalizeText(fallback, normalizedEmergencyFallback));
    const fallbackIsUnsafe =
      isPromptLeakageText(normalizedFallback, form) ||
      isMetaWebsiteLeakageText(normalizedFallback, form) ||
      isMetaConversionLeakageText(normalizedFallback, form) ||
      isUnsafeGuaranteedGainText(normalizedFallback) ||
      FORBIDDEN_VISIBLE_PATTERNS.some((pattern) => pattern.test(normalizedFallback));
    const finalFallback = fallbackIsUnsafe ? normalizedEmergencyFallback : normalizedFallback;

    return !normalized ||
      isPromptLeakageText(normalized, form) ||
      isMetaWebsiteLeakageText(normalized, form) ||
      isMetaConversionLeakageText(normalized, form) ||
      isUnsafeGuaranteedGainText(normalized) ||
      FORBIDDEN_VISIBLE_PATTERNS.some((pattern) => pattern.test(normalized))
      ? finalFallback
      : normalized;
  };

  return sanitizeTextDeep({
    ...repaired,
    heroTitle: safe(
      repaired.heroTitle,
      buildSpecificHeroTitle(form, profile),
      buildEmergencySafeFallback(form, profile, "heroTitle"),
    ),
    heroSubtitle: safe(
      repaired.heroSubtitle,
      `${form.businessName} aide ${profile.targetAudience.toLowerCase()} ?  ${profile.conversionGoal} avec ${profile.offer.toLowerCase()}, des preuves visibles et une prochaine etape simple.`,
      buildEmergencySafeFallback(form, profile, "heroSubtitle"),
    ),
    heroEyebrow: safe(repaired.heroEyebrow, `${form.businessType}${form.city ? ` - ${form.city}` : ""}`),
    heroPromise: safe(repaired.heroPromise, `${strategy.marketingAngle}. ${profile.proofAngle}.`),
    heroSecondaryCta: safe(repaired.heroSecondaryCta, strategy.secondaryCta || "Voir les details"),
    trustBadges: repaired.trustBadges.map((item, index) =>
      safe(item, strategy.premiumSignals[index] || strategy.differentiationHooks[index] || "Preuve claire"),
    ),
    servicesTitle: safe(repaired.servicesTitle, buildServicesTitle(profile)),
    servicesSubtitle: safe(repaired.servicesSubtitle, `Des offres lisibles pour ${profile.conversionGoal}.`),
    services: repaired.services.map((item, index) => {
      const repairedName = isContextuallyWeakServiceName(item.name, form, profile)
        ? repairServiceName(item.name, index, form, profile)
        : item.name;

      return {
        name: safe(repairedName, repairServiceName("", index, form, profile)),
        description: safe(item.description, buildSpecificServiceDescription(repairedName, form, profile, index)),
      };
    }),
    benefitsTitle: safe(repaired.benefitsTitle, buildBenefitsTitle(profile)),
    benefits: repaired.benefits.map((item, index) => {
      const fallback = buildSpecificBenefit(index, form, profile);
      return {
        title: safe(item.title, fallback.title),
        description: safe(item.description, fallback.description),
      };
    }),
    testimonials: repaired.testimonials.map((item, index) => {
      const fallback = buildSpecificTestimonial(index, form, profile);
      return {
        name: safe(item.name, fallback.name),
        role: safe(item.role, fallback.role),
        text: safe(item.text, fallback.text),
      };
    }),
    ctaTitle: safe(repaired.ctaTitle, `${form.businessName} vous aide maintenant ?  ${profile.conversionGoal}`),
    ctaSubtitle: safe(
      repaired.ctaSubtitle,
      `${profile.offer} est presente avec un parcours clair, des preuves utiles et un CTA simple.`,
    ),
    ctaButton: shouldReplaceGeneratedCta(repaired.ctaButton, form, userVision)
      ? lockedCta
      : safe(repaired.ctaButton, lockedCta),
    processSteps: repaired.processSteps.map((item, index) => {
      const fallback = fallbackProcess[index % fallbackProcess.length];
      return {
        step: safe(item.step, fallback.step),
        title: safe(item.title, fallback.title),
        description: safe(item.description, fallback.description),
      };
    }),
    faqItems: repaired.faqItems.map((item, index) => {
      const fallback = buildSpecificFaq(index, form, profile);
      return {
        question: safe(item.question, fallback.question),
        answer: safe(item.answer, fallback.answer),
      };
    }),
    footerTagline: safe(repaired.footerTagline, `Cree avec Pixelrises`),
    statsItems: [],
    problemTitle: safe(repaired.problemTitle, "Une decision plus simple pour vos clients"),
    problemContent: safe(
      repaired.problemContent,
      `${profile.targetAudience} a besoin de comprendre rapidement l'offre, la preuve et la prochaine etape avant de passer a l'action.`,
    ),
    reassuranceTitle: safe(repaired.reassuranceTitle, "Des reperes visibles avant de passer a l'action"),
    reassuranceContent: safe(
      repaired.reassuranceContent,
      `${form.businessName} met en avant les preuves, les conditions utiles et les reponses concretes pour rassurer avant ${profile.conversionGoal}.`,
    ),
    reassuranceItems: repaired.reassuranceItems.map((item, index) =>
      safe(item, strategy.premiumSignals[index] || "Reponse claire avant de s'engager"),
    ),
    localSeoTitle: safe(repaired.localSeoTitle, form.city ? `${form.businessType} a ${form.city}` : form.businessType),
    localSeoContent: safe(
      repaired.localSeoContent,
      form.city
        ? `${form.businessName} relie son offre, sa zone a ${form.city} et son CTA pour aider les visiteurs ?  agir vite.`
        : `${form.businessName} relie son offre, ses preuves et son CTA pour aider les visiteurs ?  agir vite.`,
    ),
    localSeoItems: repaired.localSeoItems.map((item, index) => safe(item, profile.seoKeywords[index] || form.businessType)),
    design: {
      ...repaired.design,
      style: safe(repaired.design.style, strategy.visualStyle || profile.visualDirection),
      layout_type: ensureLayoutSignature(repaired.design.layout_type, profile.designArchetype, creativeRecipe.id),
      visual_direction: safe(repaired.design.visual_direction, strategy.visualStyle || profile.visualDirection),
      typography: safe(repaired.design.typography, "Hierarchie claire, titres forts et lecture mobile fluide"),
      image_style: safe(repaired.design.image_style, profile.imageStyle),
      button_style: safe(repaired.design.button_style, "Boutons visibles, contrastes et faciles a comprendre"),
      card_style: safe(repaired.design.card_style, "Cartes propres, lisibles et bien espacees"),
      section_style: safe(repaired.design.section_style, "Sections aerees avec une hierarchie nette"),
      mobile_behavior: safe(
        repaired.design.mobile_behavior,
        "Mobile-first, CTA accessible et sections lisibles sans overflow",
      ),
      designArchetype: profile.designArchetype,
    },
    visuals: {
      ...repaired.visuals,
      accentLabel: safe(repaired.visuals.accentLabel, profile.visualDirection),
      hero: {
        ...repaired.visuals.hero,
        prompt: safe(repaired.visuals.hero.prompt, visualFallback.heroScene),
        alt: safe(repaired.visuals.hero.alt, visualFallback.heroAlt),
      },
      gallery: repaired.visuals.gallery.map((item, index) => {
        const fallback = visualFallback.gallery[index % visualFallback.gallery.length] || {
          scene: visualFallback.heroScene,
          alt: visualFallback.heroAlt,
        };
        return {
          ...item,
          prompt: safe(item.prompt, fallback.scene),
          alt: safe(item.alt, fallback.alt),
        };
      }),
    },
  }) as GeneratedContent;
};

const hasMaterialDifference = (previousContent: unknown, nextContent: GeneratedContent) => {
  const previous =
    previousContent && typeof previousContent === "object"
      ? (previousContent as Record<string, unknown>)
      : {};

  const nextCore = {
    heroTitle: nextContent.heroTitle,
    heroSubtitle: nextContent.heroSubtitle,
    ctaTitle: nextContent.ctaTitle,
    ctaSubtitle: nextContent.ctaSubtitle,
    ctaButton: nextContent.ctaButton,
    problemContent: nextContent.problemContent,
    services: nextContent.services.map((item) => `${item.name}|${item.description}`),
    benefits: nextContent.benefits.map((item) => `${item.title}|${item.description}`),
  };

  const previousCore = {
    heroTitle: normalizeText(previous.heroTitle),
    heroSubtitle: normalizeText(previous.heroSubtitle),
    ctaTitle: normalizeText(previous.ctaTitle),
    ctaSubtitle: normalizeText(previous.ctaSubtitle),
    ctaButton: normalizeText(previous.ctaButton),
    problemContent: normalizeText(previous.problemContent),
    services: Array.isArray(previous.services)
      ? previous.services.map((item) =>
          `${normalizeText((item as Record<string, unknown>).name)}|${normalizeText((item as Record<string, unknown>).description)}`,
        )
      : [],
    benefits: Array.isArray(previous.benefits)
      ? previous.benefits.map((item) =>
          `${normalizeText((item as Record<string, unknown>).title)}|${normalizeText((item as Record<string, unknown>).description)}`,
        )
      : [],
  };

  return JSON.stringify(previousCore) !== JSON.stringify(nextCore);
};

const buildGeneratedSiteSummary = (content: GeneratedContent): GeneratedSiteSummary => ({
  seo: {
    title: content.metadata.seoTitle,
    description: content.metadata.metaDescription,
    keywords: content.metadata.seoKeywords,
  },
  ctas: {
    primary: content.ctaButton,
    secondary: content.heroSecondaryCta,
    final: content.ctaButton,
  },
  design: {
    description: [
      content.design.visual_direction,
      content.design.typography,
      content.design.spacing_style,
      content.design.button_style,
      content.design.mobile_behavior,
    ]
      .filter(Boolean)
      .join(" ? "),
    visualDirection: content.design.visual_direction,
    typography: content.design.typography,
    images: content.design.image_style,
  },
  sections: content.sectionOrder,
});

const extractTextFromContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const text =
            Reflect.get(part, "text") ??
            Reflect.get(part, "content") ??
            Reflect.get(part, "value");
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

const tryParseJsonCandidate = <T>(value: string): T | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed,
    ...(trimmed.match(/```json\s*([\s\S]*)```/gi) || []).map((block) =>
      block.replace(/^```json\s*/i, "").replace(/```$/i, "").trim(),
    ),
    ...(trimmed.match(/```[\s\S]*```/g) || []).map((block) =>
      block.replace(/^```\w*\s*/i, "").replace(/```$/i, "").trim(),
    ),
  ];

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    candidates.push(objectMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      continue;
    }
  }

  return null;
};

const parseNamedToolPayload = async <T>(
  response: Response,
  expectedFunctionName: string,
): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    if (isAIQuotaStatus(response.status) || isAIQuotaMessage(text)) {
      throw new Error(getSafeGenerationErrorMessage(text));
    }

    throw new Error(
      "Le moteur Pixelrises n'a pas pu terminer la generation. Aucun credit n'a ete debite. Reessayez dans quelques instants.",
    );
  }

  const payload = await response.json();
  const choice = payload.choices?.[0]?.message;
  const toolCall = choice?.tool_calls?.[0];
  const toolFunction = toolCall?.function;

  if (
    toolFunction?.arguments &&
    (!toolFunction.name || toolFunction.name === expectedFunctionName)
  ) {
    const args = toolFunction.arguments;
    return (typeof args === "string" ? JSON.parse(args) : args) as T;
  }

  const extracted = extractTextFromContent(choice.content);
  const parsed = extracted ? tryParseJsonCandidate<T>(extracted) : null;
  if (parsed) {
    return parsed;
  }

  throw new Error(`Le moteur Pixelrises n'a pas renvoy\u00e9 la fonction ${expectedFunctionName}.`);
};

const uniqueModelAttempts = (
  attempts: Array<{ model: string; maxTokens: number }>,
) => {
  const seen = new Set<string>();

  return attempts.filter((attempt) => {
    if (seen.has(attempt.model)) return false;
    seen.add(attempt.model);
    return true;
  });
};

const createSiteGenerationCompletion = async (
  request: Record<string, unknown>,
) => {
  const attempts = uniqueModelAttempts([
    { model: SITE_GENERATION_MODEL, maxTokens: GENERATION_MAX_TOKENS },
    { model: SITE_GENERATION_FALLBACK_MODEL, maxTokens: 15000 },
    { model: SITE_GENERATION_STABLE_FALLBACK_MODEL, maxTokens: 14000 },
    { model: SITE_GENERATION_FAST_FALLBACK_MODEL, maxTokens: 11000 },
    { model: SITE_GENERATION_LIGHT_FALLBACK_MODEL, maxTokens: 8000 },
  ]);
  let lastQuotaResponse: Response | null = null;

  for (const attempt of attempts) {
    const backoffUntil = modelQuotaBackoffUntil.get(attempt.model) || 0;
    if (backoffUntil > Date.now()) {
      console.warn("Skipping AI model still in quota backoff.", {
        model: attempt.model,
        retryInMs: backoffUntil - Date.now(),
      });
      continue;
    }

    const response = await createAIChatCompletion({
      ...request,
      model: attempt.model,
      max_tokens: Math.min(
        Number(request.max_tokens) || GENERATION_MAX_TOKENS,
        attempt.maxTokens,
      ),
    });

    if (response.ok) {
      if (attempt.model !== SITE_GENERATION_MODEL) {
        console.info("AI generation fallback model used.", { model: attempt.model });
      }
      return response;
    }

    const errorText = await response
      .clone()
      .text()
      .catch(() => "");

    if (!isAIModelFallbackStatus(response.status) && !isAIModelFallbackMessage(errorText)) {
      return response;
    }

    lastQuotaResponse = response;
    modelQuotaBackoffUntil.set(attempt.model, Date.now() + MODEL_QUOTA_BACKOFF_MS);

    console.warn("AI generation model unavailable or quota exceeded, trying next fallback.", {
      status: response.status,
      model: attempt.model,
    });
  }

  return (
    lastQuotaResponse ||
    json(
      {
        error:
          "Le moteur IA est temporairement sature. Aucun credit n'a ete debite. Reessayez dans quelques instants.",
      },
      503,
    )
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let usageEventIdForCatch: string | null = null;
  let serviceRoleForUsage: ReturnType<typeof createClient> | null = null;

  try {
    const env = getRequiredEnvMap([
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Non authentifi\u00e9" }, 401);
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ error: "Non authentifi\u00e9" }, 401);
    }

    const body = await req.json();
    const incomingForm = (body.form || {}) as FormPayload;

    const form: Required<FormPayload> = {
      businessName: normalizeText(incomingForm.businessName),
      businessType: normalizeText(incomingForm.businessType),
      city: normalizeText(incomingForm.city),
      targetAudience: normalizeText(incomingForm.targetAudience),
      services: normalizeText(incomingForm.services),
      positioning: normalizeText(incomingForm.positioning, "Professionnel"),
      style: normalizeText(incomingForm.style, "Moderne"),
      colors: normalizeText(incomingForm.colors, "Auto"),
      objective: normalizeText(incomingForm.objective, "Attirer des clients"),
      cta: normalizeText(incomingForm.cta, "Prendre rendez-vous"),
      description: normalizeText(incomingForm.description),
      enhancers: normalizeList(incomingForm.enhancers).slice(0, 6),
      debugPromptOnly: Boolean(incomingForm.debugPromptOnly),
      requestId: normalizeText(incomingForm.requestId),
      idempotencyKey: normalizeText(incomingForm.idempotencyKey),
      regenerate: Boolean(incomingForm.regenerate),
      variationSeed: normalizeText(
        incomingForm.variationSeed,
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      ),
      siteId: normalizeText(incomingForm.siteId),
      currentVersion: Number(incomingForm.currentVersion || 1),
      improvementPrompt: normalizeText(incomingForm.improvementPrompt),
    };

    form.cta = resolveContextualCta(form);

    if (!form.businessName || !form.businessType) {
      return json({ error: "Le nom du business et le type d'activit\u00e9 sont obligatoires." }, 400);
    }

    if (form.debugPromptOnly) {
      if (!isLocalDevelopmentRequest(req)) {
        return json({ error: "Mode diagnostic indisponible." }, 404);
      }

      return json(buildPromptSimulationPayload(form), 200);
    }

    const { data: creditData, error: creditError } = await supabase
      .from("user_credits")
      .select("credits, total_used")
      .eq("user_id", user.id)
      .single();

    if (creditError || !creditData) {
      return json({ error: "Impossible de r\u00e9cup\u00e9rer les cr\u00e9dits utilisateur." }, 500);
    }

    const creditCost =
      form.siteId && form.improvementPrompt ? IMPROVEMENT_CREDIT_COST : GENERATION_CREDIT_COST;
    const serviceRole = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    serviceRoleForUsage = serviceRole;
    const actionType = form.siteId && form.improvementPrompt ? "site_section_improve" : "site_generation";
    const idempotencyKey =
      form.idempotencyKey ||
      form.requestId ||
      `${user.id}:${actionType}:${form.siteId || "new"}:${form.variationSeed}`;
    let usageEventId: string | null = null;
    const requestContext = {
      userId: user.id,
      businessType: form.businessType,
      businessName: form.businessName,
      city: form.city,
      creditCost,
      actionType,
      idempotencyKey,
      isImprovement: Boolean(form.siteId && form.improvementPrompt),
    };

    if (creditData.credits < creditCost) {
      console.warn("generate-site blocked: insufficient credits", {
        ...requestContext,
        creditsAvailable: creditData.credits,
      });
      return json(
        {
            error: `Il vous manque ${creditCost - creditData.credits} cr\u00e9dit(s) pour cette action.`,
          creditCost,
          creditsAvailable: creditData.credits,
        },
        402,
      );
    }

    const { data: usageEvent, error: usageStartError } = await serviceRole.rpc("start_usage_event", {
      p_user_id: user.id,
      p_action_type: actionType,
      p_builder_type: "site",
      p_entity_id: form.siteId || null,
      p_credits_estimated: creditCost,
      p_idempotency_key: idempotencyKey,
      p_metadata: {
        source: "site_builder",
        mode: form.siteId && form.improvementPrompt ? "improve" : "generate",
      },
    });

    if (usageStartError || !usageEvent) {
      console.warn("generate-site usage event unavailable", {
        ...requestContext,
        reason: usageStartError?.message || "usage_event_missing",
      });
      return json(
        {
          error:
            "La verification des credits est temporairement indisponible. Aucun credit n'a ete debite.",
        },
        503,
      );
    }

    const usageEventRecord = usageEvent as { usage_id?: string; status?: string; reason?: string };
    usageEventId = usageEventRecord.usage_id || null;
    usageEventIdForCatch = usageEventId;

    if (usageEventRecord.status === "blocked") {
      return json(
        {
          error:
            usageEventRecord.reason === "insufficient_credits"
              ? "Credits insuffisants pour cette action."
              : "Cette action est temporairement bloquee par les quotas du plan.",
          creditCost,
          creditsAvailable: creditData.credits,
        },
        402,
      );
    }

    let existingContent: unknown = null;
    let existingVersion = 1;

    if (form.siteId && form.improvementPrompt) {
      const { data: existingSite, error: existingSiteError } = await supabase
        .from("generated_sites")
        .select("generated_content, content_json, version")
        .eq("id", form.siteId)
        .eq("user_id", user.id)
        .single();

      if (existingSiteError || !existingSite) {
        return json({ error: "Site introuvable pour cette am\u00e9lioration." }, 404);
      }

      existingContent = existingSite.content_json ?? existingSite.generated_content;
      existingVersion = existingSite.version || 1;
    }

    const heuristicProfile = inferBusinessProfile(form);
    const preliminaryUserVision = buildUserVision(form, heuristicProfile);
    let profile = heuristicProfile;

    if (ENABLE_AI_PLANNING) {
      try {
        profile = await analyzeBusinessProfileWithAI(form, heuristicProfile, preliminaryUserVision);
      } catch (profileError) {
        console.warn("AI business analysis skipped; using Pixelrises local enhancer.", {
          ...requestContext,
          reason: profileError instanceof Error ? profileError.message : String(profileError),
        });
      }
    }

    const userVision = buildUserVision(form, profile);
    profile = applyUserVisionToProfile(form, profile, userVision);

    let strategy = buildFallbackStrategy(profile);
    if (ENABLE_AI_PLANNING) {
      try {
        strategy = await analyzeBusinessStrategyWithAI(form, profile, userVision);
      } catch (strategyError) {
        console.warn("AI strategy skipped; using Pixelrises local strategy.", {
          ...requestContext,
          reason: strategyError instanceof Error ? strategyError.message : String(strategyError),
        });
      }
    }

    strategy = applyUserVisionToStrategy(form, strategy, userVision);

    let validatedBlueprint = reinforcePromptBlueprint(
      form,
      profile,
      strategy,
      buildFallbackPromptBlueprint(profile, strategy),
    );

    if (ENABLE_AI_PLANNING) {
      let aiBlueprint: PromptBlueprint | null = null;
      let blueprintFeedback = "";

      for (let attempt = 1; attempt <= PROMPT_VALIDATION_MAX_ATTEMPTS; attempt += 1) {
        let candidate: PromptBlueprint;
        try {
          candidate = await buildPromptBlueprintWithAI(
            form,
            profile,
            strategy,
            aiBlueprint,
            blueprintFeedback,
            userVision,
          );
        } catch (blueprintError) {
          console.warn("Prompt blueprint AI fallback:", blueprintError);
          candidate = buildFallbackPromptBlueprint(profile, strategy);
        }
        const issues = validatePromptBlueprint(form, profile, strategy, candidate);

        if (issues.length === 0) {
          aiBlueprint = candidate;
          break;
        }

        aiBlueprint = candidate;
        blueprintFeedback = issues.map((issue) => `- ${issue}`).join("\n");
      }

      if (aiBlueprint) {
        validatedBlueprint = aiBlueprint;
      }
    }

    validatedBlueprint = reinforcePromptBlueprint(form, profile, strategy, validatedBlueprint);
    let blueprintIssues = validatePromptBlueprint(form, profile, strategy, validatedBlueprint);
    if (blueprintIssues.length > 0) {
      const fallbackBlueprint = reinforcePromptBlueprint(
        form,
        profile,
        strategy,
        buildFallbackPromptBlueprint(profile, strategy),
        blueprintIssues,
      );
      const fallbackIssues = validatePromptBlueprint(form, profile, strategy, fallbackBlueprint);

      if (fallbackIssues.length === 0) {
        validatedBlueprint = fallbackBlueprint;
        blueprintIssues = [];
      } else {
        validatedBlueprint = reinforcePromptBlueprint(
          form,
          profile,
          strategy,
          fallbackBlueprint,
          fallbackIssues,
        );
        blueprintIssues = validatePromptBlueprint(form, profile, strategy, validatedBlueprint);
      }
    }

    if (blueprintIssues.length > 0) {
      console.warn(
        "Prompt blueprint renforce avec des avertissements non bloquants:",
        blueprintIssues.join(" | "),
      );
    }

    const isImprovementRequest = Boolean(form.siteId && form.improvementPrompt);
    const creativeVariationId =
      typeof crypto?.randomUUID === "function"
        ? `${form.variationSeed}-${crypto.randomUUID()}`
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const siteGenerationRequest = {
      temperature: isImprovementRequest ? 0.78 : SITE_GENERATION_TEMPERATURE,
      top_p: GENERATION_TOP_P,
      max_tokens: GENERATION_MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: isImprovementRequest
            ? buildImprovementSystemPrompt(
                form,
                existingContent,
                form.improvementPrompt,
                profile,
                strategy,
                validatedBlueprint,
                userVision,
              )
            : buildGenerationSystemPrompt(form, profile, strategy, validatedBlueprint, userVision),
        },
        {
          role: "user",
          content: isImprovementRequest
            ? buildImprovementUserPrompt(
                form,
                profile,
                existingContent,
                strategy,
                validatedBlueprint,
            )
            : buildGenerationUserPrompt(form, profile, strategy, validatedBlueprint, userVision),
        },
        {
          role: "user",
          content: `VARIATION CREATIVE UNIQUE : ${creativeVariationId}

Objectif de variation :
- Ne pas recycler une structure ou une formulation identique a une generation precedente.
- Adapter vraiment les titres, services, benefices, FAQ et visuels au brief prioritaire.
- Si le prompt mentionne un metier precis, le hero doit nommer ce metier et ne jamais rester generique.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_site_content",
            description: "Generate a structured premium business website in strict JSON.",
            parameters: {
              type: "object",
              properties: {
                hero: {
                  type: "object",
                  properties: {
                    eyebrow: { type: "string" },
                    title: { type: "string" },
                    subtitle: { type: "string" },
                    promise: { type: "string" },
                    cta_primary: { type: "string" },
                    cta_secondary: { type: "string" },
                  },
                  required: ["title", "subtitle", "promise", "cta_primary", "cta_secondary"],
                },
                problem_solution: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    problem: { type: "string" },
                    solution: { type: "string" },
                  },
                  required: ["title", "problem", "solution"],
                },
                services: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      outcome: { type: "string" },
                    },
                    required: ["name", "description"],
                  },
                },
                benefits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["title", "description"],
                  },
                },
                testimonials: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      role: { type: "string" },
                      text: { type: "string" },
                    },
                    required: ["name", "role", "text"],
                  },
                },
                process: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["step", "title", "description"],
                  },
                },
                reassurance: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    items: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["title", "content", "items"],
                },
                local_seo: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    items: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["title", "content", "items"],
                },
                faq: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      answer: { type: "string" },
                    },
                    required: ["question", "answer"],
                  },
                },
                final_cta: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    subtitle: { type: "string" },
                    button: { type: "string" },
                  },
                  required: ["title", "subtitle", "button"],
                },
                metadata: {
                  type: "object",
                  properties: {
                    target_audience: { type: "string" },
                    conversion_goal: { type: "string" },
                    positioning: { type: "string" },
                    niche: { type: "string" },
                    offer: { type: "string" },
                    differentiators: {
                      type: "array",
                      items: { type: "string" },
                    },
                    seo_keywords: {
                      type: "array",
                      items: { type: "string" },
                    },
                    seo_title: { type: "string" },
                    meta_description: { type: "string" },
                  },
                  required: [
                    "target_audience",
                    "conversion_goal",
                    "positioning",
                    "niche",
                    "offer",
                    "differentiators",
                    "seo_keywords",
                    "seo_title",
                    "meta_description",
                  ],
                },
                design: {
                  type: "object",
                  properties: {
                    colors: {
                      type: "object",
                      properties: {
                        primary: { type: "string" },
                        secondary: { type: "string" },
                        surface: { type: "string" },
                        accent: { type: "string" },
                      },
                      required: ["primary", "secondary", "surface", "accent"],
                    },
                    style: { type: "string" },
                    layout_type: { type: "string" },
                    animation_style: { type: "string" },
                    visual_direction: { type: "string" },
                    typography: { type: "string" },
                    image_style: { type: "string" },
                    spacing_style: { type: "string" },
                    button_style: { type: "string" },
                    card_style: { type: "string" },
                    section_style: { type: "string" },
                    mobile_behavior: { type: "string" },
                    designArchetype: { type: "string" },
                  },
                  required: [
                    "colors",
                    "style",
                    "layout_type",
                    "animation_style",
                    "visual_direction",
                    "typography",
                    "image_style",
                    "spacing_style",
                    "button_style",
                    "card_style",
                    "section_style",
                  ],
                },
                visuals: {
                  type: "object",
                  properties: {
                    accent_label: { type: "string" },
                    hero_scene: { type: "string" },
                    hero_alt: { type: "string" },
                    gallery: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          scene: { type: "string" },
                          alt: { type: "string" },
                        },
                        required: ["scene", "alt"],
                      },
                    },
                  },
                  required: ["accent_label", "hero_scene", "hero_alt", "gallery"],
                },
                sectionOrder: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: [
                "hero",
                "problem_solution",
                "services",
                "benefits",
                "testimonials",
                "process",
                "reassurance",
                "local_seo",
                "faq",
                "final_cta",
                "metadata",
                "design",
                "visuals",
                "sectionOrder",
              ],
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: {
          name: "generate_site_content",
        },
      },
    };

    let generationMode: "ai" | "ai_repaired" = "ai";
    let rawGenerated: RawSitePayload;

    try {
      const aiResponse = await createSiteGenerationCompletion(siteGenerationRequest);

      rawGenerated = await parseNamedToolPayload<RawSitePayload>(
        aiResponse,
        "generate_site_content",
      );
    } catch (generationError) {
      console.warn("AI generation failed before a valid Gemini payload was produced.", {
        ...requestContext,
        reason: generationError instanceof Error ? generationError.message : String(generationError),
      });
      throw generationError;
    }

    const previousVisuals =
      existingContent &&
      typeof existingContent === "object" &&
      "visuals" in (existingContent as Record<string, unknown>)
        ? ((existingContent as Record<string, unknown>).visuals as GeneratedContent["visuals"] | null)
        : null;
    const buildGeneratedCandidate = async (rawPayload: RawSitePayload) => {
      const generatedVisuals = await buildVisualAssets(
        form,
        profile,
        rawPayload.visuals,
        previousVisuals,
      );
      const normalizedGeneratedContent = sanitizeTextDeep(
        normalizeGeneratedSite(rawPayload, form, profile, generatedVisuals, strategy),
      );

      return autoImproveGeneratedSite(
        normalizedGeneratedContent,
        form,
        profile,
        strategy,
      );
    };

    const repairAndValidateGeneratedContent = (candidate: GeneratedContent) => {
      let repairedCandidate = candidate;
      let qualityErrorAfterRepair: unknown = null;

      for (let attempt = 1; attempt <= CONTENT_QUALITY_REPAIR_MAX_ATTEMPTS; attempt += 1) {
        repairedCandidate = autoImproveGeneratedSite(repairedCandidate, form, profile, strategy);

        try {
          assertGeneratedContentQuality(repairedCandidate, form, profile, strategy, userVision);
          qualityErrorAfterRepair = null;
          break;
        } catch (qualityError) {
          qualityErrorAfterRepair = qualityError;
          generationMode = "ai_repaired";
          console.warn("Generated content quality repair pass needed.", {
            ...requestContext,
            attempt,
            reason: qualityError instanceof Error ? qualityError.message : String(qualityError),
          });
        }
      }

      return {
        content: repairedCandidate,
        error: qualityErrorAfterRepair,
      };
    };

    const tryFinalScrubValidation = (candidate: GeneratedContent) => {
      const scrubbedCandidate = scrubGeneratedContentForPreview(candidate, form, profile, strategy);

      if (hasUnsafeVisibleGeneratedContent(scrubbedCandidate, form)) {
        throw new Error("Le resultat genere contient encore un element interne ou bloque.");
      }

      assertGeneratedContentQuality(scrubbedCandidate, form, profile, strategy, userVision);
      return scrubbedCandidate;
    };

    let generatedContent = await buildGeneratedCandidate(rawGenerated);
    let qualityResult = repairAndValidateGeneratedContent(generatedContent);
    generatedContent = qualityResult.content;
    let lastQualityError: unknown = qualityResult.error;

    if (lastQualityError) {
      console.warn("Generated content quality gate failed after Pixelrises repair passes; trying final scrub.", {
        ...requestContext,
        reason: lastQualityError instanceof Error ? lastQualityError.message : String(lastQualityError),
      });

      try {
        generatedContent = tryFinalScrubValidation(generatedContent);
        lastQualityError = null;
      } catch (scrubError) {
        lastQualityError = scrubError;
      }
    }

    if (lastQualityError && !isImprovementRequest) {
      console.warn("Generated content still insufficient; requesting one controlled Gemini regeneration.", {
        ...requestContext,
        reason: lastQualityError instanceof Error ? lastQualityError.message : String(lastQualityError),
      });

      try {
        const regenerationResponse = await createSiteGenerationCompletion({
          ...siteGenerationRequest,
          temperature: Math.min(SITE_GENERATION_TEMPERATURE + 0.08, 0.92),
          messages: [
            ...(siteGenerationRequest.messages as Array<Record<string, string>>),
            {
              role: "user",
              content: `REGENERATION CONTROLEE PIXELRISES :
Le resultat precedent est refuse par le quality gate.
Raison : ${lastQualityError instanceof Error ? lastQualityError.message : String(lastQualityError)}

Tu dois regenerer entierement le site, pas simplement corriger une phrase.
Respecte d'abord la vision utilisateur :
${buildUserVisionPromptBlock(userVision)}

Applique aussi cette matrice anti-template :
${buildSiteSpecificityMatrix(form, profile, strategy, userVision)}

Obligatoire :
- hero specifique au metier, a la ville et a l'objectif
- couleurs, ambiance, CTA et canal explicites visibles dans le rendu
- aucune phrase generique ou prompt utilisateur visible
- design different d'un template standard
- JSON strict via generate_site_content`,
            },
          ],
        });
        const regeneratedRaw = await parseNamedToolPayload<RawSitePayload>(
          regenerationResponse,
          "generate_site_content",
        );
        generatedContent = await buildGeneratedCandidate(regeneratedRaw);
        qualityResult = repairAndValidateGeneratedContent(generatedContent);
        generatedContent = qualityResult.content;
        lastQualityError = qualityResult.error;

        if (lastQualityError) {
          generatedContent = tryFinalScrubValidation(generatedContent);
          lastQualityError = null;
        }
      } catch (regenerationError) {
        lastQualityError = regenerationError;
      }
    }

    if (lastQualityError) {
      console.warn("Strict quality gate still failed after repair and controlled regeneration.", {
        ...requestContext,
        reason: lastQualityError instanceof Error ? lastQualityError.message : String(lastQualityError),
      });
    }

    if (lastQualityError) {
      console.warn("Generated content rejected after repair and controlled regeneration.", {
        ...requestContext,
        reason: lastQualityError instanceof Error ? lastQualityError.message : String(lastQualityError),
      });
      throw new Error(
        "Le resultat genere n'est pas encore assez fidele a votre vision. Aucun credit n'a ete debite. Precisez le brief ou reessayez.",
      );
    }
    if (!isImprovementRequest) {
      const improvedCandidate = autoImproveGeneratedSite(
        generatedContent,
        form,
        profile,
        strategy,
      );

      try {
        assertGeneratedContentQuality(improvedCandidate, form, profile, strategy, userVision);

        if (computeQualityScore(improvedCandidate).overall >= computeQualityScore(generatedContent).overall) {
          generatedContent = improvedCandidate;
        }
      } catch (qualityError) {
        console.warn("Optional quality polish rejected without interrupting generation.", {
          ...requestContext,
          reason: qualityError instanceof Error ? qualityError.message : String(qualityError),
        });
      }
    }

    if (isImprovementRequest && !hasMaterialDifference(existingContent, generatedContent)) {
      throw new Error("L'optimisation propos\u00e9e est trop proche de la version actuelle pour \u00eatre factur\u00e9e.");
    }
    const qualityScore = computeQualityScore(generatedContent);

    const effectiveCreditCost = creditCost;
    const nextCredits = creditData.credits - effectiveCreditCost;
    const nextTotalUsed = (creditData.total_used || 0) + effectiveCreditCost;

    let createdSiteId: string | null = null;
    let previousSnapshot: {
      generated_content: unknown;
      content_json: unknown;
      version: number;
    } | null = null;
    let siteId = form.siteId || "";

    if (form.siteId && form.improvementPrompt) {
      const { data: existingSite, error: snapshotError } = await serviceRole
        .from("generated_sites")
        .select("generated_content, content_json, version")
        .eq("id", form.siteId)
        .eq("user_id", user.id)
        .single();

      if (snapshotError || !existingSite) {
        return json({ error: "Impossible de charger le site \u00e0 am\u00e9liorer." }, 404);
      }

      previousSnapshot = existingSite;

      const { data: updatedSite, error: updateError } = await serviceRole
        .from("generated_sites")
        .update({
          business_name: form.businessName,
          business_type: form.businessType,
          city: form.city || null,
          services: form.services || null,
          style: form.style || null,
          colors: form.colors || null,
          objective: form.objective || null,
          cta: form.cta || null,
          description: form.description || null,
          generated_content: generatedContent,
          content_json: generatedContent,
          version: Math.max(form.currentVersion || 1, existingVersion) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.siteId)
        .eq("user_id", user.id)
        .select("id, slug, status, content_json")
        .single();

      if (updateError || !updatedSite) {
        return json({ error: updateError.message || "Impossible de sauvegarder la g\u00e9n\u00e9ration." }, 500);
      }

      siteId = updatedSite.id;
    } else {
      const { data: newSite, error: insertError } = await serviceRole
        .from("generated_sites")
        .insert({
          user_id: user.id,
          business_name: form.businessName,
          business_type: form.businessType,
          city: form.city || null,
          services: form.services || null,
          style: form.style || null,
          colors: form.colors || null,
          objective: form.objective || null,
          cta: form.cta || null,
          description: form.description || null,
          generated_content: generatedContent,
          content_json: generatedContent,
          status: "draft",
        })
        .select("id, slug, status, content_json")
        .single();

      if (insertError || !newSite) {
        return json({ error: insertError.message || "Impossible d'enregistrer le site g\u00e9n\u00e9r\u00e9." }, 500);
      }

      createdSiteId = newSite.id;
      siteId = newSite.id;
    }

    const { data: persistedSite, error: persistedSiteError } = await serviceRole
      .from("generated_sites")
      .select("id, slug, status, content_json")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .single();

    if (
      persistedSiteError ||
      !persistedSite.id ||
      !persistedSite.content_json ||
      (persistedSite.status !== "draft" &&
        persistedSite.status !== "generated" &&
        persistedSite.status !== "published")
    ) {
      if (createdSiteId) {
        await serviceRole
          .from("generated_sites")
          .delete()
          .eq("id", createdSiteId)
          .eq("user_id", user.id);
      } else if (form.siteId && previousSnapshot) {
        await serviceRole
          .from("generated_sites")
          .update({
            generated_content: previousSnapshot.generated_content,
            content_json: previousSnapshot.content_json ?? previousSnapshot.generated_content,
            version: previousSnapshot.version,
            updated_at: new Date().toISOString(),
          })
          .eq("id", form.siteId)
          .eq("user_id", user.id);
      }

      return json(
        {
          error:
            "Le site a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 mais la sauvegarde n'a pas pu \u00eatre confirm\u00e9e. Aucun cr\u00e9dit n'a \u00e9t\u00e9 d\u00e9bit\u00e9.",
        },
        500,
      );
    }

    const { data: creditSettlement, error: creditUpdateError } = await serviceRole.rpc("complete_usage_event", {
      p_usage_id: usageEventId,
      p_status: "succeeded",
      p_credits_charged: effectiveCreditCost,
      p_error_code: null,
      p_metadata: {
        site_id: siteId,
        generation_mode: generationMode,
        quality_score: qualityScore?.overall ?? null,
      },
    });

    if (creditUpdateError) {
      if (createdSiteId) {
        await serviceRole
          .from("generated_sites")
          .delete()
          .eq("id", createdSiteId)
          .eq("user_id", user.id);
      } else if (form.siteId && previousSnapshot) {
        await serviceRole
          .from("generated_sites")
          .update({
            generated_content: previousSnapshot.generated_content,
            content_json: previousSnapshot.content_json ?? previousSnapshot.generated_content,
            version: previousSnapshot.version,
            updated_at: new Date().toISOString(),
          })
          .eq("id", form.siteId)
          .eq("user_id", user.id);
      }

      return json(
        {
          error:
              "G\u00e9n\u00e9ration r\u00e9ussie mais d\u00e9bit des cr\u00e9dits impossible. Aucun changement n'a \u00e9t\u00e9 perdu.",
        },
        500,
      );
    }

    const settledCredits =
      creditSettlement && typeof creditSettlement === "object" && "balance" in creditSettlement
        ? Number((creditSettlement as { balance?: number }).balance)
        : nextCredits;

    console.info("generate-site success", {
      ...requestContext,
      siteId,
      remainingCredits: settledCredits,
      effectiveCreditCost,
      generationMode,
    });

    return json({
      content: generatedContent,
      credits: settledCredits,
      creditCost: effectiveCreditCost,
      generationMode,
      notice: null,
      siteId,
      qualityScore,
      previewUrl: buildPreviewPath(siteId),
      dashboardUrl: buildDashboardPath(siteId),
      publishUrl: buildDashboardPath(siteId, "publish"),
      publicUrl:
        persistedSite.status === "published" ? buildPublicPath(persistedSite.slug) : null,
      status: persistedSite.status,
      summary: buildGeneratedSiteSummary(generatedContent),
    });
  } catch (error) {
    console.error("generate-site error: redacted", {
      reason: getSafeGenerationErrorMessage(error),
    });
    if (usageEventIdForCatch && serviceRoleForUsage) {
      await serviceRoleForUsage.rpc("complete_usage_event", {
        p_usage_id: usageEventIdForCatch,
        p_status: "failed",
        p_credits_charged: 0,
        p_error_code: "generation_failed",
        p_metadata: { debit: "none" },
      });
    }
    const safeMessage = getSafeGenerationErrorMessage(error);
    return json(
      {
        error: safeMessage,
      },
      isAIQuotaMessage(error) ? 503 : 500,
    );
  }
});
