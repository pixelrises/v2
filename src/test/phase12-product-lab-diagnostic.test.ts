import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getProductLabScheduleInfo, getProductLabReviewLimits } from "../../scripts/product-lab-core.mjs";
import { redactProductLabText } from "../../scripts/product-lab-governance.mjs";

const readProjectFile = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("Phase 12 Product Lab diagnostics", () => {
  it("documents the UTC cron required for midnight Europe/Paris", () => {
    const summer = getProductLabScheduleInfo(new Date("2026-05-14T12:00:00.000Z"));
    const winter = getProductLabScheduleInfo(new Date("2026-01-14T12:00:00.000Z"));

    expect(summer.targetLocalTime).toBe("00:00 Europe/Paris");
    expect(summer.activeMidnightUtcLabel).toBe("22:00 UTC");
    expect(winter.activeMidnightUtcLabel).toBe("23:00 UTC");
    expect(summer.configuredCronsUtc).toContain("0 22 * * *");
    expect(winter.configuredCronsUtc).toContain("0 23 * * *");
  });

  it("keeps proposal volume configurable but capped for the admin queue", () => {
    const previous = process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS;
    delete process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS;

    expect(getProductLabReviewLimits()).toEqual({ min: 8, max: 8 });

    process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS = "10";

    expect(getProductLabReviewLimits()).toEqual({ min: 8, max: 10 });

    if (previous === undefined) {
      delete process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS;
    } else {
      process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS = previous;
    }
  });

  it("exposes manual Product Lab controls and blocks Supabase writes in dry-run mode", () => {
    const workflow = readProjectFile(".github/workflows/product-lab-nightly.yml");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("environment: v2");
    expect(workflow).toContain("dryRun:");
    expect(workflow).toContain("forceGenerate:");
    expect(workflow).toContain("maxProposals:");
    expect(workflow).toContain('default: "8"');
    expect(workflow).toContain('PRODUCT_LAB_MIN_REVIEW_ITEMS: "8"');
    expect(workflow).toContain('PRODUCT_LAB_MAX_REVIEW_ITEMS: "8"');
    expect(workflow).toContain("mode:");
    expect(workflow).toContain("Resolve Product Lab mode");
    expect(workflow).toContain("id: product_lab_core");
    expect(workflow).toContain("continue-on-error: true");
    expect(workflow).toContain("Diagnose Product Lab AI Gateway review configuration");
    expect(workflow).toContain("steps.run_mode.outputs.dry_run != 'true'");
    expect(workflow).toContain("PRODUCT_LAB_CORE_OUTCOME");
    expect(workflow).toContain("npm run product-lab:run-status:record");
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(readProjectFile("package.json")).toContain('"product-lab:diagnostic"');
    expect(readProjectFile("package.json")).toContain('"product-lab:now"');
    expect(readProjectFile("package.json")).toContain('"product-lab:ai-review"');
    expect(readProjectFile("package.json")).toContain('"product-lab:ai-review:diagnose"');
  });

  it("provides a local Product Lab now command that writes proposals and run status safely", () => {
    const localRunner = readProjectFile("scripts/product-lab-now.mjs");
    const supabaseSync = readProjectFile("scripts/product-lab-supabase.mjs");

    expect(localRunner).toContain("scripts/product-lab.mjs");
    expect(localRunner).toContain("scripts/product-lab-supabase.mjs");
    expect(localRunner).toContain("push-proposals");
    expect(localRunner).toContain("scripts/product-lab-ai-review.mjs");
    expect(localRunner).toContain("record-run");
    expect(localRunner).toContain("shouldApplyFixes");
    expect(localRunner).toContain('mode === "prMode" || mode === "autoMergeControlled"');
    expect(localRunner).toContain('PRODUCT_LAB_REQUIRE_SUPABASE_SYNC: "true"');
    expect(localRunner).toContain("dry-run complete. No Supabase write was attempted.");
    expect(localRunner).not.toContain("create-pull-request");
    expect(localRunner).not.toContain("gh pr merge");
    expect(supabaseSync).toContain("normalizeRunSourceForDb");
    expect(supabaseSync).toContain("process.env.NEXT_PUBLIC_SUPABASE_URL");
    expect(supabaseSync).toContain("rawUrl?.trim()");
    expect(supabaseSync).toContain("rawServiceRoleKey?.trim()");
    expect(supabaseSync).toContain("getServiceRoleDiagnostics");
    expect(supabaseSync).toContain("issuer_matches_url");
    expect(supabaseSync).toContain("archiveProcessedReviewItems");
    expect(supabaseSync).toContain("open-review-items.json");
    expect(supabaseSync).toContain("buildRescueReviewQueue");
    expect(supabaseSync).toContain("Product Lab Supabase proposal sync rescued");
    expect(supabaseSync).toContain("Existing open backlog kept");
    expect(supabaseSync).toContain("already open");
    expect(supabaseSync).toContain('["scheduled", "manual", "local", "workflow_dispatch"]');
    expect(supabaseSync).toContain("const source = normalizeRunSourceForDb(requestedSource)");
  });

  it("diagnoses AI Gateway without spending credits or exposing secrets", () => {
    const aiReview = readProjectFile("scripts/product-lab-ai-review.mjs");

    expect(aiReview).toContain("Product Lab AI Gateway diagnostics");
    expect(aiReview).toContain("This diagnostic does not spend AI credits");
    expect(aiReview).toContain("auth_required");
    expect(aiReview).toContain("credits_required");
    expect(aiReview).toContain("cacheControl");
    expect(aiReview).toContain("feature:product-lab");
    expect(aiReview).not.toContain("sk_live_");
    expect(aiReview).not.toContain("vck_");
  });

  it("prepares Product Lab run observability tables with RLS and explicit grants", () => {
    const migration = readProjectFile("supabase/migrations/20260514063000_phase12_product_lab_runs_observability.sql");

    expect(migration).toContain("create table if not exists public.product_lab_runs");
    expect(migration).toContain("create table if not exists public.product_lab_reports");
    expect(migration).toContain("alter table public.product_lab_runs enable row level security");
    expect(migration).toContain("revoke all on table");
    expect(migration).toContain("from anon");
    expect(migration).toContain("grant select on table");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("grant all on table");
    expect(migration).toContain("to service_role");
  });

  it("keeps the local diagnostic non-destructive and redacted", () => {
    const diagnostic = readProjectFile("scripts/product-lab-diagnostic.mjs");

    expect(diagnostic).toContain("Clarifier l'etat vide Product Lab dans l'admin");
    expect(diagnostic).toContain("forceGenerate");
    expect(diagnostic).toContain("redactProductLabObject");
    expect(diagnostic).not.toContain("gh pr merge");
    expect(diagnostic).not.toContain("create-pull-request");
  });

  it("redacts real secrets without redacting run dates or report paths", () => {
    const redacted = redactProductLabText("reports/product-lab/diagnostics/phase12-2026-05-14.md token=sk_live_1234567890abcdef");

    expect(redacted).toContain("phase12-2026-05-14.md");
    expect(redacted).not.toContain("sk_live_1234567890abcdef");
  });
});
