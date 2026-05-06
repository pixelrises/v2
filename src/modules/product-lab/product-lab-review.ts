import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export type ProductLabDecisionStatus = "pending" | "approved" | "rejected" | "needs_review";
export type ProductLabRejectionMode = "ignore" | "alternative" | null;
export type ProductLabAutomationAction = "hold" | "authorize_next_run" | "ignore" | "request_alternative";

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
  decision: "human_validation";
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
  persisted?: "supabase" | "localStorage";
  persistedError?: string;
}

export type ProductLabDecisionMap = Record<string, ProductLabDecision>;

export interface ProductLabReviewItemWithDecision extends ProductLabReviewItem {
  localDecision: ProductLabDecision;
}

const PRODUCT_LAB_DECISIONS_KEY = "pixelrises-v2-product-lab-decisions";

type DbError = { message: string } | null;

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

const canUseBrowserStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export const readProductLabDecisions = (): ProductLabDecisionMap => {
  if (!canUseBrowserStorage()) return {};

  try {
    const raw = window.localStorage.getItem(PRODUCT_LAB_DECISIONS_KEY);
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
  } = {},
) => {
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
      persisted: "localStorage",
    },
  };

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(PRODUCT_LAB_DECISIONS_KEY, JSON.stringify(nextDecisions));
  }

  return nextDecisions;
};

export const readProductLabDecisionsFromSupabase = async (): Promise<{
  decisions: ProductLabDecisionMap;
  persisted: boolean;
  error?: string;
}> => {
  const localDecisions = readProductLabDecisions();
  if (!isSupabaseConfigured) return { decisions: localDecisions, persisted: false };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user.id) return { decisions: localDecisions, persisted: false };

    const { data, error } = await dynamicSupabase
      .from("product_lab_decisions")
      .select("item_id,status,admin_note,correction_request,rejection_mode,automation_action,decided_at")
      .order("decided_at", { ascending: false })
      .limit(500);

    if (error || !Array.isArray(data)) {
      return { decisions: localDecisions, persisted: false, error: error?.message };
    }

    const remoteDecisions = data.reduce<ProductLabDecisionMap>((accumulator, row) => {
      const record = row as Record<string, unknown>;
      const itemId = typeof record.item_id === "string" ? record.item_id : "";
      if (!itemId) return accumulator;

      accumulator[itemId] = {
        itemId,
        status: normalizeDecisionStatus(record.status),
        note: typeof record.admin_note === "string" ? record.admin_note : "",
        correctionRequest:
          typeof record.correction_request === "string" ? record.correction_request : "",
        rejectionMode: normalizeRejectionMode(record.rejection_mode),
        automationAction: normalizeAutomationAction(record.automation_action),
        decidedAt: typeof record.decided_at === "string" ? record.decided_at : "",
        persisted: "supabase",
      };
      return accumulator;
    }, {});

    const merged = { ...localDecisions, ...remoteDecisions };
    if (canUseBrowserStorage()) {
      window.localStorage.setItem(PRODUCT_LAB_DECISIONS_KEY, JSON.stringify(merged));
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
): Promise<{ persisted: boolean; error?: string }> => {
  if (!isSupabaseConfigured) return { persisted: false };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return { persisted: false, error: "Session admin absente." };

    const { error } = await dynamicSupabase.from("product_lab_decisions").upsert(
      {
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
      },
      { onConflict: "item_id" },
    );

    if (error) return { persisted: false, error: error.message };
    return { persisted: true };
  } catch (error) {
    return {
      persisted: false,
      error: error instanceof Error ? error.message : "Sauvegarde Supabase impossible.",
    };
  }
};

export const loadProductLabReviewQueue = async (): Promise<ProductLabReviewQueue> => {
  if (typeof fetch !== "function") return fallbackProductLabReviewQueue;

  try {
    const response = await fetch(`/product-lab-review.json?t=${Date.now()}`);
    if (!response.ok) return fallbackProductLabReviewQueue;
    const queue = (await response.json()) as ProductLabReviewQueue;
    return Array.isArray(queue.items) ? queue : fallbackProductLabReviewQueue;
  } catch {
    return fallbackProductLabReviewQueue;
  }
};

export const mergeProductLabReviewItems = (
  queue: ProductLabReviewQueue,
  decisions: ProductLabDecisionMap,
): ProductLabReviewItemWithDecision[] =>
  queue.items.map((item) => ({
    ...item,
    localDecision: decisions[item.id] ?? {
      itemId: item.id,
      status: "pending",
      note: "",
      correctionRequest: "",
      rejectionMode: null,
      automationAction: "hold",
      decidedAt: "",
    },
  }));

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
