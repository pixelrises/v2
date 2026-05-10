import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (path: string) => readFileSync(join(root, path), "utf8");

describe("V2 Multi-AI Gateway routing contract", () => {
  it("routes core builders through task-specialized AI roles before final fusion", () => {
    const orchestrator = readProjectFile("supabase/functions/ai-orchestrator/index.ts");

    expect(orchestrator).toContain("const taskPlans");
    expect(orchestrator).toContain('"site_structure"');
    expect(orchestrator).toContain('"site_design"');
    expect(orchestrator).toContain('"site_copywriting"');
    expect(orchestrator).toContain('"agent_permissions"');
    expect(orchestrator).toContain('"game_script"');
    expect(orchestrator).toContain('"final_fusion"');
    expect(orchestrator).toContain("const roleForTask");
    expect(orchestrator).toContain("const modelForRole");
    expect(orchestrator).toContain("runMultiAI");
    expect(orchestrator).toContain("routingTrace");
  });

  it("lets each Gateway task keep its selected provider/model instead of forcing one global model", () => {
    const provider = readProjectFile("supabase/functions/_shared/ai-provider.ts");
    const gatewayModelResolver = provider.slice(
      provider.indexOf("const normalizeVercelGatewayModelName"),
      provider.indexOf("const getVercelGatewayFallbackModels"),
    );

    expect(gatewayModelResolver).toContain("if (isGatewayModelName(model)) return String(model);");
    expect(gatewayModelResolver.indexOf("if (isGatewayModelName(model)) return String(model);")).toBeLessThan(
      gatewayModelResolver.indexOf("if (configuredModel) return configuredModel;"),
    );
  });
});
