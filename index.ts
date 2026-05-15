import { config } from "dotenv";
import { createGateway, streamText } from "ai";

config({ path: ".env.local", quiet: true });

const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();

if (!apiKey || apiKey === "your_vercel_ai_gateway_key_here") {
  console.error("Missing AI_GATEWAY_API_KEY in .env.local.");
  console.error("Add your Vercel AI Gateway key, then run: npm run gateway:test");
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
  const gateway = createGateway({ apiKey });

  console.log("Pixelrises V2 AI Gateway smoke test");
  console.log("Model: openai/gpt-5.4");
  console.log("Streaming response:\n");

  const result = streamText({
    model: gateway.languageModel("openai/gpt-5.4"),
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
