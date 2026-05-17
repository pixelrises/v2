import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adminSource = readFileSync(join(process.cwd(), "src/pages/Admin.tsx"), "utf8");

describe("Admin Product Lab control center", () => {
  it("keeps the V1/V2 Product Lab cockpit focused on Product Lab operations", () => {
    expect(adminSource).toContain("Centre d'amelioration continue");
    expect(adminSource).toContain("Pas de metriques hors sujet ici.");
    expect(adminSource).toContain("File active -");
    expect(adminSource).toContain("V1/V2 live");
    expect(adminSource).not.toContain("Stripe et revenus recents");
    expect(adminSource).not.toContain("Solde total utilisateurs");
    expect(adminSource).not.toContain("Sites generes, publications");
    expect(adminSource).not.toContain("Prospects, statut commercial");
  });

  it("documents the automatic improvement loop and validation gates", () => {
    expect(adminSource).toContain("Boucle Product Lab");
    expect(adminSource).toContain("Audit complet");
    expect(adminSource).toContain("2 a 4 priorites");
    expect(adminSource).toContain("PR controlee");
    expect(adminSource).toContain("Validation admin");
    expect(adminSource).toContain("validation humaine");
  });

  it("shows data protection rules without exposing secrets", () => {
    expect(adminSource).toContain("Garde-fous");
    expect(adminSource).toContain("RLS et role admin");
    expect(adminSource).toContain("service role reste cote GitHub Actions uniquement");
    expect(adminSource).not.toContain("AI_GATEWAY_API_KEY");
    expect(adminSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY =");
  });

  it("keeps the visual cockpit centered on actionable run status", () => {
    expect(adminSource).toContain("Pilotage");
    expect(adminSource).toContain("Etat du cockpit");
    expect(adminSource).toContain("Run & schedule");
    expect(adminSource).toContain("Garde-fous");
  });
});
