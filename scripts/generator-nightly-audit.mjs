import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { generatorQualityCases, dailyCreditBudget } from "./generator-quality-cases.mjs";
import { analyzeSourceHealth, scoreQualityCase } from "./generator-quality-scorer.mjs";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports", "nightly");
const MODE = process.argv.includes("--mode")
  ? process.argv[process.argv.indexOf("--mode") + 1] || "nightly"
  : "nightly";

const readIfExists = (relativePath) => {
  const absolutePath = path.join(ROOT, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
};

const runGit = (args) => {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    return `ERROR: ${error.stderr?.toString().trim() || error.message}`;
  }
};

const getParisDateParts = () => {
  const formatter = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
};

const escapeTable = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");

const renderScoreTable = (caseResults) => {
  const header =
    "| Cas QA | Score | Brief | Vision | Hero | CTA | Variete | Structure | SEO | FAQ | Anti-generique | Verdict |\n" +
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n";
  const rows = caseResults
    .map((result) => {
      const s = result.metricScores;
      return [
        escapeTable(result.label),
        result.score,
        s.respectBrief,
        s.respectVision,
        s.heroQuality,
        s.ctaCoherence,
        s.designVariety,
        s.structureFit,
        s.localSeo,
        s.faqUsefulness,
        s.antiGeneric,
        result.passed ? "OK" : "A corriger",
      ].join(" | ");
    })
    .map((row) => `| ${row} |`)
    .join("\n");
  return `${header}${rows}`;
};

const renderFindingsTable = (findings) => {
  if (!findings.length) return "Aucun probleme critique detecte par l'audit statique.";
  const header =
    "| Gravite | Titre | Fichier | Probleme | Recommandation |\n" +
    "| --- | --- | --- | --- | --- |\n";
  const rows = findings
    .map((finding) =>
      [
        finding.severity,
        escapeTable(finding.title),
        escapeTable(finding.file),
        escapeTable(finding.problem),
        escapeTable(finding.recommendation),
      ].join(" | "),
    )
    .map((row) => `| ${row} |`)
    .join("\n");
  return `${header}${rows}`;
};

const renderCaseIssues = (caseResults) => {
  const issueLines = [];
  for (const result of caseResults) {
    if (!result.issues.length && result.passed) continue;
    issueLines.push(`### ${result.label}`);
    issueLines.push(`- Score: ${result.score}/100`);
    if (!result.issues.length) {
      issueLines.push("- Aucun probleme detaille, mais score sous le seuil global.");
      continue;
    }
    for (const issue of result.issues) {
      issueLines.push(`- ${issue.severity}: ${issue.problem} Recommendation: ${issue.recommendation}`);
    }
  }
  return issueLines.length ? issueLines.join("\n") : "Tous les cas QA atteignent le seuil de 75/100.";
};

const main = () => {
  const { date, time } = getParisDateParts();
  const sources = {
    generateSite: readIfExists("supabase/functions/generate-site/index.ts"),
    aiPage: readIfExists("src/pages/PixelrisesAI.tsx"),
    preview: readIfExists("src/pages/Preview.tsx"),
    smoke: readIfExists("scripts/smoke-generate-site.mjs"),
    generatorTests: readIfExists("src/test/generator-prompt-contract.test.ts"),
    packageJson: readIfExists("package.json"),
  };

  const sourceHealth = analyzeSourceHealth(sources);
  const caseResults = generatorQualityCases.map((testCase) => scoreQualityCase(testCase, sources));
  const failedCases = caseResults.filter((result) => !result.passed);
  const hasP0 = sourceHealth.findings.some((finding) => finding.severity === "P0");
  const verdict = hasP0 ? "BLOQUE" : failedCases.length ? "OK AVEC AJUSTEMENTS" : "OK - amelioration sure";

  const branch = runGit(["branch", "--show-current"]);
  const status = runGit(["status", "--short", "--branch"]);
  const recentCommits = runGit(["log", "--oneline", "-10"]);
  const diffStat = runGit(["diff", "--stat"]);

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `${date}-generator-report.md`);

  const report = [
    `# Rapport nightly generateur Pixelrises - ${date}`,
    "",
    "## Resume",
    `- Mode: ${MODE}`,
    `- Heure Paris: ${date} ${time}`,
    `- Branche: ${branch || "inconnue"}`,
    `- Verdict: ${verdict}`,
    `- Budget credits: ${dailyCreditBudget.realGenerations} generation reelle, ${dailyCreditBudget.geminiCalls} appel Gemini, consommation credits: ${dailyCreditBudget.consumesCredits ? "oui" : "non"}`,
    "- Securite: aucun appel Gemini reel, aucun smoke consommateur, aucun deploy, aucun commit, aucun push.",
    "",
    "## Etat Git",
    "```text",
    status || "(git status vide)",
    "",
    recentCommits || "(aucun commit lu)",
    "",
    diffStat || "(aucun diff tracked)",
    "```",
    "",
    "## Scores QA",
    renderScoreTable(caseResults),
    "",
    "## Problemes detectes",
    renderFindingsTable(sourceHealth.findings),
    "",
    "## Cas sous surveillance",
    renderCaseIssues(caseResults),
    "",
    "## Garde-fous detectes",
    `- Score garde-fous source: ${sourceHealth.score}/10`,
    `- Phrases generiques traquees: ${sourceHealth.genericGateHits.length}`,
    "",
    "| Garde-fou | Score | Statut | Manquants |",
    "| --- | ---: | --- | --- |",
    ...sourceHealth.guardResults.map((guard) =>
      `| ${escapeTable(guard.label)} | ${guard.score}/10 | ${guard.ok ? "OK" : "A renforcer"} | ${escapeTable(guard.missing.join(", ") || "-")} |`,
    ),
    "",
    "## Fichiers analyses",
    "- supabase/functions/generate-site/index.ts",
    "- src/pages/PixelrisesAI.tsx",
    "- src/pages/Preview.tsx",
    "- scripts/smoke-generate-site.mjs",
    "- src/test/generator-prompt-contract.test.ts",
    "- package.json",
    "",
    "## Prochaines actions recommandees",
    failedCases.length
      ? "- Priorite: traiter les cas QA sous 75/100 dans une branche dediee, puis relancer ce rapport."
      : "- Continuer la surveillance quotidienne. Aucun patch automatique n'est applique en V1.",
    sourceHealth.findings.length
      ? "- Revoir les recommandations du tableau problemes detectes avant toute merge."
      : "- Aucun probleme statique bloquant detecte.",
    "",
    "## Notes",
    "- Ce rapport est volontairement non destructif.",
    "- Pour lancer de vraies generations, utiliser un compte test et un workflow separe avec budget explicite.",
    "- La production reste protegee: validation humaine obligatoire avant merge/deploiement.",
    "",
  ].join("\n");

  fs.writeFileSync(reportPath, report, "utf8");

  console.log(`Nightly generator report written: ${path.relative(ROOT, reportPath)}`);
  console.log(`Verdict: ${verdict}`);
  console.log(`Credit budget: ${dailyCreditBudget.realGenerations} real generations`);
  console.table(
    caseResults.map((result) => ({
      id: result.id,
      score: result.score,
      passed: result.passed,
    })),
  );

  if (hasP0) {
    process.exitCode = 1;
  }
};

main();
