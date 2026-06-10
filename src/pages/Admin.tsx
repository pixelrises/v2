import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  Search,
  Shield,
  TrendingUp,
  Users,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildAuthRoute, getCurrentRelativeUrl } from "@/lib/auth-redirect";
import { isLocalAuthBypassEnabled } from "@/lib/browser-context";
import { tryBootstrapAdmin } from "@/lib/admin-bootstrap";
import { sanitizeTextDeep } from "@/lib/text-sanitize";
import { resolvePublishedSiteUrl } from "@/lib/published-site";
import { BILLING_PLANS, getPlanBudgetConfig, getPlanCreditValueEur, type PlanKey } from "@/lib/billing";
import { redactSecrets } from "@/modules/ai/security/redactSecrets";
import {
  exportProductLabDecisions,
  buildProductLabRunStatusFromQueue,
  getProductLabQueueRunKey,
  getProductLabItemRunKey,
  getProductLabScopeConfig,
  getProductLabReviewStats,
  loadProductLabReviewQueue,
  mergeProductLabReviewItems,
  persistProductLabDecisionToSupabase,
  readProductLabDecisionsFromSupabase,
  readProductLabLastRunStatusFromSupabase,
  readProductLabDecisions,
  getUnsyncedProductLabDecisions,
  syncProductLabDecisionsToLocalRunner,
  syncProductLabDecisionsToSupabase,
  writeProductLabDecision,
  type ProductLabAutomationAction,
  type ProductLabDecisionMap,
  type ProductLabDecisionStatus,
  type ProductLabQueueSource,
  type ProductLabRejectionMode,
  type ProductLabScope,
  type ProductLabReviewQueue,
  type ProductLabReviewItemWithDecision,
  type ProductLabRunStatus,
  type ProductLabProposalDomain,
} from "@/modules/product-lab/product-lab-review";
import { aiSpacesList } from "@/modules/ai-spaces";

type Tab = "overview" | "users" | "credits" | "sites" | "payments" | "leads" | "ai-spaces" | "product-lab";

const productLabScopeOptions: Array<{
  id: ProductLabScope;
  label: string;
  description: string;
  workflowUrl: string;
}> = [
  {
    id: "v2",
    label: "Pixelrises V2",
    description: "Plateforme SaaS, builders, Multi-IA, données et moteur IA serveur.",
    workflowUrl: "https://github.com/pixelrises/v2/actions/workflows/product-lab-nightly.yml",
  },
];

const productLabQueueSourceMeta: Record<
  ProductLabQueueSource,
  { label: string; tone: string; description: string }
> = {
  supabase: {
    label: "Supabase live",
    tone: "border-green-400/20 bg-green-400/10 text-green-200",
    description: "Les propositions viennent de la base et sont pretes pour validation admin.",
  },
  public: {
    label: "JSON secours",
    tone: "border-blue-400/20 bg-blue-400/10 text-blue-200",
    description: "Les propositions viennent du fichier public de secours; les decisions restent synchronisables.",
  },
  fallback: {
    label: "Secours local",
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    description: "Aucune file live n'a ete trouvee; l'admin affiche une carte de configuration.",
  },
};

const productLabDomainMeta: Record<ProductLabProposalDomain, { label: string; tone: string; description: string }> = {
  marketing: {
    label: "Marketing",
    tone: "border-rose-300/25 bg-rose-300/[0.08] text-rose-100",
    description: "Conversion, promesse, pricing, activation ou tunnel client.",
  },
  systeme: {
    label: "Systeme",
    tone: "border-sky-300/25 bg-sky-300/[0.08] text-sky-100",
    description: "CI, Product Lab, Supabase, securite, billing ou architecture.",
  },
  seo: {
    label: "SEO",
    tone: "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100",
    description: "Referencement, structure locale, meta, FAQ ou visibilite Google.",
  },
  generateur: {
    label: "Generateur",
    tone: "border-primary/25 bg-primary/[0.1] text-primary",
    description: "Site Builder, Game Builder, preview, export ou quality gate.",
  },
  ia: {
    label: "IA",
    tone: "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100",
    description: "Orchestration IA, prompts, agents, modele, fallback ou AI Spaces.",
  },
};

const productLabAutoMergeMeta: Record<string, { label: string; tone: string; detail: string }> = {
  eligible: {
    label: "Auto-merge eligible",
    tone: "border-green-400/25 bg-green-400/[0.08] text-green-100",
    detail: "Validation admin + checks OK + aucun fichier sensible detecte.",
  },
  auto_merge_requested: {
    label: "Auto-merge demande",
    tone: "border-green-400/25 bg-green-400/[0.08] text-green-100",
    detail: "GitHub peut merger quand les protections de branche sont satisfaites.",
  },
  merged: {
    label: "Auto-merge effectue",
    tone: "border-green-400/25 bg-green-400/[0.08] text-green-100",
    detail: "La PR a ete fusionnee automatiquement apres controles.",
  },
  blocked: {
    label: "Auto-merge bloque",
    tone: "border-amber-400/25 bg-amber-400/[0.08] text-amber-100",
    detail: "Validation GitHub manuelle requise ou fichier sensible detecte.",
  },
  auto_merge_request_failed: {
    label: "Auto-merge non active",
    tone: "border-amber-400/25 bg-amber-400/[0.08] text-amber-100",
    detail: "La demande GitHub a echoue; verifie les reglages auto-merge du repo.",
  },
  not_requested: {
    label: "Auto-merge non demande",
    tone: "border-white/10 bg-white/[0.04] text-muted-foreground",
    detail: "Aucune PR eligible n'a encore ete creee pour cette decision.",
  },
};

const productLabPrStatusMeta: Record<string, { label: string; tone: string }> = {
  created: { label: "PR creee", tone: "border-blue-400/25 bg-blue-400/[0.08] text-blue-100" },
  checks_running: { label: "Checks en cours", tone: "border-blue-400/25 bg-blue-400/[0.08] text-blue-100" },
  checks_ok: { label: "Checks OK", tone: "border-green-400/25 bg-green-400/[0.08] text-green-100" },
  checks_failed: { label: "Checks echoues", tone: "border-red-400/25 bg-red-400/[0.08] text-red-100" },
  not_created: { label: "PR non creee", tone: "border-white/10 bg-white/[0.04] text-muted-foreground" },
};

type ProductLabPersistenceState = "loading" | "supabase" | "localStorage";
type ProductLabScopeDashboardStats = ReturnType<typeof getProductLabReviewStats>;

interface ProductLabScopeDashboardState {
  queue: ProductLabReviewQueue | null;
  stats: ProductLabScopeDashboardStats;
  source: ProductLabQueueSource;
  persistence: ProductLabPersistenceState;
  error: string | null;
  generatedAtLabel: string;
  freshness: string;
}

const productLabScopes = productLabScopeOptions.map((option) => option.id);

const emptyProductLabStats: ProductLabScopeDashboardStats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  needsReview: 0,
};

const formatProductLabGeneratedAt = (queue: ProductLabReviewQueue | null) => {
  const timestamp = Date.parse(queue?.generatedAt ?? "");
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "En attente";
  return new Date(timestamp).toLocaleString("fr-FR");
};

const getProductLabFreshness = (queue: ProductLabReviewQueue | null) => {
  const timestamp = Date.parse(queue?.generatedAt ?? "");
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Pas encore alimente";
  const hours = Math.max(0, (Date.now() - timestamp) / 1000 / 60 / 60);
  if (hours < 30) return "A jour";
  if (hours < 168) return "Ancien, a surveiller";
  return "Trop ancien, relancer le workflow";
};

const formatProductLabTimestamp = (value: string | null | undefined) => {
  const timestamp = Date.parse(value ?? "");
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Non prouve";
  return new Date(timestamp).toLocaleString("fr-FR");
};

const getProductLabScheduleStatus = () => {
  const now = new Date();
  const parisParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const parisHour = Number(parisParts.find((part) => part.type === "hour")?.value ?? "0");
  const utcHour = now.getUTCHours();
  const offset = ((parisHour - utcHour + 24) % 24) || 24;
  const activeUtcHour = (24 - offset) % 24;

  return {
    configured: "00:00 Europe/Paris",
    utc: `${String(activeUtcHour).padStart(2, "0")}:00 UTC aujourd'hui`,
    crons: "22:00 UTC ete / 23:00 UTC hiver",
    next: "Prochaine fenetre: prochain minuit Europe/Paris",
    note: "GitHub Actions peut decaler l'execution de quelques minutes selon sa file.",
  };
};

const buildProductLabScopeDashboardState = (
  queue: ProductLabReviewQueue | null,
  decisions: ProductLabDecisionMap,
  persistence: ProductLabPersistenceState,
  error: string | null,
): ProductLabScopeDashboardState => {
  const mergedItems = queue ? mergeProductLabReviewItems(queue, decisions) : [];

  return {
    queue,
    stats: queue ? getProductLabReviewStats(mergedItems) : emptyProductLabStats,
      source: queue?.loadSource ?? "fallback",
    persistence,
    error,
    generatedAtLabel: formatProductLabGeneratedAt(queue),
    freshness: getProductLabFreshness(queue),
  };
};

const createProductLabScopeDashboardDefaults = (): Record<ProductLabScope, ProductLabScopeDashboardState> =>
  productLabScopes.reduce(
    (accumulator, scope) => ({
      ...accumulator,
      [scope]: buildProductLabScopeDashboardState(null, {}, "loading", null),
    }),
    {} as Record<ProductLabScope, ProductLabScopeDashboardState>,
  );

interface UserRow {
  user_id: string;
  display_name: string | null;
  credits: number;
  total_used: number;
  sites_count: number;
  role: string;
  created_at?: string;
}

interface SiteRow {
  id: string;
  business_name: string;
  business_type: string | null;
  city: string | null;
  custom_domain?: string | null;
  slug?: string | null;
  domain_status?: string | null;
  status: string;
  created_at: string;
  user_id: string;
  version?: number;
  published_at?: string | null;
  owner_name?: string;
}

interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  recommendation: string | null;
  created_at: string;
  notes: string | null;
}

interface StripeOrder {
  id: string;
  type: string;
  processed_at: string;
  amount?: number;
  currency?: string;
  customer_email?: string;
  description?: string;
  status?: string;
  credits_added?: number;
  resolved_via?: string | null;
  event_note?: string | null;
}

interface CreditTransactionRow {
  id: string;
  user_id: string;
  delta: number;
  source_type: string;
  source_id: string | null;
  balance_after: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  display_name?: string | null;
}

interface ProfileSummaryRow {
  user_id: string;
  display_name: string | null;
  created_at?: string;
}

interface MonthlyCreditPreset {
  key: PlanKey;
  label: string;
  credits: number;
  priceMonthlyEur: number;
  creditValueEur: number | null;
  monthlyAiBudgetEur: number | null;
  targetGrossMarginRatio: number | null;
}

interface StripeEventPayload {
  status?: string;
  info?: {
    creditsAdded?: number;
    credits_added?: number;
    via?: string | null;
    resolved_via?: string | null;
    reason?: string | null;
    sourceType?: string | null;
  };
  object?: {
    amount_total?: number;
    amount_paid?: number;
    amount_due?: number;
    currency?: string;
    customer_email?: string | null;
    customer_details?: { email?: string | null };
    lines?: { data?: Array<{ description?: string | null }> };
    metadata?: { product_name?: string | null; plan?: string | null };
  };
  data?: {
    object?: {
      amount_total?: number;
      amount_paid?: number;
      amount_due?: number;
      currency?: string;
      customer_email?: string | null;
      customer_details?: { email?: string | null };
      lines?: { data?: Array<{ description?: string | null }> };
      metadata?: { product_name?: string | null; plan?: string | null };
    };
  };
}

interface StripeEventRow {
  id: string;
  type: string;
  processed_at: string;
  payload: StripeEventPayload | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400",
  contacted: "bg-yellow-500/10 text-yellow-400",
  in_progress: "bg-primary/10 text-primary",
  converted: "bg-green-500/10 text-green-400",
  closed: "bg-muted text-muted-foreground",
  generated: "bg-primary/10 text-primary",
  published: "bg-green-500/10 text-green-400",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const BILLING_ADMIN_PLAN_KEYS: PlanKey[] = ["starter", "pro", "business"];

const formatAdminEuro = (value: number | null | undefined, maximumFractionDigits = 2) => {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits,
  }).format(value);
};

const MONTHLY_CREDIT_PRESETS: MonthlyCreditPreset[] = BILLING_ADMIN_PLAN_KEYS.map((planKey) => {
  const plan = BILLING_PLANS.find((item) => item.key === planKey);
  const budget = getPlanBudgetConfig(planKey);

  return {
    key: planKey,
    label: plan?.name ?? planKey,
    credits: plan?.monthlyCredits ?? 0,
    priceMonthlyEur: plan?.priceMonthlyEur ?? 0,
    creditValueEur: getPlanCreditValueEur(planKey),
    monthlyAiBudgetEur: budget.monthlyAiBudgetEur,
    targetGrossMarginRatio: budget.targetGrossMarginRatio,
  };
});

const productLabNightlyCycle = [
  {
    step: "00h Europe/Paris",
    detail: "Le workflow V2 se lance depuis le repo GitHub pixelrises/v2.",
  },
  {
    step: "Audit complet",
    detail: "Le Product Lab teste generateur, UX, bugs, securite, responsive, IA et qualite produit.",
  },
  {
    step: "8 propositions",
    detail: "Les signaux sont classes par domaine pour remonter assez de matiere sans noyer la validation admin.",
  },
  {
    step: "Validation admin",
    detail: "Tu valides, corriges, demandes une alternative ou refuses depuis ce centre unique.",
  },
  {
    step: "PR controlee",
    detail: "Le run suivant applique uniquement les validations, puis ouvre une PR si lint/tests/build sont verts.",
  },
];

const productLabDataProtectionRules = [
  "La V2 utilise ses tables Product Lab dediees dans Supabase.",
  "Les decisions admin passent par RLS et role admin; le service role reste cote GitHub Actions uniquement.",
  "Aucune cle API, aucun token et aucun secret ne doit etre affiche, loggue ou stocke dans l'admin.",
  "Les changements auth, paiement, policies Supabase, moteur IA, production ou suppression majeure restent bloques.",
  "Le Product Lab peut proposer fort, mais il ne merge pas et ne deploie pas sans validation humaine.",
];

const ADMIN_CACHE_PREFIX = "pixelrises:isAdmin:";
const ADMIN_REQUEST_TIMEOUT_MS = 4000;
const PRODUCT_LAB_LOAD_TIMEOUT_MS = 6500;

type ProductLabDecisionsLoadResult = Awaited<ReturnType<typeof readProductLabDecisionsFromSupabase>>;
type ProductLabStateLoadResult = [ProductLabReviewQueue, ProductLabDecisionsLoadResult];

const resolveWithTimeout = async <T,>(promise: Promise<T>, timeoutMs = ADMIN_REQUEST_TIMEOUT_MS) => {
  let timer: number | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = window.setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      window.clearTimeout(timer);
    }
  }
};

const getAdminCacheKey = (userId: string) => `${ADMIN_CACHE_PREFIX}${userId}`;

const writeCachedAdminFlag = (userId: string, value: boolean) => {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(getAdminCacheKey(userId), "1");
    return;
  }
  window.sessionStorage.removeItem(getAdminCacheKey(userId));
};

const getReadableAdminError = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === "string") return redactSecrets(error);
  if (error instanceof Error && error.message) return redactSecrets(error.message);

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .map((part) => part.trim());

    if (parts.length > 0) return redactSecrets(parts.join(" "));
  }

  return fallback;
};

const joinProductLabLoadErrors = (...errors: Array<string | null | undefined>) => {
  const cleanErrors = errors
    .filter((error): error is string => Boolean(error && error.trim()))
    .filter((error, index, allErrors) => allErrors.indexOf(error) === index);

  return cleanErrors.length ? cleanErrors.join(" ") : undefined;
};

const loadProductLabStateSafely = async (
  scope: ProductLabScope,
  messages: {
    queueTimeout: string;
    queueError: string;
    decisionsTimeout: string;
    decisionsError: string;
  },
): Promise<ProductLabStateLoadResult> => {
  const config = getProductLabScopeConfig(scope);
  const [queueState, decisionsState] = await Promise.allSettled([
    resolveWithTimeout(loadProductLabReviewQueue(scope), PRODUCT_LAB_LOAD_TIMEOUT_MS),
    resolveWithTimeout(readProductLabDecisionsFromSupabase(scope), PRODUCT_LAB_LOAD_TIMEOUT_MS),
  ]);

  const fallbackQueue: ProductLabReviewQueue = {
    ...config.fallbackQueue,
    loadSource: "fallback",
    loadedAt: new Date().toISOString(),
  };

  const queue =
    queueState.status === "fulfilled" && queueState.value
      ? queueState.value
      : fallbackQueue;

  const queueError =
    queueState.status === "fulfilled"
      ? queueState.value
        ? null
        : messages.queueTimeout
      : getReadableAdminError(queueState.reason, messages.queueError);

  const decisionsResult: ProductLabDecisionsLoadResult =
    decisionsState.status === "fulfilled" && decisionsState.value
      ? decisionsState.value
      : {
          decisions: readProductLabDecisions(scope),
          persisted: false,
          error:
            decisionsState.status === "fulfilled"
              ? messages.decisionsTimeout
              : getReadableAdminError(decisionsState.reason, messages.decisionsError),
        };

  return [
    queue,
    {
      ...decisionsResult,
      error: joinProductLabLoadErrors(queueError, decisionsResult.error),
    },
  ];
};

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [orders, setOrders] = useState<StripeOrder[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransactionRow[]>([]);
  const [creditInput, setCreditInput] = useState<Record<string, string>>({});
  const [monthlyGrantLoading, setMonthlyGrantLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [productLabScope, setProductLabScope] = useState<ProductLabScope>("v2");
  const [productLabQueue, setProductLabQueue] = useState<ProductLabReviewQueue | null>(null);
  const [productLabLoading, setProductLabLoading] = useState(true);
  const [productLabDecisions, setProductLabDecisions] = useState<ProductLabDecisionMap>(() =>
    readProductLabDecisions("v2"),
  );
  const [productLabNotes, setProductLabNotes] = useState<Record<string, string>>({});
  const [productLabCorrectionRequests, setProductLabCorrectionRequests] = useState<Record<string, string>>({});
  const [productLabPersistence, setProductLabPersistence] = useState<ProductLabPersistenceState>("loading");
  const [productLabPersistenceError, setProductLabPersistenceError] = useState<string | null>(null);
  const [productLabDecisionSaving, setProductLabDecisionSaving] = useState<string | null>(null);
  const [productLabRunStatus, setProductLabRunStatus] = useState<ProductLabRunStatus | null>(null);
  const [productLabScopeDashboard, setProductLabScopeDashboard] = useState<Record<ProductLabScope, ProductLabScopeDashboardState>>(
    () => createProductLabScopeDashboardDefaults(),
  );
  const activeProductLabScopeRef = useRef<ProductLabScope>("v2");
  const productLabScopeConfig = getProductLabScopeConfig(productLabScope);

  const loadAdminData = useCallback(async () => {
    const adminResults = await resolveWithTimeout(
      Promise.all([
        supabase.from("profiles").select("user_id, display_name, created_at"),
        supabase.from("user_credits").select("user_id, credits, total_used"),
        supabase
          .from("generated_sites")
          .select(
            "id, business_name, business_type, city, custom_domain, slug, domain_status, status, created_at, published_at, user_id, version",
          )
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("delegation_leads").select("*").order("created_at", { ascending: false }),
        supabase
          .from("stripe_events")
          .select("id, type, processed_at, payload")
          .order("processed_at", { ascending: false })
          .limit(200),
        supabase
          .from("credit_transactions")
          .select("id, user_id, delta, source_type, source_id, balance_after, metadata, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
      ]),
      ADMIN_REQUEST_TIMEOUT_MS,
    );

    if (!adminResults) {
      setUsers([]);
      setSites([]);
      setLeads([]);
      setOrders([]);
      setCreditTransactions([]);
      toast({
        title: "Admin en mode secours",
        description: "Supabase met trop longtemps a repondre. L'interface reste accessible; clique Recharger pour retenter.",
      });
      return;
    }

    const [profilesRes, creditsRes, sitesRes, rolesRes, leadsRes, eventsRes, creditTransactionsRes] = adminResults;

    const profileMap: Record<string, string> = {};
    profilesRes.data?.forEach((profile: ProfileSummaryRow) => {
      profileMap[profile.user_id] = profile.display_name || "-";
    });

    const siteCounts: Record<string, number> = {};
    sitesRes.data?.forEach((site) => {
      siteCounts[site.user_id] = (siteCounts[site.user_id] || 0) + 1;
    });

    const roleMap: Record<string, string> = {};
    rolesRes.data?.forEach((entry) => {
      roleMap[entry.user_id] = entry.role;
    });

    const creditMap: Record<string, { credits: number; total_used: number }> = {};
    creditsRes.data?.forEach((credit) => {
      creditMap[credit.user_id] = {
        credits: credit.credits,
        total_used: credit.total_used,
      };
    });

    const mergedUsers: UserRow[] = (profilesRes.data || []).map((profile: ProfileSummaryRow) => ({
      user_id: profile.user_id,
      display_name: profile.display_name,
      credits: creditMap[profile.user_id]?.credits ?? 0,
      total_used: creditMap[profile.user_id]?.total_used ?? 0,
      sites_count: siteCounts[profile.user_id] || 0,
      role: roleMap[profile.user_id] || "user",
      created_at: profile.created_at,
    }));

    const sitesWithOwner = (sitesRes.data || []).map((site: SiteRow) => ({
      ...site,
      owner_name: profileMap[site.user_id] || "-",
    }));

    const parsedOrders: StripeOrder[] = ((eventsRes.data || []) as StripeEventRow[])
      .filter((event) =>
        ["checkout.session.completed", "invoice.paid", "invoice.payment_succeeded"].includes(event.type),
      )
      .map((event) => {
        const payload = event.payload || {};
        const object = payload?.object || payload?.data?.object || {};
        const info = payload?.info || {};
        return {
          id: event.id,
          type: event.type,
          processed_at: event.processed_at,
          amount: (object.amount_total ?? object.amount_paid ?? object.amount_due ?? 0) / 100,
          currency: (object.currency || "eur").toUpperCase(),
          customer_email: object.customer_email || object.customer_details?.email || "-",
          description:
            object.lines?.data?.[0]?.description ||
            object.metadata?.product_name ||
            object.metadata?.plan ||
            "Achat Pixelrises",
          status: payload?.status || "ok",
          credits_added: info?.creditsAdded || info?.credits_added || 0,
          resolved_via: info?.via || info?.resolved_via || null,
          event_note: info?.reason || info?.sourceType || null,
        };
      });

    const parsedTransactions: CreditTransactionRow[] = (creditTransactionsRes.data || []).map((entry: CreditTransactionRow) => ({
      ...entry,
      display_name: profileMap[entry.user_id] || "-",
    }));

    setUsers(sanitizeTextDeep(mergedUsers));
    setSites(sanitizeTextDeep(sitesWithOwner));
    setLeads(sanitizeTextDeep((leadsRes.data || []) as LeadRow[]));
    setOrders(sanitizeTextDeep(parsedOrders));
    setCreditTransactions(sanitizeTextDeep(parsedTransactions));
  }, []);

  const loadProductLabStateForScope = useCallback(async (scope: ProductLabScope) => {
    setProductLabLoading(true);
    setProductLabPersistence("loading");
    setProductLabPersistenceError(null);
    const [queue, decisionsResult] = await loadProductLabStateSafely(scope, {
      queueTimeout:
        "Chargement des propositions trop long. Secours local actif; clique Recharger pour retenter Supabase et le JSON public.",
      queueError: "Chargement des propositions Product Lab impossible. Secours local actif.",
      decisionsTimeout:
        "Chargement des decisions admin trop long. Les propositions restent visibles; les validations sont gardees localement.",
      decisionsError:
        "Chargement des decisions admin impossible. Les propositions restent visibles; les validations sont gardees localement.",
    });

    if (activeProductLabScopeRef.current !== scope) return;

    const cleanQueue = sanitizeTextDeep(queue);
    const cleanDecisions = sanitizeTextDeep(decisionsResult.decisions);
    const nextPersistence = decisionsResult.persisted ? "supabase" : "localStorage";
    const nextError = decisionsResult.error ?? null;
    const remoteRunStatus = await resolveWithTimeout(readProductLabLastRunStatusFromSupabase(scope), 1800);
    const cleanRunStatus = sanitizeTextDeep(remoteRunStatus ?? buildProductLabRunStatusFromQueue(cleanQueue));

    setProductLabQueue(cleanQueue);
    setProductLabDecisions(cleanDecisions);
    setProductLabRunStatus(cleanRunStatus);
    setProductLabPersistence(nextPersistence);
    setProductLabPersistenceError(nextError);
    setProductLabLoading(false);
    setProductLabScopeDashboard((previous) => ({
      ...previous,
      [scope]: buildProductLabScopeDashboardState(cleanQueue, cleanDecisions, nextPersistence, nextError),
    }));
  }, []);

  const loadProductLabQueue = useCallback(
    async () => loadProductLabStateForScope(productLabScope),
    [loadProductLabStateForScope, productLabScope],
  );

  const loadProductLabScopeDashboard = useCallback(async () => {
    const entries = await Promise.all(
      productLabScopes.map(async (scope) => {
        const [queue, decisionsResult] = await loadProductLabStateSafely(scope, {
          queueTimeout:
            "Dashboard Product Lab trop long a synchroniser. Secours local affiche.",
          queueError: "Dashboard Product Lab impossible a charger.",
          decisionsTimeout:
            "Decisions admin trop longues a charger. Les stats affichent la file et les choix locaux disponibles.",
          decisionsError:
            "Decisions admin impossibles a charger. Les stats affichent la file et les choix locaux disponibles.",
        });

        return [
          scope,
          buildProductLabScopeDashboardState(
            sanitizeTextDeep(queue),
            sanitizeTextDeep(decisionsResult.decisions),
            decisionsResult.persisted ? "supabase" : "localStorage",
            decisionsResult.error ?? null,
          ),
        ] as const;
      }),
    );

    setProductLabScopeDashboard(Object.fromEntries(entries) as Record<ProductLabScope, ProductLabScopeDashboardState>);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (isLocalAuthBypassEnabled()) {
        setAdminReady(true);
        await Promise.all([
          loadAdminData(),
          loadProductLabStateForScope(productLabScope),
          loadProductLabScopeDashboard(),
        ]);
        setLoading(false);
        return;
      }

      const sessionResult = await resolveWithTimeout(supabase.auth.getSession(), 2000);
      const sessionUser = sessionResult?.data?.session?.user ?? null;

      const userResult = sessionUser
        ? { data: { user: sessionUser } }
        : await resolveWithTimeout(supabase.auth.getUser(), 2000);

      const user = sessionUser ?? userResult?.data?.user ?? null;

      if (!user) {
        navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
        return;
      }

      const fetchAdminRole = () =>
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

      const fastRole = await resolveWithTimeout(fetchAdminRole(), 2500);
      if (fastRole?.data) {
        writeCachedAdminFlag(user.id, true);
        setAdminReady(true);
        await Promise.all([
          loadAdminData(),
          loadProductLabStateForScope(productLabScope),
          loadProductLabScopeDashboard(),
        ]);
        setLoading(false);
        return;
      }

      const [roleResult, bootstrapResult] = await Promise.allSettled([
        resolveWithTimeout(fetchAdminRole(), 2500),
        resolveWithTimeout(tryBootstrapAdmin(), 2500),
      ]);

      const hasAdminRole =
        (roleResult.status === "fulfilled" && Boolean(roleResult.value?.data)) ||
        (bootstrapResult.status === "fulfilled" && Boolean(bootstrapResult.value));

      if (!hasAdminRole) {
        writeCachedAdminFlag(user.id, false);
        setAdminReady(false);
        toast({
          title: "Accès réservé",
          description: "Ton rôle admin n'est pas confirmé côté Supabase. Connecte-toi avec un compte admin.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        setLoading(false);
        return;
      }

      writeCachedAdminFlag(user.id, true);
      setAdminReady(true);
      await Promise.all([
        loadAdminData(),
        loadProductLabStateForScope(productLabScope),
        loadProductLabScopeDashboard(),
      ]);
      setLoading(false);
    };

    void init();
  }, [loadAdminData, loadProductLabScopeDashboard, loadProductLabStateForScope, navigate, productLabScope]);

  useEffect(() => {
    if (!adminReady) return;

    activeProductLabScopeRef.current = productLabScope;
    setProductLabQueue(null);
    setProductLabRunStatus(null);
    setProductLabDecisions(readProductLabDecisions(productLabScope));
    setProductLabPersistence("loading");
    setProductLabPersistenceError(null);
    void loadProductLabStateForScope(productLabScope);
    void loadProductLabScopeDashboard();
  }, [adminReady, loadProductLabStateForScope, loadProductLabScopeDashboard, productLabScope]);

  useEffect(() => {
    setProductLabNotes({});
    setProductLabCorrectionRequests({});
    setProductLabDecisionSaving(null);
  }, [productLabScope]);

  const refreshAdminData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAdminData(),
        loadProductLabQueue(),
        loadProductLabScopeDashboard(),
      ]);
    } finally {
      setRefreshing(false);
    }
    toast({
      title: "Admin actualisé",
      description: "Les données les plus récentes sont maintenant affichées.",
    });
  };

  const ensureAdminRoleForAction = async () => {
    if (isLocalAuthBypassEnabled()) {
      toast({
        title: "Action cloud bloquée en local",
        description: "L'admin local est ouvert pour travailler, mais les ajustements réels nécessitent une session admin Supabase.",
        variant: "destructive",
      });
      return false;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      toast({
        title: "Session admin expirée",
        description: "Reconnectez-vous pour modifier les crédits.",
        variant: "destructive",
      });
      return false;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleError && roleData) {
      writeCachedAdminFlag(user.id, true);
      return true;
    }

    const bootstrapped = await tryBootstrapAdmin();
    if (bootstrapped) {
      writeCachedAdminFlag(user.id, true);
      return true;
    }

    writeCachedAdminFlag(user.id, false);
    toast({
      title: "Action admin bloquée",
      description:
        "Votre rôle administrateur n'est pas confirmé côté base. Rechargez la page ou vérifiez l'email admin autorisé.",
      variant: "destructive",
    });
    return false;
  };

  const adjustCredits = async (userId: string, delta: number) => {
    const amount = parseInt(creditInput[userId] || "1", 10);
    if (Number.isNaN(amount) || amount <= 0) return;

    const user = users.find((entry) => entry.user_id === userId);
    if (!user) return;

    if (!(await ensureAdminRoleForAction())) return;

    const deltaValue = delta * amount;
    const reason = deltaValue > 0 ? "Ajout manuel depuis l'admin" : "Retrait manuel depuis l'admin";
    const rpcResult = await supabase.rpc("admin_adjust_credits", {
      p_user_id: userId,
      p_delta: deltaValue,
      p_reason: reason,
    });

    if (rpcResult.error) {
      toast({
        title: "Ajustement impossible",
        description: getReadableAdminError(
          rpcResult.error,
          "La RPC admin_adjust_credits a échoué. Aucun crédit n'a été modifié.",
        ),
        variant: "destructive",
      });
      return;
    }

    const result = (rpcResult.data || {}) as { credits?: number };
    const newCredits = Number(result.credits ?? Math.max(0, user.credits + deltaValue));

    setUsers((previous) =>
      previous.map((entry) => (entry.user_id === userId ? { ...entry, credits: newCredits } : entry)),
    );
    setCreditTransactions((previous) => [
      {
        id: `local-${Date.now()}`,
        user_id: userId,
        delta: deltaValue,
        source_type: deltaValue > 0 ? "admin_manual_add" : "admin_manual_remove",
        source_id: null,
        balance_after: newCredits,
        metadata: { reason },
        created_at: new Date().toISOString(),
        display_name: user.display_name,
      },
      ...previous,
    ]);
    setCreditInput((previous) => ({ ...previous, [userId]: "" }));
    await loadAdminData();
    toast({ title: "Crédits mis à jour", description: `Nouveau solde : ${newCredits} crédits.` });
  };

  const getMonthlyGrantSourceType = (presetKey: string) => `admin_monthly_${presetKey}`;

  const hasMonthlyGrantThisMonth = useCallback(
    (userId: string, presetKey: string) => {
      const monthKey = new Date().toISOString().slice(0, 7);
      const sourceType = getMonthlyGrantSourceType(presetKey);

      return creditTransactions.some((entry) => {
        if (entry.user_id !== userId || entry.delta <= 0) {
          return false;
        }

        const metadataPlan =
          typeof entry.metadata?.plan === "string"
            ? entry.metadata.plan
            : typeof entry.metadata?.plan_key === "string"
              ? entry.metadata.plan_key
              : null;
        const isSamePlan = metadataPlan === presetKey || entry.source_type === sourceType;
        const isMonthlyCreditSource =
          entry.source_type === sourceType ||
          entry.source_type === "stripe_invoice" ||
          entry.source_type === "stripe_checkout_session";
        const metadataMonth =
          typeof entry.metadata?.month === "string" ? entry.metadata.month : null;
        const createdMonth = entry.created_at.slice(0, 7);

        return isSamePlan && isMonthlyCreditSource && (metadataMonth === monthKey || createdMonth === monthKey);
      });
    },
    [creditTransactions],
  );

  const grantMonthlyCredits = async (userId: string, preset: MonthlyCreditPreset) => {
    const user = users.find((entry) => entry.user_id === userId);
    if (!user) return;

    if (!(await ensureAdminRoleForAction())) return;

    if (hasMonthlyGrantThisMonth(userId, preset.key)) {
      toast({
        title: "Crédits déjà ajoutés",
        description: `${preset.credits} crédits ${preset.label} ont déjà été attribués ce mois-ci.`,
      });
      return;
    }

    const monthKey = new Date().toISOString().slice(0, 7);
    const requestKey = `${userId}:${preset.key}:${monthKey}`;
    setMonthlyGrantLoading(requestKey);

    const reason = `Ajout mensuel admin ${preset.label}`;
    const sourceType = getMonthlyGrantSourceType(preset.key);
    const sourceId = `${userId}:${preset.key}:${monthKey}`;

    let newCredits = user.credits;

    try {
      const rpcResult = await supabase.rpc("admin_apply_credit_transaction", {
        p_user_id: userId,
        p_delta: preset.credits,
        p_source_type: sourceType,
        p_source_id: sourceId,
        p_metadata: {
          reason,
          month: monthKey,
          plan: preset.key,
          manual_refill: true,
        },
      });

      if (rpcResult.error) {
        throw rpcResult.error;
      }

      newCredits = Number(
        ((rpcResult.data || {}) as { credits?: number }).credits ?? user.credits + preset.credits,
      );

      setUsers((previous) =>
        previous.map((entry) => (entry.user_id === userId ? { ...entry, credits: newCredits } : entry)),
      );
      setCreditTransactions((previous) => [
        {
          id: `local-monthly-${Date.now()}`,
          user_id: userId,
          delta: preset.credits,
          source_type: sourceType,
          source_id: sourceId,
          balance_after: newCredits,
          metadata: {
            reason,
            month: monthKey,
            plan: preset.key,
            manual_refill: true,
          },
          created_at: new Date().toISOString(),
          display_name: user.display_name,
        },
        ...previous,
      ]);

      await loadAdminData();
      toast({
        title: "Crédits mensuels ajoutés",
        description: `${preset.credits} crédits ${preset.label} ajoutés pour ${monthKey}.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Ajout mensuel impossible",
        description: getReadableAdminError(error, "Impossible d'ajouter les crédits mensuels."),
        variant: "destructive",
      });
    } finally {
      setMonthlyGrantLoading(null);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("delegation_leads").update({ status }).eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    setLeads((previous) => previous.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    toast({ title: "Statut mis à jour" });
  };

  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sitesLast7d = sites.filter((site) => new Date(site.created_at).getTime() > sevenDaysAgo).length;
    const totalRevenue30d = orders
      .filter(
        (order) =>
          new Date(order.processed_at).getTime() > thirtyDaysAgo &&
          (!order.currency || order.currency === "EUR"),
      )
      .reduce((sum, order) => sum + (order.amount || 0), 0);

    return {
      totalUsers: users.length,
      sitesLast7d,
      publishedSites: sites.filter((site) => site.status === "published").length,
      totalRevenue30d,
      newLeads: leads.filter((lead) => lead.status === "new").length,
      totalCreditsAvailable: users.reduce((sum, user) => sum + user.credits, 0),
      manualCreditAdjustments: creditTransactions.filter((entry) => entry.source_type.startsWith("admin_")).length,
      creditsGrantedByStripe: creditTransactions
        .filter((entry) => entry.source_type.startsWith("stripe_") && entry.delta > 0)
        .reduce((sum, entry) => sum + entry.delta, 0),
    };
  }, [creditTransactions, leads, orders, sites, users]);

  const adminSignals = useMemo(() => {
    const paymentIssues = orders.filter((order) => order.status !== "ok").length;
    const sitesToPublish = sites.filter((site) => site.status !== "published").length;
    const pendingDomains = sites.filter((site) => site.domain_status === "pending").length;
    const hotLeads = leads.filter((lead) => ["new", "contacted", "in_progress"].includes(lead.status)).length;
    const recentStripeCredits = creditTransactions
      .filter((entry) => entry.source_type.startsWith("stripe_") && entry.delta > 0)
      .slice(0, 20)
      .reduce((sum, entry) => sum + entry.delta, 0);

    return { paymentIssues, sitesToPublish, pendingDomains, hotLeads, recentStripeCredits };
  }, [creditTransactions, leads, orders, sites]);

  const billingAutomationStats = useMemo(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const stripeInitialGrantCredits = creditTransactions
      .filter((entry) => entry.source_type === "stripe_checkout_session" && entry.delta > 0)
      .reduce((sum, entry) => sum + entry.delta, 0);
    const stripeMonthlyRefillCredits = creditTransactions
      .filter((entry) => entry.source_type === "stripe_invoice" && entry.delta > 0)
      .reduce((sum, entry) => sum + entry.delta, 0);
    const currentMonthManualRefills = creditTransactions.filter(
      (entry) =>
        entry.source_type.startsWith("admin_monthly_") &&
        entry.source_id?.includes(`:${currentMonthKey}`),
    ).length;

    return {
      currentMonthKey,
      stripeInitialGrantCredits,
      stripeMonthlyRefillCredits,
      currentMonthManualRefills,
    };
  }, [creditTransactions]);

  const filteredUsers = users.filter((entry) =>
    `${entry.display_name || ""} ${entry.user_id}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredSites = sites.filter((entry) =>
    `${entry.business_name} ${entry.owner_name || ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredLeads = leads.filter((entry) =>
    `${entry.name} ${entry.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredOrders = orders.filter((entry) =>
    `${entry.customer_email || ""} ${entry.description || ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredTransactions = creditTransactions.filter((entry) =>
    `${entry.display_name || ""} ${entry.source_type || ""} ${entry.user_id}`.toLowerCase().includes(search.toLowerCase()),
  );
  const productLabReviewItems = useMemo(
    () => mergeProductLabReviewItems(productLabQueue ?? { ...productLabScopeConfig.fallbackQueue, items: [] }, productLabDecisions),
    [productLabDecisions, productLabQueue, productLabScopeConfig.fallbackQueue],
  );
  const productLabVisibleReviewItems = useMemo(() => {
    const statusRank: Record<ProductLabDecisionStatus, number> = {
      pending: 0,
      needs_review: 1,
      approved: 2,
      rejected: 3,
    };

    return [...productLabReviewItems].sort(
      (left, right) =>
        statusRank[left.localDecision.status] - statusRank[right.localDecision.status] ||
        String(right.id).localeCompare(String(left.id)),
    );
  }, [productLabReviewItems]);
  const productLabReviewStats = useMemo(() => getProductLabReviewStats(productLabReviewItems), [productLabReviewItems]);
  const productLabDomainStats = useMemo(
    () =>
      productLabReviewItems.reduce(
        (stats, item) => {
          stats[item.domain] += 1;
          return stats;
        },
        {
          marketing: 0,
          systeme: 0,
          seo: 0,
          generateur: 0,
          ia: 0,
        } satisfies Record<ProductLabProposalDomain, number>,
      ),
    [productLabReviewItems],
  );
  const productLabQueueSource = productLabQueue?.loadSource ?? "fallback";
  const productLabQueueSourceInfo = productLabQueueSourceMeta[productLabQueueSource];
  const productLabGeneratedAt = formatProductLabGeneratedAt(productLabQueue);
  const productLabFreshness = getProductLabFreshness(productLabQueue);
  const productLabAiReview = productLabQueue?.summary.aiReview;
  const productLabAiReviewLabel = (() => {
    switch (productLabAiReview?.status) {
      case "generated":
        return `${productLabAiReview.generated ?? 0} proposition(s) IA`;
      case "credits_required":
        return "Credits AI Gateway a verifier";
      case "auth_required":
        return "Acces AI Gateway a verifier";
      case "rate_limited":
        return "Limite AI Gateway atteinte";
      case "model_unavailable":
        return "Modele AI Gateway a verifier";
      case "failed":
        return "Analyse IA echouee";
      case "skipped_missing_gateway":
        return "IA non configuree";
      case "disabled":
        return "IA desactivee";
      default:
        return "Analyse locale";
    }
  })();
  const productLabAiReviewTone =
    productLabAiReview?.status === "generated"
      ? "border-green-400/25 bg-green-400/[0.08] text-green-100"
      : productLabAiReview?.status === "credits_required" ||
          productLabAiReview?.status === "auth_required" ||
          productLabAiReview?.status === "rate_limited" ||
          productLabAiReview?.status === "model_unavailable" ||
          productLabAiReview?.status === "failed" ||
          productLabAiReview?.status === "skipped_missing_gateway"
        ? "border-amber-400/25 bg-amber-400/[0.08] text-amber-100"
        : "border-white/10 bg-white/[0.04] text-muted-foreground";
  const productLabAiReviewDetail =
    productLabAiReview?.error ||
    (productLabAiReview?.status === "generated"
      ? "Analyse IA Gateway enrichie disponible pour ce run."
      : "Le Product Lab garde les propositions locales securisees si l'IA enrichie n'est pas disponible.");
  const productLabAiReviewAction =
    productLabAiReview?.action ||
    (productLabAiReview?.status === "generated"
      ? "Surveille la qualite des propositions puis valide uniquement les patchs utiles."
      : "Verifier credits, acces et modele AI Gateway si tu veux enrichir les prochains runs.");
  const productLabDisplayedCount = productLabReviewItems.length;
  const productLabExpectedCount = productLabQueue?.summary.total ?? productLabDisplayedCount;
  const unsyncedProductLabDecisions = useMemo(
    () => getUnsyncedProductLabDecisions(productLabDecisions, productLabQueue),
    [productLabDecisions, productLabQueue],
  );
  const unsyncedProductLabDecisionCount = unsyncedProductLabDecisions.length;
  const productLabGlobalStats = useMemo(() => {
    const states = productLabScopeOptions.map((option) => productLabScopeDashboard[option.id]);
    const pending = states.reduce((sum, state) => sum + state.stats.pending, 0);
    const approved = states.reduce((sum, state) => sum + state.stats.approved, 0);
    const total = states.reduce((sum, state) => sum + state.stats.total, 0);
    const liveScopes = states.filter((state) => state.persistence === "supabase" && state.source === "supabase").length;
    const warnings = states.filter((state) => state.error || state.persistence !== "supabase" || state.source !== "supabase").length;

    return {
      pending,
      approved,
      total,
      liveScopes,
      warnings,
      allLive: liveScopes === productLabScopeOptions.length,
    };
  }, [productLabScopeDashboard]);
  const adminLocalBypassActive = isLocalAuthBypassEnabled();
  const productLabSelectedIsFullyLive = productLabPersistence === "supabase" && productLabQueueSource === "supabase";
  const productLabSelectedStatusLabel = productLabSelectedIsFullyLive
    ? "Source live Supabase"
    : productLabPersistence === "supabase"
      ? "Supabase OK, file visuelle en secours"
      : productLabPersistence === "loading"
        ? "Verification Supabase"
        : "Secours local a resynchroniser";
  const productLabScheduleStatus = useMemo(() => getProductLabScheduleStatus(), []);
  const selectedProductLabWorkflowUrl =
    productLabScopeOptions.find((option) => option.id === productLabScope)?.workflowUrl || productLabScopeOptions[0].workflowUrl;
  const productLabRunStatusLabel =
    productLabRunStatus?.sourceLabel === "supabase"
      ? "Dernier run live"
      : productLabRunStatus?.sourceLabel === "queue"
        ? "Dernier run fichier secours"
        : "Run live non prouve";

  const updateProductLabDecision = async (
    item: ProductLabReviewItemWithDecision,
    status: ProductLabDecisionStatus,
    fallbackNote: string,
    options: {
      rejectionMode?: ProductLabRejectionMode;
      automationAction?: ProductLabAutomationAction;
    } = {},
  ) => {
    const itemId = item.id;
    const note = productLabNotes[itemId]?.trim() || fallbackNote;
    const correctionRequest = productLabCorrectionRequests[itemId]?.trim() || "";
    const sourceRunKey = getProductLabItemRunKey(item, productLabQueue);
    const sourceRun = item.sourceRun ?? productLabQueue?.sourceRun;
    const nextDecisions = writeProductLabDecision(
      productLabDecisions,
      itemId,
      status,
      note,
      {
        correctionRequest,
        rejectionMode: options.rejectionMode,
        automationAction: options.automationAction,
        sourceRunKey,
        sourceRun,
      },
      productLabScope,
    );
    setProductLabDecisions(nextDecisions);
    setProductLabNotes((previous) => ({ ...previous, [itemId]: note }));
    setProductLabCorrectionRequests((previous) => ({ ...previous, [itemId]: correctionRequest }));
    setProductLabDecisionSaving(itemId);

    try {
      if (isLocalAuthBypassEnabled()) {
        const localRunnerResult = productLabQueue
          ? await syncProductLabDecisionsToLocalRunner(nextDecisions, productLabQueue, productLabScope)
          : {
              synced: false,
              count: 0,
              error: "File Product Lab absente ou en cours de chargement.",
            };
        const localMessage = localRunnerResult.synced
          ? `Decision locale envoyee au runner Product Lab (${localRunnerResult.count} decision(s)).`
          : `Decision gardee dans ce navigateur. ${localRunnerResult.error ?? "Le runner local n'a pas encore recu la decision."}`;

        setProductLabPersistence("localStorage");
        setProductLabPersistenceError(localMessage);
        setProductLabScopeDashboard((previous) => ({
          ...previous,
          [productLabScope]: buildProductLabScopeDashboardState(
            productLabQueue,
            nextDecisions,
            "localStorage",
            localMessage,
          ),
        }));
        toast({
          title: localRunnerResult.synced
            ? "Decision envoyee au Product Lab local"
            : "Decision Product Lab gardee en local",
          description: localRunnerResult.synced
            ? "Le runner local peut maintenant appliquer cette validation sans passer par Supabase. Cloud, PR et auto-merge restent verrouilles."
            : localRunnerResult.error ||
              "La validation reste locale. Relance le serveur Vite si le pont Product Lab local n'est pas disponible.",
          variant: localRunnerResult.synced ? undefined : "destructive",
        });
        return;
      }

      const canSyncSupabase = await ensureAdminRoleForAction();
      if (!canSyncSupabase) {
        setProductLabPersistence("localStorage");
        setProductLabPersistenceError(
          "Decision gardee localement: ton role admin Supabase doit etre confirme avant synchronisation.",
        );
        setProductLabScopeDashboard((previous) => ({
          ...previous,
          [productLabScope]: buildProductLabScopeDashboardState(
            productLabQueue,
            nextDecisions,
            "localStorage",
            "Decision gardee localement: role admin Supabase non confirme.",
          ),
        }));
        return;
      }

      const decision = nextDecisions[itemId];
      const persistenceResult = productLabQueue
        ? await persistProductLabDecisionToSupabase(decision, item, productLabQueue, productLabScope)
        : { persisted: false, error: "File Product Lab absente ou en cours de chargement." };

      if (persistenceResult.persisted) {
        setProductLabPersistence("supabase");
        setProductLabPersistenceError(null);
        setProductLabDecisions((previous) => ({
          ...previous,
          [itemId]: {
            ...previous[itemId],
            sourceRunKey,
            sourceRun,
            persisted: "supabase",
          },
        }));
        toast({
          title: "Decision Product Lab sauvegardee",
          description:
            status === "approved"
              ? "Validation enregistree dans Supabase. Le prochain run peut l'utiliser comme autorisation."
              : "Decision enregistree dans Supabase pour guider le prochain run Product Lab.",
        });
      } else {
        setProductLabPersistence("localStorage");
        setProductLabPersistenceError(persistenceResult.error ?? null);
        toast({
          title: "Decision gardee en local",
          description:
            persistenceResult.error ||
            "Supabase n'est pas encore disponible pour cette table. GitHub Actions ne verra pas ce choix tant qu'il n'est pas synchronise.",
        });
      }

      setProductLabScopeDashboard((previous) => ({
        ...previous,
        [productLabScope]: buildProductLabScopeDashboardState(
          productLabQueue,
          {
            ...nextDecisions,
            [itemId]: {
              ...nextDecisions[itemId],
              sourceRunKey,
              sourceRun,
              persisted: persistenceResult.persisted ? "supabase" : "localStorage",
            },
          },
          persistenceResult.persisted ? "supabase" : "localStorage",
          persistenceResult.error ?? null,
        ),
      }));
    } catch (error) {
      const message = getReadableAdminError(error, "Sauvegarde Product Lab impossible.");
      setProductLabPersistence("localStorage");
      setProductLabPersistenceError(message);
      toast({
        title: "Decision gardee en local",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProductLabDecisionSaving(null);
    }
  };

  const syncLocalProductLabDecisions = async () => {
    if (!productLabQueue) {
      toast({
        title: "File Product Lab absente",
        description: "Recharge la file avant de synchroniser les validations locales.",
        variant: "destructive",
      });
      return;
    }

    if (!unsyncedProductLabDecisionCount) {
      toast({
        title: "Aucune decision locale",
        description: "Toutes les validations visibles sont deja synchronisees ou aucune decision n'a ete prise.",
      });
      return;
    }

    if (!(await ensureAdminRoleForAction())) return;

    setProductLabDecisionSaving("__sync__");
    try {
      const result = await syncProductLabDecisionsToSupabase(productLabDecisions, productLabQueue, productLabScope);
      const syncedById = new Map(result.synced.map((decision) => [decision.itemId, decision]));
      const nextDecisions = Object.fromEntries(
        Object.entries(productLabDecisions).map(([itemId, decision]) => [
          itemId,
          syncedById.has(itemId)
            ? syncedById.get(itemId) ?? decision
            : decision,
        ]),
      );

      setProductLabDecisions(nextDecisions);
      setProductLabPersistence(result.failed.length ? "localStorage" : "supabase");
      setProductLabPersistenceError(result.failed[0]?.error ?? null);
      setProductLabScopeDashboard((previous) => ({
        ...previous,
        [productLabScope]: buildProductLabScopeDashboardState(
          productLabQueue,
          nextDecisions,
          result.failed.length ? "localStorage" : "supabase",
          result.failed[0]?.error ?? null,
        ),
      }));

      if (result.failed.length) {
        toast({
          title: "Synchronisation incomplete",
          description: `${result.synced.length} decision(s) synchronisee(s), ${result.failed.length} encore en local. Detail: ${result.failed[0].error}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Validations synchronisees",
        description: `${result.synced.length} decision(s) envoyee(s) dans Supabase. GitHub Actions pourra les lire au prochain run.`,
      });
    } catch (error) {
      const message = getReadableAdminError(error, "Synchronisation Product Lab impossible.");
      setProductLabPersistence("localStorage");
      setProductLabPersistenceError(message);
      toast({
        title: "Synchronisation impossible",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProductLabDecisionSaving(null);
    }
  };

  const copyProductLabDecisions = async () => {
    const payload = exportProductLabDecisions(productLabDecisions);

    try {
      await navigator.clipboard.writeText(payload);
      toast({
        title: "Decisions copiees",
        description: `Le JSON reprend les validations ${productLabScopeConfig.label}, corrections demandees et actions automation.`,
      });
    } catch {
      toast({
        title: "Copie impossible",
        description: "Votre navigateur bloque l'acces au presse-papiers.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background app-grid-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: Shield },
    { key: "users", label: "Utilisateurs", icon: Users },
    { key: "credits", label: "Crédits", icon: Zap },
    { key: "sites", label: "Sites", icon: Globe },
    { key: "payments", label: "Paiements", icon: CreditCard },
    { key: "leads", label: "Leads", icon: MessageSquare },
    { key: "ai-spaces", label: "AI Spaces", icon: Brain },
    { key: "product-lab", label: "Product Lab", icon: ClipboardCheck },
  ];

  const tableWrap =
    "overflow-x-auto rounded-[28px] border border-white/10 bg-card/85 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl";
  const tableCell = "px-5 py-3 text-xs";

  return (
    <div className="min-h-screen bg-background app-grid-bg">
      <SEOHead
        title="Administration | Pixelrises"
        description="Espace d'administration interne réservé à l'équipe Pixelrises."
        path="/admin"
        noIndex
      />
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-5">
        <div className="premium-shell mb-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Administration Pixelrises</h1>
                <p className="text-sm text-muted-foreground">
                  Vision claire sur les comptes, les paiements, les sites et les leads a traiter.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate("/payment-verification")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Verifier les paiements
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate("/dashboard")}
              >
                <Globe className="mr-2 h-4 w-4" />
                Mon espace
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => void refreshAdminData()}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                Actualiser
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Utilisateurs", value: stats.totalUsers, icon: Users, accent: "text-primary" },
              { label: "Sites créés (7j)", value: stats.sitesLast7d, icon: Wand2, accent: "text-green-400" },
              { label: "Sites publiés", value: stats.publishedSites, icon: Globe, accent: "text-blue-400" },
              { label: "CA 30j", value: `${stats.totalRevenue30d.toFixed(0)} EUR`, icon: CreditCard, accent: "text-amber-400" },
              { label: "Nouveaux leads", value: stats.newLeads, icon: TrendingUp, accent: "text-purple-400" },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="dashboard-stat-card">
                <Icon className={`mb-3 h-5 w-5 ${accent}`} />
                <p className="text-2xl font-bold">{value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-shell-muted mb-6 grid gap-1 p-1.5 sm:grid-cols-2 xl:grid-cols-8">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="dashboard-tab-card flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium"
              data-active={tab === key}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab !== "overview" && tab !== "product-lab" && tab !== "ai-spaces" && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              className="h-10 border-white/10 bg-background/60 pl-10"
            />
          </div>
        )}

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="signal-list-card">
                <p className="font-semibold">Paiements à surveiller</p>
                <p className="mt-1 text-2xl font-bold">{adminSignals.paymentIssues}</p>
                <p className="mt-1 text-sm text-muted-foreground">Événements Stripe en skip ou erreur.</p>
              </div>
              <div className="signal-list-card">
                <p className="font-semibold">Sites à publier</p>
                <p className="mt-1 text-2xl font-bold">{adminSignals.sitesToPublish}</p>
                <p className="mt-1 text-sm text-muted-foreground">Brouillons ou sites générés encore non mis en ligne.</p>
              </div>
              <div className="signal-list-card">
                <p className="font-semibold">Domaines en attente</p>
                <p className="mt-1 text-2xl font-bold">{adminSignals.pendingDomains}</p>
                <p className="mt-1 text-sm text-muted-foreground">Sites avec domaine personnalisé à valider côté DNS.</p>
              </div>
              <div className="signal-list-card">
                <p className="font-semibold">Crédits Stripe récents</p>
                <p className="mt-1 text-2xl font-bold">+{adminSignals.recentStripeCredits}</p>
                <p className="mt-1 text-sm text-muted-foreground">Derniers crédits ajoutés automatiquement via paiements.</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="premium-shell p-5">
                <h2 className="text-lg font-bold">Vue rapide</h2>
                <div className="mt-4 space-y-3">
                  <div className="signal-list-card">
                    <p className="font-semibold">Produit</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sites.length} sites générés, dont {stats.publishedSites} déjà publiés.
                    </p>
                  </div>
                  <div className="signal-list-card">
                    <p className="font-semibold">Monétisation</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {orders.length} paiements enregistrés, {stats.totalRevenue30d.toFixed(0)} EUR sur 30 jours.
                    </p>
                  </div>
                  <div className="signal-list-card">
                    <p className="font-semibold">Pipeline commercial</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {leads.length} leads, dont {stats.newLeads} à traiter rapidement.
                    </p>
                  </div>
                  <div className="signal-list-card">
                    <p className="font-semibold">Crédits et activité</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {stats.totalCreditsAvailable} crédits disponibles au total, {stats.creditsGrantedByStripe} crédits distribués automatiquement via Stripe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="premium-shell-muted p-5">
                <h2 className="text-lg font-bold">Priorités du moment</h2>
                <div className="mt-4 space-y-3">
                  <div className="signal-list-card">
                    <p className="font-semibold">1. Convertir les brouillons en publications</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sites.filter((site) => site.status === "draft").length} site(s) peuvent encore être mis en ligne.
                    </p>
                  </div>
                  <div className="signal-list-card">
                    <p className="font-semibold">2. Traiter les leads chauds</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {adminSignals.hotLeads} lead(s) sont encore en new, contacted ou in_progress.
                    </p>
                  </div>
                  <div className="signal-list-card">
                    <p className="font-semibold">3. Surveiller la recharge crédits</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {stats.manualCreditAdjustments} ajustement(s) manuel(s) recensé(s). Les paiements et recharges doivent rester automatiques par défaut.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => setTab("payments")}>Ouvrir les paiements</Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setTab("credits")}>Gérer les crédits</Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setTab("sites")}>Ouvrir les sites</Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setTab("leads")}>Voir les leads</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className={tableWrap}>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Utilisateurs ({filteredUsers.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className={tableCell}>Utilisateur</th>
                  <th className={tableCell}>Rôle</th>
                  <th className={tableCell}>Sites</th>
                  <th className={tableCell}>Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-border last:border-0">
                    <td className={`${tableCell} font-medium`}>{user.display_name || "-"}</td>
                    <td className={tableCell}>{user.role}</td>
                    <td className={tableCell}>{user.sites_count}</td>
                    <td className={`${tableCell} text-muted-foreground`}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "credits" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Prix des credits et recharges mensuelles</h2>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
                    Stripe ajoute les credits automatiquement apres paiement confirme, puis a chaque facture mensuelle payee.
                    Ces boutons servent uniquement de secours admin idempotent si une verification manuelle est necessaire.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                  <Link to="/admin/billing">
                    Voir rentabilite
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-100">Automatisation Stripe</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Checkout reussi = credits initiaux. invoice.paid = recharge mensuelle automatique.
                      </p>
                      <p className="mt-2 text-xs font-semibold text-emerald-200">
                        {billingAutomationStats.stripeInitialGrantCredits + billingAutomationStats.stripeMonthlyRefillCredits} credits ajoutes via Stripe
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/[0.07] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Protection anti-doublon</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Les recharges utilisent source_id/idempotence pour ne pas crediter deux fois la meme facture.
                      </p>
                      <p className="mt-2 text-xs font-semibold text-primary">
                        {billingAutomationStats.stripeMonthlyRefillCredits} credits via factures mensuelles
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white/5 p-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Secours admin idempotent</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Les boutons mensuels sont un plan B manuel, verrouille par utilisateur, plan et mois.
                      </p>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        Mois {billingAutomationStats.currentMonthKey} : {billingAutomationStats.currentMonthManualRefills} secours manuel(s)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {MONTHLY_CREDIT_PRESETS.map((preset) => (
                  <div key={preset.key} className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.08] via-background/55 to-background/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{preset.label}</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {preset.credits} credits / mois
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <div className="flex justify-between gap-3">
                        <span>Prix abonnement</span>
                        <strong className="text-foreground">{formatAdminEuro(preset.priceMonthlyEur, 0)}</strong>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Valeur par credit</span>
                        <strong className="text-foreground">{formatAdminEuro(preset.creditValueEur, 4)}</strong>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Budget IA max conseille</span>
                        <strong className="text-foreground">{formatAdminEuro(preset.monthlyAiBudgetEur, 0)}</strong>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Marge cible</span>
                        <strong className="text-foreground">
                          {preset.targetGrossMarginRatio === null
                            ? "-"
                            : `${Math.round(preset.targetGrossMarginRatio * 100)}%`}
                        </strong>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.055] px-3 py-2 text-[11px] leading-5 text-emerald-100">
                      Auto : le webhook Stripe applique ces credits a chaque facture payee. Secours : bouton mensuel admin sans doublon.
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={tableWrap}>
              <div className="flex flex-col gap-2 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold">Gestion des crédits</h2>
                <p className="text-xs text-muted-foreground">
                  Total utilisés : {users.reduce((sum, user) => sum + user.total_used, 0)}
                </p>
              </div>
              <table className="min-w-[760px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className={tableCell}>Utilisateur</th>
                    <th className={tableCell}>Crédits</th>
                    <th className={tableCell}>Utilisés</th>
                    <th className={tableCell}>Ajuster</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="border-b border-border last:border-0">
                      <td className={`${tableCell} font-medium`}>{user.display_name || "-"}</td>
                      <td className={tableCell}>{user.credits}</td>
                      <td className={`${tableCell} text-muted-foreground`}>{user.total_used}</td>
                      <td className={tableCell}>
                        <div className="grid gap-2">
                          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                            <Input
                              value={creditInput[user.user_id] || ""}
                              onChange={(event) =>
                                setCreditInput((previous) => ({
                                  ...previous,
                                  [user.user_id]: event.target.value,
                                }))
                              }
                              placeholder="1"
                              className="h-9 w-full text-xs sm:w-20"
                              type="number"
                              min="1"
                            />
                            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => adjustCredits(user.user_id, 1)}>
                              + Ajouter
                            </Button>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => adjustCredits(user.user_id, -1)}>
                              - Retirer
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {MONTHLY_CREDIT_PRESETS.map((preset) => {
                              const actionKey = `${user.user_id}:${preset.key}:${new Date().toISOString().slice(0, 7)}`;
                              const alreadyGranted = hasMonthlyGrantThisMonth(user.user_id, preset.key);

                              return (
                                <Button
                                  key={preset.key}
                                  size="sm"
                                  variant="secondary"
                                  className="w-full sm:w-auto"
                                  onClick={() => void grantMonthlyCredits(user.user_id, preset)}
                                  disabled={alreadyGranted || monthlyGrantLoading === actionKey}
                                >
                                  {monthlyGrantLoading === actionKey ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  {alreadyGranted
                                    ? `${preset.label} déjà ajouté`
                                    : `${preset.label} mensuel +${preset.credits}`}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={tableWrap}>
              <div className="flex flex-col gap-2 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold">Historique récent des mouvements</h2>
                <p className="text-xs text-muted-foreground">{filteredTransactions.length} mouvement(s)</p>
              </div>
              <table className="min-w-[760px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className={tableCell}>Utilisateur</th>
                    <th className={tableCell}>Source</th>
                    <th className={tableCell}>Delta</th>
                    <th className={tableCell}>Solde après</th>
                    <th className={tableCell}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 50).map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-0">
                      <td className={`${tableCell} font-medium`}>{entry.display_name || "-"}</td>
                      <td className={`${tableCell} text-muted-foreground`}>
                        {entry.source_type}
                        {entry.metadata?.reason ? ` - ${entry.metadata.reason}` : ""}
                      </td>
                      <td className={`${tableCell} font-semibold ${entry.delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </td>
                      <td className={tableCell}>{entry.balance_after ?? "-"}</td>
                      <td className={`${tableCell} text-muted-foreground`}>
                        {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "sites" && (
          <div className={tableWrap}>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Tous les sites ({filteredSites.length})</h2>
            </div>
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className={tableCell}>Site</th>
                  <th className={tableCell}>Propriétaire</th>
                  <th className={tableCell}>Type</th>
                  <th className={tableCell}>Statut</th>
                  <th className={tableCell}>Publication</th>
                  <th className={tableCell}>Date</th>
                  <th className={tableCell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr key={site.id} className="border-b border-border last:border-0">
                    <td className={`${tableCell} font-medium`}>{site.business_name}</td>
                    <td className={`${tableCell} text-muted-foreground`}>{site.owner_name}</td>
                    <td className={`${tableCell} text-muted-foreground`}>{site.business_type || "-"}</td>
                    <td className={tableCell}>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_COLORS[site.status] || "bg-secondary text-muted-foreground"}`}>
                        {site.status}
                      </span>
                    </td>
                    <td className={`${tableCell} text-muted-foreground`}>
                      {resolvePublishedSiteUrl({
                        slug: site.slug,
                        customDomain: site.custom_domain,
                        domainStatus: site.domain_status,
                      }) || "Non publié"}
                    </td>
                    <td className={`${tableCell} text-muted-foreground`}>
                      {new Date(site.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className={tableCell}>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/preview/${site.id}`}>Preview</Link>
                        </Button>
                        {resolvePublishedSiteUrl({
                          slug: site.slug,
                          customDomain: site.custom_domain,
                          domainStatus: site.domain_status,
                        }) && (
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={
                                resolvePublishedSiteUrl({
                                  slug: site.slug,
                                  customDomain: site.custom_domain,
                                  domainStatus: site.domain_status,
                                }) || "#"
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Site live
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "payments" && (
          <div className={tableWrap}>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Paiements Stripe ({filteredOrders.length})</h2>
            </div>
            <table className="min-w-[860px] w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className={tableCell}>Client</th>
                  <th className={tableCell}>Description</th>
                  <th className={tableCell}>Montant</th>
                  <th className={tableCell}>Crédits</th>
                  <th className={tableCell}>Resolution</th>
                  <th className={tableCell}>Statut</th>
                  <th className={tableCell}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className={`${tableCell} font-medium`}>{order.customer_email}</td>
                    <td className={`${tableCell} text-muted-foreground`}>
                      <div>{order.description}</div>
                      {order.event_note && (
                        <div className="mt-1 text-[11px] text-muted-foreground/80">{order.event_note}</div>
                      )}
                    </td>
                    <td className={`${tableCell} font-semibold text-amber-400`}>
                      {(order.amount || 0).toFixed(2)} {order.currency}
                    </td>
                    <td className={tableCell}>{order.credits_added || "-"}</td>
                    <td className={`${tableCell} text-muted-foreground`}>{order.resolved_via || "-"}</td>
                    <td className={tableCell}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          order.status === "ok"
                            ? "bg-green-500/10 text-green-400"
                            : order.status === "skip"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {order.status || "ok"}
                      </span>
                    </td>
                    <td className={`${tableCell} text-muted-foreground`}>
                      {new Date(order.processed_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "ai-spaces" && (
          <div className="space-y-6">
            <div className="premium-shell-muted p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    AI Spaces
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">Pilotage des espaces IA</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                    Les Builders creent les projets, les AI Spaces accompagnent les utilisateurs. Cette vue admin
                    prepare le suivi usage, prompts, erreurs, couts et suggestions Product Lab sans exposer de secret.
                  </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/ai-spaces">
                    Ouvrir les AI Spaces
                    <Brain className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {aiSpacesList.map((space) => (
                  <div key={space.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{space.shortName}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{space.tagline}</p>
                      </div>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-primary">
                        {space.status}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-xs leading-5 text-muted-foreground">
                      <p>Metric : {space.dashboard.primaryMetric}</p>
                      <p>Action : {space.dashboard.nextBestAction}</p>
                      <p>Agents : {space.recommendedAgents.slice(0, 3).join(", ")}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                      <Link to={`/ai-spaces/${space.id}`}>Tester l'espace</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="signal-list-card">
                <p className="font-semibold">Securite IA</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Aucune cle IA cote frontend. Les appels reels passent par Supabase Edge Function et le Gateway.
                </p>
              </div>
              <div className="signal-list-card">
                <p className="font-semibold">Product Lab</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Les prompts, quick actions, usages, erreurs et conversions vers Builders deviennent auditables.
                </p>
              </div>
              <div className="signal-list-card">
                <p className="font-semibold">Evolution controlee</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Activation/desactivation, edition prompts et couts seront branches en Supabase apres validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "product-lab" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(245,197,24,0.20),transparent_34%),linear-gradient(135deg,rgba(14,14,10,0.96),rgba(5,5,5,0.94))] p-5 shadow-[0_28px_90px_-55px_rgba(245,197,24,0.75)] sm:p-6">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 left-10 h-52 w-52 rounded-full bg-green-400/10 blur-3xl" />

              <div className="relative grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="flex min-h-[270px] flex-col justify-between">
                  <div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      <Zap className="h-3.5 w-3.5" />
                      Product Lab
                    </span>
                    <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-foreground sm:text-4xl">
                      Centre d'amelioration continue
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                      Product Lab teste Pixelrises, filtre les vrais signaux et te donne uniquement les decisions utiles:
                      valider, demander une alternative, refuser ou synchroniser. Pas de metriques hors sujet ici.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                      {
                        label: "A trancher",
                        value: productLabReviewStats.pending,
                        detail: "Decisions en attente",
                        tone: "text-amber-200",
                      },
                      {
                        label: "Run",
                        value: productLabRunStatus?.status ?? "non prouve",
                        detail: productLabRunStatus?.mode ?? productLabRunStatusLabel,
                        tone: "text-green-200",
                      },
                      {
                        label: "Propositions",
                        value:
                          productLabRunStatus?.proposalsSaved ??
                          (productLabQueueSource === "supabase" ? productLabDisplayedCount : 0),
                        detail: `${productLabRunStatus?.proposalsGenerated ?? productLabDisplayedCount} generee(s)`,
                        tone: "text-primary",
                      },
                      {
                        label: "Analyse IA",
                        value: productLabAiReview?.status === "generated" ? "active" : "controle",
                        detail: productLabAiReviewLabel,
                        tone: productLabAiReview?.status === "generated" ? "text-green-200" : "text-amber-200",
                      },
                      {
                        label: "V2 live",
                        value: `${productLabGlobalStats.liveScopes}/1`,
                        detail: productLabGlobalStats.allLive ? "Sources synchronisees" : "Point a verifier",
                        tone: productLabGlobalStats.allLive ? "text-green-200" : "text-amber-200",
                      },
                    ].map((entry) => (
                      <div key={entry.label} className="rounded-[24px] border border-white/10 bg-black/30 p-4 backdrop-blur">
                        <p className={`text-3xl font-black ${entry.tone}`}>{entry.value}</p>
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {entry.label}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{entry.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/35 p-4 backdrop-blur sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pilotage</p>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">Etat du cockpit</h3>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${productLabQueueSourceInfo.tone}`}>
                      {productLabQueueSourceInfo.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Synchronisation</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {productLabPersistence === "supabase"
                          ? unsyncedProductLabDecisionCount
                            ? `${unsyncedProductLabDecisionCount} decision(s) locales a envoyer`
                            : "Supabase live actif"
                          : productLabPersistence === "loading"
                            ? "Verification en cours"
                            : adminLocalBypassActive
                              ? "Runner local actif"
                              : "Secours local a synchroniser"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Dernier run</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{productLabRunStatusLabel}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {formatProductLabTimestamp(productLabRunStatus?.startedAt)}
                        {" -> "}
                        {formatProductLabTimestamp(productLabRunStatus?.completedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2">
                    <Button asChild variant="outline" className="justify-center border-primary/25 bg-primary/10">
                      <a href={selectedProductLabWorkflowUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Lancer un test GitHub
                      </a>
                    </Button>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button variant="outline" onClick={() => void loadProductLabQueue()}>
                        <FileText className="h-4 w-4" />
                        Recharger
                      </Button>
                      <Button
                        variant="outline"
                        className="border-green-400/25 bg-green-400/[0.08] text-green-100 hover:bg-green-400/[0.14]"
                        disabled={
                          adminLocalBypassActive ||
                          !unsyncedProductLabDecisionCount ||
                          productLabDecisionSaving === "__sync__"
                        }
                        onClick={() => void syncLocalProductLabDecisions()}
                        title={
                          adminLocalBypassActive
                            ? "Synchronisation cloud reservee a une vraie session admin Supabase."
                            : undefined
                        }
                      >
                        {productLabDecisionSaving === "__sync__" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Synchroniser
                      </Button>
                    </div>
                    {adminLocalBypassActive && unsyncedProductLabDecisionCount > 0 ? (
                      <p className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
                        Mode local: tes decisions sont envoyees au runner Product Lab local. La synchronisation cloud
                        Supabase/GitHub reste reservee a une vraie session admin.
                      </p>
                    ) : null}
                    <Button className="justify-center" onClick={() => void copyProductLabDecisions()}>
                      <ClipboardCheck className="h-4 w-4" />
                      Exporter decisions
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="overflow-hidden rounded-[28px] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(245,197,66,0.16),transparent_36%),rgba(0,0,0,0.24)] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Boucle Product Lab</p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">Audit nocturne, validation humaine, PR controlee.</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                        Chaque nuit, Product Lab teste Pixelrises, transforme les signaux en propositions concretes, puis attend ta decision. Rien n'est applique sans validation admin.
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs ${
                        productLabGlobalStats.warnings
                          ? "border-amber-400/25 bg-amber-400/[0.08] text-amber-100"
                          : "border-green-400/25 bg-green-400/[0.08] text-green-100"
                      }`}
                    >
                      {productLabGlobalStats.warnings ? `${productLabGlobalStats.warnings} point(s) a surveiller` : "Synchronisation saine"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-5">
                    {productLabNightlyCycle.map((entry, index) => (
                      <div key={entry.step} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">
                          {index + 1}
                        </span>
                        <p className="mt-3 text-sm font-semibold text-foreground">{entry.step}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{entry.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <CalendarClock className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Run & schedule</p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
                      <p className="text-sm font-semibold text-foreground">{productLabScheduleStatus.configured}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Cron : {productLabScheduleStatus.crons}. Aujourd'hui : {productLabScheduleStatus.utc}.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
                      <p className="text-sm font-semibold text-foreground">{productLabRunStatusLabel}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Debut : {formatProductLabTimestamp(productLabRunStatus?.startedAt)}. Fin :{" "}
                        {formatProductLabTimestamp(productLabRunStatus?.completedAt)}.
                      </p>
                      {productLabRunStatus?.workflowRunUrl ? (
                        <a
                          href={productLabRunStatus.workflowRunUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                        >
                          Ouvrir le run GitHub
                        </a>
                      ) : null}
                    </div>
                    <div className={`rounded-2xl border p-4 ${productLabAiReviewTone}`}>
                      <p className="text-sm font-semibold">Analyse IA Gateway</p>
                      <p className="mt-2 text-xs leading-5">{productLabAiReviewLabel}</p>
                      <p className="mt-2 text-xs leading-5 opacity-85">{productLabAiReviewDetail}</p>
                      <p className="mt-2 text-xs leading-5 opacity-85">{productLabAiReviewAction}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-primary/20 bg-primary/[0.05] p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Dernieres propositions recues
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">
                      Propositions d'amelioration a traiter
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Source d'analyse : {productLabAiReviewLabel}. Les cartes a trancher remontent toujours en premier.
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-muted-foreground">
                    {productLabDisplayedCount}/{productLabExpectedCount} affichee(s)
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(productLabDomainStats)
                    .filter(([, count]) => count > 0)
                    .map(([domain, count]) => {
                      const meta = productLabDomainMeta[domain as ProductLabProposalDomain];

                      return (
                        <span
                          key={domain}
                          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${meta.tone}`}
                          title={meta.description}
                        >
                          {meta.label} x{count}
                        </span>
                      );
                    })}
                </div>

                {productLabVisibleReviewItems.length > 0 ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {productLabVisibleReviewItems.slice(0, 4).map((item) => {
                      const domainMeta = productLabDomainMeta[item.domain];
                      const statusLabel =
                        item.localDecision.status === "approved"
                          ? "Validee"
                          : item.localDecision.status === "rejected"
                            ? item.localDecision.rejectionMode === "alternative"
                              ? "Alternative demandee"
                              : "Refusee"
                            : item.localDecision.status === "needs_review"
                              ? "A revoir"
                              : "A trancher";
                      const statusClass =
                        item.localDecision.status === "approved"
                          ? "border-green-400/25 bg-green-400/[0.08] text-green-100"
                          : item.localDecision.status === "rejected"
                            ? "border-red-400/25 bg-red-400/[0.08] text-red-100"
                            : item.localDecision.status === "needs_review"
                              ? "border-blue-400/25 bg-blue-400/[0.08] text-blue-100"
                              : "border-amber-400/25 bg-amber-400/[0.08] text-amber-100";

                      return (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-primary">
                              {item.module}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${domainMeta.tone}`}>
                              {domainMeta.label}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {item.simpleSummary || item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] p-4 text-sm leading-6 text-amber-100">
                    Aucune proposition lisible cote admin pour ce compte. Si GitHub indique des propositions sauvegardees,
                    verifie que le compte connecte a le role admin dans Supabase et clique Recharger.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[28px] border border-green-400/20 bg-green-400/[0.05] p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-200">Garde-fous</p>
                    <h3 className="mt-2 text-lg font-semibold">Ce que Product Lab n'a pas le droit de faire seul</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {productLabScopeOptions.map((option) => (
                      <a
                        key={option.id}
                        href={option.workflowUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-foreground transition hover:border-primary/40 hover:text-primary"
                      >
                        Workflow {option.label}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  {productLabDataProtectionRules.map((rule) => (
                    <div key={rule} className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-green-200" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {productLabScopeOptions.map((option) => {
                  const isActive = option.id === productLabScope;
                  const status = productLabScopeDashboard[option.id];
                  const statusMeta = productLabQueueSourceMeta[status.source];
                  const optionConfig = getProductLabScopeConfig(option.id);
                  const syncLabel =
                    status.persistence === "supabase"
                      ? "Sync live"
                      : status.persistence === "loading"
                        ? "Verification"
                        : "Secours local";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setProductLabScope(option.id)}
                      className={`rounded-[24px] border p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.05] ${
                        isActive
                          ? "border-primary/45 bg-primary/[0.1] shadow-[0_0_0_1px_rgba(245,197,24,0.12)]"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{option.label}</span>
                        {isActive ? (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-primary">
                            Ouvert
                          </span>
                        ) : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusMeta.tone}`}>
                          {statusMeta.label}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>

                      <span className="mt-4 grid gap-2 sm:grid-cols-3">
                        <span className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <span className="block text-lg font-bold text-primary">{status.stats.pending}</span>
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            A trancher
                          </span>
                        </span>
                        <span className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <span className="block text-lg font-bold text-green-300">{status.stats.approved}</span>
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            Validees
                          </span>
                        </span>
                        <span className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <span className="block text-lg font-bold text-foreground">{status.stats.total}</span>
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            Total
                          </span>
                        </span>
                      </span>

                      <span className="mt-4 block space-y-1 text-xs leading-5 text-muted-foreground">
                        <span className="block">
                          {syncLabel} - {status.freshness} - {status.generatedAtLabel}
                        </span>
                        <span className="block">
                          Tables : {optionConfig.reviewTable} / {optionConfig.decisionsTable}
                        </span>
                        {status.error ? (
                          <span className="block rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-3 py-2 text-amber-100">
                            {status.error}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {productLabPersistence !== "supabase" && (
                <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] p-4 text-sm leading-6 text-amber-100">
                  <strong>Mode local:</strong> les validations {productLabScopeConfig.label} peuvent alimenter le runner
                  Product Lab local sur localhost. Elles ne seront pas envoyees a GitHub Actions tant que la
                  synchronisation Supabase n'est pas active.
                  {productLabPersistenceError ? (
                    <span className="mt-1 block text-amber-200/80">Detail: {productLabPersistenceError}</span>
                  ) : null}
                </div>
              )}

              {unsyncedProductLabDecisionCount > 0 && (
                <div className="mt-4 rounded-2xl border border-blue-400/25 bg-blue-400/[0.08] p-4 text-sm leading-6 text-blue-100">
                  <strong>{unsyncedProductLabDecisionCount} validation(s) locale(s).</strong>{" "}
                  {adminLocalBypassActive
                    ? "Elles sont utilisables par le Product Lab local; le cloud reste volontairement verrouille."
                    : "Clique sur Synchroniser pour envoyer ces choix dans Supabase afin que GitHub Actions les lise au prochain run."}
                </div>
              )}

              {productLabQueueSource !== "supabase" && (
                <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] p-4 text-sm leading-6 text-amber-100">
                  <strong>{productLabSelectedStatusLabel}:</strong> cette liste vient de {productLabQueueSourceInfo.label}. Si le
                  workflow vient de tourner, attends quelques secondes puis clique Recharger. Si l'etat reste en secours,
                  GitHub Actions n'a pas encore pousse la file live dans Supabase ou le cache Supabase doit etre recharge.
                </div>
              )}

              <div className="mt-5 rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      File active - {productLabScopeConfig.label}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">
                      {productLabQueue?.summary.dailySummary || "Aucune proposition live chargee pour le moment."}
                    </h3>
                    <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">
                      Source : {productLabQueueSourceInfo.label}. Generation : {productLabGeneratedAt}. Fraicheur :{" "}
                      {productLabFreshness}. Affichage : {productLabDisplayedCount}/{productLabExpectedCount}.
                    </p>
                  </div>

                  <div className="grid min-w-full gap-2 sm:grid-cols-4 xl:min-w-[440px]">
                    {[
                      { label: "Validees", value: productLabReviewStats.approved, tone: "text-green-300" },
                      { label: "A revoir", value: productLabReviewStats.needsReview, tone: "text-blue-300" },
                      { label: "Refusees", value: productLabReviewStats.rejected, tone: "text-red-300" },
                      { label: "Total", value: productLabReviewStats.total, tone: "text-primary" },
                    ].map((entry) => (
                      <div key={entry.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                        <p className={`text-xl font-bold ${entry.tone}`}>{entry.value}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {entry.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {productLabDisplayedCount !== productLabExpectedCount && (
                <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/[0.08] p-4 text-sm leading-6 text-red-100">
                  <strong>Verification requise:</strong> la file annonce {productLabExpectedCount} proposition(s), mais
                  l'admin en affiche {productLabDisplayedCount}. Recharge ou relance le workflow avant de valider.
                </div>
              )}
            </div>

            {productLabLoading ? (
              <div className="premium-shell-muted flex items-center gap-3 p-5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Chargement des decisions Product Lab...
              </div>
            ) : productLabVisibleReviewItems.length > 0 ? (
              <div className="grid gap-4">
                {productLabVisibleReviewItems.map((item) => {
                  const isSyncedApproval =
                    item.localDecision.status === "approved" && item.localDecision.persisted === "supabase";
                  const applicationStatus = item.localDecision.applicationStatus ?? "pending";
                  const prUrl =
                    item.localDecision.prUrl ||
                    (typeof item.localDecision.processedRun?.prUrl === "string"
                      ? item.localDecision.processedRun.prUrl
                      : "");
                  const prNumber =
                    item.localDecision.prNumber ??
                    (typeof item.localDecision.processedRun?.prNumber === "number"
                      ? item.localDecision.processedRun.prNumber
                      : null);
                  const prStatus = item.localDecision.prStatus || (prUrl ? "created" : "not_created");
                  const autoMergeStatus = item.localDecision.autoMergeStatus || "not_requested";
                  const prStatusMeta = productLabPrStatusMeta[prStatus] ?? productLabPrStatusMeta.not_created;
                  const autoMergeMeta = productLabAutoMergeMeta[autoMergeStatus] ?? productLabAutoMergeMeta.not_requested;
                  const domainMeta = productLabDomainMeta[item.domain];
                  const touchedSensitiveFiles = item.localDecision.touchedSensitiveFiles ?? [];
                  const decisionLabel =
                    item.localDecision.status === "approved"
                      ? applicationStatus === "pr_ready"
                        ? "PR preparee par Product Lab"
                        : applicationStatus === "skipped"
                          ? "Traitee sans patch"
                          : applicationStatus === "validation_failed"
                            ? "Validation echouee"
                            : isSyncedApproval
                              ? "Validee pour prochain run"
                              : "Validee localement - a synchroniser"
                      : item.localDecision.status === "rejected"
                        ? item.localDecision.rejectionMode === "alternative"
                          ? "Alternative demandee"
                          : "Ignoree"
                        : item.localDecision.status === "needs_review"
                          ? "A revoir"
                          : "En attente";
                  const decisionClass =
                    item.localDecision.status === "approved"
                      ? "border-green-400/20 bg-green-400/10 text-green-200"
                      : item.localDecision.status === "rejected" && item.localDecision.rejectionMode !== "alternative"
                        ? "border-red-400/20 bg-red-400/10 text-red-200"
                        : item.localDecision.status === "rejected" && item.localDecision.rejectionMode === "alternative"
                          ? "border-blue-400/20 bg-blue-400/10 text-blue-200"
                        : item.localDecision.status === "needs_review"
                          ? "border-blue-400/20 bg-blue-400/10 text-blue-200"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-200";

                  return (
                    <article key={item.id} className="rounded-[28px] border border-white/10 bg-card/85 p-5 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.55)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                              {item.module}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs ${domainMeta.tone}`}
                              title={domainMeta.description}
                            >
                              {domainMeta.label}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs ${decisionClass}`}>
                              {decisionLabel}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
                              {item.priority}
                            </span>
                          </div>
                          <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
                            {item.simpleSummary || item.description}
                          </p>
                        </div>
                        <div className="grid min-w-[220px] gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-muted-foreground">
                          <p>Domaine : {domainMeta.label}</p>
                          <p>Impact : {item.impact}</p>
                          <p>Risque : {item.risk}</p>
                          <p>Difficulte : {item.difficulty}</p>
                          <p>Inspiration : {item.inspiration}</p>
                          {item.localDecision.processedAt ? (
                            <p>Run traite : {new Date(item.localDecision.processedAt).toLocaleString("fr-FR")}</p>
                          ) : null}
                          {prUrl ? (
                            <a
                              href={prUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              PR Product Lab{prNumber ? ` #${prNumber}` : ""}
                            </a>
                          ) : null}
                          <span className={`rounded-full border px-3 py-1 ${prStatusMeta.tone}`}>
                            {prStatusMeta.label}
                          </span>
                          <span className={`rounded-full border px-3 py-1 ${autoMergeMeta.tone}`}>
                            {autoMergeMeta.label}
                          </span>
                          {item.localDecision.autoMergeBlockReason ? (
                            <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-3 py-2 text-amber-100">
                              Blocage : {item.localDecision.autoMergeBlockReason}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {(prUrl || autoMergeStatus !== "not_requested" || touchedSensitiveFiles.length > 0) && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs ${prStatusMeta.tone}`}>
                              Statut PR : {prStatusMeta.label}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs ${autoMergeMeta.tone}`}>
                              {autoMergeMeta.label}
                            </span>
                            {item.localDecision.riskLevel ? (
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">
                                Risque PR : {item.localDecision.riskLevel}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-xs leading-5">{autoMergeMeta.detail}</p>
                          {touchedSensitiveFiles.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                                Fichiers sensibles detectes
                              </p>
                              {touchedSensitiveFiles.map((entry) => (
                                <p key={`${entry.file}-${entry.reason}`} className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-100">
                                  {entry.file} - {entry.reason}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            Fichiers concernes
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(item.concernedFiles?.length ? item.concernedFiles : ["A preciser par le Product Lab"]).map(
                              (file) => (
                                <span
                                  key={file}
                                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground"
                                >
                                  {file}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Avant</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.beforeState || "Etat actuel a preciser avant implementation."}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-200">Apres</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.afterState || "Resultat attendu apres validation admin."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                            Resultat mesurable
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.successMetric || "Le prochain run Product Lab ou smoke QA doit confirmer la correction sans regression."}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            Validation avant PR
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                            {(item.validationSteps?.length
                              ? item.validationSteps
                              : ["Relancer Product Lab.", "Verifier la carte dans l'admin.", "Lancer le smoke ou test cible."]).map(
                              (step) => (
                                <li key={step} className="flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                  <span>{step}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Garde-fou automation</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.automationPolicy}</p>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <textarea
                            value={productLabNotes[item.id] ?? item.localDecision.note}
                          onChange={(event) =>
                            setProductLabNotes((previous) => ({ ...previous, [item.id]: event.target.value }))
                          }
                          placeholder="Note admin : pourquoi valider, refuser ou demander une reprise ?"
                          className="min-h-[90px] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
                        />
                        <textarea
                            value={productLabCorrectionRequests[item.id] ?? item.localDecision.correctionRequest}
                          onChange={(event) =>
                            setProductLabCorrectionRequests((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Ce que je veux changer : ex. plus premium, plus simple, pas comme ca, autre direction..."
                          className="min-h-[90px] rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
                        />
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <Button
                            className="bg-green-500/90 text-white hover:bg-green-500"
                            disabled={productLabDecisionSaving === item.id}
                            onClick={() =>
                              void updateProductLabDecision(
                                item,
                                "approved",
                                "Valide cote admin. Autorise le prochain run Product Lab a appliquer avec garde-fous.",
                                { automationAction: "authorize_next_run" },
                              )
                            }
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Valider
                          </Button>
                          <Button
                            variant="outline"
                            className="border-blue-400/20 bg-blue-400/[0.06] text-blue-100 hover:bg-blue-400/[0.12]"
                            disabled={productLabDecisionSaving === item.id}
                            onClick={() =>
                              void updateProductLabDecision(item, "needs_review", "A revoir avant implementation.", {
                                automationAction: "hold",
                              })
                            }
                          >
                            <Wand2 className="h-4 w-4" />
                            A revoir
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-400/20 bg-red-400/[0.06] text-red-100 hover:bg-red-400/[0.12]"
                            disabled={productLabDecisionSaving === item.id}
                            onClick={() =>
                              void updateProductLabDecision(item, "rejected", "Refuse cote admin. Ne plus reproposer tel quel.", {
                                rejectionMode: "ignore",
                                automationAction: "ignore",
                              })
                            }
                          >
                            <XCircle className="h-4 w-4" />
                            Ignorer
                          </Button>
                          <Button
                            variant="outline"
                            className="border-primary/20 bg-primary/[0.06] text-primary hover:bg-primary/[0.12]"
                            disabled={productLabDecisionSaving === item.id}
                            onClick={() =>
                              void updateProductLabDecision(
                                item,
                                "rejected",
                                "Refuse en l'etat. Demander une autre proposition adaptee a ma note.",
                                { rejectionMode: "alternative", automationAction: "request_alternative" },
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4" />
                            Alternative
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="premium-shell-muted p-6 text-sm leading-7 text-muted-foreground">
                Aucun changement sensible en attente pour {productLabScopeConfig.label}. Le Product Lab peut continuer
                les patches auto_safe limites a 2 et envoyer ici les decisions importantes.
              </div>
            )}
          </div>
        )}

        {tab === "leads" && (
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-card/85 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Leads de delegation ({filteredLeads.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.email}{lead.phone ? ` - ${lead.phone}` : ""}
                      </p>
                      {lead.recommendation && (
                        <p className="mt-1 text-xs text-primary">Recommandation : {lead.recommendation}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        value={lead.status}
                        onChange={(event) => void updateLeadStatus(lead.id, event.target.value)}
                        className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs"
                      >
                        <option value="new">Nouveau</option>
                        <option value="contacted">Contacte</option>
                        <option value="in_progress">En cours</option>
                        <option value="converted">Converti</option>
                        <option value="closed">Ferme</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;



