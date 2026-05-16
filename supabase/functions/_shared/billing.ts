export type PlanKey = "free" | "starter" | "pro" | "business" | "enterprise";
export type CheckoutKind = "subscription" | "credit_pack";

export type BillingPlan = {
  key: PlanKey;
  name: string;
  monthlyCredits: number | null;
  stripePriceEnv?: string;
  isActive: boolean;
};

export type CheckoutSelection = {
  kind: CheckoutKind;
  planKey?: PlanKey;
  packKey?: string;
  priceId: string;
  credits: number;
  metadata: Record<string, string>;
};

type CreditPack = {
  key: string;
  credits: number;
  stripePriceEnv?: string;
  isActive: boolean;
};

export const BILLING_PLANS: BillingPlan[] = [
  { key: "free", name: "Decouverte", monthlyCredits: 5, isActive: true },
  {
    key: "starter",
    name: "Starter",
    monthlyCredits: 80,
    stripePriceEnv: "STRIPE_PRICE_STARTER",
    isActive: true,
  },
  {
    key: "pro",
    name: "Pro",
    monthlyCredits: 240,
    stripePriceEnv: "STRIPE_PRICE_PRO",
    isActive: true,
  },
  {
    key: "business",
    name: "Business",
    monthlyCredits: 850,
    stripePriceEnv: "STRIPE_PRICE_BUSINESS",
    isActive: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyCredits: null,
    stripePriceEnv: "STRIPE_PRICE_ENTERPRISE",
    isActive: true,
  },
];

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    key: "credits_100",
    credits: 100,
    stripePriceEnv: "STRIPE_PRICE_CREDITS_100",
    isActive: true,
  },
  {
    key: "credits_300",
    credits: 300,
    stripePriceEnv: "STRIPE_PRICE_CREDITS_300",
    isActive: true,
  },
  {
    key: "credits_750",
    credits: 750,
    stripePriceEnv: "STRIPE_PRICE_CREDITS_750",
    isActive: true,
  },
  {
    key: "credits_1500",
    credits: 1500,
    isActive: false,
  },
] as const;

export const getPlanByKey = (planKey: string | null | undefined) =>
  BILLING_PLANS.find((plan) => plan.key === planKey);

export const getPlanByPriceId = (priceId: string | null | undefined) => {
  if (!priceId) return null;

  return (
    BILLING_PLANS.find((plan) => plan.stripePriceEnv && Deno.env.get(plan.stripePriceEnv) === priceId) || null
  );
};

const getRequiredPrice = (envName: string | undefined) => {
  if (!envName) return null;
  const value = Deno.env.get(envName);

  if (!value) {
    throw new Error(`missing_price_env:${envName}`);
  }

  return value;
};

export const resolveCheckoutSelection = (body: Record<string, unknown>): CheckoutSelection => {
  const planKey = typeof body.planKey === "string" ? body.planKey : null;
  const packKey = typeof body.packKey === "string" ? body.packKey : null;

  if (planKey) {
    const plan = getPlanByKey(planKey);

    if (!plan || !plan.isActive || plan.key === "free" || plan.monthlyCredits === null) {
      throw new Error("plan_not_available");
    }

    const priceId = getRequiredPrice(plan.stripePriceEnv);

    return {
      kind: "subscription",
      planKey: plan.key,
      priceId,
      credits: plan.monthlyCredits,
      metadata: {
        checkout_kind: "subscription",
        plan_key: plan.key,
        credit_amount: String(plan.monthlyCredits),
      },
    };
  }

  if (packKey) {
    const pack = CREDIT_PACKS.find((item) => item.key === packKey);

    if (!pack || !pack.isActive) {
      throw new Error("credit_pack_not_available");
    }

    const priceId = getRequiredPrice(pack.stripePriceEnv);

    return {
      kind: "credit_pack",
      packKey: pack.key,
      priceId,
      credits: pack.credits,
      metadata: {
        checkout_kind: "credit_pack",
        pack_key: pack.key,
        credit_amount: String(pack.credits),
      },
    };
  }

  const priceId = typeof body.priceId === "string" ? body.priceId : null;
  const plan = getPlanByPriceId(priceId);

  if (plan?.monthlyCredits) {
    return {
      kind: "subscription",
      planKey: plan.key,
      priceId: priceId!,
      credits: plan.monthlyCredits,
      metadata: {
        checkout_kind: "subscription",
        plan_key: plan.key,
        credit_amount: String(plan.monthlyCredits),
      },
    };
  }

  throw new Error("checkout_selection_required");
};

export const redactErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || "unknown_error");

  if (message.startsWith("missing_price_env:")) {
    return "Configuration de paiement manquante pour ce plan.";
  }

  if (message.includes("No such") || message.includes("secret") || message.includes("key")) {
    return "Une erreur de paiement est survenue.";
  }

  return "Une erreur est survenue. Reessayez.";
};

export const buildStripePayloadSummary = (
  eventId: string,
  eventType: string,
  details: Record<string, unknown> = {},
) => ({
  stripe_event_id: eventId,
  type: eventType,
  processed_at: new Date().toISOString(),
  details,
});
