import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export type ProductLabDecisionStatus = "pending" | "approved" | "rejected" | "needs_review";
export type ProductLabRejectionMode = "ignore" | "alternative" | null;
export type ProductLabAutomationAction = "hold" | "authorize_next_run" | "ignore" | "request_alternative";
export type ProductLabFindingDecision = "auto_safe" | "human_validation";
export type ProductLabApplicationStatus = "pending" | "pr_ready" | "skipped" | "validation_failed";
export type ProductLabScope = "v2";
export type ProductLabQueueSource = "supabase" | "public" | "fallback";
export type ProductLabProposalDomain = "marketing" | "systeme" | "seo" | "generateur" | "ia";
export type ProductLabPrStatus = "not_created" | "creating" | "created" | "checks_running" | "checks_ok" | "checks_failed";
export type ProductLabAutoMergeStatus =
  | "not_requested"
  | "eligible"
  | "blocked"
  | "auto_merge_requested"
  | "auto_merge_request_failed"
  | "merged";

export interface ProductLabReviewItem {
  id: string;
  title: string;
  module: string;
  domain: ProductLabProposalDomain;
  simpleSummary: string;
  priority: string;
  impact: string;
  risk: string;
  difficulty: string;
  status: string;
  inspiration: string;
  decision: ProductLabFindingDecision;
  description: string;
  scoreImpact: number;
  sourceReport: string;
  automationPolicy: string;
  concernedFiles: string[];
  beforeState: string;
  afterState: string;
  dataState?: "real" | "example" | "mock" | "pending" | "error" | "empty" | "local/fallback";
  sourceRun?: ProductLabReviewQueue["sourceRun"];
  sourceRunKey?: string;
  generatedAt?: string;
}

export interface ProductLabReviewQueue {
  generatedAt: string;
  loadSource?: ProductLabQueueSource;
  loadedAt?: string;
  sourceRun: {
    date: string;
    week: string;
    theme: string;
    reportPath: string;
    runId?: string;
  };
  summary: {
    total: number;
    maxAutoSafePatches: number;
    sensitiveChangesRequireApproval: boolean;
    dailySummary?: string;
    averageScore?: number;
    lowestScore?: {
      name: string;
      note: number;
    };
    aiReview?: {
      status?: "generated" | "empty" | "failed" | "disabled" | "skipped_missing_gateway";
      model?: string;
      generated?: number;
      generatedAt?: string;
      error?: string;
      usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      };
    };
  };
  items: ProductLabReviewItem[];
}

export interface ProductLabRunStatus {
  runId: string;
  source: "scheduled" | "manual" | "local" | "workflow_dispatch";
  mode: "dryRun" | "proposalOnly" | "prMode" | "autoMergeControlled";
  status: "started" | "completed" | "failed" | "skipped";
  dryRun: boolean;
  forceGenerate: boolean;
  startedAt: string;
  completedAt: string;
  proposalsGenerated: number;
  proposalsSaved: number;
  errorsCount: number;
  warningsCount: number;
  workflowRunUrl: string;
  reportSummary: Record<string, unknown>;
  sourceLabel: "supabase" | "queue" | "fallback";
}

export interface ProductLabDecision {
  itemId: string;
  status: ProductLabDecisionStatus;
  note: string;
  correctionRequest: string;
  rejectionMode: ProductLabRejectionMode;
  automationAction: ProductLabAutomationAction;
  decidedAt: string;
  applicationStatus?: ProductLabApplicationStatus;
  processedAt?: string;
  processedRun?: Record<string, unknown>;
  branch?: string;
  prUrl?: string;
  prNumber?: number | null;
  prStatus?: ProductLabPrStatus;
  testStatus?: string;
  buildStatus?: string;
  autoMergeStatus?: ProductLabAutoMergeStatus;
  autoMergeBlockReason?: string;
  riskLevel?: "low" | "medium" | "high";
  touchedSensitiveFiles?: Array<{ file: string; reason: string }>;
  sourceRunKey?: string;
  sourceRun?: ProductLabReviewQueue["sourceRun"];
  persisted?: "supabase" | "localStorage";
  persistedError?: string;
}

export type ProductLabDecisionMap = Record<string, ProductLabDecision>;

export interface ProductLabReviewItemWithDecision extends ProductLabReviewItem {
  localDecision: ProductLabDecision;
}

interface ProductLabScopeConfig {
  scope: ProductLabScope;
  label: string;
  reviewTable: string;
  decisionsTable: string;
  runsTable: string;
  reportsTable: string;
  storageKey: string;
  publicQueuePath: string;
  fallbackQueue: ProductLabReviewQueue;
}

type DbError = { message: string; code?: string; details?: string; hint?: string } | null;

type DynamicQuery = {
  upsert: (value: unknown, options?: unknown) => Promise<{ error: DbError }>;
  select: (columns?: string) => DynamicQuery;
  order: (column: string, options?: { ascending?: boolean }) => DynamicQuery;
  limit: (count: number) => Promise<{ data: unknown; error: DbError }>;
};

type DynamicSupabase = {
  auth: typeof supabase.auth;
  from: (table: string) => DynamicQuery;
};

const dynamicSupabase = supabase as unknown as DynamicSupabase;

export const isProductLabMissingTableError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const text = [record.message, record.details, record.hint, record.code]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    text.includes("could not find the table") ||
    text.includes("schema cache") ||
    text.includes("does not exist") ||
    text.includes("pgrst205") ||
    text.includes("42p01")
  );
};

export const getProductLabMissingTableMessage = (_scope: ProductLabScope) =>
  "Tables Product Lab V2 absentes ou cache Supabase non recharge. Applique la migration unique supabase/migrations/20260509194500_repair_product_lab_all_admin_tables_cache.sql en entier, puis relance l'admin.";

export const isProductLabRlsError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const text = [record.message, record.details, record.hint, record.code]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return text.includes("row-level security") || text.includes("42501") || text.includes("permission denied");
};

export const getProductLabRlsMessage = (scope: ProductLabScope) =>
  `Synchronisation ${getProductLabScopeConfig(scope).label} bloquee par Supabase RLS. Verifie que ton compte connecte a le role admin dans public.user_roles et applique la migration supabase/migrations/20260509200000_repair_product_lab_rls_policies.sql.`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const productLabProposalDomains: ProductLabProposalDomain[] = [
  "marketing",
  "systeme",
  "seo",
  "generateur",
  "ia",
];

const normalizeDomainText = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const hasDomainSignal = (haystack: string, signals: string[]) =>
  signals.some((signal) => ` ${haystack} `.includes(` ${normalizeDomainText(signal)} `));

export const normalizeProductLabProposalDomain = (value: unknown): ProductLabProposalDomain => {
  if (!isObject(value)) return "marketing";
  const explicitDomain = normalizeDomainText(value.domain);
  if (productLabProposalDomains.includes(explicitDomain as ProductLabProposalDomain)) {
    return explicitDomain as ProductLabProposalDomain;
  }

  const haystack = normalizeDomainText(
    [
      value.module,
      value.title,
      value.simpleSummary,
      value.description,
      value.status,
      value.inspiration,
      value.beforeState,
      value.afterState,
      Array.isArray(value.concernedFiles) ? value.concernedFiles.join(" ") : "",
    ].join(" "),
  );

  if (hasDomainSignal(haystack, ["seo", "local seo", "referencement", "schema", "meta", "h1", "h2", "google", "ranking", "search", "faq", "serp"])) {
    return "seo";
  }
  if (hasDomainSignal(haystack, ["ia", "ai", "multi ia", "multi-ai", "agent", "prompt", "model", "gateway", "orchestrator", "llm", "provider", "fallback", "quality gate"])) {
    return "ia";
  }
  if (hasDomainSignal(haystack, ["builder", "site builder", "game builder", "agent builder", "generateur", "generation", "preview", "prototype", "blueprint", "visual editor", "section", "export", "snippet", "package"])) {
    return "generateur";
  }
  if (hasDomainSignal(haystack, ["systeme", "code health", "product lab", "github", "workflow", "ci", "build", "test", "lint", "supabase", "rls", "grant", "stripe", "billing", "credit", "credits", "security", "securite", "auth", "webhook", "edge function", "migration", "admin"])) {
    return "systeme";
  }
  return "marketing";
};

export const getProductLabSourceRunKey = (sourceRun: unknown) => {
  if (!isObject(sourceRun)) return "";
  return [sourceRun.runId, sourceRun.date, sourceRun.week, sourceRun.theme]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join("|");
};

export const getProductLabQueueRunKey = (queue: ProductLabReviewQueue | null | undefined) =>
  getProductLabSourceRunKey(queue?.sourceRun);

export const getProductLabItemRunKey = (
  item: Pick<ProductLabReviewItem, "sourceRun" | "sourceRunKey">,
  queue?: ProductLabReviewQueue | null,
) => item.sourceRunKey || getProductLabSourceRunKey(item.sourceRun) || getProductLabQueueRunKey(queue);

const normalizeReviewItem = (value: unknown, fallbackId: string): ProductLabReviewItem | null => {
  if (!isObject(value)) return null;
  const id = typeof value.id === "string" ? value.id : fallbackId;
  const title = typeof value.title === "string" ? value.title : "";
  const module = typeof value.module === "string" ? value.module : "Product Lab";
  if (!id || !title) return null;

  return {
    id,
    title,
    module,
    domain: normalizeProductLabProposalDomain(value),
    simpleSummary: typeof value.simpleSummary === "string" ? value.simpleSummary : title,
    priority: typeof value.priority === "string" ? value.priority : "Important",
    impact: typeof value.impact === "string" ? value.impact : "Moyen",
    risk: typeof value.risk === "string" ? value.risk : "Moyen",
    difficulty: typeof value.difficulty === "string" ? value.difficulty : "Moyenne",
    status: typeof value.status === "string" ? value.status : "Propose",
    inspiration: typeof value.inspiration === "string" ? value.inspiration : "Pixelrises Product Lab",
    decision: value.decision === "auto_safe" ? "auto_safe" : "human_validation",
    description: typeof value.description === "string" ? value.description : title,
    scoreImpact: typeof value.scoreImpact === "number" ? value.scoreImpact : 0,
    sourceReport: typeof value.sourceReport === "string" ? value.sourceReport : "reports/product-lab/daily/",
    automationPolicy:
      typeof value.automationPolicy === "string"
        ? value.automationPolicy
        : "Validation admin requise avant application.",
    concernedFiles: Array.isArray(value.concernedFiles)
      ? value.concernedFiles.filter((file): file is string => typeof file === "string")
      : [],
    beforeState: typeof value.beforeState === "string" ? value.beforeState : "",
    afterState: typeof value.afterState === "string" ? value.afterState : "",
    dataState:
      value.dataState === "real" ||
      value.dataState === "example" ||
      value.dataState === "mock" ||
      value.dataState === "pending" ||
      value.dataState === "error" ||
      value.dataState === "empty" ||
      value.dataState === "local/fallback"
        ? value.dataState
        : "real",
  };
};

export const fallbackProductLabReviewQueue: ProductLabReviewQueue = {
  generatedAt: new Date(0).toISOString(),
  sourceRun: {
    date: "local",
    week: "local",
    theme: "Product Lab",
    reportPath: "reports/product-lab/daily/",
  },
  summary: {
    total: 1,
    maxAutoSafePatches: 2,
    sensitiveChangesRequireApproval: true,
    dailySummary: "Un point sensible attend une decision admin avant toute action automatique.",
    averageScore: 74,
    lowestScore: {
      name: "Agent Builder Score",
      note: 72,
    },
  },
  items: [
    {
      id: "local-agent-builder-security",
      title: "Durcir la securite des actions agents",
      module: "Agent Builder",
      domain: "ia",
      simpleSummary: "Verifier que les agents ne peuvent pas publier, modifier ou connecter sans validation.",
      priority: "Important",
      impact: "Eleve",
      risk: "Moyen",
      difficulty: "Moyenne",
      status: "Propose",
      inspiration: "Delos / Base44",
      decision: "human_validation",
      description: "Toute action sensible agent doit rester validable et visible.",
      scoreImpact: 24,
      sourceReport: "reports/product-lab/daily/",
      automationPolicy:
        "Validation humaine requise avant tout changement sensible. Le Product Lab ne doit pas appliquer cette decision automatiquement.",
      concernedFiles: ["src/pages/AgentBuilder.tsx", "src/pages/Agents.tsx", "src/modules/registries/index.ts"],
      beforeState: "Les permissions existent, mais la validation humaine doit rester plus visible dans le flow agent.",
      afterState:
        "Chaque action sensible agent devient explicitement validable avant execution ou patch automatique.",
    },
  ],
};

export const productLabScopeConfigs: Record<ProductLabScope, ProductLabScopeConfig> = {
  v2: {
    scope: "v2",
    label: "Pixelrises V2",
    reviewTable: "product_lab_review_items",
    decisionsTable: "product_lab_decisions",
    runsTable: "product_lab_runs",
    reportsTable: "product_lab_reports",
    storageKey: "pixelrises-v2-product-lab-decisions",
    publicQueuePath: "/product-lab-review.json",
    fallbackQueue: fallbackProductLabReviewQueue,
  },
};

export const getProductLabScopeConfig = (_scope: ProductLabScope = "v2") => productLabScopeConfigs.v2;

const canUseBrowserStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export const readProductLabDecisions = (scope: ProductLabScope = "v2"): ProductLabDecisionMap => {
  if (!canUseBrowserStorage()) return {};

  try {
    const raw = window.localStorage.getItem(getProductLabScopeConfig(scope).storageKey);
    return raw ? (JSON.parse(raw) as ProductLabDecisionMap) : {};
  } catch {
    return {};
  }
};

export const writeProductLabDecision = (
  decisions: ProductLabDecisionMap,
  itemId: string,
  status: ProductLabDecisionStatus,
  note: string,
  options: {
    correctionRequest?: string;
    rejectionMode?: ProductLabRejectionMode;
    automationAction?: ProductLabAutomationAction;
    sourceRunKey?: string;
    sourceRun?: ProductLabReviewQueue["sourceRun"];
  } = {},
  scope: ProductLabScope = "v2",
) => {
  const sourceRunKey =
    options.sourceRunKey ||
    getProductLabSourceRunKey(options.sourceRun) ||
    decisions[itemId]?.sourceRunKey ||
    "";

  const nextDecisions: ProductLabDecisionMap = {
    ...decisions,
    [itemId]: {
      itemId,
      status,
      note,
      correctionRequest: options.correctionRequest ?? decisions[itemId]?.correctionRequest ?? "",
      rejectionMode: options.rejectionMode ?? decisions[itemId]?.rejectionMode ?? null,
      automationAction:
        options.automationAction ??
        (status === "approved"
          ? "authorize_next_run"
          : status === "rejected"
            ? "ignore"
            : status === "needs_review"
              ? "hold"
              : "hold"),
      decidedAt: new Date().toISOString(),
      applicationStatus: "pending",
      processedAt: "",
      processedRun: {},
      sourceRunKey,
      sourceRun: options.sourceRun ?? decisions[itemId]?.sourceRun,
      persisted: "localStorage",
    },
  };

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(getProductLabScopeConfig(scope).storageKey, JSON.stringify(nextDecisions));
  }

  return nextDecisions;
};

export const readProductLabDecisionsFromSupabase = async (scope: ProductLabScope = "v2"): Promise<{
  decisions: ProductLabDecisionMap;
  persisted: boolean;
  error?: string;
}> => {
  const config = getProductLabScopeConfig(scope);
  const localDecisions = readProductLabDecisions(scope);
  if (!isSupabaseConfigured) return { decisions: localDecisions, persisted: false };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user.id) return { decisions: localDecisions, persisted: false };

    const { data, error } = await dynamicSupabase
      .from(config.decisionsTable)
      .select(
        "item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at,source_run,application_status,processed_at,processed_run",
      )
      .order("decided_at", { ascending: false })
      .limit(500);

    if (error || !Array.isArray(data)) {
      return {
        decisions: localDecisions,
        persisted: false,
        error: isProductLabMissingTableError(error)
          ? getProductLabMissingTableMessage(config.scope)
          : isProductLabRlsError(error)
            ? getProductLabRlsMessage(config.scope)
            : error?.message,
      };
    }

    const remoteDecisions = data.reduce<ProductLabDecisionMap>((accumulator, row) => {
      const record = row as Record<string, unknown>;
      const itemId = typeof record.item_id === "string" ? record.item_id : "";
      if (!itemId) return accumulator;
      const processedRun = isObject(record.processed_run) ? record.processed_run : {};
      const prUrl =
        typeof processedRun.prUrl === "string"
          ? processedRun.prUrl
          : "";
      const prNumber =
        typeof processedRun.prNumber === "number"
          ? processedRun.prNumber
          : null;
      const sourceRun = isObject(record.source_run)
        ? (record.source_run as ProductLabReviewQueue["sourceRun"])
        : undefined;

      accumulator[itemId] = {
        itemId,
        status: normalizeDecisionStatus(record.status),
        note: typeof record.admin_note === "string" ? record.admin_note : "",
        correctionRequest:
          typeof record.correction_request === "string" ? record.correction_request : "",
        rejectionMode: normalizeRejectionMode(record.rejection_mode),
        automationAction: normalizeAutomationAction(record.automation_action),
        decidedAt: typeof record.decided_at === "string" ? record.decided_at : "",
        applicationStatus: normalizeApplicationStatus(record.application_status),
        processedAt:
          typeof record.processed_at === "string"
            ? record.processed_at
            : "",
        processedRun: processedRun,
        branch: typeof processedRun.branch === "string" ? processedRun.branch : "",
        prUrl,
        prNumber,
        prStatus: prUrl ? normalizePrStatus(processedRun.prStatus || "created") : normalizePrStatus(processedRun.prStatus),
        testStatus: typeof processedRun.testStatus === "string" ? processedRun.testStatus : "",
        buildStatus: typeof processedRun.buildStatus === "string" ? processedRun.buildStatus : "",
        autoMergeStatus: normalizeAutoMergeStatus(processedRun.autoMergeStatus),
        autoMergeBlockReason:
          typeof processedRun.autoMergeBlockReason === "string" ? processedRun.autoMergeBlockReason : "",
        riskLevel: normalizeRiskLevel(processedRun.riskLevel),
        touchedSensitiveFiles: Array.isArray(processedRun.touchedSensitiveFiles)
          ? processedRun.touchedSensitiveFiles.filter(
              (entry): entry is { file: string; reason: string } =>
                isObject(entry) && typeof entry.file === "string" && typeof entry.reason === "string",
            )
          : [],
        sourceRunKey: getProductLabSourceRunKey(sourceRun),
        sourceRun,
        persisted: "supabase",
      };
      return accumulator;
    }, {});

    const merged = { ...localDecisions, ...remoteDecisions };
    if (canUseBrowserStorage()) {
      window.localStorage.setItem(config.storageKey, JSON.stringify(merged));
    }

    return { decisions: merged, persisted: true };
  } catch (error) {
    return {
      decisions: localDecisions,
      persisted: false,
      error: error instanceof Error ? error.message : "Lecture Supabase impossible.",
    };
  }
};

export const persistProductLabDecisionToSupabase = async (
  decision: ProductLabDecision,
  item: ProductLabReviewItem,
  queue: ProductLabReviewQueue,
  scope: ProductLabScope = "v2",
): Promise<{ persisted: boolean; error?: string }> => {
  const config = getProductLabScopeConfig(scope);
  if (!isSupabaseConfigured) return { persisted: false };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return { persisted: false, error: "Session admin absente." };
    const itemSourceRun = item.sourceRun ?? queue.sourceRun;

    const payload = {
      item_id: decision.itemId,
      source_run: itemSourceRun,
      review_item: item,
      status: decision.status,
      admin_note: decision.note,
      correction_request: decision.correctionRequest,
      rejection_mode: decision.rejectionMode,
      automation_action: decision.automationAction,
      decided_by: userId,
      decided_at: decision.decidedAt || new Date().toISOString(),
      application_status: "pending",
      processed_at: null,
      processed_run: {},
    };

    const { error } = await dynamicSupabase.from(config.decisionsTable).upsert(payload, { onConflict: "item_id" });

    if (error) {
      return {
        persisted: false,
        error: isProductLabMissingTableError(error)
          ? getProductLabMissingTableMessage(config.scope)
          : isProductLabRlsError(error)
            ? getProductLabRlsMessage(config.scope)
            : error.message,
      };
    }
    return { persisted: true };
  } catch (error) {
    return {
      persisted: false,
      error: error instanceof Error ? error.message : "Sauvegarde Supabase impossible.",
    };
  }
};

export const getUnsyncedProductLabDecisions = (
  decisions: ProductLabDecisionMap,
  queue?: ProductLabReviewQueue | null,
) => {
  const visibleItemIds = queue ? new Set(queue.items.map((item) => item.id)) : null;
  const itemRunKeys = queue
    ? new Map(queue.items.map((item) => [item.id, getProductLabItemRunKey(item, queue)]))
    : null;

  return Object.values(decisions).filter(
    (decision) =>
      decision.status !== "pending" &&
      decision.persisted !== "supabase" &&
      (!visibleItemIds || visibleItemIds.has(decision.itemId)) &&
      (!itemRunKeys || !itemRunKeys.get(decision.itemId) || decision.sourceRunKey === itemRunKeys.get(decision.itemId)),
  );
};

export const syncProductLabDecisionsToSupabase = async (
  decisions: ProductLabDecisionMap,
  queue: ProductLabReviewQueue,
  scope: ProductLabScope = "v2",
): Promise<{
  synced: ProductLabDecision[];
  failed: Array<{ decision: ProductLabDecision; error: string }>;
}> => {
  const itemsById = new Map(queue.items.map((item) => [item.id, item]));
  const unsyncedDecisions = getUnsyncedProductLabDecisions(decisions, queue);
  const synced: ProductLabDecision[] = [];
  const failed: Array<{ decision: ProductLabDecision; error: string }> = [];

  for (const decision of unsyncedDecisions) {
    const item = itemsById.get(decision.itemId);
    if (!item) {
      failed.push({
        decision,
        error: "Proposition introuvable dans la file Product Lab actuelle.",
      });
      continue;
    }

    const result = await persistProductLabDecisionToSupabase(decision, item, queue, scope);
    if (result.persisted) {
      synced.push({
        ...decision,
        sourceRunKey: getProductLabItemRunKey(item, queue),
        sourceRun: item.sourceRun ?? queue.sourceRun,
        persisted: "supabase",
      });
    } else {
      failed.push({
        decision,
        error: result.error ?? "Synchronisation Supabase impossible.",
      });
    }
  }

  return { synced, failed };
};

export const readProductLabReviewQueueFromSupabase = async (scope: ProductLabScope = "v2"): Promise<ProductLabReviewQueue | null> => {
  const config = getProductLabScopeConfig(scope);
  if (!isSupabaseConfigured) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user.id) return null;

    const { data, error } = await dynamicSupabase
      .from(config.reviewTable)
      .select("item_id,source_run,queue_summary,review_item,status,generated_at")
      .eq("status", "open")
      .order("generated_at", { ascending: false })
      .limit(300);

    if (error || !Array.isArray(data) || data.length === 0) return null;

    const rows = data.filter(isObject);
    const latest = rows[0] ?? {};
    const sourceRun = isObject(latest.source_run) ? latest.source_run : {};

    const items = rows
      .map((row) => {
        const rowSourceRun = isObject(row.source_run) ? row.source_run : {};
        const item = normalizeReviewItem(row.review_item, typeof row.item_id === "string" ? row.item_id : "");
        if (!item) return null;

        return {
          ...item,
          sourceRun: {
            runId: typeof rowSourceRun.runId === "string" ? rowSourceRun.runId : undefined,
            date: typeof rowSourceRun.date === "string" ? rowSourceRun.date : "supabase",
            week: typeof rowSourceRun.week === "string" ? rowSourceRun.week : "supabase",
            theme: typeof rowSourceRun.theme === "string" ? rowSourceRun.theme : config.label,
            reportPath:
              typeof rowSourceRun.reportPath === "string"
                ? rowSourceRun.reportPath
                : config.fallbackQueue.sourceRun.reportPath,
          },
          sourceRunKey: getProductLabSourceRunKey(rowSourceRun),
          generatedAt: typeof row.generated_at === "string" ? row.generated_at : undefined,
        };
      })
      .filter((item): item is ProductLabReviewItem => Boolean(item));

    if (!items.length) return null;

    const queueSummary = isObject(latest.queue_summary) ? latest.queue_summary : {};

    return {
      generatedAt:
        typeof latest.generated_at === "string" ? latest.generated_at : new Date().toISOString(),
      sourceRun: {
        runId: typeof sourceRun.runId === "string" ? sourceRun.runId : undefined,
        date: typeof sourceRun.date === "string" ? sourceRun.date : "supabase",
        week: typeof sourceRun.week === "string" ? sourceRun.week : "supabase",
        theme: typeof sourceRun.theme === "string" ? sourceRun.theme : config.label,
        reportPath:
          typeof sourceRun.reportPath === "string"
            ? sourceRun.reportPath
            : config.fallbackQueue.sourceRun.reportPath,
      },
      summary: {
        total: items.length,
        maxAutoSafePatches:
          typeof queueSummary.maxAutoSafePatches === "number" ? queueSummary.maxAutoSafePatches : 2,
        sensitiveChangesRequireApproval:
          typeof queueSummary.sensitiveChangesRequireApproval === "boolean"
            ? queueSummary.sensitiveChangesRequireApproval
            : true,
        dailySummary:
          typeof queueSummary.dailySummary === "string"
            ? `Backlog ouverte cumulee: ${items.length} proposition(s) a trancher. Dernier run: ${queueSummary.dailySummary}`
            : `Backlog ouverte cumulee depuis Supabase: ${items.length} proposition(s) a trancher sans doublons volontaires.`,
        averageScore: typeof queueSummary.averageScore === "number" ? queueSummary.averageScore : undefined,
        lowestScore: isObject(queueSummary.lowestScore)
          ? {
              name:
                typeof queueSummary.lowestScore.name === "string"
                  ? queueSummary.lowestScore.name
                  : "Product Lab",
              note:
                typeof queueSummary.lowestScore.note === "number"
                  ? queueSummary.lowestScore.note
                  : 0,
            }
          : undefined,
      },
      items,
    };
  } catch {
    return null;
  }
};

const normalizeRunSource = (source: unknown): ProductLabRunStatus["source"] => {
  if (source === "scheduled" || source === "manual" || source === "local" || source === "workflow_dispatch") return source;
  return "local";
};

const normalizeRunMode = (mode: unknown): ProductLabRunStatus["mode"] => {
  if (mode === "dryRun" || mode === "proposalOnly" || mode === "prMode" || mode === "autoMergeControlled") return mode;
  return "proposalOnly";
};

const normalizeRunStatus = (status: unknown): ProductLabRunStatus["status"] => {
  if (status === "started" || status === "completed" || status === "failed" || status === "skipped") return status;
  return "completed";
};

export const buildProductLabRunStatusFromQueue = (
  queue: ProductLabReviewQueue | null | undefined,
): ProductLabRunStatus | null => {
  if (!queue) return null;
  const runId =
    typeof queue.sourceRun === "object"
      ? [queue.sourceRun.runId, queue.sourceRun.date, queue.sourceRun.week, queue.sourceRun.theme].filter(Boolean).join("|")
      : "";

  return {
    runId: runId || "public-queue",
    source: queue.loadSource === "supabase" ? "scheduled" : queue.loadSource === "public" ? "local" : "local",
    mode: "proposalOnly",
    status: queue.loadSource === "fallback" ? "skipped" : "completed",
    dryRun: false,
    forceGenerate: false,
    startedAt: queue.generatedAt,
    completedAt: queue.generatedAt,
    proposalsGenerated: queue.items.length,
    proposalsSaved: queue.loadSource === "supabase" ? queue.items.length : 0,
    errorsCount: queue.loadSource === "fallback" ? 1 : 0,
    warningsCount: queue.loadSource === "supabase" ? 0 : 1,
    workflowRunUrl: "",
    reportSummary: queue.summary as Record<string, unknown>,
    sourceLabel: queue.loadSource === "supabase" ? "supabase" : queue.loadSource === "public" ? "queue" : "fallback",
  };
};

export const readProductLabLastRunStatusFromSupabase = async (
  scope: ProductLabScope = "v2",
): Promise<ProductLabRunStatus | null> => {
  const config = getProductLabScopeConfig(scope);
  if (!isSupabaseConfigured) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user.id) return null;

    const { data, error } = await dynamicSupabase
      .from(config.runsTable)
      .select(
        "run_id,source,mode,status,dry_run,force_generate,started_at,completed_at,proposals_generated,proposals_saved,errors_count,warnings_count,workflow_run_url,report_summary",
      )
      .order("started_at", { ascending: false })
      .limit(1);

    if (error || !Array.isArray(data) || !data.length || !isObject(data[0])) return null;

    const row = data[0];
    return {
      runId: typeof row.run_id === "string" ? row.run_id : "",
      source: normalizeRunSource(row.source),
      mode: normalizeRunMode(row.mode),
      status: normalizeRunStatus(row.status),
      dryRun: Boolean(row.dry_run),
      forceGenerate: Boolean(row.force_generate),
      startedAt: typeof row.started_at === "string" ? row.started_at : "",
      completedAt: typeof row.completed_at === "string" ? row.completed_at : "",
      proposalsGenerated: typeof row.proposals_generated === "number" ? row.proposals_generated : 0,
      proposalsSaved: typeof row.proposals_saved === "number" ? row.proposals_saved : 0,
      errorsCount: typeof row.errors_count === "number" ? row.errors_count : 0,
      warningsCount: typeof row.warnings_count === "number" ? row.warnings_count : 0,
      workflowRunUrl: typeof row.workflow_run_url === "string" ? row.workflow_run_url : "",
      reportSummary: isObject(row.report_summary) ? row.report_summary : {},
      sourceLabel: "supabase",
    };
  } catch {
    return null;
  }
};

const readProductLabReviewQueueFromPublic = async (scope: ProductLabScope): Promise<ProductLabReviewQueue | null> => {
  const config = getProductLabScopeConfig(scope);

  if (typeof fetch !== "function") return null;

  try {
    const response = await fetch(`${config.publicQueuePath}?t=${Date.now()}`);
    if (!response.ok) return null;
    const queue = (await response.json()) as ProductLabReviewQueue;
    return Array.isArray(queue.items) ? queue : null;
  } catch {
    return null;
  }
};

export const loadProductLabReviewQueue = async (scope: ProductLabScope = "v2"): Promise<ProductLabReviewQueue> => {
  const config = getProductLabScopeConfig(scope);
  const [remoteQueue, publicQueue] = await Promise.all([
    readProductLabReviewQueueFromSupabase(scope),
    readProductLabReviewQueueFromPublic(scope),
  ]);

  // Supabase is the source GitHub Actions reads for admin approvals.
  // Public JSON is only a visual fallback, even if it is newer locally.
  if (remoteQueue) return withQueueLoadMeta(remoteQueue, "supabase");
  if (publicQueue) return withQueueLoadMeta(publicQueue, "public");
  return withQueueLoadMeta(config.fallbackQueue, "fallback");
};

export const mergeProductLabReviewItems = (
  queue: ProductLabReviewQueue,
  decisions: ProductLabDecisionMap,
): ProductLabReviewItemWithDecision[] => {
  const queueRunKey = getProductLabQueueRunKey(queue);

  return queue.items.map((item) => {
    const itemRunKey = getProductLabItemRunKey(item, queue);
    const decision = decisions[item.id];
    const isDecisionForCurrentRun = decision && (!itemRunKey || decision.sourceRunKey === itemRunKey);

    return {
      ...item,
      localDecision: isDecisionForCurrentRun
        ? decision
        : {
            itemId: item.id,
            status: "pending",
            note: "",
            correctionRequest: "",
            rejectionMode: null,
            automationAction: "hold",
            decidedAt: "",
            applicationStatus: "pending",
            processedAt: "",
            processedRun: {},
            sourceRunKey: itemRunKey || queueRunKey,
            sourceRun: item.sourceRun ?? queue.sourceRun,
          },
    };
  });
};

export const getProductLabReviewStats = (items: ProductLabReviewItemWithDecision[]) => ({
  total: items.length,
  pending: items.filter((item) => item.localDecision.status === "pending").length,
  approved: items.filter((item) => item.localDecision.status === "approved").length,
  rejected: items.filter((item) => item.localDecision.status === "rejected").length,
  needsReview: items.filter((item) => item.localDecision.status === "needs_review").length,
});

export const exportProductLabDecisions = (decisions: ProductLabDecisionMap) =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      decisions: Object.values(decisions),
    },
    null,
    2,
  );

const normalizeDecisionStatus = (status: unknown): ProductLabDecisionStatus => {
  if (status === "approved" || status === "rejected" || status === "needs_review") return status;
  return "pending";
};

const normalizeRejectionMode = (mode: unknown): ProductLabRejectionMode => {
  if (mode === "ignore" || mode === "alternative") return mode;
  return null;
};

const normalizeAutomationAction = (action: unknown): ProductLabAutomationAction => {
  if (
    action === "authorize_next_run" ||
    action === "ignore" ||
    action === "request_alternative" ||
    action === "hold"
  ) {
    return action;
  }
  return "hold";
};

const normalizeApplicationStatus = (status: unknown): ProductLabApplicationStatus => {
  if (status === "pr_ready" || status === "skipped" || status === "validation_failed") return status;
  return "pending";
};

const normalizePrStatus = (status: unknown): ProductLabPrStatus => {
  if (
    status === "creating" ||
    status === "created" ||
    status === "checks_running" ||
    status === "checks_ok" ||
    status === "checks_failed"
  ) {
    return status;
  }
  return "not_created";
};

const normalizeAutoMergeStatus = (status: unknown): ProductLabAutoMergeStatus => {
  if (
    status === "eligible" ||
    status === "blocked" ||
    status === "auto_merge_requested" ||
    status === "auto_merge_request_failed" ||
    status === "merged"
  ) {
    return status;
  }
  return "not_requested";
};

const normalizeRiskLevel = (risk: unknown): "low" | "medium" | "high" => {
  if (risk === "high" || risk === "medium") return risk;
  return "low";
};

const getQueueTimestamp = (queue: ProductLabReviewQueue | null) => {
  const timestamp = Date.parse(queue?.generatedAt ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const withQueueLoadMeta = (queue: ProductLabReviewQueue, loadSource: ProductLabQueueSource): ProductLabReviewQueue => ({
  ...queue,
  loadSource,
  loadedAt: new Date().toISOString(),
});
