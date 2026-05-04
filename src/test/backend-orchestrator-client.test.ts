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
});
