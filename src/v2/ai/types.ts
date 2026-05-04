export type PixelrisesTaskType =
  | "structure"
  | "design"
  | "copywriting"
  | "seo"
  | "business"
  | "conversion"
  | "visuals"
  | "improvement"
  | "analytics";

export type PixelrisesTier =
  | "simple"
  | "premium"
  | "luxe"
  | "corporate"
  | "startup"
  | "local business";

export type PixelrisesGoal =
  | "vendre"
  | "generer_leads"
  | "devis"
  | "reservations"
  | "presentation"
  | "lancer_marque"
  | "boutique"
  | "presence_professionnelle"
  | "ameliorer_image";

export type NormalizedAISection = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  content: string;
  cta: {
    label: string;
    action: string;
  };
  items: Array<Record<string, unknown>>;
  media: Array<Record<string, unknown>>;
  layout: string;
};

export type NormalizedAIPage = {
  slug: string;
  title: string;
  sections: NormalizedAISection[];
};

export type NormalizedAIOutput = {
  meta: {
    businessName: string;
    niche: string;
    goal: string;
    targetAudience: string;
    tier: string;
    style: string;
    language: "fr" | "en";
  };
  brand: {
    name: string;
    tagline: string;
    colors: string[];
    fonts: string[];
    tone: string;
  };
  pages: NormalizedAIPage[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    localKeywords: string[];
  };
  business: {
    offer: string;
    valueProposition: string;
    pricingSuggestion: string;
    mainCTA: string;
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
    type: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    action: string;
  }>;
};

export type PromptTask = {
  id: string;
  type: PixelrisesTaskType;
  prompt: string;
  priority: "high" | "medium" | "low";
  context: Record<string, unknown>;
};

export type ProviderMode = "rapide" | "qualite" | "business" | "cout_optimise";

export type ProviderKey =
  | "pixelrises-auto"
  | "gpt"
  | "claude"
  | "gemini"
  | "mistral"
  | "fallback";

export type ProviderAssignment = {
  taskType: PixelrisesTaskType;
  provider: ProviderKey;
  modelHint: string;
  reason: string;
};
