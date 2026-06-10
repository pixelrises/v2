import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("agence routes contract", () => {
  it("registers the complete agence page and section-only agence routes", () => {
    const app = readProjectFile("src/App.tsx");

    expect(app).toContain('const Agence = lazy(() => import("./pages/Agence"))');
    expect(app).toContain('<Route path="/agence" element={<Agence />} />');
    expect(app).toContain('<Route path="/agence/:section" element={<Agence />} />');
    expect(app).not.toContain('path="/agence/prix"');
  });

  it("keeps the former agency navbar entry as a simple home link without submenus", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");

    expect(navbar).toContain('label: isFr ? "Accueil"');
    expect(navbar).not.toContain('label: isFr ? "Agence"');
    expect(navbar).toContain('href: "/"');
    expect(navbar.indexOf('label: isFr ? "Accueil"')).toBeLessThan(navbar.indexOf('label: isFr ? "Produit"'));

    for (const removedNavbarRoute of [
      'href: "/agence/diagnostic"',
      'href: "/agence/benefices"',
      'href: "/agence/process"',
      'href: "/agence/avant-apres"',
      'href: "/agence/faq"',
      'href: "/agence/contact"',
    ]) {
      expect(navbar).not.toContain(removedNavbarRoute);
    }

    expect(navbar).toContain('{ id: 5, label: isFr ? "Tarifs" : "Pricing", href: "/pricing" }');
    expect(navbar).not.toContain('href: "/agence/prix"');
    expect(navbar).not.toContain('label: isFr ? "Offres agence"');
    expect(navbar).not.toContain('href="#"');
  });

  it("builds the agence page from real sections without duplicating the pricing page", () => {
    const agence = readProjectFile("src/pages/Agence.tsx");
    const howItWorks = readProjectFile("src/components/HowItWorks.tsx");

    for (const expectedSection of [
      'data-agence-section="diagnostic"',
      'data-agence-section="benefices"',
      'data-agence-section="process"',
      'data-agence-section="avant-apres"',
      'data-agence-section="faq"',
      'data-agence-section="contact"',
    ]) {
      expect(agence).toContain(expectedSection);
    }

    expect(agence).toContain('const Benefits = lazy(() => import("@/components/Benefits"))');
    expect(agence).toContain('const RecommendationModule = lazy(() => import("@/components/RecommendationModule"))');
    expect(agence).toContain('const HowItWorks = lazy(() => import("@/components/HowItWorks"))');
    expect(agence).toContain('const BeforeAfter = lazy(() => import("@/components/BeforeAfter"))');
    expect(agence).toContain('const FAQ = lazy(() => import("@/components/FAQ"))');

    expect(agence).not.toContain('data-agence-section="prix"');
    expect(agence).not.toContain('"prix" |');
    expect(agence).not.toContain("490€");
    expect(agence).not.toContain("790€");
    expect(agence).not.toContain("1190€");
    expect(agence).toContain('to="/pricing"');
    expect(howItWorks).toContain('href="/agence/diagnostic"');
    expect(howItWorks).not.toContain('href="#diagnostic"');
  });
});
