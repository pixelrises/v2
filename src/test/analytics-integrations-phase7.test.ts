import { beforeEach, describe, expect, it } from "vitest";
import { buildAnalyticsSnapshot } from "@/modules/analytics/analytics-center";
import { canExecuteExternalAction, getIntegrationSummary, getNormalizedIntegrations } from "@/modules/integrations/integration-system";
import { trackV2Event } from "@/v2/analytics";
import type { AnalyticsEventPayload } from "@/v2/analytics";

describe("Phase 7 analytics and integrations honesty", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps empty analytics empty instead of showing demo traffic as real", () => {
    const snapshot = buildAnalyticsSnapshot({ events: [], projects: [], storageState: "empty" });

    expect(snapshot.sourceState).toBe("empty");
    expect(snapshot.metrics.find((metric) => metric.id === "visits")?.value).toBe(0);
    expect(snapshot.metrics.find((metric) => metric.id === "leads")?.dataState).toBe("empty");
    expect(JSON.stringify(snapshot)).not.toContain("12842");
  });

  it("marks locally tracked events as local/mock data and redacts sensitive metadata", () => {
    const event = trackV2Event(
      "cta_click",
      {
        label: "CTA hero",
        token: "vck_1234567890abcdef",
        email: "client@example.com",
        module: "analytics",
      },
      { module: "analytics" },
    );
    const snapshot = buildAnalyticsSnapshot({ events: [event], projects: [], storageState: "mock" });
    const serialized = JSON.stringify(snapshot);

    expect(event.dataState).toBe("mock");
    expect(snapshot.metrics.find((metric) => metric.id === "cta")?.value).toBe(1);
    expect(snapshot.metrics.find((metric) => metric.id === "cta")?.dataState).toBe("mock");
    expect(serialized).not.toContain("vck_1234567890abcdef");
    expect(serialized).not.toContain("client@example.com");
  });

  it("uses only tracked event names for conversion metrics", () => {
    const events: AnalyticsEventPayload[] = [
      {
        eventId: "page-view",
        event: "page_view",
        metadata: { label: "Page vue" },
        dataState: "mock",
        createdAt: new Date().toISOString(),
      },
      {
        eventId: "lead-created",
        event: "lead_created",
        metadata: { label: "Lead" },
        dataState: "mock",
        createdAt: new Date().toISOString(),
      },
    ];
    const snapshot = buildAnalyticsSnapshot({ events, projects: [], storageState: "mock" });

    expect(snapshot.metrics.find((metric) => metric.id === "visits")?.value).toBe(1);
    expect(snapshot.metrics.find((metric) => metric.id === "leads")?.value).toBe(1);
    expect(snapshot.recommendations.every((item) => item.title.length > 0 && item.action.length > 0)).toBe(true);
  });

  it("normalizes integrations with honest statuses and blocks external execution by default", () => {
    const integrations = getNormalizedIntegrations();
    const summary = getIntegrationSummary(integrations);

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.connected).toBe(0);
    expect(summary.not_configured + summary.dry_run + summary.beta + summary.coming_soon).toBe(summary.total);
    expect(integrations.every((integration) => integration.requiredPermissions.length > 0)).toBe(true);
    expect(integrations.some((integration) => integration.normalizedStatus === "dry_run")).toBe(true);
    expect(canExecuteExternalAction()).toBe(false);
  });
});
