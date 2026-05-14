import type { DataState } from "@/lib/data-state";
import { redactObjectSecrets, redactPersonalDataForAI } from "@/modules/ai/security/redactSecrets";
import type { AnalyticsEventName } from "./mock-data";

export type AnalyticsEventPayload = {
  eventId: string;
  event: AnalyticsEventName;
  module?: string;
  projectId?: string;
  siteId?: string;
  metadata?: Record<string, unknown>;
  dataState: DataState;
  createdAt: string;
};

const localAnalyticsKey = "pixelrises-v2-analytics-events";

const createEventId = () => globalThis.crypto?.randomUUID?.() ?? `event-${Date.now().toString(36)}`;

const redactMetadataValue = (value: unknown): unknown => {
  if (typeof value === "string") return redactPersonalDataForAI(value);
  if (Array.isArray(value)) return value.map(redactMetadataValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, redactMetadataValue(nestedValue)]),
    );
  }

  return value;
};

const sanitizeMetadata = (metadata: Record<string, unknown>) =>
  redactMetadataValue(redactObjectSecrets(metadata)) as Record<string, unknown>;

export const trackV2Event = (
  event: AnalyticsEventName,
  metadata: Record<string, unknown> = {},
  options: { module?: string; projectId?: string; siteId?: string; dataState?: DataState } = {},
) => {
  const safeMetadata = sanitizeMetadata(metadata);
  const payload: AnalyticsEventPayload = {
    eventId: createEventId(),
    event,
    module: options.module ?? (typeof safeMetadata.module === "string" ? safeMetadata.module : undefined),
    projectId: options.projectId ?? (typeof safeMetadata.projectId === "string" ? safeMetadata.projectId : undefined),
    siteId: options.siteId ?? (typeof safeMetadata.siteId === "string" ? safeMetadata.siteId : undefined),
    metadata: safeMetadata,
    dataState: options.dataState ?? "mock",
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = window.localStorage.getItem(localAnalyticsKey);
    const events = existing ? (JSON.parse(existing) as AnalyticsEventPayload[]) : [];
    window.localStorage.setItem(localAnalyticsKey, JSON.stringify([payload, ...events].slice(0, 300)));
  } catch {
    // Analytics local fallback should never block the product.
  }

  return payload;
};

export const readLocalV2Events = () => {
  try {
    const existing = window.localStorage.getItem(localAnalyticsKey);
    const events = existing ? (JSON.parse(existing) as AnalyticsEventPayload[]) : [];

    return events.map((event) => ({
      eventId: event.eventId ?? createEventId(),
      event: event.event,
      module: event.module,
      projectId: event.projectId,
      siteId: event.siteId,
      metadata: sanitizeMetadata(event.metadata ?? {}),
      dataState: event.dataState ?? "mock",
      createdAt: event.createdAt,
    }));
  } catch {
    return [];
  }
};
