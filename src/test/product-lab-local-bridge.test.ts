import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const viteConfigSource = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");

describe("Product Lab local runner bridge", () => {
  it("keeps the local admin decision bridge scoped to Vite development", () => {
    expect(viteConfigSource).toContain("pixelrises-product-lab-local-decision-bridge");
    expect(viteConfigSource).toContain("/__pixelrises/product-lab-decisions");
    expect(viteConfigSource).toContain("product-lab\", \"state\", \"admin-decisions.json");
    expect(viteConfigSource).toContain("mode === \"development\" && localProductLabDecisionBridge()");
    expect(viteConfigSource).toContain("Local dev only. GitHub Actions and Supabase do not read this file until synced.");
  });
});
