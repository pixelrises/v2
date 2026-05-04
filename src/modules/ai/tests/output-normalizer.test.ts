import { describe, expect, it } from "vitest";
import { OutputNormalizer, type AIProviderTaskResult } from "@/modules/ai";

describe("OutputNormalizer", () => {
  it("normalizes invalid JSON-like provider output into a stable site fallback", () => {
    const normalizer = new OutputNormalizer();
    const result: AIProviderTaskResult = {
      taskId: "site-structure-1",
      taskType: "site_structure",
      providerId: "mock",
      success: true,
      output: "not json",
      durationMs: 1,
      estimatedTokens: 10,
      estimatedCost: 0,
    };

    const normalized = normalizer.normalize(result);

    expect(normalized.outputType).toBe("site");
    expect(normalized.data).toHaveProperty("pages");
  });

  it("forces safe agent permissions", () => {
    const normalizer = new OutputNormalizer();
    const agent = normalizer.normalizeAgent({
      name: "Agent Unsafe",
      permissions: {
        readProject: true,
        suggestChanges: true,
        editWithApproval: true,
        publishWithApproval: true,
      },
    });

    expect(agent.permissions.editWithApproval).toBe(false);
    expect(agent.permissions.publishWithApproval).toBe(false);
  });
});
