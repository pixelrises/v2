import { describe, expect, it } from "vitest";
import {
  createDefaultAgentProject,
  createMockGameProject,
  createMockSiteProject,
  createProjectPlan,
  detectProjectType,
  validateAgentProject,
  validateGameProject,
  validateSiteProject,
} from "@/modules/creation-engine";

describe("Pixelrises V2 creation engine", () => {
  it("detects the right project family from an idea", () => {
    expect(detectProjectType("Créer un jeu Roblox obby")).toBe("game");
    expect(detectProjectType("Créer un agent SEO")).toBe("agent");
    expect(detectProjectType("Créer une landing pour un restaurant")).toBe("site");
  });

  it("creates safe plan-mode output", () => {
    const plan = createProjectPlan({ idea: "Créer un jeu Minecraft survival" });

    expect(plan.projectType).toBe("game");
    expect(plan.mode).toBe("plan");
    expect(plan.risks.join(" ")).toContain("API");
    expect(plan.nextSteps.length).toBeGreaterThan(0);
  });

  it("validates canonical site, agent and game projects", () => {
    const siteQuality = validateSiteProject(createMockSiteProject({ businessName: "Atelier Test" }));
    const agentQuality = validateAgentProject(createDefaultAgentProject());
    const gameQuality = validateGameProject(createMockGameProject({ platform: "Roblox" }));

    expect(siteQuality.passed).toBe(true);
    expect(agentQuality.passed).toBe(true);
    expect(gameQuality.passed).toBe(true);
    expect(gameQuality.requiredFixes).toEqual([]);
  });

  it("creates different site blueprints for different niches", () => {
    const restaurant = createMockSiteProject({
      businessName: "Maison Riviera",
      niche: "restaurant premium",
      city: "Lyon",
      goal: "obtenir des reservations",
    });
    const carRental = createMockSiteProject({
      businessName: "Drive Elite",
      niche: "location voiture premium",
      city: "Paris",
      goal: "recevoir des demandes de disponibilite",
    });

    const restaurantLayouts = restaurant.pages[0].sections.map((section) => section.layout);
    const carRentalLayouts = carRental.pages[0].sections.map((section) => section.layout);

    expect(restaurantLayouts).not.toEqual(carRentalLayouts);
    expect(restaurant.conversion.recommendedSections.join(" ")).toContain("Menu");
    expect(carRental.conversion.recommendedSections.join(" ")).toContain("Flotte");
    expect(validateSiteProject(restaurant).passed).toBe(true);
    expect(validateSiteProject(carRental).passed).toBe(true);
  });

  it("blocks generic template-like site output", () => {
    const generic = createMockSiteProject({
      businessName: "Projet Test",
      niche: "service premium",
      city: "France",
    });

    generic.pages[0].sections = generic.pages[0].sections.map((section) => ({
      ...section,
      title: "Bienvenue sur notre site",
      subtitle: "Decouvrez nos services de qualite",
      content: "Votre entreprise propose une solution sur mesure.",
      layout: "same-template",
    }));

    const quality = validateSiteProject(generic);

    expect(quality.passed).toBe(false);
    expect(quality.requiredFixes.join(" ")).toContain("generique");
    expect(quality.requiredFixes.join(" ")).toContain("layouts");
  });

  it("blocks accented generic copy and vague CTAs", () => {
    const generic = createMockSiteProject({
      businessName: "Nova Test",
      niche: "consulting local",
      city: "Paris",
      goal: "recevoir des demandes",
    });

    generic.strategy.primaryCTA = "En savoir plus";
    generic.pages[0].sections = generic.pages[0].sections.map((section, index) => ({
      ...section,
      title: `Bloc générique ${index}`,
      subtitle: "Des solutions adaptées à votre secteur d’activité",
      content: "Notre expertise à votre service avec des services de qualité et un accompagnement personnalisé.",
      cta: { label: "Découvrir nos services", action: "#contact" },
    }));

    const quality = validateSiteProject(generic);

    expect(quality.passed).toBe(false);
    expect(quality.requiredFixes.join(" ")).toContain("generique");
    expect(quality.requiredFixes.join(" ")).toContain("CTA");
  });
});
