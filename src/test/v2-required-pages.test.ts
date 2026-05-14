import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const readProjectFile = (path: string) => readFileSync(join(root, path), "utf8");

describe("Pixelrises V2 required operational pages", () => {
  it("registers the utility pages needed by visible V2 actions", () => {
    const app = readProjectFile("src/App.tsx");

    expect(app).toContain('path="/notifications"');
    expect(app).toContain('path="/support"');
    expect(app).toContain('path="/profile"');
    expect(app).toContain('path="/security"');
    expect(app).toContain('path="/roadmap"');
    expect(app).toContain('path="/integrations/docs"');
    expect(app).toContain('path="/integrations/custom"');
    expect(app).toContain('path="/integrations/:integrationId/:mode"');
  });

  it("does not route the main header actions through fake settings sections", () => {
    const shell = readProjectFile("src/components/v2/V2PageShell.tsx");

    expect(shell).toContain('to="/notifications"');
    expect(shell).toContain('to="/support"');
    expect(shell).toContain('to="/profile"');
    expect(shell).not.toContain("settings?section=notifications");
    expect(shell).not.toContain("settings?section=support");
    expect(shell).not.toContain("settings?section=profile");
  });

  it("sends integration actions to real integration pages", () => {
    const integrations = readProjectFile("src/pages/Integrations.tsx");

    expect(integrations).toContain('to="/integrations/docs"');
    expect(integrations).toContain('to="/integrations/custom"');
    expect(integrations).toContain('to="/security"');
    expect(integrations).not.toContain("settings?section=integrations-docs");
    expect(integrations).not.toContain("settings?section=custom-integrations");
    expect(integrations).not.toContain("settings?section=security");
  });
});
