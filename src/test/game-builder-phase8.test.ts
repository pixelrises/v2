import { describe, expect, it } from "vitest";
import { defaultRoutingRules, promptSplitter } from "@/modules/ai";
import {
  buildGameProductionPackage,
  createGameMarkdownExport,
  gameAIRoles,
  improveGamePackage,
  validateGameProductionPackage,
} from "@/modules/game-builder";

describe("Game Builder Phase 8", () => {
  it("creates a playable Web Game prototype with honest local/fallback data", () => {
    const gamePackage = buildGameProductionPackage(
      {
        platform: "Web game",
        gameType: "Quiz",
        freePrompt: "Créer un jeu quiz web avec score, niveaux et feedback.",
      },
      { dataState: "mock", mode: "prototype" },
    );

    expect(gamePackage.prototypePreview.mode).toBe("web_playable");
    expect(gamePackage.prototypePreview.webGame?.scoreTarget).toBeGreaterThan(0);
    expect(gamePackage.prototypePreview.webGame?.actions.length).toBeGreaterThanOrEqual(3);
    expect(gamePackage.qualityScores.scores.some((score) => score.id === "prototype_playability_score")).toBe(true);
    expect(gamePackage.limitations.join(" ")).toContain("ne publie pas automatiquement");
    expect(gamePackage.dataState).toBe("mock");
  });

  it("creates an exploitable Roblox Studio package with placement-aware Luau snippets", () => {
    const gamePackage = buildGameProductionPackage({
      platform: "Roblox",
      gameType: "Obby",
      freePrompt: "Créer un obby Roblox avec 5 zones, checkpoints et récompense.",
    });

    expect(gamePackage.prototypePreview.mode).toBe("platform_package");
    expect(gamePackage.scripts.some((script) => script.languageOrFormat === "Luau")).toBe(true);
    expect(gamePackage.scripts.some((script) => script.whereToPlaceIt.includes("ServerScriptService"))).toBe(true);
    expect(gamePackage.testingChecklist.join(" ")).toContain("Roblox Studio");
    expect(gamePackage.exportOptions.some((option) => option.id === "scripts" && option.status === "beta")).toBe(true);
  });

  it("creates UEFN and Minecraft packages without claiming automatic publication", () => {
    const uefnPackage = buildGameProductionPackage({
      platform: "Fortnite / UEFN",
      gameType: "Mini-game",
      freePrompt: "Créer une île UEFN avec objectifs courts, score et timer.",
    });
    const minecraftPackage = buildGameProductionPackage({
      platform: "Minecraft",
      gameType: "Survival",
      freePrompt: "Créer une map Minecraft avec objectifs, score et progression.",
    });

    expect(uefnPackage.scripts.some((script) => script.fileName.includes("UEFN") || script.languageOrFormat === "Verse")).toBe(true);
    expect(uefnPackage.implementationSteps.join(" ")).toContain("Score Manager");
    expect(minecraftPackage.scripts.some((script) => script.fileName.includes("manifest.json"))).toBe(true);
    expect(minecraftPackage.scripts.some((script) => script.whereToPlaceIt.includes("behavior_pack"))).toBe(true);
    expect([...uefnPackage.limitations, ...minecraftPackage.limitations].join(" ")).not.toContain("Publié automatiquement");
  });

  it("uses Game Intelligence roles and routes game-specific orchestration tasks", () => {
    const split = promptSplitter.split({
      prompt: "Créer un clicker game web avec upgrades simples.",
      projectType: "game",
      mode: "qualite",
    });
    const taskTypes = split.tasks.map((task) => task.type);

    expect(gameAIRoles).toContain("game_research");
    expect(gameAIRoles).toContain("prototype_code");
    expect(taskTypes).toContain("game_research");
    expect(taskTypes).toContain("game_platform_constraints");
    expect(taskTypes).toContain("game_ui_ux");
    expect(taskTypes).toContain("game_prototype_code");
    expect(defaultRoutingRules.game_prototype_code.fallbackProvider).toBe("mock");
  });

  it("keeps trend research honest when no live web search is connected", () => {
    const gamePackage = buildGameProductionPackage({
      platform: "Roblox",
      gameType: "Tycoon",
      freePrompt: "Créer un tycoon Roblox avec progression de base, score et récompenses.",
    });

    expect(gamePackage.trendInsights.some((insight) => insight.sourceType === "official_source")).toBe(true);
    expect(gamePackage.trendInsights.some((insight) => insight.sourceType === "fallback_hypothesis")).toBe(true);
    expect(gamePackage.trendInsights.every((insight) => insight.dataState === "mock")).toBe(true);
    expect(gamePackage.sourceSummary).toContain("Recherche live non activée");
  });

  it("improves a targeted area, keeps versionable output, and preserves the quality gate", () => {
    const basePackage = buildGameProductionPackage({
      platform: "Web game",
      gameType: "Clicker",
      freePrompt: "Créer un clicker game avec points, upgrades simples et restart.",
    });
    const improvedPackage = improveGamePackage(basePackage, "prototype", "Ajouter une action bonus testable.");

    expect(improvedPackage.gameId).toBe(basePackage.gameId);
    expect(improvedPackage.mode).toBe("improve");
    expect(improvedPackage.prototypePreview.webGame?.actions.length).toBeGreaterThan(basePackage.prototypePreview.webGame?.actions.length ?? 0);
    expect(validateGameProductionPackage(improvedPackage).scores.some((score) => score.id === "safety_score")).toBe(true);
  });

  it("exports a readable Markdown package with scripts, checklist and limitations", () => {
    const gamePackage = buildGameProductionPackage({
      platform: "Roblox",
      gameType: "Obby",
      freePrompt: "Créer un obby Roblox avec 5 zones, checkpoints et récompense.",
    });
    const markdown = createGameMarkdownExport(gamePackage);

    expect(markdown).toContain("#");
    expect(markdown).toContain("## Scripts / snippets");
    expect(markdown).toContain("## Checklist de test");
    expect(markdown).toContain("Pixelrises ne publie pas automatiquement");
  });
});
