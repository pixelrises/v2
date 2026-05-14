import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adminSource = readFileSync(join(process.cwd(), "src/pages/Admin.tsx"), "utf8");

describe("Admin Product Lab control center", () => {
  it("keeps the V1/V2 Product Lab cockpit focused on business operations", () => {
    expect(adminSource).toContain("CA 30j");
    expect(adminSource).toContain("Credits");
    expect(adminSource).toContain("Sites");
    expect(adminSource).toContain("Leads");
    expect(adminSource).toContain("Product Lab");
    expect(adminSource).toContain("Centre commun, donnees separees.");
    expect(adminSource).toContain("V1/V2:");
  });

  it("documents the automatic improvement loop and validation gates", () => {
    expect(adminSource).toContain("Cycle automatique");
    expect(adminSource).toContain("20 tests / version");
    expect(adminSource).toContain("5 a 8 propositions");
    expect(adminSource).toContain("PR controlee");
    expect(adminSource).toContain("Validation admin");
    expect(adminSource).toContain("Auto-merge");
    expect(adminSource).toContain("validation GitHub manuelle");
  });

  it("shows data protection rules without exposing secrets", () => {
    expect(adminSource).toContain("Protection des donnees");
    expect(adminSource).toContain("RLS et role admin");
    expect(adminSource).toContain("service role reste cote GitHub Actions uniquement");
    expect(adminSource).not.toContain("AI_GATEWAY_API_KEY");
    expect(adminSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY =");
  });

  it("keeps market inspirations as adapted principles, not copied products", () => {
    expect(adminSource).toContain("Benchmark & recherche produit");
    expect(adminSource).toContain("Inspirations adaptees a la vision Pixelrises");
    expect(adminSource).toContain("business-first");
    expect(adminSource).toContain("conversion-first");
  });
});
