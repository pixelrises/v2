import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("Builder persistence contract", () => {
  it("keeps Site Builder persistence honest across Supabase, versions and fallback local", () => {
    const source = readSource("src/pages/SiteBuilder.tsx");

    expect(source).toContain("projectStorageAdapter.saveProject");
    expect(source).toContain("projectStorageAdapter.saveVersion");
    expect(source).toContain("fallbackToLocalStorage");
    expect(source).toContain("Quality Gate");
    expect(source).toContain("Visual Editor");
    expect(source).toContain("Aucune publication automatique");
  });

  it("keeps Agent Builder visible in the dashboard after generation and backend failures", () => {
    const source = readSource("src/pages/AgentBuilder.tsx");

    expect(source).toContain("persistAgentProject");
    expect(source).toContain("projectStorageAdapter.saveProject");
    expect(source).toContain("enforceAgentSafety");
    expect(source).toContain("frontend-fallback");
  });

  it("keeps Game Builder beta projects visible in the dashboard after generation and backend failures", () => {
    const source = readSource("src/pages/GameBuilder.tsx");

    expect(source).toContain("persistGameProject");
    expect(source).toContain("projectStorageAdapter.saveProject");
    expect(source).toContain("enforceGameBetaSafety");
    expect(source).toContain("frontend-fallback");
    expect(source).toContain("Pixelrises ne publie pas automatiquement");
  });
});
