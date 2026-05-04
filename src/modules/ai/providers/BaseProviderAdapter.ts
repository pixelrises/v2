import type { AIProviderId, AITaskType, RoutedAITask } from "../schemas/ai-task.schema";
import type { AIProviderConfig } from "../config/ai-providers.config";
import { getProviderConfig } from "../config/ai-providers.config";

export type ProviderStatus = "configured" | "missing" | "invalid" | "mock" | "disabled";

export type ProviderRequest = {
  task: RoutedAITask;
  prompt: string;
  context?: Record<string, unknown>;
};

export type ProviderJSONRequest = ProviderRequest & {
  schema?: string;
};

export type ProviderResponse<T = unknown> = {
  providerId: AIProviderId;
  model: string;
  success: boolean;
  data?: T;
  raw?: unknown;
  error?: string;
  durationMs: number;
  estimatedTokens: number;
  estimatedCost: number;
};

export interface AIProviderAdapter {
  providerId: AIProviderId;
  providerName: string;
  status: ProviderStatus;
  supportedTasks: AITaskType[];
  defaultModel: string;
  generateText(input: ProviderRequest): Promise<ProviderResponse<string>>;
  generateJSON<T = unknown>(input: ProviderJSONRequest): Promise<ProviderResponse<T>>;
  generateWithFiles(input: ProviderRequest): Promise<ProviderResponse>;
  streamResponse(input: ProviderRequest): AsyncGenerator<string>;
  validateConfig(): Promise<{ valid: boolean; status: ProviderStatus; message: string }>;
  estimateCost(input: ProviderRequest): number;
  healthCheck(): Promise<{ ok: boolean; status: ProviderStatus; message: string }>;
}

const countTokensRoughly = (value: string) => Math.ceil(value.trim().length / 4);

export class BaseProviderAdapter implements AIProviderAdapter {
  providerId: AIProviderId;
  providerName: string;
  status: ProviderStatus;
  supportedTasks: AITaskType[];
  defaultModel: string;
  protected config: AIProviderConfig;

  constructor(providerId: AIProviderId) {
    this.config = getProviderConfig(providerId);
    this.providerId = providerId;
    this.providerName = this.config.displayName;
    this.status = this.config.status;
    this.supportedTasks = this.config.supportedTasks;
    this.defaultModel = this.config.defaultModel;
  }

  async generateText(input: ProviderRequest): Promise<ProviderResponse<string>> {
    const startedAt = Date.now();
    return {
      providerId: this.providerId,
      model: this.defaultModel,
      success: false,
      error: `${this.providerName} is not configured for direct frontend execution.`,
      durationMs: Date.now() - startedAt,
      estimatedTokens: countTokensRoughly(input.prompt),
      estimatedCost: this.estimateCost(input),
    };
  }

  async generateJSON<T = unknown>(input: ProviderJSONRequest): Promise<ProviderResponse<T>> {
    const text = await this.generateText(input);
    return {
      ...text,
      data: undefined,
      raw: text.raw,
    } as ProviderResponse<T>;
  }

  async generateWithFiles(input: ProviderRequest): Promise<ProviderResponse> {
    const startedAt = Date.now();
    return {
      providerId: this.providerId,
      model: this.defaultModel,
      success: false,
      error: `File generation is not available for ${this.providerName} yet.`,
      durationMs: Date.now() - startedAt,
      estimatedTokens: countTokensRoughly(input.prompt),
      estimatedCost: this.estimateCost(input),
    };
  }

  async *streamResponse(input: ProviderRequest): AsyncGenerator<string> {
    const result = await this.generateText(input);
    yield result.success ? result.data ?? "" : result.error ?? "Provider unavailable.";
  }

  async validateConfig() {
    const valid = this.status === "configured" || this.status === "mock";
    return {
      valid,
      status: this.status,
      message: valid
        ? `${this.providerName} is ready in ${this.status} mode.`
        : `${this.providerName} is ${this.status}; backend key or route is required before real execution.`,
    };
  }

  estimateCost(input: ProviderRequest) {
    const tokens = countTokensRoughly(input.prompt);
    return Number((tokens * 0.000001).toFixed(6));
  }

  async healthCheck() {
    const config = await this.validateConfig();
    return {
      ok: config.valid,
      status: config.status,
      message: config.message,
    };
  }
}
