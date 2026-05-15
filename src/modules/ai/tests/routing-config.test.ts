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
    expect(vercelGatewayModelStack.fast).toBe("mistral/mistral-small");
    expect(vercelGatewayModelStack.cheapLongContext).toBe("mistral/ministral-8b");
    expect(vercelGatewayModelStack.balanced).toBe("openai/gpt-4o-mini");
    expect(vercelGatewayModelStack.generalValue).toBe("meta/llama-3.3-70b");
    expect(vercelGatewayModelStack.reasoning).toBe("anthropic/claude-3.5-haiku");
    expect(vercelGatewayModelStack.designValue).toBe("mistral/pixtral-12b");
    expect(vercelGatewayModelStack.codeValue).toBe("mistral/codestral");
    expect(vercelGatewayModelStack.safety).toBe("openai/gpt-oss-safeguard-20b");
    expect(vercelGatewayModelStack.embedding).toBe("openai/text-embedding-3-small");
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
