import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  /** Path only, e.g. "/ai" - appended to https://pixelrises.fr */
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string[] | string;
  jsonLd?: JsonLdObject | JsonLdObject[];
  ogType?: string;
}

type JsonLdPrimitive = string | number | boolean | null;
type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[];
type JsonLdObject = Record<string, JsonLdValue>;

const SITE = "https://pixelrises.fr";
const DEFAULT_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/BExGIs9CMgVdJZ2wlShIQPLUwah2/social-images/social-1773590798313-6F365D98-7A74-47DC-B8EA-50626D46740D.webp";

const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string, hreflang?: string) => {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const SEOHead = ({
  title,
  description,
  canonical,
  path,
  ogImage = DEFAULT_OG,
  noIndex = false,
  keywords,
  jsonLd,
  ogType = "website",
}: SEOHeadProps) => {
  useEffect(() => {
    const url = canonical || `${SITE}${path ?? ""}`;
    const keywordsContent = Array.isArray(keywords) ? keywords.join(", ") : keywords;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noIndex ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    if (keywordsContent) {
      upsertMeta("name", "keywords", keywordsContent);
    }

    upsertLink("canonical", url);
    upsertLink("alternate", url, "fr");
    upsertLink("alternate", `${url}${url.includes("?") ? "&" : "?"}lang=en`, "en");
    upsertLink("alternate", url, "x-default");

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:type", ogType);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.dataset.dynamic = "true";
      scriptEl.text = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, canonical, path, ogImage, noIndex, keywords, jsonLd, ogType]);

  return null;
};

export default SEOHead;
