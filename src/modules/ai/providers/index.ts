import type { AIProviderId } from "../schemas/ai-task.schema";
import type { AIProviderAdapter } from "./BaseProviderAdapter";
import { cloudCodeProviderAdapter } from "./CloudCodeProviderAdapter";
import { cloudDesignProviderAdapter } from "./CloudDesignProviderAdapter";
import { claudeProviderAdapter } from "./ClaudeProviderAdapter";
import { futureProviderAdapter } from "./FutureProviderAdapter";
import { geminiMultiAIProviderAdapter } from "./GeminiProviderAdapter";
import { mistralProviderAdapter } from "./MistralProviderAdapter";
import { mockProviderAdapter } from "./MockProviderAdapter";
import { openAIProviderAdapter } from "./OpenAIProviderAdapter";
import { pollojourneyProviderAdapter } from "./PollojourneyProviderAdapter";
import { vercelGatewayProviderAdapter } from "./VercelGatewayProviderAdapter";

export * from "./BaseProviderAdapter";
export * from "./GeminiProviderAdapter";
export * from "./OpenAIProviderAdapter";
export * from "./VercelGatewayProviderAdapter";
export * from "./ClaudeProviderAdapter";
export * from "./CloudDesignProviderAdapter";
export * from "./CloudCodeProviderAdapter";
export * from "./MistralProviderAdapter";
export * from "./MockProviderAdapter";
export * from "./PollojourneyProviderAdapter";
export * from "./FutureProviderAdapter";

export const aiProviderAdapters: Record<AIProviderId, AIProviderAdapter> = {
  "vercel-gateway": vercelGatewayProviderAdapter,
  gemini: geminiMultiAIProviderAdapter,
  openai: openAIProviderAdapter,
  claude: claudeProviderAdapter,
  "claude-design": cloudDesignProviderAdapter,
  "claude-code": cloudCodeProviderAdapter,
  mistral: mistralProviderAdapter,
  pollojourney: pollojourneyProviderAdapter,
  mock: mockProviderAdapter,
  future: futureProviderAdapter,
};

export const getAIProviderAdapter = (providerId: AIProviderId) => aiProviderAdapters[providerId] ?? mockProviderAdapter;
