import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Analytics from "@/pages/Analytics";
import AnalyticsDetail from "@/pages/AnalyticsDetail";
import { buildAnalyticsExport, buildAnalyticsSnapshot, getBusinessScoreTotal } from "@/modules/analytics/analytics-center";

describe("Analytics Center V2", () => {
  it("renders analytics without fake real data", () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>,
    );

    expect(getBusinessScoreTotal()).toBeGreaterThanOrEqual(0);
    expect(getBusinessScoreTotal()).toBeLessThanOrEqual(100);
    expect(screen.getByRole("link", { name: /Voir le détail du score/i })).toHaveAttribute(
      "href",
      "/analytics/business-score",
    );
    expect(screen.getAllByText(/Sources d'acquisition/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Exporter/i })).toBeInTheDocument();
  });

  it("opens the business score detail page with example badges", () => {
    render(
      <MemoryRouter initialEntries={["/analytics/business-score"]}>
        <Routes>
          <Route path="/analytics/:section" element={<AnalyticsDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Score global/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Meilleure amélioration/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Exemple/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Retour analytics/i })).toHaveAttribute("href", "/analytics");
  });

  it("builds an export payload from a snapshot without secrets or fake traffic numbers", () => {
    const snapshot = buildAnalyticsSnapshot({
      events: [],
      projects: [],
      storageState: "empty",
    });
    const exportPayload = buildAnalyticsExport(snapshot);
    const serialized = JSON.stringify(exportPayload);

    expect(exportPayload.product).toBe("Pixelrises V2");
    expect(exportPayload.source.state).toBe("empty");
    expect(exportPayload.metrics.find((metric) => metric.id === "visits")?.value).toBe(0);
    expect(serialized).not.toContain("12842");
    expect(serialized).not.toMatch(/AI_GATEWAY_API_KEY|SERVICE_ROLE|sb_secret|vck_/i);
  });
});
