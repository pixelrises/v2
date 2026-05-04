import { describe, expect, it } from "vitest";
import { CostControl, UsageLogger } from "@/modules/ai";

describe("CostControl and UsageLogger", () => {
  it("estimates zero cost for mock provider", () => {
    const cost = new CostControl();
    expect(cost.estimateCost("hello world", "mock")).toBe(0);
  });

  it("blocks requests when max cost is exceeded", () => {
    const cost = new CostControl({ enabled: true, maxCostPerRequestEUR: 0.000001 });
    const estimated = cost.estimateCost("x".repeat(200), "openai");
    expect(cost.blockIfOverBudget(estimated).blocked).toBe(true);
  });

  it("summarizes usage without exposing secret values", () => {
    const logger = new UsageLogger();
    logger.logUsage({
      provider: "mock",
      model: "mock-v2",
      taskType: "brief_analysis",
      durationMs: 1,
      success: true,
      retryCount: 0,
      estimatedTokens: 10,
      estimatedCost: 0,
      timestamp: "2026-05-03T00:00:00.000Z",
    });

    const summary = logger.providerUsageSummary();
    expect(summary.mock.calls).toBe(1);
  });
});
