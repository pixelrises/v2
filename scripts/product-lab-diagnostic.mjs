#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { runProductLab, getProductLabScheduleInfo } from "./product-lab-core.mjs";
import { redactProductLabObject, redactProductLabText } from "./product-lab-governance.mjs";

const root = process.cwd();
loadEnv({ path: path.join(root, ".env.local"), override: false, quiet: true });
loadEnv({ path: path.join(root, ".env"), override: false, quiet: true });
const args = process.argv.slice(2);
const hasArg = (name) => args.includes(name);
const readArg = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || fallback : fallback;
};

const dryRun = !hasArg("--real");
const forceGenerate = hasArg("--force-generate") || process.env.PRODUCT_LAB_FORCE_GENERATE === "true";
const forcedTheme = readArg("--theme", "audit-roadmap");
const maxProposals = readArg("--max-proposals", process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS || "3");
const mode = readArg("--mode", dryRun ? "dryRun" : "proposalOnly");
const today = new Date();

if (maxProposals) process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS = maxProposals;
if (forceGenerate) process.env.PRODUCT_LAB_FORCE_GENERATE = "true";

const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const readText = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
};
const writeJson = (relativePath, value) => {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(redactProductLabObject(value), null, 2)}\n`, "utf8");
};
const writeText = (relativePath, value) => {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, redactProductLabText(value), "utf8");
};

const workflowPath = ".github/workflows/product-lab-nightly.yml";
const workflow = readText(workflowPath);
const workflowAudit = {
  exists: exists(workflowPath),
  hasSummerCron: workflow.includes('cron: "0 22 * * *"'),
  hasWinterCron: workflow.includes('cron: "0 23 * * *"'),
  hasWorkflowDispatch: workflow.includes("workflow_dispatch:"),
  hasDryRunInput: workflow.includes("dryRun:"),
  hasForceGenerateInput: workflow.includes("forceGenerate:"),
  hasMaxProposalsInput: workflow.includes("maxProposals:"),
  hasModeInput: workflow.includes("mode:"),
  hasSupabasePush: workflow.includes("npm run product-lab:proposals:push"),
  hasRunStatusSync: workflow.includes("product-lab:run-status:record"),
  hasAutoMergeGuard: workflow.includes("Evaluate controlled Product Lab auto-merge"),
};

const migrationBundle = fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .filter((file) => file.endsWith(".sql"))
  .map((file) => fs.readFileSync(path.join(root, "supabase/migrations", file), "utf8"))
  .join("\n");

const supabaseAudit = {
  reviewItems: migrationBundle.includes("public.product_lab_review_items"),
  decisions: migrationBundle.includes("public.product_lab_decisions"),
  prStatus: migrationBundle.includes("public.product_lab_pr_status"),
  runs: migrationBundle.includes("public.product_lab_runs"),
  reports: migrationBundle.includes("public.product_lab_reports"),
  rls: /alter table public\.product_lab_review_items enable row level security/i.test(migrationBundle),
  grants: /grant[\s\S]*public\.product_lab_review_items[\s\S]*to authenticated/i.test(migrationBundle),
  anonRevoked: /revoke all on table[\s\S]*public\.product_lab_review_items[\s\S]*from anon/i.test(migrationBundle),
};

const envAudit = {
  VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PIXELRISES_SUPABASE_SERVICE_ROLE_KEY,
  ),
  AI_GATEWAY_API_KEY: Boolean(process.env.AI_GATEWAY_API_KEY),
  GITHUB_TOKEN: Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN),
};

const result = runProductLab({
  root,
  action: "daily",
  dryRun,
  forcedTheme,
  date: today,
});

const queuePath = "public/product-lab-review.json";
const queue = JSON.parse(readText(queuePath));
const max = Math.max(1, Math.min(5, Number.parseInt(maxProposals, 10) || 3));
const testProposalId = `${result.date}-phase12-product-lab-diagnostic-test`;

if (forceGenerate) {
  const diagnosticProposal = {
    id: testProposalId,
    title: "Clarifier l'etat vide Product Lab dans l'admin",
    module: "Product Lab",
    simpleSummary:
      "Ajouter un message plus clair quand aucune proposition live n'est synchronisee, avec prochain lancement et action manuelle GitHub.",
    priority: "Important",
    impact: "Eleve",
    risk: "Faible",
    difficulty: "Faible",
    status: "Test non destructif",
    inspiration: "Linear / GitHub Actions",
    decision: "human_validation",
    description:
      "Cette proposition test verifie que la file admin peut recevoir une amelioration non destructive sans creer de PR ni modifier une zone sensible.",
    scoreImpact: 12,
    sourceReport: `reports/product-lab/diagnostics/phase12-${result.date}.md`,
    automationPolicy:
      "Validation humaine requise. Cette proposition Phase 12 ne doit pas creer de PR sans decision admin synchronisee.",
    concernedFiles: ["src/pages/Admin.tsx", "scripts/product-lab-diagnostic.mjs", "src/test/phase12-product-lab.test.ts"],
    beforeState: "Si le workflow ne synchronise pas Supabase, l'admin peut sembler vide ou ancien.",
    afterState: "L'admin affiche clairement dernier run, prochain run, source et chemin de test manuel.",
    dataState: "real",
  };

  queue.items = [diagnosticProposal, ...queue.items.filter((item) => item.id !== testProposalId)].slice(0, max);
  queue.summary.total = queue.items.length;
  queue.summary.actionableTotal = queue.items.length;
  queue.summary.dailySummary =
    "Diagnostic Phase 12: proposition test non destructive generee localement pour verifier l'affichage admin et la boucle de validation.";
  fs.writeFileSync(path.join(root, queuePath), `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

const schedule = getProductLabScheduleInfo(today);
const diagnostic = {
  generatedAt: new Date().toISOString(),
  source: "local",
  mode,
  dryRun,
  forceGenerate,
  workflow: workflowAudit,
  schedule,
  env: envAudit,
  supabase: supabaseAudit,
  result: {
    date: result.date,
    theme: result.theme.id,
    reportPath: result.reportPath,
    queuePath,
    proposalsGenerated: queue.items.length,
    testProposalId: forceGenerate ? testProposalId : null,
    approvedFindings: result.approvedFindings.length,
    appliedImprovements: result.appliedImprovements.length,
  },
  blockers: [
    !workflowAudit.hasWorkflowDispatch ? "workflow_dispatch absent" : "",
    !workflowAudit.hasDryRunInput ? "input dryRun absent" : "",
    !workflowAudit.hasForceGenerateInput ? "input forceGenerate absent" : "",
    !workflowAudit.hasMaxProposalsInput ? "input maxProposals absent" : "",
    !workflowAudit.hasRunStatusSync ? "sync run status absent" : "",
    !envAudit.SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY non present localement" : "",
    !supabaseAudit.runs ? "table product_lab_runs non preparee" : "",
  ].filter(Boolean),
};

const report = `# Phase 12 - Product Lab Diagnostic - ${result.date}

## Resume
- Mode: ${mode}
- Dry-run: ${dryRun ? "oui" : "non"}
- Force generate: ${forceGenerate ? "oui" : "non"}
- Propositions visibles: ${diagnostic.result.proposalsGenerated}
- Proposition test: ${diagnostic.result.testProposalId ?? "non demandee"}

## Schedule
- Heure cible: ${schedule.targetLocalTime}
- Cron UTC actifs: ${schedule.configuredCronsUtc.join(", ")}
- Aujourd'hui, minuit France correspond a: ${schedule.activeMidnightUtcLabel}
- Note: ${schedule.note}

## Workflow
- product-lab-nightly.yml: ${workflowAudit.exists ? "present" : "absent"}
- workflow_dispatch: ${workflowAudit.hasWorkflowDispatch ? "present" : "absent"}
- inputs dryRun/forceGenerate/maxProposals/mode: ${
  workflowAudit.hasDryRunInput &&
  workflowAudit.hasForceGenerateInput &&
  workflowAudit.hasMaxProposalsInput &&
  workflowAudit.hasModeInput
    ? "OK"
    : "incomplet"
}
- sync Supabase propositions: ${workflowAudit.hasSupabasePush ? "present" : "absent"}
- sync statut run: ${workflowAudit.hasRunStatusSync ? "present" : "absent"}

## Supabase
- review items: ${supabaseAudit.reviewItems ? "prepare" : "manquant"}
- decisions: ${supabaseAudit.decisions ? "prepare" : "manquant"}
- PR status: ${supabaseAudit.prStatus ? "prepare" : "manquant"}
- runs/reports: ${supabaseAudit.runs && supabaseAudit.reports ? "prepare" : "manquant"}
- RLS/GRANT: ${supabaseAudit.rls && supabaseAudit.grants ? "prepare" : "a verifier"}

## Secrets locaux
- URL Supabase: ${envAudit.VITE_SUPABASE_URL ? "present" : "manquant"}
- Service role: ${envAudit.SUPABASE_SERVICE_ROLE_KEY ? "present" : "manquant"}
- IA: ${envAudit.AI_GATEWAY_API_KEY ? "present" : "manquant"}
- GitHub token: ${envAudit.GITHUB_TOKEN ? "present" : "manquant"}

## Blocages
${diagnostic.blockers.length ? diagnostic.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- Aucun blocage local critique detecte."}
`;

writeJson("product-lab/state/phase12-diagnostic.json", diagnostic);
writeText(`reports/product-lab/diagnostics/phase12-${result.date}.md`, report);

console.log(
  JSON.stringify(
    redactProductLabObject({
      ok: diagnostic.blockers.length === 0,
      report: `reports/product-lab/diagnostics/phase12-${result.date}.md`,
      queue: queuePath,
      proposalsGenerated: diagnostic.result.proposalsGenerated,
      testProposalId: diagnostic.result.testProposalId,
      blockers: diagnostic.blockers,
      schedule: {
        targetLocalTime: schedule.targetLocalTime,
        activeMidnightUtcLabel: schedule.activeMidnightUtcLabel,
      },
    }),
    null,
    2,
  ),
);
