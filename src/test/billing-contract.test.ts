import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const readProjectFile = (path: string) =>
  readFileSync(resolve(root, path), "utf8");

const OFFICIAL_OFFERS = [
  {
    priceId: "price_1TOQD8Ro0fDYDUP3kzJA5CrL",
    credits: 10,
    priceLabel: "13 €/paiement",
  },
  {
    priceId: "price_1TOQEIRo0fDYDUP3gOijNdUZ",
    credits: 25,
    priceLabel: "25 €/paiement",
  },
  {
    priceId: "price_1TOQEwRo0fDYDUP3BrzOoPEM",
    credits: 60,
    priceLabel: "49 €/paiement",
  },
  {
    priceId: "price_1TLA8ARo0fDYDUP3fbZmq3nR",
    credits: 10,
    priceLabel: "13 €/mois",
  },
  {
    priceId: "price_1TLADZRo0fDYDUP3dk4Rpcfq",
    credits: 25,
    priceLabel: "25 €/mois",
  },
  {
    priceId: "price_1TLAEwRo0fDYDUP3zmetuEq5",
    credits: 60,
    priceLabel: "49 €/mois",
  },
] as const;

const extractCreditMap = (source: string) => {
  const matches = [...source.matchAll(/"(price_[^"]+)":\s*(\d+)/g)];
  return Object.fromEntries(matches.map((match) => [match[1], Number(match[2])]));
};

describe("billing contract", () => {
  it("keeps official Price IDs and credit amounts aligned between frontend and Stripe functions", () => {
    const dashboard = readProjectFile("src/pages/Dashboard.tsx");
    const createCheckout = readProjectFile("supabase/functions/create-checkout/index.ts");
    const stripeWebhook = readProjectFile("supabase/functions/stripe-webhook/index.ts");
    const expectedCreditMap = Object.fromEntries(
      OFFICIAL_OFFERS.map((offer) => [offer.priceId, offer.credits]),
    );

    for (const offer of OFFICIAL_OFFERS) {
      expect(dashboard).toContain(`priceId: "${offer.priceId}"`);
      expect(dashboard).toContain(`priceLabel: "${offer.priceLabel}"`);
    }

    expect(extractCreditMap(createCheckout)).toEqual(expectedCreditMap);
    expect(extractCreditMap(stripeWebhook)).toEqual(expectedCreditMap);
  });
});
