import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  exportProductLabDecisions,
  fallbackProductLabV1ReviewQueue,
  fallbackProductLabReviewQueue,
  getProductLabQueueRunKey,
  getUnsyncedProductLabDecisions,
  getProductLabMissingTableMessage,
  getProductLabRlsMessage,
  getProductLabReviewStats,
  getProductLabScopeConfig,
  isProductLabMissingTableError,
  isProductLabRlsError,
  mergeProductLabReviewItems,
  writeProductLabDecision,
  type ProductLabDecisionMap,
} from "@/modules/product-lab/product-lab-review";

const productLabReviewSource = readFileSync(
  join(process.cwd(), "src/modules/product-lab/product-lab-review.ts"),
  "utf8",
);

describe("Product Lab admin review", () => {
  const v2RunKey = getProductLabQueueRunKey(fallbackProductLabReviewQueue);

  it("merges review items with pending decisions by default", () => {
    const items = mergeProductLabReviewItems(fallbackProductLabReviewQueue, {});

    expect(items.length).toBeGreaterThan(0);
    expect(items[0].localDecision.status).toBe("pending");
  });

  it("records and exports admin decisions", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions = writeProductLabDecision({} as ProductLabDecisionMap, item.id, "approved", "OK avec garde-fous.", {
      automationAction: "authorize_next_run",
    });
    const exported = exportProductLabDecisions(decisions);

    expect(decisions[item.id].status).toBe("approved");
    expect(decisions[item.id].automationAction).toBe("authorize_next_run");
    expect(decisions[item.id].applicationStatus).toBe("pending");
    expect(exported).toContain("OK avec garde-fous.");
  });

  it("keeps PR-ready processing status visible in merged admin items", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions: ProductLabDecisionMap = {
      [item.id]: {
        itemId: item.id,
        status: "approved",
        note: "OK.",
        correctionRequest: "",
        rejectionMode: null,
        automationAction: "hold",
        decidedAt: "2026-05-07T00:00:00.000Z",
        applicationStatus: "pr_ready",
        processedAt: "2026-05-07T00:10:00.000Z",
        processedRun: { theme: "agent-builder" },
        sourceRunKey: v2RunKey,
        persisted: "supabase",
      },
    };

    const items = mergeProductLabReviewItems(fallbackProductLabReviewQueue, decisions);

    expect(items[0].localDecision.applicationStatus).toBe("pr_ready");
    expect(items[0].localDecision.automationAction).toBe("hold");
  });

  it("keeps controlled auto-merge status visible in merged admin items", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions: ProductLabDecisionMap = {
      [item.id]: {
        itemId: item.id,
        status: "approved",
        note: "OK.",
        correctionRequest: "",
        rejectionMode: null,
        automationAction: "hold",
        decidedAt: "2026-05-13T00:00:00.000Z",
        applicationStatus: "pr_ready",
        processedAt: "2026-05-13T00:10:00.000Z",
        processedRun: { prUrl: "https://github.com/pixelrises/v2/pull/42" },
        prUrl: "https://github.com/pixelrises/v2/pull/42",
        prNumber: 42,
        prStatus: "created",
        autoMergeStatus: "blocked",
        autoMergeBlockReason: "fichiers sensibles modifies",
        riskLevel: "high",
        touchedSensitiveFiles: [{ file: "supabase/migrations/x.sql", reason: "migration Supabase/RLS" }],
        sourceRunKey: v2RunKey,
        persisted: "supabase",
      },
    };

    const items = mergeProductLabReviewItems(fallbackProductLabReviewQueue, decisions);

    expect(items[0].localDecision.prUrl).toContain("/pull/42");
    expect(items[0].localDecision.autoMergeStatus).toBe("blocked");
    expect(items[0].localDecision.touchedSensitiveFiles?.[0].file).toContain("supabase/migrations");
  });

  it("detects local Product Lab decisions that still need Supabase sync", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions: ProductLabDecisionMap = {
      [item.id]: {
        itemId: item.id,
        status: "approved",
        note: "OK local.",
        correctionRequest: "",
        rejectionMode: null,
        automationAction: "authorize_next_run",
        decidedAt: "2026-05-10T00:00:00.000Z",
        applicationStatus: "pending",
        sourceRunKey: v2RunKey,
        persisted: "localStorage",
      },
      "already-synced": {
        itemId: "already-synced",
        status: "approved",
        note: "OK sync.",
        correctionRequest: "",
        rejectionMode: null,
        automationAction: "authorize_next_run",
        decidedAt: "2026-05-10T00:00:00.000Z",
        applicationStatus: "pending",
        sourceRunKey: v2RunKey,
        persisted: "supabase",
      },
    };

    expect(getUnsyncedProductLabDecisions(decisions, fallbackProductLabReviewQueue).map((decision) => decision.itemId)).toEqual([item.id]);
  });

  it("ignores local decisions that do not belong to the visible Product Lab queue", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions: ProductLabDecisionMap = {
      [item.id]: {
        itemId: item.id,
        status: "approved",
        note: "OK visible.",
        correctionRequest: "",
        rejectionMode: null,
        automationAction: "authorize_next_run",
        decidedAt: "2026-05-10T00:00:00.000Z",
        applicationStatus: "pending",
        sourceRunKey: v2RunKey,
        persisted: "localStorage",
      },
      "old-run-item": {
        itemId: "old-run-item",
        status: "approved",
        note: "Ancienne file.",
        correctionRequest: "",
        rejectionMode: null,
        automationAction: "authorize_next_run",
        decidedAt: "2026-05-09T00:00:00.000Z",
        applicationStatus: "pending",
        sourceRunKey: "old|run|item",
        persisted: "localStorage",
      },
    };

    expect(getUnsyncedProductLabDecisions(decisions, fallbackProductLabReviewQueue).map((decision) => decision.itemId)).toEqual([item.id]);
  });

  it("does not reuse an old validation when the same item id belongs to another run", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions: ProductLabDecisionMap = {
      [item.id]: {
        itemId: item.id,
        status: "approved",
        note: "Ancienne validation.",
        correctionRequest: "",
        rejectionMode: null,
        automationAction: "authorize_next_run",
        decidedAt: "2026-05-09T00:00:00.000Z",
        applicationStatus: "pending",
        sourceRunKey: "2026-05-09|2026-W19|Ancien theme",
        persisted: "supabase",
      },
    };

    const items = mergeProductLabReviewItems(fallbackProductLabReviewQueue, decisions);

    expect(items[0].localDecision.status).toBe("pending");
  });

  it("counts review states for the admin dashboard", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions = writeProductLabDecision({} as ProductLabDecisionMap, item.id, "needs_review", "A preciser.", {
      sourceRunKey: v2RunKey,
      sourceRun: fallbackProductLabReviewQueue.sourceRun,
    });
    const items = mergeProductLabReviewItems(fallbackProductLabReviewQueue, decisions);
    const stats = getProductLabReviewStats(items);

    expect(stats.needsReview).toBe(1);
    expect(stats.pending).toBe(0);
  });

  it("keeps correction requests and alternative rejection intent", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions = writeProductLabDecision({} as ProductLabDecisionMap, item.id, "rejected", "Pas comme ca.", {
      correctionRequest: "Proposer une version plus simple et plus premium.",
      rejectionMode: "alternative",
      automationAction: "request_alternative",
    });
    const exported = exportProductLabDecisions(decisions);

    expect(decisions[item.id].rejectionMode).toBe("alternative");
    expect(decisions[item.id].automationAction).toBe("request_alternative");
    expect(exported).toContain("plus simple et plus premium");
  });

  it("keeps V1 and V2 admin decisions isolated", () => {
    const v2Item = fallbackProductLabReviewQueue.items[0];
    const v1Item = fallbackProductLabV1ReviewQueue.items[0];
    const v2Decisions = writeProductLabDecision(
      {} as ProductLabDecisionMap,
      v2Item.id,
      "approved",
      "OK V2.",
      { automationAction: "authorize_next_run" },
      "v2",
    );
    const v1Decisions = writeProductLabDecision(
      {} as ProductLabDecisionMap,
      v1Item.id,
      "needs_review",
      "A revoir V1.",
      { automationAction: "hold" },
      "v1",
    );

    expect(v2Decisions[v2Item.id].status).toBe("approved");
    expect(v2Decisions[v1Item.id]).toBeUndefined();
    expect(v1Decisions[v1Item.id].status).toBe("needs_review");
    expect(v1Decisions[v2Item.id]).toBeUndefined();
    expect(fallbackProductLabV1ReviewQueue.sourceRun.theme).toContain("V1");
  });

  it("uses separate Product Lab tables for V1 and V2 in the shared admin", () => {
    const v1 = getProductLabScopeConfig("v1");
    const v2 = getProductLabScopeConfig("v2");

    expect(v1.reviewTable).toBe("product_lab_v1_review_items");
    expect(v1.decisionsTable).toBe("product_lab_v1_decisions");
    expect(v2.reviewTable).toBe("product_lab_review_items");
    expect(v2.decisionsTable).toBe("product_lab_decisions");
    expect(v1.storageKey).not.toBe(v2.storageKey);
  });

  it("keeps Supabase as the Product Lab source of truth before JSON fallback", () => {
    expect(productLabReviewSource).toContain("Supabase is the source GitHub Actions reads for admin approvals.");
    expect(productLabReviewSource).toContain('.eq("status", "open")');
    expect(productLabReviewSource.indexOf("if (remoteQueue)")).toBeLessThan(
      productLabReviewSource.indexOf("if (publicQueue)"),
    );
  });

  it("turns Supabase schema cache errors into a V1 migration hint", () => {
    const error = {
      code: "PGRST205",
      message: "Could not find the table 'public.product_lab_v1_decisions' in the schema cache",
      details: "Could not find the table 'public.product_lab_v1_decisions' in the schema cache",
    };

    expect(isProductLabMissingTableError(error)).toBe(true);
    expect(getProductLabMissingTableMessage("v1")).toContain("20260509194500_repair_product_lab_all_admin_tables_cache.sql");
  });

  it("turns Supabase schema cache errors into a V2 migration hint", () => {
    const error = {
      code: "PGRST205",
      message: "Could not find the table 'public.product_lab_decisions' in the schema cache",
      details: "Could not find the table 'public.product_lab_decisions' in the schema cache",
    };

    expect(isProductLabMissingTableError(error)).toBe(true);
    expect(getProductLabMissingTableMessage("v2")).toContain("20260509194500_repair_product_lab_all_admin_tables_cache.sql");
  });

  it("turns Supabase RLS errors into an admin-role repair hint", () => {
    const error = {
      code: "42501",
      message: 'new row violates row-level security policy for table "product_lab_v1_decisions"',
    };

    expect(isProductLabRlsError(error)).toBe(true);
    expect(getProductLabRlsMessage("v1")).toContain("public.user_roles");
    expect(getProductLabRlsMessage("v1")).toContain("20260509200000_repair_product_lab_rls_policies.sql");
  });
});
