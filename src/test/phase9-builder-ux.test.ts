import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Phase 9 builder UX shell", () => {
  const builderShell = read("src/components/v2/BuilderShell.tsx");
  const builderTools = read("src/lib/builder-tools.ts");
  const utilityPages = read("src/pages/UtilityPages.tsx");
  const appRoutes = read("src/App.tsx");
  const gameBuilder = read("src/pages/GameBuilder.tsx");

  it("exposes the shared builder primitives required by Phase 9", () => {
    [
      "BuilderShell",
      "BuilderSidebar",
      "BuilderTopbar",
      "BuilderInput",
      "BuilderPromptBox",
      "BuilderChatPanel",
      "BuilderPreview",
      "BuilderToolbar",
      "BuilderInspector",
      "BuilderVisualEditor",
      "BuilderActionPanel",
      "BuilderQuickActions",
      "BuilderVersionHistory",
      "BuilderModeToggle",
      "BuilderPublishBar",
      "BuilderExportPanel",
      "BuilderEmptyState",
      "BuilderLoadingState",
      "BuilderErrorState",
    ].forEach((primitive) => {
      expect(builderShell).toContain(`function ${primitive}`);
    });
  });

  it("links every visible builder toolbar item to a real route", () => {
    [
      "/analytics",
      "/builder/tools/cloud",
      "/builder/tools/code",
      "/builder/tools/folders",
      "/builder/tools/payments",
      "/builder/tools/security",
      "/builder/tools/seo",
    ].forEach((href) => {
      expect(builderTools).toContain(`href: "${href}"`);
      expect(appRoutes).toContain("/builder/tools/:toolId");
    });
  });

  it("keeps builder tool pages client-safe", () => {
    ["analytics", "cloud", "code", "folders", "payments", "security", "seo"].forEach((toolId) => {
      expect(utilityPages).toContain(`${toolId}:`);
    });

    [
      "AI Gateway",
      "provider IA",
      "token",
      "API key",
      "secret",
      "fallback local",
      "mock backend",
      "edge function",
      "stack trace",
      "OpenAI key",
      "Gemini key",
      "Claude key",
      "Stripe secret",
    ].forEach((forbidden) => {
      expect(`${builderShell}\n${builderTools}\n${utilityPages}`).not.toContain(forbidden);
    });
  });

  it("keeps the critical Phase 9 routes available", () => {
    [
      "/cockpit",
      "/general-ai",
      "/business-ai",
      "/student-ai",
      "/creator-ai",
      "/management-ai",
      "/enterprise-ai",
      "/builders/site",
      "/builder/site",
      "/builders/game",
      "/builder/game",
      "/agents/studio",
      "/automations/webhooks",
      "/automations/connectors/new",
      "/automations/integrations/docs",
      "/support",
      "/support/new",
      "/settings",
      "/profile",
      "/workspace",
    ].forEach((route) => {
      expect(appRoutes).toContain(route);
    });
  });

  it("presents Game Builder prototype mode as a real playable preview", () => {
    expect(gameBuilder).toContain("Preview jouable Pixelrises");
    expect(gameBuilder).toContain("Tester le jeu cree");
    expect(gameBuilder).toContain("Prototype jouable du jeu");
    expect(gameBuilder).toContain("config.startLabel");
    expect(gameBuilder).toContain("testAction(config.actions[0])");
  });
});
