import { getAIProviderAdapter } from "../providers";
import { costControl } from "../usage/CostControl";
import { createUsageEntry, usageLogger } from "../usage/UsageLogger";
import type {
  AIOrchestratorRequest,
  AIOrchestratorResult,
  AIProviderTaskResult,
  RoutedAITask,
} from "../schemas/ai-task.schema";
import { createPixelrisesIntelligenceLayer } from "../intelligence";
import { fusionEngine } from "./FusionEngine";
import { outputNormalizer } from "./OutputNormalizer";
import { promptSplitter } from "./PromptSplitter";
import { taskRouter } from "./TaskRouter";
import { validationLayer } from "./ValidationLayer";

const requestId = () => `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export class AIOrchestrator {
  async run(request: AIOrchestratorRequest): Promise<AIOrchestratorResult> {
    const mode = request.mode ?? "business";
    const intelligence = createPixelrisesIntelligenceLayer({
      rawUserRequest: request.prompt,
      projectType: request.projectType,
      context: request.context,
    });
    const orchestratedRequest: AIOrchestratorRequest = {
      ...request,
      prompt: intelligence.enrichedPrompt,
      context: {
        ...(request.context ?? {}),
        pixelrisesIntelligence: intelligence.publicContext,
        pixelrisesBrief: intelligence.enrichedBrief,
        pixelrisesRoles: intelligence.aiTasks.map((task) => task.role),
      },
    };
    const split = promptSplitter.split(orchestratedRequest);
    const routedTasks = taskRouter.route(split.tasks, mode);
    const providerResults: AIProviderTaskResult[] = [];
    const warnings: string[] = [];

    for (const task of routedTasks) {
      const result = await this.executeTask(task, orchestratedRequest.prompt);
      providerResults.push(result);
      if (!result.success && result.error) warnings.push(result.error);
    }

    const normalizedOutputs = providerResults.map((result) => outputNormalizer.normalize(result));
    const output = fusionEngine.fuse(split.projectType, intelligence.enrichedBrief.public_offer, normalizedOutputs);
    const quality = validationLayer.validate(output);

    return {
      requestId: requestId(),
      projectType: split.projectType,
      mode,
      tasks: routedTasks,
      providerResults,
      output,
      quality,
      usage: usageLogger.getEntries(),
      warnings: [...warnings, ...normalizedOutputs.flatMap((outputItem) => outputItem.warnings)],
    };
  }

  private async executeTask(task: RoutedAITask, prompt: string): Promise<AIProviderTaskResult> {
    const estimatedCost = costControl.estimateCost(prompt, task.selectedProvider);
    const budget = costControl.blockIfOverBudget(estimatedCost);

    if (budget.blocked) {
      return this.executeFallback(task, prompt, budget.reason);
    }

    const provider = getAIProviderAdapter(task.selectedProvider);
    const startedAt = Date.now();
    const response = await provider.generateJSON({
      task,
      prompt,
      context: task.input,
      schema: task.expectedOutputSchema,
    });

    const result: AIProviderTaskResult = {
      taskId: task.id,
      taskType: task.type,
      providerId: response.providerId,
      success: response.success,
      output: response.data ?? response.raw ?? {},
      raw: response.raw,
      error: response.error,
      durationMs: response.durationMs || Date.now() - startedAt,
      estimatedTokens: response.estimatedTokens,
      estimatedCost: response.estimatedCost,
    };

    usageLogger.logUsage(
      createUsageEntry({
        provider: result.providerId,
        model: response.model,
        taskType: task.type,
        durationMs: result.durationMs,
        success: result.success,
        estimatedTokens: result.estimatedTokens,
        estimatedCost: result.estimatedCost,
      }),
    );

    if (!result.success) {
      return this.executeFallback(task, prompt, result.error ?? "Provider failed.");
    }

    return result;
  }

  private async executeFallback(task: RoutedAITask, prompt: string, reason: string): Promise<AIProviderTaskResult> {
    const fallbackProvider = getAIProviderAdapter("mock");
    const startedAt = Date.now();
    const response = await fallbackProvider.generateJSON({
      task: {
        ...task,
        selectedProvider: "mock",
        status: "fallback",
        errors: [...(task.errors ?? []), reason],
      },
      prompt,
      context: task.input,
      schema: task.expectedOutputSchema,
    });

    const result: AIProviderTaskResult = {
      taskId: task.id,
      taskType: task.type,
      providerId: "mock",
      success: true,
      output: response.data ?? {},
      raw: response.raw,
      durationMs: response.durationMs || Date.now() - startedAt,
      estimatedTokens: response.estimatedTokens,
      estimatedCost: 0,
    };

    usageLogger.logUsage(
      createUsageEntry({
        provider: "mock",
        model: response.model,
        taskType: task.type,
        durationMs: result.durationMs,
        success: true,
        retryCount: 1,
        estimatedTokens: result.estimatedTokens,
        estimatedCost: 0,
      }),
    );

    return result;
  }
}

export const aiOrchestrator = new AIOrchestrator();
