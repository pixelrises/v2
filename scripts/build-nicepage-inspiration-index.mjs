import fs from "node:fs";

const SOURCE_PATH = "exports/nicepage-templates.json";
const TARGET_PATH = "supabase/functions/generate-site/nicepage-inspiration.ts";

const decode = (value = "") =>
  String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const normalizeKey = (value = "") =>
  decode(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const compact = (value = "") => decode(value).replace(/\s+/g, " ").trim();
const unique = (items) => Array.from(new Set(items.filter(Boolean)));

const increment = (map, key, amount = 1) => {
  const clean = compact(key);
  if (!clean) return;
  map.set(clean, (map.get(clean) || 0) + amount);
};

const topKeys = (map, limit) =>
  Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => key);

const BLOCK_TYPES = [
  { label: "hero", regex: /\b(hero|welcome|home|intro|main|headline|start|paradise|exclusive|premium)\b/ },
  { label: "services", regex: /\b(service|services|offer|solution|program|menu|course|treatment|care|design|consultation|estimate)\b/ },
  { label: "portfolio_gallery", regex: /\b(portfolio|gallery|project|works|collection|showcase|case|interior|property|photos)\b/ },
  { label: "proof_stats", regex: /\b(award|awards|percent|percentage|count|rate|clients|years|results|success)\b/ },
  { label: "testimonials", regex: /\b(testimonial|opinion|reviews|clients say|about us|our clients)\b/ },
  { label: "process", regex: /\b(process|steps|how it works|method|planning|timeline|approach)\b/ },
  { label: "team", regex: /\b(team|experts|representatives|doctors|teachers|designers|agents)\b/ },
  { label: "faq", regex: /\b(faq|questions|answers|help|tips)\b/ },
  { label: "pricing_offer", regex: /\b(price|pricing|sale|coupon|deals|discount|package|subscription|plan)\b/ },
  { label: "contact_cta", regex: /\b(contact|phone|email|address|visit|appointment|booking|reserve|delivery|order|quote)\b/ },
  { label: "local_seo", regex: /\b(city|local|location|locations|neighborhood|tour|travel|real estate|agency)\b/ },
  { label: "reassurance", regex: /\b(quality|guarantee|safe|trusted|professional|mission|experience|support)\b/ },
];

const classifyBlock = (block) => {
  const key = normalizeKey(`${(block.headings || []).join(" ")} ${block.text || ""} ${block.class || ""}`);
  const labels = BLOCK_TYPES.filter((item) => item.regex.test(key)).map((item) => item.label);
  return labels.length ? labels : ["content_section"];
};

const isUsefulHeading = (heading = "") => {
  const text = compact(heading);
  const key = normalizeKey(text);
  if (text.length < 4 || text.length > 90) return false;
  if (/sample text|click to select|website templates|created with|nicepage/i.test(text)) return false;
  if (/^home$|^contact$|^about$|^learn more$/i.test(text)) return false;
  if (key.split(" ").length > 10) return false;
  return true;
};

const buildVisualSignals = (page, keywordSignals, blockPatterns) => {
  const source = normalizeKey(`${page.category} ${keywordSignals.join(" ")} ${blockPatterns.join(" ")}`);
  const signals = [];
  if (/restaurant|food|bakery|pizza|coffee|recipe|menu/.test(source)) signals.push("appétit visuel, menu lisible, réservation/commande rapide");
  if (/interior|architecture|building|real estate|home|property/.test(source)) signals.push("grandes images, preuve par projet, spatialité et détails premium");
  if (/medicine|health|science|doctor|medical/.test(source)) signals.push("confiance, clarté, équipe, rassurance et contact visible");
  if (/education|course|school|training/.test(source)) signals.push("parcours pédagogique, progression, modules et preuve d'accompagnement");
  if (/technology|saas|software|ai|app/.test(source)) signals.push("hero produit, bénéfices rapides, cards fonctionnelles et preuve chiffrée sobre");
  if (/sale|shop|fashion|beauty|ecommerce/.test(source)) signals.push("offre forte, produit en avant, urgence douce et CTA d'achat");
  if (/wedding|event/.test(source)) signals.push("émotion, galerie, déroulé simple, confiance et réservation");
  if (/sports|coach|fitness/.test(source)) signals.push("énergie, transformation, programme, CTA rendez-vous");
  if (/pets|animals/.test(source)) signals.push("proximité, confiance, soin, preuves rassurantes");
  if (/cars|transportation|car|vehicle/.test(source)) signals.push("disponibilité, choix rapide, trajet, réservation mobile-first");
  if (/business|law|consulting/.test(source)) signals.push("autorité, méthode, preuve, diagnostic et prise de contact qualifiée");
  if (/art|design|portfolio|gallery/.test(source)) signals.push("portfolio visuel, signature créative, contraste et rythme éditorial");
  return unique(signals).slice(0, 6);
};

const buildTemplateSignal = (template, page) => {
  const blockLabels = new Map();
  const headingSignals = [];

  for (const block of template.blocks || []) {
    for (const label of classifyBlock(block)) increment(blockLabels, label);
    for (const heading of block.headings || []) {
      if (isUsefulHeading(heading)) headingSignals.push(compact(heading));
    }
  }

  return {
    title: compact(template.title).slice(0, 90),
    sourceCategory: compact(page.category),
    keywords: unique((template.keywords || []).map(compact)).slice(0, 14),
    blockPatterns: topKeys(blockLabels, 10),
    headingSignals: unique(headingSignals).slice(0, 8),
  };
};

const data = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));

const inspirations = data.map((page) => {
  const keywordCounts = new Map();
  const headingCounts = new Map();
  const blockTypeCounts = new Map();
  const classCounts = new Map();

  for (const template of page.templates || []) {
    for (const keyword of template.keywords || []) increment(keywordCounts, keyword);
    for (const block of template.blocks || []) {
      for (const heading of block.headings || []) {
        if (isUsefulHeading(heading)) increment(headingCounts, heading);
      }
      for (const label of classifyBlock(block)) increment(blockTypeCounts, label);
      const classKey = normalizeKey(block.class || "");
      if (/align center/.test(classKey)) increment(classCounts, "centered composition");
      if (/clearfix/.test(classKey)) increment(classCounts, "stacked content sections");
      if (/grey|dark|black/.test(classKey)) increment(classCounts, "contrast section");
    }
  }

  const keywordSignals = topKeys(keywordCounts, 36);
  const blockPatterns = topKeys(blockTypeCounts, 12);
  const headingSignals = topKeys(headingCounts, 18);
  const layoutSignals = topKeys(classCounts, 8);
  const titleSignals = unique((page.templates || []).map((template) => compact(template.title))).slice(0, 18);
  const visualSignals = buildVisualSignals(page, keywordSignals, blockPatterns);
  const templateSignals = (page.templates || [])
    .map((template) => buildTemplateSignal(template, page))
    .filter((template) => template.title || template.keywords.length || template.blockPatterns.length);

  return {
    sourceCategory: compact(page.category),
    sourceUrl: page.url,
    templateCount: (page.templates || []).length,
    keywordSignals,
    blockPatterns,
    headingSignals,
    titleSignals,
    layoutSignals,
    visualSignals,
    templateSignals,
  };
});

const file = `// Auto-generated by scripts/build-nicepage-inspiration-index.mjs.\n// Distilled inspiration signals only: do not copy source templates, texts, or images into generated client sites.\n\nexport type NicepageTemplateInspiration = {\n  sourceCategory: string;\n  sourceUrl: string;\n  templateCount: number;\n  keywordSignals: readonly string[];\n  blockPatterns: readonly string[];\n  headingSignals: readonly string[];\n  titleSignals: readonly string[];\n  layoutSignals: readonly string[];\n  visualSignals: readonly string[];\n  templateSignals: readonly {\n    title: string;\n    sourceCategory: string;\n    keywords: readonly string[];\n    blockPatterns: readonly string[];\n    headingSignals: readonly string[];\n  }[];\n};\n\nexport const NICEPAGE_TEMPLATE_INSPIRATIONS = ${JSON.stringify(inspirations, null, 2)} as const satisfies readonly NicepageTemplateInspiration[];\n`;

fs.writeFileSync(TARGET_PATH, file, "utf8");
console.log(`Wrote ${TARGET_PATH} with ${inspirations.length} inspiration groups.`);

