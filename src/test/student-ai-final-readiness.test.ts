import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const read = (...segments: string[]) =>
  fs.readFileSync(path.join(root, ...segments), "utf8");

describe("Student AI final readiness", () => {
  it("keeps the Student AI system prompt aligned with premium study coverage and guardrails", () => {
    const prompt = read("src", "modules", "ai-spaces", "prompts", "student-ai.prompt.ts");

    expect(prompt).toContain("fiches de revision");
    expect(prompt).toContain("quiz");
    expect(prompt).toContain("flashcards");
    expect(prompt).toContain("oraux");
    expect(prompt).toContain("diaporamas");
    expect(prompt).toContain("plannings");
    expect(prompt).toContain("recherches guidees");
    expect(prompt).toContain("anti-triche");
    expect(prompt).toContain("briefs de sites web");
    expect(prompt).toContain("applications");
    expect(prompt).toContain("mini-jeux educatifs");
    expect(prompt).toContain("agents IA etudiants");
    expect(prompt).toContain("n'invente jamais de sources");
    expect(prompt).toContain("ne reveles jamais provider");
  });

  it("keeps Student AI commands mapped to study outputs and builder-compatible briefs", () => {
    const workspace = read("src", "components", "ai-spaces", "StudentAIWorkspace.tsx");

    [
      "/fiche",
      "/quiz",
      "/flashcards",
      "/slides",
      "/oral",
      "/resume",
      "/planning",
      "/corriger",
      "/methode",
      "/sources",
      "/recherche",
      "/site",
      "/app",
      "/jeu",
      "/agent",
    ].forEach((command) => expect(workspace).toContain(command));

    expect(workspace).toContain("Student AI Pixelrises");
    expect(workspace).toContain("site, app, jeu");
    expect(workspace).toContain("Student AI");
    expect(workspace).toContain("serveur");
  });

  it("keeps the Student registry explicit about pedagogy, anti-cheat and builder boundaries", () => {
    const registry = read("src", "modules", "ai-spaces", "registry.ts");

    expect(registry).toContain('id: "student"');
    expect(registry).toContain("No-Cheat Tutor Agent");
    expect(registry).toContain("Slides Agent");
    expect(registry).toContain("Project Builder Agent");
    expect(registry).toContain("triche");
    expect(registry).toContain("source");
    expect(registry).toContain("builders Pixelrises");
    expect(registry).toContain("/builder/site");
    expect(registry).toContain("/builder/game");
    expect(registry).toContain("/builder/agent");
  });
});
