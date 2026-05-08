#!/usr/bin/env node
import { runProductLab } from "./product-lab-core.mjs";

const args = process.argv.slice(2);
const action = args.find((arg) => !arg.startsWith("--")) || "daily";
const dryRun = args.includes("--dry-run") || process.env.PRODUCT_LAB_DRY_RUN === "true";
const runChecksEnabled = args.includes("--run-checks");
const themeIndex = args.indexOf("--theme");
const forcedTheme = themeIndex >= 0 ? args[themeIndex + 1] : undefined;
const json = args.includes("--json");

const result = runProductLab({
  root: process.cwd(),
  action,
  dryRun,
  forcedTheme,
  runChecksEnabled,
});

const summary = {
  productLab: "Pixelrises Continuous Product Lab",
  action: result.action,
  dryRun: result.dryRun,
  date: result.date,
  theme: result.theme.id,
  reportPath: result.reportPath,
  backlogPath: result.backlogPath,
  maxPatches: result.maxPatches,
  appliedImprovements: result.appliedImprovements.length,
  autoSafeProposals: result.findings.filter((finding) => finding.decision === "auto_safe").length,
  humanValidationProposals: result.findings.filter((finding) => finding.decision === "human_validation").length,
  researchMode: result.researchEvidence.mode,
  verifiedResearchSources: result.researchEvidence.verifiedCount,
  totalResearchSources: result.researchEvidence.total,
  checks: result.checks,
};

if (json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log("Pixelrises Continuous Product Lab");
  console.log(`- Date: ${summary.date}`);
  console.log(`- Theme: ${summary.theme}`);
  console.log(`- Dry-run: ${summary.dryRun ? "yes" : "no"}`);
  console.log(`- Max patches: ${summary.maxPatches}`);
  console.log(`- Report: ${summary.reportPath}`);
  console.log(`- Backlog: ${summary.backlogPath}`);
  console.log(`- Auto-safe proposals: ${summary.autoSafeProposals}`);
  console.log(`- Human validation proposals: ${summary.humanValidationProposals}`);
  console.log(`- Research: ${summary.researchMode} (${summary.verifiedResearchSources}/${summary.totalResearchSources} verified)`);
}
