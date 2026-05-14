import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const orchestratorSource = readFileSync(join(root, "supabase/functions/ai-orchestrator/index.ts"), "utf8");

describe("ai-orchestrator edge function contract", () => {
  it("blocks generic site output before Supabase persistence", () => {
    expect(orchestratorSource).toContain("genericSiteCopyPatterns");
    expect(orchestratorSource).toContain("Layouts trop similaires");
    expect(orchestratorSource).toContain("Sortie trop peu specifique");
    expect(orchestratorSource).toContain("Supabase save blocked: Quality Gate failed.");
    expect(orchestratorSource).toContain("success: qualityGateResult.valid");
  });

  it("redacts secrets and rejects vague site CTAs in server responses", () => {
    expect(orchestratorSource).toContain("redactSecretsForResponse");
    expect(orchestratorSource).toContain("responseSecretPatterns");
    expect(orchestratorSource).toContain("CTA trop vague");
    expect(orchestratorSource).toContain("redactErrorList([...errors, ...execution.errors, ...qualityErrors, ...persistence.errors])");
  });
});
