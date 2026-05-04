import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { config } from "dotenv";
import { generateText } from "ai";

config({ path: ".env.local", quiet: true });

const model = "google/gemini-3.1-flash-image-preview";
const outputDir = "generated";
const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
};

const extensionFromMediaType = (mediaType: string) => {
  if (mediaType.includes("png")) return ".png";
  if (mediaType.includes("jpeg") || mediaType.includes("jpg")) return ".jpg";
  if (mediaType.includes("webp")) return ".webp";
  return extname(mediaType) || ".png";
};

if (!apiKey || apiKey === "your_vercel_ai_gateway_key_here") {
  console.error("Missing AI_GATEWAY_API_KEY in .env.local.");
  console.error("Add your Vercel AI Gateway key, then run: npm run gateway:image");
  process.exit(1);
}

const main = async () => {
  const startedAt = Date.now();

  console.log("Pixelrises V2 AI Gateway image smoke test");
  console.log(`Model: ${model}`);

  const result = await generateText({
    model,
    prompt:
      "Create a premium dark-gold SaaS hero illustration for Pixelrises V2: an entrepreneur turning one idea into a website, AI agent, and game blueprint. Cinematic, elegant, no text, no watermark.",
    providerOptions: {
      gateway: {
        tags: ["project:pixelrises-v2", "feature:gateway-image-smoke-test", "env:local"],
        user: "pixelrises-local-image-smoke-test",
      },
    },
  });

  const images = result.files.filter((file) => file.mediaType?.startsWith("image/"));

  if (!images.length) {
    throw new Error("No image file returned by AI Gateway.");
  }

  await mkdir(outputDir, { recursive: true });

  const firstImage = images[0];
  const extension = extensionFromMediaType(firstImage.mediaType);
  const filename = `pixelrises-gateway-image-${Date.now()}${extension}`;
  const outputPath = join(outputDir, filename);

  await writeFile(outputPath, firstImage.uint8Array);

  console.log(`Saved image: ${outputPath}`);
  console.log(`Media type: ${firstImage.mediaType}`);
  console.log("Token usage:");
  console.log(JSON.stringify(result.usage, null, 2));
  console.log(`Duration: ${Date.now() - startedAt}ms`);
};

main().catch((error) => {
  console.error("\nAI Gateway image smoke test failed.");
  console.error(getErrorMessage(error));
  console.error("If the error mentions customer_verification_required, add a valid credit card in Vercel AI Gateway settings.");
  process.exit(1);
});
