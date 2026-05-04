import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredProject } from "@/modules/storage/v2-storage";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: mocks.getSession,
    },
    from: mocks.from,
  },
}));

const makeProject = (id = "site-dev-id"): StoredProject => ({
  id,
  type: "site",
  title: "Projet test",
  status: "generated",
  updatedAt: new Date("2026-05-05T00:00:00.000Z").toISOString(),
  score: 88,
  payload: {
    meta: {
      projectId: id,
      projectType: "site",
      businessName: "Projet test",
      niche: "service",
      goal: "generer des leads",
      targetAudience: "clients",
      city: "Paris",
      tier: "premium",
      style: "dark gold",
      language: "fr",
    },
    pages: [{ slug: "/", title: "Projet test", sections: [] }],
  } as StoredProject["payload"],
});

describe("ProjectStorageAdapter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.getSession.mockReset();
    mocks.from.mockReset();
  });

  it("falls back to localStorage when there is no session", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });

    const { projectStorageAdapter } = await import("@/modules/storage/project-storage-adapter");
    const project = makeProject();
    const result = await projectStorageAdapter.saveProject(project);

    expect(result.persisted).toBe(false);
    expect(result.fallback).toBe("localStorage");
    expect(window.localStorage.getItem("pixelrises-v2-projects")).toContain("Projet test");
  });

  it("falls back to localStorage for non-uuid mock ids even with a session", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });

    const { projectStorageAdapter } = await import("@/modules/storage/project-storage-adapter");
    const result = await projectStorageAdapter.saveProject(makeProject("site-mock-id"));

    expect(result.persisted).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
