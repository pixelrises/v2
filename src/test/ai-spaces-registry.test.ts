import { describe, expect, it } from "vitest";
import { aiSpacesList, aiSpacesRegistry, runAISpaceAssistant } from "@/modules/ai-spaces";

describe("AI Spaces registry", () => {
  it("defines the six official Pixelrises AI Spaces", () => {
    expect(aiSpacesList.map((space) => space.id)).toEqual([
      "business",
      "student",
      "management",
      "enterprise",
      "creator",
      "general",
    ]);

    for (const space of aiSpacesList) {
      expect(space.quickActions.length).toBeGreaterThanOrEqual(3);
      expect(space.recommendedAgents.length).toBeGreaterThanOrEqual(4);
      expect(space.systemPrompt.length).toBeGreaterThan(80);
      expect(space.dashboard.nextBestAction).toBeTruthy();
      expect(space.workspace.sections.length).toBeGreaterThanOrEqual(2);
      expect(space.workspace.promptTips.length).toBeGreaterThanOrEqual(2);
      expect(space.workspace.accessPolicy.creditCost).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps safety rules explicit for sensitive spaces", () => {
    expect(aiSpacesRegistry.student.systemPrompt).toMatch(/triche/i);
    expect(aiSpacesRegistry.business.systemPrompt).toMatch(/resultats garantis|résultats garantis/i);
    expect(aiSpacesRegistry.creator.systemPrompt).toMatch(/viral/i);
    expect(aiSpacesRegistry.enterprise.safetyRules.join(" ")).toMatch(/donnees sensibles|données sensibles/i);
  });

  it("documents the real workspace boundaries for connected tools", () => {
    expect(JSON.stringify(aiSpacesRegistry.student.workspace)).toContain("Recherche Google préparée");
    expect(JSON.stringify(aiSpacesRegistry.management.workspace)).toContain("Import Excel / CSV");
    expect(JSON.stringify(aiSpacesRegistry.enterprise.workspace)).toContain("Aucun fichier local");
    expect(aiSpacesRegistry.enterprise.workspace.sections[1].items.some((item) => item.status === "requires-connection")).toBe(true);
  });

  it("keeps Business AI universal and General AI cost-controlled", () => {
    expect(aiSpacesRegistry.business.workspace.accessPolicy.includedIn).toContain("Starter");
    expect(aiSpacesRegistry.business.workspace.accessPolicy.includedIn).toContain("Enterprise");
    expect(aiSpacesRegistry.general.workspace.accessPolicy.modelPolicy).toMatch(/économique|economique/i);
    expect(aiSpacesRegistry.general.workspace.accessPolicy.creditCost).toBe(1);
  });

  it("returns a safe structured fallback without exposing providers", async () => {
    const response = await runAISpaceAssistant({
      spaceType: "business",
      prompt: "Je veux lancer une agence de sites pour artisans.",
    });

    expect(response.success).toBe(true);
    expect(response.source).toBe("mock-fallback");
    expect(response.answer).toContain("Mode secours Pixelrises");
    expect(JSON.stringify(response)).not.toContain("AI_GATEWAY_API_KEY");
  });
});
