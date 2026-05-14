import { describe, expect, it } from "vitest";
import {
  PRODUCT_LAB_SCOPES,
  buildProductLabPrStatusPayload,
  classifySensitiveFiles,
  evaluateAutoMergeSafety,
  filterActionableProductLabProposals,
  isAdminApprovedDecision,
  isVagueProductLabProposal,
  redactProductLabText,
} from "../../scripts/product-lab-governance.mjs";

describe("Product Lab governance", () => {
  it("keeps V1 and V2 Product Lab tables separated", () => {
    expect(PRODUCT_LAB_SCOPES.v1.reviewTable).toBe("product_lab_v1_review_items");
    expect(PRODUCT_LAB_SCOPES.v1.decisionsTable).toBe("product_lab_v1_decisions");
    expect(PRODUCT_LAB_SCOPES.v1.prStatusTable).toBe("product_lab_v1_pr_status");
    expect(PRODUCT_LAB_SCOPES.v2.reviewTable).toBe("product_lab_review_items");
    expect(PRODUCT_LAB_SCOPES.v2.decisionsTable).toBe("product_lab_decisions");
    expect(PRODUCT_LAB_SCOPES.v2.prStatusTable).toBe("product_lab_pr_status");
  });

  it("rejects vague Product Lab proposals before they reach the admin queue", () => {
    const vague = {
      title: "Ameliorer l'UX",
      description: "Ameliorer l'UX globalement.",
      concernedFiles: [],
    };
    const concrete = {
      title: "Clarifier le statut de sauvegarde locale dans Site Builder",
      description:
        "Ajouter un badge fallback local pres du bouton sauvegarder pour eviter que l'utilisateur pense que la sauvegarde cloud est active.",
      concernedFiles: ["src/pages/SiteBuilder.tsx"],
    };

    expect(isVagueProductLabProposal(vague)).toBe(true);
    expect(filterActionableProductLabProposals([vague, concrete])).toEqual([concrete]);
  });

  it("allows controlled auto-merge only after admin approval, green checks and non-sensitive changes", () => {
    const result = evaluateAutoMergeSafety({
      adminApproved: true,
      checksPassed: true,
      approvedFindings: [{ itemId: "site-builder-1", risk: "Faible" }],
      changedFiles: ["docs/product-lab-site-builder-safe-improvements.md"],
    });

    expect(result.allowed).toBe(true);
    expect(result.autoMergeStatus).toBe("eligible");
    expect(result.riskLevel).toBe("low");
  });

  it("blocks auto-merge when sensitive files are touched", () => {
    const result = evaluateAutoMergeSafety({
      adminApproved: true,
      checksPassed: true,
      approvedFindings: [{ itemId: "rls-1", risk: "Faible" }],
      changedFiles: ["supabase/migrations/20260513050000_add_product_lab_pr_status.sql"],
    });

    expect(result.allowed).toBe(false);
    expect(result.autoMergeStatus).toBe("blocked");
    expect(result.blockReason).toContain("fichiers sensibles");
    expect(result.touchedSensitiveFiles[0].reason).toContain("Supabase");
  });

  it("blocks auto-merge when checks fail or risk is high", () => {
    const result = evaluateAutoMergeSafety({
      adminApproved: true,
      checksPassed: false,
      approvedFindings: [{ itemId: "auth-1", risk: "Eleve" }],
      changedFiles: ["docs/safe.md"],
    });

    expect(result.allowed).toBe(false);
    expect(result.blockReason).toContain("lint/test/build");
    expect(result.blockReason).toContain("risque eleve");
  });

  it("requires an explicit admin approval decision", () => {
    expect(isAdminApprovedDecision({ status: "approved", automationAction: "authorize_next_run" })).toBe(true);
    expect(isAdminApprovedDecision({ status: "approved", automationAction: "hold" })).toBe(false);
    expect(isAdminApprovedDecision({ status: "rejected", automationAction: "authorize_next_run" })).toBe(false);
  });

  it("redacts sensitive values from Product Lab reports and PR status payloads", () => {
    const redacted = redactProductLabText(
      "AI_GATEWAY_API_KEY=vck_123456789012345678901234 email@test.com +33 6 12 34 56 78",
    );
    const payload = buildProductLabPrStatusPayload({
      itemId: "item-1",
      autoMergeBlockReason: "Bearer secret-token-1234567890",
      lastError: "sk-secret-1234567890abcdef",
    });

    expect(redacted).not.toContain("vck_123456");
    expect(redacted).not.toContain("email@test.com");
    expect(redacted).toContain("[REDACTED]");
    expect(payload.auto_merge_block_reason).toBe("[REDACTED]");
    expect(payload.last_error).toBe("[REDACTED]");
  });
});
