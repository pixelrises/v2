import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  BILLING_PLANS,
  buildUsagePreview,
  calculateCreditCost,
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
