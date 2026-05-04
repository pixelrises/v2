import { describe, expect, it } from "vitest";
import { GeminiProviderAdapter, geminiProviderAdapter } from "@/modules/ai";

describe("GeminiProviderAdapter V2", () => {
  it("stays mock-safe on the frontend", async () => {
    expect(geminiProviderAdapter.status.mode).toBe("mock");
    expect(geminiProviderAdapter.status.safeForFrontend).toBe(true);
    expect(geminiProviderAdapter.status.message.toLowerCase()).toContain("aucune");

    const site = await geminiProviderAdapter.generateSite({ businessName: "Maison Test" });
    expect(site.meta.projectType).toBe("site");
    expect(site.meta.businessName).toBe("Maison Test");
  });

  it("prepares backend-ready mode without exposing a key", () => {
    const adapter = new GeminiProviderAdapter("backend-ready");

    expect(adapter.status.provider).toBe("gemini");
    expect(adapter.status.safeForFrontend).toBe(true);
    expect(adapter.status.message.toLowerCase()).toContain("backend");
  });
});
