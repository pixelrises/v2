import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  BILLING_PLANS,
  CREDIT_PACKS,
  buildUsagePreview,
  calculateCreditCost,
  canPlanUseModel,
  estimateActionProfitability,
  getPlanBudgetConfig,
  getPlanCreditValueEur,
  isPlanBudgetSafeForAction,
  requiresPremiumModelConfirmation,
  simulateUsageSettlement,
} from "@/lib/billing";
import { PricingPage } from "@/pages/BillingPages";

describe("Phase 10 billing config", () => {
  it("keeps plans centralized with increasing monthly credits", () => {
    const free = BILLING_PLANS.find((plan) => plan.key === "free");
    const starter = BILLING_PLANS.find((plan) => plan.key === "starter");
    const pro = BILLING_PLANS.find((plan) => plan.key === "pro");
    const business = BILLING_PLANS.find((plan) => plan.key === "business");

    expect(free?.monthlyCredits).toBe(5);
    expect(starter?.monthlyCredits).toBeGreaterThan(free?.monthlyCredits || 0);
    expect(pro?.monthlyCredits).toBeGreaterThan(starter?.monthlyCredits || 0);
    expect(business?.monthlyCredits).toBeGreaterThan(pro?.monthlyCredits || 0);
  });

  it("calculates heavier and premium actions with higher credit costs", () => {
    const quick = calculateCreditCost({ actionType: "quick_rewrite", qualityMode: "economy" });
    const site = calculateCreditCost({ actionType: "site_generation", qualityMode: "standard" });
    const premiumGame = calculateCreditCost({ actionType: "game_prototype", qualityMode: "premium", planKey: "pro" });

    expect(site.credits).toBe(13);
    expect(site.credits).toBeGreaterThan(quick.credits);
    expect(premiumGame.credits).toBeGreaterThan(site.credits);
    expect(premiumGame.allowedForPlan).toBe(true);
  });

  it("blocks costly actions when credits are insufficient", () => {
    const preview = buildUsagePreview({
      balance: 2,
      actionType: "site_generation",
      qualityMode: "standard",
      planKey: "free",
    });

    expect(preview.hasEnoughCredits).toBe(false);
    expect(preview.balanceAfter).toBeLessThan(0);
  });

  it("does not debit credits for failed or cancelled usage", () => {
    expect(simulateUsageSettlement({ balance: 12, estimatedCredits: 5, status: "failed" })).toEqual({
      balance: 12,
      charged: 0,
      refunded: 0,
    });
    expect(simulateUsageSettlement({ balance: 12, estimatedCredits: 5, status: "cancelled" })).toEqual({
      balance: 12,
      charged: 0,
      refunded: 0,
    });
    expect(simulateUsageSettlement({ balance: 12, estimatedCredits: 5, status: "succeeded" }).balance).toBe(7);
  });

  it("keeps launch credits profitable through budget guards instead of overly generous quotas", () => {
    const starter = getPlanBudgetConfig("starter");
    const pro = getPlanBudgetConfig("pro");
    const business = getPlanBudgetConfig("business");
    const siteSafety = isPlanBudgetSafeForAction({
      planKey: "pro",
      actionType: "site_generation",
      qualityMode: "standard",
    });

    expect(starter.includedCredits).toBe(80);
    expect(pro.includedCredits).toBe(240);
    expect(business.includedCredits).toBe(850);
    expect(getPlanCreditValueEur("starter")).toBe(0.2375);
    expect(getPlanCreditValueEur("pro")).toBe(0.2042);
    expect(getPlanCreditValueEur("business")).toBe(0.1753);
    const fixedPricePacks = CREDIT_PACKS.filter((pack) => pack.status === "active" && pack.priceEur !== null && pack.credits !== null);
    const enterprisePack = CREDIT_PACKS.find((pack) => pack.key === "credits_1500");

    expect(fixedPricePacks.map((pack) => Number((pack.priceEur / pack.credits).toFixed(3)))).toEqual([
      0.29,
      0.263,
      0.239,
    ]);
    expect(enterprisePack?.status).toBe("quote");
    expect(enterprisePack?.priceEur).toBeNull();
    expect(enterprisePack?.quoteUrl).toContain("wa.me/33775256214");
    expect(starter.monthlyAiBudgetEur).toBeLessThan(starter.monthlyRevenueEur || 0);
    expect(pro.targetGrossMarginRatio).toBeGreaterThanOrEqual(0.75);
    expect(business.dailyAiBudgetEur).toBeLessThanOrEqual(5);
    expect(siteSafety.withinSingleActionBudget).toBe(true);
    expect(siteSafety.requiresConfirmation).toBe(true);
  });

  it("keeps full generations profitable against conservative internal cost estimates", () => {
    const sitePro = estimateActionProfitability({
      planKey: "pro",
      actionType: "site_generation",
      qualityMode: "standard",
    });
    const siteBusiness = estimateActionProfitability({
      planKey: "business",
      actionType: "site_generation",
      qualityMode: "standard",
    });
    const gameBusiness = estimateActionProfitability({
      planKey: "business",
      actionType: "game_prototype",
      qualityMode: "quality",
    });

    expect(sitePro.verdict).toBe("safe");
    expect(siteBusiness.verdict).toBe("safe");
    expect(sitePro.grossMarginRatio).toBeGreaterThanOrEqual(0.78);
    expect(siteBusiness.revenueToCostRatio).toBeGreaterThanOrEqual(3.5);
    expect(gameBusiness.credits).toBeGreaterThanOrEqual(90);
    expect(gameBusiness.verdict).toBe("safe");
  });

  it("gates expensive Gateway models by plan and human confirmation", () => {
    expect(canPlanUseModel("starter", "openai/gpt-4o-mini")).toBe(true);
    expect(requiresPremiumModelConfirmation("starter", "openai/gpt-4o-mini")).toBe(false);
    expect(canPlanUseModel("starter", "openai/gpt-4o")).toBe(false);
    expect(canPlanUseModel("pro", "openai/gpt-4o")).toBe(true);
    expect(requiresPremiumModelConfirmation("pro", "openai/gpt-4o")).toBe(true);
    expect(canPlanUseModel("business", "anthropic/claude-opus-4.5")).toBe(true);
    expect(requiresPremiumModelConfirmation("business", "anthropic/claude-opus-4.5")).toBe(true);
    expect(canPlanUseModel("business", "openai/gpt-5-pro")).toBe(false);
  });
});

describe("Phase 10 billing pages", () => {
  it("renders pricing without raw Stripe IDs or provider internals", () => {
    render(
      <MemoryRouter>
        <PricingPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Plans Pixelrises").length).toBeGreaterThan(0);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("240 credits")).toBeInTheDocument();

    const forbidden = ["price_", "STRIPE_SECRET_KEY", "provider", "AI Gateway", "webhook secret"];
    for (const word of forbidden) {
      expect(screen.queryByText(word, { exact: false })).not.toBeInTheDocument();
    }
  });
});
