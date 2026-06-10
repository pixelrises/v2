import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("public pricing route", () => {
  it("routes /pricing to the public offers page instead of the internal billing page", () => {
    const app = readProjectFile("src/App.tsx");

    expect(app).toContain('const PublicPricing = lazy(() => import("./pages/PublicPricing"))');
    expect(app).toContain('<Route path="/pricing" element={<PublicPricing />} />');
    expect(app).not.toContain('<Route path="/pricing" element={<PricingPage />} />');
  });

  it("keeps navbar Pricing as the single public offers route", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");

    expect(navbar).toContain('{ id: 5, label: isFr ? "Tarifs" : "Pricing", href: "/pricing" }');
    expect(navbar).toContain('href: "/pricing"');
    expect(navbar).toContain('{ id: 6, label: "FAQ", href: "/#faq" }');
    expect(navbar).not.toContain('href: "/agence/prix"');
    expect(navbar).not.toContain('label: isFr ? "Offres agence"');
  });

  it("reuses the landing offers section and avoids internal account routes", () => {
    const page = readProjectFile("src/pages/PublicPricing.tsx");
    const pricing = readProjectFile("src/components/Pricing.tsx");
    const billing = readProjectFile("src/lib/billing.ts");

    expect(page).toContain('import Pricing from "@/components/Pricing"');
    expect(page).toContain("<Pricing />");
    expect(page).not.toContain("PricingPage");
    expect(page).not.toContain("BillingPage");

    for (const expected of [
      "Essentiel",
      "Professionnel",
      "Premium",
      "Maintenance Premium",
      "Maintenance Ultra",
    ]) {
      expect(pricing).toContain(expected);
    }

    for (const expectedPaymentLink of [
      "https://buy.stripe.com/eVqaEZgHHeF9d6v5qpaZi0k",
      "https://buy.stripe.com/8x200l3UVdB56I7065aZi0j",
      "https://buy.stripe.com/bJe00l4YZ9kP3vV1a9aZi0i",
      "https://buy.stripe.com/14A3cx8bbdB59Uj9GFaZi08",
      "https://buy.stripe.com/9B6bJ3bnncx19Uj7yxaZi0h",
    ]) {
      expect(pricing).toContain(expectedPaymentLink);
    }

    for (const expectedAiPaymentLink of [
      "https://buy.stripe.com/dRm14p8bb68Dc2rbONaZi0C",
      "https://buy.stripe.com/dRmeVf3UV54zgiHf0ZaZi0B",
      "https://buy.stripe.com/28E7sN3UV9kPfeD1a9aZi0A",
    ]) {
      expect(billing).toContain(expectedAiPaymentLink);
    }

    for (const forbiddenInternalRoute of [
      '"/billing"',
      '"/credits"',
      '"/admin"',
      '"/settings/billing"',
    ]) {
      expect(page).not.toContain(forbiddenInternalRoute);
    }
  });

  it("can open directly on the public AI subscriptions tab from the landing CTA", () => {
    const hero = readProjectFile("src/components/Hero.tsx");
    const pricing = readProjectFile("src/components/Pricing.tsx");

    expect(hero).toContain('to="/pricing?mode=ai#tarifs"');
    expect(hero).toContain("Tarifs");
    expect(pricing).toContain("useSearchParams");
    expect(pricing).toContain('searchParams.get("mode")');
    expect(pricing).toContain('requestedMode === "ai"');
    expect(pricing).toContain('const [view, setView] = useState<View>(initialView)');
  });
});
