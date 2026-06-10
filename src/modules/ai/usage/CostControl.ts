import type { AIProviderId } from "../schemas/ai-task.schema";

export type CostControlConfig = {
  dailyBudgetEUR: number;
  maxCostPerRequestEUR: number;
  enabled: boolean;
};

export class CostControl {
  private config: CostControlConfig;

  constructor(config: Partial<CostControlConfig> = {}) {
    this.config = {
      dailyBudgetEUR: config.dailyBudgetEUR ?? 0,
      maxCostPerRequestEUR: config.maxCostPerRequestEUR ?? 0,
      enabled: config.enabled ?? false,
    };
  }

  estimateTokens(input: string) {
    return Math.max(1, Math.ceil(input.trim().length / 4));
  }

  estimateCost(input: string, provider: AIProviderId) {
    const tokens = this.estimateTokens(input);
    const multiplier =
      provider === "mock"
        ? 0
        : provider === "pollojourney"
          ? 0.000012
          : provider === "mistral"
            ? 0.0000005
            : 0.000001;
    return Number((tokens * multiplier).toFixed(6));
  }

  blockIfOverBudget(estimatedCost: number) {
    if (!this.config.enabled) return { blocked: false, reason: "" };
    if (this.config.maxCostPerRequestEUR > 0 && estimatedCost > this.config.maxCostPerRequestEUR) {
      return { blocked: true, reason: "AI_MAX_COST_PER_REQUEST_EUR exceeded." };
    }
    if (this.config.dailyBudgetEUR > 0 && estimatedCost > this.config.dailyBudgetEUR) {
      return { blocked: true, reason: "AI_DAILY_BUDGET_EUR exceeded." };
    }
    return { blocked: false, reason: "" };
  }
}

export const costControl = new CostControl();
