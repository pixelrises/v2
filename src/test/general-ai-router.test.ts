import { describe, expect, it } from "vitest";
import { detectGeneralAIIntent, routeGeneralAIRequest } from "@/modules/ai-spaces";

describe("General AI intent router", () => {
  it("routes concrete user goals to the right Pixelrises space or builder", () => {
    expect(detectGeneralAIIntent("Je veux créer un site pour mon restaurant")).toBe("create_site");
    expect(detectGeneralAIIntent("Je dois réviser un contrôle de maths")).toBe("student_help");
    expect(detectGeneralAIIntent("Je veux faire des vidéos TikTok avec des hooks")).toBe("creator_help");
    expect(detectGeneralAIIntent("Aide-moi à organiser mes relances clients")).toBe("management_help");
    expect(detectGeneralAIIntent("Je veux créer un jeu Roblox")).toBe("create_game");
  });

  it("returns short safe recommendations with links and DataState", () => {
    const result = routeGeneralAIRequest("Je veux créer un agent SEO");

    expect(result.intent).toBe("create_agent");
    expect(result.primaryAction.href).toBe("/builder/agent");
    expect(result.secondaryActions.length).toBeLessThanOrEqual(2);
    expect(result.dataState).toBe("mock");
    expect(result.safetyNote).toMatch(/validation/i);
  });

  it("falls back to General AI when the request is unclear", () => {
    const result = routeGeneralAIRequest("salut");

    expect(result.intent).toBe("general_question");
    expect(result.primaryAction.href).toBe("/ai-spaces/general");
    expect(result.confidence).toBe("low");
  });
});
