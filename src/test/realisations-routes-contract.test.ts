import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("realisations routes contract", () => {
  it("registers the complete realisations page and section-only routes", () => {
    const app = readProjectFile("src/App.tsx");

    expect(app).toContain('const Realisations = lazy(() => import("./pages/Realisations"))');
    expect(app).toContain('<Route path="/realisations" element={<Realisations />} />');
    expect(app).toContain('<Route path="/realisations/:section" element={<Realisations />} />');
    expect(app).not.toContain('path="/realisations/avant-apres"');
  });

  it("keeps the Realisations navbar menu pointed to dedicated public routes", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");
    const menuStart = navbar.indexOf("id: 4");
    const menuEnd = navbar.indexOf("{ id: 5", menuStart);
    const realisationsMenu = navbar.slice(menuStart, menuEnd);

    expect(realisationsMenu).toContain('label: isFr ? "Réalisations" : "Work"');
    expect(realisationsMenu).toContain('href: "/realisations"');
    expect(realisationsMenu).toContain('href: "/realisations/portfolio"');
    expect(realisationsMenu).toContain('href: "/realisations/demos"');
    expect(realisationsMenu).toContain('href: "/realisations/prototypes"');
    expect(realisationsMenu).not.toContain('href: "/realisations/exemples"');

    for (const forbiddenRoute of ["href=\"#\"", 'href: "/projects"', 'href: "/admin"', 'href: "/billing"', "Product Lab", "V1"]) {
      expect(realisationsMenu).not.toContain(forbiddenRoute);
    }
  });

  it("builds Realisations from portfolio, demos and prototypes without duplicating Avant / Apres", () => {
    const page = readProjectFile("src/pages/Realisations.tsx");

    expect(page).toContain('type RealisationsSection = "portfolio" | "demos" | "prototypes"');
    expect(page).toContain('const ProjectCarousel = lazy(() => import("@/components/ProjectCarousel"))');
    expect(page).toContain('const DemoShowcase = lazy(() => import("@/components/DemoShowcase"))');
    expect(page).not.toContain("PortfolioProof");
    expect(page).not.toContain("RealisationsSectionNav");
    expect(page).not.toContain("sectionOrder");

    const sectionMarkers = [...page.matchAll(/data-realisations-section="([^"]+)"/g)].map((match) => match[1]);
    expect([...new Set(sectionMarkers)].sort()).toEqual(["demos", "portfolio", "prototypes"]);

    for (const expectedCta of [
      'href: "/realisations/portfolio"',
      'href: "/realisations/demos"',
      'href: "/realisations/prototypes"',
      'to="/dashboard-demo"',
      'to="/agence/contact"',
      'to="/pricing"',
    ]) {
      expect(page).toContain(expectedCta);
    }

    for (const forbiddenContent of ["BeforeAfter", "Avant / Après", "Product Lab", "/admin", "/billing", 'href="#"']) {
      expect(page).not.toContain(forbiddenContent);
    }
    expect(page).not.toContain('href: "/realisations/exemples"');
    expect(page).not.toContain('data-realisations-section="exemples"');
  });

  it("keeps the prepared portfolio projects instead of replacing them with generic cards", () => {
    const projects = readProjectFile("src/data/portfolio-projects.ts");

    for (const expectedProject of [
      "Luxe Immobilier",
      "CoachFit",
      "Élégance Salon",
      "Luxe Events",
      "Voyages Paris",
      "Agence Marketing",
      "Paysagiste Paris",
      "TechStore Paris",
      "DéménagePro",
      "La Table d'Or",
      "Studio Photo",
      "Danse Studio",
      "Dr. Sourire",
      "Médical",
      "Auto-École Paris",
    ]) {
      expect(projects).toContain(expectedProject);
    }
  });

  it("keeps public demo CTAs away from removed landing anchors", () => {
    const demoShowcase = readProjectFile("src/components/DemoShowcase.tsx");

    expect(demoShowcase).toContain('to="/pricing"');
    expect(demoShowcase).not.toContain('href="#tarifs"');
    expect(demoShowcase).not.toContain('href="#"');
  });
});
