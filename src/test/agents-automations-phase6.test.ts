import { describe, expect, it } from "vitest";
import {
  approveAgentAction,
  createValidatableAgentAction,
  forbiddenAgentCapabilities,
  getAgentBlueprint,
  officialAgentBlueprints,
  simulateAgentTest,
} from "@/modules/agents/agent-system";
import { createDefaultAgentProject, validateAgentProject } from "@/modules/creation-engine";
import {
  approveAutomationRun,
  automationScenarios,
  createPreparedAutomation,
  isExternalAutomationAction,
  simulateAutomationRun,
} from "@/modules/automations/automation-system";

describe("Phase 6 agents IA", () => {
  it("defines official agents with permissions, guardrails and honest status", () => {
    expect(officialAgentBlueprints.length).toBeGreaterThanOrEqual(10);
    expect(officialAgentBlueprints.map((agent) => agent.id)).toEqual(
      expect.arrayContaining(["business", "seo", "conversion", "support", "automation", "student", "game-design"]),
    );
    expect(officialAgentBlueprints.every((agent) => agent.permissions.length > 0)).toBe(true);
    expect(officialAgentBlueprints.every((agent) => agent.forbiddenActions.includes("send_email_without_validation"))).toBe(true);
    expect(officialAgentBlueprints.every((agent) => agent.dataState === "example")).toBe(true);
  });

  it("keeps custom agents safe by default", () => {
    const agent = createDefaultAgentProject();
    const quality = validateAgentProject(agent);

    expect(quality.passed).toBe(true);
    expect(agent.autonomyLevel).toBe("proposals_validated");
    expect(agent.permissions.publishWithApproval).toBe(false);
    expect(agent.forbiddenActions).toEqual(expect.arrayContaining(forbiddenAgentCapabilities.slice(0, 4)));
  });

  it("turns agent requests into validatable actions and blocks sensitive execution", () => {
    const agent = createDefaultAgentProject();
    const action = createValidatableAgentAction({
      agent,
      prompt: "Publie mon site et envoie un email au lead",
      actionType: "draft_message",
      title: "Brouillon sensible",
      description: "Préparer un brouillon sans l'envoyer.",
      targetModule: "Automations",
    });

    expect(action.riskLevel).toBe("high");
    expect(action.status).toBe("blocked");
    expect(approveAgentAction(action).status).toBe("blocked");
  });

  it("simulates a test chat with a proposed action and safety notes", () => {
    const blueprint = getAgentBlueprint("seo");
    const agent = createDefaultAgentProject();
    const result = simulateAgentTest(
      {
        ...agent,
        role: blueprint?.role ?? "SEO",
        allowedActions: blueprint?.permissions,
        forbiddenActions: blueprint?.forbiddenActions,
      },
      "Améliore le SEO de mon site de coach sportif à Lyon.",
    );

    expect(result.response).toContain("action");
    expect(result.proposedAction.status).toBe("proposed");
    expect(result.safetyNotes.join(" ")).toContain("Aucune action externe");
  });
});

describe("Phase 6 automatisations", () => {
  it("provides useful ready scenarios with validation and DataState", () => {
    expect(automationScenarios.length).toBeGreaterThanOrEqual(8);
    expect(automationScenarios.map((scenario) => scenario.id)).toEqual(
      expect.arrayContaining(["seo-after-site-generated", "lead-follow-up-draft", "conversion-score-low"]),
    );
    expect(automationScenarios.every((scenario) => scenario.dataState === "example")).toBe(true);
  });

  it("prepares external scenarios with human validation required", () => {
    const scenario = automationScenarios.find((item) => item.id === "lead-follow-up-draft");
    expect(scenario).toBeDefined();
    expect(isExternalAutomationAction(scenario!)).toBe(true);

    const prepared = createPreparedAutomation(scenario!);
    expect(prepared.validationRequired).toBe(true);
    expect(prepared.status).toBe("validation_required");
  });

  it("dry runs automations without executing external actions", () => {
    const scenario = automationScenarios.find((item) => item.id === "support-reply-draft")!;
    const run = simulateAutomationRun(scenario);
    const approved = approveAutomationRun(run);

    expect(run.status).toBe("validation_required");
    expect(run.result).toContain("Validation humaine");
    expect(approved.status).toBe("approved");
    expect(approved.result).toContain("Exécution réelle désactivée");
  });
});
