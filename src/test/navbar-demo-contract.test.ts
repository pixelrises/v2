import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (path: string) => readFileSync(join(root, path), "utf8");

describe("Pixelrises demo navbar contract", () => {
  it("routes Tester Pixelrises to the safe V2 guest dashboard", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");

    expect(navbar).toContain('to="/dashboard-demo"');
    expect(navbar).toContain("Tester l'espace");
    expect(navbar).toContain('href: "/dashboard-demo"');
    expect(navbar).not.toContain("Product Lab");
    expect(navbar).not.toContain('to="/demo"');
    expect(navbar).not.toContain('to="/ai"');
    expect(navbar).not.toContain('href="#"');
  });

  it("registers the public V2 demo route and keeps the real dashboard route protected", () => {
    const app = readProjectFile("src/App.tsx");

    expect(app).toContain('path="/demo"');
    expect(app).toContain('element={<Navigate to="/dashboard-demo" replace />}');
    expect(app).toContain('path="/dashboard-demo"');
    expect(app).toContain('path="/dashboard" element={<Dashboard />}');
    expect(app).toContain('path="/signup"');
    expect(app).toContain('path="/signin"');
  });

  it("renders /dashboard-demo with the real dashboard component in locked visual mode", () => {
    const demo = readProjectFile("src/pages/Demo.tsx");
    const dashboard = readProjectFile("src/pages/Dashboard.tsx");
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");

    expect(demo).toContain('import Dashboard from "./Dashboard"');
    expect(demo).toContain("<Dashboard readOnlyDemo");
    expect(demo).not.toContain("supabase.from");
    expect(demo).not.toContain(".insert(");
    expect(demo).not.toContain(".update(");
    expect(demo).not.toContain(".delete(");

    expect(dashboard).toContain("readOnlyDemo?: boolean");
    expect(dashboard).toContain("cloudDataEnabled = isSupabaseConfigured && !readOnlyDemo");
    expect(dashboard).toContain("dashboard-demo-readonly");
    expect(dashboard).toContain("handleReadOnlyDemoInteraction");
    expect(dashboard).toContain("notifyReadOnlyDemo");
    expect(dashboard).toContain("aucune action connectée");

    expect(shell).toContain("readOnlyDemo?: boolean");
    expect(shell).toContain('readOnlyDemo ? "/dashboard-demo" : "/dashboard"');
    expect(shell).toContain("onLockedAction");
    expect(shell).toContain("Démo visuelle en lecture seule");
  });

  it("keeps the real dashboard protected by the auth redirect", () => {
    const dashboard = readProjectFile("src/pages/Dashboard.tsx");

    expect(dashboard).toContain("buildAuthRoute(getCurrentRelativeUrl())");
    expect(dashboard).toContain("navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true })");
    expect(dashboard).toContain("!loading && !user");
  });

  it("uses the original Pixelrises logo asset without the favicon wrapper", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");

    expect(navbar).toContain('src="/pixelrises-navbar-logo.png"');
    expect(navbar).not.toContain("favicon");
    expect(navbar).not.toContain("rounded-2xl border border-primary/25 bg-primary/10");
  });
});
