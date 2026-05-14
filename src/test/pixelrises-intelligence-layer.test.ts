import { describe, expect, it } from "vitest";
import { createPixelrisesIntelligenceLayer, redactPersonalDataForAI } from "@/modules/ai";

describe("Pixelrises Intelligence Layer", () => {
  it("enrichit une demande site avant orchestration sans envoyer le prompt brut seul", () => {
    const result = createPixelrisesIntelligenceLayer({
      rawUserRequest: "Je veux un site pour un restaurant à Lyon avec réservation.",
      projectType: "site",
      context: {
        businessName: "Maison Test",
        niche: "Restaurant premium",
        goal: "Obtenir des réservations",
        targetAudience: "clients locaux",
        style: "premium",
      },
    });

    expect(result.enrichedBrief.city).toBe("Lyon");
    expect(result.enrichedBrief.niche).toMatch(/Restaurant/i);
    expect(result.enrichedBrief.required_sections.join(" ")).toMatch(/Menu|réservation/i);
    expect(result.enrichedBrief.conversion_strategy).toMatch(/CTA/i);
    expect(result.aiTasks.map((task) => task.role)).toEqual(
      expect.arrayContaining(["strategy", "structure", "copywriting", "design", "seo", "quality"]),
    );
    expect(result.enrichedPrompt).toContain("PIXELRISES INTELLIGENCE LAYER");
    expect(result.enrichedPrompt).toContain("Ne pas inventer de preuve");
  });

  it("redacte les données personnelles et secrets avant providers IA", () => {
    const safe = redactPersonalDataForAI("Contacte test@example.com au +33 6 12 34 56 78 avec sk-123456789012345678901234.");

    expect(safe).not.toContain("test@example.com");
    expect(safe).not.toContain("+33 6 12 34 56 78");
    expect(safe).not.toContain("sk-123456789012345678901234");
    expect(safe).toContain("[PERSONAL_DATA_REDACTED]");
    expect(safe).toContain("[REDACTED]");
  });
});
