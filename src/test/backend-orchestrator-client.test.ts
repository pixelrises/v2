import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
}));

describe("runBackendAIOrchestrator", () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
  });

  it("calls the server-only ai-orchestrator function", async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        success: true,
        projectType: "site",
        mode: "build",
        source: "real",
        persisted: true,
      },
      error: null,
    });

    const { runBackendAIOrchestrator } = await import("@/modules/ai/backend-orchestrator");
    const result = await runBackendAIOrchestrator({
      projectType: "site",
      mode: "build",
      prompt: "Cree un site premium",
    });

    expect(mocks.invoke).toHaveBeenCalledWith("ai-orchestrator", {
      body: {
        projectType: "site",
        mode: "build",
        prompt: "Cree un site premium",
      },
    });
    expect(result.success).toBe(true);
    expect(result.source).toBe("real");
  });

  it("returns a clean fallback response if the edge function fails", async () => {
    mocks.invoke.mockResolvedValue({
      data: null,
      error: { message: "Function unavailable" },
    });

    const { runBackendAIOrchestrator } = await import("@/modules/ai/backend-orchestrator");
    const result = await runBackendAIOrchestrator({
      projectType: "agent",
      prompt: "Cree un agent SEO",
    });

    expect(result.success).toBe(false);
    expect(result.source).toBe("mock-fallback");
    expect(result.errors?.[0]).toContain("Function unavailable");
  });

  it("redacts secrets from backend errors and routing trace", async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        success: false,
        projectType: "site",
        mode: "build",
        source: "mock-fallback",
        errors: ["Gateway failed with bearer vck_123456789012345678901234"],
        routingTrace: [
          {
            taskType: "site_copywriting",
            role: "openai",
            model: "test-model",
            success: false,
            error: "authorization bearer sk-123456789012345678901234",
          },
        ],
      },
      error: null,
    });

    const { runBackendAIOrchestrator } = await import("@/modules/ai/backend-orchestrator");
    const result = await runBackendAIOrchestrator({
      projectType: "site",
      prompt: "Cree un site premium",
    });

    expect(result.errors?.[0]).toContain("[REDACTED]");
    expect(result.errors?.[0]).not.toContain("vck_");
    expect(result.routingTrace?.[0].error).toContain("[REDACTED]");
    expect(result.routingTrace?.[0].error).not.toContain("sk-");
  });
});
