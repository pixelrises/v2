import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BILLING_PLANS, CREDIT_PACKS } from "@/lib/billing";

const root = process.cwd();

const readProjectFile = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("billing contract", () => {
  it("keeps billing driven by plan keys and environment Price IDs", () => {
    const billingConfig = readProjectFile("src/lib/billing.ts");
    const pricingComponent = readProjectFile("src/components/Pricing.tsx");
    const sharedBilling = readProjectFile("supabase/functions/_shared/billing.ts");
    const createCheckout = readProjectFile("supabase/functions/create-checkout/index.ts");
    const stripeWebhook = readProjectFile("supabase/functions/stripe-webhook/index.ts");
    const generateSite = readProjectFile("supabase/functions/generate-site/index.ts");
    const creditProfitabilityMigration = readProjectFile("supabase/migrations/20260516001000_align_credit_cost_profitability.sql");
    const adminPage = readProjectFile("src/pages/Admin.tsx");

    expect(BILLING_PLANS.find((plan) => plan.key === "starter")?.monthlyCredits).toBe(80);
    expect(BILLING_PLANS.find((plan) => plan.key === "pro")?.monthlyCredits).toBe(240);
    expect(BILLING_PLANS.find((plan) => plan.key === "business")?.monthlyCredits).toBe(850);
    expect(BILLING_PLANS.find((plan) => plan.key === "starter")?.priceMonthlyEur).toBe(19);
    expect(BILLING_PLANS.find((plan) => plan.key === "pro")?.priceMonthlyEur).toBe(49);
    expect(BILLING_PLANS.find((plan) => plan.key === "business")?.priceMonthlyEur).toBe(149);
    expect(BILLING_PLANS.find((plan) => plan.key === "starter")?.stripePaymentLink).toBe(
      "https://buy.stripe.com/dRm14p8bb68Dc2rbONaZi0C",
    );
    expect(BILLING_PLANS.find((plan) => plan.key === "pro")?.stripePaymentLink).toBe(
      "https://buy.stripe.com/dRmeVf3UV54zgiHf0ZaZi0B",
    );
    expect(BILLING_PLANS.find((plan) => plan.key === "business")?.stripePaymentLink).toBe(
      "https://buy.stripe.com/28E7sN3UV9kPfeD1a9aZi0A",
    );
    expect(CREDIT_PACKS.map((pack) => [pack.key, pack.credits, pack.priceEur, pack.status])).toEqual([
      ["credits_100", 100, 29, "active"],
      ["credits_300", 300, 79, "active"],
      ["credits_750", 750, 179, "active"],
      ["credits_1500", 1500, 329, "active"],
    ]);

    for (const envName of [
      "STRIPE_PRICE_STARTER",
      "STRIPE_PRICE_PRO",
      "STRIPE_PRICE_BUSINESS",
      "STRIPE_PRICE_CREDITS_100",
      "STRIPE_PRICE_CREDITS_300",
      "STRIPE_PRICE_CREDITS_750",
      "STRIPE_PRICE_CREDITS_1500",
    ]) {
      expect(billingConfig).toContain(envName);
      expect(sharedBilling).toContain(envName);
    }

    expect(createCheckout).toContain("resolveCheckoutSelection");
    expect(stripeWebhook).toContain("getPlanByPriceId");
    expect(generateSite).toContain("const GENERATION_CREDIT_COST = 13");
    expect(generateSite).toContain("const IMPROVEMENT_CREDIT_COST = 4");
    expect(stripeWebhook).toContain('reason: "subscription_initial_grant"');
    expect(stripeWebhook).toContain('reason: "subscription_monthly_refill"');
    expect(stripeWebhook).toContain('checkoutKind === "credit_pack"');
    expect(stripeWebhook).toContain('reason: "credit_pack_purchase"');
    expect(stripeWebhook).toContain('existingEvent && existingEvent.status !== "error"');
    expect(stripeWebhook).toContain("session.payment_status");
    expect(adminPage).toContain("BILLING_ADMIN_PLAN_KEYS");
    expect(adminPage).toContain("Prix des credits et recharges mensuelles");
    expect(adminPage).toContain("Stripe ajoute les credits automatiquement");
    expect(adminPage).not.toContain('{ key: "starter", label: "Starter", credits: 10 }');
    expect(adminPage).not.toContain('{ key: "pro", label: "Pro", credits: 25 }');
    expect(adminPage).not.toContain('{ key: "business", label: "Business", credits: 60 }');
    expect(creditProfitabilityMigration).toContain("recommended_credit_cost");
    expect(creditProfitabilityMigration).toContain("estimated_internal_cost_eur");
    expect(creditProfitabilityMigration).toContain("('site_generation', 'site', 'standard', 5, 'advanced', 13");

    expect(pricingComponent).not.toContain("buy.stripe.com/7sYbJ3dvveF90jJf0ZaZi0q");
    expect(pricingComponent).not.toContain("buy.stripe.com/7sYdRbcrrcx1d6vdWVaZi0r");
    expect(pricingComponent).not.toContain("buy.stripe.com/eVq28t4YZ54z6I71a9aZi0s");
  });
});
