import type { NormalizedAIOutput } from "./types";
import type { RoutedTask } from "./task-router";
import { validateAIOutput } from "./validation-layer";

export type ProviderAdapterResult = {
  taskId: string;
  provider: string;
  output: Partial<NormalizedAIOutput>;
  raw?: unknown;
};

export interface ProviderAdapter {
  execute(task: RoutedTask): Promise<ProviderAdapterResult>;
}

export class PreparedProviderAdapter implements ProviderAdapter {
  async execute(task: RoutedTask): Promise<ProviderAdapterResult> {
    return {
      taskId: task.id,
      provider: task.assignment.provider,
      output: validateAIOutput({
        recommendations: [
          {
            type: task.type,
            priority: task.priority,
            title: `Analyse ${task.type}`,
            description: task.assignment.reason,
            action: "Préparer une amélioration validable",
          },
        ],
      }),
    };
  }
}

export class FallbackProviderAdapter extends PreparedProviderAdapter {}
