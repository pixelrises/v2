import type { AnalyticsEventName } from "./mock-data";

export type AnalyticsEventPayload = {
  event: AnalyticsEventName;
  projectId?: string;
  siteId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const localAnalyticsKey = "pixelrises-v2-analytics-events";

export const trackV2Event = (event: AnalyticsEventName, metadata: Record<string, unknown> = {}) => {
  const payload: AnalyticsEventPayload = {
    event,
    metadata,
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = window.localStorage.getItem(localAnalyticsKey);
    const events = existing ? (JSON.parse(existing) as AnalyticsEventPayload[]) : [];
    window.localStorage.setItem(localAnalyticsKey, JSON.stringify([payload, ...events].slice(0, 200)));
  } catch {
    // Analytics local fallback should never block the product.
  }

  return payload;
};

export const readLocalV2Events = () => {
  try {
    const existing = window.localStorage.getItem(localAnalyticsKey);
    return existing ? (JSON.parse(existing) as AnalyticsEventPayload[]) : [];
  } catch {
    return [];
  }
};
