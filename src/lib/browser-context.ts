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

const getUserAgent = () =>
  typeof navigator === "undefined" ? "" : navigator.userAgent || "";

export const isLocalhostHostname = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "0.0.0.0" ||
  hostname.endsWith(".localhost");

export const isLikelyEmbeddedBrowser = () => {
  const userAgent = getUserAgent();
  return EMBEDDED_BROWSER_PATTERNS.some((pattern) => pattern.test(userAgent));
};

export const isLikelyMobileDevice = () => {
  const userAgent = getUserAgent();
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
};

export const getSafePublicAuthUrl = (redirect = "/dashboard") => {
  const url = new URL("/auth", PIXELRISES_PUBLIC_APP_URL);
  url.searchParams.set("redirect", redirect);
  return url.toString();
};
