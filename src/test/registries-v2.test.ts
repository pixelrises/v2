import { describe, expect, it } from "vitest";
import {
  agentRegistry,
  componentRegistry,
  creationCards,
  gameTemplateRegistry,
  integrationRegistry,
  siteTemplateRegistry,
} from "@/modules/registries";
import { analyticsEvents } from "@/v2/mock-data";

describe("Pixelrises V2 registries", () => {
  it("exposes the three official creation entries", () => {
    expect(creationCards.map((card) => card.type)).toEqual(["site", "agent", "game"]);
    expect(creationCards.find((card) => card.type === "game")?.status).toBe("beta");
  });

  it("keeps mocked integrations honest", () => {
    expect(integrationRegistry.some((integration) => integration.status === "connected")).toBe(false);
    expect(integrationRegistry.some((integration) => integration.category === "IA")).toBe(true);
    expect(integrationRegistry.some((integration) => integration.category === "Gaming")).toBe(true);
  });

  it("covers Pixelrises integration vision with visual metadata", () => {
    const expectedCategories = ["Business", "Marketing", "Data", "Automatisation", "Dev", "Communication", "IA", "Domaines", "Gaming"];
    const expectedIntegrations = [
      "stripe",
      "shopify",
      "google-analytics",
      "google-sheets",
      "webhooks",
      "github",
      "vercel-ai-gateway",
      "supabase",
      "roblox",
      "custom-domain",
    ];

    expect(new Set(integrationRegistry.map((integration) => integration.category))).toEqual(new Set(expectedCategories));
    expect(integrationRegistry.map((integration) => integration.id)).toEqual(expect.arrayContaining(expectedIntegrations));
    expect(integrationRegistry.filter((integration) => integration.logo).length).toBeGreaterThan(20);
    expect(integrationRegistry.every((integration) => integration.permissions.length > 0)).toBe(true);
  });

  it("contains scalable registries and the expected analytics events", () => {
    expect(componentRegistry).toContain("Preview Frames");
    expect(siteTemplateRegistry.length).toBeGreaterThan(3);
    expect(agentRegistry.some((agent) => agent.id === "game-design")).toBe(true);
    expect(gameTemplateRegistry.some((template) => template.platform === "Roblox")).toBe(true);
    expect(analyticsEvents).toEqual(
      expect.arrayContaining(["page_view", "agent_created", "game_created", "project_improved"]),
    );
  });
});
