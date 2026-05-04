import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type {
  CustomAgentProject,
  GameProject,
  NormalizedSiteProject,
} from "@/modules/creation-engine";
import {
  readStoredProjects,
  saveStoredAgent,
  saveStoredGame,
  saveStoredProject,
  type StoredProject,
} from "./v2-storage";

type DbError = { message: string } | null;

type DynamicQuery = {
  upsert: (value: unknown) => Promise<{ error: DbError }>;
  insert: (value: unknown) => Promise<{ error: DbError }>;
  select: (columns?: string) => DynamicQuery;
  eq: (column: string, value: unknown) => DynamicQuery;
  order: (column: string, options?: { ascending?: boolean }) => DynamicQuery;
  limit: (count: number) => Promise<{ data: unknown; error: DbError }>;
  maybeSingle: () => Promise<{ data: unknown; error: DbError }>;
};

type DynamicSupabase = {
  auth: typeof supabase.auth;
  from: (table: string) => DynamicQuery;
};

type StorageResult<T> = {
  data: T;
  persisted: boolean;
  fallback: "supabase" | "localStorage";
  error?: string;
};

type GenerationRecord = {
  projectId?: string;
  provider?: string;
  model?: string;
  mode?: "plan" | "build" | "improve";
  input?: Record<string, unknown>;
  output?: unknown;
  qualityScore?: number;
  status?: string;
  errorMessage?: string;
};

const dynamicSupabase = supabase as unknown as DynamicSupabase;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => uuidPattern.test(value);

const getUserId = async () => {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

const toProjectRow = (project: StoredProject, userId: string) => ({
  id: project.id,
  user_id: userId,
  type: project.type,
  name: project.title,
  status: project.status,
  score: project.score,
  data: project.payload,
  updated_at: project.updatedAt,
});

const fromProjectRow = (row: Record<string, unknown>): StoredProject | null => {
  if (typeof row.id !== "string" || typeof row.type !== "string") return null;
  if (!["site", "agent", "game"].includes(row.type)) return null;

  return {
    id: row.id,
    type: row.type as StoredProject["type"],
    title: typeof row.name === "string" ? row.name : "Projet Pixelrises",
    status: typeof row.status === "string" ? (row.status as StoredProject["status"]) : "generated",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
    score: typeof row.score === "number" ? row.score : 0,
    payload: row.data as StoredProject["payload"],
  };
};

export class ProjectStorageAdapter {
  async saveProject(project: StoredProject): Promise<StorageResult<StoredProject>> {
    const userId = await getUserId();
    if (!userId || !isUuid(project.id)) {
      return this.fallbackToLocalStorage(project);
    }

    const { error } = await dynamicSupabase.from("projects").upsert(toProjectRow(project, userId));
    if (error) {
      return this.fallbackToLocalStorage(project, error.message);
    }

    return { data: project, persisted: true, fallback: "supabase" };
  }

  async getProject(projectId: string): Promise<StorageResult<StoredProject | null>> {
    const userId = await getUserId();
    if (!userId) {
      return {
        data: readStoredProjects().find((project) => project.id === projectId) ?? null,
        persisted: false,
        fallback: "localStorage",
      };
    }

    const { data, error } = await dynamicSupabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .eq("id", projectId)
      .maybeSingle();

    if (error || !data || typeof data !== "object") {
      return {
        data: readStoredProjects().find((project) => project.id === projectId) ?? null,
        persisted: false,
        fallback: "localStorage",
        error: error?.message,
      };
    }

    return {
      data: fromProjectRow(data as Record<string, unknown>),
      persisted: true,
      fallback: "supabase",
    };
  }

  async listProjects(): Promise<StorageResult<StoredProject[]>> {
    const userId = await getUserId();
    if (!userId) {
      return { data: readStoredProjects(), persisted: false, fallback: "localStorage" };
    }

    const { data, error } = await dynamicSupabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(60);

    if (error || !Array.isArray(data)) {
      return {
        data: readStoredProjects(),
        persisted: false,
        fallback: "localStorage",
        error: error?.message,
      };
    }

    return {
      data: data
        .map((row) => (typeof row === "object" && row ? fromProjectRow(row as Record<string, unknown>) : null))
        .filter(Boolean) as StoredProject[],
      persisted: true,
      fallback: "supabase",
    };
  }

  async updateProject(project: StoredProject) {
    return this.saveProject(project);
  }

  async saveGeneration(record: GenerationRecord): Promise<StorageResult<GenerationRecord>> {
    const userId = await getUserId();
    if (!userId || !record.projectId) {
      return { data: record, persisted: false, fallback: "localStorage" };
    }

    const { error } = await dynamicSupabase.from("generations").insert({
      project_id: record.projectId,
      user_id: userId,
      provider: record.provider ?? "frontend",
      model: record.model ?? "unknown",
      mode: record.mode ?? "build",
      input: record.input ?? {},
      output: record.output ?? {},
      quality_score: record.qualityScore ?? 0,
      status: record.status ?? "success",
      error_message: record.errorMessage ?? null,
    });

    return {
      data: record,
      persisted: !error,
      fallback: error ? "localStorage" : "supabase",
      error: error?.message,
    };
  }

  async saveVersion(project: StoredProject, changeSummary: string): Promise<StorageResult<StoredProject>> {
    const userId = await getUserId();
    if (!userId || !isUuid(project.id)) return this.fallbackToLocalStorage(project);

    const { error } = await dynamicSupabase.from("project_versions").insert({
      project_id: project.id,
      version_number: Date.now(),
      data: project.payload,
      change_summary: changeSummary,
    });

    if (error) return this.fallbackToLocalStorage(project, error.message);
    return { data: project, persisted: true, fallback: "supabase" };
  }

  async saveAgent(agent: CustomAgentProject): Promise<StorageResult<CustomAgentProject>> {
    const userId = await getUserId();
    if (!userId || !isUuid(agent.id)) {
      saveStoredAgent(agent);
      return { data: agent, persisted: false, fallback: "localStorage" };
    }

    const { error } = await dynamicSupabase.from("agents").upsert({
      id: agent.id,
      user_id: userId,
      project_id: agent.projectContext.projectId || null,
      name: agent.name,
      role: agent.role,
      goal: agent.goal,
      config: agent,
      permissions: agent.permissions,
    });

    if (error) {
      saveStoredAgent(agent);
      return { data: agent, persisted: false, fallback: "localStorage", error: error.message };
    }

    return { data: agent, persisted: true, fallback: "supabase" };
  }

  async saveGame(game: GameProject): Promise<StorageResult<GameProject>> {
    const userId = await getUserId();
    if (!userId || !isUuid(game.meta.projectId)) {
      saveStoredGame(game);
      return { data: game, persisted: false, fallback: "localStorage" };
    }

    const { error } = await dynamicSupabase.from("games").upsert({
      id: game.meta.projectId,
      user_id: userId,
      project_id: game.meta.projectId,
      platform: game.meta.platform,
      game_type: game.meta.gameType,
      title: game.meta.title,
      data: game,
    });

    if (error) {
      saveStoredGame(game);
      return { data: game, persisted: false, fallback: "localStorage", error: error.message };
    }

    return { data: game, persisted: true, fallback: "supabase" };
  }

  fallbackToLocalStorage(project: StoredProject, error?: string): StorageResult<StoredProject> {
    saveStoredProject(project);
    return {
      data: project,
      persisted: false,
      fallback: "localStorage",
      error,
    };
  }
}

export const projectStorageAdapter = new ProjectStorageAdapter();
