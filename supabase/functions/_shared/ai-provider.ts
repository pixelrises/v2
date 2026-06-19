type AIProviderName = "gemini" | "claude" | "openai" | "vercel-gateway";

const GEMINI_OPENAI_CHAT_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GEMINI_OPENAI_IMAGE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/images/generations";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const CLAUDE_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const VERCEL_AI_GATEWAY_CHAT_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_CLAUDE_MODEL = "claude-3-5-haiku-latest";
const DEFAULT_GATEWAY_MODEL = "openai/gpt-4o-mini";
const DEFAULT_GATEWAY_FAST_MODEL = "mistral/mistral-small";
const DEFAULT_GATEWAY_BALANCED_MODEL = "google/gemini-2.5-flash";
const DEFAULT_GATEWAY_REASONING_MODEL = "anthropic/claude-sonnet-4-6";
const DEFAULT_GATEWAY_CODE_MODEL = "mistral/codestral";
const DEFAULT_GATEWAY_FALLBACK_MODELS = [
  DEFAULT_GATEWAY_MODEL,
  DEFAULT_GATEWAY_FAST_MODEL,
  DEFAULT_GATEWAY_BALANCED_MODEL,
  DEFAULT_GATEWAY_REASONING_MODEL,
];
const PREMIUM_GATEWAY_MODEL_PATTERNS = [
  /^anthropic\/claude-opus-4(?:[-.]8)?$/i,
  /^openai\/o1$/i,
  /^openai\/o3-deep-research$/i,
  /^openai\/gpt-5-pro$/i,
];

interface AIProviderConfig {
  apiKey: string;
  name: AIProviderName;
  url: string;
}

type OpenAIMessage = {
  role?: string;
  content?: unknown;
};

type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

const readOptionalEnv = (key: string) => (Deno.env.get(key) ?? "").trim();

const readFirstEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = readOptionalEnv(key);
    if (value) return value;
  }

  return "";
};

const normalizeGeminiModelName = (model: unknown) => {
  if (typeof model !== "string") {
    return model;
  }

  return model.replace(/^google\//, "");
};

const normalizeOpenAIModelName = (model: unknown) => {
  const configuredModel = readOptionalEnv("OPENAI_MODEL");
  if (configuredModel) return configuredModel;

  if (typeof model !== "string" || !model.trim()) {
    return DEFAULT_OPENAI_MODEL;
  }

  if (/^(google\/)?gemini/i.test(model) || /^(anthropic\/)?claude/i.test(model)) {
    return DEFAULT_OPENAI_MODEL;
  }

  return model.replace(/^openai\//, "");
};

const isGatewayModelName = (model: unknown) =>
  typeof model === "string" &&
  /^(openai|anthropic|google|deepseek|mistral|xai|meta|perplexity|cohere)\//i.test(model.trim());

const allowPremiumGatewayModels = () => readOptionalEnv("AI_GATEWAY_ALLOW_PREMIUM_MODELS").toLowerCase() === "true";

const isPremiumGatewayModelName = (model: unknown) =>
  typeof model === "string" && PREMIUM_GATEWAY_MODEL_PATTERNS.some((pattern) => pattern.test(model.trim()));

const getSafeConfiguredGatewayModel = () => {
  const configuredModel = readOptionalEnv("AI_GATEWAY_MODEL") || readOptionalEnv("VERCEL_AI_GATEWAY_MODEL");
  if (configuredModel && (!isPremiumGatewayModelName(configuredModel) || allowPremiumGatewayModels())) {
    return configuredModel;
  }

  return "";
};

const normalizeVercelGatewayModelName = (model: unknown) => {
  const configuredModel = getSafeConfiguredGatewayModel();
  const value = typeof model === "string" ? model.trim() : "";

  if (/gpt-5\.4-mini|gpt-5\.5/i.test(value)) {
    return configuredModel || DEFAULT_GATEWAY_MODEL;
  }

  if (/gemini-2\.5|gemini-3|gemini/i.test(value)) {
    return readOptionalEnv("AI_GATEWAY_GEMINI_MODEL") ||
      readOptionalEnv("AI_GATEWAY_BALANCED_MODEL") ||
      DEFAULT_GATEWAY_BALANCED_MODEL;
  }

  if (/claude-sonnet-4(?:[-.]6)?|claude-haiku-4|claude-opus-4(?:[-.]8)?|claude-3\.5/i.test(value)) {
    return readOptionalEnv("AI_GATEWAY_CLAUDE_MODEL") ||
      readOptionalEnv("AI_GATEWAY_REASONING_MODEL") ||
      DEFAULT_GATEWAY_REASONING_MODEL;
  }

  if (/deepseek|mistral-medium|codestral|grok-code/i.test(value)) {
    return readOptionalEnv("AI_GATEWAY_CODE_MODEL") ||
      readOptionalEnv("AI_GATEWAY_FAST_MODEL") ||
      DEFAULT_GATEWAY_CODE_MODEL;
  }

  if (isGatewayModelName(model)) {
    if (isPremiumGatewayModelName(value) && !allowPremiumGatewayModels()) {
      return configuredModel || DEFAULT_GATEWAY_MODEL;
    }

    return value;
  }

  if (configuredModel) return configuredModel;

  return DEFAULT_GATEWAY_MODEL;
};

const getVercelGatewayFallbackModels = (primaryModel: string) => {
  const configuredFallbacks = readOptionalEnv("AI_GATEWAY_FALLBACK_MODELS")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const fallbackModels = configuredFallbacks.length ? configuredFallbacks : DEFAULT_GATEWAY_FALLBACK_MODELS;

  return Array.from(new Set([primaryModel, ...fallbackModels]));
};

const normalizeClaudeModelName = (model: unknown) => {
  const configuredModel = readOptionalEnv("CLAUDE_MODEL") || readOptionalEnv("ANTHROPIC_MODEL");
  if (configuredModel) return configuredModel;

  if (typeof model !== "string" || !model.trim()) {
    return DEFAULT_CLAUDE_MODEL;
  }

  if (/^(google\/)?gemini/i.test(model)) {
    return DEFAULT_CLAUDE_MODEL;
  }

  return model.replace(/^anthropic\//, "");
};

const resolveAIProvider = (): AIProviderConfig => {
  const requestedProvider = (
    readOptionalEnv("AI_DEFAULT_PROVIDER") ||
    readOptionalEnv("AI_PROVIDER")
  ).toLowerCase();
  const gatewayKey = readFirstEnv(
    "AI_GATEWAY_API_KEY",
    "AI_GATEWAY_API_KEY (multia ia pixelrises)",
    "VERCEL_AI_GATEWAY_API_KEY",
    "API_GATEWAY_VERCEL",
    "VERCEL_AI_GATEWAY_KEY",
    "VERCEL_OIDC_TOKEN",
  );
  const claudeKey = readFirstEnv("ANTHROPIC_API_KEY", "CLAUDE_API_KEY", "claude api key");
  const openAIKey = readFirstEnv("OPENAI_API_KEY", "open ai API key");
  const geminiKey = readFirstEnv("GEMINI_API_KEY", "GOOGLE_API_KEY");

  if (["vercel", "gateway", "ai-gateway", "vercel-gateway"].includes(requestedProvider)) {
    if (!gatewayKey) {
      throw new Error("Configuration serveur manquante: AI_GATEWAY_API_KEY");
    }

    return {
      apiKey: gatewayKey,
      name: "vercel-gateway",
      url: VERCEL_AI_GATEWAY_CHAT_URL,
    };
  }

  if (["openai", "gpt"].includes(requestedProvider)) {
    if (!openAIKey) {
      throw new Error("Configuration serveur manquante: OPENAI_API_KEY");
    }

    return {
      apiKey: openAIKey,
      name: "openai",
      url: OPENAI_CHAT_URL,
    };
  }

  if (["claude", "anthropic"].includes(requestedProvider)) {
    if (!claudeKey) {
      throw new Error("Configuration serveur manquante: ANTHROPIC_API_KEY ou CLAUDE_API_KEY");
    }

    return {
      apiKey: claudeKey,
      name: "claude",
      url: CLAUDE_MESSAGES_URL,
    };
  }

  if (["gemini", "google"].includes(requestedProvider)) {
    if (!geminiKey) {
      throw new Error("Configuration serveur manquante: GEMINI_API_KEY ou GOOGLE_API_KEY");
    }

    return {
      apiKey: geminiKey,
      name: "gemini",
      url: GEMINI_OPENAI_CHAT_URL,
    };
  }

  if (gatewayKey) {
    return {
      apiKey: gatewayKey,
      name: "vercel-gateway",
      url: VERCEL_AI_GATEWAY_CHAT_URL,
    };
  }

  if (claudeKey) {
    return {
      apiKey: claudeKey,
      name: "claude",
      url: CLAUDE_MESSAGES_URL,
    };
  }

  if (openAIKey) {
    return {
      apiKey: openAIKey,
      name: "openai",
      url: OPENAI_CHAT_URL,
    };
  }

  if (geminiKey) {
    return {
      apiKey: geminiKey,
      name: "gemini",
      url: GEMINI_OPENAI_CHAT_URL,
    };
  }

  throw new Error("Configuration serveur manquante: ajoutez AI_GATEWAY_API_KEY, OPENAI_API_KEY, CLAUDE_API_KEY ou GEMINI_API_KEY dans Supabase.");
};

const normalizeContentToText = (content: unknown) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          return String((item as { text?: unknown }).text ?? "");
        }
        return JSON.stringify(item);
      })
      .filter(Boolean)
      .join("\n");
  }

  if (content == null) return "";
  return JSON.stringify(content);
};

const mergeAdjacentClaudeMessages = (messages: ClaudeMessage[]) => {
  const merged: ClaudeMessage[] = [];

  for (const message of messages) {
    const previous = merged[merged.length - 1];
    if (previous?.role === message.role) {
      previous.content = `${previous.content}\n\n${message.content}`.trim();
    } else {
      merged.push({ ...message });
    }
  }

  return merged;
};

const normalizeClaudeMessages = (messages: unknown) => {
  const system: string[] = [];
  const claudeMessages: ClaudeMessage[] = [];

  if (Array.isArray(messages)) {
    for (const message of messages as OpenAIMessage[]) {
      const role = message.role;
      const content = normalizeContentToText(message.content);
      if (!content.trim()) continue;

      if (role === "system") {
        system.push(content);
      } else if (role === "assistant") {
        claudeMessages.push({ role: "assistant", content });
      } else {
        claudeMessages.push({ role: "user", content });
      }
    }
  }

  if (claudeMessages.length === 0) {
    claudeMessages.push({ role: "user", content: "Generate the requested Pixelrises output." });
  }

  if (claudeMessages[0].role !== "user") {
    claudeMessages.unshift({ role: "user", content: "Continue with the requested Pixelrises output." });
  }

  return {
    system: system.join("\n\n"),
    messages: mergeAdjacentClaudeMessages(claudeMessages),
  };
};

const normalizeClaudeTools = (tools: unknown) => {
  if (!Array.isArray(tools)) return undefined;

  const converted = tools
    .map((tool) => {
      const fn = (tool as { function?: Record<string, unknown> })?.function;
      if (!fn?.name) return null;

      return {
        name: String(fn.name),
        description: typeof fn.description === "string" ? fn.description : "",
        input_schema:
          fn.parameters && typeof fn.parameters === "object"
            ? fn.parameters
            : { type: "object", properties: {} },
      };
    })
    .filter(Boolean);

  return converted.length ? converted : undefined;
};

const normalizeClaudeToolChoice = (toolChoice: unknown) => {
  if (!toolChoice || typeof toolChoice !== "object") return undefined;
  const fn = (toolChoice as { function?: { name?: unknown } }).function;
  if (typeof fn?.name === "string" && fn.name.trim()) {
    return {
      type: "tool",
      name: fn.name,
    };
  }

  return undefined;
};

const toClaudePayload = (body: Record<string, unknown>) => {
  const normalized = normalizeClaudeMessages(body.messages);
  const tools = normalizeClaudeTools(body.tools);
  const toolChoice = normalizeClaudeToolChoice(body.tool_choice);
  const maxTokens =
    typeof body.max_tokens === "number" && Number.isFinite(body.max_tokens)
      ? body.max_tokens
      : 4096;

  return {
    model: normalizeClaudeModelName(body.model),
    max_tokens: maxTokens,
    temperature: typeof body.temperature === "number" ? body.temperature : undefined,
    top_p: typeof body.top_p === "number" ? body.top_p : undefined,
    system: normalized.system || undefined,
    messages: normalized.messages,
    tools,
    tool_choice: toolChoice,
  };
};

const toOpenAICompatibleResponse = (payload: Record<string, unknown>) => {
  const content = Array.isArray(payload.content) ? payload.content : [];
  const text = content
    .filter((item) => (item as { type?: string }).type === "text")
    .map((item) => String((item as { text?: unknown }).text ?? ""))
    .filter(Boolean)
    .join("\n");
  const toolUse = content.find((item) => (item as { type?: string }).type === "tool_use") as
    | { id?: string; name?: string; input?: unknown }
    | undefined;

  return {
    id: payload.id ?? `claude-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: payload.model,
    choices: [
      {
        index: 0,
        finish_reason: payload.stop_reason ?? null,
        message: {
          role: "assistant",
          content: text || null,
          tool_calls: toolUse
            ? [
                {
                  id: toolUse.id ?? `tool-${Date.now()}`,
                  type: "function",
                  function: {
                    name: toolUse.name,
                    arguments:
                      typeof toolUse.input === "string"
                        ? toolUse.input
                        : JSON.stringify(toolUse.input ?? {}),
                  },
                },
              ]
            : [],
        },
      },
    ],
    usage: payload.usage,
  };
};

const createClaudeChatCompletion = async (provider: AIProviderConfig, body: Record<string, unknown>) => {
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toClaudePayload(body)),
  });

  if (!response.ok) {
    return response;
  }

  const payload = await response.json();
  return new Response(JSON.stringify(toOpenAICompatibleResponse(payload)), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};

const createOpenAIChatCompletion = async (provider: AIProviderConfig, body: Record<string, unknown>) => {
  const payload = {
    ...body,
    model: normalizeOpenAIModelName(body.model),
  };

  return fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

const createVercelGatewayChatCompletion = async (provider: AIProviderConfig, body: Record<string, unknown>) => {
  const primaryModel = normalizeVercelGatewayModelName(body.model);
  const models = getVercelGatewayFallbackModels(primaryModel);
  let lastResponse: Response | null = null;

  for (const model of models) {
    const payload = {
      ...body,
      model,
    };

    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) return response;

    lastResponse = response;
  }

  return lastResponse ?? new Response(
    JSON.stringify({ error: "Vercel AI Gateway failed before receiving a provider response." }),
    {
      status: 502,
      headers: { "Content-Type": "application/json" },
    },
  );
};

export const getAIProviderName = () => resolveAIProvider().name;

export const createAIChatCompletion = async (
  body: Record<string, unknown>,
) => {
  const provider = resolveAIProvider();

  if (provider.name === "vercel-gateway") {
    return createVercelGatewayChatCompletion(provider, body);
  }

  if (provider.name === "claude") {
    return createClaudeChatCompletion(provider, body);
  }

  if (provider.name === "openai") {
    return createOpenAIChatCompletion(provider, body);
  }

  const payload = {
    ...body,
    model: normalizeGeminiModelName(body.model),
  };

  return fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const createAIImageGeneration = async (
  body: Record<string, unknown>,
) => {
  const geminiKey = readFirstEnv("GEMINI_API_KEY", "GOOGLE_API_KEY");

  if (!geminiKey) {
    return new Response(
      JSON.stringify({
        error: "Image generation requires GEMINI_API_KEY or GOOGLE_API_KEY. Fallback visuals will be used.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return fetch(GEMINI_OPENAI_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${geminiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};
