import { describe, expect, it } from "vitest";
import { createDefaultAgentProject } from "@/modules/creation-engine";
import { redactSecrets, ValidationLayer } from "@/modules/ai";

describe("ValidationLayer", () => {
  it("blocks secret-like values in output", () => {
    const validation = new ValidationLayer();
    const result = validation.validate({ token: "bearer sk-123456789012345678901234567890" });

    expect(result.valid).toBe(false);
    expect(result.issues[0]?.id).toBe("secret-like-value");
  });

  it("validates safe agent defaults", () => {
    const validation = new ValidationLayer();
    const result = validation.validate(createDefaultAgentProject());

    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("redacts API keys before logs", () => {
    const redacted = redactSecrets("OPENAI_API_KEY=sk-123456789012345678901234567890");
    expect(redacted).not.toContain("sk-1234567890");
    expect(redacted).toContain("[REDACTED]");
  });
});
