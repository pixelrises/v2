import { describe, expect, it } from "vitest";
import { aiProvidersConfig, defaultRoutingRules, vercelGatewayModelStack } from "@/modules/ai";

describe("AI routing config", () => {
  it("contains every required provider", () => {
    expect(Object.keys(aiProvidersConfig)).toEqual(
      expect.arrayContaining([
        "vercel-gateway",
        "gemini",
        "openai",
        "claude",
        "cloud-design",
        "cloud-code",
        "mistral",
        "mock",
        "future",
      ]),
    );
  });

  it("defines a Vercel Gateway model stack optimized for quality and cost", () => {
    expect(vercelGatewayModelStack.balanced).toBe("openai/gpt-5.4-mini");
    expect(vercelGatewayModelStack.wow).toBe("openai/gpt-5.5");
    expect(vercelGatewayModelStack.reasoning).toBe("anthropic/claude-sonnet-4.6");
    expect(vercelGatewayModelStack.codeValue).toBe("deepseek/deepseek-v3.1-terminus");
    expect(vercelGatewayModelStack.embedding).toBe("google/gemini-embedding-2");
  });

  it("routes code tasks to Cloud Code with safe fallback", () => {
    expect(defaultRoutingRules.code_generation.provider).toBe("cloud-code");
    expect(defaultRoutingRules.code_generation.fallbackProvider).toBe("mock");
    expect(defaultRoutingRules.game_script.provider).toBe("cloud-code");
  });

  it("routes design tasks to Cloud Design", () => {
    expect(defaultRoutingRules.site_design.provider).toBe("cloud-design");
    expect(defaultRoutingRules.design_system.provider).toBe("cloud-design");
  });
});
