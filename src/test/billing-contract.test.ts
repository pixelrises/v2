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

    expect(BILLING_PLANS.find((plan) => plan.key === "starter")?.monthlyCredits).toBe(80);
    expect(BILLING_PLANS.find((plan) => plan.key === "pro")?.monthlyCredits).toBe(240);
    expect(BILLING_PLANS.find((plan) => plan.key === "business")?.monthlyCredits).toBe(850);
    expect(CREDIT_PACKS.every((pack) => pack.status === "coming_soon")).toBe(true);

    for (const envName of ["STRIPE_PRICE_STARTER", "STRIPE_PRICE_PRO", "STRIPE_PRICE_BUSINESS"]) {
      expect(billingConfig).toContain(envName);
      expect(sharedBilling).toContain(envName);
    }

    expect(createCheckout).toContain("resolveCheckoutSelection");
    expect(stripeWebhook).toContain("getPlanByPriceId");

    expect(pricingComponent).not.toContain("buy.stripe.com/7sYbJ3dvveF90jJf0ZaZi0q");
    expect(pricingComponent).not.toContain("buy.stripe.com/7sYdRbcrrcx1d6vdWVaZi0r");
    expect(pricingComponent).not.toContain("buy.stripe.com/eVq28t4YZ54z6I71a9aZi0s");
  });
});
