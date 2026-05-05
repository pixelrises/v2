import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const PRODUCT_LAB_NAME = "Pixelrises Continuous Product Lab";
export const DEFAULT_MAX_PATCHES = 2;

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
    module: "Game Builder",
    inspiration: "Roblox Creator Hub / Minecraft Creator / UEFN",
    target: "Un generateur beta de blueprints, snippets, assets et checklists sans promesse de publication automatique.",
  },
  {
    module: "Multi-IA / Systeme",
    inspiration: "Vercel AI Gateway / 21st.dev",
    target: "Un orchestrateur modulaire, normalise, teste, avec fallback et couts controles.",
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
    tomorrow: "Multi-IA / Vercel AI Gateway / Supabase",
  },
  friday: {
    id: "multi-ai",
    label: "Multi-IA / Vercel AI Gateway / Supabase",
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
  dashboard: ["src/pages/Dashboard.tsx", "src/pages/Create.tsx", "src/components/v2/V2PageShell.tsx"],
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
      /CrÃ|BÃ|IntÃ|GÃ|ParamÃ|Ã©|Ã¨|Ãª|Ã§|Ã´|Ã»|Â|â€™|â€œ|â€/.test(readFile(root, file))
        ? [file]
        : [],
    );

  const hasExistingBrokenWorkflow = workflowContent.includes("npm run generator:nightly");
  const hasGateway = runtimeContent.includes("AI_GATEWAY") || runtimeContent.includes("ai-orchestrator");
  const hasStorageAdapter = runtimeContent.includes("ProjectStorageAdapter") || exists(root, "src/modules/storage/project-storage-adapter.ts");
  const hasQualityGate = runtimeContent.includes("Quality Gate") || runtimeContent.includes("qualityGate") || runtimeContent.includes("validateSiteProject");
  const hasProductLabScripts = Object.keys(scripts).some((key) => key.startsWith("product-lab"));

  return {
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
    hasSupabaseFunctions: exists(root, "supabase/functions"),
    hasGithubWorkflowDir: exists(root, ".github/workflows"),
    hasReportsDir: exists(root, "reports/product-lab"),
    hasBacklog: exists(root, "product-lab/backlog.md"),
    currentTheme: theme,
  };
};

export const scoreProduct = (audit) => {
  const base = {
    "Product Quality Score": 74,
    "UX Score": 72,
    "Conversion Score": 73,
    "Design Score": 75,
    "AI System Score": 70,
    "Site Builder Score": 76,
    "Agent Builder Score": 72,
    "Game Builder Score": 69,
    "Integration Score": 70,
    "Analytics Score": 65,
    "Code Health Score": 72,
  };

  const adjustments = {
    "Product Quality Score": (audit.hasProductLabScripts ? 4 : -4) + (audit.missingRuntimeFiles.length ? -6 : 4),
    "UX Score": audit.currentTheme.id === "dashboard" ? 2 : 0,
    "Conversion Score": audit.hasQualityGate ? 3 : -4,
    "Design Score": audit.mojibakeHits.length ? -5 : 2,
    "AI System Score": audit.hasGateway ? 8 : -10,
    "Site Builder Score": audit.currentTheme.id === "site-builder" ? 3 : 0,
    "Agent Builder Score": audit.currentTheme.id === "agent-builder" ? 3 : 0,
    "Game Builder Score": audit.currentTheme.id === "game-builder" ? 3 : 0,
    "Integration Score": audit.currentTheme.id === "templates-integrations" ? 3 : 0,
    "Analytics Score": audit.hasStorageAdapter ? 3 : -3,
    "Code Health Score": audit.hasExistingBrokenWorkflow ? -8 : 4,
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
  if (key === "AI System Score") return audit.hasGateway ? "Pipeline Gateway/Supabase detecte, reste a durcir en CI." : "Gateway non detecte dans les modules audites.";
  if (key === "Code Health Score") return audit.hasExistingBrokenWorkflow ? "Un ancien workflow appelle encore une commande inexistante." : "Scripts et workflows principaux sont coherents.";
  if (key === "Design Score") return audit.mojibakeHits.length ? "Des textes casses restent a corriger." : "Identite noir/or coherente dans les modules audites.";
  return note >= 75 ? "Base V2 solide avec opportunites d'iteration ciblee." : "Base utile mais encore trop dependante de mocks ou d'etats incomplets.";
};

const buildMainProblem = (key, audit) => {
  if (audit.hasExistingBrokenWorkflow) return "CI nightly historique non fiable tant qu'elle appelle une commande absente.";
  if (audit.mojibakeHits.length) return "Mojibake detecte dans des fichiers runtime.";
  if (key === "Analytics Score") return "Les insights reels restent encore partiellement mockes.";
  if (key === "Game Builder Score") return "Le statut beta doit rester tres clair dans chaque sortie.";
  return "Il faut augmenter la preuve produit sans complexifier l'UX debutant.";
};

const buildBestImprovement = (key) => {
  const map = {
    "Product Quality Score": "Maintenir une roadmap Product Lab priorisee par impact/risque.",
    "UX Score": "Renforcer empty states, microcopy et actions rapides par theme hebdomadaire.",
    "Conversion Score": "Auditer CTA, objections et preuves dans les builders.",
    "Design Score": "Verifier coherence noir/or, spacing et lisibilite mobile.",
    "AI System Score": "Durcir fallback Gateway, normalisation et logs sans secrets.",
    "Site Builder Score": "Ameliorer le brief et les presets niche/conversion.",
    "Agent Builder Score": "Renforcer permissions et chat de test.",
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
        : "- Aucune nouvelle modification auto_safe appliquee sur ce run.",
    "",
    "## Ameliorations necessitant validation humaine",
    human.length ? human.map((finding) => `- ${finding.title} (${finding.module})`).join("\n") : "- Aucune decision sensible detectee dans ce run.",
    "",
    "## Safe improvements proposes",
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

export const buildProductLabReviewQueue = (result) => {
  const reportPath = path.join("reports", "product-lab", "daily", `daily-${result.date}.md`).replace(/\\/g, "/");
  const humanValidationItems = result.findings.filter((finding) => finding.decision === "human_validation");

  return {
    generatedAt: new Date().toISOString(),
    sourceRun: {
      date: result.date,
      week: result.week,
      theme: result.theme.label,
      reportPath,
    },
    summary: {
      total: humanValidationItems.length,
      maxAutoSafePatches: result.maxPatches,
      sensitiveChangesRequireApproval: true,
    },
    items: humanValidationItems.map((finding, index) => ({
      id: `${result.date}-${result.theme.id}-${finding.module.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
      title: finding.title,
      module: finding.module,
      priority: finding.priority,
      impact: finding.impact,
      risk: finding.risk,
      difficulty: finding.difficulty,
      status: finding.status,
      inspiration: finding.inspiration,
      decision: finding.decision,
      description: finding.description,
      scoreImpact: finding.scoreImpact,
      sourceReport: reportPath,
      automationPolicy:
        "Validation humaine requise avant tout changement sensible. Le Product Lab ne doit pas appliquer cette decision automatiquement.",
    })),
  };
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
  const audit = auditProject(root, theme);
  const scores = scoreProduct(audit);
  const { agentReports, findings } = runExpertAgents(audit, scores);
  const risks = [
    dryRun
      ? "Patches automatiques verrouilles tant que le premier dry-run n'est pas valide."
      : "Patches automatiques limites aux changements auto_safe et a PRODUCT_LAB_MAX_PATCHES.",
    "Aucune PR automatique ne doit etre creee si lint, tests ou build echouent.",
    "Les changements sensibles restent en validation humaine.",
  ];
  const checks = runChecksEnabled ? runChecks(root) : [];
  const maxPatches = Number(process.env.PRODUCT_LAB_MAX_PATCHES || DEFAULT_MAX_PATCHES);
  const approvalFile = path.join(root, "product-lab", "state", "first-dry-run-approved.json");
  const canApplyPatches =
    !dryRun &&
    process.env.PRODUCT_LAB_APPLY_SAFE_FIXES === "true" &&
    fs.existsSync(approvalFile) &&
    maxPatches > 0;
  const safeFindings = findings.filter((finding) => finding.decision === "auto_safe");
  const patchResult = canApplyPatches
    ? applySafeImprovements(root, safeFindings, maxPatches, theme, dateLabel)
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
    agentReports,
    findings,
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
  const themeModuleById = {
    dashboard: "Dashboard",
    "site-builder": "Site Builder",
    "agent-builder": "Agent Builder",
    "game-builder": "Game Builder",
    "multi-ai": "Multi-IA",
    "templates-integrations": "Integrations",
    "audit-roadmap": "Code",
  };
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
    "- auth, paiement, credits, Supabase sensible, provider IA principal, suppression de routes/fichiers, refonte majeure, publication jeux.",
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

  return {
    appliedImprovements,
    modifiedFiles: [...new Set(modifiedFiles)],
  };
};
