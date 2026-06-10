import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CREDIT_PACKS } from "@/lib/billing";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("Billing dashboard design contract", () => {
  it("keeps the Credits & subscription page structured for a premium black/gold dashboard", () => {
    const page = readProjectFile("src/pages/BillingPages.tsx");

    for (const expected of [
      "Crédits & abonnement",
      "Gérez votre plan, vos crédits et vos recharges sans perdre le contrôle.",
      "Crédits disponibles",
      "Plan actuel",
      "Renouvellement",
      "Crédits utilisés",
      "Sécurité & protection",
      "Abonnement automatique",
      "Anti double-crédit",
      "Secours admin",
      "Votre abonnement",
      "Packs de crédits",
      "Meilleur ratio",
      "Gérer mon abonnement",
      "Historique crédits",
      "Changer de plan",
      "Vous gardez le contrôle",
      "Aucun débit caché",
    ]) {
      expect(page).toContain(expected);
    }

    expect(page).toContain("BillingMetricCard");
    expect(page).toContain("BillingProtectionItem");
    expect(page).toContain("BillingControlItem");
    expect(page).toContain("CREDIT_PACKS.map");
  });

  it("keeps pack values and purchase logic driven by the central billing config", () => {
    const page = readProjectFile("src/pages/BillingPages.tsx");

    expect(CREDIT_PACKS.map((pack) => [pack.label, pack.credits, pack.priceEur, pack.status])).toEqual([
      ["Boost", 100, 29, "active"],
      ["Growth", 300, 79, "active"],
      ["Scale", 750, 179, "active"],
      ["Entreprise", null, null, "quote"],
    ]);

    expect(page).toContain("startCreditPackCheckout(pack)");
    expect(page).toContain('supabase.functions.invoke("customer-portal")');
    expect(page).not.toContain("STRIPE_PRICE_CREDITS_100");
    expect(page).not.toContain("STRIPE_PRICE_STARTER");
  });

  it("does not add dead links, broken glyphs, or dashboard navigation changes", () => {
    const page = readProjectFile("src/pages/BillingPages.tsx");
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");

    expect(page).not.toContain('href="#"');
    expect(page).not.toContain('to="#"');
    expect(page).not.toContain("�");
    expect(shell).toContain("DashboardMobileCompleteMenu");
    expect(shell).toContain("DashboardMobileLimelightNav");
    expect(shell).toContain("hidden w-[240px]");
  });
});
