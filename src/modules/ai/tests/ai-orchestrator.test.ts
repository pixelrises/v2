import { describe, expect, it } from "vitest";
import { AIOrchestrator } from "@/modules/ai";

describe("AIOrchestrator", () => {
  it("runs a site prompt through the multi-AI mock pipeline", async () => {
    const orchestrator = new AIOrchestrator();
    const result = await orchestrator.run({
      prompt: "Cree un site premium pour une agence de location de voiture a Paris avec SEO local.",
      projectType: "site",
      mode: "business",
    });

    expect(result.projectType).toBe("site");
    expect(result.tasks.length).toBeGreaterThanOrEqual(5);
    expect(result.quality.valid).toBe(true);
    expect(result.output).toHaveProperty("pages");
    expect(JSON.stringify(result.output)).not.toContain("PIXELRISES INTELLIGENCE LAYER");
  });

  it("runs an agent prompt with safe permissions", async () => {
    const orchestrator = new AIOrchestrator();
    const result = await orchestrator.run({
      prompt: "Cree un agent SEO qui audite mes pages.",
      projectType: "agent",
    });

    expect(result.projectType).toBe("agent");
    expect(result.output).toHaveProperty("permissions");
    expect(result.quality.valid).toBe(true);
  });

  it("runs a game prompt and keeps publication beta-safe", async () => {
    const orchestrator = new AIOrchestrator();
    const result = await orchestrator.run({
      prompt: "Cree un concept Roblox obby avec checkpoints et scripts Luau.",
      projectType: "game",
    });

    expect(result.projectType).toBe("game");
    expect(result.output).toHaveProperty("publishing");
    expect(result.quality.valid).toBe(true);
  });
});
