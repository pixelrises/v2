import { describe, expect, it } from "vitest";
import {
  exportProductLabDecisions,
  fallbackProductLabV1ReviewQueue,
  fallbackProductLabReviewQueue,
  getProductLabMissingTableMessage,
  getProductLabReviewStats,
  isProductLabMissingTableError,
  mergeProductLabReviewItems,
  writeProductLabDecision,
  type ProductLabDecisionMap,
} from "@/modules/product-lab/product-lab-review";

describe("Product Lab admin review", () => {
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
        persisted: "supabase",
      },
    };

    const items = mergeProductLabReviewItems(fallbackProductLabReviewQueue, decisions);

    expect(items[0].localDecision.applicationStatus).toBe("pr_ready");
    expect(items[0].localDecision.automationAction).toBe("hold");
  });

  it("counts review states for the admin dashboard", () => {
    const item = fallbackProductLabReviewQueue.items[0];
    const decisions = writeProductLabDecision({} as ProductLabDecisionMap, item.id, "needs_review", "A preciser.");
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

  it("turns Supabase schema cache errors into a V1 migration hint", () => {
    const error = {
      code: "PGRST205",
      message: "Could not find the table 'public.product_lab_v1_decisions' in the schema cache",
      details: "Could not find the table 'public.product_lab_v1_decisions' in the schema cache",
    };

    expect(isProductLabMissingTableError(error)).toBe(true);
    expect(getProductLabMissingTableMessage("v1")).toContain("20260509190000_repair_product_lab_v1_decisions_cache.sql");
  });
});
