#!/usr/bin/env node
import fs from "node:fs";
import { execFileSync } from "node:child_process";

export const PRODUCT_LAB_SCOPES = {
  v2: {
    label: "Pixelrises V2",
    reviewTable: "product_lab_review_items",
    decisionsTable: "product_lab_decisions",
    prStatusTable: "product_lab_pr_status",
    runsTable: "product_lab_runs",
    reportsTable: "product_lab_reports",
  },
};

export const SENSITIVE_FILE_RULES = [
  { prefix: ".github/workflows/", reason: "workflow GitHub sensible" },
  { prefix: "supabase/migrations/", reason: "migration Supabase/RLS a valider manuellement" },
  { prefix: "supabase/functions/", reason: "fonction serveur Supabase sensible" },
  { prefix: "src/lib/auth", reason: "authentification" },
  { prefix: "src/lib/billing", reason: "prix, credits et rentabilite" },
  { prefix: "src/lib/credits", reason: "credits utilisateurs" },
  { prefix: "src/lib/supabase", reason: "client Supabase / acces donnees" },
  { prefix: "src/lib/stripe", reason: "paiement Stripe" },
  { prefix: "src/modules/billing", reason: "facturation" },
  { prefix: "src/modules/credits", reason: "credits utilisateurs" },
  { prefix: "src/modules/security", reason: "securite donnees" },
  { prefix: "src/modules/ai/config/ai-routing.config", reason: "provider IA principal / routing modele" },
  { prefix: "src/modules/ai/config/ai-providers.config", reason: "catalogue modeles IA et couts gateway" },
  { prefix: "src/modules/ai/backend-orchestrator", reason: "orchestration IA serveur" },
  { prefix: "src/modules/ai/orchestrator", reason: "orchestration IA" },
  { prefix: "src/pages/admin", reason: "permissions et cockpit admin" },
  { prefix: "src/modules/admin", reason: "module admin" },
  { prefix: "package.json", reason: "scripts projet et dependances" },
  { prefix: "package-lock.json", reason: "verrouillage dependances" },
  { prefix: "scripts/product-lab-core", reason: "logique centrale Product Lab / application patches" },
  { prefix: "scripts/product-lab.mjs", reason: "runner Product Lab" },
  { prefix: "scripts/product-lab-supabase", reason: "sync decisions Product Lab vers Supabase" },
  { prefix: "scripts/product-lab-governance", reason: "gouvernance auto-merge Product Lab" },
];

const TOKEN_SECRET_PATTERNS = [
  /\b(vck_[A-Za-z0-9_-]{20,})\b/g,
  /\b(sk-[A-Za-z0-9_-]{16,})\b/g,
  /\b(sk_(?:live|test)_[A-Za-z0-9]{16,})\b/g,
  /\b(whsec_[A-Za-z0-9]{16,})\b/g,
  /\b(sb_secret_[A-Za-z0-9_-]{16,})\b/g,
  /\b(service_role[A-Za-z0-9_.-]{8,})\b/gi,
  /\b(Bearer\s+)[A-Za-z0-9._-]{12,}\b/g,
];

const PERSONAL_DATA_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /(?<![A-Za-z0-9])(?=(?:[\d\s().-]*\d){10,})\+?\d[\d\s().-]{8,}\d(?![A-Za-z0-9])/g,
];

const normalizePath = (filePath) =>
  String(filePath ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .toLowerCase()
    .trim();

export const redactProductLabText = (value) =>
  [...TOKEN_SECRET_PATTERNS, ...PERSONAL_DATA_PATTERNS].reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    String(value ?? ""),
  );

export const redactProductLabSecretsOnly = (value) =>
  TOKEN_SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), String(value ?? ""));

export const redactProductLabObject = (value) => {
  if (Array.isArray(value)) return value.map(redactProductLabObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactProductLabObject(entry)]));
  }
  return typeof value === "string" ? redactProductLabText(value) : value;
};

export const classifySensitiveFiles = (files) => {
  const touched = [];

  for (const originalPath of files ?? []) {
    const file = normalizePath(originalPath);
    if (!file) continue;

    const envFile = file === ".env" || file.startsWith(".env.") || file.includes("/.env");
    const matchedRule = SENSITIVE_FILE_RULES.find((rule) => file.startsWith(rule.prefix));
    if (envFile || matchedRule) {
      touched.push({
        file: originalPath,
        reason: envFile ? "variable d'environnement ou secret potentiel" : matchedRule.reason,
      });
    }
  }

  return touched;
};

const normalizeRisk = (risk) => {
  const text = String(risk ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (text.includes("critique") || text.includes("eleve") || text.includes("high")) return "high";
  if (text.includes("moyen") || text.includes("medium")) return "medium";
  return "low";
};

export const getHighestRiskLevel = (items) => {
  const levels = (items ?? []).map((item) => normalizeRisk(item?.risk));
  if (levels.includes("high")) return "high";
  if (levels.includes("medium")) return "medium";
  return "low";
};

export const isAdminApprovedDecision = (decision) =>
  decision?.status === "approved" &&
  (decision?.automationAction === "authorize_next_run" || decision?.automation_action === "authorize_next_run");

const containsSpecificEvidence = (item) => {
  const text = [
    item?.title,
    item?.summary,
    item?.simpleSummary,
    item?.description,
    item?.problem,
    item?.proposed_fix,
    item?.afterState,
    item?.beforeState,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hasFiles = Array.isArray(item?.concernedFiles)
    ? item.concernedFiles.length > 0
    : Array.isArray(item?.files)
      ? item.files.length > 0
      : false;

  return (
    hasFiles &&
    (text.includes("ajouter") ||
      text.includes("corriger") ||
      text.includes("remplacer") ||
      text.includes("clarifier") ||
      text.includes("afficher") ||
      text.includes("brancher") ||
      text.includes("tester") ||
      text.includes("score") ||
      text.includes("fichier"))
  );
};

export const isVagueProductLabProposal = (item) => {
  const title = String(item?.title ?? "").toLowerCase().trim();
  const text = [item?.title, item?.summary, item?.simpleSummary, item?.description].filter(Boolean).join(" ");
  const tooShort = text.trim().length < 90;
  const vagueTitle = [
    "ameliorer l'ux",
    "améliorer l'ux",
    "optimiser le design",
    "rendre plus performant",
    "corriger les bugs",
    "ameliorer le produit",
    "améliorer le produit",
  ].some((phrase) => title === phrase || title.startsWith(`${phrase}.`));

  return vagueTitle || tooShort || !containsSpecificEvidence(item);
};

export const filterActionableProductLabProposals = (items) =>
  (items ?? []).filter((item) => !isVagueProductLabProposal(item));

export const getChangedFiles = (root = process.cwd()) => {
  try {
    const output = execFileSync("git", ["diff", "--name-only", "HEAD", "--"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const statusOutput = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const tracked = output.split(/\r?\n/).filter(Boolean);
    const statusFiles = statusOutput
      .split(/\r?\n/)
      .map((line) => line.slice(3).trim())
      .filter(Boolean)
      .map((line) => line.split(" -> ").pop());

    return [...new Set([...tracked, ...statusFiles])];
  } catch {
    return [];
  }
};

export const evaluateAutoMergeSafety = ({
  adminApproved = false,
  checksPassed = false,
  approvedFindings = [],
  changedFiles = [],
  forceRiskLevel,
} = {}) => {
  const reasons = [];
  const touchedSensitiveFiles = classifySensitiveFiles(changedFiles);
  const riskLevel = forceRiskLevel || getHighestRiskLevel(approvedFindings);

  if (!adminApproved) reasons.push("aucune validation admin approuvee");
  if (!checksPassed) reasons.push("lint/test/build/smoke non valides");
  if (!approvedFindings.length) reasons.push("aucune amelioration approuvee appliquee");
  if (riskLevel === "high") reasons.push("risque eleve");
  if (touchedSensitiveFiles.length) {
    reasons.push(`fichiers sensibles modifies: ${touchedSensitiveFiles.map((item) => item.file).join(", ")}`);
  }

  const allowed = reasons.length === 0;

  return {
    allowed,
    riskLevel,
    autoMergeStatus: allowed ? "eligible" : "blocked",
    blockReason: reasons.join(" ; "),
    touchedSensitiveFiles,
    changedFiles,
  };
};

export const buildProductLabPrStatusPayload = ({
  itemId,
  decisionId = "",
  branch = "",
  prUrl = "",
  prNumber = "",
  prStatus = "not_created",
  testStatus = "pending",
  buildStatus = "pending",
  autoMergeStatus = "not_requested",
  autoMergeBlockReason = "",
  riskLevel = "low",
  touchedSensitiveFiles = [],
  lastError = "",
} = {}) => ({
  item_id: itemId,
  decision_id: decisionId || null,
  branch,
  pr_url: prUrl,
  pr_number: prNumber ? Number(prNumber) : null,
  pr_status: prStatus,
  test_status: testStatus,
  build_status: buildStatus,
  auto_merge_status: autoMergeStatus,
  auto_merge_block_reason: redactProductLabText(autoMergeBlockReason),
  risk_level: riskLevel,
  touched_sensitive_files: redactProductLabObject(touchedSensitiveFiles),
  last_error: redactProductLabText(lastError),
});

export const readLastRunSummary = (root = process.cwd()) => {
  const summaryPath = `${root}/product-lab/state/last-run-summary.json`;
  if (!fs.existsSync(summaryPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  } catch {
    return {};
  }
};

const setGithubOutput = (values) => {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, " ")}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`, "utf8");
  } else {
    console.log(lines.join("\n"));
  }
};

export const evaluateCurrentRunAutoMergeSafety = (root = process.cwd()) => {
  const summary = readLastRunSummary(root);
  const approvedFindings = Array.isArray(summary.approvedFindings) ? summary.approvedFindings : [];
  const changedFiles = getChangedFiles(root);
  const checksPassed = process.env.PRODUCT_LAB_CHECKS_PASSED === "true";
  const adminApproved = approvedFindings.length > 0;
  const result = evaluateAutoMergeSafety({
    adminApproved,
    checksPassed,
    approvedFindings,
    changedFiles,
  });

  fs.mkdirSync(`${root}/product-lab/state`, { recursive: true });
  fs.writeFileSync(
    `${root}/product-lab/state/auto-merge-status.json`,
    `${JSON.stringify(redactProductLabObject({ evaluatedAt: new Date().toISOString(), ...result }), null, 2)}\n`,
    "utf8",
  );

  setGithubOutput({
    auto_merge_allowed: result.allowed ? "true" : "false",
    auto_merge_status: result.autoMergeStatus,
    auto_merge_block_reason: result.blockReason || "none",
    risk_level: result.riskLevel,
    touched_sensitive_files: JSON.stringify(result.touchedSensitiveFiles),
    changed_files: JSON.stringify(result.changedFiles),
  });

  return result;
};

export const checkProductLabReportRedaction = (root = process.cwd()) => {
  const targets = [
    "product-lab/backlog.md",
    "product-lab/state/last-run-summary.json",
    "product-lab/state/auto-merge-status.json",
    "public/product-lab-review.json",
  ];
  const reportDir = `${root}/reports/product-lab/daily`;
  if (fs.existsSync(reportDir)) {
    for (const file of fs.readdirSync(reportDir)) {
      if (file.endsWith(".md")) targets.push(`reports/product-lab/daily/${file}`);
    }
  }

  const leakingFiles = targets.filter((relativePath) => {
    const absolutePath = `${root}/${relativePath}`;
    if (!fs.existsSync(absolutePath)) return false;
    const content = fs.readFileSync(absolutePath, "utf8");
    return redactProductLabSecretsOnly(content) !== content;
  });

  if (leakingFiles.length) {
    throw new Error(`Product Lab redaction check failed: ${leakingFiles.join(", ")}`);
  }

  console.log("Product Lab redaction check passed.");
  return true;
};

if (process.argv[1]?.endsWith("product-lab-governance.mjs")) {
  const action = process.argv[2] || "help";
  if (action === "evaluate-auto-merge") {
    evaluateCurrentRunAutoMergeSafety(process.cwd());
  } else if (action === "check-redaction") {
    checkProductLabReportRedaction(process.cwd());
  } else {
    console.log("Usage: node scripts/product-lab-governance.mjs <evaluate-auto-merge|check-redaction>");
  }
}
