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
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PIXELRISES_SUPABASE_SERVICE_ROLE_KEY;

  return {
    url: rawUrl?.trim().replace(/\/+$/, ""),
    serviceRoleKey: rawServiceRoleKey?.trim(),
  };
};

const isConfigured = () => {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
};

const getSupabaseProjectRef = () => {
  const { url } = getSupabaseConfig();
  try {
    return new URL(url).hostname.split(".")[0] || "unknown";
  } catch {
    return "invalid-url";
  }
};

const getJwtPayload = (token) => {
  try {
    const [, payload] = String(token || "").split(".");
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
  } catch {
    return {};
  }
};

const getServiceRoleDiagnostics = () => {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const payload = getJwtPayload(serviceRoleKey);
  const key = String(serviceRoleKey || "");
  const keyType = key.startsWith("sb_secret_")
    ? "supabase_secret_key"
    : key.split(".").length === 3
      ? "legacy_service_role_jwt"
      : key
        ? "unknown"
        : "missing";
  return {
    hasUrl: Boolean(url),
    projectRef: getSupabaseProjectRef(),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    keyType,
    keyLooksLikeJwt: key.split(".").length === 3,
    role: typeof payload.role === "string" ? payload.role : "",
    issuer: typeof payload.iss === "string" ? redactProductLabText(payload.iss) : "",
    refMatchesIssuer:
      Boolean(url && payload.iss) && String(payload.iss).includes(getSupabaseProjectRef()),
  };
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
    const diagnostics = getServiceRoleDiagnostics();
    throw new Error(
      `Supabase REST ${response.status} for ${getSupabaseProjectRef()}: ${redactProductLabText(body.slice(0, 500))}. ` +
        `Diagnostics: key_type=${diagnostics.keyType}, role=${diagnostics.role || "unknown"}, ` +
        `issuer_matches_url=${diagnostics.refMatchesIssuer ? "yes" : "no"}.`,
    );
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
const normalizeReviewText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const getBaseReviewTitle = (value) => String(value ?? "").split(" - ")[0] || String(value ?? "");
const getReviewFingerprint = (value) => {
  const reviewItem = isObject(value?.review_item) ? value.review_item : isObject(value?.reviewItem) ? value.reviewItem : value;
  const module = normalizeReviewText(value?.module || reviewItem?.module);
  const title = normalizeReviewText(reviewItem?.originalTitle || getBaseReviewTitle(value?.title || reviewItem?.title));
  return module && title ? `${module}:${title}` : "";
};
const slugify = (value) => normalizeReviewText(value).replace(/\s+/g, "-") || "item";
const normalizeRunSourceForDb = (value) =>
  ["scheduled", "manual", "local", "workflow_dispatch"].includes(value) ? value : "local";
const getScopeConfig = () => PRODUCT_LAB_SCOPES.v2;
const getReviewQueuePath = () => {
  if (process.env.PRODUCT_LAB_REVIEW_QUEUE_PATH) return process.env.PRODUCT_LAB_REVIEW_QUEUE_PATH;
  return "public/product-lab-review.json";
};

const buildRescueReviewQueue = (config) => {
  const generatedAt = new Date().toISOString();
  const date = generatedAt.slice(0, 10);
  const runInstance = process.env.GITHUB_RUN_ID || process.env.PRODUCT_LAB_RUN_ID || slugify(generatedAt);
  const runId = `${date}-product-lab-rescue-${runInstance}`;
  const reportPath = `reports/product-lab/daily/daily-${date}.md`;
  const coreOutcome = process.env.PRODUCT_LAB_CORE_OUTCOME || "unknown";
  const sourceRun = {
    date,
    week: "rescue",
    theme: "Product Lab V2 Rescue",
    reportPath,
    runId,
  };

  const proposals = [
    {
      module: "Product Lab",
      domain: "systeme",
      title: "Restaurer la generation de file Product Lab avant sync Supabase",
      description:
        "Le run GitHub n'a pas produit la file Product Lab avant la synchronisation Supabase. Diagnostiquer l'etape Product Lab principale, garantir l'ecriture de public/product-lab-review.json et bloquer les PR tant que ce signal n'est pas vert.",
      beforeState: "La synchro admin peut echouer avec no review queue found, donc aucune nouvelle proposition n'apparait.",
      afterState: "Chaque run cree une file exploitable ou une proposition de diagnostic claire dans l'admin.",
      concernedFiles: ["scripts/product-lab.mjs", "scripts/product-lab-core.mjs", ".github/workflows/product-lab-nightly.yml"],
      priority: "Critique",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Moyenne",
      inspiration: "Vercel / Linear",
    },
    {
      module: "GitHub Actions",
      domain: "systeme",
      title: "Afficher l'etape exacte qui bloque le nightly V2",
      description:
        "Ajouter un resume de run plus lisible quand Product Lab echoue: outcome de l'etape principale, smoke QA, AI Gateway, sync Supabase, lint, test et build.",
      beforeState: "Le fondateur voit un echec global sans comprendre immediatement quelle etape a casse.",
      afterState: "Le rapport GitHub et l'admin indiquent le bloqueur exact sans exposer de secrets.",
      concernedFiles: [".github/workflows/product-lab-nightly.yml", "scripts/product-lab-supabase.mjs"],
      priority: "Important",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Faible",
      inspiration: "GitHub Actions / Vercel",
    },
    {
      module: "Multi-IA / Systeme",
      domain: "ia",
      title: "Valider credits et acces AI Gateway pour analyse enrichie",
      description:
        "Confirmer que le projet Vercel v2 possede les credits, le secret et le modele Product Lab IA necessaires pour enrichir les propositions au lieu de rester en analyse locale.",
      beforeState: "L'analyse IA Gateway peut etre presente mais non prouvee si credits, acces ou modele bloquent.",
      afterState: "L'admin affiche generated, auth_required, credits_required ou model_unavailable selon le vrai etat.",
      concernedFiles: ["scripts/product-lab-ai-review.mjs", ".github/workflows/product-lab-nightly.yml", "src/pages/Admin.tsx"],
      priority: "Important",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Moyenne",
      inspiration: "Vercel AI Gateway",
    },
    {
      module: "Site Builder",
      domain: "generateur",
      title: "Stabiliser le smoke QA generateur avant creation PR",
      description:
        "Transformer les echecs de smoke generateur en signaux exploitables et empecher toute PR Product Lab tant que les tests metier critiques ne sont pas verts.",
      beforeState: "Une QA generateur rouge peut bloquer les PR sans donner assez de priorite produit.",
      afterState: "Les echecs smoke deviennent des propositions classees par impact et ne creent aucune PR prematuree.",
      concernedFiles: ["scripts/smoke-generate-site.mjs", "scripts/product-lab-core.mjs", ".github/workflows/product-lab-nightly.yml"],
      priority: "Critique",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Moyenne",
      inspiration: "Lovable / Vercel",
    },
    {
      module: "Admin",
      domain: "systeme",
      title: "Verifier affichage live du backlog Supabase dans l'admin",
      description:
        "Confirmer apres redeploy que les propositions ouvertes Supabase s'accumulent dans l'admin V2, sans doublons et sans rester limitees au dernier run.",
      beforeState: "Le workflow peut sauver des propositions mais l'admin live doit encore prouver l'affichage complet.",
      afterState: "Le compteur admin correspond aux lignes open de product_lab_review_items.",
      concernedFiles: ["src/pages/Admin.tsx", "src/modules/product-lab/product-lab-review.ts"],
      priority: "Important",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Faible",
      inspiration: "Linear / Shopify Admin",
    },
    {
      module: "Product Lab",
      domain: "marketing",
      title: "Prioriser les propositions selon impact business et vision fondateur",
      description:
        "Garder les propositions Product Lab orientees conversion, valeur client, rentabilite et proximite avec Lovable, v0, Linear et Vercel, sans refonte globale inutile.",
      beforeState: "Un run de secours ou local peut produire des cartes trop techniques si le contexte produit n'est pas visible.",
      afterState: "Chaque carte indique pourquoi elle rapproche Pixelrises de la vision finale.",
      concernedFiles: ["scripts/product-lab-core.mjs", "docs/product-lab-benchmark-targets.md"],
      priority: "Amelioration",
      impact: "Moyen",
      risk: "Faible",
      difficulty: "Faible",
      inspiration: "Lovable / v0 / Linear",
    },
    {
      module: "SEO",
      domain: "seo",
      title: "Auditer les pages publiques V2 apres chaque deploy",
      description:
        "Ajouter au Product Lab un controle SEO simple sur landing, pricing et pages legales: title, meta, H1, liens critiques et absence de contenu technique visible.",
      beforeState: "Les runs Product Lab se concentrent surtout sur generateur et CI.",
      afterState: "Le SEO public devient un signal quotidien utile avant lancement.",
      concernedFiles: ["src/pages/Index.tsx", "src/pages/Pricing.tsx", "src/components/SEOHead.tsx"],
      priority: "Amelioration",
      impact: "Moyen",
      risk: "Faible",
      difficulty: "Faible",
      inspiration: "Framer / Shopify",
    },
    {
      module: "Code Health",
      domain: "systeme",
      title: "Valider auto-merge controle sur une PR non sensible",
      description:
        "Tester prMode puis autoMergeControlled uniquement avec une correction simple non sensible, apres validation admin, checks verts et aucun fichier protege touche.",
      beforeState: "La politique auto-merge est codee mais pas encore prouvee sur une vraie PR V2 non sensible.",
      afterState: "Le Product Lab sait creer une PR simple et bloquer ou demander auto-merge selon les garde-fous.",
      concernedFiles: [".github/workflows/product-lab-nightly.yml", "scripts/product-lab-governance.mjs"],
      priority: "Important",
      impact: "Eleve",
      risk: "Moyen",
      difficulty: "Moyenne",
      inspiration: "Linear / GitHub",
    },
  ];

  const items = proposals.map((proposal, index) => ({
    id: `${runId}-${index + 1}-${slugify(proposal.module)}-${slugify(proposal.title)}`,
    title: proposal.title,
    originalTitle: proposal.title,
    module: proposal.module,
    domain: proposal.domain,
    simpleSummary: `${proposal.module}: ${proposal.description}`,
    priority: proposal.priority,
    impact: proposal.impact,
    risk: proposal.risk,
    difficulty: proposal.difficulty,
    status: "Diagnostic Product Lab",
    inspiration: proposal.inspiration,
    decision: "human_validation",
    description: proposal.description,
    scoreImpact: proposal.impact === "Eleve" ? 30 : 18,
    sourceReport: reportPath,
    automationPolicy:
      "Validation humaine requise. Cette proposition de secours ne doit pas appliquer de changement automatiquement.",
    concernedFiles: proposal.concernedFiles,
    beforeState: proposal.beforeState,
    afterState: proposal.afterState,
    dataState: "real",
  }));

  return {
    generatedAt,
    sourceRun,
    summary: {
      total: items.length,
      actionableTotal: items.length,
      rejectedVagueProposals: 0,
      maxAutoSafePatches: 0,
      sensitiveChangesRequireApproval: true,
      dailySummary: `File de secours Product Lab V2: ${items.length} proposition(s) creee(s) parce que le run principal n'a pas produit de file. Outcome principal: ${coreOutcome}.`,
      aiReview: {
        status: "failed",
        model: "Pixelrises AI Gateway",
        generated: 0,
        generatedAt,
        error: "Analyse IA non appliquee sur cette file de secours.",
        action: "Corriger le run Product Lab principal puis relancer proposalOnly.",
      },
    },
    items,
  };
};

const readOpenReviewRows = async (config) =>
  restFetch(
    [
      config.reviewTable,
      "?select=item_id,title,module,source_run,review_item,status,generated_at",
      "&status=eq.open",
      "&order=generated_at.desc",
      "&limit=500",
    ].join(""),
    { method: "GET" },
  );

const writeOpenReviewState = (rows, configured = true) => {
  const items = (Array.isArray(rows) ? rows : [])
    .filter(isObject)
    .map((row) => {
      const reviewItem = isObject(row.review_item) ? row.review_item : {};
      return {
        itemId: typeof row.item_id === "string" ? row.item_id : "",
        title: typeof row.title === "string" ? row.title : typeof reviewItem.title === "string" ? reviewItem.title : "",
        originalTitle:
          typeof reviewItem.originalTitle === "string"
            ? reviewItem.originalTitle
            : typeof row.title === "string"
              ? getBaseReviewTitle(row.title)
              : "",
        module: typeof row.module === "string" ? row.module : typeof reviewItem.module === "string" ? reviewItem.module : "",
        status: typeof row.status === "string" ? row.status : "open",
        sourceRun: isObject(row.source_run) ? row.source_run : {},
        generatedAt: typeof row.generated_at === "string" ? row.generated_at : "",
        reviewItem,
      };
    })
    .filter((item) => item.itemId && item.title);

  writeJson(
    "product-lab/state/open-review-items.json",
    redactProductLabObject({
      pulledAt: new Date().toISOString(),
      configured,
      items,
    }),
  );

  return items;
};

const pushProposals = async () => {
  if (!isConfigured()) {
    skipOrFail("Product Lab Supabase proposal sync failed: missing service role configuration.");
    return;
  }
  const diagnostics = getServiceRoleDiagnostics();
  console.log(
    `Product Lab Supabase target: ${diagnostics.projectRef}, service_role_present=${diagnostics.hasServiceRoleKey ? "yes" : "no"}, role=${
      diagnostics.role || "unknown"
    }, key_type=${diagnostics.keyType}, issuer_matches_url=${diagnostics.refMatchesIssuer ? "yes" : "no"}.`,
  );

  const config = getScopeConfig();
  let queue = readJson(getReviewQueuePath(), null);
  if (!queue?.items?.length) {
    queue = buildRescueReviewQueue(config);
    writeJson(getReviewQueuePath(), queue);
    console.log(
      `Product Lab Supabase proposal sync rescued: no review queue found, generated ${queue.items.length} safe diagnostic item(s) for ${config.label}.`,
    );
  }

  const processedRows = await restFetch(
    [
      config.decisionsTable,
      "?select=item_id,application_status,processed_at,processed_run,automation_action,review_item",
      "&or=(application_status.eq.pr_ready,processed_at.not.is.null)",
      "&limit=500",
    ].join(""),
    { method: "GET" },
  ).catch(() => []);
  const processedItemIds = new Set(
    (Array.isArray(processedRows) ? processedRows : [])
      .map((row) => (typeof row?.item_id === "string" ? row.item_id : ""))
      .filter(Boolean),
  );
  const processedFingerprints = new Set(
    (Array.isArray(processedRows) ? processedRows : [])
      .map(getReviewFingerprint)
      .filter(Boolean),
  );

  const openRows = await readOpenReviewRows(config).catch(() => []);
  const openFingerprints = new Set(
    (Array.isArray(openRows) ? openRows : [])
      .map(getReviewFingerprint)
      .filter(Boolean),
  );

  const skipped = {
    processed: 0,
    duplicateOpen: 0,
  };
  const rows = queue.items
    .filter((item) => {
      const fingerprint = getReviewFingerprint(item);
      if (processedItemIds.has(item.id) || (fingerprint && processedFingerprints.has(fingerprint))) {
        skipped.processed += 1;
        return false;
      }
      if (fingerprint && openFingerprints.has(fingerprint)) {
        skipped.duplicateOpen += 1;
        return false;
      }
      return true;
    })
    .map((item) => ({
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

  if (!rows.length) {
    console.log(
      `Product Lab Supabase proposal sync complete: 0 new item(s) for ${config.label}. ${skipped.processed} already processed, ${skipped.duplicateOpen} already open. Backlog kept intact.`,
    );
    return;
  }

  await restFetch(`${config.reviewTable}?on_conflict=item_id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  console.log(
    `Product Lab Supabase proposal sync complete: ${rows.length} new item(s) for ${config.label}. ${skipped.processed} already processed, ${skipped.duplicateOpen} already open. Existing open backlog kept.`,
  );
};

const pullDecisions = async () => {
  if (!isConfigured()) {
    writeJson("product-lab/state/admin-decisions.json", {
      pulledAt: new Date().toISOString(),
      configured: false,
      decisions: [],
    });
    writeOpenReviewState([], false);
    console.log("Product Lab Supabase decision pull skipped: missing service role configuration.");
    return;
  }

  const config = getScopeConfig();
  const selectedColumns =
    "item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at,review_item,source_run,application_status,processed_at,processed_run";

  const rows = await restFetch(
    [config.decisionsTable, `?select=${selectedColumns}`, "&order=decided_at.desc", "&limit=500"].join(""),
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
          originalTitle:
            typeof reviewItem.originalTitle === "string"
              ? reviewItem.originalTitle
              : typeof reviewItem.title === "string"
                ? reviewItem.title
                : "",
          sourceTheme: typeof sourceRun.theme === "string" ? sourceRun.theme : "",
          sourceRun,
          status: row.status,
          note: row.admin_note ?? "",
          correctionRequest: row.correction_request ?? "",
          rejectionMode: row.rejection_mode ?? null,
          automationAction: row.automation_action,
          applicationStatus: row.application_status ?? "",
          processedAt: row.processed_at ?? "",
          processedRun: isObject(row.processed_run) ? row.processed_run : {},
          decidedAt: row.decided_at,
        };
      })
    : [];

  writeJson("product-lab/state/admin-decisions.json", {
    pulledAt: new Date().toISOString(),
    configured: true,
    decisions,
  });
  const openRows = await readOpenReviewRows(config).catch(() => []);
  const openItems = writeOpenReviewState(openRows, true);

  console.log(
    `Product Lab Supabase decision pull complete: ${decisions.length} decision(s), ${openItems.length} open backlog item(s).`,
  );
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

    await restFetch(`${getScopeConfig().reviewTable}?item_id=eq.${encodeURIComponent(finding.itemId)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "archived",
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

const archiveProcessedReviewItems = async () => {
  if (!isConfigured()) {
    console.log("Product Lab processed proposal archive skipped: missing service role configuration.");
    return;
  }

  const config = getScopeConfig();
  const rows = await restFetch(
    [
      config.decisionsTable,
      "?select=item_id,application_status,processed_at,processed_run",
      "&or=(application_status.eq.pr_ready,processed_at.not.is.null)",
      "&limit=500",
    ].join(""),
    { method: "GET" },
  );
  const itemIds = [
    ...new Set(
      (Array.isArray(rows) ? rows : [])
        .map((row) => (typeof row?.item_id === "string" ? row.item_id : ""))
        .filter(Boolean),
    ),
  ];

  for (const itemId of itemIds) {
    await restFetch(`${config.reviewTable}?item_id=eq.${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status: "archived" }),
    });
  }

  console.log(`Product Lab processed proposal archive complete: ${itemIds.length} item(s) archived for ${config.label}.`);
};

const recordRunStatus = async () => {
  if (!isConfigured()) {
    console.log("Product Lab run status sync skipped: missing service role configuration.");
    return;
  }
  const diagnostics = getServiceRoleDiagnostics();
  console.log(
    `Product Lab run status target: ${diagnostics.projectRef}, service_role_present=${diagnostics.hasServiceRoleKey ? "yes" : "no"}, role=${
      diagnostics.role || "unknown"
    }, key_type=${diagnostics.keyType}, issuer_matches_url=${diagnostics.refMatchesIssuer ? "yes" : "no"}.`,
  );

  const config = getScopeConfig();
  const summary = readJson("product-lab/state/last-run-summary.json", {});
  const queue = readJson(getReviewQueuePath(), {});
  const diagnostic = readJson("product-lab/state/phase12-diagnostic.json", {});
  const startedAt =
    process.env.PRODUCT_LAB_RUN_STARTED_AT ||
    queue.generatedAt ||
    diagnostic.generatedAt ||
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
        version: "v2",
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
        version: "v2",
        report_path: reportSummary.reportPath || "",
        summary: reportSummary,
        created_at: completedAt,
      },
    ]),
  });

  console.log(`Product Lab run status sync complete for ${config.label}: ${runId}.`);
};

const diagnoseSupabase = async () => {
  const diagnostics = getServiceRoleDiagnostics();
  console.log(
    `Product Lab Supabase diagnostics: target=${diagnostics.projectRef}, url_present=${
      diagnostics.hasUrl ? "yes" : "no"
    }, service_role_present=${diagnostics.hasServiceRoleKey ? "yes" : "no"}, key_type=${
      diagnostics.keyType
    }, role=${diagnostics.role || "unknown"}, issuer_matches_url=${
      diagnostics.refMatchesIssuer ? "yes" : "no"
    }.`,
  );

  if (!isConfigured()) {
    throw new Error("Product Lab Supabase diagnostics failed: missing VITE_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const config = getScopeConfig();
  await restFetch(`${config.reviewTable}?select=id&limit=1`, { method: "GET" });
  await restFetch(`${config.runsTable}?select=id&limit=1`, { method: "GET" });
  console.log(`Product Lab Supabase diagnostics passed for ${config.label}.`);
};

const run = async () => {
  if (action === "push-proposals") {
    await pushProposals();
  } else if (action === "pull-decisions") {
    await pullDecisions();
  } else if (action === "mark-processed") {
    await markProcessedDecisions();
  } else if (action === "record-pr-status") {
    await recordPrStatus();
  } else if (action === "archive-processed") {
    await archiveProcessedReviewItems();
  } else if (action === "record-run") {
    await recordRunStatus();
  } else if (action === "diagnose") {
    await diagnoseSupabase();
  } else {
    console.log(
      "Usage: node scripts/product-lab-supabase.mjs <diagnose|pull-decisions|push-proposals|mark-processed|record-pr-status|archive-processed|record-run>",
    );
  }
};

run().catch((error) => {
  const message = redactProductLabText(error instanceof Error ? error.message : String(error));
  console.error(`::error title=Product Lab Supabase sync failed::${message}`);
  console.error(message);
  process.exitCode = 1;
});
