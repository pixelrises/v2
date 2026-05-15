export const PIXELRISES_ROOT_DOMAIN = "pixelrises.fr";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "demo",
  "app",
  "admin",
  "auth",
  "v2",
  "staging",
  "preview",
  "beta",
]);
const BLOCKED_CUSTOM_DOMAIN_SUFFIXES = [
  ".vercel.app",
  ".netlify.app",
  ".supabase.co",
  ".localhost",
];

export const normalizeDomainHostname = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");

export const buildPixelrisesRootUrl = (path = "/") =>
  `https://${PIXELRISES_ROOT_DOMAIN}${path.startsWith("/") ? path : `/${path}`}`;

export const buildPublishedSiteUrl = (slug: string) =>
  buildPixelrisesRootUrl(`/s/${slug}`);

export const buildCustomDomainUrl = (domain: string) =>
  `https://${normalizeDomainHostname(domain).replace(/^www\./, "")}`;

export const isAllowedCustomDomainHostname = (domain: string) => {
  const normalized = normalizeDomainHostname(domain).replace(/^www\./, "");

  if (!normalized) return false;
  if (normalized === PIXELRISES_ROOT_DOMAIN) return false;
  if (normalized.endsWith(`.${PIXELRISES_ROOT_DOMAIN}`)) return false;

  return !BLOCKED_CUSTOM_DOMAIN_SUFFIXES.some(
    (suffix) => normalized === suffix.slice(1) || normalized.endsWith(suffix),
  );
};

export const canUseConnectedCustomDomain = (
  domain: string | null | undefined,
  domainStatus?: string | null,
) => Boolean(domain) && domainStatus === "connected" && isAllowedCustomDomainHostname(domain);

export const resolvePublishedSiteUrl = ({
  slug,
}: {
  slug?: string | null;
  customDomain?: string | null;
  domainStatus?: string | null;
}) => {
  // For launch reliability, always use the stable Pixelrises public path.
  // Custom domains are managed separately and should not be the default live URL.
  if (slug) {
    return buildPublishedSiteUrl(slug);
  }

  return null;
};

export const getDomainLookupCandidates = (hostname: string) => {
  const normalized = normalizeDomainHostname(hostname);
  if (!normalized) return [];

  const bare = normalized.replace(/^www\./, "");
  return Array.from(new Set([normalized, bare].filter(Boolean)));
};

export const getPublishedSiteSlugFromHostname = (hostname: string) => {
  const normalized = normalizeDomainHostname(hostname);

  if (
    !normalized ||
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.endsWith(".localhost")
  ) {
    return null;
  }

  if (normalized === PIXELRISES_ROOT_DOMAIN) {
    return null;
  }

  const suffix = `.${PIXELRISES_ROOT_DOMAIN}`;
  if (!normalized.endsWith(suffix)) {
    return null;
  }

  const slug = normalized.slice(0, -suffix.length).split(".").filter(Boolean).pop();
  if (!slug || RESERVED_SUBDOMAINS.has(slug)) {
    return null;
  }

  return slug;
};
