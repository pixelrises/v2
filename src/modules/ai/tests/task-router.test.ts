import { describe, expect, it } from "vitest";
import { defaultRoutingRules, TaskRouter, type AITask } from "@/modules/ai";

const task: AITask = {
  id: "site-design-1",
  type: "site_design",
  description: "Design premium",
  priority: "medium",
  recommendedProvider: defaultRoutingRules.site_design.provider,
  fallbackProvider: defaultRoutingRules.site_design.fallbackProvider,
  input: { prompt: "site premium" },
  expectedOutputSchema: "site-design",
  status: "pending",
};

describe("TaskRouter", () => {
  it("falls back when Cloud Design is missing", () => {
    const router = new TaskRouter();
    const [routed] = router.route([task], "qualite");

    expect(routed.recommendedProvider).toBe("cloud-design");
    expect(routed.selectedProvider).toBe("gemini");
    expect(routed.fallbackChain).toContain("mock");
  });

  it("uses Mistral for fast project detection mode when configured route asks for it", () => {
    const router = new TaskRouter();
    const [routed] = router.route([{ ...task, type: "project_type_detection" }], "rapide");

    expect(routed.recommendedProvider).toBe("mistral");
    expect(["gemini", "mock"]).toContain(routed.selectedProvider);
  });
});
