export type ProductLabDecisionStatus = "pending" | "approved" | "rejected" | "needs_review";

export interface ProductLabReviewItem {
  id: string;
  title: string;
  module: string;
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
  };
  items: ProductLabReviewItem[];
}

export interface ProductLabDecision {
  itemId: string;
  status: ProductLabDecisionStatus;
  note: string;
  decidedAt: string;
}

export type ProductLabDecisionMap = Record<string, ProductLabDecision>;

export interface ProductLabReviewItemWithDecision extends ProductLabReviewItem {
  localDecision: ProductLabDecision;
}

const PRODUCT_LAB_DECISIONS_KEY = "pixelrises-v2-product-lab-decisions";

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
  },
  items: [
    {
      id: "local-agent-builder-security",
      title: "Durcir la securite des actions agents",
      module: "Agent Builder",
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
) => {
  const nextDecisions: ProductLabDecisionMap = {
    ...decisions,
    [itemId]: {
      itemId,
      status,
      note,
      decidedAt: new Date().toISOString(),
    },
  };

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(PRODUCT_LAB_DECISIONS_KEY, JSON.stringify(nextDecisions));
  }

  return nextDecisions;
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
