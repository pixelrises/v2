import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("AI Spaces integration contract", () => {
  it("registers AI Spaces routes in the V2 app shell", () => {
    const app = readProjectFile("src/App.tsx");
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");

    expect(app).toContain('path="/ai-spaces"');
    expect(app).toContain('path="/ai-spaces/:spaceId"');
    expect(shell).toContain("AI Spaces");
  });

  it("prepares a server-only Edge Function for AI Space chat", () => {
    const edgeFunction = readProjectFile("supabase/functions/ai-space-chat/index.ts");

    expect(edgeFunction).toContain("createAIChatCompletion");
    expect(edgeFunction).toContain("AI_GATEWAY_OPENAI_MODEL");
    expect(edgeFunction).toContain("AI_GATEWAY_STUDENT_MODEL");
    expect(edgeFunction).toContain("site, app, jeu educatif et agent IA");
    expect(edgeFunction).toContain("source: \"mock-fallback\"");
    expect(edgeFunction).not.toContain("vck_");
  });

  it("keeps Edge AI orchestrator aligned with advanced builder Gateway tasks", () => {
    const orchestrator = readProjectFile("supabase/functions/ai-orchestrator/index.ts");

    expect(orchestrator).toContain('"game_research"');
    expect(orchestrator).toContain('"game_platform_constraints"');
    expect(orchestrator).toContain('"game_ui_ux"');
    expect(orchestrator).toContain('"game_prototype_code"');
    expect(orchestrator).toContain("game_prototype_code");
  });

  it("adds AI Spaces to Product Lab analysis", () => {
    const productLab = readProjectFile("scripts/product-lab-core.mjs");

    expect(productLab).toContain("AI Spaces Expert");
    expect(productLab).toContain("AI Spaces Score");
    expect(productLab).toContain("src/modules/ai-spaces");
  });
});
