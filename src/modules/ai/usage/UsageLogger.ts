import { redactSecrets } from "../security/redactSecrets";
import type { AIProviderId, AITaskType, AIUsageLogEntry } from "../schemas/ai-task.schema";

export class UsageLogger {
  private entries: AIUsageLogEntry[] = [];

  logUsage(entry: Omit<AIUsageLogEntry, "timestamp"> & { timestamp?: string }) {
    const safeEntry = JSON.parse(redactSecrets(JSON.stringify(entry))) as Omit<AIUsageLogEntry, "timestamp"> & {
      timestamp?: string;
    };
    this.entries.push({
      ...safeEntry,
      timestamp: safeEntry.timestamp ?? new Date().toISOString(),
    });
  }

  getEntries() {
    return [...this.entries];
  }

  providerUsageSummary() {
    return this.entries.reduce<Record<AIProviderId, { calls: number; estimatedCost: number; success: number; failure: number }>>(
      (summary, entry) => {
        const current = summary[entry.provider] ?? { calls: 0, estimatedCost: 0, success: 0, failure: 0 };
        summary[entry.provider] = {
          calls: current.calls + 1,
          estimatedCost: Number((current.estimatedCost + entry.estimatedCost).toFixed(6)),
          success: current.success + (entry.success ? 1 : 0),
          failure: current.failure + (entry.success ? 0 : 1),
        };
        return summary;
      },
      {} as Record<AIProviderId, { calls: number; estimatedCost: number; success: number; failure: number }>,
    );
  }

  clear() {
    this.entries = [];
  }
}

export const usageLogger = new UsageLogger();

export const createUsageEntry = (input: {
  provider: AIProviderId;
  model: string;
  taskType: AITaskType;
  durationMs: number;
  success: boolean;
  retryCount?: number;
  estimatedTokens: number;
  estimatedCost: number;
}): AIUsageLogEntry => ({
  retryCount: 0,
  timestamp: new Date().toISOString(),
  ...input,
});
