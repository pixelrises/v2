import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("AI Spaces storage contract", () => {
  it("prepares non-destructive Supabase tables with RLS", () => {
    const migration = readProjectFile("supabase/migrations/20260511203000_add_ai_spaces_tables.sql");

    expect(migration).toContain("create table if not exists public.ai_space_conversations");
    expect(migration).toContain("create table if not exists public.ai_space_messages");
    expect(migration).toContain("create table if not exists public.ai_space_usage_logs");
    expect(migration).toContain("create table if not exists public.ai_space_feedback");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).not.toContain("AI_GATEWAY_API_KEY");
    expect(migration).not.toContain("vck_");
  });

  it("keeps localStorage fallback while adding Supabase persistence", () => {
    const storage = readProjectFile("src/modules/ai-spaces/storage.ts");

    expect(storage).toContain("pixelrises-v2-ai-space-conversations");
    expect(storage).toContain("loadAISpaceConversations");
    expect(storage).toContain("saveAISpaceConversationTurnPersistent");
    expect(storage).toContain("saveAISpaceUsageLog");
    expect(storage).toContain("getReadableAISpaceStorageError");
    expect(storage).toContain('source: "localStorage"');
    expect(storage).toContain('source: "supabase"');
    expect(storage).toContain("Historique indisponible pour le moment");
    expect(storage).not.toContain("AI_GATEWAY_API_KEY");
    expect(storage).not.toContain("vck_");
  });

  it("proposes additive action and template history tables without secrets", () => {
    const migration = readProjectFile("supabase/migrations/20260513030000_add_ai_space_actions_templates_used.sql");

    expect(migration).toContain("create table if not exists public.ai_space_actions");
    expect(migration).toContain("create table if not exists public.ai_space_templates_used");
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).toContain("notify pgrst, 'reload schema'");
    expect(migration).not.toContain("AI_GATEWAY_API_KEY");
    expect(migration).not.toContain("vck_");
  });
});
