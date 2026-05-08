import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
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
import { tryBootstrapAdmin } from "@/lib/admin-bootstrap";
import { sanitizeTextDeep } from "@/lib/text-sanitize";
import { resolvePublishedSiteUrl } from "@/lib/published-site";
import {
  exportProductLabDecisions,
  getProductLabScopeConfig,
  getProductLabReviewStats,
  loadProductLabReviewQueue,
  mergeProductLabReviewItems,
  persistProductLabDecisionToSupabase,
  readProductLabDecisionsFromSupabase,
  readProductLabDecisions,
  writeProductLabDecision,
  type ProductLabAutomationAction,
  type ProductLabDecisionMap,
  type ProductLabDecisionStatus,
  type ProductLabRejectionMode,
  type ProductLabScope,
  type ProductLabReviewQueue,
  type ProductLabReviewItemWithDecision,
} from "@/modules/product-lab/product-lab-review";

type Tab = "overview" | "users" | "credits" | "sites" | "payments" | "leads" | "product-lab";

const productLabScopeOptions: Array<{
  id: ProductLabScope;
  label: string;
  description: string;
}> = [
  {
    id: "v2",
    label: "Pixelrises V2",
    description: "Plateforme SaaS, builders, Multi-IA, Supabase et Vercel AI Gateway.",
  },
  {
    id: "v1",
    label: "Pixelrises V1",
    description: "Generateur V1 separe, suivi depuis le meme admin sans melanger les tables.",
  },
];

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
  key: string;
  label: string;
  credits: number;
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

const MONTHLY_CREDIT_PRESETS: MonthlyCreditPreset[] = [
  { key: "starter", label: "Starter", credits: 10 },
  { key: "pro", label: "Pro", credits: 25 },
  { key: "business", label: "Business", credits: 60 },
];

const ADMIN_CACHE_PREFIX = "pixelrises:isAdmin:";
const ADMIN_REQUEST_TIMEOUT_MS = 4000;

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

const readCachedAdminFlag = (userId: string) => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(getAdminCacheKey(userId)) === "1";
};

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
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .map((part) => part.trim());

    if (parts.length > 0) return parts.join(" ");
  }

  return fallback;
};

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [productLabPersistence, setProductLabPersistence] = useState<"loading" | "supabase" | "localStorage">("loading");
  const [productLabPersistenceError, setProductLabPersistenceError] = useState<string | null>(null);
  const [productLabDecisionSaving, setProductLabDecisionSaving] = useState<string | null>(null);
  const productLabScopeConfig = getProductLabScopeConfig(productLabScope);

  const loadAdminData = useCallback(async () => {
    const [profilesRes, creditsRes, sitesRes, rolesRes, leadsRes, eventsRes, creditTransactionsRes] =
      await Promise.all([
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
      ]);

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

  const loadProductLabQueue = useCallback(async () => {
    setProductLabLoading(true);
    const queue = await loadProductLabReviewQueue(productLabScope);
    setProductLabQueue(sanitizeTextDeep(queue));
    setProductLabLoading(false);
  }, [productLabScope]);

  const loadProductLabDecisionsState = useCallback(async () => {
    setProductLabPersistence("loading");
    const result = await readProductLabDecisionsFromSupabase(productLabScope);
    setProductLabDecisions(sanitizeTextDeep(result.decisions));
    setProductLabPersistence(result.persisted ? "supabase" : "localStorage");
    setProductLabPersistenceError(result.error ?? null);
  }, [productLabScope]);

  useEffect(() => {
    const init = async () => {
      const sessionResult = await resolveWithTimeout(supabase.auth.getSession(), 2000);
      const sessionUser = sessionResult?.data?.session?.user ?? null;

      const {
        data: { user: fetchedUser },
      } = sessionUser ? { data: { user: sessionUser } } : await supabase.auth.getUser();

      const user = sessionUser ?? fetchedUser;

      if (!user) {
        navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
        return;
      }

      const cachedAdmin = readCachedAdminFlag(user.id);
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
        await loadAdminData();
        setLoading(false);
        return;
      }

      const [roleResult, bootstrapResult] = await Promise.allSettled([
        fetchAdminRole(),
        tryBootstrapAdmin(),
      ]);

      const hasAdminRole =
        (roleResult.status === "fulfilled" && Boolean(roleResult.value.data)) ||
        (bootstrapResult.status === "fulfilled" && Boolean(bootstrapResult.value));

      if (!hasAdminRole && !cachedAdmin) {
        toast({
          title: "Accès réservé",
          description: "Cette zone est réservée au compte administrateur.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        setLoading(false);
        return;
      }

      writeCachedAdminFlag(user.id, true);
      await loadAdminData();
      setLoading(false);
    };

    void init();
  }, [loadAdminData, navigate]);

  useEffect(() => {
    void loadProductLabQueue();
    void loadProductLabDecisionsState();
  }, [loadProductLabDecisionsState, loadProductLabQueue]);

  useEffect(() => {
    setProductLabNotes({});
    setProductLabCorrectionRequests({});
    setProductLabDecisionSaving(null);
  }, [productLabScope]);

  const refreshAdminData = async () => {
    setRefreshing(true);
    await Promise.all([loadAdminData(), loadProductLabQueue(), loadProductLabDecisionsState()]);
    setRefreshing(false);
    toast({
      title: "Admin actualisé",
      description: "Les données les plus récentes sont maintenant affichées.",
    });
  };

  const ensureAdminRoleForAction = async () => {
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
        if (entry.user_id !== userId || entry.source_type !== sourceType || entry.delta <= 0) {
          return false;
        }

        const metadataMonth =
          typeof entry.metadata?.month === "string" ? entry.metadata.month : null;
        const createdMonth = entry.created_at.slice(0, 7);

        return metadataMonth === monthKey || createdMonth === monthKey;
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

    const reason = `Ajout mensuel automatique ${preset.label}`;
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
          automated: true,
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
            automated: true,
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
  const productLabReviewStats = useMemo(() => getProductLabReviewStats(productLabReviewItems), [productLabReviewItems]);

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
    const nextDecisions = writeProductLabDecision(
      productLabDecisions,
      itemId,
      status,
      note,
      {
        correctionRequest,
        rejectionMode: options.rejectionMode,
        automationAction: options.automationAction,
      },
      productLabScope,
    );
    setProductLabDecisions(nextDecisions);
    setProductLabNotes((previous) => ({ ...previous, [itemId]: note }));
    setProductLabCorrectionRequests((previous) => ({ ...previous, [itemId]: correctionRequest }));
    setProductLabDecisionSaving(itemId);

    const decision = nextDecisions[itemId];
    const persistenceResult = productLabQueue
      ? await persistProductLabDecisionToSupabase(decision, item, productLabQueue, productLabScope)
      : { persisted: false };

    if (persistenceResult.persisted) {
      setProductLabPersistence("supabase");
      setProductLabPersistenceError(null);
      setProductLabDecisions((previous) => ({
        ...previous,
        [itemId]: {
          ...previous[itemId],
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

    setProductLabDecisionSaving(null);
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

        <div className="premium-shell-muted mb-6 grid gap-1 p-1.5 sm:grid-cols-2 xl:grid-cols-7">
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

        {tab !== "overview" && tab !== "product-lab" && (
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

        {tab === "product-lab" && (
          <div className="space-y-6">
            <div className="premium-shell-muted p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Validation humaine
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">Product Lab Review Center</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                    Les changements sensibles proposes par l'automatisation arrivent ici avec resume, risque,
                    fichiers concernes et avant/apres. Une validation autorise le Product Lab a agir au prochain run.
                  </p>
                  <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">
                    Les tests quotidiens valident la qualite du code. Les cartes ci-dessous sont les vraies
                    ameliorations actionnables a valider, corriger ou refuser.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${
                        productLabPersistence === "supabase"
                          ? "border-green-400/20 bg-green-400/10 text-green-200"
                          : productLabPersistence === "loading"
                            ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                            : "border-blue-400/20 bg-blue-400/10 text-blue-200"
                      }`}
                    >
                      {productLabPersistence === "supabase"
                        ? "Sync Supabase active"
                        : productLabPersistence === "loading"
                          ? "Sync en verification"
                          : "Non synchronise GitHub"}
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                      Mode conseille: auto-safe + validation humaine
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => void Promise.all([loadProductLabQueue(), loadProductLabDecisionsState()])}
                  >
                    <FileText className="h-4 w-4" />
                    Recharger
                  </Button>
                  <Button className="w-full sm:w-auto" onClick={() => void copyProductLabDecisions()}>
                    <ClipboardCheck className="h-4 w-4" />
                    Exporter decisions
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {productLabScopeOptions.map((option) => {
                  const isActive = option.id === productLabScope;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setProductLabScope(option.id)}
                      className={`rounded-2xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.05] ${
                        isActive
                          ? "border-primary/45 bg-primary/[0.1] shadow-[0_0_0_1px_rgba(245,197,24,0.12)]"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <span className="text-sm font-semibold text-foreground">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                    </button>
                  );
                })}
              </div>

              {productLabPersistence !== "supabase" && (
                <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] p-4 text-sm leading-6 text-amber-100">
                  <strong>Attention:</strong> les validations {productLabScopeConfig.label} visibles ici sont gardees
                  dans ce navigateur. Elles ne seront pas appliquees par GitHub Actions tant que la synchronisation
                  Supabase n'est pas active.
                  {productLabPersistenceError ? (
                    <span className="mt-1 block text-amber-200/80">Detail: {productLabPersistenceError}</span>
                  ) : null}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: "A trancher", value: productLabReviewStats.pending, accent: "text-amber-300" },
                  { label: "Validees", value: productLabReviewStats.approved, accent: "text-green-300" },
                  { label: "Refusees", value: productLabReviewStats.rejected, accent: "text-red-300" },
                  { label: "A revoir", value: productLabReviewStats.needsReview, accent: "text-blue-300" },
                  { label: "Total", value: productLabReviewStats.total, accent: "text-primary" },
                ].map((entry) => (
                  <div key={entry.label} className="signal-list-card">
                    <p className={`text-2xl font-bold ${entry.accent}`}>{entry.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{entry.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Source automation {productLabScopeConfig.label} : {productLabQueue?.sourceRun.theme || "Product Lab"} - rapport{" "}
                  {productLabQueue?.sourceRun.reportPath || "non charge"}.
                </p>
                <p className="mt-1">
                  Resume du jour : {productLabQueue?.summary.dailySummary || "Actions sensibles a valider avant application."}
                </p>
                <p className="mt-1">
                  Score moyen : {productLabQueue?.summary.averageScore ?? "-"} / 100. Score a surveiller :{" "}
                  {productLabQueue?.summary.lowestScore
                    ? `${productLabQueue.summary.lowestScore.name} (${productLabQueue.summary.lowestScore.note}/100)`
                    : "-"}
                  .
                </p>
                <p className="mt-1">
                  Regle : une validation ici prepare la decision. Les changements auth, paiement, Supabase sensible,
                  provider IA, production ou suppression majeure restent bloques sans action humaine explicite.
                </p>
              </div>
            </div>

            {productLabLoading ? (
              <div className="premium-shell-muted flex items-center gap-3 p-5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Chargement des decisions Product Lab...
              </div>
            ) : productLabReviewItems.length > 0 ? (
              <div className="grid gap-4">
                {productLabReviewItems.map((item) => {
                  const isSyncedApproval =
                    item.localDecision.status === "approved" && item.localDecision.persisted === "supabase";
                  const applicationStatus = item.localDecision.applicationStatus ?? "pending";
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
                          <p>Impact : {item.impact}</p>
                          <p>Risque : {item.risk}</p>
                          <p>Difficulte : {item.difficulty}</p>
                          <p>Inspiration : {item.inspiration}</p>
                          {item.localDecision.processedAt ? (
                            <p>Run traite : {new Date(item.localDecision.processedAt).toLocaleString("fr-FR")}</p>
                          ) : null}
                        </div>
                      </div>

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



