import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

const expectNoSensitiveRegression = (source: string) => {
  expect(source).not.toContain("bg-blue-500");
  expect(source).not.toContain('href="#"');
  expect(source).not.toContain("Product Lab");
  expect(source).not.toContain("STRIPE_");
  expect(source).not.toContain("price_id");
  expect(source).not.toContain("ï¿½");
};

const expectOneOf = (source: string, values: string[]) => {
  expect(values.some((value) => source.includes(value))).toBe(true);
};

describe("generator plan mode contract", () => {
  it("separates the plan to validate from the generation timeline", () => {
    const shell = readProjectFile("src/components/v2/BuilderShell.tsx");

    expect(shell).toContain("export function BuilderGenerationModeSelector");
    expect(shell).toContain('data-testid="builder-generation-mode-selector"');
    expect(shell).toContain("Mode Direct");
    expectOneOf(shell, ["Génération immédiate à partir de votre prompt.", "GÃ©nÃ©ration immÃ©diate Ã  partir de votre prompt."]);
    expect(shell).toContain("Mode Plan");
    expectOneOf(shell, ["Pixelrises prépare un plan avant de générer.", "Pixelrises prÃ©pare un plan avant de gÃ©nÃ©rer."]);
    expect(shell).toContain("export function BuilderPlanTool");
    expect(shell).toContain('data-testid="builder-plan-tool"');
    expectOneOf(shell, ["Plan IA à valider", "Plan IA Ã  valider"]);
    expectOneOf(shell, ["Vérifiez ce que l'IA va créer avant de lancer la génération.", "VÃ©rifiez ce que l'IA va crÃ©er avant de lancer la gÃ©nÃ©ration."]);
    expectOneOf(shell, ["Résumé du plan", "RÃ©sumÃ© du plan"]);
    expectOneOf(shell, ["Aucun résumé de plan disponible", "Aucun rÃ©sumÃ© de plan disponible"]);
    expectOneOf(shell, ["Lire le plan détaillé", "Lire le plan dÃ©taillÃ©"]);
    expect(shell).toContain("Masquer le plan");
    expect(shell).toContain("Modifier mon prompt");
    expectOneOf(shell, ["Modifier mes préférences", "Modifier mes prÃ©fÃ©rences"]);
    expect(shell).toContain("Valider le plan");
    expectOneOf(shell, ["Plan en préparation", "Plan en prÃ©paration"]);
    expectOneOf(shell, ["Plan à valider", "Plan Ã  valider"]);
    expectOneOf(shell, ["Plan validé", "Plan validÃ©"]);
    expect(shell).toContain("export function BuilderGenerationTimeline");
    expect(shell).toContain('data-testid="builder-generation-timeline"');
    expectOneOf(shell, ["Progression de génération", "Progression de gÃ©nÃ©ration"]);
    expectOneOf(shell, ["Pixelrises suit les étapes nécessaires pour produire un résultat propre.", "Pixelrises suit les Ã©tapes nÃ©cessaires pour produire un rÃ©sultat propre."]);
    expect(shell).not.toContain("bloquÃ©");
    expect(shell).toContain("#F5C542");
    expectNoSensitiveRegression(shell);
  });

  it("keeps Site Builder direct generation available and adds a separate site timeline", () => {
    const siteBuilder = readProjectFile("src/pages/SiteBuilder.tsx");

    expect(siteBuilder).toContain("BuilderGenerationModeSelector");
    expect(siteBuilder).toContain("BuilderPlanTool");
    expect(siteBuilder).toContain("BuilderGenerationTimeline");
    expectOneOf(siteBuilder, ["Plan proposé par Pixelrises", "Plan proposÃ© par Pixelrises"]);
    expect(siteBuilder).toContain('useState<"direct" | "plan">("direct")');
    expect(siteBuilder).toContain('generationMode === "plan" && !planApproved');
    expectOneOf(siteBuilder, ["Créer la preview", "CrÃ©er la preview"]);
    expectOneOf(siteBuilder, ["Créer le plan", "CrÃ©er le plan"]);
    expectOneOf(siteBuilder, ["Générer avec ce plan", "GÃ©nÃ©rer avec ce plan"]);
    expectOneOf(siteBuilder, ["Validez le plan Pixelrises avant de lancer la génération.", "Validez le plan Pixelrises avant de lancer la gÃ©nÃ©ration."]);
    expectOneOf(siteBuilder, ["Résumé du projet", "RÃ©sumÃ© du projet"]);
    expect(siteBuilder).toContain("Objectif");
    expect(siteBuilder).toContain("Cible");
    expect(siteBuilder).toContain("Style");
    expectOneOf(siteBuilder, ["Structure prévue", "Structure prÃ©vue"]);
    expectOneOf(siteBuilder, ["Fonctionnalités prévues", "FonctionnalitÃ©s prÃ©vues"]);
    expectOneOf(siteBuilder, ["Contenu prévu", "Contenu prÃ©vu"]);
    expect(siteBuilder).toContain("Points importants");
    expectOneOf(siteBuilder, ["Éléments à éviter", "Ã‰lÃ©ments Ã  Ã©viter"]);
    expectOneOf(siteBuilder, ["Résultat attendu", "RÃ©sultat attendu"]);
    expect(siteBuilder).toContain("Analyse du brief");
    expect(siteBuilder).toContain("Architecture du site/app");
    expect(siteBuilder).toContain("Contenu et conversion");
    expect(siteBuilder).toContain("Design et responsive");
    expectOneOf(siteBuilder, ["Génération finale", "GÃ©nÃ©ration finale"]);
    expect(siteBuilder).toContain("objectif");
    expect(siteBuilder).toContain("secteur");
    expect(siteBuilder).toContain("CTA");
    expect(siteBuilder).toContain('id: "site-builder"');
    expectNoSensitiveRegression(siteBuilder);
  });

  it("keeps Game Builder direct generation available and adds a separate game timeline", () => {
    const gameBuilder = readProjectFile("src/pages/GameBuilder.tsx");

    expect(gameBuilder).toContain("BuilderGenerationModeSelector");
    expect(gameBuilder).toContain("BuilderPlanTool");
    expect(gameBuilder).toContain("BuilderGenerationTimeline");
    expectOneOf(gameBuilder, ["Plan proposé par Pixelrises", "Plan proposÃ© par Pixelrises"]);
    expect(gameBuilder).toContain('useState<"direct" | "plan">("direct")');
    expect(gameBuilder).toContain('generationMode === "plan" && !planApproved');
    expectOneOf(gameBuilder, ["Générer prototype / package", "GÃ©nÃ©rer prototype / package"]);
    expectOneOf(gameBuilder, ["Créer le plan", "CrÃ©er le plan"]);
    expectOneOf(gameBuilder, ["Générer avec ce plan", "GÃ©nÃ©rer avec ce plan"]);
    expectOneOf(gameBuilder, ["Validez le plan Game Builder avant de lancer la génération.", "Validez le plan Game Builder avant de lancer la gÃ©nÃ©ration."]);
    expect(gameBuilder).toContain("Analyse du concept");
    expect(gameBuilder).toContain("Gameplay");
    expectOneOf(gameBuilder, ["Mécaniques", "MÃ©caniques"]);
    expect(gameBuilder).toContain("Prototype");
    expectOneOf(gameBuilder, ["Génération finale", "GÃ©nÃ©ration finale"]);
    expect(gameBuilder).toContain("type de jeu");
    expect(gameBuilder).toContain("plateforme");
    expect(gameBuilder).toContain("score");
    expectOneOf(gameBuilder, ["récompenses", "rÃ©compenses"]);
    expect(gameBuilder).not.toContain("livrable(s)");
    expect(gameBuilder).not.toMatch(/prototype pr(?:ê|Ãª)t/);
    expect(gameBuilder).toContain("Publication externe non automatique");
    expect(gameBuilder).toContain('id: "game-builder"');
    expectNoSensitiveRegression(gameBuilder);
  });

  it("keeps Agent Builder direct generation available and adds a separate agent timeline", () => {
    const agentBuilder = readProjectFile("src/pages/AgentBuilder.tsx");

    expect(agentBuilder).toContain("BuilderGenerationModeSelector");
    expect(agentBuilder).toContain("BuilderPlanTool");
    expect(agentBuilder).toContain("BuilderGenerationTimeline");
    expect(agentBuilder).toMatch(/Plan (proposé|proposÃ©) par Pixelrises/);
    expect(agentBuilder).toContain('useState<"direct" | "plan">("direct")');
    expect(agentBuilder).toContain('generationMode === "plan" && !planApproved');
    expect(agentBuilder).toMatch(/G(?:é|Ã©)n(?:é|Ã©)rer \/ renforcer l'agent/);
    expect(agentBuilder).toMatch(/Cr(?:é|Ã©)er le plan/);
    expect(agentBuilder).toMatch(/G(?:é|Ã©)n(?:é|Ã©)rer avec ce plan/);
    expect(agentBuilder).toMatch(/Validez le plan de l'agent avant de lancer la g(?:é|Ã©)n(?:é|Ã©)ration\./);
    expect(agentBuilder).toContain("Analyse de l'agent");
    expect(agentBuilder).toContain("Permissions et limites");
    expect(agentBuilder).toMatch(/R(?:é|Ã©)ponses et comportement/);
    expect(agentBuilder).toContain("Workflow");
    expect(agentBuilder).toMatch(/Cr(?:é|Ã©)ation finale/);
    expect(agentBuilder).toMatch(/actions autoris(?:é|Ã©)es/);
    expect(agentBuilder).toContain("validation humaine");
    expect(agentBuilder).not.toContain("action(s)");
    expect(agentBuilder).toMatch(/agent pr(?:ê|Ãª)t/);
    expect(agentBuilder).toContain("Aucune action externe automatique");
    expect(agentBuilder).toContain('id: "agent-builder"');
    expectNoSensitiveRegression(agentBuilder);
  });
});
