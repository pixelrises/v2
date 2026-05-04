import { describe, expect, it } from "vitest";
import { mockProviderAdapter, type RoutedAITask } from "@/modules/ai";

const routedTask: RoutedAITask = {
  id: "game-script-1",
  type: "game_script",
  description: "Generer un snippet Roblox",
  priority: "medium",
  recommendedProvider: "cloud-code",
  fallbackProvider: "mock",
  selectedProvider: "mock",
  fallbackChain: ["mock"],
  routingReason: "test",
  input: {
    prompt: "jeu roblox obby",
    platform: "Roblox",
    gameType: "Obby",
  },
  expectedOutputSchema: "game-script",
  status: "routed",
};

describe("MockProviderAdapter", () => {
  it("generates structured game output without API key", async () => {
    const result = await mockProviderAdapter.generateJSON({ task: routedTask, prompt: "jeu roblox obby" });

    expect(result.success).toBe(true);
    expect(result.estimatedCost).toBe(0);
    expect(result.data).toHaveProperty("gameplay");
  });

  it("reports healthy mock config", async () => {
    const health = await mockProviderAdapter.healthCheck();
    expect(health.ok).toBe(true);
    expect(health.status).toBe("mock");
  });
});
