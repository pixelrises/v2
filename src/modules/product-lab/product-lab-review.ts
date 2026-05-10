import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export type ProductLabDecisionStatus = "pending" | "approved" | "rejected" | "needs_review";
export type ProductLabRejectionMode = "ignore" | "alternative" | null;
export type ProductLabAutomationAction = "hold" | "authorize_next_run" | "ignore" | "request_alternative";
export type ProductLabFindingDecision = "auto_safe" | "human_validation";
export type ProductLabApplicationStatus = "pending" | "pr_ready" | "skipped" | "validation_failed";
export type ProductLabScope = "v2" | "v1";
export type ProductLabQueueSource = "supabase" | "public" | "fallback";

export interface ProductLabReviewItem {
  id: string;
  title: string;
  module: string;
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
  };
  items: ProductLabReviewItem[];
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

export const getProductLabMissingTableMessage = (scope: ProductLabScope) =>
  scope === "v1"
    ? "Tables Product Lab V1 absentes ou cache Supabase non recharge. Applique la migration unique supabase/migrations/20260509194500_repair_product_lab_all_admin_tables_cache.sql en entier, puis relance l'admin."
    : "Tables Product Lab V2 absentes ou cache Supabase non recharge. Applique la migration unique supabase/migrations/20260509194500_repair_product_lab_all_admin_tables_cache.sql en entier, puis relance l'admin.";

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

export const getProductLabSourceRunKey = (sourceRun: unknown) => {
  if (!isObject(sourceRun)) return "";
  return [sourceRun.date, sourceRun.week, sourceRun.theme]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join("|");
};

export const getProductLabQueueRunKey = (queue: ProductLabReviewQueue | null | undefined) =>
  getProductLabSourceRunKey(queue?.sourceRun);

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

export const fallbackProductLabV1ReviewQueue: ProductLabReviewQueue = {
  generatedAt: new Date(0).toISOString(),
  sourceRun: {
    date: "v1-pending",
    week: "v1-pending",
    theme: "Product Lab V1",
    reportPath: "reports/product-lab-v1/daily/",
  },
  summary: {
    total: 1,
    maxAutoSafePatches: 2,
    sensitiveChangesRequireApproval: true,
    dailySummary:
      "Le Product Lab V1 est pilote depuis cet admin avec des tables separees. Si cette carte reste visible, verifier le workflow V1, la migration Supabase ou le cache schema.",
    averageScore: 0,
    lowestScore: {
      name: "Product Lab V1",
      note: 0,
    },
  },
  items: [
    {
      id: "v1-product-lab-setup",
      title: "Brancher le Product Lab V1",
      module: "Product Lab V1",
      simpleSummary:
        "Connecter la V1 a ses tables separees pour auditer le generateur V1 et remonter les decisions dans cet admin.",
      priority: "Critique",
      impact: "Eleve",
      risk: "Faible",
      difficulty: "Moyenne",
      status: "A brancher",
      inspiration: "Linear / Vercel",
      decision: "human_validation",
      description:
        "La V1 doit continuer a utiliser product_lab_v1_review_items et product_lab_v1_decisions, sans melanger les donnees V2.",
      scoreImpact: 30,
      sourceReport: "reports/product-lab-v1/daily/",
      automationPolicy:
        "Validation humaine requise. Cette carte est un placeholder admin tant que le workflow V1 ne publie pas encore ses propositions.",
      concernedFiles: [
        "C:/Users/rkf/Documents/New project/pixelrises-export/.github/workflows",
        "product_lab_v1_review_items",
        "product_lab_v1_decisions",
      ],
      beforeState: "Le centre commun peut basculer en fallback si les tables ou le cache Supabase V1 ne repondent pas.",
      afterState: "Les propositions V1 restent visibles et decidables depuis ce meme admin, avec stockage V1 separe.",
    },
  ],
};

export const productLabScopeConfigs: Record<ProductLabScope, ProductLabScopeConfig> = {
  v2: {
    scope: "v2",
    label: "Pixelrises V2",
    reviewTable: "product_lab_review_items",
    decisionsTable: "product_lab_decisions",
    storageKey: "pixelrises-v2-product-lab-decisions",
    publicQueuePath: "/product-lab-review.json",
    fallbackQueue: fallbackProductLabReviewQueue,
  },
  v1: {
    scope: "v1",
    label: "Pixelrises V1",
    reviewTable: "product_lab_v1_review_items",
    decisionsTable: "product_lab_v1_decisions",
    storageKey: "pixelrises-v1-product-lab-decisions",
    publicQueuePath: "/product-lab-v1-review.json",
    fallbackQueue: fallbackProductLabV1ReviewQueue,
  },
};

export const getProductLabScopeConfig = (scope: ProductLabScope = "v2") => productLabScopeConfigs[scope];

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
        config.scope === "v1"
          ? "item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at,source_run,pr_url,pr_number,pr_ready_at"
          : "item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at,source_run,application_status,processed_at,processed_run",
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
      const isV1PrReady = config.scope === "v1" && record.status === "pr_ready";
      const prUrl = typeof record.pr_url === "string" ? record.pr_url : "";
      const prNumber = typeof record.pr_number === "number" ? record.pr_number : null;
      const prReadyAt = typeof record.pr_ready_at === "string" ? record.pr_ready_at : "";
      const sourceRun = isObject(record.source_run)
        ? (record.source_run as ProductLabReviewQueue["sourceRun"])
        : undefined;

      accumulator[itemId] = {
        itemId,
        status: isV1PrReady ? "approved" : normalizeDecisionStatus(record.status),
        note: typeof record.admin_note === "string" ? record.admin_note : "",
        correctionRequest:
          typeof record.correction_request === "string" ? record.correction_request : "",
        rejectionMode: normalizeRejectionMode(record.rejection_mode),
        automationAction: normalizeAutomationAction(record.automation_action),
        decidedAt: typeof record.decided_at === "string" ? record.decided_at : "",
        applicationStatus: isV1PrReady ? "pr_ready" : normalizeApplicationStatus(record.application_status),
        processedAt:
          typeof record.processed_at === "string"
            ? record.processed_at
            : prReadyAt,
        processedRun: isObject(record.processed_run)
          ? record.processed_run
          : prUrl
            ? { prUrl, prNumber }
            : {},
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

    const basePayload = {
      item_id: decision.itemId,
      source_run: queue.sourceRun,
      review_item: item,
      status: decision.status,
      admin_note: decision.note,
      correction_request: decision.correctionRequest,
      rejection_mode: decision.rejectionMode,
      automation_action: decision.automationAction,
      decided_by: userId,
      decided_at: decision.decidedAt || new Date().toISOString(),
    };
    const payload =
      config.scope === "v1"
        ? basePayload
        : {
            ...basePayload,
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
  const queueRunKey = getProductLabQueueRunKey(queue);

  return Object.values(decisions).filter(
    (decision) =>
      decision.status !== "pending" &&
      decision.persisted !== "supabase" &&
      (!visibleItemIds || visibleItemIds.has(decision.itemId)) &&
      (!queueRunKey || decision.sourceRunKey === queueRunKey),
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
        sourceRunKey: getProductLabQueueRunKey(queue),
        sourceRun: queue.sourceRun,
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
      .select("item_id,source_run,queue_summary,review_item,generated_at")
      .order("generated_at", { ascending: false })
      .limit(100);

    if (error || !Array.isArray(data) || data.length === 0) return null;

    const rows = data.filter(isObject);
    const latest = rows[0] ?? {};
    const sourceRun = isObject(latest.source_run) ? latest.source_run : {};
    const currentRunKey = getProductLabSourceRunKey(sourceRun);
    const currentRows = currentRunKey
      ? rows.filter((row) => getProductLabSourceRunKey(isObject(row.source_run) ? row.source_run : {}) === currentRunKey)
      : rows;

    const items = currentRows
      .map((row) =>
        normalizeReviewItem(
          row.review_item,
          typeof row.item_id === "string" ? row.item_id : "",
        ),
      )
      .filter((item): item is ProductLabReviewItem => Boolean(item));

    if (!items.length) return null;

    const queueSummary = isObject(latest.queue_summary) ? latest.queue_summary : {};

    return {
      generatedAt:
        typeof latest.generated_at === "string" ? latest.generated_at : new Date().toISOString(),
      sourceRun: {
        date: typeof sourceRun.date === "string" ? sourceRun.date : "supabase",
        week: typeof sourceRun.week === "string" ? sourceRun.week : "supabase",
        theme: typeof sourceRun.theme === "string" ? sourceRun.theme : config.label,
        reportPath:
          typeof sourceRun.reportPath === "string"
            ? sourceRun.reportPath
            : config.fallbackQueue.sourceRun.reportPath,
      },
      summary: {
        total: typeof queueSummary.total === "number" ? queueSummary.total : items.length,
        maxAutoSafePatches:
          typeof queueSummary.maxAutoSafePatches === "number" ? queueSummary.maxAutoSafePatches : 2,
        sensitiveChangesRequireApproval:
          typeof queueSummary.sensitiveChangesRequireApproval === "boolean"
            ? queueSummary.sensitiveChangesRequireApproval
            : true,
        dailySummary:
          typeof queueSummary.dailySummary === "string"
            ? queueSummary.dailySummary
            : "Propositions Product Lab chargees depuis Supabase.",
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

const getQueueGeneratedTime = (queue: ProductLabReviewQueue | null | undefined) => {
  const timestamp = Date.parse(queue?.generatedAt ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const loadProductLabReviewQueue = async (scope: ProductLabScope = "v2"): Promise<ProductLabReviewQueue> => {
  const config = getProductLabScopeConfig(scope);
  const [remoteQueue, publicQueue] = await Promise.all([
    readProductLabReviewQueueFromSupabase(scope),
    readProductLabReviewQueueFromPublic(scope),
  ]);

  if (remoteQueue && publicQueue) {
    const publicIsFresher = getQueueGeneratedTime(publicQueue) > getQueueGeneratedTime(remoteQueue);
    return withQueueLoadMeta(publicIsFresher ? publicQueue : remoteQueue, publicIsFresher ? "public" : "supabase");
  }

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
    const decision = decisions[item.id];
    const isDecisionForCurrentRun = decision && (!queueRunKey || decision.sourceRunKey === queueRunKey);

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
            sourceRunKey: queueRunKey,
            sourceRun: queue.sourceRun,
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

const getQueueTimestamp = (queue: ProductLabReviewQueue | null) => {
  const timestamp = Date.parse(queue?.generatedAt ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const withQueueLoadMeta = (queue: ProductLabReviewQueue, loadSource: ProductLabQueueSource): ProductLabReviewQueue => ({
  ...queue,
  loadSource,
  loadedAt: new Date().toISOString(),
});
