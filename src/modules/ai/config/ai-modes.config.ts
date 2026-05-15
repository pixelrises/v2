import type { AIExecutionMode } from "../schemas/ai-task.schema";

export type AIModeConfig = {
  mode: AIExecutionMode;
  label: string;
  description: string;
  exposeProviders: boolean;
  costGuard: boolean;
};

export const aiModesConfig: Record<AIExecutionMode, AIModeConfig> = {
  simple: {
    mode: "simple",
    label: "Simple",
    description: "Pixelrises choisit automatiquement le meilleur moteur sans afficher la complexite.",
    exposeProviders: false,
    costGuard: true,
  },
  qualite: {
    mode: "qualite",
    label: "Qualite",
    description: "Priorise les moteurs specialises pour un resultat plus riche.",
    exposeProviders: false,
    costGuard: true,
  },
  rapide: {
    mode: "rapide",
    label: "Rapide",
    description: "Favorise classification rapide, resume et generation courte.",
    exposeProviders: false,
    costGuard: true,
  },
  business: {
    mode: "business",
    label: "Business",
    description: "Priorise strategie, conversion, offre, SEO et recommandations actionnables.",
    exposeProviders: false,
    costGuard: true,
  },
  cout_optimise: {
    mode: "cout_optimise",
    label: "Cout optimise",
    description: "Limite les appels specialises et utilise des secours economiques.",
    exposeProviders: false,
    costGuard: true,
  },
  avance: {
    mode: "avance",
    label: "Avance",
    description: "Prepare l'affichage futur des options IA avancees.",
    exposeProviders: true,
    costGuard: true,
  },
};
