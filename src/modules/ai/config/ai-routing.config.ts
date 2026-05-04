import type { AIExecutionMode, AIProviderId, AITaskType } from "../schemas/ai-task.schema";

export type AIRoutingRule = {
  taskType: AITaskType;
  provider: AIProviderId;
  fallbackProvider: AIProviderId;
  schema: string;
  reason: string;
};

export const globalFallbackChain: AIProviderId[] = ["gemini", "mistral", "mock"];

export const defaultRoutingRules: Record<AITaskType, AIRoutingRule> = {
  project_type_detection: {
    taskType: "project_type_detection",
    provider: "gemini",
    fallbackProvider: "mock",
    schema: "project-type-detection",
    reason: "Gemini sert de moteur general pour detecter rapidement le type de projet.",
  },
  brief_analysis: {
    taskType: "brief_analysis",
    provider: "gemini",
    fallbackProvider: "mock",
    schema: "brief-analysis",
    reason: "Gemini enrichit et normalise le brief initial.",
  },
  strategy_analysis: {
    taskType: "strategy_analysis",
    provider: "openai",
    fallbackProvider: "gemini",
    schema: "strategy-analysis",
    reason: "OpenAI est reserve a la strategie business, conversion et clarte commerciale.",
  },
  business_positioning: {
    taskType: "business_positioning",
    provider: "openai",
    fallbackProvider: "gemini",
    schema: "business-positioning",
    reason: "OpenAI optimise positionnement, promesse, objections et offre.",
  },
  offer_generation: {
    taskType: "offer_generation",
    provider: "openai",
    fallbackProvider: "gemini",
    schema: "offer-generation",
    reason: "OpenAI genere des offres claires et orientee conversion.",
  },
  site_structure: {
    taskType: "site_structure",
    provider: "claude",
    fallbackProvider: "gemini",
    schema: "site-structure",
    reason: "Claude gere la logique, la structure et la coherence du site.",
  },
  site_copywriting: {
    taskType: "site_copywriting",
    provider: "openai",
    fallbackProvider: "gemini",
    schema: "site-copywriting",
    reason: "OpenAI gere les textes, CTA, SEO et objections commerciales.",
  },
  site_design: {
    taskType: "site_design",
    provider: "cloud-design",
    fallbackProvider: "gemini",
    schema: "site-design",
    reason: "Cloud Design gere direction artistique, UI, spacing et coherence visuelle.",
  },
  site_seo: {
    taskType: "site_seo",
    provider: "openai",
    fallbackProvider: "gemini",
    schema: "site-seo",
    reason: "OpenAI gere SEO, titres, descriptions et mots-cles.",
  },
  site_conversion: {
    taskType: "site_conversion",
    provider: "openai",
    fallbackProvider: "gemini",
    schema: "site-conversion",
    reason: "OpenAI optimise CTA, preuves, objections et tunnel de contact.",
  },
  site_improvement: {
    taskType: "site_improvement",
    provider: "claude",
    fallbackProvider: "gemini",
    schema: "site-improvement",
    reason: "Claude analyse les changements cibles sans regenerer tout le projet.",
  },
  design_system: {
    taskType: "design_system",
    provider: "cloud-design",
    fallbackProvider: "gemini",
    schema: "design-system",
    reason: "Cloud Design prepare tokens, composants, layout et hierarchie UI.",
  },
  ui_layout: {
    taskType: "ui_layout",
    provider: "cloud-design",
    fallbackProvider: "gemini",
    schema: "ui-layout",
    reason: "Cloud Design propose des interfaces premium adaptees au contexte.",
  },
  component_suggestion: {
    taskType: "component_suggestion",
    provider: "cloud-design",
    fallbackProvider: "gemini",
    schema: "component-suggestion",
    reason: "Cloud Design suggere composants, sections et patterns UI.",
  },
  agent_config: {
    taskType: "agent_config",
    provider: "claude",
    fallbackProvider: "gemini",
    schema: "agent-config",
    reason: "Claude structure role, contexte, limites et logique de l'agent.",
  },
  agent_prompt: {
    taskType: "agent_prompt",
    provider: "openai",
    fallbackProvider: "gemini",
    schema: "agent-prompt",
    reason: "OpenAI redige les instructions, ton et reponses attendues.",
  },
  agent_permissions: {
    taskType: "agent_permissions",
    provider: "claude",
    fallbackProvider: "mock",
    schema: "agent-permissions",
    reason: "Claude verifie les permissions et actions sensibles.",
  },
  game_design: {
    taskType: "game_design",
    provider: "claude",
    fallbackProvider: "gemini",
    schema: "game-design",
    reason: "Claude construit concept, contraintes, loop et coherence gameplay.",
  },
  game_mechanics: {
    taskType: "game_mechanics",
    provider: "claude",
    fallbackProvider: "gemini",
    schema: "game-mechanics",
    reason: "Claude detaille mecaniques, progression, economie et regles.",
  },
  game_level_design: {
    taskType: "game_level_design",
    provider: "cloud-design",
    fallbackProvider: "gemini",
    schema: "game-level-design",
    reason: "Cloud Design gere map structure, zones, flow et assets visuels.",
  },
  game_script: {
    taskType: "game_script",
    provider: "cloud-code",
    fallbackProvider: "gemini",
    schema: "game-script",
    reason: "Cloud Code prepare snippets Luau, Verse, JSON Minecraft ou JS.",
  },
  game_assets: {
    taskType: "game_assets",
    provider: "cloud-design",
    fallbackProvider: "gemini",
    schema: "game-assets",
    reason: "Cloud Design liste assets, prompts visuels, UI et thumbnails.",
  },
  game_publishing: {
    taskType: "game_publishing",
    provider: "claude",
    fallbackProvider: "mock",
    schema: "game-publishing",
    reason: "Claude prepare checklist de publication sans promesse automatique.",
  },
  integration_mapping: {
    taskType: "integration_mapping",
    provider: "gemini",
    fallbackProvider: "mock",
    schema: "integration-mapping",
    reason: "Gemini mappe integration, permissions et prochaine etape.",
  },
  dashboard_recommendations: {
    taskType: "dashboard_recommendations",
    provider: "gemini",
    fallbackProvider: "mistral",
    schema: "dashboard-recommendations",
    reason: "Gemini transforme les signaux en recommandations actionnables.",
  },
  analytics_insights: {
    taskType: "analytics_insights",
    provider: "openai",
    fallbackProvider: "mistral",
    schema: "analytics-insights",
    reason: "OpenAI transforme les donnees en decisions business.",
  },
  code_generation: {
    taskType: "code_generation",
    provider: "cloud-code",
    fallbackProvider: "mock",
    schema: "code-generation",
    reason: "Cloud Code gere generation technique et scripts.",
  },
  code_review: {
    taskType: "code_review",
    provider: "cloud-code",
    fallbackProvider: "mock",
    schema: "code-review",
    reason: "Cloud Code gere review, securite, tests et performance.",
  },
  bug_fix: {
    taskType: "bug_fix",
    provider: "cloud-code",
    fallbackProvider: "mock",
    schema: "bug-fix",
    reason: "Cloud Code corrige erreurs build, TypeScript, React et imports.",
  },
  refactor: {
    taskType: "refactor",
    provider: "cloud-code",
    fallbackProvider: "mock",
    schema: "refactor",
    reason: "Cloud Code gere refactor et maintenabilite.",
  },
  quality_gate: {
    taskType: "quality_gate",
    provider: "claude",
    fallbackProvider: "gemini",
    schema: "quality-gate",
    reason: "Claude critique la coherence et la qualite globale.",
  },
  output_normalization: {
    taskType: "output_normalization",
    provider: "gemini",
    fallbackProvider: "mock",
    schema: "output-normalization",
    reason: "Gemini normalise vers les formats Pixelrises.",
  },
  final_fusion: {
    taskType: "final_fusion",
    provider: "gemini",
    fallbackProvider: "mock",
    schema: "final-fusion",
    reason: "Gemini assemble les sorties en resultat final stable.",
  },
};

export const routingModeOverrides: Record<AIExecutionMode, Partial<Record<AITaskType, AIProviderId>>> = {
  simple: {},
  qualite: {
    site_design: "cloud-design",
    code_generation: "cloud-code",
    game_script: "cloud-code",
  },
  rapide: {
    project_type_detection: "mistral",
    brief_analysis: "mistral",
    dashboard_recommendations: "mistral",
  },
  business: {
    strategy_analysis: "openai",
    business_positioning: "openai",
    site_conversion: "openai",
    analytics_insights: "openai",
  },
  cout_optimise: {
    project_type_detection: "mistral",
    brief_analysis: "mistral",
    site_design: "gemini",
    game_assets: "gemini",
  },
  avance: {},
};
