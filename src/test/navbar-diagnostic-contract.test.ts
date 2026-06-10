import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("navbar diagnostic link", () => {
  it("points Diagnostic to the dedicated public diagnostic page", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");
    const recommendation = readProjectFile("src/components/RecommendationModule.tsx");
    const app = readProjectFile("src/App.tsx");
    const diagnosticPage = readProjectFile("src/pages/Diagnostic.tsx");
    const hero = readProjectFile("src/components/Hero.tsx");

    expect(navbar).toContain('label: "Diagnostic"');
    expect(navbar).toContain('href: "/diagnostic"');
    expect(app).toContain('path="/diagnostic"');
    expect(diagnosticPage).toContain("<RecommendationModule />");
    expect(recommendation).toContain('id="diagnostic"');
    expect(hero).toContain('to="/diagnostic"');
    expect(hero).not.toContain('"/#diagnostic"');
    expect(hero).not.toContain("scrollToSection(\"diagnostic\")");
    expect(navbar.indexOf('label: isFr ? "Accueil"')).toBeLessThan(navbar.indexOf('label: "Diagnostic"'));
    expect(navbar.indexOf('label: "Diagnostic"')).toBeLessThan(navbar.indexOf('label: isFr ? "Produit"'));
  });
});
