import { config } from "dotenv";
import { createGateway, embed, streamText } from "ai";

config({ path: ".env.local", quiet: true });

const gatewayUrl = "https://ai-gateway.vercel.sh/v1/chat/completions";
const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();

const modelStack = {
  balancedDefault: "openai/gpt-5.4-mini",
  wowOpenAI: "openai/gpt-5.5",
  premiumReasoning: "anthropic/claude-opus-4.7",
  valueStream: "deepseek/deepseek-v3.1-terminus",
  embedding: "google/gemini-embedding-2",
  fallbackValue: "google/gemini-3-flash",
} as const;

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: unknown;
  error?: {
    message?: string;
    type?: string;
  };
};

const redact = (value: string) => `${value.slice(0, 7)}...<redacted>`;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
};

const ensureGatewayKey = () => {
  if (!apiKey || apiKey === "your_vercel_ai_gateway_key_here") {
    console.error("Missing AI_GATEWAY_API_KEY in .env.local.");
    console.error("Add your Vercel AI Gateway key, then run: npm run gateway:models");
    process.exit(1);
  }

  console.log(`AI Gateway key: ${redact(apiKey)}`);
};

const getGateway = () => createGateway({ apiKey: apiKey ?? "" });

const runChatCompletion = async (label: string, model: string) => {
  console.log(`\n=== ${label} ===`);
  console.log(`Model: ${model}`);

  const response = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: "Why is the sky blue? Answer in one short French paragraph.",
        },
      ],
      stream: false,
    }),
  });

  const payload = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Gateway HTTP ${response.status}`);
  }

  console.log(payload.choices?.[0]?.message?.content ?? "No content returned.");
  console.log("Usage:", JSON.stringify(payload.usage ?? {}, null, 2));
};

const runEmbedding = async () => {
  console.log("\n=== Gemini Embedding 2 ===");
  console.log(`Model: ${modelStack.embedding}`);

  const result = await embed({
    model: getGateway().embeddingModel(modelStack.embedding),
    value: "Sunny day at the beach",
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

const runDeepSeekStream = async () => {
  console.log("\n=== DeepSeek Stream ===");
  console.log(`Model: ${modelStack.valueStream}`);

  let streamErrorMessage = "";

  const result = streamText({
    model: getGateway().languageModel(modelStack.valueStream),
    prompt: "Why is the sky blue? Answer in one short French paragraph.",
    providerOptions: {
      gateway: {
        tags: ["project:pixelrises-v2", "feature:gateway-deepseek-stream-test", "env:local"],
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
  ensureGatewayKey();
  console.log("Pixelrises V2 AI Gateway model smoke test");
  console.log("Quality/cost recommendation:");
  console.log(`- Default Pixelrises: ${modelStack.balancedDefault}`);
  console.log(`- Wow mode: ${modelStack.wowOpenAI}`);
  console.log(`- Premium reasoning: ${modelStack.premiumReasoning}`);
  console.log(`- Value stream/code-ish tasks: ${modelStack.valueStream}`);
  console.log(`- Embeddings: ${modelStack.embedding}`);

  const results = [
    await runStep("OpenAI GPT-5.5 wow", () => runChatCompletion("OpenAI GPT-5.5 wow", modelStack.wowOpenAI)),
    await runStep("Claude Opus 4.7 premium", () =>
      runChatCompletion("Claude Opus 4.7 premium", modelStack.premiumReasoning),
    ),
    await runStep("Gemini Embedding 2", runEmbedding),
    await runStep("DeepSeek V3.1 Terminus stream", runDeepSeekStream),
  ];

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
  console.error("If the error mentions customer_verification_required, add a valid credit card in Vercel AI Gateway settings.");
  process.exit(1);
});
