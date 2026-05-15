import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readProjectFile = (path: string) => readFileSync(join(root, path), "utf8");

describe("Supabase Claude provider contract", () => {
  it("supports Vercel AI Gateway through server-side secrets only", () => {
    const provider = readProjectFile("supabase/functions/_shared/ai-provider.ts");

    expect(provider).toContain("AI_GATEWAY_API_KEY");
    expect(provider).toContain("https://ai-gateway.vercel.sh/v1/chat/completions");
    expect(provider).toContain("normalizeVercelGatewayModelName");
    expect(provider).toContain("createVercelGatewayChatCompletion");
    expect(provider).toContain('provider.name === "vercel-gateway"');
    expect(provider).toContain("AI_GATEWAY_FALLBACK_MODELS");
    expect(provider).toContain("openai/gpt-4o-mini");
    expect(provider).toContain("mistral/mistral-small");
    expect(provider).toContain("meta/llama-3.3-70b");
    expect(provider).toContain("anthropic/claude-3.5-haiku");
    expect(provider).toContain("mistral/codestral");
  });

  it("supports OpenAI through server-side Supabase secrets only", () => {
    const provider = readProjectFile("supabase/functions/_shared/ai-provider.ts");

    expect(provider).toContain("OPENAI_API_KEY");
    expect(provider).toContain("https://api.openai.com/v1/chat/completions");
    expect(provider).toContain("normalizeOpenAIModelName");
    expect(provider).toContain("createOpenAIChatCompletion");
    expect(provider).toContain('provider.name === "openai"');
  });

  it("supports Claude through server-side Supabase secrets only", () => {
    const provider = readProjectFile("supabase/functions/_shared/ai-provider.ts");

    expect(provider).toContain("ANTHROPIC_API_KEY");
    expect(provider).toContain("CLAUDE_API_KEY");
    expect(provider).toContain("https://api.anthropic.com/v1/messages");
    expect(provider).toContain('"x-api-key": provider.apiKey');
    expect(provider).toContain("toOpenAICompatibleResponse");
  });

  it("does not require Gemini to start generate-site text generation", () => {
    const generateSite = readProjectFile("supabase/functions/generate-site/index.ts");

    expect(generateSite).toContain('"SUPABASE_SERVICE_ROLE_KEY"');
    expect(generateSite).not.toContain('"GEMINI_API_KEY",');
  });
});
