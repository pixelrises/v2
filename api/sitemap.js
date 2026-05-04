const SITE_URL = "https://pixelrises.fr";

const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/ai", changefreq: "weekly", priority: "0.9" },
  { path: "/remboursement", changefreq: "monthly", priority: "0.4" },
  { path: "/mentions-legales", changefreq: "yearly", priority: "0.2" },
  { path: "/cgv", changefreq: "yearly", priority: "0.2" },
  { path: "/confidentialite", changefreq: "yearly", priority: "0.2" },
  { path: "/cookies", changefreq: "yearly", priority: "0.2" },
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const renderUrl = ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
${lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const fetchPublishedSites = async () => {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return [];
  }

  const endpoint = new URL(`${supabaseUrl}/rest/v1/generated_sites`);
  endpoint.searchParams.set("select", "slug,updated_at,published_at");
  endpoint.searchParams.set("status", "eq.published");
  endpoint.searchParams.set("slug", "not.is.null");
  endpoint.searchParams.set("order", "updated_at.desc");

  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => typeof row.slug === "string" && row.slug.trim().length > 0)
    .map((row) => ({
      loc: `${SITE_URL}/s/${row.slug}`,
      lastmod: row.updated_at || row.published_at || null,
      changefreq: "weekly",
      priority: "0.8",
    }));
};

export default async function handler(_req, res) {
  const staticEntries = STATIC_PAGES.map((page) => ({
    loc: `${SITE_URL}${page.path}`,
    changefreq: page.changefreq,
    priority: page.priority,
    lastmod: null,
  }));

  const publishedEntries = await fetchPublishedSites();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...publishedEntries].map(renderUrl).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  res.status(200).send(xml);
}
