import { redactObjectSecrets, redactSecrets } from "@/modules/ai/security/redactSecrets";

type MonitoringLevel = "info" | "warn" | "error";

type MonitoringPayload = {
  context: string;
  message: string;
  level?: MonitoringLevel;
  metadata?: Record<string, unknown>;
  stack?: string;
  timestamp?: string;
};

const STORAGE_KEY = "pixelrises:frontend-errors";
const MAX_STORED_EVENTS = 25;

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const normalizeError = (error: unknown, fallback = "Une erreur inconnue est survenue.") => {
  if (error instanceof Error) {
    return {
      message: redactSecrets(error.message || fallback),
      stack: redactSecrets(error.stack),
    };
  }

  if (typeof error === "string") {
    return {
      message: redactSecrets(error || fallback),
      stack: undefined,
    };
  }

  return {
    message: fallback,
    stack: redactSecrets(safeStringify(error)),
  };
};

const writeToStorage = (entry: MonitoringPayload) => {
  if (typeof window === "undefined") return;

  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    const parsed = current ? (JSON.parse(current) as MonitoringPayload[]) : [];
    const next = [entry, ...parsed].slice(0, MAX_STORED_EVENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best effort only.
  }
};

export const reportFrontendEvent = ({
  context,
  message,
  level = "info",
  metadata,
  stack,
}: MonitoringPayload) => {
  const entry: MonitoringPayload = {
    context,
    message: redactSecrets(message),
    level,
    metadata: metadata ? redactObjectSecrets(metadata) : undefined,
    stack: redactSecrets(stack),
    timestamp: new Date().toISOString(),
  };

  const logger =
    level === "error" ? console.error : level === "warn" ? console.warn : console.info;

  logger(`[Pixelrises:${context}] ${entry.message}`, entry.metadata || "", entry.stack || "");
  writeToStorage(entry);
};

export const reportFrontendError = (
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
  fallback = "Une erreur inattendue est survenue.",
) => {
  const normalized = normalizeError(error, fallback);
  reportFrontendEvent({
    context,
    message: normalized.message,
    level: "error",
    metadata,
    stack: normalized.stack,
  });
};

export const getReadableErrorMessage = (
  error: unknown,
  fallback = "Une erreur inattendue est survenue.",
) => normalizeError(error, fallback).message;

