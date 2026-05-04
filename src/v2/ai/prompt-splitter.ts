import type { PixelrisesTaskType, PromptTask } from "./types";

const taskLabels: Array<{ type: PixelrisesTaskType; priority: PromptTask["priority"] }> = [
  { type: "business", priority: "high" },
  { type: "structure", priority: "high" },
  { type: "copywriting", priority: "high" },
  { type: "conversion", priority: "high" },
  { type: "design", priority: "medium" },
  { type: "seo", priority: "medium" },
  { type: "visuals", priority: "low" },
  { type: "analytics", priority: "low" },
];

export const splitPromptIntoTasks = (
  userPrompt: string,
  context: Record<string, unknown> = {},
): PromptTask[] => {
  const prompt = userPrompt.trim() || "Créer une présence business professionnelle.";

  return taskLabels.map((entry, index) => ({
    id: `${entry.type}-${index + 1}`,
    type: entry.type,
    prompt,
    priority: entry.priority,
    context,
  }));
};
