import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("public navbar mobile accordion", () => {
  it("keeps long mobile groups collapsed behind dropdown controls", () => {
    const navbar = readProjectFile("src/components/PixelrisesNavbar.tsx");

    expect(navbar).toContain("mobileOpenGroups");
    expect(navbar).toContain('aria-controls={groupId}');
    expect(navbar).toContain('aria-expanded={isGroupOpen}');
    expect(navbar).toContain('max-h-[calc(100vh-112px)] overflow-y-auto');
    expect(navbar).toContain('{isFr ? "Vue d\'ensemble" : "Overview"}');
    expect(navbar).toContain('initial={{ height: 0, opacity: 0 }}');
    expect(navbar).toContain('animate={{ height: "auto", opacity: 1 }}');
  });
});
