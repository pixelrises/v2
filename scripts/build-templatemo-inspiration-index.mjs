import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const DOWNLOADS_DIR = "C:/Users/rkf/Downloads";
const EXPORT_DIR = path.join(ROOT, "exports", "templatemo-extracted");
const OUTPUT_FILE = path.join(ROOT, "supabase", "functions", "generate-site", "templatemo-inspiration.ts");

const ZIP_FILES = [
  "templatemo_612_parallax_starter.zip",
  "templatemo_602_graph_page.zip",
  "templatemo_604_christmas_piano.zip",
  "templatemo_603_nexaverse.zip",
  "templatemo_605_xmas_countdown.zip",
  "templatemo_570_chain_app_dev.zip",
  "templatemo_511_journey.zip",
  "templatemo_512_moonlight.zip",
  "templatemo_509_hydro.zip",
  "templatemo_588_ebook_landing.zip",
  "templatemo_540_lava_landing_page.zip",
  "templatemo_598_sleeky_pro.zip",
  "templatemo_600_prism_flux.zip",
  "templatemo_599_noir_fashion.zip",
  "templatemo_596_electric_xtra.zip",
  "templatemo_610_aurum_gold.zip",
  "templatemo_609_crypto_vault.zip",
  "templatemo_613_frost_bakery.zip",
  "templatemo_614_quantix_saas.zip",
  "templatemo_615_amber_folio.zip",
  "templatemo_617_pixel_forge.zip",
  "templatemo_618_the_catalyst.zip",
  "templatemo_619_axis_industrial.zip",
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "your",
  "you",
  "our",
  "this",
  "that",
  "page",
  "html",
  "css",
  "template",
  "templatemo",
  "free",
  "website",
  "bootstrap",
  "section",
  "container",
  "content",
  "item",
  "card",
  "image",
  "images",
  "index",
]);

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const unique = (items) => [...new Set(items.filter(Boolean))];

const compactList = (items, limit = 18) =>
  unique(
    items
      .map((item) => normalize(item))
      .filter((item) => item.length >= 3 && !STOP_WORDS.has(item)),
  ).slice(0, limit);

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
};

const extractZip = (zipPath, destination) => {
  fs.rmSync(destination, { recursive: true, force: true });
  ensureDir(destination);
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: "ignore" },
  );
};

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getMatches = (value, regexp) => {
  const matches = [];
  let match;
  const cloned = new RegExp(regexp.source, regexp.flags.includes("g") ? regexp.flags : `${regexp.flags}g`);
  while ((match = cloned.exec(value)) !== null) {
    matches.push(match);
  }
  return matches;
};

const extractHtmlSignals = (html) => {
  const title = getMatches(html, /<title[^>]*>([\s\S]*?)<\/title>/gi)[0]?.[1]?.trim() || "";
  const metaDescription =
    getMatches(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/gi)[0]?.[1]?.trim() ||
    "";
  const sectionTokens = getMatches(html, /<(section|header|footer|main|nav|article|aside|div)[^>]*(?:id|class)=["']([^"']+)["'][^>]*>/gi)
    .flatMap((match) => String(match[2] || "").split(/\s+/))
    .map((token) => token.replace(/^(tm|templatemo|js|wow|fade|col|row|d|flex|align|justify|text|btn)-?/i, ""));
  const headingSignals = getMatches(html, /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)
    .map((match) => stripTags(match[1]))
    .flatMap((heading) => normalize(heading).split(" "))
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
  const navSignals = getMatches(html, /<a[^>]*>([\s\S]*?)<\/a>/gi)
    .map((match) => stripTags(match[1]))
    .flatMap((label) => normalize(label).split(" "))
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
  const textTokens = stripTags(html)
    .split(/\s+/)
    .map(normalize)
    .filter((token) => token.length >= 5 && !STOP_WORDS.has(token));

  return {
    title,
    metaDescription,
    sectionTokens: compactList(sectionTokens, 36),
    headingSignals: compactList(headingSignals, 24),
    navSignals: compactList(navSignals, 20),
    textTokens: compactList(textTokens, 28),
  };
};

const extractCssSignals = (css) => {
  const colors = unique([
    ...getMatches(css, /#[0-9a-f]{3,8}\b/gi).map((match) => match[0].toLowerCase()),
    ...getMatches(css, /rgba?\([^)]+\)/gi).map((match) => match[0].toLowerCase()),
    ...getMatches(css, /linear-gradient\([^)]+\)/gi).map(() => "linear-gradient"),
    ...getMatches(css, /radial-gradient\([^)]+\)/gi).map(() => "radial-gradient"),
  ]).slice(0, 18);
  const classNames = getMatches(css, /\.([a-zA-Z0-9_-]+)\s*[{,:]/g).map((match) => match[1]);
  const keyframes = getMatches(css, /@keyframes\s+([a-zA-Z0-9_-]+)/g).map((match) => match[1]);
  const fonts = unique([
    ...getMatches(css, /font-family\s*:\s*([^;]+)/gi).map((match) => match[1].replace(/["']/g, "").trim()),
  ]).slice(0, 8);

  return {
    colors,
    classNames: compactList(classNames, 44),
    keyframes: compactList(keyframes, 16),
    fonts,
  };
};

const detectLikelyNiches = (name, allTokens) => {
  const source = normalize(`${name} ${allTokens.join(" ")}`);
  const rules = [
    ["restaurant", /\bbakery|baker|food|restaurant|cake|frost|menu|coffee|cafe\b/],
    ["saas-tech", /\bsaas|app|dev|crypto|vault|graph|quantix|nexa|digital|tech|software|dashboard|blockchain|neural|interface\b/],
    ["creative-services", /\bfolio|portfolio|pixel|forge|artist|creative|agency|design|showcase|studio|amber\b/],
    ["fashion-beauty", /\bfashion|noir|beauty|luxe|style|collection|chic\b/],
    ["industrial", /\bindustrial|axis|factory|steel|manufacturing|construction|observer\b/],
    ["events-entertainment", /\bchristmas|xmas|countdown|piano|event|music|journey|travel|moonlight\b/],
    ["education-training", /\bebook|book|author|landing|course|chapter|learning\b/],
    ["premium-business", /\bsleek|pro|aurum|gold|catalyst|parallax|hydro|starter|premium\b/],
  ];

  return unique(rules.filter(([, regexp]) => regexp.test(source)).map(([niche]) => niche)).slice(0, 5);
};

const detectVisualSignals = (tokens, cssSignals) => {
  const source = normalize(`${tokens.join(" ")} ${cssSignals.classNames.join(" ")} ${cssSignals.keyframes.join(" ")}`);
  const signals = [];

  if (/parallax|scroll|sticky/.test(source)) signals.push("parallax depth, layered scroll, immersive sections");
  if (/gradient|prism|flux|neon|electric|glow|cyber/.test(source)) signals.push("neon gradients, luminous accents, futuristic rhythm");
  if (/dark|noir|black|vault|crypto|moonlight/.test(source)) signals.push("dark premium surface, strong contrast, cinematic mood");
  if (/gold|aurum|amber|luxe|premium/.test(source)) signals.push("gold accents, luxury spacing, premium cards");
  if (/dashboard|graph|chart|data|metrics|wallet|markets/.test(source)) signals.push("dashboard grids, metrics cards, data-led proof");
  if (/portfolio|folio|gallery|showcase|masonry|artist/.test(source)) signals.push("portfolio gallery, editorial images, case-study rhythm");
  if (/countdown|event|piano|christmas|xmas/.test(source)) signals.push("event countdown, seasonal hero, emotional reveal");
  if (/bakery|frost|collection|menu/.test(source)) signals.push("product/menu cards, collection blocks, warm commerce flow");
  if (/saas|app|dev|quantix|templates/.test(source)) signals.push("SaaS hero, feature cards, product proof and pricing flow");
  if (/industrial|axis|factory|manufacturing/.test(source)) signals.push("industrial grid, robust cards, process and capability blocks");

  return unique(signals).slice(0, 8);
};

const detectComponentSignals = (tokens) => {
  const source = normalize(tokens.join(" "));
  const components = [];
  if (/hero|banner|masthead|intro/.test(source)) components.push("hero");
  if (/feature|service|solution|about/.test(source)) components.push("features/services");
  if (/portfolio|gallery|showcase|work|project/.test(source)) components.push("portfolio/gallery");
  if (/pricing|price|plan/.test(source)) components.push("pricing/plans");
  if (/testimonial|review|client/.test(source)) components.push("testimonials");
  if (/timeline|process|step|journey/.test(source)) components.push("process/timeline");
  if (/countdown|timer/.test(source)) components.push("countdown");
  if (/contact|form|subscribe|newsletter/.test(source)) components.push("contact/lead form");
  if (/dashboard|graph|chart|wallet|market|stats|metric/.test(source)) components.push("dashboard/data cards");
  if (/slider|carousel|tabs|accordion/.test(source)) components.push("interactive sections");
  return unique(components).slice(0, 10);
};

const buildTemplateSignal = (zipName) => {
  const slug = zipName.replace(/\.zip$/i, "");
  const zipPath = path.join(DOWNLOADS_DIR, zipName);
  const destination = path.join(EXPORT_DIR, slug);

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Missing ZIP: ${zipPath}`);
  }

  extractZip(zipPath, destination);
  const files = walk(destination);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const cssFiles = files.filter((file) => file.endsWith(".css"));
  const imageFiles = files.filter((file) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file));
  const htmlSignals = htmlFiles.map((file) => extractHtmlSignals(fs.readFileSync(file, "utf8")));
  const cssSignalsRaw = cssFiles.map((file) => extractCssSignals(fs.readFileSync(file, "utf8")));
  const mergedCss = {
    colors: unique(cssSignalsRaw.flatMap((signal) => signal.colors)).slice(0, 24),
    classNames: compactList(cssSignalsRaw.flatMap((signal) => signal.classNames), 64),
    keyframes: compactList(cssSignalsRaw.flatMap((signal) => signal.keyframes), 18),
    fonts: unique(cssSignalsRaw.flatMap((signal) => signal.fonts)).slice(0, 8),
  };
  const tokens = compactList(
    [
      slug,
      ...htmlSignals.flatMap((signal) => [
        signal.title,
        signal.metaDescription,
        ...signal.sectionTokens,
        ...signal.headingSignals,
        ...signal.navSignals,
        ...signal.textTokens,
      ]),
      ...mergedCss.classNames,
      ...mergedCss.keyframes,
      ...mergedCss.fonts,
      ...imageFiles.map((file) => path.basename(file, path.extname(file))),
    ],
    90,
  );
  const likelyNiches = detectLikelyNiches(slug, tokens);
  const visualSignals = detectVisualSignals(tokens, mergedCss);
  const componentSignals = detectComponentSignals(tokens);
  const assetSignals = compactList(
    imageFiles.map((file) => path.basename(file, path.extname(file)).replace(/[-_0-9]+/g, " ")),
    20,
  );
  const title =
    htmlSignals.find((signal) => signal.title)?.title ||
    slug.replace(/^templatemo_\d+_/, "").replace(/_/g, " ");

  return {
    sourceTemplate: slug,
    title,
    likelyNiches: likelyNiches.length ? likelyNiches : ["general-business"],
    pageCount: htmlFiles.length,
    htmlFiles: htmlFiles.map((file) => path.basename(file)).slice(0, 8),
    componentSignals,
    sectionPatterns: compactList(htmlSignals.flatMap((signal) => signal.sectionTokens), 32),
    visualSignals,
    colorSignals: mergedCss.colors,
    animationSignals: mergedCss.keyframes,
    layoutSignals: compactList(mergedCss.classNames, 34),
    keywordSignals: tokens.slice(0, 48),
    assetSignals,
    licenseNote: "Use as internal inspiration only. Do not copy HTML, CSS, texts, images or template names into generated client sites.",
  };
};

ensureDir(EXPORT_DIR);

const signals = ZIP_FILES.map(buildTemplateSignal);

const output = `// Distilled TemplateMo signals only: do not copy template HTML, CSS, texts, names or images into generated client sites.
export type TemplateMoInspiration = {
  sourceTemplate: string;
  title: string;
  likelyNiches: readonly string[];
  pageCount: number;
  htmlFiles: readonly string[];
  componentSignals: readonly string[];
  sectionPatterns: readonly string[];
  visualSignals: readonly string[];
  colorSignals: readonly string[];
  animationSignals: readonly string[];
  layoutSignals: readonly string[];
  keywordSignals: readonly string[];
  assetSignals: readonly string[];
  licenseNote: string;
};

export const TEMPLATEMO_TEMPLATE_INSPIRATIONS = ${JSON.stringify(signals, null, 2)} as const satisfies readonly TemplateMoInspiration[];
`;

fs.writeFileSync(OUTPUT_FILE, output, "utf8");
fs.rmSync(EXPORT_DIR, { recursive: true, force: true });

console.log(`Generated ${signals.length} TemplateMo inspirations -> ${path.relative(ROOT, OUTPUT_FILE)}`);
