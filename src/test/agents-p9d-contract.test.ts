import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { officialAgentBlueprints } from "@/modules/agents/agent-system";
import { agentRegistry } from "@/modules/registries";

const readProjectFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const expectedAgentIds = [
  "builder",
  "seo",
  "design",
  "copywriting",
  "conversion",
  "business",
  "support",
  "analytics",
  "automation",
  "content",
  "student",
  "operations",
  "improve",
  "game-design",
  "script",
  "assets",
  "publishing",
];

describe("P9-D Agents IA finalisation", () => {
  it("keeps every official agent visible and backed by a safe blueprint", () => {
    const registryIds = agentRegistry.map((agent) => agent.id);
    const blueprintIds = officialAgentBlueprints.map((agent) => agent.id);

    expect(registryIds).toEqual(expect.arrayContaining(expectedAgentIds));
    expect(blueprintIds).toEqual(expect.arrayContaining(expectedAgentIds));
    expect(officialAgentBlueprints.every((agent) => agent.permissions.length > 0)).toBe(true);
    expect(officialAgentBlueprints.every((agent) => agent.forbiddenActions.includes("publish_site_without_validation"))).toBe(true);
    expect(officialAgentBlueprints.every((agent) => agent.dataState === "example")).toBe(true);
  });

  it("redesigns Agents IA with search, filters, compact cards and safe studio coverage", () => {
    const agents = readProjectFile("src/pages/Agents.tsx");

    expect(agents).toContain("Agents IA");
    expect(agents).toContain("Créer un agent");
    expect(agents).toContain("Rechercher un agent");
    expect(agents).toContain("agentFilters");
    ["Business", "Design", "SEO", "Content", "Student", "Analytics", "Automatisation", "Game", "Support", "Operations"].forEach((label) => {
      expect(agents).toContain(label);
    });
    expect(agents).toContain("pixelrises-agents-interface-mode");
    expect(agents).toContain("Ouvrir Agent Studio");
    expect(agents).toContain("Couverture officielle");
    expect(agents).toContain("Aucun agent ne peut publier");
    expect(agents).not.toContain("Product Lab");
    expect(agents).not.toContain("admin");
  });

  it("redesigns Agent Studio with guided columns, mobile tabs, local actions and honest states", () => {
    const studio = readProjectFile("src/pages/AgentBuilder.tsx");

    expect(studio).toContain("Agent Studio");
    expect(studio).toContain("Brouillon non sauvegardé");
    expect(studio).toContain("Brief");
    expect(studio).toContain("Génération");
    expect(studio).toContain("Test");
    expect(studio).toContain("Finalisation");
    expect(studio).toContain("mobilePanelCopy");
    expect(studio).toContain("Brief de l'agent");
    expect(studio).toContain("Agent prêt à tester");
    expect(studio).toContain("Permissions & limites");
    expect(studio).toContain("Tester l'agent");
    expect(studio).toContain("Sauvegarder l'agent");
    expect(studio).toContain("Dupliquer l'agent");
    expect(studio).toContain("Exporter la configuration");
    expect(studio).toContain("Supprimer l'agent");
    expect(studio).toContain("Test local");
    expect(studio).toContain("Aucune action externe automatique");
    expect(studio).toContain("Aucun provider, token ou prompt système");
    expect(studio).toContain("Aucun débit si l'appel IA échoue");
    expect(studio).not.toContain("Agent publié");
    expect(studio).not.toContain("Email envoyé");
    expect(studio).not.toContain("Test réussi");
  });
});
