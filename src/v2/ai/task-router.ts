import { defaultAIConfig, getAssignmentForTask, type AIConfig } from "./ai-config";
import type { PromptTask, ProviderAssignment } from "./types";

export type RoutedTask = PromptTask & {
  assignment: ProviderAssignment;
};

export const routeTasks = (
  tasks: PromptTask[],
  config: AIConfig = defaultAIConfig,
): RoutedTask[] =>
  tasks.map((task) => ({
    ...task,
    assignment: getAssignmentForTask(task.type, config),
  }));
