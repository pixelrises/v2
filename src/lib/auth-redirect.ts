import { safeLocalStorage } from "@/lib/browser-storage";
import { getRuntimeAppOrigin } from "@/lib/browser-context";

const AUTH_REDIRECT_KEY = "pixelrises.auth.redirect";
const DEFAULT_AUTH_REDIRECT = "/dashboard";

const sanitizeRedirectPath = (value: string | null | undefined) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    if (typeof window === "undefined") {
      return value;
    }

    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) {
      return DEFAULT_AUTH_REDIRECT;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
};

export const getCurrentRelativeUrl = () => {
  if (typeof window === "undefined") {
    return DEFAULT_AUTH_REDIRECT;
  }

  return sanitizeRedirectPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  );
};

export const buildAuthRoute = (target = DEFAULT_AUTH_REDIRECT) =>
  `/auth?redirect=${encodeURIComponent(sanitizeRedirectPath(target))}`;

export const storeAuthRedirectTarget = (target: string) => {
  safeLocalStorage().setItem(AUTH_REDIRECT_KEY, sanitizeRedirectPath(target));
};

export const consumeAuthRedirectTarget = () => {
  const storage = safeLocalStorage();
  const target = sanitizeRedirectPath(storage.getItem(AUTH_REDIRECT_KEY));
  storage.removeItem(AUTH_REDIRECT_KEY);
  return target;
};

export const getOAuthRedirectUrl = () => {
  // Important for Vercel previews/staging: never force OAuth back to pixelrises.fr,
  // because that domain can still point to another app version.
  return new URL("/auth/callback", getRuntimeAppOrigin()).toString();
};
