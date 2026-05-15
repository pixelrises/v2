import { config } from "dotenv";
import { createGateway, streamText } from "ai";

config({ path: ".env.local", quiet: true });

const apiKey = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_AI_GATEWAY_API_KEY?.trim();
const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
const activeModel = process.env.AI_GATEWAY_MODEL?.trim() || "openai/gpt-4o-mini";

if (apiKey && !process.env.AI_GATEWAY_API_KEY) {
  process.env.AI_GATEWAY_API_KEY = apiKey;
}

if ((!apiKey || apiKey === "your_vercel_ai_gateway_key_here") && !oidcToken) {
  console.error("Missing AI Gateway auth in .env.local.");
  console.error("Use either AI_GATEWAY_API_KEY=*** or run: vc env pull .env.local");
  process.exit(1);
}

const startedAt = Date.now();

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
};

const main = async () => {
  let streamErrorMessage = "";
  const gateway = apiKey ? createGateway({ apiKey }) : createGateway();

  console.log("Pixelrises V2 AI Gateway smoke test");
  console.log(`Model: ${activeModel}`);
  console.log("Streaming response:\n");

  const result = streamText({
    model: gateway.languageModel(activeModel),
    prompt:
      "In two concise paragraphs, explain why Pixelrises V2 should use an AI Gateway for multi-provider routing, cost control, and fallback.",
    providerOptions: {
      gateway: {
        tags: ["project:pixelrises-v2", "feature:gateway-smoke-test", "env:local"],
        user: "pixelrises-local-smoke-test",
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

  const usage = await result.totalUsage;
  const durationMs = Date.now() - startedAt;

  console.log("\n\nToken usage:");
  console.log(JSON.stringify(usage, null, 2));
  console.log(`Duration: ${durationMs}ms`);
};

main().catch((error) => {
  console.error("\nAI Gateway smoke test failed.");
  console.error(getErrorMessage(error));
  console.error("If the error mentions customer_verification_required, add a valid credit card in Vercel AI Gateway settings.");
  process.exit(1);
});
