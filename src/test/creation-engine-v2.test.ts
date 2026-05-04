import { describe, expect, it } from "vitest";
import {
  createDefaultAgentProject,
  createMockGameProject,
  createMockSiteProject,
  createProjectPlan,
  detectProjectType,
  validateAgentProject,
  validateGameProject,
  validateSiteProject,
} from "@/modules/creation-engine";

describe("Pixelrises V2 creation engine", () => {
  it("detects the right project family from an idea", () => {
    expect(detectProjectType("Créer un jeu Roblox obby")).toBe("game");
    expect(detectProjectType("Créer un agent SEO")).toBe("agent");
    expect(detectProjectType("Créer une landing pour un restaurant")).toBe("site");
  });

  it("creates safe plan-mode output", () => {
    const plan = createProjectPlan({ idea: "Créer un jeu Minecraft survival" });

    expect(plan.projectType).toBe("game");
    expect(plan.mode).toBe("plan");
    expect(plan.risks.join(" ")).toContain("API");
    expect(plan.nextSteps.length).toBeGreaterThan(0);
  });

  it("validates canonical site, agent and game projects", () => {
    const siteQuality = validateSiteProject(createMockSiteProject({ businessName: "Atelier Test" }));
    const agentQuality = validateAgentProject(createDefaultAgentProject());
    const gameQuality = validateGameProject(createMockGameProject({ platform: "Roblox" }));

    expect(siteQuality.passed).toBe(true);
    expect(agentQuality.passed).toBe(true);
    expect(gameQuality.passed).toBe(true);
    expect(gameQuality.requiredFixes).toEqual([]);
  });
});
