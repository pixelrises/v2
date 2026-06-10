import { describe, expect, it } from "vitest";
import { aiProvidersConfig } from "@/modules/ai/config/ai-providers.config";
import { defaultRoutingRules, routingModeOverrides } from "@/modules/ai/config/ai-routing.config";
import { getAIProviderAdapter } from "@/modules/ai/providers";
import { aiSpacesRegistry } from "@/modules/ai-spaces";
import fs from "node:fs";
import path from "node:path";

describe("Creator AI Pollojourney contract", () => {
  it("registers Pollojourney as a server-only premium image provider", async () => {
    const provider = aiProvidersConfig.pollojourney;

    expect(provider.serverOnly).toBe(true);
    expect(provider.status).toBe("missing");
    expect(provider.supportedTasks).toEqual(
      expect.arrayContaining(["creator_premium_image", "creator_avatar_video", "creator_ad_creative"]),
    );
    expect(provider.role).toMatch(/premium|publicites|avatars/i);

    const adapter = getAIProviderAdapter("pollojourney");
    const health = await adapter.healthCheck();

    expect(health.ok).toBe(false);
    expect(health.message).toMatch(/backend key|server/i);
  });

  it("routes premium creator images to Pollojourney only in quality mode", () => {
    expect(defaultRoutingRules.creator_premium_image.provider).toBe("pollojourney");
    expect(defaultRoutingRules.creator_premium_image.fallbackProvider).toBe("cloud-design");
    expect(routingModeOverrides.qualite.creator_premium_image).toBe("pollojourney");
    expect(routingModeOverrides.cout_optimise.creator_premium_image).toBe("cloud-design");
  });

  it("keeps Creator AI explicit about costs, validation and premium visual use cases", () => {
    const creator = aiSpacesRegistry.creator;
    const serialized = JSON.stringify(creator);

    expect(creator.capabilities).toEqual(
      expect.arrayContaining([
        "Prompts image premium",
        "Publicités produit",
        "Avatars et UGC",
        "Upscale / outpainting préparés",
      ]),
    );
    expect(creator.quickActions.map((action) => action.id)).toEqual(
      expect.arrayContaining(["premium-image", "product-ad"]),
    );
    expect(serialized).toContain("Pollojourney image premium");
    expect(serialized).toContain("10+ crédits");
    expect(serialized).toContain("validation explicite");
    expect(serialized).not.toMatch(/POLLO_API_KEY\s*=\s*[^"'\s]+/);
  });

  it("keeps the real Pollo API call inside the server function only", () => {
    const edgeFunction = fs.readFileSync(
      path.join(process.cwd(), "supabase/functions/ai-space-chat/index.ts"),
      "utf8",
    );

    expect(edgeFunction).toContain("POLLO_API_KEY");
    expect(edgeFunction).toContain("https://pollo.ai/api/platform");
    expect(edgeFunction).toContain("/generation/pollojourney/pollojourney-v7-image/image");
    expect(edgeFunction).toContain("x-api-key");
    expect(edgeFunction).toContain("noDebitOnFailure");
    expect(edgeFunction).not.toMatch(/POLLO_API_KEY\s*=\s*["'][^"']+["']/);
  });
});
