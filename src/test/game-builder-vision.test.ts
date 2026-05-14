import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const gameBuilderSource = readFileSync(join(process.cwd(), "src/pages/GameBuilder.tsx"), "utf8");

describe("Game Builder V2 vision", () => {
  it("keeps the beta game builder focused on concrete game production", () => {
    expect(gameBuilderSource).toContain("Brief du jeu");
    expect(gameBuilderSource).toContain("Prototype Mode");
    expect(gameBuilderSource).toContain("Prototype sécurisé");
    expect(gameBuilderSource).toContain("Qualité du jeu");
    expect(gameBuilderSource).toContain("Scripts / snippets");
    expect(gameBuilderSource).toContain("Checklist de test");
    expect(gameBuilderSource).toContain("Documentation & guide de production");
  });

  it("keeps platform-specific deliverables and safe publication boundaries", () => {
    expect(gameBuilderSource).toContain("platformOutputs");
    expect(gameBuilderSource).toContain("Roblox Studio");
    expect(gameBuilderSource).toContain("UEFN Island");
    expect(gameBuilderSource).toContain("Aucune publication auto");
    expect(gameBuilderSource).toContain("Test manuel requis");
  });

  it("keeps the reference-inspired premium layout sections available", () => {
    expect(gameBuilderSource).toContain("Promesse");
    expect(gameBuilderSource).toContain("Gameplay loop");
    expect(gameBuilderSource).toContain("Niveaux / zones");
    expect(gameBuilderSource).toContain("Assets prompts");
    expect(gameBuilderSource).toContain("Export honnête");
  });
});
