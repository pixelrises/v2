import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Game Builder proposals and AI agent usability", () => {
  it("shows visible Game Builder proposals and avoids native select dropdowns", () => {
    const gameBuilder = readProjectFile("src/pages/GameBuilder.tsx");

    expect(gameBuilder).toContain("Exemples rapides");
    expect(gameBuilder).toContain("quickSuggestions");
    expect(gameBuilder).toContain('role="listbox"');
    expect(gameBuilder).not.toContain("<select");
  });

  it("opens Agent Studio with a concrete preset from every official agent card", () => {
    const agents = readProjectFile("src/pages/Agents.tsx");
    const agentBuilder = readProjectFile("src/pages/AgentBuilder.tsx");

    expect(agents).toContain("preset=${agent.id}");
    expect(agentBuilder).toContain("useSearchParams");
    expect(agentBuilder).toContain("applyAgentPreset");
    expect(agentBuilder).toContain("Agent Studio");
    expect(agentBuilder).toContain("setTestPrompt(getAgentBlueprint(selectedPreset.id)?.recommendedTestPrompt");
  });
});
