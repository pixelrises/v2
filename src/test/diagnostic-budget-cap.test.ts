import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("diagnostic budget cap", () => {
  it("keeps the public diagnostic recommendation capped by the declared budget", () => {
    const recommendation = readProjectFile("src/components/RecommendationModule.tsx");
    const analyzeUrl = readProjectFile("supabase/functions/analyze-url/index.ts");
    const floating = readProjectFile("src/components/FloatingButtons.tsx");

    expect(recommendation).toContain("capOfferByBudget");
    expect(recommendation).toContain('normalized.includes("moins")');
    expect(recommendation).toContain('return "Essentiel"');
    expect(recommendation).toContain("return capOfferByBudget(recommendedOffer, answers.budget)");

    expect(analyzeUrl).toContain("/moins|under/i");
    expect(analyzeUrl).toContain('return "Essentiel"');
    expect(analyzeUrl).toContain("(OFFER_RANK[proposed] || 0) > (OFFER_RANK[expected] || 0)");
    expect(analyzeUrl).not.toContain("(OFFER_RANK[proposed] || 0) < (OFFER_RANK[expected] || 0)");

    expect(floating).toContain('href="/diagnostic"');
    expect(floating).toContain("Faire le diagnostic");
    expect(floating).not.toContain('href="#tarifs"');
  });
});
