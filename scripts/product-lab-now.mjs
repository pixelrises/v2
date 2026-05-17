#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const maxIndex = args.indexOf("--max-proposals");
const modeIndex = args.indexOf("--mode");
const sourceIndex = args.indexOf("--source");

const maxProposals = maxIndex >= 0 ? args[maxIndex + 1] : process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS || "8";
const mode = dryRun
  ? "dryRun"
  : modeIndex >= 0
    ? args[modeIndex + 1]
    : process.env.PRODUCT_LAB_MODE || "proposalOnly";
const source = sourceIndex >= 0 ? args[sourceIndex + 1] : process.env.PRODUCT_LAB_RUN_SOURCE || "local";
const startedAt = new Date().toISOString();
const shouldApplyFixes = mode === "prMode" || mode === "autoMergeControlled";

const run = (label, commandArgs, extraEnv = {}) => {
  console.log(`\nProduct Lab now - ${label}`);
  const result = spawnSync(process.execPath, commandArgs, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("pull admin decisions and open backlog", ["scripts/product-lab-supabase.mjs", "pull-decisions"], {
  PRODUCT_LAB_MODE: mode,
});

run("generate proposals", [
  "scripts/product-lab.mjs",
  "daily",
  "--mode",
  mode,
  "--max-proposals",
  maxProposals,
  "--force-generate",
], {
  PRODUCT_LAB_MODE: mode,
  PRODUCT_LAB_DRY_RUN: dryRun ? "true" : "false",
  PRODUCT_LAB_APPLY_SAFE_FIXES: shouldApplyFixes ? "true" : "false",
  PRODUCT_LAB_FORCE_GENERATE: "true",
  PRODUCT_LAB_MAX_REVIEW_ITEMS: maxProposals,
  PRODUCT_LAB_RUN_SOURCE: source,
  PRODUCT_LAB_RUN_STARTED_AT: startedAt,
});

if (dryRun) {
  console.log("\nProduct Lab now - dry-run complete. No Supabase write was attempted.");
  process.exit(0);
}

run("AI review", ["scripts/product-lab-ai-review.mjs"], {
  PRODUCT_LAB_MODE: mode,
  PRODUCT_LAB_MAX_REVIEW_ITEMS: maxProposals,
});

run("push proposals to Supabase", ["scripts/product-lab-supabase.mjs", "push-proposals"], {
  PRODUCT_LAB_REQUIRE_SUPABASE_SYNC: "true",
  PRODUCT_LAB_MODE: mode,
  PRODUCT_LAB_FORCE_GENERATE: "true",
  PRODUCT_LAB_RUN_SOURCE: source,
  PRODUCT_LAB_RUN_STARTED_AT: startedAt,
});

run("record run status", ["scripts/product-lab-supabase.mjs", "record-run"], {
  PRODUCT_LAB_REQUIRE_SUPABASE_SYNC: "true",
  PRODUCT_LAB_MODE: mode,
  PRODUCT_LAB_FORCE_GENERATE: "true",
  PRODUCT_LAB_RUN_SOURCE: source,
  PRODUCT_LAB_RUN_STARTED_AT: startedAt,
  PRODUCT_LAB_RUN_STATUS: "completed",
});

console.log("\nProduct Lab now - proposals saved and run recorded.");
