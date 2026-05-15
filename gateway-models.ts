import { config } from "dotenv";
import { createGateway, embed, streamText } from "ai";

config({ path: ".env.local", quiet: true });

const apiKey = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_AI_GATEWAY_API_KEY?.trim();
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

if (apiKey && !process.env.AI_GATEWAY_API_KEY) {
  process.env.AI_GATEWAY_API_KEY = apiKey;
}

const gateway = apiKey ? createGateway({ apiKey }) : createGateway();

const modelCatalog = {
  productionDefault: "openai/gpt-4o-mini",
  fastEconomy: "mistral/mistral-small",
  cheapLongContext: "mistral/ministral-8b",
  generalLongContext: "meta/llama-3.3-70b",
  siteLogic: "openai/gpt-4o-mini",
  siteDesignClaude: "anthropic/claude-3.5-haiku",
  visualValue: "mistral/pixtral-12b",
  visualPremium: "mistral/pixtral-large",
  codeAndScripts: "mistral/codestral",
  safety: "openai/gpt-oss-safeguard-20b",
  embeddings: "openai/text-embedding-3-small",
  paidQuality: "openai/gpt-4o",
  paidReasoning: "openai/o1",
  paidDeepResearch: "openai/o3-deep-research",
  paidOpus: "anthropic/claude-opus-4.5",
  paidPro: "openai/gpt-5-pro",
} as const;

const safeChecks = [
  ["Production default", modelCatalog.productionDefault],
  ["Fast economy", modelCatalog.fastEconomy],
  ["General long context", modelCatalog.generalLongContext],
  ["Site design Claude", modelCatalog.siteDesignClaude],
  ["Visual value", modelCatalog.visualValue],
  ["Code and scripts", modelCatalog.codeAndScripts],
  ["Safety", modelCatalog.safety],
] as const;

const paidOnlyChecks = [
  ["Paid quality", modelCatalog.paidQuality],
  ["Paid reasoning", modelCatalog.paidReasoning],
  ["Paid deep research", modelCatalog.paidDeepResearch],
  ["Paid Opus", modelCatalog.paidOpus],
  ["Paid Pro", modelCatalog.paidPro],
] as const;

const redact = (value: string) => `${value.slice(0, 7)}...<redacted>`;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
};

const ensureGatewayAuth = () => {
  if ((!apiKey || apiKey === "your_vercel_ai_gateway_key_here") && !oidcToken) {
    console.error("Missing AI Gateway auth in .env.local.");
    console.error("Use either AI_GATEWAY_API_KEY=*** or run: vc env pull .env.local");
    process.exit(1);
  }

  console.log(apiKey ? `AI Gateway key: ${redact(apiKey)}` : "AI Gateway auth: Vercel OIDC token");
};

const runModelStream = async (label: string, model: string) => {
  console.log(`\n=== ${label} ===`);
  console.log(`Model: ${model}`);

  let streamErrorMessage = "";
  const result = streamText({
    model: gateway.languageModel(model),
    prompt: "Explique en une phrase francaise a quoi sert ce modele dans Pixelrises V2.",
    maxOutputTokens: 120,
    providerOptions: {
      gateway: {
        tags: ["project:pixelrises-v2", "feature:gateway-model-smoke", "env:local"],
        user: "pixelrises-local-model-test",
      },
    },
    onError: ({ error }) => {
      streamErrorMessage = getErrorMessage(error);
    },
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  if (streamErrorMessage) {
    throw new Error(streamErrorMessage);
  }

  console.log("\nUsage:", JSON.stringify(await result.totalUsage, null, 2));
};

const runEmbedding = async () => {
  console.log("\n=== Embeddings ===");
  console.log(`Model: ${modelCatalog.embeddings}`);

  const result = await embed({
    model: gateway.embeddingModel(modelCatalog.embeddings),
    value: "Pixelrises V2 genere des sites, agents, jeux et recommandations business.",
    providerOptions: {
      gateway: {
        tags: ["project:pixelrises-v2", "feature:gateway-embedding-test", "env:local"],
        user: "pixelrises-local-model-test",
      },
    },
  });

  console.log(`Embedding dimensions: ${result.embedding.length}`);
  console.log("Usage:", JSON.stringify(result.usage, null, 2));
};

const runStep = async (name: string, step: () => Promise<void>) => {
  try {
    await step();
    return { name, ok: true, error: "" };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`\n${name} failed.`);
    console.error(message);
    return { name, ok: false, error: message };
  }
};

const main = async () => {
  ensureGatewayAuth();
  console.log("Pixelrises V2 AI Gateway model smoke test");
  console.log("Default paidOnly checks are disabled to protect budget.");
  console.log("Set PIXELRISES_GATEWAY_TEST_PREMIUM=1 to test expensive models intentionally.");

  const checks = process.env.PIXELRISES_GATEWAY_TEST_PREMIUM === "1"
    ? [...safeChecks, ...paidOnlyChecks]
    : safeChecks;

  const results = [];
  for (const [label, model] of checks) {
    results.push(await runStep(label, () => runModelStream(label, model)));
  }
  results.push(await runStep("Embeddings", runEmbedding));

  console.log("\nSummary:");
  for (const result of results) {
    console.log(`- ${result.ok ? "OK" : "FAILED"} ${result.name}`);
  }

  if (results.some((result) => !result.ok)) {
    throw new Error("One or more AI Gateway checks failed.");
  }
};

main().catch((error) => {
  console.error("\nAI Gateway model smoke test failed.");
  console.error(getErrorMessage(error));
  console.error("If the error mentions customer_verification_required, add a valid payment method in Vercel AI Gateway settings.");
  process.exit(1);
});
