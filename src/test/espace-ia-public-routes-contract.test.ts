import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

const expectedRoutes = [
  "/espace-ia/general-ai",
  "/espace-ia/business-ai",
  "/espace-ia/student-ai",
  "/espace-ia/creator-ai",
  "/espace-ia/management-ai",
  "/espace-ia/enterprise-ai",
];

describe("public Espace IA routes contract", () => {
  it("registers the public Espace IA landing and locked space detail route", () => {
    const app = readProjectFile("src/App.tsx");
    const data = readProjectFile("src/data/public-ai-spaces.ts");

    expect(app).toContain('const EspaceIA = lazy(() => import("./pages/EspaceIA"))');
    expect(app).toContain('const PublicAISpace = lazy(() => import("./pages/PublicAISpace"))');
    expect(app).toContain('<Route path="/espace-ia" element={<EspaceIA />} />');
    expect(app).toContain('<Route path="/espace-ia/:spaceSlug" element={<PublicAISpace />} />');
    expect(app).not.toContain('<Route path="/espace-ia" element={<Navigate to="/ai-spaces" replace />} />');

    for (const route of expectedRoutes) {
      expect(data).toContain(`slug: "${route.replace("/espace-ia/", "")}"`);
    }
  });

  it("keeps the Espace IA navbar menu pointed to public routes only", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");
    const menuStart = navbar.indexOf("id: 3");
    const menuEnd = navbar.indexOf("id: 4", menuStart);
    const espaceIAMenu = navbar.slice(menuStart, menuEnd);

    expect(espaceIAMenu).toContain('href: "/espace-ia"');
    for (const route of expectedRoutes) {
      expect(espaceIAMenu).toContain(`href: "${route}"`);
    }
    expect(espaceIAMenu).toContain('href: "/dashboard-demo"');
    expect(espaceIAMenu).toContain('href: "/pricing"');

    for (const forbidden of ['href: "/ai-spaces', 'href: "/billing"', 'href: "/admin"', "Product Lab", 'href="#"']) {
      expect(espaceIAMenu).not.toContain(forbidden);
    }
  });

  it("keeps public AI Space pages in locked demo mode with premium sections", () => {
    const page = readProjectFile("src/pages/PublicAISpace.tsx");
    const data = readProjectFile("src/data/public-ai-spaces.ts");

    expect(page).toContain("Connectez-vous pour utiliser cette fonctionnalité.");
    expect(page).toContain('to="/dashboard-demo"');
    expect(page).toContain('to="/pricing"');
    expect(page).toContain('to="/espace-ia"');
    expect(page).toContain("Aperçu public verrouillé");
    expect(page).toContain("Démo publique verrouillée");
    expect(page).toContain("Champ prompt désactivé");
    expect(page).toContain("Aucun débit depuis cette page.");
    expect(page).toContain("handleCopyPrompt");
    expect(page).toContain("activePanel");
    expect(page).toContain("sm:grid-cols");
    expect(page).toContain("md:grid-cols");
    expect(page).toContain("lg:grid-cols");
    expect(data).toContain("Clarifier, comprendre, résumer et décider plus vite.");
    expect(data).toContain("Transformer une idée business en offre claire, stratégie et actions commerciales.");
    expect(data).toContain("Apprendre plus vite avec des explications simples, fiches, quiz et plans de révision.");
    expect(data).toContain("Créer plus de contenu avec de meilleurs angles, scripts, hooks et idées.");
    expect(data).toContain("Organiser les priorités, transformer le chaos en plan d'action et suivre les projets.");
    expect(data).toContain("Structurer des process, workflows et usages IA avancés avec contrôle humain.");
    expect(`${page}\n${data}`).not.toContain("�");

    for (const forbidden of [
      "runAISpaceAssistant",
      "saveAISpaceConversation",
      "saveAISpaceUsageLog",
      "supabase.from",
      ".insert(",
      ".update(",
      ".delete(",
      "/billing",
      "/admin",
      "Product Lab",
      "STRIPE_",
      "service_role",
      'href="#"',
    ]) {
      expect(page).not.toContain(forbidden);
    }
  });

  it("routes landing AI cards to the public locked pages", () => {
    const aiLanding = readProjectFile("src/components/AILanding.tsx");

    for (const route of expectedRoutes) {
      expect(aiLanding).toContain(`href: "${route}"`);
    }
    expect(aiLanding).not.toContain('href: "/ai-spaces/general"');
    expect(aiLanding).not.toContain('href: "/ai-spaces/business"');
    expect(aiLanding).not.toContain('href="#"');
  });
});
