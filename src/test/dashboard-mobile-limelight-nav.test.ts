import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");
const getMobileNavigationSource = () => {
  const shell = readProjectFile("src/components/v2/V2PageShell.tsx");
  const match = shell.match(/const mobileNavigation = \[([\s\S]*?)\];/);
  if (!match) throw new Error("mobileNavigation not found");
  return match[1];
};

const getDashboardNavigationSource = () => {
  const shell = readProjectFile("src/components/v2/V2PageShell.tsx");
  const match = shell.match(/const navigation = \[([\s\S]*?)\];/);
  if (!match) throw new Error("navigation not found");
  return match[1];
};

describe("dashboard mobile limelight navigation", () => {
  it("adds a bottom limelight menu only to the private V2 dashboard shell", () => {
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");
    const publicNavbar = readProjectFile("src/components/PixelrisesNavbar.tsx");

    expect(shell).toContain("DashboardMobileLimelightNav");
    expect(shell).toContain("DashboardMobileCompleteMenu");
    expect(shell).toContain('data-testid="dashboard-mobile-limelight-nav"');
    expect(shell).toContain('data-testid="dashboard-mobile-complete-menu"');
    expect(shell).toContain('aria-label="Navigation mobile dashboard"');
    expect(shell).toContain('aria-label="Ouvrir le menu complet dashboard"');
    expect(shell).toContain('aria-label="Menu complet dashboard mobile"');
    expect(shell).toContain("fixed inset-x-0 bottom-4");
    expect(shell).toContain("lg:hidden");
    expect(shell).toContain("mobileNavigation");
    expect(publicNavbar).not.toContain("dashboard-mobile-limelight-nav");
    expect(publicNavbar).not.toContain("DashboardMobileLimelightNav");
    expect(publicNavbar).not.toContain("dashboard-mobile-complete-menu");
    expect(publicNavbar).not.toContain("DashboardMobileCompleteMenu");
  });

  it("keeps the desktop sidebar and limits mobile entries to dashboard essentials", () => {
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");
    const mobileNavigation = getMobileNavigationSource();

    expect(shell).toContain("w-[240px]");
    expect(shell).toContain('"lg:block"');
    expect(shell).toContain("lg:block");

    for (const expected of [
      { label: "Dashboard", href: "/dashboard" },
      { label: "AI Spaces", href: "/ai-spaces" },
      { label: "Analytics", href: "/analytics" },
      { label: "Crédits", href: "/billing" },
      { label: "Paramètres", href: "/settings" },
    ]) {
      expect(mobileNavigation).toContain(`label: "${expected.label}"`);
      expect(mobileNavigation).toContain(`href: "${expected.href}"`);
    }

    for (const forbidden of [
      "Creer",
      "Créer",
      'href: "/create"',
      "Projets",
      'href: "/projects"',
      "Abonnements",
      "Product Lab",
      "Admin",
      "Stripe",
      'href: "/pricing"',
      "Realisations",
      "Contact",
      "Support",
      'href: "#"',
    ]) {
      expect(mobileNavigation).not.toContain(forbidden);
    }

    expect(shell).not.toContain("overflow-x-auto px-4 pb-3");
  });

  it("adds a complete mobile dashboard menu using the same real routes as the desktop sidebar", () => {
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");
    const app = readProjectFile("src/App.tsx");
    const dashboardNavigation = getDashboardNavigationSource();

    expect(shell).toContain("navigation.map((item)");
    expect(shell).toContain("role=\"dialog\"");
    expect(shell).toContain("Toutes les sections");
    expect(shell).toContain("Menu dashboard");

    for (const expected of [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Créer", href: "/create" },
      { label: "AI Spaces", href: "/ai-spaces" },
      { label: "Site Builder", href: "/builder/site" },
      { label: "Agents IA", href: "/agents" },
      { label: "Game Builder", href: "/builder/game" },
      { label: "Templates", href: "/templates" },
      { label: "Intégrations", href: "/integrations" },
      { label: "Analytics", href: "/analytics" },
      { label: "Projets", href: "/projects" },
      { label: "Crédits", href: "/billing" },
      { label: "Automatisations", href: "/automations" },
      { label: "Paramètres", href: "/settings" },
    ]) {
      expect(dashboardNavigation).toContain(`label: "${expected.label}"`);
      expect(dashboardNavigation).toContain(`href: "${expected.href}"`);
      expect(app).toContain(`path="${expected.href}"`);
    }
  });

  it("keeps the complete mobile dashboard menu opaque and readable", () => {
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");

    expect(shell).toContain('aria-label="Menu complet dashboard mobile"');
    expect(shell).toContain('className="absolute inset-0 bg-black"');
    expect(shell).toContain("bg-[#050505]");
    expect(shell).toContain("bg-[#10100d]");
    expect(shell).toContain("bg-[#1b1607]");
    expect(shell).toContain("bg-[#11100d]");
    expect(shell).not.toContain("bg-black/76 backdrop-blur-sm");
    expect(shell).not.toContain("bg-[#070707]/96");
    expect(shell).not.toContain("bg-white/[0.025]");
    expect(shell).not.toContain("bg-black/24");
  });

  it("keeps admin and Product Lab out of mobile dashboard menus for non-admin users", () => {
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");
    const demo = readProjectFile("src/pages/Demo.tsx");
    const dashboardNavigation = getDashboardNavigationSource();
    const mobileNavigation = getMobileNavigationSource();

    expect(dashboardNavigation).not.toContain("Admin");
    expect(dashboardNavigation).not.toContain("Product Lab");
    expect(dashboardNavigation).not.toContain('href: "/admin"');
    expect(mobileNavigation).not.toContain("Admin");
    expect(mobileNavigation).not.toContain("Product Lab");
    expect(shell).not.toContain('href="#"');
    expect(shell).not.toContain('to="#"');
    expect(demo).not.toContain("Product Lab");
    expect(demo).not.toContain('to="/admin"');
  });

  it("renders dashboard-demo with the same responsive shell as the real dashboard", () => {
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");
    const demo = readProjectFile("src/pages/Demo.tsx");
    const styles = readProjectFile("src/index.css");

    expect(demo).toContain("<Dashboard readOnlyDemo />");
    expect(shell).toContain('"overflow-x-hidden"');
    expect(shell).toContain('className="sticky top-0 z-20 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl lg:hidden"');
    expect(shell).toContain('<main className="lg:pl-[240px]">');
    expect(shell).toContain("DashboardMobileCompleteMenu");
    expect(shell).toContain("DashboardMobileLimelightNav");
    expect(shell).not.toContain("data-dashboard-demo-desktop-preview");
    expect(shell).not.toContain("--dashboard-demo-scale");
    expect(shell).not.toContain("window.innerWidth / 1440");
    expect(shell).not.toContain("max-lg:w-[1440px]");
    expect(styles).not.toContain('[data-dashboard-demo-desktop-preview="true"]');
    expect(demo).toContain("<Dashboard readOnlyDemo />");
    expect(readProjectFile("src/pages/Dashboard.tsx")).toContain("dashboard-demo-desktop-content");
    expect(readProjectFile("src/pages/Dashboard.tsx")).toContain('data-dashboard-demo-layout="creation-grid"');
    expect(readProjectFile("src/pages/Dashboard.tsx")).toContain('data-dashboard-demo-layout="ai-spaces-grid"');
    expect(styles).not.toContain('.dashboard-demo-desktop-content [data-dashboard-demo-layout="creation-grid"]');
  });

  it("keeps credits grouped with account billing instead of adding a subscriptions tab", () => {
    const mobileNavigation = getMobileNavigationSource();

    expect(mobileNavigation).toContain('label: "Crédits"');
    expect(mobileNavigation).toContain('href: "/billing"');
    expect(mobileNavigation).not.toContain("Abonnements");
    expect(mobileNavigation).not.toContain('href: "/settings/billing"');
    expect(mobileNavigation).not.toContain('href: "/credits"');
  });

  it("moves the floating assistant above the mobile bottom nav", () => {
    const assistant = readProjectFile("src/components/GeneralAIFloatingAssistant.tsx");

    expect(assistant).toContain("bottom-24");
    expect(assistant).toContain("lg:bottom-7");
  });
});
