import fs from "node:fs";
import path from "node:path";

const SOURCE_ROOT = process.env.PIXELRISES_AI_BUILDER_SOURCE || path.resolve("..", "generateur ia");
const TARGET_PATH = "supabase/functions/generate-site/ai-builder-inspiration.ts";

const decode = (value = "") =>
  String(value)
    .replace(/^\uFEFF/, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00e2\u20ac\u201d/g, "-")
    .replace(/\u00e2\u20ac\u201c/g, "-")
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u0153|\u00e2\u20ac/g, '"')
    .replace(/\u00c3\u00a9/g, "e")
    .replace(/\u00c3\u00a8/g, "e")
    .replace(/\u00c3\u0020/g, "a");

const compact = (value = "") => decode(value).replace(/\s+/g, " ").trim();
const normalizeKey = (value = "") =>
  compact(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const unique = (items) => Array.from(new Set(items.filter(Boolean)));
const limit = (items, max) => unique(items).slice(0, max);

const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.name.toLowerCase() === "meta.json") files.push(fullPath);
  }
  return files;
};

const RULES = [
  { label: "prompt_composer", regex: /prompt|input|composer|chat box|chat input|search|think|audio|canvas/ },
  { label: "conversation_builder", regex: /chat|assistant|conversation|support|help|docs/ },
  { label: "preview_canvas", regex: /canvas|preview|builder|ship|code|codex|claude|v0/ },
  { label: "agent_plan", regex: /agent plan|subtask|task plan|mcp|toolset|managed agent|agent/ },
  { label: "workflow_pipeline", regex: /pipeline|handoff|workflow|automation|bulk|deal|lead|prospect|calendly|hubspot|apollo|slack/ },
  { label: "tool_command_surface", regex: /tool|command|terminal|execute|run|api|openapi|sdk|developer/ },
  { label: "knowledge_assistant", regex: /docs|documentation|knowledge|faq|search|query|support|guide/ },
  { label: "data_dashboard", regex: /dashboard|graph|analytics|monitor|security|auditor|scraper|data|metrics|table/ },
  { label: "form_flow", regex: /form|fill|booking|calendar|contact|lead|submit|verify/ },
  { label: "creative_generation", regex: /image gen|ai gen|generate|visual|component|ui components|react|framer|motion/ },
  { label: "marketplace_registry", regex: /registry|marketplace|browse|community|components|templates|agents/ },
  { label: "crm_sales", regex: /sales|deal|hubspot|prospect|lead|pipeline|booking/ },
  { label: "security_trust", regex: /security|audit|verify|oauth|jwt|api key|rate limit/ },
];

const UX_RULES = [
  { label: "guided_prompt_refinement", regex: /prompt|think|assistant|docs|support|guide/ },
  { label: "non_destructive_options", regex: /component|community|registry|browse|copy|switch|tool/ },
  { label: "visible_progress_steps", regex: /plan|task|pipeline|workflow|subtask|handoff/ },
  { label: "tool_transparency", regex: /mcp|tool|agent|api|sdk|terminal|execute/ },
  { label: "fast_preview_iteration", regex: /builder|preview|code|ship|v0|codex|claude/ },
  { label: "human_handoff", regex: /sales|slack|calendly|hubspot|support|review/ },
  { label: "trust_and_error_surface", regex: /security|verify|audit|error|deduplicate|accuracy|rate/ },
];

const LAYOUT_RULES = [
  { label: "split_chat_preview", regex: /chat|preview|canvas|builder|codex|v0/ },
  { label: "command_dock_bottom", regex: /prompt|input|command|terminal|audio|search/ },
  { label: "agent_timeline", regex: /agent plan|subtask|workflow|pipeline|handoff/ },
  { label: "bento_tool_cards", regex: /component|registry|community|tool|sdk|mcp/ },
  { label: "dashboard_panels", regex: /dashboard|analytics|graph|security|monitor|scraper/ },
  { label: "docs_search_layout", regex: /docs|documentation|knowledge|support|assistant/ },
  { label: "form_to_result_flow", regex: /form|booking|calendly|lead|contact|fill/ },
  { label: "marketplace_grid", regex: /browse|registry|community|components|agents|templates/ },
];

const VISUAL_RULES = [
  { label: "dark_glass_command_ui", regex: /glass|dark|command|terminal|prompt|chat/ },
  { label: "motion_first_micro_interactions", regex: /animated|framer|motion|smooth|interactions/ },
  { label: "clean_saas_panels", regex: /saas|developer|sdk|api|ui components|ship/ },
  { label: "premium_tool_cards", regex: /components|community|registry|tool|agent/ },
  { label: "structured_data_visuals", regex: /graph|dashboard|analytics|security|scraper|monitor/ },
  { label: "human_assistant_surface", regex: /support|lead|sales|calendly|hubspot|slack|docs/ },
];

const inferLabels = (rules, haystack) => rules.filter((rule) => rule.regex.test(haystack)).map((rule) => rule.label);

const keywordSignals = (meta, relPath) => {
  const key = normalizeKey(`${meta.title || ""} ${meta.description || ""} ${meta.type || ""} ${relPath}`);
  const stop = new Set(["21st", "dev", "community", "components", "component", "default", "open", "source", "with", "your", "built", "using", "for", "the", "and"]);
  return limit(key.split(" ").filter((token) => token.length >= 3 && !stop.has(token)), 20);
};

const readMeta = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
};

const metaFiles = walk(SOURCE_ROOT);

const inspirations = metaFiles.map((filePath) => {
  const meta = readMeta(filePath);
  const relPath = path.relative(SOURCE_ROOT, filePath).replace(/\\/g, "/");
  const haystack = normalizeKey(`${meta.title || ""} ${meta.description || ""} ${meta.type || ""} ${relPath}`);
  return {
    sourceFamily: compact(meta.source || "local-ai-builder-pack"),
    sourceType: compact(meta.type || "component_or_agent_or_workflow"),
    keywordSignals: keywordSignals(meta, relPath),
    patternSignals: limit(inferLabels(RULES, haystack), 8),
    uxSignals: limit(inferLabels(UX_RULES, haystack), 8),
    layoutSignals: limit(inferLabels(LAYOUT_RULES, haystack), 8),
    visualSignals: limit(inferLabels(VISUAL_RULES, haystack), 8),
    useCaseSignals: limit([
      /lead|sales|deal|prospect|hubspot|apollo/.test(haystack) && "lead_generation_and_sales",
      /support|docs|knowledge|faq/.test(haystack) && "support_or_documentation",
      /api|sdk|developer|openapi/.test(haystack) && "developer_or_saas_product",
      /security|audit/.test(haystack) && "trust_security_or_audit",
      /scraper|data|graph|dashboard|analytics/.test(haystack) && "data_or_dashboard_experience",
      /prompt|chat|assistant|agent/.test(haystack) && "ai_assisted_builder_experience",
      /form|booking|calendly|calendar/.test(haystack) && "booking_or_contact_flow",
      /image|visual|ui|component|motion/.test(haystack) && "visual_component_system",
    ], 8),
    safeUse: "Internal distilled inspiration only. Do not copy title, text, screenshot, image, URL, brand name or implementation.",
  };
});

const curatedPatterns = [
  {
    family: "conversation_to_preview_builder",
    principle: "A simple input drives a visible result canvas, then the user iterates without losing the brief.",
    bestFor: ["ai_builder", "service_business", "creative_business", "local_business"],
    layoutSignals: ["split_chat_preview", "preview_only_canvas", "sticky_prompt_dock", "result_actions_after_preview"],
    variationSignals: ["short guided questions", "preview-first feedback", "non-destructive suggestions", "retry keeps existing result"],
  },
  {
    family: "structured_component_generation",
    principle: "Every section has a clear role, reusable component anatomy and a strong visual hierarchy.",
    bestFor: ["saas-tech", "professional-services", "education-training", "ecommerce"],
    layoutSignals: ["section inventory", "component families", "clean cards", "clear empty states"],
    variationSignals: ["different hero architecture", "different proof module", "different CTA rhythm", "different card density"],
  },
  {
    family: "premium_pattern_library",
    principle: "Use modern product patterns as inspiration for rhythm and interaction, never as copied content.",
    bestFor: ["premium-business", "creative-services", "personal-brand", "agency"],
    layoutSignals: ["bento feature story", "agent timeline", "command dock", "gallery proof rail"],
    variationSignals: ["asymmetric cards", "editorial media", "soft glass panels", "motion-led reveals"],
  },
  {
    family: "screen_clarity_pattern",
    principle: "Make each screen readable in seconds with strong spacing, simple navigation and obvious next actions.",
    bestFor: ["mobile-first", "booking", "dashboard", "consumer_service"],
    layoutSignals: ["mobile first stack", "single dominant CTA", "clean list/detail flow", "short labels"],
    variationSignals: ["compact mobile cards", "large touch targets", "clear form states", "no crowded grids"],
  },
  {
    family: "conversion_command_center",
    principle: "The page behaves like a business system: proof, objections, action and contact are never buried.",
    bestFor: ["local-services", "car-rental", "coach", "restaurant", "real-estate"],
    layoutSignals: ["hero action strip", "proof stack", "offer comparison", "contact module"],
    variationSignals: ["proof first", "process first", "offer first", "local trust first"],
  },
  {
    family: "agentic_workflow_story",
    principle: "When the business is technical or automated, show steps, tools and outcomes in a visual workflow.",
    bestFor: ["saas-tech", "automation", "consulting", "api", "data"],
    layoutSignals: ["workflow timeline", "tool cards", "status chips", "before after panels"],
    variationSignals: ["linear process", "radial system map", "dashboard blocks", "technical explainer"],
  },
];

const file = `// Auto-generated by scripts/build-ai-builder-inspiration-index.mjs.\n// Distilled AI builder and product UX signals only. Do not copy source text, screenshots, names or images into generated client sites.\n\nexport type AiBuilderInspiration = {\n  sourceFamily: string;\n  sourceType: string;\n  keywordSignals: readonly string[];\n  patternSignals: readonly string[];\n  uxSignals: readonly string[];\n  layoutSignals: readonly string[];\n  visualSignals: readonly string[];\n  useCaseSignals: readonly string[];\n  safeUse: string;\n};\n\nexport type AiBuilderCuratedPattern = {\n  family: string;\n  principle: string;\n  bestFor: readonly string[];\n  layoutSignals: readonly string[];\n  variationSignals: readonly string[];\n};\n\nexport const AI_BUILDER_INSPIRATIONS = ${JSON.stringify(inspirations, null, 2)} as const satisfies readonly AiBuilderInspiration[];\n\nexport const AI_BUILDER_CURATED_PATTERNS = ${JSON.stringify(curatedPatterns, null, 2)} as const satisfies readonly AiBuilderCuratedPattern[];\n`;

fs.writeFileSync(TARGET_PATH, file, "utf8");
console.log(`Wrote ${TARGET_PATH} with ${inspirations.length} distilled AI builder inspirations.`);
