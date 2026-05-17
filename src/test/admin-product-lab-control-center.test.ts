import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adminSource = readFileSync(join(process.cwd(), "src/pages/Admin.tsx"), "utf8");

describe("Admin Product Lab control center", () => {
  it("keeps the V2 Product Lab cockpit focused on Product Lab operations", () => {
    expect(adminSource).toContain("Centre d'amelioration continue");
    expect(adminSource).toContain("Pas de metriques hors sujet ici.");
    expect(adminSource).toContain("Dernieres propositions recues");
    expect(adminSource).toContain("File active -");
    expect(adminSource).toContain("V2 live");
    expect(adminSource).not.toContain("Pixelrises V1");
    expect(adminSource).not.toContain("Workflow Pixelrises V1");
    expect(adminSource).not.toContain("Stripe et revenus recents");
    expect(adminSource).not.toContain("Solde total utilisateurs");
    expect(adminSource).not.toContain("Sites generes, publications");
    expect(adminSource).not.toContain("Prospects, statut commercial");
  });

  it("documents the automatic improvement loop and validation gates", () => {
    expect(adminSource).toContain("Boucle Product Lab");
    expect(adminSource).toContain("Audit complet");
    expect(adminSource).toContain("8 propositions");
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
    expect(adminSource).toContain("Analyse IA Gateway");
    expect(adminSource).toContain("Credits AI Gateway a verifier");
    expect(adminSource).toContain("Acces AI Gateway a verifier");
    expect(adminSource).toContain("Garde-fous");
  });

  it("loads Product Lab only after the Supabase admin role is confirmed", () => {
    expect(adminSource).toContain("adminReady");
    expect(adminSource).toContain("setAdminReady(true)");
    expect(adminSource).toContain("if (!adminReady) return;");
    expect(adminSource).toMatch(/setAdminReady\(true\);[\s\S]{0,220}loadProductLabStateForScope\(productLabScope\)/);
  });

  it("shows Product Lab proposal domains in the admin cards", () => {
    expect(adminSource).toContain("productLabDomainMeta");
    expect(adminSource).toContain("Domaine :");
    expect(adminSource).toContain("Marketing");
    expect(adminSource).toContain("Systeme");
    expect(adminSource).toContain("SEO");
    expect(adminSource).toContain("Generateur");
  });
});
