const BASE = "https://nicepage.com";

const SOURCE_URLS = [
  "https://nicepage.com/website-design",
  "https://nicepage.com/c/interior-templates",
  "https://nicepage.com/c/food-restaurant-templates",
  "https://nicepage.com/c/medicine-science-templates",
  "https://nicepage.com/c/architecture-building-templates",
  "https://nicepage.com/c/education-templates",
  "https://nicepage.com/c/technology-templates",
  "https://nicepage.com/c/industrial-templates",
  "https://nicepage.com/c/sale-templates",
  "https://nicepage.com/c/nature-templates",
  "https://nicepage.com/c/art-design-templates",
  "https://nicepage.com/c/business-law-templates",
  "https://nicepage.com/c/fashion-beauty-templates",
  "https://nicepage.com/c/pets-animals-templates",
  "https://nicepage.com/c/cars-transportation-templates",
  "https://nicepage.com/c/real-estate-templates",
  "https://nicepage.com/c/wedding-templates",
  "https://nicepage.com/c/sports-templates",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHtml = (value = "") =>
  String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const compactText = (value = "") =>
  decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const attr = (html, name) => {
  const match = html.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
};

const absoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
};

const unique = (items) => Array.from(new Set(items.filter(Boolean)));

const extractMeta = (html, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]).trim();
  }
  return "";
};

const fetchText = async (url, options = {}) => {
  const { retries = 2, delay = 250 } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 PixelrisesExtractor/1.0 (+https://pixelrises.fr)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      await sleep(delay * (attempt + 1));
    }
  }

  throw lastError;
};

const extractCategoryKeywords = (html) => {
  const h1Index = html.search(/<h1[^>]*>/i);
  const listIndex = html.search(/<ul class="thumbnails/i);
  const scope = h1Index >= 0 && listIndex > h1Index ? html.slice(h1Index, listIndex) : html;
  const keywords = [];
  for (const match of scope.matchAll(/<a\s+[^>]*href="[^"]+"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = compactText(match[1]);
    if (text && !/download|learn more/i.test(text)) keywords.push(text);
  }
  return unique(keywords);
};

const extractCategoryDescription = (html) => {
  const h1 = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (!h1) return "";
  const start = (h1.index || 0) + h1[0].length;
  const listIndex = html.indexOf('<ul class="thumbnails', start);
  const h2Index = html.search(/<h2[^>]*>/i);
  const endCandidates = [listIndex, h2Index].filter((index) => index > start);
  const end = endCandidates.length ? Math.min(...endCandidates) : Math.min(html.length, start + 2000);
  const raw = html.slice(start, end).replace(/<a[\s\S]*?<\/a>/gi, " ");
  return compactText(raw).replace(/Last Updated:.*/i, "").trim();
};

const parseListingPage = (url, html) => {
  const h1 = compactText((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "");
  const category = h1 || decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || url);
  const categoryDescription = extractCategoryDescription(html) || extractMeta(html, "Description");
  const categoryKeywords = extractCategoryKeywords(html);
  const templates = [];

  const liMatches = html.match(/<li\s+class="thumbnail-item[\s\S]*?<\/li>/gi) || [];
  for (const li of liMatches) {
    const thumb = li.match(/<a\s+class="thumbnail"[\s\S]*?<\/a>/i)?.[0] || "";
    const href = attr(thumb, "href");
    if (!/^\/(t|sd)\//.test(href)) continue;

    const title = attr(thumb, "title") || attr(thumb, "alt") || compactText(thumb);
    const imgMatch = thumb.match(/<img[\s\S]*?>/i)?.[0] || "";
    const image = absoluteUrl(attr(imgMatch, "data-src") || attr(imgMatch, "src"));
    const fullPreview = absoluteUrl(attr(li.match(/class="[^"]*page-more[\s\S]*?>/i)?.[0] || "", "data-url"));

    templates.push({
      title,
      description: "",
      category,
      keywords: categoryKeywords,
      image,
      blocks: [],
      source: absoluteUrl(href),
      fullPreview,
    });
  }

  return {
    url,
    category,
    pageDescription: categoryDescription,
    pageKeywords: categoryKeywords,
    templates,
  };
};

const parseDescriptionKeywords = (description) => {
  const subjects = description.match(/subjects like\s+([^.]*)\./i)?.[1] || "";
  const categories = description.match(/Categories:\s*([^.]*)\./i)?.[1] || "";
  return {
    subjects: unique(subjects.split(/,|;/).map((item) => item.trim())),
    categories: unique(categories.split(/,|;/).map((item) => item.trim())),
  };
};

const parseDetailPage = (html) => {
  const description = extractMeta(html, "Description") || extractMeta(html, "og:description");
  const ogImage = absoluteUrl(extractMeta(html, "og:image").replace(/\?version=.*/, ""));
  const title = compactText((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "");
  const parsed = parseDescriptionKeywords(description);

  const categoryScope = html.match(/Category\s*[\s\S]{0,1200}?<\/div>/i)?.[0] || "";
  const detailCategories = [];
  for (const match of categoryScope.matchAll(/<a\s+[^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = compactText(match[1]);
    if (text) detailCategories.push(text);
  }

  const previewHref = html.match(/href="([^"]*\/templates\/preview\/[^"]*)"/i)?.[1] || "";
  const previewImage = absoluteUrl(
    html.match(/<img[^>]+class="[^"]*media-image[^"]*img-responsive[^"]*"[^>]+src="([^"]+)"/i)?.[1] || "",
  );

  return {
    title,
    description,
    image: previewImage || ogImage,
    keywords: parsed.subjects,
    categories: unique([...detailCategories, ...parsed.categories]),
    previewUrl: absoluteUrl(previewHref),
  };
};

const textFromNode = (html) => compactText(html);

const extractHeadings = (html) => {
  const headings = [];
  for (const match of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = compactText(match[2]);
    if (text) headings.push(text);
  }
  return unique(headings);
};

const extractImages = (html) => {
  const images = [];
  for (const match of html.matchAll(/<img[\s\S]*?>/gi)) {
    const tag = match[0];
    const src = absoluteUrl(attr(tag, "data-src") || attr(tag, "src"));
    const alt = attr(tag, "alt");
    if (src && !src.startsWith("data:image")) images.push({ src, alt });
  }
  return images;
};

const parseLiveBlocks = (html) => {
  const blocks = [];
  const sectionMatches = html.match(/<section[\s\S]*?<\/section>/gi) || [];
  const sourceBlocks = sectionMatches.length
    ? sectionMatches
    : html.match(/<div[^>]+class="[^"]*u-section-[^"]*"[\s\S]*?<\/div>/gi) || [];

  sourceBlocks.forEach((block, index) => {
    const className = attr(block.match(/<(section|div)[\s\S]*?>/i)?.[0] || "", "class");
    const headings = extractHeadings(block);
    const text = textFromNode(block);
    const images = extractImages(block);
    blocks.push({
      index: index + 1,
      class: className,
      headings,
      text,
      images,
    });
  });

  return blocks;
};

const extractPreviewBlocks = async (previewUrl) => {
  if (!previewUrl) return [];
  const wrapper = await fetchText(previewUrl, { retries: 1, delay: 180 });
  const iframeSrc = wrapper.match(/<iframe[^>]+id="livePreviewFrame"[^>]+src="([^"]+)"/i)?.[1] ||
    wrapper.match(/<iframe[^>]+src="([^"]+)"/i)?.[1] ||
    "";
  const liveUrl = absoluteUrl(iframeSrc);
  if (!liveUrl) return [];
  const liveHtml = await fetchText(liveUrl, { retries: 1, delay: 180 });
  return parseLiveBlocks(liveHtml);
};

const runPool = async (items, worker, concurrency = 6) => {
  let cursor = 0;
  const results = new Array(items.length);
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const main = async () => {
  const outputPath = "exports/nicepage-templates.json";
  const skeletonPath = "exports/nicepage-templates-skeleton.json";

  console.log(`Detecting ${SOURCE_URLS.length} Nicepage pages...`);
  const pages = [];
  for (const url of SOURCE_URLS) {
    const html = await fetchText(url);
    const page = parseListingPage(url, html);
    pages.push(page);
    console.log(`- ${page.category}: ${page.templates.length} templates`);
  }

  const skeleton = pages.map((page) => ({
    url: page.url,
    category: page.category,
    templates: [],
  }));
  await BunCompat.writeFile(skeletonPath, JSON.stringify(skeleton, null, 2));
  console.log(`Skeleton written: ${skeletonPath}`);

  const allTemplates = pages.flatMap((page, pageIndex) =>
    page.templates.map((template, templateIndex) => ({ pageIndex, templateIndex, template })),
  );
  console.log(`Extracting ${allTemplates.length} templates with detail metadata and visible blocks...`);

  await runPool(
    allTemplates,
    async ({ pageIndex, templateIndex, template }, globalIndex) => {
      const label = `${globalIndex + 1}/${allTemplates.length} ${template.title}`;
      try {
        const detailHtml = await fetchText(template.source, { retries: 2, delay: 220 });
        const detail = parseDetailPage(detailHtml);
        const blocks = await extractPreviewBlocks(detail.previewUrl).catch((error) => [
          {
            index: 1,
            class: "preview-unavailable",
            headings: [],
            text: `Preview blocks unavailable: ${error.message}`,
            images: [],
          },
        ]);

        pages[pageIndex].templates[templateIndex] = {
          title: detail.title ? detail.title.replace(/\s+Template$/i, "") : template.title,
          description: detail.description || template.description,
          category: detail.categories.length ? detail.categories.join(", ") : template.category,
          image: detail.image || template.image,
          keywords: unique([...detail.keywords, ...template.keywords]),
          blocks,
        };
        if ((globalIndex + 1) % 25 === 0 || globalIndex === allTemplates.length - 1) {
          console.log(`  extracted ${globalIndex + 1}/${allTemplates.length}`);
        }
      } catch (error) {
        pages[pageIndex].templates[templateIndex] = {
          title: template.title,
          description: template.description,
          category: template.category,
          image: template.image,
          keywords: template.keywords,
          blocks: [
            {
              index: 1,
              class: "extraction-error",
              headings: [],
              text: `Extraction error: ${error.message}`,
              images: [],
            },
          ],
        };
        console.warn(`  failed ${label}: ${error.message}`);
      }
    },
    Number(process.env.NICEPAGE_CONCURRENCY || 5),
  );

  const finalOutput = pages.map((page) => ({
    url: page.url,
    category: page.category,
    templates: page.templates.map(({ title, description, category, image, keywords, blocks }) => ({
      title,
      description,
      category,
      image,
      keywords,
      blocks,
    })),
  }));

  await BunCompat.writeFile(outputPath, JSON.stringify(finalOutput, null, 2));
  console.log(`Done. Full JSON written: ${outputPath}`);
};

const BunCompat = {
  writeFile: async (path, data) => {
    const fs = await import("node:fs/promises");
    await fs.writeFile(path, data, "utf8");
  },
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
