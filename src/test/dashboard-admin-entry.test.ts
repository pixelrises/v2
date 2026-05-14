import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(join(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");

describe("Dashboard admin entry", () => {
  it("shows the admin center from the V2 dashboard only for admins", () => {
    expect(dashboard).toContain("{isAdmin ? (");
    expect(dashboard).toContain("Centre admin Pixelrises");
    expect(dashboard).toContain('to="/admin"');
    expect(dashboard).toContain("Ouvrir les validations");
    expect(dashboard).toContain("V1");
    expect(dashboard).not.toContain("Product Lab V1/V2");
  });

  it("shows a launch readiness center for V2 finalization", () => {
    expect(dashboard).toContain("Finalisation V2");
    expect(dashboard).toContain("Niveau de lancement");
    expect(dashboard).toContain("À traiter avant lancement fort");
    expect(dashboard).toContain("Projet digital créé");
    expect(dashboard).toContain("Publication préparée");
  });

  it("adds a Guided/Cockpit switch and keeps dashboard data source visible", () => {
    expect(dashboard).toContain("type DashboardMode = \"guided\" | \"cockpit\"");
    expect(dashboard).toContain("DASHBOARD_MODE_STORAGE_KEY");
    expect(dashboard).toContain('data-testid="dashboard-mode-switch"');
    expect(dashboard).toContain('data-testid="dashboard-guided-mode"');
    expect(dashboard).toContain('data-testid="dashboard-cockpit-metrics"');
    expect(dashboard).toContain("Guided Mode");
    expect(dashboard).toContain("Cockpit Mode");
    expect(dashboard).toContain("DataSourceLabel");
    expect(dashboard).toContain("DataBadge");
  });

  it("keeps client dashboard focused on user actions instead of internal Product Lab details", () => {
    expect(dashboard).toContain("Recommandation IA");
    expect(dashboard).toContain("Créer mon premier projet");
    expect(dashboard).toContain("Ouvrir General AI");
    expect(dashboard).toContain("Aucune donnée réelle pour le moment");
    expect(dashboard).not.toContain("PR GitHub");
    expect(dashboard).not.toContain("fichiers modifiés");
  });

  it("marks examples, empty states, local storage and cockpit metrics explicitly", () => {
    expect(dashboard).toContain("projectListDataState");
    expect(dashboard).toContain("analyticsDataState");
    expect(dashboard).toContain("businessScoreDataState");
    expect(dashboard).toContain("Stockage local");
    expect(dashboard).toContain("Score exemple");
    expect(dashboard).toContain("Aucune donnée");
    expect(dashboard).toContain("Crédits");
  });
});
