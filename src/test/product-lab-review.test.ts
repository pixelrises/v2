import { describe, expect, it } from "vitest";
import {
  exportProductLabDecisions,
  fallbackProductLabReviewQueue,
  getProductLabReviewStats,
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
});
