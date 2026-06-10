import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { buildPixelrisesCoreContext, type PixelrisesGenerationType } from "@/modules/ai/intelligence";
import { redactSecrets } from "@/modules/ai/security/redactSecrets";
import { getAISpaceConfig } from "./registry";
import type {
  AISpaceAssistantRequest,
  AISpaceAssistantResponse,
  AISpaceRecommendation,
} from "./types";

const generationTypeForRequest = (request: AISpaceAssistantRequest): PixelrisesGenerationType => {
  const intent = String(request.intent ?? request.quickActionId ?? "").toLowerCase();
  const prompt = request.prompt.toLowerCase();
  const haystack = `${intent} ${prompt}`;

  if (/site|landing/.test(haystack)) return "site_landing";
  if (/app|prototype/.test(haystack)) return "app_prototype";
  if (/jeu|game/.test(haystack)) return "app_prototype";
  if (/agent/.test(haystack)) return "agent";
  if (/quiz/.test(haystack)) return "quiz";
  if (/fiche|resume|revision|révision/.test(haystack)) return "study_sheet";
  if (/image|visuel|logo/.test(haystack)) return "image_visual";
  if (/template|modele|modèle/.test(haystack)) return "template";

  return request.spaceType === "student" ? "study_sheet" : "text_generation";
};

const buildFallbackRecommendations = (spaceType: string): AISpaceRecommendation[] => {
  const config = getAISpaceConfig(spaceType);
  if (!config) return [];

  return [
    {
      title: config.dashboard.nextBestAction,
      description: `Prochaine action recommandée selon ${config.workspace.primaryOutput}.`,
      priority: "high",
    },
    {
      title: `Utiliser ${config.quickActions[0]?.label ?? "une action rapide"}`,
      description: config.quickActions[0]?.description ?? "Commence par une action simple et mesurable.",
      priority: "medium",
    },
  ];
};

const buildMockAnswer = (request: AISpaceAssistantRequest): AISpaceAssistantResponse => {
  const config = getAISpaceConfig(request.spaceType);
  const quickAction = config?.quickActions.find((action) => action.id === request.quickActionId);
  const userPrompt = request.prompt.trim() || quickAction?.prompt || config?.dashboard.emptyState || "";

  const answer = [
    `Mode secours Pixelrises actif pour ${config?.name ?? "AI Space"}.`,
    "Voici une réponse structurée sans exposer de détail interne ni de secret.",
    "",
    "1. Clarifier l'objectif réel",
    `- Demande reçue : ${userPrompt}`,
    `- Focus de l'espace : ${config?.workspace.expertFocus ?? "réponse utile et actionnable"}.`,
    "",
    "2. Transformer en livrable",
    `- Livrable prioritaire : ${quickAction?.resultType ?? config?.workspace.primaryOutput ?? "Plan actionnable"}.`,
    "- Résultat attendu : une prochaine étape simple, validable et liée à ton projet.",
    "",
    "3. Prochaine étape conseillée",
    `- ${config?.dashboard.nextBestAction ?? "Choisir un espace spécialisé ou un builder."}`,
    "",
    "4. Pour améliorer la réponse",
    `- ${config?.workspace.promptTips[0]?.example ?? "Ajoute ton contexte, ton objectif et le format attendu."}`,
  ].join("\n");

  return {
    success: true,
    spaceType: request.spaceType,
    answer,
    recommendations: buildFallbackRecommendations(request.spaceType),
    builderLinks: config?.builderLinks ?? [],
    source: "mock-fallback",
  };
};

export const runAISpaceAssistant = async (
  request: AISpaceAssistantRequest,
): Promise<AISpaceAssistantResponse> => {
  const config = getAISpaceConfig(request.spaceType);
  if (!config) return buildMockAnswer(request);
  const coreContext = buildPixelrisesCoreContext({ generationType: generationTypeForRequest(request) });

  if (!isSupabaseConfigured || import.meta.env.MODE === "test") {
    return buildMockAnswer(request);
  }

  try {
    const { data, error } = await supabase.functions.invoke("ai-space-chat", {
      body: {
        ...request,
        ...(request.spaceType === "business" ? {} : { systemPrompt: config.systemPrompt }),
        spaceName: config.name,
        safetyRules: config.safetyRules,
        pixelrisesCore: {
          name: coreContext.name,
          version: coreContext.version,
          fineTuningStatus: coreContext.fineTuningStatus,
          costEstimate: coreContext.costEstimate,
          serverStorageStatus: coreContext.serverStorageStatus,
          qualityCriteria: coreContext.qualityCriteria.map((criterion) => criterion.label),
        },
      },
    });

    if (error || !data?.answer) {
      return {
        ...buildMockAnswer(request),
        error: redactSecrets(error?.message ?? "Réponse AI Space invalide."),
      };
    }

    return {
      success: Boolean(data.success ?? true),
      spaceType: request.spaceType,
      answer: String(data.answer),
      recommendations: Array.isArray(data.recommendations)
        ? data.recommendations
        : buildFallbackRecommendations(request.spaceType),
      builderLinks: Array.isArray(data.builderLinks) ? data.builderLinks : config.builderLinks,
      source: data.source === "mock-fallback" ? "mock-fallback" : "real",
      usage: data.usage,
    };
  } catch (error) {
    return {
      ...buildMockAnswer(request),
      error: redactSecrets(error instanceof Error ? error.message : "Erreur AI Space inconnue."),
    };
  }
};
