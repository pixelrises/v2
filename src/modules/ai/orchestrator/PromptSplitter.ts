import { detectProjectType } from "@/modules/creation-engine";
import type { AIOrchestratorRequest, AIProjectType, AITask, AITaskType } from "../schemas/ai-task.schema";
import { defaultRoutingRules } from "../config/ai-routing.config";

const id = (type: AITaskType, index: number) => `${type}-${index + 1}`;

const projectTasks: Record<AIProjectType, Array<{ type: AITaskType; description: string; priority: AITask["priority"] }>> = {
  site: [
    { type: "brief_analysis", description: "Analyser le brief, la niche, la cible et l'objectif business.", priority: "high" },
    { type: "site_structure", description: "Creer une structure de site coherente et orientee conversion.", priority: "high" },
    { type: "site_design", description: "Definir une direction visuelle premium et responsive.", priority: "medium" },
    { type: "site_copywriting", description: "Rediger textes, titres et CTA clairs.", priority: "high" },
    { type: "site_seo", description: "Preparer titres SEO, description, mots-cles et SEO local.", priority: "medium" },
    { type: "site_conversion", description: "Optimiser preuves, objections, CTA et capture de leads.", priority: "high" },
  ],
  agent: [
    { type: "brief_analysis", description: "Comprendre le role attendu de l'agent.", priority: "high" },
    { type: "agent_config", description: "Configurer role, objectif, contexte et limites.", priority: "high" },
    { type: "agent_prompt", description: "Construire les instructions et le ton de l'agent.", priority: "high" },
    { type: "agent_permissions", description: "Verifier les permissions et bloquer les actions sensibles.", priority: "high" },
  ],
  game: [
    { type: "brief_analysis", description: "Analyser l'idee de jeu, la plateforme et le public cible.", priority: "high" },
    { type: "game_design", description: "Creer concept, pitch, univers et gameplay loop.", priority: "high" },
    { type: "game_mechanics", description: "Definir mecaniques, progression, economie et recompenses.", priority: "high" },
    { type: "game_level_design", description: "Preparer map structure, zones et flow joueur.", priority: "medium" },
    { type: "game_script", description: "Generer snippets adaptes a la plateforme.", priority: "medium" },
    { type: "game_assets", description: "Lister assets, prompts visuels, UI et thumbnails.", priority: "medium" },
    { type: "game_publishing", description: "Preparer checklist publication sans promesse automatique.", priority: "high" },
  ],
  integration: [
    { type: "brief_analysis", description: "Comprendre l'integration et son objectif.", priority: "high" },
    { type: "integration_mapping", description: "Mapper permissions, statut honnete et prochaine etape.", priority: "high" },
    { type: "code_review", description: "Verifier securite, secrets et backend requis.", priority: "medium" },
  ],
  improvement: [
    { type: "brief_analysis", description: "Comprendre ce qui doit etre ameliore sans tout regenerer.", priority: "high" },
    { type: "site_improvement", description: "Preparer un patch cible pour structure, texte ou conversion.", priority: "high" },
    { type: "quality_gate", description: "Verifier que l'amelioration reste stable et coherente.", priority: "high" },
  ],
  code: [
    { type: "brief_analysis", description: "Comprendre la demande technique et son scope.", priority: "high" },
    { type: "code_generation", description: "Generer ou preparer le code demande.", priority: "high" },
    { type: "code_review", description: "Verifier bugs, securite, imports et tests.", priority: "high" },
  ],
  strategy: [
    { type: "brief_analysis", description: "Comprendre l'objectif strategique.", priority: "high" },
    { type: "strategy_analysis", description: "Analyser le positionnement, marche et priorites.", priority: "high" },
    { type: "business_positioning", description: "Clarifier promesse, cible, offre et differenciation.", priority: "high" },
    { type: "dashboard_recommendations", description: "Transformer la strategie en prochaines actions.", priority: "medium" },
  ],
  template: [
    { type: "brief_analysis", description: "Comprendre la niche du template.", priority: "high" },
    { type: "site_structure", description: "Preparer sections adaptatives.", priority: "high" },
    { type: "site_design", description: "Preparer direction visuelle et variantes.", priority: "medium" },
    { type: "component_suggestion", description: "Lister composants reutilisables.", priority: "medium" },
  ],
};

const normalizeProjectType = (request: AIOrchestratorRequest): AIProjectType => {
  if (request.projectType) return request.projectType;
  const detected = detectProjectType(request.prompt);
  if (detected === "template" || detected === "integration" || detected === "agent" || detected === "game" || detected === "site") {
    return detected;
  }
  return "site";
};

export class PromptSplitter {
  split(request: AIOrchestratorRequest): { projectType: AIProjectType; tasks: AITask[] } {
    const prompt = request.prompt.trim() || "Creer un projet digital Pixelrises.";
    const projectType = normalizeProjectType(request);
    const baseTasks = projectTasks[projectType] ?? projectTasks.site;
    const context = request.context ?? {};

    const tasks = baseTasks.map((task, index) => {
      const rule = defaultRoutingRules[task.type];
      return {
        id: id(task.type, index),
        type: task.type,
        description: task.description,
        priority: task.priority,
        recommendedProvider: rule.provider,
        fallbackProvider: rule.fallbackProvider,
        input: {
          prompt,
          projectType,
          ...context,
        },
        expectedOutputSchema: rule.schema,
        status: "pending" as const,
      };
    });

    return { projectType, tasks };
  }
}

export const promptSplitter = new PromptSplitter();
