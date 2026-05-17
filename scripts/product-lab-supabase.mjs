#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import {
  PRODUCT_LAB_SCOPES,
  buildProductLabPrStatusPayload,
  redactProductLabObject,
  redactProductLabText,
} from "./product-lab-governance.mjs";

const action = process.argv[2] || "help";
const root = process.cwd();
loadEnv({ path: path.join(root, ".env.local"), override: false, quiet: true });
loadEnv({ path: path.join(root, ".env"), override: false, quiet: true });

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PIXELRISES_SUPABASE_SERVICE_ROLE_KEY;

  return {
    url: url?.replace(/\/$/, ""),
    serviceRoleKey,
  };
};

const isConfigured = () => {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
};

const requireSync = () => process.env.PRODUCT_LAB_REQUIRE_SUPABASE_SYNC === "true";

const skipOrFail = (message) => {
  if (requireSync()) {
    throw new Error(message);
  }
  console.log(message);
};

const restFetch = async (resource, options = {}) => {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase sync skipped: SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.");
  }

  const response = await fetch(`${url}/rest/v1/${resource}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase REST ${response.status}: ${redactProductLabText(body.slice(0, 500))}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const readJson = (relativePath, fallback) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
};

const writeJson = (relativePath, value) => {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const toInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const normalizeRunSourceForDb = (value) =>
  ["scheduled", "manual", "local", "workflow_dispatch"].includes(value) ? value : "local";
const getScopeConfig = () => PRODUCT_LAB_SCOPES[process.env.PRODUCT_LAB_SCOPE || "v2"] ?? PRODUCT_LAB_SCOPES.v2;
const getReviewQueuePath = () => {
  if (process.env.PRODUCT_LAB_REVIEW_QUEUE_PATH) return process.env.PRODUCT_LAB_REVIEW_QUEUE_PATH;
  return (process.env.PRODUCT_LAB_SCOPE || "v2") === "v1"
    ? "public/product-lab-v1-review.json"
    : "public/product-lab-review.json";
};

const pushProposals = async () => {
  if (!isConfigured()) {
    skipOrFail("Product Lab Supabase proposal sync failed: missing service role configuration.");
    return;
  }

  const config = getScopeConfig();
  const queue = readJson(getReviewQueuePath(), null);
  if (!queue?.items?.length) {
    skipOrFail("Product Lab Supabase proposal sync failed: no review queue found.");
    return;
  }

  const rows = queue.items.map((item) => ({
    item_id: item.id,
    source_run: queue.sourceRun ?? {},
    queue_summary: queue.summary ?? {},
    review_item: item,
    decision_kind: item.decision === "auto_safe" ? "auto_safe" : "human_validation",
    title: item.title,
    module: item.module,
    priority: item.priority,
    risk: item.risk,
    status: "open",
    generated_at: queue.generatedAt ?? new Date().toISOString(),
  }));

  await restFetch(`${config.reviewTable}?on_conflict=item_id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  console.log(`Product Lab Supabase proposal sync complete: ${rows.length} item(s) for ${config.label}.`);
};

const pullDecisions = async () => {
  if (!isConfigured()) {
    writeJson("product-lab/state/admin-decisions.json", {
      pulledAt: new Date().toISOString(),
      configured: false,
      decisions: [],
    });
    console.log("Product Lab Supabase decision pull skipped: missing service role configuration.");
    return;
  }

  const config = getScopeConfig();
  const selectedColumns =
    config === PRODUCT_LAB_SCOPES.v1
      ? "item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at,review_item,source_run,pr_url,pr_number,pr_ready_at"
      : "item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at,review_item,source_run,application_status,processed_at,processed_run";

  const rows = await restFetch(
    [
      config.decisionsTable,
      `?select=${selectedColumns}`,
      "&status=eq.approved",
      "&automation_action=eq.authorize_next_run",
      "&order=decided_at.desc",
      "&limit=500",
    ].join(""),
    { method: "GET" },
  );

  const decisions = Array.isArray(rows)
    ? rows.map((row) => {
        const reviewItem = isObject(row.review_item) ? row.review_item : {};
        const sourceRun = isObject(row.source_run) ? row.source_run : {};

        return {
          itemId: row.item_id,
          title: typeof reviewItem.title === "string" ? reviewItem.title : "",
          module: typeof reviewItem.module === "string" ? reviewItem.module : "",
          priority: typeof reviewItem.priority === "string" ? reviewItem.priority : "",
          impact: typeof reviewItem.impact === "string" ? reviewItem.impact : "",
          risk: typeof reviewItem.risk === "string" ? reviewItem.risk : "",
          difficulty: typeof reviewItem.difficulty === "string" ? reviewItem.difficulty : "",
          inspiration: typeof reviewItem.inspiration === "string" ? reviewItem.inspiration : "",
          description: typeof reviewItem.description === "string" ? reviewItem.description : "",
          simpleSummary: typeof reviewItem.simpleSummary === "string" ? reviewItem.simpleSummary : "",
          beforeState: typeof reviewItem.beforeState === "string" ? reviewItem.beforeState : "",
          afterState: typeof reviewItem.afterState === "string" ? reviewItem.afterState : "",
          concernedFiles: Array.isArray(reviewItem.concernedFiles) ? reviewItem.concernedFiles : [],
          decisionKind: typeof reviewItem.decision === "string" ? reviewItem.decision : "",
          scoreImpact: Number.isFinite(Number(reviewItem.scoreImpact)) ? Number(reviewItem.scoreImpact) : 0,
          reviewItem,
          sourceTheme: typeof sourceRun.theme === "string" ? sourceRun.theme : "",
          sourceRun,
          status: row.status,
          note: row.admin_note ?? "",
          correctionRequest: row.correction_request ?? "",
          rejectionMode: row.rejection_mode ?? null,
          automationAction: row.automation_action,
          decidedAt: row.decided_at,
        };
      })
    : [];

  writeJson("product-lab/state/admin-decisions.json", {
    pulledAt: new Date().toISOString(),
    configured: true,
    decisions,
  });

  console.log(`Product Lab Supabase decision pull complete: ${decisions.length} approved item(s).`);
};

const markProcessedDecisions = async () => {
  if (!isConfigured()) {
    console.log("Product Lab Supabase decision processing sync skipped: missing service role configuration.");
    return;
  }

  const summary = readJson("product-lab/state/last-run-summary.json", null);
  const approvedFindings = Array.isArray(summary?.approvedFindings) ? summary.approvedFindings : [];
  const appliedImprovements = Array.isArray(summary?.appliedImprovements) ? summary.appliedImprovements : [];

  if (!approvedFindings.length || !appliedImprovements.length) {
    console.log("Product Lab Supabase decision processing sync skipped: no approved improvement was applied.");
    return;
  }

  const processedAt = new Date().toISOString();
  const autoMergeStatus = process.env.PRODUCT_LAB_AUTO_MERGE_STATUS || "not_requested";
  const autoMergeBlockReason = redactProductLabText(process.env.PRODUCT_LAB_AUTO_MERGE_BLOCK_REASON || "");
  const prUrl = process.env.PRODUCT_LAB_PR_URL || "";
  const prNumber = process.env.PRODUCT_LAB_PR_NUMBER || "";
  const branch = process.env.PRODUCT_LAB_BRANCH || "";
  const riskLevel = process.env.PRODUCT_LAB_RISK_LEVEL || "low";
  const touchedSensitiveFiles = (() => {
    try {
      return JSON.parse(process.env.PRODUCT_LAB_TOUCHED_SENSITIVE_FILES || "[]");
    } catch {
      return [];
    }
  })();
  const processedRun = {
    date: summary.date,
    week: summary.week,
    theme: summary.theme,
    appliedImprovements,
    modifiedFiles: Array.isArray(summary.modifiedFiles) ? summary.modifiedFiles : [],
    branch,
    prUrl,
    prNumber: prNumber ? Number(prNumber) : null,
    prStatus: prUrl ? "created" : "not_created",
    testStatus: process.env.PRODUCT_LAB_TEST_STATUS || "passed",
    buildStatus: process.env.PRODUCT_LAB_BUILD_STATUS || "passed",
    autoMergeStatus,
    autoMergeBlockReason,
    riskLevel,
    touchedSensitiveFiles,
  };

  for (const finding of approvedFindings) {
    if (!finding?.itemId) continue;

    await restFetch(`${getScopeConfig().decisionsTable}?item_id=eq.${encodeURIComponent(finding.itemId)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        automation_action: "hold",
        application_status: "pr_ready",
        processed_at: processedAt,
        processed_run: processedRun,
      }),
    });
  }

  console.log(`Product Lab Supabase decision processing sync complete: ${approvedFindings.length} item(s).`);
};

const recordPrStatus = async () => {
  if (!isConfigured()) {
    console.log("Product Lab PR status sync skipped: missing service role configuration.");
    return;
  }

  const config = getScopeConfig();
  const summary = readJson("product-lab/state/last-run-summary.json", null);
  const approvedFindings = Array.isArray(summary?.approvedFindings) ? summary.approvedFindings : [];
  if (!approvedFindings.length) {
    console.log("Product Lab PR status sync skipped: no approved decision in last run.");
    return;
  }

  const touchedSensitiveFiles = (() => {
    try {
      return JSON.parse(process.env.PRODUCT_LAB_TOUCHED_SENSITIVE_FILES || "[]");
    } catch {
      return [];
    }
  })();

  const payloads = approvedFindings
    .filter((finding) => finding?.itemId)
    .map((finding) =>
      buildProductLabPrStatusPayload({
        itemId: finding.itemId,
        branch: process.env.PRODUCT_LAB_BRANCH || "",
        prUrl: process.env.PRODUCT_LAB_PR_URL || "",
        prNumber: process.env.PRODUCT_LAB_PR_NUMBER || "",
        prStatus: process.env.PRODUCT_LAB_PR_STATUS || "created",
        testStatus: process.env.PRODUCT_LAB_TEST_STATUS || "passed",
        buildStatus: process.env.PRODUCT_LAB_BUILD_STATUS || "passed",
        autoMergeStatus: process.env.PRODUCT_LAB_AUTO_MERGE_STATUS || "not_requested",
        autoMergeBlockReason: process.env.PRODUCT_LAB_AUTO_MERGE_BLOCK_REASON || "",
        riskLevel: process.env.PRODUCT_LAB_RISK_LEVEL || finding.risk || "low",
        touchedSensitiveFiles,
        lastError: process.env.PRODUCT_LAB_LAST_ERROR || "",
      }),
    );

  await markProcessedDecisions();

  try {
    await restFetch(`${config.prStatusTable}?on_conflict=item_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payloads),
    });
    console.log(`Product Lab PR status sync complete: ${payloads.length} item(s) for ${config.label}.`);
  } catch (error) {
    console.log(
      redactProductLabText(
        `Product Lab PR status table sync skipped for ${config.label}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      ),
    );
  }
};

const recordRunStatus = async () => {
  if (!isConfigured()) {
    console.log("Product Lab run status sync skipped: missing service role configuration.");
    return;
  }

  const config = getScopeConfig();
  const summary = readJson("product-lab/state/last-run-summary.json", {});
  const queue = readJson(getReviewQueuePath(), {});
  const diagnostic = readJson("product-lab/state/phase12-diagnostic.json", {});
  const startedAt =
    process.env.PRODUCT_LAB_RUN_STARTED_AT ||
    diagnostic.generatedAt ||
    queue.generatedAt ||
    new Date().toISOString();
  const completedAt = process.env.PRODUCT_LAB_RUN_COMPLETED_AT || new Date().toISOString();
  const requestedSource =
    process.env.PRODUCT_LAB_RUN_SOURCE || (process.env.GITHUB_ACTIONS === "true" ? "scheduled" : "local");
  const source = normalizeRunSourceForDb(requestedSource);
  const mode = process.env.PRODUCT_LAB_MODE || (summary.dryRun ? "dryRun" : "proposalOnly");
  const runId =
    process.env.PRODUCT_LAB_RUN_ID ||
    queue?.sourceRun?.runId ||
    `${summary.date || new Date().toISOString().slice(0, 10)}-${summary.theme || "product-lab"}`;
  const proposalsGenerated = Array.isArray(queue.items) ? queue.items.length : 0;
  const reportSummary = redactProductLabObject({
    queueSummary: queue.summary ?? {},
    reportPath: queue?.sourceRun?.reportPath || `reports/product-lab/daily/daily-${summary.date || ""}.md`,
    requestedSource,
    approvedFindings: Array.isArray(summary.approvedFindings) ? summary.approvedFindings.length : 0,
    appliedImprovements: Array.isArray(summary.appliedImprovements) ? summary.appliedImprovements.length : 0,
    modifiedFiles: Array.isArray(summary.modifiedFiles) ? summary.modifiedFiles : [],
  });

  await restFetch(`${config.runsTable}?on_conflict=run_id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        run_id: runId,
        version: config.label.includes("V1") ? "v1" : "v2",
        source,
        mode,
        status: process.env.PRODUCT_LAB_RUN_STATUS || "completed",
        dry_run: Boolean(summary.dryRun),
        force_generate: process.env.PRODUCT_LAB_FORCE_GENERATE === "true",
        started_at: startedAt,
        completed_at: completedAt,
        proposals_generated: proposalsGenerated,
        proposals_saved: toInteger(process.env.PRODUCT_LAB_PROPOSALS_SAVED, proposalsGenerated),
        proposals_rejected: toInteger(queue?.summary?.rejectedVagueProposals, 0),
        errors_count: toInteger(process.env.PRODUCT_LAB_ERRORS_COUNT, 0),
        warnings_count: toInteger(process.env.PRODUCT_LAB_WARNINGS_COUNT, 0),
        commit_sha: process.env.GITHUB_SHA || "",
        branch: process.env.GITHUB_REF_NAME || process.env.PRODUCT_LAB_BRANCH || "",
        workflow_run_url:
          process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
            ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
            : "",
        report_summary: reportSummary,
      },
    ]),
  });

  await restFetch(`${config.reportsTable}?on_conflict=run_id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        run_id: runId,
        version: config.label.includes("V1") ? "v1" : "v2",
        report_path: reportSummary.reportPath || "",
        summary: reportSummary,
        created_at: completedAt,
      },
    ]),
  });

  console.log(`Product Lab run status sync complete for ${config.label}: ${runId}.`);
};

if (action === "push-proposals") {
  await pushProposals();
} else if (action === "pull-decisions") {
  await pullDecisions();
} else if (action === "mark-processed") {
  await markProcessedDecisions();
} else if (action === "record-pr-status") {
  await recordPrStatus();
} else if (action === "record-run") {
  await recordRunStatus();
} else {
  console.log(
    "Usage: node scripts/product-lab-supabase.mjs <pull-decisions|push-proposals|mark-processed|record-pr-status|record-run>",
  );
}
