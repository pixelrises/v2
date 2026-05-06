#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const action = process.argv[2] || "help";
const root = process.cwd();

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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
    throw new Error(`Supabase REST ${response.status}: ${body.slice(0, 500)}`);
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

const pushProposals = async () => {
  if (!isConfigured()) {
    console.log("Product Lab Supabase proposal sync skipped: missing service role configuration.");
    return;
  }

  const queue = readJson("public/product-lab-review.json", null);
  if (!queue?.items?.length) {
    console.log("Product Lab Supabase proposal sync skipped: no review queue found.");
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

  await restFetch("product_lab_review_items?on_conflict=item_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  console.log(`Product Lab Supabase proposal sync complete: ${rows.length} item(s).`);
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

  const rows = await restFetch(
    [
      "product_lab_decisions",
      "?select=item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at,review_item,source_run",
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
          sourceTheme: typeof sourceRun.theme === "string" ? sourceRun.theme : "",
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
  const processedRun = {
    date: summary.date,
    week: summary.week,
    theme: summary.theme,
    appliedImprovements,
    modifiedFiles: Array.isArray(summary.modifiedFiles) ? summary.modifiedFiles : [],
  };

  for (const finding of approvedFindings) {
    if (!finding?.itemId) continue;

    await restFetch(`product_lab_decisions?item_id=eq.${encodeURIComponent(finding.itemId)}`, {
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

if (action === "push-proposals") {
  await pushProposals();
} else if (action === "pull-decisions") {
  await pullDecisions();
} else if (action === "mark-processed") {
  await markProcessedDecisions();
} else {
  console.log("Usage: node scripts/product-lab-supabase.mjs <pull-decisions|push-proposals|mark-processed>");
}
