import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import HomeModeSwitch from "@/components/HomeModeSwitch";

const root = process.cwd();
const readProjectFile = (path: string) => readFileSync(join(root, path), "utf8");

describe("P2 dynamic home landing", () => {
  it("renders the compact accessible Délégation / Espace IA switch", () => {
    const onModeChange = vi.fn();

    render(
      <MemoryRouter>
        <HomeModeSwitch mode="delegation" onModeChange={onModeChange} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Délégation" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Espace IA" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("switch", { name: /Basculer entre Délégation et Espace IA/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );

    fireEvent.click(screen.getByRole("switch", { name: /Basculer entre Délégation et Espace IA/i }));
    expect(onModeChange).toHaveBeenCalledWith("ai");
  });

  it("keeps Délégation as the default home mode and renders only one landing branch at a time", () => {
    const index = readProjectFile("src/pages/Index.tsx");

    expect(index).toContain('useState<LandingMode>("delegation")');
    expect(index).toContain('<Hero mode={landingMode} onModeChange={setLandingMode} />');
    expect(index).toContain('landingMode === "delegation"');
    expect(index).toContain("<SocialProof />");
    expect(index).toContain("<Benefits />");
    expect(index).toContain("<HowItWorks />");
    expect(index).not.toContain("<RecommendationModule />");
    expect(index).toContain("<BeforeAfter />");
    expect(index).not.toContain("<DemoShowcase />");
    expect(index).not.toContain("<ProjectCarousel />");
    expect(index).toContain("<Reviews />");
    expect(index).not.toContain("<Pricing />");
    expect(index).toContain("<FAQ />");
    expect(index).toContain("<Commission />");
    expect(index).toContain("<SocialSection />");
    expect(index).toContain("<FinalCTA />");
    expect(index).toContain("<AILanding />");
  });

  it("configures the six required hero titles and 5 second rotation", () => {
    const hero = readProjectFile("src/components/Hero.tsx");

    expect(hero).toContain("HERO_ROTATION_MS = 5000");
    expect(hero).toContain("Un site qui donne confiance en trois secondes.");
    expect(hero).toContain("Un site qui transforme vos visiteurs en clients.");
    expect(hero).toContain("Un site pensé pour vendre, pas juste exister.");
    expect(hero).toContain("Votre cockpit IA pour créer, organiser et développer sans limites.");
    expect(hero).toContain("Une équipe IA contrôlée pour avancer sans perdre le fil.");
    expect(hero).toContain("Des builders, agents et espaces IA reliés dans un seul OS.");
    expect(hero).toContain("Tester Pixelrises gratuitement");
    expect(hero).toContain("Tarifs");
    expect(hero).toContain('to="/pricing?mode=ai#tarifs"');
    expect(hero).not.toContain("Voir le dashboard démo");
    expect(hero).toContain("PixelrisesRetroGrid");
    expect(hero).toContain("renderAIHeroTitle");
    expect(hero).toContain("mx-auto mt-12 max-w-7xl");
    expect(hero).toContain('data-testid="ai-hero-dashboard-preview"');
    expect(hero).toContain('src="/dashboard-demo?landingHeroPreview=1"');
    expect(hero).toContain("DASHBOARD_HERO_FRAME_WIDTH = 2048");
    expect(hero).toContain("DASHBOARD_HERO_FRAME_HEIGHT = 1152");
    expect(hero).toContain("ResizeObserver");
    expect(hero).toContain("pointer-events-none absolute left-0 top-0 border-0 bg-black");
    expect(hero).toContain("Aperçu visuel en lecture seule");
    expect(hero).not.toContain("lg:grid-cols-[0.9fr_1.1fr]");
    expect(hero).not.toContain("Product Lab");
    expect(hero).not.toMatch(/\badmin\b/i);
    expect(hero).not.toMatch(/\bbilling\b/i);
    expect(hero).not.toMatch(/\bStripe\b/i);
    expect(hero).not.toMatch(/\bV1\b/i);
    expect(hero).not.toMatch(/\blegacy\b/i);
    expect(hero).not.toContain('href="#"');
    expect(hero).not.toContain("�");
  });

  it("creates a complete Espace IA landing with the expected sections and safe CTAs", () => {
    const aiLanding = readProjectFile("src/components/AILanding.tsx");

    expect(aiLanding).toContain("Un espace pour chaque besoin");
    expect(aiLanding).toContain("Créez avec des builders puissants");
    expect(aiLanding).toContain("Travaillez avec des agents IA contrôlés");
    expect(aiLanding).toContain("Organisez, analysez et automatisez");
    expect(aiLanding).toContain("Mode Direct / Mode Plan");
    expect(aiLanding).toContain("Comment ça marche ?");
    expect(aiLanding).toContain("Dashboard démo");
    expect(aiLanding).toContain("Questions fréquentes");
    expect(aiLanding).toContain("Prêt à transformer vos idées avec l'IA ?");
    expect(aiLanding).toContain("Automatisations");
    expect(aiLanding).toContain("Crédits");
    expect(aiLanding).toContain('to="/dashboard-demo"');
    expect(aiLanding).toContain('to="/pricing"');
    expect(aiLanding).toContain('href: "/builder/site"');
    expect(aiLanding).toContain('href: "/builder/game"');
    expect(aiLanding).toContain('href: "/builder/agent"');
  });

  it("shows the six AI spaces and the expanded builders vision without public private-system wording", () => {
    const aiLanding = readProjectFile("src/components/AILanding.tsx");

    expect(aiLanding).toContain("General AI");
    expect(aiLanding).toContain("Business AI");
    expect(aiLanding).toContain("Student AI");
    expect(aiLanding).toContain("Creator AI");
    expect(aiLanding).toContain("Management AI");
    expect(aiLanding).toContain("Enterprise AI");
    expect(aiLanding).toContain('href: "/espace-ia/general-ai"');
    expect(aiLanding).toContain('href: "/espace-ia/business-ai"');
    expect(aiLanding).toContain('href: "/espace-ia/student-ai"');
    expect(aiLanding).toContain("Site & App Builder");
    expect(aiLanding).toContain("Game Builder");
    expect(aiLanding).toContain("Agent Builder");
    expect(aiLanding).toContain("Agent SEO");
    expect(aiLanding).toContain("Agent Support");
    expect(aiLanding).toContain("Agent SAV");
    expect(aiLanding).not.toContain("Product Lab");
    expect(aiLanding).not.toMatch(/\badmin\b/i);
    expect(aiLanding).not.toMatch(/\bbilling\b/i);
    expect(aiLanding).not.toMatch(/\bStripe\b/i);
    expect(aiLanding).not.toMatch(/\bV1\b/i);
    expect(aiLanding).not.toMatch(/\blegacy\b/i);
    expect(aiLanding).not.toContain('href="#"');
    expect(aiLanding).not.toContain("�");
  });

  it("keeps the public FAQ wording free from payment-provider branding", () => {
    const faq = readProjectFile("src/components/FAQ.tsx");

    expect(faq).toContain("prestataire de paiement sécurisé");
    expect(faq).toContain("secure payment provider");
    expect(faq).not.toMatch(/\bStripe\b/i);
  });

  it("keeps dashboard-demo mapped to the current read-only V2 dashboard", () => {
    const demo = readProjectFile("src/pages/Demo.tsx");
    const dashboard = readProjectFile("src/pages/Dashboard.tsx");
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");

    expect(demo).toContain('import Dashboard from "./Dashboard"');
    expect(demo).toContain("<Dashboard readOnlyDemo />");
    expect(dashboard).toContain("readOnlyDemo?: boolean");
    expect(dashboard).toContain('data-testid={readOnlyDemo ? "dashboard-demo-readonly" : undefined}');
    expect(dashboard).toContain("Demo visuelle en lecture seule");
    expect(dashboard).toContain("sera disponible apres connexion au vrai espace Pixelrises.");
    expect(shell).toContain('readOnlyDemo && pathname === "/dashboard-demo" ? "/dashboard" : pathname');
    expect(shell).toContain("Lecture seule");
  });
});
