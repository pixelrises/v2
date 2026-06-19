import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  createAIChatCompletion,
  getAIProviderName,
} from "../_shared/ai-provider.ts";
import { sanitizeTextDeep } from "../_shared/text.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ProjectType = "site" | "agent" | "game";
type GenerationMode = "plan" | "build" | "improve";
type ProjectStatus = "draft" | "planned" | "generated" | "improved" | "published";

type OrchestratorRequest = {
  projectType?: ProjectType;
  mode?: GenerationMode;
  prompt?: string;
  formData?: Record<string, unknown>;
  brief?: Record<string, unknown>;
  options?: Record<string, unknown>;
  userId?: string;
};

type QualityGateResult = {
  valid: boolean;
  score: number;
  issues: string[];
  fixes: string[];
  recommendations: string[];
};

type PersistResult = {
  persisted: boolean;
  projectId?: string;
  generationId?: string;
  errors: string[];
};

type ChatUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type AITaskType =
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
  | "code_generation"
  | "code_review"
  | "bug_fix"
  | "refactor"
  | "quality_gate"
  | "output_normalization"
  | "final_fusion";

type AIRole = "gemini" | "openai" | "claude" | "claude-design" | "claude-code" | "mistral";

type MultiAITaskResult = {
  taskType: AITaskType;
  role: AIRole;
  model: string;
  success: boolean;
  output: unknown;
  usage: ChatUsage;
  durationMs: number;
  error?: string;
};

type MultiAIExecution = {
  output: unknown;
  provider: string;
  model: string;
  usage: ChatUsage;
  source: "real" | "mock-fallback";
  taskResults: MultiAITaskResult[];
  errors: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const toText = (value: unknown, fallback: string) => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const toArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value)
    ? value.map((item) => String(item ?? "").trim()).filter(Boolean)
    : fallback;

const responseSecretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /sk-[0-9A-Za-z_-]{20,}/g,
  /vck_[0-9A-Za-z_-]{16,}/g,
  /sb_secret_[0-9A-Za-z_-]{10,}/g,
  /sb_publishable_[0-9A-Za-z_-]{10,}/g,
  /github_pat_[0-9A-Za-z_]+/gi,
  /ghp_[0-9A-Za-z_]{20,}/g,
  /eyJ[0-9A-Za-z_-]{20,}\.[0-9A-Za-z_-]{20,}\.[0-9A-Za-z_-]{10,}/g,
  /bearer\s+[0-9A-Za-z._-]+/gi,
  /(?<=api[_-]?key["'\s:=]+)[^"',\s]+/gi,
  /(?<=secret["'\s:=]+)[^"',\s]+/gi,
  /(?<=token["'\s:=]+)[^"',\s]+/gi,
];

const redactSecretsForResponse = (value: unknown, fallback = "Erreur IA controlee.") => {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  const cleaned = responseSecretPatterns
    .reduce((safe, pattern) => safe.replace(pattern, "[REDACTED]"), raw ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.slice(0, 240) : fallback;
};

const redactErrorList = (errors: string[]) => errors.map((error) => redactSecretsForResponse(error));

const nowIso = () => new Date().toISOString();

const makeId = () => crypto.randomUUID();

const readEnv = (key: string, fallback = "") => (Deno.env.get(key) ?? fallback).trim();

const taskPlans: Record<ProjectType, Record<GenerationMode, AITaskType[]>> = {
  site: {
    plan: ["brief_analysis", "strategy_analysis", "site_structure", "site_design", "site_seo", "quality_gate", "final_fusion"],
    build: [
      "brief_analysis",
      "strategy_analysis",
      "site_structure",
      "site_design",
      "site_copywriting",
      "site_seo",
      "site_conversion",
      "quality_gate",
      "final_fusion",
    ],
    improve: ["brief_analysis", "site_improvement", "site_design", "site_copywriting", "site_conversion", "quality_gate", "final_fusion"],
  },
  agent: {
    plan: ["brief_analysis", "agent_config", "agent_permissions", "quality_gate", "final_fusion"],
    build: ["brief_analysis", "agent_config", "agent_prompt", "agent_permissions", "quality_gate", "final_fusion"],
    improve: ["brief_analysis", "agent_config", "agent_prompt", "agent_permissions", "quality_gate", "final_fusion"],
  },
  game: {
    plan: [
      "brief_analysis",
      "game_research",
      "game_design",
      "game_mechanics",
      "game_platform_constraints",
      "game_level_design",
      "game_publishing",
      "quality_gate",
      "final_fusion",
    ],
    build: [
      "brief_analysis",
      "game_research",
      "game_design",
      "game_mechanics",
      "game_platform_constraints",
      "game_level_design",
      "game_ui_ux",
      "game_script",
      "game_prototype_code",
      "game_assets",
      "game_publishing",
      "quality_gate",
      "final_fusion",
    ],
    improve: [
      "brief_analysis",
      "game_research",
      "game_design",
      "game_mechanics",
      "game_script",
      "game_prototype_code",
      "game_assets",
      "quality_gate",
      "final_fusion",
    ],
  },
};

const roleForTask = (taskType: AITaskType): AIRole => {
  if ([
    "project_type_detection",
    "brief_analysis",
    "game_research",
    "integration_mapping",
    "dashboard_recommendations",
    "output_normalization",
    "final_fusion",
  ].includes(taskType)) {
    return "gemini";
  }
  if ([
    "strategy_analysis",
    "business_positioning",
    "offer_generation",
    "site_structure",
    "site_copywriting",
    "site_seo",
    "site_conversion",
    "site_improvement",
    "agent_prompt",
    "analytics_insights",
  ].includes(taskType)) {
    return "openai";
  }
  if ([
    "agent_config",
    "agent_permissions",
    "game_design",
    "game_mechanics",
    "game_platform_constraints",
    "game_publishing",
    "quality_gate",
  ].includes(taskType)) {
    return "claude";
  }
  if (["site_design", "design_system", "ui_layout", "component_suggestion", "game_level_design", "game_assets", "game_ui_ux"].includes(taskType)) {
    return "claude-design";
  }
  if (["game_script", "game_prototype_code", "code_generation", "code_review", "bug_fix", "refactor"].includes(taskType)) {
    return "claude-code";
  }
  return "mistral";
};

const modelForRole = (role: AIRole) => {
  if (role === "openai") {
    return readEnv("AI_GATEWAY_COPY_MODEL") || readEnv("AI_GATEWAY_OPENAI_MODEL") || readEnv("AI_GATEWAY_MODEL") || "openai/gpt-4o-mini";
  }
  if (role === "claude") {
    return readEnv("AI_GATEWAY_CLAUDE_MODEL") || readEnv("AI_GATEWAY_REASONING_MODEL") || "anthropic/claude-sonnet-4-6";
  }
  if (role === "claude-design") {
    return readEnv("AI_GATEWAY_DESIGN_MODEL") ||
      readEnv("AI_GATEWAY_VISUAL_MODEL") ||
      readEnv("AI_GATEWAY_CLAUDE_MODEL") ||
      readEnv("AI_GATEWAY_REASONING_MODEL") ||
      "anthropic/claude-sonnet-4-6";
  }
  if (role === "claude-code") {
    return readEnv("AI_GATEWAY_CODE_MODEL") || "mistral/codestral";
  }
  if (role === "mistral") {
    return readEnv("AI_GATEWAY_FAST_MODEL") || "mistral/mistral-small";
  }
  return readEnv("AI_GATEWAY_GEMINI_MODEL") || readEnv("AI_GATEWAY_BALANCED_MODEL") || "google/gemini-2.5-flash";
};

const taskMaxTokens = (taskType: AITaskType) => {
  if (taskType === "final_fusion") return 5200;
  if (["site_copywriting", "site_structure", "game_script", "game_prototype_code", "game_design"].includes(taskType)) return 2200;
  if (["site_design", "game_assets", "game_level_design", "game_ui_ux"].includes(taskType)) return 1700;
  return 1300;
};

const taskTemperature = (taskType: AITaskType) => {
  if (["site_design", "game_assets", "game_level_design", "game_ui_ux"].includes(taskType)) return 0.72;
  if (["site_copywriting", "site_conversion", "offer_generation"].includes(taskType)) return 0.62;
  if (taskType === "quality_gate") return 0.2;
  if (taskType === "final_fusion") return 0.35;
  return 0.45;
};

const normalizeForQuality = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const genericSiteCopyPatterns = [
  /lorem/i,
  /placeholder/i,
  /todo/i,
  /debug/i,
  /votre entreprise/i,
  /nom de votre/i,
  /secteur d.?activite/i,
  /services? de qualite/i,
  /solutions? sur mesure/i,
  /solutions? adaptees?/i,
  /solutions? innovantes?/i,
  /nous accompagnons nos clients/i,
  /decouvrez nos services/i,
  /bienvenue sur notre site/i,
  /presence digitale claire et credible/i,
  /site professionnel moderne/i,
  /au service de vos besoins/i,
  /repondre a vos besoins/i,
  /votre partenaire de confiance/i,
  /expertise a votre service/i,
  /qualite et professionnalisme/i,
  /accompagnement personnalise/i,
  /des services adaptes a vos besoins/i,
];

const genericCtaPatterns = [
  /en savoir plus/i,
  /decouvrir nos services/i,
  /cliquez ici/i,
  /nous contacter/i,
  /contactez-nous/i,
  /voir plus/i,
];

const concreteCtaSignals = [
  "devis",
  "reservation",
  "reserver",
  "rendez",
  "audit",
  "diagnostic",
  "bilan",
  "acheter",
  "commande",
  "disponibilite",
  "creneau",
  "appel",
  "table",
];

const isConcreteCta = (value: unknown) => {
  const normalized = normalizeForQuality(value);
  if (!normalized) return false;
  return (
    !genericCtaPatterns.some((pattern) => pattern.test(normalized)) &&
    concreteCtaSignals.some((signal) => normalized.includes(signal))
  );
};

const extractSpecificitySignals = (...values: unknown[]) =>
  values
    .flatMap((value) => normalizeForQuality(value).split(/[^a-z0-9]+/))
    .filter((word) => word.length >= 4 && !["avec", "pour", "dans", "site", "premium", "france"].includes(word));

const taskInstruction = (taskType: AITaskType, projectType: ProjectType) => {
  const instructions: Partial<Record<AITaskType, string>> = {
    brief_analysis: "Analyse le brief utilisateur, la cible, la niche, l'objectif, les contraintes et les signaux de differenciation. Extrais uniquement des decisions utiles.",
    strategy_analysis: "Produit une strategie business concise: promesse, positionnement, cible, offre, objections, preuves et priorites de conversion.",
    site_structure: "Structure le site par sections adaptees a la niche. Evite les templates generiques. Priorise parcours client, clarte et conversion.",
    site_design: "Cree une direction artistique premium: layout, mood, spacing, composants, variations visuelles par niche et signature anti-template.",
    site_copywriting: "Redige les angles de copywriting: hero, titres, sous-titres, preuves, CTA et microcopy. Le texte doit etre specifique a la niche.",
    site_seo: "Prepare SEO: title, description, H1/H2, mots-cles, SEO local, intentions de recherche et contenu utile non generique.",
    site_conversion: "Optimise conversion: CTA, friction, objections, preuves, lead capture, reassurance et prochaine action.",
    site_improvement: "Propose un patch cible sans tout regenerer. Priorise ce qui augmente clarte, premium, conversion ou specificite.",
    agent_config: "Structure l'agent: role, objectif, domaine, contexte projet, limites, ton et workflow.",
    agent_prompt: "Redige les instructions systeme de l'agent, ses exemples d'actions et son style de reponse.",
    agent_permissions: "Definis permissions sures. Toute action sensible doit rester sous validation utilisateur.",
    game_design: "Cree le concept de jeu: pitch, univers, core fantasy, public, objectif joueur et contraintes de plateforme.",
    game_research: "Prepare tendances, references utiles, objectifs pedagogiques et contraintes connues sans inventer de donnees live.",
    game_mechanics: "Definis gameplay loop, regles, progression, economie, recompenses, retention et equilibre.",
    game_level_design: "Prepare map structure, zones, flow, rythme, UI utile et assets visuels necessaires.",
    game_platform_constraints: "Verifie ce qui est faisable sur Web, Roblox Studio, UEFN ou Minecraft. Rappelle les limites et validations humaines.",
    game_script: "Genere snippets de depart adaptes a la plateforme: Luau Roblox, JSON Minecraft, Verse UEFN ou JS web game. Explique les limites.",
    game_assets: "Liste assets, UI, prompts visuels, thumbnails, ambiance et priorites de production.",
    game_ui_ux: "Prepare HUD, feedback, onboarding, menus et experience joueur lisible.",
    game_prototype_code: "Prepare le prototype web jouable ou les snippets techniques de base sans pretendre publier automatiquement.",
    game_publishing: "Cree checklist de creation/publication sans promesse de publication automatique.",
    quality_gate: "Critique la sortie attendue: coherence, manque, risques, generique, placeholders, secrets, securite et validations obligatoires.",
    final_fusion: `Fusionne toutes les sorties en un JSON ${projectType} final conforme au schema Pixelrises. Le brief utilisateur est prioritaire. Supprime contradictions, doublons, placeholders, secrets et contenu generique.`,
  };

  return instructions[taskType] ?? "Execute la tache Pixelrises demandee en JSON structure et exploitable.";
};

const roleSystemPrompt = (role: AIRole) => {
  const prompts: Record<AIRole, string> = {
    gemini:
      "Tu es l'IA generale Pixelrises: detection, enrichissement de brief, normalisation, fusion finale et coherence globale. Reponds uniquement en JSON valide.",
    openai:
      "Tu es l'IA business, strategie, copywriting, SEO et conversion de Pixelrises. Tu optimises valeur, clarte, objections et CTA sans promesse mensongere. Reponds uniquement en JSON valide.",
    claude:
      "Tu es l'IA logique et raisonnement de Pixelrises. Tu structures, critiques, detectes les incoherences et renforces la qualite. Reponds uniquement en JSON valide.",
    "claude-design":
      "Tu es l'IA design Pixelrises. Tu proposes direction artistique, UI, UX, layout, spacing, composants et variation premium sans copier de marque. Reponds uniquement en JSON valide.",
    "claude-code":
      "Tu es l'IA code Pixelrises. Tu produis snippets, architecture, securite, tests et scripts de base sans sortir du scope. Reponds uniquement en JSON valide.",
    mistral:
      "Tu es l'IA rapide Pixelrises. Tu fais classification, resume, extraction, tags et pre-analyse. Reponds uniquement en JSON valide.",
  };

  return `${prompts[role]} Ne revele jamais de secret. Ne dis jamais qu'une integration est connectee si elle ne l'est pas.`;
};

const publicTaskResult = (result: MultiAITaskResult) => ({
  taskType: result.taskType,
  role: result.role,
  model: result.model,
  success: result.success,
  output: result.output,
  error: result.error ? redactSecretsForResponse(result.error) : undefined,
});

const publicExpertLabel = (role: AIRole) => {
  const labels: Record<AIRole, string> = {
    gemini: "Expert coherence",
    openai: "Expert business",
    claude: "Expert logique",
    "claude-design": "Expert design",
    "claude-code": "Expert code",
    mistral: "Expert rapide",
  };

  return labels[role] ?? "Expert Pixelrises";
};

const getBriefValue = (
  request: OrchestratorRequest,
  keys: string[],
  fallback: string,
) => {
  const sources = [request.formData, request.brief, request.options].filter(isRecord);

  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  return fallback;
};

const buildSiteFallback = (request: OrchestratorRequest, projectId: string) => {
  const businessName = getBriefValue(request, ["businessName", "name"], "Projet Pixelrises");
  const niche = getBriefValue(request, ["niche", "businessType", "activity"], "business digital");
  const city = getBriefValue(request, ["city", "location"], "France");
  const goal = getBriefValue(request, ["goal", "objective"], "generer des leads qualifies");
  const targetAudience = getBriefValue(request, ["targetAudience", "audience"], "clients exigeants");
  const style = getBriefValue(request, ["style"], "dark gold premium");
  const tier = getBriefValue(request, ["tier", "level"], "premium");
  const offer = getBriefValue(request, ["offer", "services", "description"], request.prompt || "Offre claire et professionnelle");
  const cta = goal.toLowerCase().includes("vendre") ? "Acheter maintenant" : "Demander un devis";

  return {
    meta: {
      projectId,
      projectType: "site",
      businessName,
      niche,
      goal,
      targetAudience,
      city,
      tier,
      style,
      language: "fr",
    },
    strategy: {
      mainPromise: `${businessName} transforme une idee en presence digitale claire et credible.`,
      marketingAngle: `Positionnement ${niche} premium, simple a comprendre et oriente conversion.`,
      conversionGoal: goal,
      primaryCTA: cta,
      trustStrategy: "Hero clair, preuves visibles, FAQ et contact sans friction.",
      objectionsToHandle: ["Manque de confiance", "Prix peu clair", "Doute sur le resultat"],
    },
    brand: {
      name: businessName,
      tagline: "Une presence professionnelle, claire et prete a convertir.",
      colors: ["#050505", "#F5C542", "#FFFFFF"],
      fonts: ["Sora", "Inter"],
      tone: "professionnel, direct, rassurant",
    },
    pages: [
      {
        slug: "/",
        title: businessName,
        sections: [
          {
            id: "hero",
            type: "hero",
            title: `${businessName}, la presence premium pour ${niche}`,
            subtitle: `Une experience pensee pour rassurer, expliquer l'offre et convertir a ${city}.`,
            content: offer,
            cta: { label: cta, action: "#contact" },
            items: ["Promesse claire", "CTA visible", "Preuves immediates"],
            media: [],
            layout: "split-premium",
            conversionRole: "clarifier et convertir",
          },
          {
            id: "services",
            type: "services",
            title: "Services essentiels",
            subtitle: "Une offre structuree pour comprendre la valeur rapidement.",
            content: "Chaque service met en avant un resultat concret et mesurable.",
            cta: { label: "Voir les offres", action: "#services" },
            items: ["Audit", "Accompagnement", "Optimisation"],
            media: [],
            layout: "cards",
            conversionRole: "presenter la valeur",
          },
          {
            id: "proof",
            type: "proof",
            title: "Pourquoi faire confiance",
            subtitle: "Des preuves visibles pour reduire les hesitations.",
            content: "Methode claire, resultats, avis et garanties renforcent la credibilite.",
            cta: { label: "Voir la methode", action: "#method" },
            items: ["Methode transparente", "Suivi personnalise", "Resultats concrets"],
            media: [],
            layout: "trust-grid",
            conversionRole: "rassurer",
          },
          {
            id: "faq",
            type: "faq",
            title: "Questions frequentes",
            subtitle: "Reponses simples aux objections avant le contact.",
            content: "La FAQ prepare le visiteur a passer a l'action.",
            cta: { label: "Poser une question", action: "#contact" },
            items: ["Delais", "Tarifs", "Process", "Garanties"],
            media: [],
            layout: "accordion",
            conversionRole: "lever les freins",
          },
          {
            id: "contact",
            type: "cta",
            title: "Pret a lancer une presence plus credible ?",
            subtitle: "La prochaine etape est simple et sans engagement.",
            content: "Demandez un devis ou un audit pour savoir quoi ameliorer en priorite.",
            cta: { label: cta, action: "mailto:contact@example.com" },
            items: ["Reponse rapide", "Conseil clair", "Validation utilisateur"],
            media: [],
            layout: "centered",
            conversionRole: "capturer le lead",
          },
        ],
      },
    ],
    seo: {
      title: `${businessName} | ${niche} premium a ${city}`,
      description: `${businessName} aide a obtenir une presence professionnelle claire, credible et orientee conversion.`,
      keywords: [niche, businessName, "site professionnel", "conversion"],
      localKeywords: [city, `${niche} ${city}`],
      h1: `${businessName}, ${niche} premium`,
      h2: ["Services essentiels", "Pourquoi faire confiance", "Questions frequentes"],
    },
    business: {
      offer,
      valueProposition: "Clarte, credibilite et conversion dans une base digitale solide.",
      pricingSuggestion: "Afficher une fourchette ou un premier pack pour reduire la friction.",
      leadCapture: "Formulaire, email ou prise de rendez-vous.",
      trustElements: ["Avis", "Methode", "FAQ", "Garanties"],
    },
    conversion: {
      primaryGoal: goal,
      ctaStrategy: "CTA principal dans le hero, rappel apres preuves et CTA final.",
      objections: ["Est-ce fiable ?", "Combien ca coute ?", "Quel resultat attendre ?"],
      proofElements: ["Avis", "Avant/apres", "Methode", "Garanties"],
      recommendedSections: ["Hero", "Services", "Preuves", "FAQ", "CTA final"],
    },
    design: {
      style,
      layoutDirection: "cartes sobres, contraste fort, sections aeriennes",
      spacing: "genereux",
      radius: "large",
      visualMood: "premium, moderne, rassurant",
      components: ["Hero", "ServiceCard", "ProofCard", "FAQ", "CTA"],
    },
    recommendations: [
      {
        priority: "high",
        title: "Ajouter une preuve sociale",
        description: "Un temoignage ou resultat reduit les hesitations avant le contact.",
        action: "Ajouter une section avis",
      },
      {
        priority: "medium",
        title: "Connecter les analytics",
        description: "Suivre les CTA aide a savoir quoi ameliorer apres publication.",
        action: "Preparer Analytics",
      },
    ],
  };
};

const buildAgentFallback = (request: OrchestratorRequest, projectId: string) => {
  const name = getBriefValue(request, ["name", "agentName"], "Agent Pixelrises");
  const role = getBriefValue(request, ["role", "type"], "Assistant business");
  const goal = getBriefValue(request, ["goal", "objective"], "Aider a developper le projet digital");
  const domain = getBriefValue(request, ["domain", "niche"], "Projet digital");
  const now = nowIso();

  return {
    id: projectId,
    name,
    role,
    goal,
    tone: getBriefValue(request, ["tone"], "Clair, direct, professionnel"),
    domain,
    level: "simple",
    instructions:
      "Analyse le brief, propose des recommandations concretes et demande validation avant toute action sensible.",
    avoid:
      "Ne jamais publier, envoyer, supprimer, modifier definitivement ou connecter un outil sans validation utilisateur.",
    projectContext: {
      projectId,
      projectType: "agent",
      businessName: getBriefValue(request, ["businessName"], "Projet Pixelrises"),
      niche: domain,
      offer: getBriefValue(request, ["offer"], request.prompt || "Agent personnalise"),
      goal,
    },
    permissions: {
      readProject: true,
      suggestChanges: true,
      editWithApproval: false,
      publishWithApproval: false,
      accessAnalytics: false,
      useIntegrations: false,
    },
    createdAt: now,
    updatedAt: now,
  };
};

const buildGameFallback = (request: OrchestratorRequest, projectId: string) => {
  const platform = getBriefValue(request, ["platform"], "Roblox");
  const gameType = getBriefValue(request, ["gameType", "type"], "Adventure");
  const title = getBriefValue(request, ["title", "gameName"], "Pixel Quest");
  const theme = getBriefValue(request, ["theme"], "monde futuriste premium");

  return {
    meta: {
      projectId,
      projectType: "game",
      platform,
      gameType,
      title,
      targetAudience: getBriefValue(request, ["targetAudience"], "joueurs casual"),
      difficulty: getBriefValue(request, ["difficulty"], "progressive"),
      mode: "both",
    },
    concept: {
      pitch: `${title} est un ${gameType} beta ou le joueur progresse par objectifs courts et recompenses lisibles.`,
      theme,
      world: "Un hub central relie des zones de difficulte croissante.",
      playerGoal: "Debloquer les zones, maitriser les mecaniques et obtenir les recompenses finales.",
      coreFantasy: "Partir de zero et devenir le meilleur joueur du serveur.",
    },
    gameplay: {
      loop: "Entrer dans une zone, reussir un defi, gagner une recompense, ameliorer son acces, recommencer plus loin.",
      rules: ["Objectifs lisibles", "Echec sans frustration", "Progression sauvegardee"],
      mechanics: ["Checkpoints", "Defis courts", "Recompenses", "Deblocage de zones"],
      progression: ["Tutoriel", "Zone facile", "Zone avancee", "Defi final"],
      rewards: ["Badges", "Cosmetiques", "Monnaie douce", "Acces zones"],
      economy: ["Recompenses gagnees en jeu", "Options premium non obligatoires"],
    },
    levelDesign: {
      mapStructure: "Hub central avec quatre branches thematiques.",
      zones: ["Accueil", "Zone test", "Zone expert", "Zone finale"],
      objectives: ["Comprendre", "Reussir", "Optimiser", "Partager"],
      flow: "Le joueur revient souvent au hub pour comprendre sa progression.",
    },
    scripts: [
      {
        language: platform === "Fortnite / UEFN" ? "Verse" : platform === "Minecraft" ? "JSON" : "Luau",
        name: "starter-script",
        purpose: "Base technique indicative pour demarrer le prototype.",
        code: "-- Snippet beta a adapter dans l'editeur officiel de la plateforme.",
        explanation:
          "Snippet beta a adapter et tester. Pixelrises ne publie rien automatiquement.",
      },
    ],
    assets: [
      {
        type: "UI",
        name: "HUD progression",
        description: "Barre claire avec score, zone active et objectif suivant.",
        prompt: `Interface ${platform} premium, HUD lisible, dark gold, ${gameType}.`,
      },
    ],
    monetization: {
      strategy: "Monetisation douce, optionnelle, jamais pay-to-win.",
      items: ["Cosmetiques", "Boost confort limite", "Pass soutien"],
      passes: platform === "Roblox" ? ["VIP cosmetique", "Acces lounge"] : [],
      ethicalNotes: "Les achats ne doivent pas bloquer la progression principale.",
    },
    publishing: {
      checklist: [
        "Tester le gameplay dans l'outil officiel.",
        "Remplacer les assets placeholders par des assets valides.",
        "Verifier regles, droits, securite et performance.",
        "Faire tester par un petit groupe avant publication.",
      ],
      warnings: [
        "Pixelrises ne publie pas automatiquement sur Roblox, Minecraft ou Fortnite.",
        "Les snippets sont des bases de travail a adapter et tester.",
      ],
      nextSteps: ["Creer une premiere map", "Tester le script", "Iterer sur la boucle"],
    },
  };
};

const fallbackByType = (request: OrchestratorRequest, projectId: string) => {
  if (request.projectType === "agent") return buildAgentFallback(request, projectId);
  if (request.projectType === "game") return buildGameFallback(request, projectId);
  return buildSiteFallback(request, projectId);
};

const mergeWithFallback = (fallback: unknown, candidate: unknown): unknown => {
  if (Array.isArray(fallback)) {
    if (!Array.isArray(candidate) || candidate.length === 0) return fallback;
    const itemFallback = fallback[0];
    if (isRecord(itemFallback)) {
      return candidate
        .filter(isRecord)
        .map((item) => mergeWithFallback(itemFallback, item))
        .filter(Boolean);
    }
    return candidate.map(String).filter(Boolean);
  }

  if (isRecord(fallback)) {
    const candidateRecord = isRecord(candidate) ? candidate : {};
    return Object.fromEntries(
      Object.entries(fallback).map(([key, fallbackValue]) => [
        key,
        mergeWithFallback(fallbackValue, candidateRecord[key]),
      ]),
    );
  }

  if (typeof fallback === "string") return toText(candidate, fallback);
  if (typeof fallback === "number") return typeof candidate === "number" ? candidate : fallback;
  if (typeof fallback === "boolean") return typeof candidate === "boolean" ? candidate : fallback;

  return candidate ?? fallback;
};

const extractJsonObject = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const source = fenced || text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
};

const unwrapOutput = (value: unknown) => {
  if (!isRecord(value)) return {};
  for (const key of ["normalizedOutput", "project", "site", "agent", "game", "data"]) {
    const nested = value[key];
    if (isRecord(nested)) return nested;
  }
  return value;
};

const normalizeOutput = (
  request: OrchestratorRequest,
  rawOutput: unknown,
  projectId: string,
) => {
  const fallback = fallbackByType(request, projectId);
  const merged = mergeWithFallback(fallback, unwrapOutput(rawOutput));
  const normalized = sanitizeTextDeep(merged) as Record<string, unknown>;

  if (request.projectType === "site" && isRecord(normalized.meta)) {
    normalized.meta.projectId = projectId;
    normalized.meta.projectType = "site";
    normalized.meta.language = "fr";
  }

  if (request.projectType === "agent") {
    normalized.id = projectId;
    normalized.permissions = {
      readProject: true,
      suggestChanges: true,
      editWithApproval: false,
      publishWithApproval: false,
      accessAnalytics: false,
      useIntegrations: false,
    };
  }

  if (request.projectType === "game" && isRecord(normalized.meta)) {
    normalized.meta.projectId = projectId;
    normalized.meta.projectType = "game";
  }

  return normalized;
};

const qualityGate = (projectType: ProjectType, output: Record<string, unknown>): QualityGateResult => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const serialized = JSON.stringify(output).toLowerCase();

  if (/api[_-]?key|bearer\s+[a-z0-9._-]+|sk-[a-z0-9]|aiza[0-9a-z_-]+/i.test(serialized)) {
    issues.push("Une valeur ressemblant a un secret a ete detectee.");
  }

  if (projectType === "site") {
    const meta = isRecord(output.meta) ? output.meta : {};
    const pages = Array.isArray(output.pages) ? output.pages : [];
    const firstPage = isRecord(pages[0]) ? pages[0] : {};
    const sections = Array.isArray(firstPage.sections) ? firstPage.sections : [];
    const hero = sections.find((section) => isRecord(section) && section.type === "hero") ?? sections[0];
    const strategy = isRecord(output.strategy) ? output.strategy : {};
    const seo = isRecord(output.seo) ? output.seo : {};
    const business = isRecord(output.business) ? output.business : {};
    const conversion = isRecord(output.conversion) ? output.conversion : {};
    const design = isRecord(output.design) ? output.design : {};
    const sectionLayouts = sections
      .map((section) => (isRecord(section) ? toText(section.layout, "") : ""))
      .filter(Boolean);
    const uniqueLayouts = new Set(sectionLayouts);
    const normalizedSerialized = normalizeForQuality(serialized);
    const hasGenericSiteCopy = genericSiteCopyPatterns.some(
      (pattern) => pattern.test(serialized) || pattern.test(normalizedSerialized),
    );
    const specificitySignals = extractSpecificitySignals(
      meta.businessName,
      meta.niche,
      meta.city,
      meta.goal,
      meta.targetAudience,
      business.offer,
      conversion.primaryGoal,
    );
    const specificityHitCount = new Set(
      specificitySignals.filter((signal) => normalizedSerialized.includes(signal)),
    ).size;
    const sectionTitles = sections
      .map((section) => (isRecord(section) ? normalizeForQuality(section.title) : ""))
      .filter(Boolean);
    const repeatedSectionTitles = sectionTitles.length - new Set(sectionTitles).size;
    const ctaLabels = [
      strategy.primaryCTA,
      ...sections.map((section) => (isRecord(section) && isRecord(section.cta) ? section.cta.label : "")),
    ];
    const hasSpecificCta = ctaLabels.some(isConcreteCta);

    if (!toText(meta.businessName, "").trim()) issues.push("businessName manquant.");
    if (!isRecord(hero) || !toText(hero.title, "").trim()) issues.push("Hero manquant ou trop vide.");
    if (!toText(strategy.primaryCTA, "").trim()) issues.push("CTA principal manquant.");
    if (!hasSpecificCta) issues.push("CTA trop vague: demander une action concrete adaptee a l'objectif.");
    if (!toText(seo.title, "").trim() || !toText(seo.description, "").trim()) issues.push("SEO incomplet.");
    if (sections.length < 5) recommendations.push("Ajouter au moins cinq sections pour renforcer la conversion.");
    if (hasGenericSiteCopy) issues.push("Copie trop generique ou reste de template detecte.");
    if (sections.length >= 4 && uniqueLayouts.size < Math.min(4, sections.length)) {
      issues.push("Layouts trop similaires: varier les compositions selon la niche.");
    }
    if (specificityHitCount < Math.min(3, Math.max(1, specificitySignals.length))) {
      issues.push("Sortie trop peu specifique au business, a la ville, a la niche ou a l'objectif.");
    }
    if (!toText(design.layoutDirection, "").trim() || !toText(design.visualMood, "").trim()) {
      recommendations.push("Completer la direction design pour eviter une preview interchangeable.");
    }
    if (repeatedSectionTitles > 0) {
      recommendations.push("Eviter les titres de sections repetes dans la meme page.");
    }
  }

  if (projectType === "agent") {
    const permissions = isRecord(output.permissions) ? output.permissions : {};
    if (!toText(output.name, "").trim()) issues.push("Nom d'agent manquant.");
    if (!toText(output.role, "").trim()) issues.push("Role d'agent manquant.");
    if (!toText(output.goal, "").trim()) issues.push("Objectif d'agent manquant.");
    if (!toText(output.instructions, "").trim()) issues.push("Instructions d'agent manquantes.");
    if (permissions.editWithApproval === true || permissions.publishWithApproval === true) {
      issues.push("Permissions trop ouvertes: les actions sensibles doivent rester sous validation.");
    }
  }

  if (projectType === "game") {
    const meta = isRecord(output.meta) ? output.meta : {};
    const gameplay = isRecord(output.gameplay) ? output.gameplay : {};
    const publishing = isRecord(output.publishing) ? output.publishing : {};
    const scripts = Array.isArray(output.scripts) ? output.scripts : [];
    const warnings = toArray(publishing.warnings, []);

    if (!toText(meta.platform, "").trim()) issues.push("Plateforme de jeu manquante.");
    if (!toText(meta.gameType, "").trim()) issues.push("Type de jeu manquant.");
    if (!toText(gameplay.loop, "").trim()) issues.push("Gameplay loop manquante.");
    if (scripts.length === 0) issues.push("Scripts ou snippets manquants.");
    if (!Array.isArray(publishing.checklist) || publishing.checklist.length === 0) {
      issues.push("Checklist de creation/publication manquante.");
    }
    if (!warnings.some((warning) => warning.toLowerCase().includes("publie"))) {
      issues.push("Le Game Builder doit preciser qu'il ne publie pas automatiquement.");
    }
  }

  if (serialized.includes("placeholder") || serialized.includes("lorem") || serialized.includes("debug")) {
    issues.push("La sortie contient un placeholder, lorem ou debug visible.");
  }

  const score = Math.max(0, Math.min(100, 100 - issues.length * 18 - recommendations.length * 5));
  return {
    valid: issues.length === 0,
    score,
    issues,
    fixes: issues.map((issue) => `Corriger: ${issue}`),
    recommendations,
  };
};

const schemaInstruction = (projectType: ProjectType) => {
  if (projectType === "agent") {
    return "Retourne un JSON CustomAgentProject avec id, name, role, goal, tone, domain, level, instructions, avoid, projectContext, permissions, createdAt, updatedAt. Permissions sensibles false par defaut.";
  }
  if (projectType === "game") {
    return "Retourne un JSON GameProject avec meta, concept, gameplay, levelDesign, scripts, assets, monetization, publishing. Precise que Pixelrises ne publie jamais automatiquement.";
  }
  return "Retourne un JSON NormalizedSiteProject avec meta, strategy, brand, pages[0].sections, seo, business, conversion, design, recommendations.";
};

const callGatewayTask = async (
  request: OrchestratorRequest,
  projectId: string,
  taskType: AITaskType,
  previousResults: MultiAITaskResult[] = [],
) => {
  const role = roleForTask(taskType);
  const model = modelForRole(role);
  const prompt = request.prompt?.trim() || "Creer un projet digital Pixelrises.";
  const safeRequest = {
    projectType: request.projectType,
    mode: request.mode,
    prompt,
    formData: request.formData,
    brief: request.brief,
    options: request.options,
  };
  const startedAt = performance.now();

  const response = await createAIChatCompletion({
    model,
    stream: false,
    temperature: taskTemperature(taskType),
    max_tokens: taskMaxTokens(taskType),
    messages: [
      {
        role: "system",
        content: roleSystemPrompt(role),
      },
      {
        role: "user",
        content: JSON.stringify({
          taskType,
          role,
          instruction: taskInstruction(taskType, request.projectType ?? "site"),
          finalSchema: taskType === "final_fusion" ? schemaInstruction(request.projectType ?? "site") : undefined,
          projectId,
          request: safeRequest,
          previousResults: taskType === "final_fusion" ? previousResults.map(publicTaskResult) : undefined,
        }),
      },
    ],
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`AI Gateway error ${response.status}: ${message.slice(0, 220)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const parsed = extractJsonObject(typeof content === "string" ? content : JSON.stringify(content ?? {}));

  if (!parsed) {
    throw new Error("La reponse IA n'est pas un JSON exploitable.");
  }

  return {
    taskType,
    role,
    model: String(payload?.model ?? model),
    provider: getAIProviderName(),
    usage: (payload?.usage ?? {}) as ChatUsage,
    output: parsed,
    durationMs: Math.round(performance.now() - startedAt),
  };
};

const buildTaskFallback = (
  request: OrchestratorRequest,
  taskType: AITaskType,
  error: string,
): MultiAITaskResult => {
  const role = roleForTask(taskType);
  return {
    taskType,
    role,
    model: "pixelrises-task-fallback",
    success: true,
    output: {
      taskType,
      role,
      summary: `Fallback structure pour ${taskType}.`,
      decisions: [],
      warnings: [error],
      request: {
        projectType: request.projectType,
        mode: request.mode,
      },
    },
    usage: {},
    durationMs: 0,
    error,
  };
};

const aggregateUsage = (results: Array<{ usage?: ChatUsage }>): ChatUsage => {
  const totals = results.reduce(
    (acc, result) => {
      acc.prompt_tokens += result.usage?.prompt_tokens ?? 0;
      acc.completion_tokens += result.usage?.completion_tokens ?? 0;
      acc.total_tokens += result.usage?.total_tokens ?? ((result.usage?.prompt_tokens ?? 0) + (result.usage?.completion_tokens ?? 0));
      return acc;
    },
    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  );

  return totals.total_tokens > 0 ? totals : {};
};

const compactModelTrace = (results: MultiAITaskResult[]) => {
  const byTask = results.map((result) => `${result.taskType}:${result.model}`);
  const trace = Array.from(new Set(byTask)).join(" | ");
  return trace.length > 900 ? `${trace.slice(0, 897)}...` : trace;
};

const runMultiAI = async (
  request: OrchestratorRequest,
  projectId: string,
  allowMockFallback: boolean,
): Promise<MultiAIExecution> => {
  const projectType = request.projectType ?? "site";
  const mode = request.mode ?? "build";
  const plan = taskPlans[projectType][mode] ?? taskPlans[projectType].build;
  const analysisTasks = plan.filter((taskType) => taskType !== "final_fusion");
  const errors: string[] = [];

  const taskResults = await Promise.all(
    analysisTasks.map(async (taskType) => {
      try {
        const generated = await callGatewayTask(request, projectId, taskType);
        return {
          taskType,
          role: generated.role,
          model: generated.model,
          success: true,
          output: generated.output,
          usage: generated.usage,
          durationMs: generated.durationMs,
        } satisfies MultiAITaskResult;
      } catch (error) {
        const message = redactSecretsForResponse(error instanceof Error ? error.message : `Echec task ${taskType}.`);
        errors.push(`${taskType}: ${message}`);
        if (!allowMockFallback) throw error;
        return buildTaskFallback(request, taskType, message);
      }
    }),
  );

  let fusion: MultiAITaskResult;
  try {
    const generated = await callGatewayTask(request, projectId, "final_fusion", taskResults);
    fusion = {
      taskType: "final_fusion",
      role: generated.role,
      model: generated.model,
      success: true,
      output: generated.output,
      usage: generated.usage,
      durationMs: generated.durationMs,
    };
  } catch (error) {
    const message = redactSecretsForResponse(error instanceof Error ? error.message : "Echec final_fusion.");
    errors.push(`final_fusion: ${message}`);
    if (!allowMockFallback) throw error;
    fusion = {
      ...buildTaskFallback(request, "final_fusion", message),
      output: fallbackByType(request, projectId),
    };
  }

  const allResults = [...taskResults, fusion];
  const realResults = allResults.filter((result) => result.model !== "pixelrises-task-fallback");

  return {
    output: fusion.output,
    provider: realResults.length ? "vercel-gateway" : "mock",
    model: realResults.length ? `multi-ai:${compactModelTrace(realResults)}` : "pixelrises-dev-fallback",
    usage: aggregateUsage(allResults),
    source: realResults.length ? "real" : "mock-fallback",
    taskResults: allResults,
    errors,
  };
};

const estimateCost = (usage: ChatUsage) => {
  const totalTokens = usage.total_tokens ?? ((usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0));
  return Number(((totalTokens / 1_000_000) * 0.5).toFixed(6));
};

const getAuthenticatedUserId = async (request: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY")?.trim() ||
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim() ||
    Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")?.trim();
  const authorization = request.headers.get("Authorization") ?? "";

  if (!supabaseUrl || !anonKey || !authorization) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
};

const projectTitle = (projectType: ProjectType, output: Record<string, unknown>) => {
  if (projectType === "agent") return toText(output.name, "Agent Pixelrises");
  if (projectType === "game") {
    const meta = isRecord(output.meta) ? output.meta : {};
    return toText(meta.title, "Jeu Pixelrises");
  }
  const meta = isRecord(output.meta) ? output.meta : {};
  return toText(meta.businessName, "Projet Pixelrises");
};

const persistResult = async (params: {
  request: OrchestratorRequest;
  output: Record<string, unknown>;
  quality: QualityGateResult;
  userId: string | null;
  provider: string;
  model: string;
  usage: ChatUsage;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}): Promise<PersistResult> => {
  const errors: string[] = [];
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const userId = params.request.userId || params.userId;

  if (!supabaseUrl || !serviceRoleKey || !userId) {
    return { persisted: false, errors: ["Supabase persistence skipped: missing server config or user session."] };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const projectType = params.request.projectType ?? "site";
  const projectId =
    projectType === "agent"
      ? toText(params.output.id, makeId())
      : toText(isRecord(params.output.meta) ? params.output.meta.projectId : "", makeId());
  const generationId = makeId();
  const status: ProjectStatus = params.request.mode === "plan" ? "planned" : params.request.mode === "improve" ? "improved" : "generated";

  const projectRow = {
    id: projectId,
    user_id: userId,
    type: projectType,
    name: projectTitle(projectType, params.output),
    status,
    score: params.quality.score,
    data: params.output,
  };

  const { error: projectError } = await supabase.from("projects").upsert(projectRow);
  if (projectError) errors.push(redactSecretsForResponse(projectError.message));

  const { error: generationError } = await supabase.from("generations").insert({
    id: generationId,
    project_id: projectId,
    user_id: userId,
    provider: params.provider,
    model: params.model,
    mode: params.request.mode ?? "build",
    input: {
      projectType,
      mode: params.request.mode ?? "build",
      prompt: params.request.prompt,
      formData: params.request.formData,
      brief: params.request.brief,
      options: params.request.options,
    },
    output: params.output,
    quality_score: params.quality.score,
    status: params.success ? "success" : "error",
    error_message: params.errorMessage ?? null,
  });
  if (generationError) errors.push(redactSecretsForResponse(generationError.message));

  await supabase.from("project_versions").insert({
    project_id: projectId,
    version_number: 1,
    data: params.output,
    change_summary: "Generation Pixelrises V2",
  });

  if (projectType === "agent") {
    await supabase.from("agents").upsert({
      id: projectId,
      user_id: userId,
      project_id: projectId,
      name: toText(params.output.name, "Agent Pixelrises"),
      role: toText(params.output.role, "Assistant"),
      goal: toText(params.output.goal, "Developper le projet"),
      config: params.output,
      permissions: isRecord(params.output.permissions) ? params.output.permissions : {},
    });
  }

  if (projectType === "game") {
    const meta = isRecord(params.output.meta) ? params.output.meta : {};
    await supabase.from("games").upsert({
      id: projectId,
      user_id: userId,
      project_id: projectId,
      platform: toText(meta.platform, "Roblox"),
      game_type: toText(meta.gameType, "Adventure"),
      title: toText(meta.title, "Jeu Pixelrises"),
      data: params.output,
    });
  }

  await supabase.from("ai_usage_logs").insert({
    user_id: userId,
    project_id: projectId,
    generation_id: generationId,
    provider: params.provider,
    model: params.model,
    task_type: `${projectType}_${params.request.mode ?? "build"}`,
    estimated_tokens: params.usage.total_tokens ?? ((params.usage.prompt_tokens ?? 0) + (params.usage.completion_tokens ?? 0)),
    estimated_cost: estimateCost(params.usage),
    duration_ms: params.durationMs,
    success: params.success,
  });

  return {
    persisted: errors.length === 0,
    projectId,
    generationId,
    errors: redactErrorList(errors),
  };
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = performance.now();
  const errors: string[] = [];

  try {
    const body = (await request.json()) as OrchestratorRequest;
    const projectType = body.projectType ?? "site";
    const mode = body.mode ?? "build";

    if (!["site", "agent", "game"].includes(projectType)) {
      return new Response(
        JSON.stringify({ success: false, errors: ["projectType invalide."] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalizedRequest: OrchestratorRequest = {
      ...body,
      projectType,
      mode,
      prompt: body.prompt?.trim() || "Creer un projet Pixelrises V2.",
    };
    const projectId = makeId();
    const allowMockFallback = (Deno.env.get("AI_ENABLE_MOCK") ?? "true").toLowerCase() !== "false";
    let execution: MultiAIExecution;

    try {
      execution = await runMultiAI(normalizedRequest, projectId, allowMockFallback);
    } catch (error) {
      const message = redactSecretsForResponse(error instanceof Error ? error.message : "Generation IA indisponible.");
      errors.push(message);

      if (!allowMockFallback) {
        return new Response(
          JSON.stringify({ success: false, projectType, mode, errors: redactErrorList(errors) }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      execution = {
        output: fallbackByType(normalizedRequest, projectId),
        provider: "mock",
        model: "pixelrises-dev-fallback",
        usage: {},
        source: "mock-fallback",
        taskResults: [],
        errors: [message],
      };
    }

    const normalizedOutput = normalizeOutput(normalizedRequest, execution.output, projectId);
    const qualityGateResult = qualityGate(projectType, normalizedOutput);
    const userId = await getAuthenticatedUserId(request);
    const durationMs = Math.round(performance.now() - startedAt);
    const qualityErrors = qualityGateResult.valid ? [] : qualityGateResult.issues;
    const persistence = qualityGateResult.valid
      ? await persistResult({
          request: normalizedRequest,
          output: normalizedOutput,
          quality: qualityGateResult,
          userId,
          provider: execution.provider,
          model: execution.model,
          usage: execution.usage,
          durationMs,
          success: [...errors, ...execution.errors].length === 0,
          errorMessage: redactSecretsForResponse([...errors, ...execution.errors, ...qualityErrors][0] ?? ""),
        })
      : {
          persisted: false,
          projectId,
          generationId: undefined,
          errors: ["Supabase save blocked: Quality Gate failed."],
        };

    return new Response(
      JSON.stringify({
        success: qualityGateResult.valid,
        projectType,
        mode,
        normalizedOutput,
        qualityGateResult,
        generationId: persistence.generationId,
        projectId: persistence.projectId ?? projectId,
        persisted: persistence.persisted,
        source: execution.source,
        routingTrace: execution.taskResults.map(({ taskType, role, success, error }) => ({
          taskType,
          role: publicExpertLabel(role),
          success,
          error: error ? redactSecretsForResponse(error) : undefined,
        })),
        errors: redactErrorList([...errors, ...execution.errors, ...qualityErrors, ...persistence.errors]),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = redactSecretsForResponse(error instanceof Error ? error.message : "Erreur inconnue.");
    return new Response(
      JSON.stringify({
        success: false,
        errors: [message],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
