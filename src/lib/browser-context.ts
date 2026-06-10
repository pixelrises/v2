const EMBEDDED_BROWSER_PATTERNS = [
  /FBAN/i,
  /FBAV/i,
  /Instagram/i,
  /Line\//i,
  /TikTok/i,
  /Snapchat/i,
  /Pinterest/i,
  /LinkedInApp/i,
  /wv\)/i,
  /WebView/i,
];

export const PIXELRISES_PUBLIC_APP_URL = "https://pixelrises.fr";

const getHttpOrigin = (value: string | null | undefined) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
};

const getUserAgent = () =>
  typeof navigator === "undefined" ? "" : navigator.userAgent || "";

export const isLocalhostHostname = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname === "0.0.0.0" ||
  hostname.endsWith(".localhost");

export const isLocalAuthBypassEnabled = () => {
  if (typeof window === "undefined") return false;
  return isLocalhostHostname(window.location.hostname);
};

export const isPixelrisesAppHostname = (hostname: string) => {
  const normalized = hostname.trim().toLowerCase();

  return normalized === "v2.pixelrises.fr" || normalized.endsWith(".vercel.app");
};

export const resolveRuntimeAppOrigin = (origin?: string | null) =>
  getHttpOrigin(origin) ?? getHttpOrigin(PIXELRISES_PUBLIC_APP_URL) ?? PIXELRISES_PUBLIC_APP_URL;

export const getRuntimeAppOrigin = () => {
  if (typeof window === "undefined") return resolveRuntimeAppOrigin();
  return resolveRuntimeAppOrigin(window.location.origin);
};

export const getPublicAppOrigin = () => {
  if (typeof window === "undefined") return resolveRuntimeAppOrigin();

  if (isLocalhostHostname(window.location.hostname)) {
    return resolveRuntimeAppOrigin();
  }

  return getRuntimeAppOrigin();
};

export const isLikelyEmbeddedBrowser = () => {
  const userAgent = getUserAgent();
  return EMBEDDED_BROWSER_PATTERNS.some((pattern) => pattern.test(userAgent));
};

export const isLikelyMobileDevice = () => {
  const userAgent = getUserAgent();
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
};

export const getSafePublicAuthUrl = (redirect = "/dashboard") => {
  const url = new URL("/auth", getPublicAppOrigin());
  url.searchParams.set("redirect", redirect);
  return url.toString();
};
