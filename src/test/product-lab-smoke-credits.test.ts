import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(join(process.cwd(), ".github/workflows/product-lab-nightly.yml"), "utf8");
const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const script = readFileSync(join(process.cwd(), "scripts/product-lab-smoke-credits.mjs"), "utf8");
const smokeGenerator = readFileSync(join(process.cwd(), "scripts/smoke-generate-site.mjs"), "utf8");
const adminSource = readFileSync(join(process.cwd(), "src/pages/Admin.tsx"), "utf8");

describe("Product Lab smoke QA credits", () => {
  it("refills only the dedicated smoke account before generator QA", () => {
    expect(packageJson).toContain('"product-lab:smoke-credits"');
    expect(workflow).toContain("Ensure V2 smoke QA credits");
    expect(workflow.indexOf("Ensure V2 smoke QA credits")).toBeLessThan(workflow.indexOf("Run V2 generator smoke QA"));
    expect(script).toContain("PIXELRISES_SMOKE_EMAIL");
    expect(script).toContain("product_lab_smoke_refill");
    expect(script).toContain("apply_credit_transaction");
  });

  it("caps nightly real QA cases so Product Lab does not burn credits or timeout", () => {
    expect(workflow).toContain("PRODUCT_LAB_SMOKE_MAX_CASES");
    expect(workflow).toContain("vars.PRODUCT_LAB_SMOKE_MAX_CASES || '3'");
    expect(smokeGenerator).toContain("PRODUCT_LAB_SMOKE_MAX_CASES");
    expect(smokeGenerator).toContain("Math.min(requestedDailyRealBudget, productLabSmokeMaxCases)");
  });

  it("does not let a stale browser cache grant admin access", () => {
    expect(adminSource).not.toContain("!hasAdminRole && !cachedAdmin");
    expect(adminSource).toContain("Ton rôle admin n'est pas confirmé côté Supabase");
    expect(adminSource).toContain("writeCachedAdminFlag(user.id, false)");
  });

  it("keeps V2 generator QA strict without false negatives on metadata wording", () => {
    expect(smokeGenerator).toContain("hasNicheEvidence");
    expect(smokeGenerator).toContain("nicheKey: testCase.expectedNiche");
    expect(smokeGenerator).toContain('content.sectionOrder.indexOf("final_cta")');
    expect(smokeGenerator).not.toContain('content.sectionOrder.at(-1) !== "final_cta"');
  });
});
