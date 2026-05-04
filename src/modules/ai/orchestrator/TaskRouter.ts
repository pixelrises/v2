import { aiProvidersConfig } from "../config/ai-providers.config";
import { defaultRoutingRules, globalFallbackChain, routingModeOverrides } from "../config/ai-routing.config";
import type { AIExecutionMode, AIProviderId, AITask, RoutedAITask } from "../schemas/ai-task.schema";

const unique = <T,>(items: T[]) => Array.from(new Set(items));

export class TaskRouter {
  route(tasks: AITask[], mode: AIExecutionMode = "business"): RoutedAITask[] {
    const overrides = routingModeOverrides[mode] ?? {};

    return tasks.map((task) => {
      const rule = defaultRoutingRules[task.type];
      const preferredProvider = overrides[task.type] ?? rule.provider;
      const providerConfig = aiProvidersConfig[preferredProvider];
      const providerAvailable = providerConfig.status === "configured" || providerConfig.status === "mock";
      const selectedProvider: AIProviderId = providerAvailable ? preferredProvider : rule.fallbackProvider;
      const fallbackChain = unique([selectedProvider, rule.fallbackProvider, ...globalFallbackChain, "mock"]);

      return {
        ...task,
        recommendedProvider: preferredProvider,
        fallbackProvider: rule.fallbackProvider,
        selectedProvider,
        fallbackChain,
        routingReason: providerAvailable
          ? rule.reason
          : `${providerConfig.displayName} est ${providerConfig.status}; fallback vers ${rule.fallbackProvider}.`,
        status: "routed",
      };
    });
  }
}

export const taskRouter = new TaskRouter();
