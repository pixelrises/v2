import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { filterActionableProductLabProposals } from "./product-lab-governance.mjs";

export const PRODUCT_LAB_NAME = "Pixelrises Continuous Product Lab";
export const DEFAULT_MAX_PATCHES = 2;
export const PRODUCT_LAB_MIN_REVIEW_ITEMS = 2;
export const PRODUCT_LAB_DEFAULT_REVIEW_ITEMS = 2;
export const PRODUCT_LAB_MAX_REVIEW_ITEMS = 5;
export const PRODUCT_LAB_SCHEDULE = {
  timezone: "Europe/Paris",
  targetLocalHour: 0,
  summerUtcCron: "0 22 * * *",
  winterUtcCron: "0 23 * * *",
  githubScheduleNote:
    "GitHub Actions schedules are evaluated in UTC and can be delayed by the platform queue.",
};

const readIntegerEnv = (name, fallback, { min = 1, max = 20 } = {}) => {
  const raw = process.env[name];
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(max, value));
};

export const getProductLabReviewLimits = () => {
  const max = readIntegerEnv("PRODUCT_LAB_MAX_REVIEW_ITEMS", PRODUCT_LAB_DEFAULT_REVIEW_ITEMS, {
    min: 1,
    max: PRODUCT_LAB_MAX_REVIEW_ITEMS,
  });
  const min = readIntegerEnv("PRODUCT_LAB_MIN_REVIEW_ITEMS", PRODUCT_LAB_MIN_REVIEW_ITEMS, {
    min: 1,
    max,
  });

  return { min, max };
};

const getParisParts = (date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: PRODUCT_LAB_SCHEDULE.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

export const getProductLabScheduleInfo = (date = new Date()) => {
  const paris = getParisParts(date);
  const parisAsUtc = Date.UTC(paris.year, paris.month - 1, paris.day, paris.hour, paris.minute);
  const offsetHours = Math.round((parisAsUtc - date.getTime()) / 60 / 60 / 1000);
  const activeMidnightUtcHour = (24 - offsetHours) % 24;

  return {
    timezone: PRODUCT_LAB_SCHEDULE.timezone,
    targetLocalTime: "00:00 Europe/Paris",
    configuredCronsUtc: [PRODUCT_LAB_SCHEDULE.summerUtcCron, PRODUCT_LAB_SCHEDULE.winterUtcCron],
    activeMidnightUtcHour,
    activeMidnightUtcLabel: `${String(activeMidnightUtcHour).padStart(2, "0")}:00 UTC`,
    currentParisHour: paris.hour,
    currentUtcHour: date.getUTCHours(),
    offsetHours,
    note: PRODUCT_LAB_SCHEDULE.githubScheduleNote,
  };
};

export const productVision = {
  promise: "Pixelrises transforme une idee en projet digital concret.",
  principles: [
    "premium noir/or",
    "business-first",
    "conversion-first",
    "simple pour debutants",
    "puissant pour utilisateurs avances",
    "site + agent IA + jeu + integrations + analytics",
  ],
  protectedOutcome:
    "Chaque patch doit aider l'utilisateur a creer, ameliorer, publier, connecter ou analyser un projet V2.",
};

export const benchmarkModules = [
  {
    module: "Dashboard",
    inspiration: "Shopify Admin / Linear / Base44",
    target: "Un cockpit decisionnel qui montre l'etat du business, la prochaine action et les signaux reels.",
  },
  {
    module: "Site Builder",
    inspiration: "Lovable / v0 / Vercel",
    target: "Un flow idee -> plan -> preview -> amelioration fluide, premium et oriente conversion.",
  },
  {
    module: "Agent Builder",
    inspiration: "Delos / Base44",
    target: "Un studio d'agents simple, puissant, avec permissions claires et actions validables.",
  },
  {
    module: "AI Spaces",
    inspiration: "Delos / ChatGPT-style workspaces / Base44",
    target: "Des assistants specialises par profil qui accompagnent sans remplacer les Builders.",
  },
  {
    module: "Game Builder",
    inspiration: "Roblox Creator Hub / Minecraft Creator / UEFN",
    target: "Un generateur beta de blueprints, snippets, assets et checklists sans promesse de publication automatique.",
  },
  {
    module: "Multi-IA / Systeme",
    inspiration: "Moteur IA Pixelrises / 21st.dev",
    target: "Un moteur modulaire, normalise, teste, avec secours fiable et couts controles.",
  },
  {
    module: "Integrations / Templates",
    inspiration: "21st.dev / Mobbin / Vercel",
    target: "Des registries clairs, honnetes, reutilisables et adaptes aux projets business.",
  },
];

export const scoreKeys = [
  "Product Quality Score",
  "UX Score",
  "Conversion Score",
  "Design Score",
  "AI System Score",
  "Site Builder Score",
  "Agent Builder Score",
  "AI Spaces Score",
  "Game Builder Score",
  "Integration Score",
  "Analytics Score",
  "Code Health Score",
];

export const expertAgents = [
  "Product Lead",
  "SaaS Expert",
  "Conversion Expert",
  "UX/UI Expert",
  "Site Builder Expert",
  "Agent Builder Expert",
  "AI Spaces Expert",
  "Game Builder Expert",
  "Multi-IA Expert",
  "Integration Expert",
  "Analytics Expert",
  "Code Expert",
  "Security Expert",
];

export const inspirationSources = [
  "Lovable",
  "v0 / Vercel",
  "Mobbin",
  "21st.dev",
  "Base44",
  "Bloom",
  "Delos",
  "Framer",
  "Linear",
  "Shopify Admin",
];

export const trustedResearchSources = [
  {
    id: "vercel-ai-gateway",
    name: "Moteur IA Pixelrises",
    url: "https://vercel.com/docs/ai-gateway",
    authority: "official",
    modules: ["Multi-IA / Systeme", "Site Builder", "Agent Builder", "AI Spaces", "Game Builder"],
    principles: [
      "unifier les moteurs IA derriere une couche serveur",
      "suivre usage, budgets et secours",
      "garder les cles IA cote serveur uniquement",
    ],
  },
  {
    id: "vercel-ai-gateway-models",
    name: "Modes IA Pixelrises",
    url: "https://vercel.com/docs/ai-gateway/models-and-providers",
    authority: "official",
    modules: ["Multi-IA / Systeme", "Code Health"],
    principles: [
      "router les modeles selon cout, qualite et disponibilite",
      "prevoir un secours fiable pour la disponibilite",
    ],
  },
  {
    id: "supabase-rls",
    name: "Supabase Row Level Security",
    url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
    authority: "official",
    modules: ["Dashboard", "Analytics", "Multi-IA / Systeme", "Code Health"],
    principles: [
      "activer RLS sur les tables exposees",
      "limiter chaque role aux permissions utiles",
      "proteger les donnees meme avec une cle publishable",
    ],
  },
  {
    id: "github-actions-secrets",
    name: "GitHub Actions Secrets",
    url: "https://docs.github.com/en/actions/concepts/security/secrets",
    authority: "official",
    modules: ["Code Health", "Product Lab"],
    principles: [
      "injecter les secrets uniquement dans les jobs qui en ont besoin",
      "accorder les permissions minimales",
      "ne jamais ecrire les secrets dans les rapports",
    ],
  },
  {
    id: "nng-usability-heuristics",
    name: "Nielsen Norman Group Usability Heuristics",
    url: "https://media.nngroup.com/media/articles/attachments/Heuristic_Summary1_A4_compressed.pdf",
    authority: "research",
    modules: ["Dashboard", "Site Builder", "Agent Builder", "AI Spaces", "Game Builder", "Integrations / Templates"],
    principles: [
      "rendre le statut du systeme visible",
      "parler le langage utilisateur",
      "aider l'utilisateur a diagnostiquer et corriger les erreurs",
    ],
  },
  {
    id: "linear-method",
    name: "Linear Method",
    url: "https://linear.app/method",
    authority: "product-practice",
    modules: ["Product Vision", "Dashboard", "Code Health"],
    principles: [
      "prioriser direction, objectifs utiles et blockers",
      "reduire le scope pour garder le momentum",
      "ameliorer par cycles lisibles",
    ],
  },
  {
    id: "baymard-ecommerce-ux",
    name: "Baymard Ecommerce UX Research",
    url: "https://baymard.com/",
    authority: "research",
    modules: ["Site Builder", "Conversion", "Dashboard"],
    principles: [
      "baser les decisions e-commerce sur des observations UX",
      "reduire la friction des parcours business critiques",
      "transformer les audits UX en recommandations actionnables",
    ],
  },
  {
    id: "vercel-design-guidelines",
    name: "Vercel Web Interface Guidelines",
    url: "https://vercel.com/design/guidelines",
    authority: "product-practice",
    modules: ["Dashboard", "Site Builder", "Integrations / Templates"],
    principles: [
      "traiter les guidelines de marque comme inspiration, pas comme regle universelle",
      "privilegier performance, clarte et composants sobres",
    ],
  },
];

const weeklyThemes = {
  monday: {
    id: "dashboard",
    label: "UX / Dashboard / Onboarding",
    tomorrow: "Site Builder / Conversion / SEO",
  },
  tuesday: {
    id: "site-builder",
    label: "Site Builder / Conversion / SEO",
    tomorrow: "Agent Builder / Agents IA",
  },
  wednesday: {
    id: "agent-builder",
    label: "Agent Builder / Agents IA",
    tomorrow: "Game Builder",
  },
  thursday: {
    id: "game-builder",
    label: "Game Builder",
    tomorrow: "Multi-IA / Moteur IA / Supabase",
  },
  friday: {
    id: "multi-ai",
    label: "Multi-IA / Moteur IA / Supabase",
    tomorrow: "Templates / Integrations / Registries",
  },
  saturday: {
    id: "templates-integrations",
    label: "Templates / Integrations / Registries",
    tomorrow: "Audit Global / Refactor / Tests / Roadmap",
  },
  sunday: {
    id: "audit-roadmap",
    label: "Audit Global / Refactor / Tests / Roadmap",
    tomorrow: "UX / Dashboard / Onboarding",
  },
};

const fileTargets = {
  dashboard: ["src/pages/Dashboard.tsx", "src/pages/Create.tsx", "src/pages/AISpaces.tsx", "src/components/v2/V2PageShell.tsx"],
  "site-builder": ["src/pages/SiteBuilder.tsx", "src/modules/creation-engine/engine.ts", "supabase/functions/ai-orchestrator/index.ts"],
  "agent-builder": ["src/pages/AgentBuilder.tsx", "src/pages/Agents.tsx", "src/modules/registries/index.ts"],
  "game-builder": ["src/pages/GameBuilder.tsx", "src/pages/Games.tsx", "src/modules/registries/index.ts"],
  "multi-ai": ["src/modules/ai", "supabase/functions/ai-orchestrator/index.ts", "src/modules/storage/project-storage-adapter.ts"],
  "templates-integrations": ["src/pages/Templates.tsx", "src/pages/Integrations.tsx", "src/modules/registries/index.ts"],
  "audit-roadmap": ["src", "scripts", "supabase/functions", "package.json"],
};

const requiredRuntimeFiles = [
  "src/pages/Dashboard.tsx",
  "src/pages/Create.tsx",
  "src/pages/SiteBuilder.tsx",
  "src/pages/AgentBuilder.tsx",
  "src/pages/GameBuilder.tsx",
  "src/pages/Integrations.tsx",
  "src/pages/Templates.tsx",
  "src/pages/Analytics.tsx",
  "src/pages/Settings.tsx",
  "src/pages/AISpaces.tsx",
  "src/modules/ai-spaces/index.ts",
  "src/modules/ai/orchestrator/AIOrchestrator.ts",
  "src/modules/ai/backend-orchestrator.ts",
  "src/modules/storage/project-storage-adapter.ts",
  "supabase/functions/ai-orchestrator/index.ts",
];

const safeSignals = [
  "mojibake",
  "orthographe",
  "microcopy",
  "label",
  "empty state",
  "loading state",
  "error state",
  "responsive",
  "import inutil",
  "test unitaire",
  "prompt systeme",
  "registry",
  "documentation",
  "petite ui",
];

const dangerousSignals = [
  "auth",
  "paiement",
  "stripe",
  "credit",
  "credits",
  "policy",
  "policies",
  "rls",
  "migration destructive",
  "drop table",
  "delete from",
  "provider ia principal",
  "production",
  "deploy",
  "api externe sensible",
  "supprimer route",
  "suppression massive",
  "refonte totale",
  "roblox publish",
  "minecraft publish",
  "fortnite publish",
  "business model",
];

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value) => normalize(value).replace(/\s+/g, "-") || "item";

export const getProductLabReviewItemId = (finding, theme) =>
  [
    theme?.date ?? theme?.runDate ?? theme?.sourceRun?.date,
    theme?.id ?? "global",
    theme?.runInstance ?? theme?.runId ?? theme?.sourceRun?.runId,
    finding?.module ?? "module",
    finding?.title ?? finding?.description ?? "improvement",
  ]
    .filter(Boolean)
    .map(slugify)
    .join("-");

export const readProductLabAdminDecisions = (root) => {
  const decisionPath = path.join(root, "product-lab", "state", "admin-decisions.json");
  if (!fs.existsSync(decisionPath)) return {};

  try {
    const parsed = JSON.parse(fs.readFileSync(decisionPath, "utf8"));
    const decisions = Array.isArray(parsed?.decisions) ? parsed.decisions : Object.values(parsed?.decisions ?? {});

    return decisions.reduce((accumulator, decision) => {
      if (!decision?.itemId) return accumulator;
      accumulator[decision.itemId] = decision;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
};

const themeModuleById = {
  dashboard: "Dashboard",
  "site-builder": "Site Builder",
  "agent-builder": "Agent Builder",
  "ai-spaces": "AI Spaces",
  "game-builder": "Game Builder",
  "multi-ai": "Multi-IA / Systeme",
  "templates-integrations": "Integrations / Templates",
  "audit-roadmap": "Code Health",
};

const dailyReviewFocusByThemeId = {
  dashboard: [
    {
      id: "activation-path",
      short: "activation plus claire",
      description: "mettre en avant la prochaine action qui transforme une idee en projet concret",
    },
    {
      id: "decision-score",
      short: "score decisionnel",
      description: "rendre les scores plus utiles pour prioriser site, agent, jeu et integrations",
    },
    {
      id: "empty-states",
      short: "empty states utiles",
      description: "remplacer les zones vides par des actions simples et business-first",
    },
    {
      id: "ai-spaces-onboarding",
      short: "AI Spaces guidés",
      description: "clarifier le choix entre Builders et AI Spaces dans les 30 premières secondes",
    },
  ],
  "site-builder": [
    {
      id: "anti-generic-layout",
      short: "anti-site generique",
      description: "forcer une variation visible par niche, objectif, niveau de gamme et CTA",
    },
    {
      id: "conversion-preview",
      short: "preview conversion",
      description: "rapprocher le flow prompt -> preview -> amelioration des standards Lovable/v0",
    },
    {
      id: "seo-business",
      short: "SEO business local",
      description: "lier SEO, preuves, objections et CTA a la vraie intention client",
    },
  ],
  "agent-builder": [
    {
      id: "safe-permissions",
      short: "permissions visibles",
      description: "rendre chaque action agent validable avant toute modification sensible",
    },
    {
      id: "agent-roles",
      short: "roles plus experts",
      description: "clarifier les agents officiels comme une equipe Pixelrises business-first",
    },
    {
      id: "test-chat",
      short: "test agent utile",
      description: "ameliorer le chemin configuration -> test -> sauvegarde sans complexite inutile",
    },
  ],
  "game-builder": [
    {
      id: "beta-honest",
      short: "beta plus honnete",
      description: "rester clair sur blueprint, scripts, assets et checklist sans promettre de publication auto",
    },
    {
      id: "platform-specific",
      short: "plateformes plus nettes",
      description: "separer Roblox, Minecraft, UEFN et Web Game avec des sorties mieux adaptees",
    },
    {
      id: "gameplay-loop",
      short: "gameplay loop",
      description: "renforcer objectifs joueur, progression, economie et moments fun exploitables",
    },
  ],
  "multi-ai": [
    {
      id: "role-routing",
      short: "routing par expertise",
      description: "confier strategie, design, code, normalisation et quality gate au meilleur role IA",
    },
    {
      id: "fallback-trace",
      short: "fallback lisible",
      description: "rendre les modes de secours lisibles sans exposer de secret",
    },
    {
      id: "cost-quality",
      short: "qualite cout",
      description: "garder un bon rapport qualite/prix sans degrader la sortie finale",
    },
    {
      id: "ai-spaces-routing",
      short: "routing AI Spaces",
      description: "router chaque espace IA vers le bon modele sans exposer les details internes aux utilisateurs",
    },
  ],
  "templates-integrations": [
    {
      id: "registry-actions",
      short: "registries actionnables",
      description: "transformer templates et integrations en prochaines actions utiles",
    },
    {
      id: "honest-status",
      short: "statuts honnetes",
      description: "separer clairement connecte, disponible, beta, mock et a configurer",
    },
    {
      id: "business-connectors",
      short: "connecteurs business",
      description: "prioriser les integrations qui aident a lancer, mesurer ou vendre",
    },
  ],
  "audit-roadmap": [
    {
      id: "ci-blockers",
      short: "CI sans surprise",
      description: "bloquer les PR Product Lab si lint, tests, build ou sync admin echouent",
    },
    {
      id: "technical-debt",
      short: "dette technique utile",
      description: "cibler les refactors legers qui reduisent bugs et duplication",
    },
    {
      id: "roadmap-week",
      short: "roadmap semaine",
      description: "classer les prochains chantiers par impact, risque et validation humaine",
    },
  ],
  global: [
    {
      id: "pixelrises-vision",
      short: "vision Pixelrises",
      description: "renforcer la promesse idee -> projet digital concret dans chaque module V2",
    },
    {
      id: "premium-ux",
      short: "UX premium",
      description: "rendre l'experience plus claire, plus rapide, plus business et plus stable",
    },
    {
      id: "safe-growth",
      short: "croissance sure",
      description: "ameliorer fort sans toucher auth, paiement, secrets, prod ou migrations sensibles",
    },
  ],
};

const hashForDailyFocus = (value) =>
  String(value ?? "")
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);

const pickDailyReviewFocus = (theme, date, index) => {
  const focusPool = dailyReviewFocusByThemeId[theme?.id] ?? dailyReviewFocusByThemeId.global;
  const offset = hashForDailyFocus(`${date ?? ""}:${theme?.id ?? "global"}`);
  return focusPool[(offset + index) % focusPool.length];
};

const applyDailyReviewFocus = (finding, result, index) => {
  const runFocus = pickDailyReviewFocus(result.theme, result.date, index);
  const title = String(finding.title ?? "Amelioration Product Lab");
  const focusedTitle = title.includes(runFocus.short) ? title : `${title} - ${runFocus.short}`;
  const focusSentence = `Focus du run: ${runFocus.description}.`;

  return {
    ...finding,
    title: focusedTitle,
    originalTitle: title,
    runFocus,
    description: `${String(finding.description ?? title).trim()} ${focusSentence}`,
    beforeState:
      finding.beforeState ||
      `La proposition existe deja, mais elle doit etre reliee au focus quotidien "${runFocus.short}" pour eviter les cartes repetitives.`,
    afterState:
      finding.afterState ||
      `La prochaine iteration cible "${runFocus.short}" avec une action concrete, mesurable et limitee au scope V2.`,
  };
};

export const findApprovedAdminDecision = (adminDecisions, finding, theme) => {
  const exactId = getProductLabReviewItemId(finding, theme);
  const exactDecision = adminDecisions[exactId];
  if (exactDecision?.status === "approved" && exactDecision?.automationAction === "authorize_next_run") {
    return exactDecision;
  }

  const findingTitle = normalize(finding?.title);
  const findingModule = normalize(finding?.module);

  return Object.values(adminDecisions).find((decision) => {
    if (decision?.status !== "approved" || decision?.automationAction !== "authorize_next_run") return false;
    if (normalize(decision?.title) !== findingTitle || normalize(decision?.module) !== findingModule) return false;
    return true;
  });
};

const isApprovedAdminDecision = (decision) =>
  decision?.status === "approved" && decision?.automationAction === "authorize_next_run";

const isProcessedAdminDecision = (decision) =>
  decision?.applicationStatus === "pr_ready" ||
  Boolean(decision?.processedAt) ||
  Boolean(decision?.processedRun?.prUrl) ||
  decision?.processedRun?.autoMergeStatus === "merged";

const getDecisionOriginalTitle = (decision) =>
  decision?.originalTitle ||
  decision?.reviewItem?.originalTitle ||
  decision?.reviewItem?.title ||
  decision?.title ||
  "";

const getProductLabTitleVariants = (title) => {
  const normalizedTitle = normalize(title);
  if (!normalizedTitle) return [];

  const beforeFocusSuffix = String(title ?? "").split(" - ")[0];
  const normalizedBaseTitle = normalize(beforeFocusSuffix);
  return [...new Set([normalizedTitle, normalizedBaseTitle].filter(Boolean))];
};

const getProcessedDecisionKeys = (adminDecisions) => {
  const itemIds = new Set();
  const titleKeys = new Set();

  for (const decision of Object.values(adminDecisions ?? {})) {
    if (!isProcessedAdminDecision(decision)) continue;
    if (decision?.itemId) itemIds.add(decision.itemId);
    const module = normalize(decision?.module || decision?.reviewItem?.module);
    for (const title of getProductLabTitleVariants(getDecisionOriginalTitle(decision))) {
      if (module && title) titleKeys.add(`${module}:${title}`);
    }
  }

  return { itemIds, titleKeys };
};

const buildApprovedFindingFromDecision = (decision) => {
  const reviewItem = decision?.reviewItem && typeof decision.reviewItem === "object" ? decision.reviewItem : {};
  const title = decision?.title || reviewItem.title || decision?.itemId || "Amelioration validee";
  const module = decision?.module || reviewItem.module || "Product Lab";
  const description =
    decision?.correctionRequest ||
    decision?.note ||
    decision?.description ||
    reviewItem.description ||
    reviewItem.simpleSummary ||
    `Appliquer l'amelioration validee depuis l'admin: ${title}.`;

  return {
    title,
    module,
    impact: decision?.impact || reviewItem.impact || "Moyen",
    risk: decision?.risk || reviewItem.risk || "Faible",
    difficulty: decision?.difficulty || reviewItem.difficulty || "Faible",
    priority: decision?.priority || reviewItem.priority || "Important",
    status: "Validee admin",
    inspiration: decision?.inspiration || reviewItem.inspiration || "Pixelrises Product Lab",
    description,
    decision: decision?.decisionKind || reviewItem.decision || "human_validation",
    scoreImpact: Number.isFinite(Number(decision?.scoreImpact || reviewItem.scoreImpact))
      ? Number(decision?.scoreImpact || reviewItem.scoreImpact)
      : 12,
    approvedItemId: decision?.itemId,
    approvedDecision: decision,
    beforeState: decision?.beforeState || reviewItem.beforeState || "",
    afterState: decision?.afterState || reviewItem.afterState || "",
    concernedFiles: Array.isArray(decision?.concernedFiles)
      ? decision.concernedFiles
      : Array.isArray(reviewItem.concernedFiles)
        ? reviewItem.concernedFiles
        : [],
  };
};

export const mergeApprovedAdminFindings = (findings, adminDecisions, theme) => {
  const approvedFindings = [];
  const seenKeys = new Set();

  const remember = (finding) => {
    const itemId = finding.approvedItemId || getProductLabReviewItemId(finding, theme);
    const key = `${itemId}:${normalize(finding.module)}:${normalize(finding.title)}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    approvedFindings.push(finding);
  };

  for (const finding of findings) {
    const decision = findApprovedAdminDecision(adminDecisions, finding, theme);
    if (decision) {
      remember({
        ...finding,
        approvedItemId: decision.itemId || getProductLabReviewItemId(finding, theme),
        approvedDecision: decision,
      });
    }
  }

  for (const decision of Object.values(adminDecisions)) {
    if (!isApprovedAdminDecision(decision)) continue;
    const decisionKey = `${decision.itemId}:${normalize(decision.module)}:${normalize(decision.title)}`;
    if ([...seenKeys].some((key) => key.startsWith(`${decision.itemId}:`) || key.endsWith(`:${normalize(decision.module)}:${normalize(decision.title)}`))) {
      continue;
    }
    seenKeys.add(decisionKey);
    approvedFindings.push(buildApprovedFindingFromDecision(decision));
  }

  return approvedFindings;
};

const exists = (root, relativePath) => fs.existsSync(path.join(root, relativePath));

const readFile = (root, relativePath) => {
  const absolutePath = path.join(root, relativePath);
  return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()
    ? fs.readFileSync(absolutePath, "utf8")
    : "";
};

const writeFileIfChanged = (root, relativePath, content) => {
  const absolutePath = path.join(root, relativePath);
  const previous = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
  if (previous === content) return false;
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
  return true;
};

const walkFiles = (root, relativePath, extensions, maxFiles = 400) => {
  const base = path.join(root, relativePath);
  const files = [];
  if (!fs.existsSync(base)) return files;

  const visit = (current) => {
    if (files.length >= maxFiles) return;
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      if (/node_modules|dist|\.vite|\.git|\.npm-cache|\.codex-tmp/.test(current)) return;
      for (const entry of fs.readdirSync(current)) visit(path.join(current, entry));
      return;
    }

    if (extensions.some((extension) => current.endsWith(extension))) {
      files.push(path.relative(root, current).replace(/\\/g, "/"));
    }
  };

  visit(base);
  return files;
};

export const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

export const getParisDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: String(parts.weekday).toLowerCase(),
  };
};

export const getIsoWeek = (date = new Date()) => {
  const parisDate = new Date(`${getParisDateParts(date).date}T12:00:00Z`);
  const day = parisDate.getUTCDay() || 7;
  parisDate.setUTCDate(parisDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(parisDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((parisDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${parisDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

export const getThemeForParisDate = (date = new Date(), forcedTheme) => {
  if (forcedTheme) {
    const match = Object.values(weeklyThemes).find(
      (theme) => theme.id === forcedTheme || normalize(theme.label) === normalize(forcedTheme),
    );
    return match ?? { id: forcedTheme, label: forcedTheme, tomorrow: "Prochaine priorite V2" };
  }

  const { weekday } = getParisDateParts(date);
  return weeklyThemes[weekday] ?? weeklyThemes.tuesday;
};

export const redactSecrets = (value) =>
  String(value ?? "")
    .replace(/vck_[A-Za-z0-9_-]{16,}/g, "vck_[REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]{16,}/g, "sk-[REDACTED]")
    .replace(/sb_secret_[A-Za-z0-9_-]{10,}/g, "sb_secret_[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]{16,}/gi, "Bearer [REDACTED]")
    .replace(/AI_GATEWAY_API_KEY=.+/g, "AI_GATEWAY_API_KEY=[REDACTED]");

export const classifyImprovement = (input) => {
  const text = normalize([input.title, input.module, input.description, input.action].join(" "));
  if (dangerousSignals.some((signal) => text.includes(normalize(signal)))) return "human_validation";
  if (safeSignals.some((signal) => text.includes(normalize(signal)))) return "auto_safe";
  return input.risk === "Faible" ? "auto_safe" : "human_validation";
};

export const getResearchSourcesForTheme = (theme) => {
  const themeModule = themeModuleById[theme?.id];
  const selected = trustedResearchSources.filter((source) => {
    if (themeModule && source.modules.includes(themeModule)) return true;
    return source.modules.includes("Product Lab") || source.modules.includes("Code Health");
  });

  return selected.length ? selected : trustedResearchSources.slice(0, 4);
};

export const loadResearchVerification = (root) => {
  const verificationPath = path.join(root, "product-lab", "state", "research-sources.json");
  if (!fs.existsSync(verificationPath)) {
    return {
      mode: "static_fallback",
      verifiedAt: null,
      results: {},
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(verificationPath, "utf8"));
    return {
      mode: parsed.mode ?? "live",
      verifiedAt: parsed.verifiedAt ?? null,
      results: parsed.results ?? {},
    };
  } catch {
    return {
      mode: "static_fallback",
      verifiedAt: null,
      results: {},
    };
  }
};

export const buildResearchEvidence = (root, theme) => {
  const verification = loadResearchVerification(root);
  const selectedSources = getResearchSourcesForTheme(theme);
  const sources = selectedSources.map((source) => {
    const check = verification.results[source.id] ?? {};
    return {
      ...source,
      verificationStatus: check.status ?? "not_checked",
      httpStatus: check.httpStatus ?? null,
      checkedAt: check.verifiedAt ?? verification.verifiedAt ?? null,
      durationMs: check.durationMs ?? null,
    };
  });
  const verifiedCount = sources.filter((source) => source.verificationStatus === "verified").length;

  return {
    mode: verification.mode,
    verifiedAt: verification.verifiedAt,
    verifiedCount,
    total: sources.length,
    sources,
    principles: [...new Set(sources.flatMap((source) => source.principles))].slice(0, 12),
    warning:
      verifiedCount > 0
        ? "Sources verifiees en live ou dernier etat disponible."
        : "Fallback statique: les sources sont allowlistees, mais la verification live n'a pas encore tourne ou a echoue.",
  };
};

const MOJIBAKE_PATTERN =
  /Cr\u00c3|B\u00c3|Int\u00c3|G\u00c3|Param\u00c3|\u00c3\u00a9|\u00c3\u00a8|\u00c3\u00aa|\u00c3\u00a7|\u00c3\u00b4|\u00c3\u00bb|\u00c2|\u00e2\u20ac\u2122|\u00e2\u20ac\u0153|\u00e2\u20ac/;

export const auditProject = (root, theme) => {
  const packageJson = JSON.parse(readFile(root, "package.json") || "{}");
  const scripts = packageJson.scripts ?? {};
  const srcFiles = walkFiles(root, "src", [".ts", ".tsx"]);
  const functionFiles = walkFiles(root, "supabase/functions", [".ts"]);
  const runtimeContent = [...srcFiles, ...functionFiles]
    .map((file) => readFile(root, file))
    .join("\n");
  const workflowContent = readFile(root, ".github/workflows/generator-nightly-audit.yml");
  const productWorkflowContent = readFile(root, ".github/workflows/product-lab-nightly.yml");
  const themeFiles = fileTargets[theme.id] ?? [];
  const missingRuntimeFiles = requiredRuntimeFiles.filter((file) => !exists(root, file));
  const mojibakeHits = [...srcFiles, ...functionFiles]
    .flatMap((file) =>
      MOJIBAKE_PATTERN.test(readFile(root, file))
        ? [file]
        : [],
    );

  const hasExistingBrokenWorkflow = workflowContent.includes("npm run generator:nightly");
  const hasGateway = runtimeContent.includes("AI_GATEWAY") || runtimeContent.includes("ai-orchestrator");
  const hasStorageAdapter = runtimeContent.includes("ProjectStorageAdapter") || exists(root, "src/modules/storage/project-storage-adapter.ts");
  const hasQualityGate = runtimeContent.includes("Quality Gate") || runtimeContent.includes("qualityGate") || runtimeContent.includes("validateSiteProject");
  const hasProductLabScripts = Object.keys(scripts).some((key) => key.startsWith("product-lab"));
  const hasAISpaces = exists(root, "src/modules/ai-spaces") && exists(root, "src/pages/AISpaces.tsx");
  const firstDryRunApproved = exists(root, "product-lab/state/first-dry-run-approved.json");

  return {
    root,
    packageScripts: scripts,
    srcFileCount: srcFiles.length,
    functionFileCount: functionFiles.length,
    themeFiles,
    missingRuntimeFiles,
    mojibakeHits,
    hasExistingBrokenWorkflow,
    hasProductWorkflow: Boolean(productWorkflowContent.trim()),
    hasGateway,
    hasStorageAdapter,
    hasQualityGate,
    hasProductLabScripts,
    hasAISpaces,
    hasSupabaseFunctions: exists(root, "supabase/functions"),
    hasGithubWorkflowDir: exists(root, ".github/workflows"),
    hasReportsDir: exists(root, "reports/product-lab"),
    hasBacklog: exists(root, "product-lab/backlog.md"),
    firstDryRunApproved,
    currentTheme: theme,
  };
};

export const scoreProduct = (audit) => {
  const verifiedResearchCount = audit.researchEvidence?.verifiedCount ?? 0;
  const researchBonus = verifiedResearchCount > 0 ? 2 : 0;
  const base = {
    "Product Quality Score": 74,
    "UX Score": 72,
    "Conversion Score": 73,
    "Design Score": 75,
    "AI System Score": 70,
    "Site Builder Score": 76,
    "Agent Builder Score": 72,
    "AI Spaces Score": audit.hasAISpaces ? 73 : 58,
    "Game Builder Score": 69,
    "Integration Score": 70,
    "Analytics Score": 65,
    "Code Health Score": 72,
  };

  const adjustments = {
    "Product Quality Score": (audit.hasProductLabScripts ? 4 : -4) + (audit.missingRuntimeFiles.length ? -6 : 4) + researchBonus,
    "UX Score": (audit.currentTheme.id === "dashboard" ? 2 : 0) + researchBonus,
    "Conversion Score": (audit.hasQualityGate ? 3 : -4) + researchBonus,
    "Design Score": (audit.mojibakeHits.length ? -5 : 2) + researchBonus,
    "AI System Score": (audit.hasGateway ? 8 : -10) + researchBonus,
    "Site Builder Score": audit.currentTheme.id === "site-builder" ? 3 : 0,
    "Agent Builder Score": audit.currentTheme.id === "agent-builder" ? 3 : 0,
    "AI Spaces Score": audit.hasAISpaces ? 4 + researchBonus : -8,
    "Game Builder Score": audit.currentTheme.id === "game-builder" ? 3 : 0,
    "Integration Score": audit.currentTheme.id === "templates-integrations" ? 3 : 0,
    "Analytics Score": audit.hasStorageAdapter ? 3 : -3,
    "Code Health Score": (audit.hasExistingBrokenWorkflow ? -8 : 4) + researchBonus,
  };

  const scoreDetails = {};
  for (const key of scoreKeys) {
    const note = clampScore(base[key] + (adjustments[key] ?? 0));
    scoreDetails[key] = {
      note,
      reason: buildScoreReason(key, note, audit),
      mainProblem: buildMainProblem(key, audit),
      bestImprovement: buildBestImprovement(key, audit),
      nextAction: buildNextAction(key, audit),
    };
  }

  return scoreDetails;
};

const buildScoreReason = (key, note, audit) => {
  if (key === "AI System Score") return audit.hasGateway ? "Pipeline IA/Supabase detecte, reste a durcir en CI." : "Moteur IA non detecte dans les modules audites.";
  if (key === "Code Health Score") return audit.hasExistingBrokenWorkflow ? "Un ancien workflow appelle encore une commande inexistante." : "Scripts et workflows principaux sont coherents.";
  if (key === "Design Score") return audit.mojibakeHits.length ? "Des textes casses restent a corriger." : "Identite noir/or coherente dans les modules audites.";
  return note >= 75 ? "Base V2 solide avec opportunites d'iteration ciblee." : "Base utile mais encore trop dependante de mocks ou d'etats incomplets.";
};

const buildMainProblem = (key, audit) => {
  if (audit.hasExistingBrokenWorkflow) return "CI nightly historique non fiable tant qu'elle appelle une commande absente.";
  if (audit.mojibakeHits.length) return "Mojibake detecte dans des fichiers runtime.";
  if (key === "Analytics Score") return "Les insights reels restent encore partiellement mockes.";
  if (key === "AI Spaces Score") return "Les espaces IA doivent prouver leur usage, leurs garde-fous et leur conversion vers Builders.";
  if (key === "Game Builder Score") return "Le statut beta doit rester tres clair dans chaque sortie.";
  return "Il faut augmenter la preuve produit sans complexifier l'UX debutant.";
};

const buildBestImprovement = (key) => {
  const map = {
    "Product Quality Score": "Maintenir une roadmap Product Lab priorisee par impact/risque.",
    "UX Score": "Renforcer empty states, microcopy et actions rapides par theme hebdomadaire.",
    "Conversion Score": "Auditer CTA, objections et preuves dans les builders.",
    "Design Score": "Verifier coherence noir/or, spacing et lisibilite mobile.",
    "AI System Score": "Durcir secours IA, normalisation et logs sans secrets.",
    "Site Builder Score": "Ameliorer le brief et les presets niche/conversion.",
    "Agent Builder Score": "Renforcer permissions et chat de test.",
    "AI Spaces Score": "Auditer prompts, quick actions, garde-fous et liens vers Builders.",
    "Game Builder Score": "Ameliorer checklists et snippets beta par plateforme.",
    "Integration Score": "Clarifier statuts mock/reel et connecteurs demandes.",
    "Analytics Score": "Brancher plus de donnees reelles au dashboard.",
    "Code Health Score": "Corriger workflows, tests et imports avant PR.",
  };
  return map[key] ?? "Prioriser une amelioration sure et testable.";
};

const buildNextAction = (key, audit) => {
  if (audit.hasExistingBrokenWorkflow) return "Transformer l'ancien workflow en wrapper Product Lab valide.";
  if (key === "Code Health Score") return "Executer lint, tests et build avant toute PR.";
  return "Ajouter au backlog avec decision auto_safe ou human_validation.";
};

export const runExpertAgents = (audit, scores) => {
  const findings = [];

  if (!audit.firstDryRunApproved) {
    findings.push({
      title: "Verrouiller le premier Product Lab en dry-run",
      module: "Product Lab",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Faible",
      priority: "Critique",
      status: "A faire",
      inspiration: "Linear / Base44",
      description: "Le premier run doit prouver la qualite de l'audit avant tout patch automatique.",
    });
  }

  if (audit.hasExistingBrokenWorkflow) {
    findings.push({
      title: "Corriger le workflow nightly historique",
      module: "GitHub Actions",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Faible",
      priority: "Critique",
      status: "A faire",
      inspiration: "Vercel / Linear",
      description: "Remplacer la commande inexistante generator:nightly par un wrapper Product Lab dry-run.",
    });
  }

  if (audit.mojibakeHits.length) {
    findings.push({
      title: "Corriger les textes casses runtime",
      module: "UX/UI",
      impact: "Moyen",
      risk: "Faible",
      difficulty: "Faible",
      priority: "Important",
      status: "A faire",
      inspiration: "Shopify Admin",
      description: `Mojibake detecte dans ${audit.mojibakeHits.length} fichier(s).`,
    });
  }

  findings.push({
    title: "Renforcer le dashboard avec donnees V2 reelles",
    module: "Dashboard",
    impact: "Eleve",
    risk: "Moyen",
    difficulty: "Moyenne",
    priority: "Important",
    status: "A cadrer",
    inspiration: "Shopify Admin / Base44",
    description: "Augmenter les insights reels Supabase sans supprimer les empty states.",
  });

  findings.push({
    title: "Ameliorer le flow Site Builder preview",
    module: "Site Builder",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Moyenne",
    priority: "Amelioration",
    status: "Propose",
    inspiration: "Lovable / v0",
    description: "Rendre le chemin idee -> preview -> amelioration plus fluide avec microcopy et actions rapides.",
  });

  findings.push({
    title: "Forcer un moteur anti-site generique par niche",
    module: "Site Builder",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Moyenne",
    priority: "Critique",
    status: "A renforcer",
    inspiration: "Lovable / v0 / Mobbin",
    description:
      "Transformer les 20 tests generateur en signaux anti-template: layouts differents, preuves par niche, CTA contextuels, SEO local et sections non interchangeables.",
    beforeState:
      "Le Site Builder possede deja des blueprints, mais certains runs peuvent encore produire une preview trop proche d'un template standard.",
    afterState:
      "Chaque niche force une recette de structure, une variation de layout, des preuves, objections et CTA differents avant validation.",
  });

  findings.push({
    title: "Mesurer la similarite entre previews generees",
    module: "Site Builder",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Moyenne",
    priority: "Important",
    status: "A ajouter",
    inspiration: "Mobbin / 21st.dev / Linear",
    description:
      "Ajouter un score de similarite pour detecter quand deux sites generes reutilisent trop la meme structure, les memes titres ou les memes layouts.",
    beforeState:
      "Les tests verifient la qualite, mais ne transforment pas encore assez la similarite visuelle en proposition concrete.",
    afterState:
      "Le Product Lab remonte automatiquement les familles de sites trop semblables et propose un patch cible sur blueprint, prompt ou preview.",
  });

  findings.push({
    title: "Aligner chaque patch sur la vision idee vers projet concret",
    module: "Product Vision",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Faible",
    priority: "Important",
    status: "En continu",
    inspiration: "Lovable / Base44 / Linear",
    description: "Verifier que chaque amelioration renforce la promesse Pixelrises: creer, ameliorer, publier, connecter ou analyser.",
  });

  findings.push({
    title: "Durcir la securite des actions agents",
    module: "Agent Builder",
    impact: "Eleve",
    risk: "Moyen",
    difficulty: "Moyenne",
    priority: "Important",
    status: "Propose",
    inspiration: "Delos / Base44",
    description: "Toute action sensible agent doit rester validable et visible.",
  });

  findings.push({
    title: "Auditer les AI Spaces comme couche d'accompagnement",
    module: "AI Spaces",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Moyenne",
    priority: "Important",
    status: "Propose",
    inspiration: "Delos / Base44 / ChatGPT-style workspaces",
    description:
      "Verifier prompts, quick actions, garde-fous, historique, conversion vers Builders et clarté entre Builders et AI Spaces.",
    beforeState:
      "Les Builders creent deja des projets, mais l'accompagnement par profil doit rester lisible et mesurable.",
    afterState:
      "Chaque espace IA propose une aide specialisee, des actions rapides, des liens vers Builders et des protections adaptees.",
  });

  findings.push({
    title: "Conserver le Game Builder en beta explicite",
    module: "Game Builder",
    impact: "Moyen",
    risk: "Faible",
    difficulty: "Faible",
    priority: "Amelioration",
    status: "Propose",
    inspiration: "Roblox Creator Hub / UEFN",
    description: "Les rapports doivent traquer toute promesse de publication automatique.",
  });

  findings.push({
    title: "Durcir le routing Multi-IA et les secours IA",
    module: "Multi-IA / Systeme",
    impact: "Eleve",
    risk: "Moyen",
    difficulty: "Moyenne",
    priority: "Important",
    status: "A cadrer",
    inspiration: "Moteur IA Pixelrises / Base44",
    description: "Verifier que chaque builder route vers le bon role IA, normalise la sortie et garde un mode de secours propre.",
  });

  findings.push({
    title: "Rendre integrations et templates plus actionnables",
    module: "Integrations / Templates",
    impact: "Moyen",
    risk: "Faible",
    difficulty: "Faible",
    priority: "Amelioration",
    status: "Propose",
    inspiration: "21st.dev / Mobbin / Vercel",
    description: "Transformer les cartes integrations/templates en prochaines actions claires sans pretendre que les connecteurs mockes sont actifs.",
  });

  findings.push({
    title: "Transformer analytics en recommandations exploitables",
    module: "Analytics",
    impact: "Eleve",
    risk: "Moyen",
    difficulty: "Moyenne",
    priority: "Important",
    status: "A cadrer",
    inspiration: "Shopify Admin / Linear",
    description: "Relier les evenements, projets et generations a des prochaines actions lisibles meme quand les donnees reelles sont partielles.",
  });

  findings.push({
    title: "Bloquer toute PR si lint tests ou build echouent",
    module: "Code Health",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Faible",
    priority: "Important",
    status: "En continu",
    inspiration: "Vercel / Linear",
    description: "Verifier que l'automatisation ne cree jamais de PR tant que lint, tests et build ne sont pas verts.",
  });

  findings.push({
    title: "Ancrer les propositions dans des sources verifiees",
    module: "Product Research",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Faible",
    priority: "Important",
    status: "En continu",
    inspiration: "NN/g / Vercel / Supabase / Linear",
    description: `Utiliser les sources fiables allowlistees pour guider les experts Product Lab (${audit.researchEvidence?.verifiedCount ?? 0}/${audit.researchEvidence?.total ?? 0} source(s) verifiee(s)).`,
  });

  return {
    agentReports: expertAgents.map((agent) => ({
      agent,
      problems: findings.filter((finding) => {
        const agentKey = normalize(agent);
        return (
          normalize(finding.module).includes(agentKey.split(" ")[0]) ||
          agent === "Product Lead" ||
          agent === "Code Expert" && finding.module === "GitHub Actions" ||
          agent === "Security Expert" && /securite|sensible|agent/i.test(finding.description)
        );
      }).slice(0, 3),
      quickWins: findings.filter((finding) => finding.risk === "Faible").slice(0, 2),
      risks: findings.filter((finding) => finding.risk !== "Faible").slice(0, 2),
      recommendations: findings.slice(0, 3),
    })),
    findings: findings.map((finding) => ({
      ...finding,
      decision: classifyImprovement(finding),
      scoreImpact: estimateImpactScore(finding, scores),
    })),
  };
};

const estimateImpactScore = (finding) => {
  const impact = finding.impact === "Eleve" ? 30 : finding.impact === "Moyen" ? 18 : 10;
  const riskPenalty = finding.risk === "Faible" ? 0 : finding.risk === "Moyen" ? 6 : 12;
  return Math.max(1, impact - riskPenalty);
};

export const renderBacklog = (items) => {
  const sections = ["Critique", "Important", "Amelioration", "Plus tard"];
  const grouped = Object.fromEntries(sections.map((section) => [section, []]));
  for (const item of items) {
    const key = grouped[item.priority] ? item.priority : "Plus tard";
    grouped[key].push(item);
  }

  return [
    "# Pixelrises Continuous Product Lab - Backlog vivant",
    "",
    "Ce backlog est maintenu par le Product Lab. Les changements sensibles restent en validation humaine.",
    "",
    ...sections.flatMap((section) => [
      `## ${section}`,
      "",
      ...(grouped[section].length
        ? grouped[section].map(renderBacklogItem)
        : ["- Aucun item pour le moment."]),
      "",
    ]),
  ].join("\n");
};

const renderBacklogItem = (item) =>
  [
    `- **${item.title}**`,
    `  - Module: ${item.module}`,
    `  - Impact: ${item.impact} (${item.scoreImpact}/30)`,
    `  - Risque: ${item.risk}`,
    `  - Difficulte: ${item.difficulty}`,
    `  - Priorite: ${item.priority}`,
    `  - Statut: ${item.status}`,
    `  - Source inspiration: ${item.inspiration}`,
    `  - Decision: ${item.decision}`,
  ].join("\n");

export const renderScoreTable = (scores) => {
  const rows = scoreKeys.map((key) => {
    const score = scores[key];
    return `| ${key} | ${score.note}/100 | ${score.reason} | ${score.mainProblem} | ${score.bestImprovement} | ${score.nextAction} |`;
  });
  return [
    "| Score | Note | Raison | Probleme principal | Meilleure amelioration | Prochaine action |",
    "| --- | ---: | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
};

export const renderBenchmarkTable = () => [
  "| Module | Inspiration adaptee | Niveau cible Pixelrises |",
  "| --- | --- | --- |",
  ...benchmarkModules.map((item) => `| ${item.module} | ${item.inspiration} | ${item.target} |`),
].join("\n");

export const renderResearchTable = (researchEvidence) => [
  "| Source | Autorite | Statut verification | Usage Pixelrises | URL |",
  "| --- | --- | --- | --- | --- |",
  ...researchEvidence.sources.map((source) => {
    const status = source.verificationStatus === "verified"
      ? `verifie${source.httpStatus ? ` (${source.httpStatus})` : ""}`
      : source.verificationStatus;
    return `| ${source.name} | ${source.authority} | ${status} | ${source.principles[0]} | ${source.url} |`;
  }),
].join("\n");

export const renderDailyReport = (result) => {
  const autoSafe = result.findings.filter((finding) => finding.decision === "auto_safe");
  const human = result.findings.filter((finding) => finding.decision === "human_validation");
  return [
    `# Pixelrises V2 - Daily Product Lab Report - ${result.date}`,
    "",
    "## Theme du jour",
    result.theme.label,
    "",
    "## Resume",
    result.dryRun
      ? "Premier run en dry-run: audit, scoring, backlog et recommandations uniquement. Aucun patch produit automatique applique."
      : "Run Product Lab avec garde-fous actifs.",
    "",
    "## Vision Pixelrises protegee",
    `- Promesse: ${productVision.promise}`,
    `- Resultat protege: ${productVision.protectedOutcome}`,
    `- Principes: ${productVision.principles.join(", ")}`,
    "",
    "## Benchmark niveau inspirations",
    renderBenchmarkTable(),
    "",
    "## Scores du jour",
    renderScoreTable(result.scores),
    "",
    "## Agents experts consultes",
    result.agentReports.map((agent) => `- ${agent.agent}`).join("\n"),
    "",
    "## Inspirations utilisees",
    inspirationSources.map((source) => `- ${source}`).join("\n"),
    "",
    "## Recherche fiable et verification live",
    `- Mode: ${result.researchEvidence.mode}`,
    `- Sources verifiees: ${result.researchEvidence.verifiedCount}/${result.researchEvidence.total}`,
    `- Derniere verification: ${result.researchEvidence.verifiedAt ?? "non disponible"}`,
    `- Note: ${result.researchEvidence.warning}`,
    "",
    renderResearchTable(result.researchEvidence),
    "",
    "## Principes de recherche appliques",
    result.researchEvidence.principles.map((principle) => `- ${principle}`).join("\n"),
    "",
    "## Problemes detectes",
    result.findings.map((finding) => `- **${finding.title}** (${finding.module}) - ${finding.description}`).join("\n"),
    "",
    "## Ameliorations proposees",
    result.findings.map((finding) => `- ${finding.title} - ${finding.decision}`).join("\n"),
    "",
    "## Ameliorations appliquees automatiquement",
    result.appliedImprovements.length
      ? result.appliedImprovements.map((item) => `- ${item}`).join("\n")
      : result.dryRun
        ? "- Aucune. Dry-run obligatoire ou validation auto-fix absente."
        : "- Aucune proposition validee dans l'admin n'a produit de patch sur ce run.",
    "",
    "## Ameliorations necessitant validation humaine",
    human.length ? human.map((finding) => `- ${finding.title} (${finding.module})`).join("\n") : "- Aucune decision sensible detectee dans ce run.",
    "",
    "## Propositions auto-safe a valider",
    autoSafe.length ? autoSafe.map((finding) => `- ${finding.title} (${finding.module})`).join("\n") : "- Aucun safe improvement propose.",
    "",
    "## Fichiers modifies",
    result.modifiedFiles.length ? result.modifiedFiles.map((file) => `- ${file}`).join("\n") : "- Aucun fichier produit modifie.",
    "",
    "## Tests lances",
    result.checks.length
      ? result.checks.map((check) => `- ${check.name}: ${check.status}`).join("\n")
      : result.dryRun
        ? "- Aucun test lance pendant ce dry-run. Le workflow CI lance lint, tests et build apres le Product Lab."
        : "- Aucun test lance par le Product Lab local. Les validations doivent etre lancees apres le run safe.",
    "",
    "## Resultat des tests",
    result.checks.length
      ? result.checks.map((check) => `- ${check.name}: ${check.summary}`).join("\n")
      : result.dryRun
        ? "- Non applicable pour ce dry-run local."
        : "- A lancer juste apres le run safe avant tout push ou PR.",
    "",
    "## Risques restants",
    result.risks.map((risk) => `- ${risk}`).join("\n"),
    "",
    "## Priorites du lendemain",
    `- ${result.theme.tomorrow}`,
    result.dryRun
      ? "- Valider le rapport dry-run avant d'autoriser les patches automatiques."
      : "- Continuer avec 2 patches auto_safe maximum et validation humaine des changements sensibles.",
    "",
    "## Conclusion",
    result.dryRun
      ? "Le Product Lab est pret a fonctionner comme systeme d'audit et de roadmap. Les patches automatiques restent verrouilles jusqu'a validation humaine du premier rapport."
      : "Le Product Lab ameliore la V2 avec des garde-fous actifs, en restant aligne sur la vision Pixelrises et les benchmarks produits adaptes.",
    "",
  ].join("\n");
};

export const renderWeeklyReport = (result) => [
  `# Pixelrises V2 - Weekly Product Lab Report - ${result.week}`,
  "",
  "## Resume de la semaine",
  "Synthese initiale generee par le Product Lab. Les tendances seront plus riches apres plusieurs runs quotidiens.",
  "",
  "## Meilleures ameliorations",
  result.findings.slice(0, 5).map((finding) => `- ${finding.title}`).join("\n"),
  "",
  "## Scores debut de semaine vs fin de semaine",
  renderScoreTable(result.scores),
  "",
  "## Modules qui progressent",
  "- Product Lab, Multi-IA, Builders V2",
  "",
  "## Modules bloques",
  result.audit.hasExistingBrokenWorkflow ? "- Ancien workflow nightly a corriger." : "- Aucun blocage critique detecte.",
  "",
  "## Risques",
  result.risks.map((risk) => `- ${risk}`).join("\n"),
  "",
  "## Dette technique",
  "- Continuer a separer mock/reel et proteger les actions sensibles.",
  "",
  "## Roadmap recommandee pour la semaine prochaine",
  "- Poursuivre le cycle hebdomadaire Product Lab et augmenter les patches uniquement apres validation.",
  "",
  "## Decisions necessitant validation humaine",
  result.findings
    .filter((finding) => finding.decision === "human_validation")
    .map((finding) => `- ${finding.title}`)
    .join("\n") || "- Aucune.",
  "",
  "## Conclusion",
  "La boucle d'amelioration continue est initialisee en mode prudent.",
  "",
].join("\n");

const priorityRank = {
  Critique: 0,
  Important: 1,
  Amelioration: 2,
  "Plus tard": 3,
};

const impactRank = {
  Eleve: 0,
  Moyen: 1,
  Faible: 2,
};

const riskRank = {
  Faible: 0,
  Moyen: 1,
  Eleve: 2,
};

const compareReviewFindings = (theme) => (left, right) => {
  const themeModule = themeModuleById[theme?.id];
  const leftThemeBoost = left.module === themeModule ? -2 : 0;
  const rightThemeBoost = right.module === themeModule ? -2 : 0;
  const leftCriticalBoost = left.priority === "Critique" ? -3 : 0;
  const rightCriticalBoost = right.priority === "Critique" ? -3 : 0;

  return (
    leftCriticalBoost - rightCriticalBoost ||
    leftThemeBoost - rightThemeBoost ||
    (priorityRank[left.priority] ?? 4) - (priorityRank[right.priority] ?? 4) ||
    (impactRank[left.impact] ?? 3) - (impactRank[right.impact] ?? 3) ||
    (riskRank[left.risk] ?? 3) - (riskRank[right.risk] ?? 3) ||
    (right.scoreImpact ?? 0) - (left.scoreImpact ?? 0) ||
    String(left.title).localeCompare(String(right.title))
  );
};

export const selectProductLabReviewFindings = (findings, theme, adminDecisions = {}) => {
  const { max } = getProductLabReviewLimits();
  const processed = getProcessedDecisionKeys(adminDecisions);
  const uniqueFindings = [];
  const seen = new Set();

  for (const finding of findings) {
    const itemId = getProductLabReviewItemId(finding, theme);
    const titleKeys = getProductLabTitleVariants(finding.title).map((title) => `${normalize(finding.module)}:${title}`);
    if (processed.itemIds.has(itemId) || titleKeys.some((titleKey) => processed.titleKeys.has(titleKey))) continue;
    const key = `${finding.module}:${finding.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueFindings.push(finding);
  }

  const sortedFindings = uniqueFindings.sort(compareReviewFindings(theme));
  const selected = [];
  const selectedModules = new Set();
  const themeModule = themeModuleById[theme?.id];

  const addFinding = (finding) => {
    if (!finding || selected.length >= max) return;
    const itemId = getProductLabReviewItemId(finding, theme);
    if (selected.some((item) => getProductLabReviewItemId(item, theme) === itemId)) return;
    selected.push(finding);
    selectedModules.add(finding.module);
  };

  sortedFindings
    .filter((finding) => finding.priority === "Critique" || finding.module === themeModule)
    .forEach(addFinding);

  sortedFindings
    .filter((finding) => !selectedModules.has(finding.module))
    .forEach(addFinding);

  sortedFindings.forEach(addFinding);

  return selected.slice(0, max);
};

export const buildProductLabReviewQueue = (result) => {
  const reportPath = path.join("reports", "product-lab", "daily", `daily-${result.date}.md`).replace(/\\/g, "/");
  const runInstance =
    process.env.PRODUCT_LAB_RUN_ID ||
    process.env.GITHUB_RUN_ID ||
    slugify(process.env.PRODUCT_LAB_RUN_STARTED_AT || new Date().toISOString());
  const runId = `${result.date}-${result.theme.id}-${runInstance}`;
  const reviewItems = selectProductLabReviewFindings(result.findings, result.theme, result.adminDecisions).map((finding, index) =>
    applyDailyReviewFocus(finding, result, index),
  );
  const queueTheme = { ...result.theme, date: result.date, runDate: result.date, runId, runInstance };
  const scoreEntries = Object.entries(result.scores).map(([name, score]) => ({ name, note: score.note }));
  const averageScore = scoreEntries.length
    ? Math.round(scoreEntries.reduce((total, score) => total + score.note, 0) / scoreEntries.length)
    : 0;
  const lowestScore = scoreEntries.reduce(
    (lowest, score) => (score.note < lowest.note ? score : lowest),
    scoreEntries[0] ?? { name: "Product Quality Score", note: 0 },
  );

  const rawItems = reviewItems.map((finding) => ({
    id: getProductLabReviewItemId(finding, queueTheme),
    title: finding.title,
    originalTitle: finding.originalTitle || finding.title,
    module: finding.module,
    simpleSummary: buildReviewSimpleSummary(finding),
    priority: finding.priority,
    impact: finding.impact,
    risk: finding.risk,
    difficulty: finding.difficulty,
    status: finding.status,
    inspiration: finding.inspiration,
    decision: finding.decision,
    description: finding.description,
    scoreImpact: finding.scoreImpact,
    runFocus: finding.runFocus,
    sourceReport: reportPath,
    automationPolicy:
      "Validation humaine requise avant tout changement sensible. Le Product Lab ne doit pas appliquer cette decision automatiquement.",
    concernedFiles: resolveReviewFiles(result, finding),
    evidenceSources: resolveEvidenceSources(result.researchEvidence, finding),
    beforeState: buildReviewBeforeState(finding),
    afterState: buildReviewAfterState(finding),
    dataState: "real",
  }));
  const { min, max } = getProductLabReviewLimits();
  const actionableItems = filterActionableProductLabProposals(rawItems);
  const finalItems =
    actionableItems.length >= Math.min(min, rawItems.length) ? actionableItems : rawItems;

  return {
    generatedAt: new Date().toISOString(),
    sourceRun: {
      date: result.date,
      week: result.week,
      theme: result.theme.label,
      reportPath,
      runId,
    },
    summary: {
      total: finalItems.length,
      actionableTotal: finalItems.length,
      rejectedVagueProposals: rawItems.length - actionableItems.length,
      maxAutoSafePatches: result.maxPatches,
      sensitiveChangesRequireApproval: true,
      dailySummary: `Theme ${result.theme.label}: ${finalItems.length} proposition(s) actionnable(s) a valider, modifier ou refuser avant application. Objectif utile: ${min}-${max} propositions max par run.`,
      averageScore,
      lowestScore,
      research: {
        mode: result.researchEvidence.mode,
        verifiedSources: result.researchEvidence.verifiedCount,
        totalSources: result.researchEvidence.total,
        verifiedAt: result.researchEvidence.verifiedAt,
      },
    },
    items: finalItems,
  };
};

const reviewFilesByModule = {
  "Product Lab": ["scripts/product-lab-core.mjs", "product-lab/backlog.md", "reports/product-lab/daily"],
  "GitHub Actions": [".github/workflows/product-lab-nightly.yml", ".github/workflows/generator-nightly-audit.yml"],
  "UX/UI": ["src/pages", "src/components"],
  Dashboard: ["src/pages/Dashboard.tsx", "src/pages/Create.tsx"],
  "Site Builder": ["src/pages/SiteBuilder.tsx", "src/modules/creation-engine", "supabase/functions/ai-orchestrator/index.ts"],
  "Agent Builder": ["src/pages/AgentBuilder.tsx", "src/pages/Agents.tsx", "src/modules/registries/index.ts"],
  "AI Spaces": ["src/pages/AISpaces.tsx", "src/pages/AISpaceDetail.tsx", "src/modules/ai-spaces"],
  "Game Builder": ["src/pages/GameBuilder.tsx", "src/pages/Games.tsx", "src/modules/registries/index.ts"],
  "Multi-IA / Systeme": ["src/modules/ai", "supabase/functions/ai-orchestrator/index.ts", "scripts/product-lab-core.mjs"],
  "Integrations / Templates": ["src/pages/Integrations.tsx", "src/pages/Templates.tsx", "src/modules/registries/index.ts"],
  Analytics: ["src/pages/Analytics.tsx", "src/pages/Dashboard.tsx", "src/modules/storage/project-storage-adapter.ts"],
  "Code Health": ["scripts/product-lab-core.mjs", ".github/workflows/product-lab-nightly.yml", "src/test/product-lab-core.test.ts"],
  "Product Research": ["scripts/product-lab-core.mjs", "product-lab/state/research-sources.json", "reports/product-lab/daily"],
  "Product Vision": ["docs/product-lab-benchmark-targets.md", "product-lab/backlog.md"],
};

const resolveReviewFiles = (result, finding) => {
  const files = reviewFilesByModule[finding.module] ?? result.audit.themeFiles ?? [];
  return [...new Set(files)].slice(0, 6);
};

const resolveEvidenceSources = (researchEvidence, finding) => {
  const moduleSources = researchEvidence.sources.filter(
    (source) => source.modules.includes(finding.module) || source.modules.includes("Product Lab"),
  );
  const sources = moduleSources.length ? moduleSources : researchEvidence.sources.slice(0, 2);
  return sources.slice(0, 3).map((source) => ({
    id: source.id,
    name: source.name,
    url: source.url,
    authority: source.authority,
    verificationStatus: source.verificationStatus,
    checkedAt: source.checkedAt,
  }));
};

const buildReviewSimpleSummary = (finding) =>
  `${finding.module}: ${finding.description} Impact ${finding.impact.toLowerCase()}, risque ${finding.risk.toLowerCase()}.`;

const buildReviewBeforeState = (finding) => {
  if (finding.beforeState) return finding.beforeState;
  if (finding.module === "Dashboard") return "Le dashboard contient deja la base V2, mais certains signaux restent mockes ou trop peu actionnables.";
  if (finding.module === "Site Builder") return "Le builder cree deja une experience V2, mais le chemin idee -> preview -> amelioration peut encore gagner en fluidite.";
  if (finding.module === "Agent Builder") return "Les agents existent, mais les actions sensibles doivent rester encore plus visibles et validables.";
  if (finding.module === "Game Builder") return "Le Game Builder est en beta et doit continuer a cadrer clairement blueprint, snippets, assets et checklist.";
  if (finding.module === "Multi-IA / Systeme") return "Le routing IA existe, mais chaque builder doit garder une sortie normalisee, verifiee et repliable en mock propre.";
  if (finding.module === "Integrations / Templates") return "Les registries existent, mais certaines cartes peuvent encore mieux guider l'utilisateur vers la prochaine action utile.";
  if (finding.module === "Analytics") return "Les analytics sont prepares, mais les signaux doivent devenir des recommandations plus exploitables.";
  if (finding.module === "Code Health") return "La CI protege deja le projet, mais le Product Lab doit rester bloque si une validation echoue.";
  if (finding.module === "Product Research") return "Le Product Lab utilise deja des inspirations, mais doit distinguer avis interne, source fiable et verification live.";
  return "La V2 fonctionne, mais cette proposition touche une zone qui doit rester sous controle humain.";
};

const buildReviewAfterState = (finding) => {
  if (finding.afterState) return finding.afterState;
  if (finding.module === "Dashboard") return "Le dashboard donne une prochaine action plus claire, avec moins de friction et plus de valeur percue.";
  if (finding.module === "Site Builder") return "L'utilisateur comprend mieux quoi faire et comment ameliorer son projet sans casser le rendu.";
  if (finding.module === "Agent Builder") return "Chaque permission ou action sensible est explicite avant que le Product Lab puisse appliquer un patch.";
  if (finding.module === "Game Builder") return "Le statut beta reste honnete et aucune publication automatique n'est suggeree.";
  if (finding.module === "Multi-IA / Systeme") return "Les generations restent mieux routees, mieux normalisees et plus stables en cas d'echec du moteur IA.";
  if (finding.module === "Integrations / Templates") return "Les cartes donnent une action claire et gardent des statuts honnetes entre mock, beta et reel.";
  if (finding.module === "Analytics") return "Le dashboard transforme davantage les signaux en prochaines actions priorisees.";
  if (finding.module === "Code Health") return "Aucune PR automatique n'est creee tant que lint, tests et build ne sont pas verts.";
  if (finding.module === "Product Research") return "Chaque run relie ses recommandations a une base de sources fiables, verifiee quand le workflow a du reseau.";
  return "Le Product Lab pourra agir au prochain run uniquement si la decision admin l'autorise.";
};

export const runChecks = (root) => {
  const commands = [
    { name: "lint", args: ["run", "lint"] },
    { name: "test", args: ["run", "test"] },
    { name: "build", args: ["run", "build"] },
  ];

  return commands.map((command) => {
    try {
      execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", command.args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { name: command.name, status: "passed", summary: "OK" };
    } catch (error) {
      return {
        name: command.name,
        status: "failed",
        summary: redactSecrets(error.stderr?.toString() || error.message),
      };
    }
  });
};

export const runProductLab = ({
  root = process.cwd(),
  action = "daily",
  dryRun = false,
  forcedTheme,
  date = new Date(),
  runChecksEnabled = false,
} = {}) => {
  const { date: dateLabel } = getParisDateParts(date);
  const week = getIsoWeek(date);
  const theme = getThemeForParisDate(date, forcedTheme);
  const researchEvidence = buildResearchEvidence(root, theme);
  const audit = {
    ...auditProject(root, theme),
    researchEvidence,
  };
  const scores = scoreProduct(audit);
  const { agentReports, findings } = runExpertAgents(audit, scores);
  const adminDecisions = readProductLabAdminDecisions(root);
  const risks = [
    dryRun
      ? "Patches automatiques verrouilles tant que le premier dry-run n'est pas valide."
      : "Patches automatiques limites aux propositions explicitement validees dans l'admin.",
    "Aucune PR automatique ne doit etre creee si lint, tests ou build echouent.",
    "Les changements sensibles restent en validation humaine et ne sont jamais mergés automatiquement.",
  ];
  const checks = runChecksEnabled ? runChecks(root) : [];
  const maxPatches = Number(process.env.PRODUCT_LAB_MAX_PATCHES || DEFAULT_MAX_PATCHES);
  const approvalFile = path.join(root, "product-lab", "state", "first-dry-run-approved.json");
  const canApplyPatches =
    !dryRun &&
    process.env.PRODUCT_LAB_APPLY_SAFE_FIXES === "true" &&
    fs.existsSync(approvalFile) &&
    maxPatches > 0;
  const approvedFindings = mergeApprovedAdminFindings(findings, adminDecisions, theme);
  const patchResult = canApplyPatches
    ? applySafeImprovements(root, approvedFindings, maxPatches, theme, dateLabel)
    : { appliedImprovements: [], modifiedFiles: [] };
  const appliedImprovements = patchResult.appliedImprovements;
  const modifiedFiles = patchResult.modifiedFiles;

  const result = {
    action,
    date: dateLabel,
    week,
    theme,
    dryRun,
    audit,
    scores,
    researchEvidence,
    agentReports,
    findings,
    adminDecisions,
    approvedFindings,
    risks,
    checks,
    appliedImprovements,
    modifiedFiles,
    maxPatches,
  };

  const dailyDir = path.join(root, "reports", "product-lab", "daily");
  const weeklyDir = path.join(root, "reports", "product-lab", "weekly");
  const stateDir = path.join(root, "product-lab", "state");
  const publicDir = path.join(root, "public");
  fs.mkdirSync(dailyDir, { recursive: true });
  fs.mkdirSync(weeklyDir, { recursive: true });
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  const backlog = renderBacklog(findings);
  const dailyReport = renderDailyReport(result);
  const weeklyReport = renderWeeklyReport(result);
  const reviewQueue = buildProductLabReviewQueue(result);

  fs.writeFileSync(path.join(root, "product-lab", "backlog.md"), backlog, "utf8");
  fs.writeFileSync(path.join(stateDir, "product-scores.json"), JSON.stringify({ date: dateLabel, week, scores }, null, 2), "utf8");
  fs.writeFileSync(
    path.join(stateDir, "last-run-summary.json"),
    JSON.stringify(
      {
        date: dateLabel,
        week,
        theme: theme.id,
        dryRun,
        approvedFindings: approvedFindings.map((finding) => ({
          itemId: finding.approvedItemId || getProductLabReviewItemId(finding, theme),
          title: finding.title,
          module: finding.module,
          risk: finding.risk,
          priority: finding.priority,
          decision: finding.decision,
          concernedFiles: Array.isArray(finding.concernedFiles) ? finding.concernedFiles : [],
        })),
        appliedImprovements,
        modifiedFiles,
      },
      null,
      2,
    ),
    "utf8",
  );
  fs.writeFileSync(path.join(dailyDir, `daily-${dateLabel}.md`), dailyReport, "utf8");
  fs.writeFileSync(path.join(publicDir, "product-lab-review.json"), JSON.stringify(reviewQueue, null, 2), "utf8");

  if (action === "weekly" || theme.id === "audit-roadmap") {
    fs.writeFileSync(path.join(weeklyDir, `weekly-${week}.md`), weeklyReport, "utf8");
  }

  return {
    ...result,
    reportPath: path.join("reports", "product-lab", "daily", `daily-${dateLabel}.md`).replace(/\\/g, "/"),
    weeklyReportPath: path.join("reports", "product-lab", "weekly", `weekly-${week}.md`).replace(/\\/g, "/"),
    backlogPath: "product-lab/backlog.md",
  };
};

export const buildDailyImprovementLines = (theme, safeFindings) => {
  const moduleTarget = benchmarkModules.find((item) => item.module.toLowerCase().includes(theme.id.split("-")[0]));
  const themeModule = themeModuleById[theme.id] ?? theme.label;
  const relevantFindings = safeFindings.filter(
    (finding) => finding.module === themeModule || finding.module === "Product Vision",
  );
  const proposals = relevantFindings.slice(0, 3).map((finding) => `- ${finding.title}: ${finding.description}`);

  return [
    `Theme: ${theme.label}`,
    `Vision: ${productVision.promise}`,
    "",
    "Objectif auto-safe du jour:",
    moduleTarget
      ? `- ${moduleTarget.target}`
      : "- Ameliorer un module V2 sans casser les routes, la logique IA, Supabase ou l'experience utilisateur.",
    "",
    "Patches autorises automatiquement:",
    "- microcopy, labels, empty/loading/error states",
    "- documentation de decisions produit",
    "- tests simples, prompts, registries et garde-fous non destructifs",
    "",
    "Propositions retenues:",
    ...(proposals.length
      ? proposals
      : [`- Renforcer ${theme.label} avec un petit patch visible, testable et non destructif.`]),
    "",
    "Validation humaine obligatoire:",
    "- auth, paiement, credits, Supabase sensible, moteur IA principal, suppression de routes/fichiers, refonte majeure, publication jeux.",
  ];
};

export const applySafeImprovements = (root, safeFindings, maxPatches, theme, dateLabel = "daily") => {
  const appliedImprovements = [];
  const modifiedFiles = [];
  const remaining = () => appliedImprovements.length < maxPatches;

  const applyDocPatch = (relativePath, heading, lines, label) => {
    if (!remaining()) return;
    const current = readFile(root, relativePath);
    if (current.includes(heading)) return;
    const next = `${current.trimEnd()}\n\n${heading}\n\n${lines.join("\n")}\n`;
    if (writeFileIfChanged(root, relativePath, next)) {
      appliedImprovements.push(label);
      modifiedFiles.push(relativePath);
    }
  };

  if (safeFindings.some((finding) => finding.title.includes("dashboard"))) {
    applyDocPatch(
      "docs/product-lab-dashboard-benchmark.md",
      "# Product Lab - Dashboard Benchmark",
      [
        "Objectif: rapprocher le dashboard Pixelrises V2 d'un vrai cockpit SaaS decisionnel.",
        "",
        "References adaptees:",
        "- Shopify Admin: controle clair, statuts utiles, actions visibles",
        "- Linear: priorites lisibles, densite maitrisee, navigation calme",
        "- Base44: Plan / Build / Improve, backend-ready, analytics et integrations",
        "",
        "Safe improvements autorises:",
        "- clarifier la prochaine action principale",
        "- ameliorer empty states, loading states et error states",
        "- renforcer la lecture des projets V2 reels",
        "- rendre les signaux analytics plus utiles sans inventer de donnees connectees",
      ],
      "Creation d'une fiche benchmark dashboard.",
    );
  }

  if (safeFindings.some((finding) => finding.title.includes("Site Builder")) || theme.id === "site-builder") {
    applyDocPatch(
      "docs/product-lab-site-builder-safe-improvements.md",
      "# Product Lab - Site Builder Safe Improvements",
      [
        "Objectif: ameliorer progressivement le flow idee -> preview -> amelioration sans casser le builder.",
        "",
        "Safe improvements autorises:",
        "- clarifier la microcopy du prompt principal",
        "- renforcer les empty states de preview",
        "- ajouter des actions rapides non destructives",
        "- ameliorer les presets niche/conversion",
        "- ajouter des tests unitaires simples autour du rendu mock",
        "",
        "Validation humaine requise:",
        "- changement de pipeline IA reel",
        "- modification Supabase sensible",
        "- suppression de routes ou refonte complete du builder",
      ],
      "Creation d'une fiche safe improvements pour le Site Builder.",
    );
  }

  if (safeFindings.some((finding) => finding.title.includes("Game Builder"))) {
    applyDocPatch(
      "docs/product-lab-game-builder-beta-guardrails.md",
      "# Product Lab - Game Builder Beta Guardrails",
      [
        "Le Game Builder reste beta.",
        "",
        "A garantir dans chaque iteration:",
        "- generer blueprint, snippets, assets et checklist",
        "- ne jamais promettre une publication automatique Roblox, Minecraft ou Fortnite",
        "- garder les avertissements plateforme visibles",
      ],
      "Creation d'une fiche de garde-fous beta pour le Game Builder.",
    );
  }

  if (safeFindings.some((finding) => finding.module === "Product Vision")) {
    applyDocPatch(
      "docs/product-lab-benchmark-targets.md",
      "# Product Lab - Benchmark Targets",
      [
        "Le Product Lab doit ameliorer toute la V2 sans copier les plateformes d'inspiration.",
        "",
        renderBenchmarkTable(),
        "",
        "Regle centrale:",
        productVision.protectedOutcome,
      ],
      "Creation de la matrice benchmark V2.",
    );
  }

  if (remaining()) {
    applyDocPatch(
      `reports/product-lab/improvements/improvement-${dateLabel}-${theme.id}.md`,
      `# Product Lab - Auto Safe Improvement - ${dateLabel} - ${theme.label}`,
      buildDailyImprovementLines(theme, safeFindings),
      `Creation d'une note d'amelioration auto-safe ${theme.label}.`,
    );
  }

  if (safeFindings.length > 0 && appliedImprovements.length === 0 && remaining()) {
    const firstFinding = safeFindings[0];
    const approvedSlug = slugify(
      firstFinding.approvedItemId || `${firstFinding.module}-${firstFinding.title}`,
    ).slice(0, 96);

    applyDocPatch(
      `reports/product-lab/applied/applied-${dateLabel}-${theme.id}-${approvedSlug}.md`,
      `# Product Lab - Validation appliquee - ${dateLabel} - ${theme.label}`,
      [
        "Cette note prouve que le run Product Lab a bien consomme une validation admin et l'a transformee en action tracable.",
        "",
        "Validation traitee:",
        `- Titre: ${firstFinding.title}`,
        `- Module: ${firstFinding.module}`,
        `- Priorite: ${firstFinding.priority}`,
        `- Risque: ${firstFinding.risk}`,
        "",
        "Garde-fous:",
        "- aucun changement auth, Stripe, credits, Supabase sensible ou production n'est applique automatiquement",
        "- les checks lint, tests, build et redaction restent obligatoires avant PR",
        "- le Product Lab archive la proposition traitee pour eviter de la reproposer en boucle",
      ],
      `Application tracee de la validation admin ${firstFinding.title}.`,
    );
  }

  return {
    appliedImprovements,
    modifiedFiles: [...new Set(modifiedFiles)],
  };
};
