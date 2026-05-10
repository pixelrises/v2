import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(join(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");

describe("Dashboard admin entry", () => {
  it("shows the admin center from the V2 dashboard only for admins", () => {
    expect(dashboard).toContain("{isAdmin ? (");
    expect(dashboard).toContain("Centre admin Pixelrises");
    expect(dashboard).toContain('to="/admin"');
    expect(dashboard).toContain("Product Lab V1/V2");
    expect(dashboard).toContain("V1 + V2 pilotes depuis le meme centre");
  });
});
