import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reportFrontendError } from "@/lib/monitoring";
import { redactSecrets } from "@/modules/ai/security/redactSecrets";

const mainSource = readFileSync(join(process.cwd(), "src/main.tsx"), "utf8");

describe("frontend error security", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("redacts gateway, bearer and GitHub tokens before frontend logging", () => {
    const raw =
      "AI_GATEWAY_API_KEY=vck_1234567890abcdefghijklmnopqrstuvwxyz bearer token-secret-1234567890 github_pat_1234567890abcdefghijklmnopqrstuvwxyz";
    const redacted = redactSecrets(raw);

    expect(redacted).not.toContain("vck_1234567890");
    expect(redacted).not.toContain("token-secret-1234567890");
    expect(redacted).not.toContain("github_pat_1234567890");
    expect(redacted).toContain("[REDACTED]");
  });

  it("stores frontend errors without secrets", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportFrontendError("security-test", new Error("Bearer secret-token-1234567890"));

    const stored = window.localStorage.getItem("pixelrises:frontend-errors") || "";
    expect(stored).toContain("[REDACTED]");
    expect(stored).not.toContain("secret-token-1234567890");
  });

  it("keeps the bootstrap overlay XSS-safe", () => {
    expect(mainSource).toContain("overlay.replaceChildren");
    expect(mainSource).toContain("textContent = formatError(error)");
    expect(mainSource).not.toContain("overlay.innerHTML");
  });
});
