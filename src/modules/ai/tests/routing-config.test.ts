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
        "claude-design",
        "claude-code",
        "mistral",
        "mock",
        "future",
      ]),
    );
  });

  it("defines a Vercel Gateway model stack optimized for quality and cost", () => {
    expect(vercelGatewayModelStack.fast).toBe("mistral/mistral-small");
    expect(vercelGatewayModelStack.cheapLongContext).toBe("mistral/ministral-8b");
    expect(vercelGatewayModelStack.balanced).toBe("openai/gpt-4o-mini");
    expect(vercelGatewayModelStack.generalValue).toBe("google/gemini-2.5-flash");
    expect(vercelGatewayModelStack.reasoning).toBe("anthropic/claude-sonnet-4-6");
    expect(vercelGatewayModelStack.designValue).toBe("anthropic/claude-sonnet-4-6");
    expect(vercelGatewayModelStack.visualValue).toBe("google/gemini-2.5-flash");
    expect(vercelGatewayModelStack.codeValue).toBe("mistral/codestral");
    expect(vercelGatewayModelStack.safety).toBe("openai/gpt-oss-safeguard-20b");
    expect(vercelGatewayModelStack.embedding).toBe("openai/text-embedding-3-small");
  });

  it("routes code tasks to Claude Code with safe fallback", () => {
    expect(defaultRoutingRules.code_generation.provider).toBe("claude-code");
    expect(defaultRoutingRules.code_generation.fallbackProvider).toBe("mock");
    expect(defaultRoutingRules.game_script.provider).toBe("claude-code");
  });

  it("routes design tasks to Claude Design", () => {
    expect(defaultRoutingRules.site_structure.provider).toBe("openai");
    expect(defaultRoutingRules.site_design.provider).toBe("claude-design");
    expect(defaultRoutingRules.site_improvement.provider).toBe("openai");
    expect(defaultRoutingRules.design_system.provider).toBe("claude-design");
  });

  it("keeps creator work split between cheap ideation and premium execution", () => {
    expect(defaultRoutingRules.creator_image_concept.provider).toBe("gemini");
    expect(defaultRoutingRules.creator_image_concept.fallbackProvider).toBe("claude-design");
    expect(defaultRoutingRules.creator_ad_creative.provider).toBe("openai");
    expect(defaultRoutingRules.creator_premium_image.provider).toBe("pollojourney");
  });
});
