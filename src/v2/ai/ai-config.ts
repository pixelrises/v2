import type { PixelrisesTaskType, ProviderAssignment, ProviderKey, ProviderMode } from "./types";

export type AIConfig = {
  mode: ProviderMode;
  defaultProvider: ProviderKey;
  assignments: ProviderAssignment[];
  allowFallback: boolean;
  exposeAdvancedControls: boolean;
};

const defaultAssignments: ProviderAssignment[] = [
  {
    taskType: "structure",
    provider: "pixelrises-auto",
    modelHint: "best-structure",
    reason: "Choisir automatiquement le meilleur moteur pour structurer le site.",
  },
  {
    taskType: "design",
    provider: "pixelrises-auto",
    modelHint: "best-visual-direction",
    reason: "Adapter la direction visuelle à la niche et au niveau de gamme.",
  },
  {
    taskType: "copywriting",
    provider: "pixelrises-auto",
    modelHint: "best-copy",
    reason: "Produire des textes clairs, crédibles et orientés conversion.",
  },
  {
    taskType: "seo",
    provider: "pixelrises-auto",
    modelHint: "best-seo",
    reason: "Optimiser titres, descriptions, mots-clés et FAQ.",
  },
  {
    taskType: "business",
    provider: "pixelrises-auto",
    modelHint: "best-business",
    reason: "Analyser offre, cible, promesse et positionnement.",
  },
  {
    taskType: "conversion",
    provider: "pixelrises-auto",
    modelHint: "best-conversion",
    reason: "Prioriser CTA, preuves, objections et tunnel de contact.",
  },
  {
    taskType: "visuals",
    provider: "fallback",
    modelHint: "future-image-provider",
    reason: "Préparer l'arrivée d'un provider image sans bloquer la V2.",
  },
  {
    taskType: "analytics",
    provider: "pixelrises-auto",
    modelHint: "recommendations",
    reason: "Transformer les signaux en prochaines actions utiles.",
  },
];

export const defaultAIConfig: AIConfig = {
  mode: "business",
  defaultProvider: "pixelrises-auto",
  assignments: defaultAssignments,
  allowFallback: true,
  exposeAdvancedControls: false,
};

export const getAssignmentForTask = (
  taskType: PixelrisesTaskType,
  config: AIConfig = defaultAIConfig,
) =>
  config.assignments.find((assignment) => assignment.taskType === taskType) ?? {
    taskType,
    provider: config.defaultProvider,
    modelHint: "auto",
    reason: "Affectation automatique Pixelrises AI.",
  };
