import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 13 expert launch audit guardrails", () => {
  it("keeps customer-facing fallback copy free from setup internals", () => {
    const clientFiles = [
      "src/pages/Auth.tsx",
      "src/pages/AISpaceDetail.tsx",
      "src/pages/Agents.tsx",
      "src/pages/Projects.tsx",
      "src/pages/Dashboard.tsx",
      "src/pages/IntegrationDetail.tsx",
      "src/modules/ai-spaces/assistant.ts",
      "src/modules/ai-spaces/storage.ts",
    ];

    const combined = clientFiles.map(readProjectFile).join("\n");
    const forbiddenVisiblePhrases = [
      "VITE_SUPABASE",
      "variables Supabase",
      "Synchronisation Supabase",
      "en attendant Supabase",
      "permissions Supabase",
      "fallback local",
      "mock backend",
      "backend à connecter",
      "provider ni de secret",
      "Google OAuth dans Supabase",
    ];

    for (const phrase of forbiddenVisiblePhrases) {
      expect(combined).not.toContain(phrase);
    }
  });

  it("redacts admin bootstrap failures instead of returning raw environment errors", () => {
    const bootstrapAdmin = readProjectFile("supabase/functions/bootstrap-admin/index.ts");

    expect(bootstrapAdmin).toContain("Configuration admin indisponible.");
    expect(bootstrapAdmin).toContain("bootstrap-admin error: redacted");
    expect(bootstrapAdmin).not.toContain("error instanceof Error ? error.message");
  });

  it("keeps builder advanced UI from exposing fallback provider labels", () => {
    const gameBuilder = readProjectFile("src/pages/GameBuilder.tsx");
    const siteBuilder = readProjectFile("src/pages/SiteBuilder.tsx");

    expect(gameBuilder).not.toContain('fallbackProvider: "mock"');
    expect(siteBuilder).not.toContain("Generation non eligible Supabase");
    expect(siteBuilder).toContain("Sauvegarde cloud indisponible");
  });

  it("keeps launch trust and support routes wired", () => {
    const app = readProjectFile("src/App.tsx");
    const expectedRoutes = [
      "/support",
      "/support/new",
      "/mentions-legales",
      "/confidentialite",
      "/cgv",
      "/cookies",
      "/security",
      "/workspace",
    ];

    for (const route of expectedRoutes) {
      expect(app).toContain(`path="${route}"`);
    }
  });
});
