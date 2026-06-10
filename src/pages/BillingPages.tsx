import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Coins,
  CreditCard,
  Crown,
  Gauge,
  Headphones,
  History,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  BILLING_PLANS,
  CREDIT_COST_RULES,
  CREDIT_PACKS,
  type BillingActionType,
  type CreditPackConfig,
  type PlanKey,
  QUALITY_MODES,
  estimateActionProfitability,
  getPlanBudgetConfig,
  getPlanByKey,
  getPlanCreditValueEur,
} from "@/lib/billing";
import { buildAuthRoute, getCurrentRelativeUrl } from "@/lib/auth-redirect";
import { isLocalAuthBypassEnabled } from "@/lib/browser-context";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

type P9Tone = "ready" | "local" | "warning" | "soon" | "safe" | "beta";

const toneClass: Record<P9Tone, string> = {
  ready: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  local: "border-sky-300/20 bg-sky-300/10 text-sky-200",
  warning: "border-orange-300/20 bg-orange-300/10 text-orange-200",
  soon: "border-white/10 bg-white/[0.05] text-white/62",
  safe: "border-[#F5C542]/30 bg-[#F5C542]/12 text-[#F5C542]",
  beta: "border-violet-300/20 bg-violet-300/10 text-violet-200",
};

const P9Badge = ({ tone = "soon", children }: { tone?: P9Tone; children: React.ReactNode }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${toneClass[tone]}`}>
    {children}
  </span>
);

const P9Panel = ({ children, glow = false, className = "" }: { children: React.ReactNode; glow?: boolean; className?: string }) => (
  <section
    className={`rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 ${
      glow ? "shadow-[0_0_70px_-52px_rgba(245,197,66,0.8)]" : ""
    } ${className}`}
  >
    {children}
  </section>
);

const P9Stat = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "safe",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: P9Tone;
}) => (
  <P9Panel>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">{label}</p>
        <p className="mt-3 text-3xl font-black text-white">{value}</p>
        {hint ? <p className="mt-1 text-sm text-white/48">{hint}</p> : null}
      </div>
      <div className={`rounded-2xl border p-3 ${toneClass[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </P9Panel>
);

const P9SafeNotice = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-4 rounded-[24px] border border-emerald-300/15 bg-emerald-300/[0.055] p-4 text-sm leading-6 text-white/62">
    <p className="font-semibold text-emerald-200">{title}</p>
    <div className="mt-1">{children}</div>
  </div>
);

const P9EmptyState = ({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) => (
  <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-6 text-center">
    <p className="text-lg font-semibold text-white">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/52">{description}</p>
    <Button asChild className="mt-5 rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
      <Link to={actionHref}>{actionLabel}</Link>
    </Button>
  </div>
);

const PixelrisesAppShell = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: {
  breadcrumb?: string;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string; icon: LucideIcon };
  secondaryAction?: { label: string; href: string; icon: LucideIcon };
  children: React.ReactNode;
}) => (
  <V2PageShell
    title={title}
    description={description}
    eyebrow="Billing Pixelrises"
    action={
      <div className="flex flex-wrap items-center gap-2">
        {secondaryAction ? (
          <Button asChild variant="outline" className="rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]">
            <Link to={secondaryAction.href}>
              <secondaryAction.icon className="mr-2 h-4 w-4" />
              {secondaryAction.label}
            </Link>
          </Button>
        ) : null}
        {primaryAction ? (
          <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to={primaryAction.href}>
              <primaryAction.icon className="mr-2 h-4 w-4" />
              {primaryAction.label}
            </Link>
          </Button>
        ) : null}
      </div>
    }
  >
    {children}
  </V2PageShell>
);

type WalletSnapshot = {
  balance: number;
  monthlyAllowance: number;
  bonusBalance: number;
  lifetimeUsed: number;
};

type SubscriptionSnapshot = {
  planKey: PlanKey;
  status: string;
  currentPeriodEnd: string | null;
};

type CreditTransactionRow = {
  id: string;
  delta: number;
  amount?: number | null;
  type?: string | null;
  reason?: string | null;
  source_type?: string | null;
  status?: string | null;
  created_at: string;
};

type UsageRow = {
  id: string;
  action_type: string;
  builder_type: string | null;
  credits_estimated: number;
  credits_charged: number;
  status: string;
  created_at: string;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "A definir";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
};

const formatPlanPrice = (price: number | null) => {
  if (price === null) return "Sur devis";
  if (price === 0) return "0 EUR";
  return `${price} EUR / mois`;
};

const formatOneTimePrice = (price: number) => `${price} EUR`;
const formatCreditsCount = (value: number | null | undefined) =>
  value === null || value === undefined ? "Sur mesure" : new Intl.NumberFormat("fr-FR").format(value);

const formatCreditUnitPrice = (price: number, credits: number) =>
  `${(price / credits).toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} EUR / credit`;
const formatEur = (value: number | null) => (value === null ? "Sur mesure" : `${value.toFixed(2)} EUR`);
const formatRatio = (value: number | null) => (value === null ? "n/a" : `x${value.toFixed(2)}`);
const formatPercent = (value: number | null) => (value === null ? "n/a" : `${Math.round(value * 100)}%`);

const planAudience: Record<PlanKey, string> = {
  free: "Tester la valeur sans risque",
  starter: "Lancer un premier projet propre",
  pro: "Creer, iterer et publier regulierement",
  business: "Produire plusieurs projets avec marge protegee",
  enterprise: "Contrat sur mesure avec validation humaine",
};

const planOutcome: Record<PlanKey, string> = {
  free: "Decouverte controlee",
  starter: "Site ou agent principal",
  pro: "Offre la plus equilibree",
  business: "Volume premium encadre",
  enterprise: "Credits, securite et support negocies",
};

const packTone: Record<string, { label: string; detail: string; className: string }> = {
  credits_100: {
    label: "Boost rapide",
    detail: "Pour finir une creation sans changer de plan.",
    className: "from-sky-300/14 via-white/[0.035] to-transparent",
  },
  credits_300: {
    label: "Meilleur ratio",
    detail: "Le pack le plus logique pour iterer plusieurs jours.",
    className: "from-[#F5C542]/20 via-white/[0.045] to-transparent",
  },
  credits_750: {
    label: "Production intense",
    detail: "Pour une grosse session de creation ou plusieurs clients.",
    className: "from-emerald-300/14 via-white/[0.035] to-transparent",
  },
  credits_1500: {
    label: "Sur devis",
    detail: "Credits et budget ajustes apres validation humaine.",
    className: "from-violet-300/14 via-white/[0.035] to-transparent",
  },
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: "Actif",
    trialing: "Essai",
    free: "Decouverte",
    checkout_started: "Paiement en cours",
    past_due: "Paiement a verifier",
    payment_failed: "Paiement echoue",
    payment_action_required: "Action requise",
    canceled: "Annule",
    incomplete: "A finaliser",
  };

  return map[status] || "A verifier";
};

const clientErrorMessage = "Donnees billing indisponibles pour le moment.";

const useBillingAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletSnapshot>({
    balance: 0,
    monthlyAllowance: 5,
    bonusBalance: 0,
    lifetimeUsed: 0,
  });
  const [subscription, setSubscription] = useState<SubscriptionSnapshot>({
    planKey: "free",
    status: "free",
    currentPeriodEnd: null,
  });
  const [transactions, setTransactions] = useState<CreditTransactionRow[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [dataState, setDataState] = useState<"real" | "local" | "error" | "empty">("empty");

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || isLocalAuthBypassEnabled()) {
        setDataState("local");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
        return;
      }

      const [creditsRes, walletRes, subscriptionRes, transactionsRes, usageRes] = await Promise.all([
        supabase.from("user_credits").select("credits, total_used").eq("user_id", user.id).maybeSingle(),
        supabase.from("credit_wallets").select("balance, monthly_allowance, bonus_balance, lifetime_used").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_subscriptions").select("plan_key, status, current_period_end").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("credit_transactions")
          .select("id, delta, amount, type, reason, source_type, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("usage_events")
          .select("id, action_type, builder_type, credits_estimated, credits_charged, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      if (creditsRes.error && walletRes.error) {
        setDataState("error");
        setLoading(false);
        return;
      }

      const legacyCredits = creditsRes.data;
      const walletData = walletRes.data;
      setWallet({
        balance: walletData?.balance ?? legacyCredits?.credits ?? 0,
        monthlyAllowance: walletData?.monthly_allowance ?? 5,
        bonusBalance: walletData?.bonus_balance ?? 0,
        lifetimeUsed: walletData?.lifetime_used ?? legacyCredits?.total_used ?? 0,
      });

      if (subscriptionRes.data?.plan_key) {
        setSubscription({
          planKey: subscriptionRes.data.plan_key as PlanKey,
          status: subscriptionRes.data.status || "free",
          currentPeriodEnd: subscriptionRes.data.current_period_end || null,
        });
      }

      if (transactionsRes.data) {
        setTransactions(transactionsRes.data as CreditTransactionRow[]);
      }

      if (usageRes.data) {
        setUsage(usageRes.data as UsageRow[]);
      }

      setDataState("real");
      setLoading(false);
    };

    void load();
  }, [navigate]);

  return { loading, wallet, subscription, transactions, usage, dataState };
};

const useCheckout = () => {
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const startCheckout = async (planKey: PlanKey) => {
    if (isLocalAuthBypassEnabled()) {
      toast({
        title: "Paiement réservé au compte connecté",
        description: "En local, tu peux travailler sans connexion. Le checkout réel nécessite une session utilisateur.",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Paiement indisponible",
        description: "La configuration de paiement n'est pas encore active.",
        variant: "destructive",
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
      return;
    }

    setLoadingKey(`plan:${planKey}`);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planKey, mode: "subscription" },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("checkout_url_missing");
    } catch {
      toast({
        title: "Paiement indisponible",
        description: "Impossible d'ouvrir le paiement pour le moment.",
        variant: "destructive",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const openDirectCreditPackLink = (pack: CreditPackConfig) => {
    if (!pack.stripePaymentLink) return false;

    toast({
      title: "Lien Stripe direct ouvert",
      description: "Les credits sont ajoutes automatiquement si le webhook et les Price IDs sont configures.",
    });
    window.location.href = pack.stripePaymentLink;
    return true;
  };

  const startCreditPackCheckout = async (pack: CreditPackConfig) => {
    if (pack.status === "quote") {
      if (pack.quoteUrl) window.open(pack.quoteUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (isLocalAuthBypassEnabled()) {
      toast({
        title: "Paiement réservé au compte connecté",
        description: "En local, tu peux tester l'interface. Les achats réels restent liés à une session.",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      if (!openDirectCreditPackLink(pack)) {
        toast({
          title: "Paiement indisponible",
          description: "La configuration de paiement n'est pas encore active.",
          variant: "destructive",
        });
      }
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
      return;
    }

    setLoadingKey(`pack:${pack.key}`);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { packKey: pack.key, mode: "payment" },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("checkout_url_missing");
    } catch {
      if (!openDirectCreditPackLink(pack)) {
        toast({
          title: "Paiement indisponible",
          description: "Impossible d'ouvrir le paiement pour ce pack. Verifiez les Price IDs Stripe.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingKey(null);
    }
  };

  return {
    startCheckout,
    startCreditPackCheckout,
    loadingPlan: loadingKey?.startsWith("plan:") ? (loadingKey.replace("plan:", "") as PlanKey) : null,
    loadingPack: loadingKey?.startsWith("pack:") ? loadingKey.replace("pack:", "") : null,
  };
};

const BillingDataBadge = ({ state }: { state: "real" | "local" | "error" | "empty" }) => {
  if (state === "real") return <P9Badge tone="ready">Donnees reelles</P9Badge>;
  if (state === "local") return <P9Badge tone="local">Configuration locale</P9Badge>;
  if (state === "error") return <P9Badge tone="warning">A verifier</P9Badge>;
  return <P9Badge tone="soon">Aucune donnee</P9Badge>;
};

const BillingMetricCard = ({
  label,
  value,
  hint,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: LucideIcon;
  featured?: boolean;
}) => (
  <article
    className={`relative overflow-hidden rounded-[24px] border p-4 sm:p-5 ${
      featured
        ? "border-[#F5C542]/38 bg-[#F5C542]/[0.055] shadow-[0_0_56px_-42px_rgba(245,197,66,0.95)]"
        : "border-white/[0.08] bg-white/[0.035]"
    }`}
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5C542]/55 to-transparent" />
    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F5C542]">{label}</p>
        <p className="mt-3 truncate text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">{value}</p>
        <p className="mt-1 text-xs leading-5 text-white/52">{hint}</p>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F5C542]/24 bg-[#F5C542]/10 text-[#F5C542]">
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </article>
);

const BillingProtectionItem = ({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) => (
  <div className="flex gap-3 rounded-[22px] border border-white/[0.06] bg-black/24 p-4">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F5C542]/24 bg-[#F5C542]/10 text-[#F5C542]">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/54">{description}</p>
    </div>
  </div>
);

const BillingControlItem = ({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) => (
  <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
      <Icon className="h-4 w-4" />
    </div>
    <p className="mt-3 text-sm font-bold text-white">{title}</p>
    <p className="mt-1 text-xs leading-5 text-white/48">{description}</p>
  </div>
);

const BillingSectionTitle = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F5C542]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">{description}</p> : null}
    </div>
    {action}
  </div>
);

export const PricingPage = () => {
  const { startCheckout, loadingPlan } = useCheckout();

  return (
    <PixelrisesAppShell
      breadcrumb="Billing"
      title="Plans Pixelrises"
      description="Des credits inclus, des quotas clairs et une logique rentable sans exposer les couts internes."
      primaryAction={{ label: "Voir mes credits", href: "/credits", icon: WalletCards }}
      secondaryAction={{ label: "Facturation", href: "/billing", icon: CreditCard }}
    >
      <div className="grid gap-4 xl:grid-cols-5">
        {BILLING_PLANS.map((plan) => {
          const budget = getPlanBudgetConfig(plan.key);
          const creditValue = getPlanCreditValueEur(plan.key);
          const modeLabels = plan.qualityModes.map((mode) => QUALITY_MODES[mode].label).join(" / ");

          return (
            <P9Panel
              key={plan.key}
              glow={plan.isRecommended}
              className={`relative flex min-h-[430px] overflow-hidden p-0 ${
                plan.isRecommended
                  ? "border-[#F5C542]/35 bg-[#F5C542]/[0.045]"
                  : "bg-white/[0.025]"
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#F5C542]/12 to-transparent" />
              <div className="relative flex w-full flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <P9Badge tone={plan.isRecommended ? "safe" : plan.key === "enterprise" ? "beta" : "ready"}>
                        {plan.isRecommended ? "Recommande" : plan.key === "enterprise" ? "Custom" : "Actif"}
                      </P9Badge>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/38">
                        {planAudience[plan.key]}
                      </p>
                    </div>
                    {plan.monthlyCredits !== null ? (
                      <span className="rounded-full border border-[#F5C542]/25 bg-[#F5C542]/10 px-3 py-1 text-xs font-bold text-[#F5C542]">
                        {plan.monthlyCredits} credits
                      </span>
                    ) : (
                      <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-bold text-violet-200">
                        Devis
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-2xl font-black text-white">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                  <p className="mt-5 text-3xl font-black text-white">{formatPlanPrice(plan.priceMonthlyEur)}</p>

                  <div className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/48">Credits mensuels</span>
                      <strong className="text-white">
                        {plan.monthlyCredits === null ? "Sur mesure" : `${plan.monthlyCredits} / mois`}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/48">Valeur credit</span>
                      <strong className="text-white">
                        {creditValue === null ? "Custom" : `${creditValue.toFixed(4)} EUR`}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/48">Budget IA garde-fou</span>
                      <strong className="text-white">
                        {budget.monthlyAiBudgetEur === null ? "Contrat" : `${budget.monthlyAiBudgetEur} EUR / mois`}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                      Recharge mensuelle automatique
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/58">
                      Paiement confirme : credits ajoutes. Facture mensuelle payee : recharge du plan, avec protection anti-doublon.
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    {plan.features.slice(0, 4).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-xs leading-5 text-white/44">
                    {planOutcome[plan.key]} · Modes : {modeLabels}
                  </p>
                  {plan.key === "free" ? (
                    <Button asChild variant="outline" className="w-full rounded-2xl border-white/10">
                      <Link to="/builder/site">Essayer</Link>
                    </Button>
                  ) : plan.isCustom ? (
                    <Button asChild variant="outline" className="w-full rounded-2xl border-white/10">
                      <Link to="/support/new">Contacter Pixelrises</Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-2xl"
                      onClick={() => void startCheckout(plan.key)}
                      disabled={loadingPlan === plan.key}
                    >
                      {loadingPlan === plan.key ? "Ouverture..." : "Choisir ce plan"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </P9Panel>
          );
        })}
      </div>

      <P9SafeNotice title="Regle credits">
        Les credits sont debites uniquement quand une action reussit. En cas d'echec, l'historique indique 0 credit debite ou un remboursement automatique.
      </P9SafeNotice>
    </PixelrisesAppShell>
  );
};

export const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const { loading, wallet, subscription, dataState } = useBillingAccount();
  const { startCreditPackCheckout, loadingPack } = useCheckout();
  const plan = getPlanByKey(subscription.planKey);
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("portal_url_missing");
    } catch {
      toast({
        title: "Portail indisponible",
        description: "Aucun detail technique n'a ete expose. Reessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const paymentStatus = searchParams.get("payment");

  return (
    <PixelrisesAppShell
      breadcrumb="Billing"
      title="Crédits & abonnement"
      description="Gérez votre plan, vos crédits et vos recharges sans perdre le contrôle."
      primaryAction={{ label: "Changer de plan", href: "/pricing", icon: TrendingUp }}
      secondaryAction={{ label: "Historique crédits", href: "/credits", icon: History }}
    >
      <div className="space-y-5">
        {paymentStatus === "success" && (
          <div className="rounded-[24px] border border-[#F5C542]/24 bg-[#F5C542]/10 p-4 text-sm leading-6 text-white/70">
            <p className="font-bold text-[#F5C542]">Paiement confirmé</p>
            <p className="mt-1">Stripe a confirmé le paiement. Les crédits sont ajoutés par webhook sécurisé et idempotent.</p>
          </div>
        )}

        {paymentStatus === "cancelled" && (
          <P9Panel className="border-orange-400/20 bg-orange-400/10">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-300" />
              <div>
                <p className="font-bold text-orange-200">Paiement annulé</p>
                <p className="mt-1 text-sm text-muted-foreground">Aucun changement n'a été appliqué à votre compte.</p>
              </div>
            </div>
          </P9Panel>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <BillingMetricCard
            label="Crédits disponibles"
            value={loading ? "..." : formatCreditsCount(wallet.balance)}
            hint="Solde actuel"
            icon={Coins}
            featured
          />
          <BillingMetricCard
            label="Plan actuel"
            value={plan.name}
            hint={`${formatCreditsCount(wallet.monthlyAllowance)} crédits / mois`}
            icon={CreditCard}
          />
          <BillingMetricCard
            label="Renouvellement"
            value={formatDate(subscription.currentPeriodEnd)}
            hint={subscription.currentPeriodEnd ? "Prochaine recharge" : "À configurer si abonnement actif"}
            icon={CalendarDays}
          />
          <BillingMetricCard
            label="Crédits utilisés"
            value={formatCreditsCount(wallet.lifetimeUsed)}
            hint="Historique cumulé"
            icon={Gauge}
          />
        </div>

        <section className="relative overflow-hidden rounded-[28px] border border-[#F5C542]/18 bg-[#080808]/88 p-5 shadow-[0_0_80px_-60px_rgba(245,197,66,0.95)]">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_82%_35%,rgba(245,197,66,0.24),transparent_34%)]" />
          <BillingSectionTitle
            eyebrow="Sécurité & protection"
            title="Paiement contrôlé, crédits protégés."
            description="La page reste claire : chaque recharge, webhook et secours est encadré sans exposer de donnée sensible."
          />
          <div className="relative mt-5 grid gap-3 lg:grid-cols-3">
            <BillingProtectionItem
              title="Abonnement automatique"
              description="Checkout confirmé : crédits initiaux, puis recharge mensuelle uniquement après facture payée."
              icon={RefreshCw}
            />
            <BillingProtectionItem
              title="Anti double-crédit"
              description="Les événements Stripe sont traités avec idempotence pour éviter les doublons de paiement ou de recharge."
              icon={ShieldCheck}
            />
            <BillingProtectionItem
              title="Secours admin"
              description="En cas de souci, l'équipe peut intervenir manuellement avec contrôle et traçabilité."
              icon={Headphones}
            />
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[28px] border border-[#F5C542]/22 bg-[linear-gradient(135deg,rgba(245,197,66,0.10),rgba(255,255,255,0.035)_34%,rgba(0,0,0,0.36))] p-5 shadow-[0_0_90px_-64px_rgba(245,197,66,0.95)]">
          <div className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#F5C542]/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-[#F5C542]/30 bg-[#F5C542]/12 text-[#F5C542] shadow-[0_0_46px_-24px_rgba(245,197,66,0.95)]">
                <Crown className="h-9 w-9" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <P9Badge tone="safe">Votre abonnement</P9Badge>
                  <span className="rounded-full border border-white/[0.10] bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/62">
                    {statusLabel(subscription.status)}
                  </span>
                  {dataState === "real" ? (
                    <span className="rounded-full border border-[#F5C542]/20 bg-[#F5C542]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5C542]">
                      Données compte
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">Plan {plan.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                  {formatCreditsCount(wallet.monthlyAllowance)} crédits inclus / mois. Les changements de plan, moyens de paiement et factures passent par le portail client sécurisé.
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-white/62 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-2xl border border-white/[0.08] bg-black/24 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">Renouvellement</p>
                <p className="mt-1 font-semibold text-white">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/24 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">Paiement</p>
                <p className="mt-1 font-semibold text-white">Portail sécurisé</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/24 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">Méthode</p>
                <p className="mt-1 font-semibold text-white">Non exposée</p>
              </div>
            </div>

            <Button
              onClick={() => void openPortal()}
              disabled={portalLoading}
              className="min-h-[50px] rounded-2xl bg-[#F5C542] px-6 text-sm font-black text-black shadow-[0_18px_46px_-30px_rgba(245,197,66,0.95)] hover:bg-[#FFD766]"
            >
              {portalLoading ? "Ouverture..." : "Gérer mon abonnement"}
            </Button>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5">
          <BillingSectionTitle
            eyebrow="Packs de crédits"
            title="Ajoutez des crédits quand vous voulez."
            description="Les crédits ponctuels sont ajoutés après confirmation du paiement. Growth reste mis en avant car il garde le meilleur ratio."
            action={<P9Badge tone="safe">Paiement sécurisé</P9Badge>}
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {CREDIT_PACKS.map((pack) => {
              const tone = packTone[pack.key] || packTone.credits_100;
              const fixedPack = pack.priceEur !== null && pack.credits !== null;
              const highlighted = pack.key === "credits_300";
              const quote = pack.status === "quote";

              return (
                <article
                  key={pack.key}
                  className={`relative flex min-h-[330px] flex-col overflow-hidden rounded-[28px] border p-5 ${
                    highlighted
                      ? "border-[#F5C542]/55 bg-[#F5C542]/[0.075] shadow-[0_0_62px_-32px_rgba(245,197,66,0.95)]"
                      : "border-white/[0.08] bg-black/28"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5C542]/55 to-transparent" />
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#F5C542]/12 blur-3xl" />
                  {highlighted ? (
                    <span className="absolute right-4 top-4 rounded-full bg-[#F5C542] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black">
                      Meilleur ratio
                    </span>
                  ) : null}

                  <div className="relative flex flex-1 flex-col">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F5C542]/24 bg-[#F5C542]/10 text-[#F5C542]">
                      {quote ? <Crown className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </span>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-[#F5C542]">{tone.label}</p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">{pack.label}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#F5C542]">
                      {pack.credits === null ? "Sur devis" : `${formatCreditsCount(pack.credits)} crédits`}
                    </p>
                    <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-white">
                      {pack.priceEur === null ? "Sur devis" : formatOneTimePrice(pack.priceEur)}
                    </p>
                    <p className="mt-1 text-xs text-white/46">
                      {fixedPack ? formatCreditUnitPrice(pack.priceEur, pack.credits) : "Volume personnalisé"}
                    </p>

                    <div className="mt-5 space-y-2 border-t border-white/[0.08] pt-4 text-xs text-white/58">
                      <p className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#F5C542]" />
                        {quote ? "Validation humaine avant devis" : "Ajout automatique après paiement"}
                      </p>
                      <p className="flex items-center gap-2">
                        <LockKeyhole className="h-4 w-4 text-[#F5C542]" />
                        Protection anti-doublon
                      </p>
                      {quote ? (
                        <p className="flex items-center gap-2">
                          <Headphones className="h-4 w-4 text-[#F5C542]" />
                          Support prioritaire
                        </p>
                      ) : null}
                    </div>

                    {quote && pack.quoteUrl ? (
                      <Button asChild className="mt-auto w-full rounded-2xl border-[#F5C542]/24 bg-transparent text-white hover:bg-[#F5C542]/10" variant="outline">
                        <a href={pack.quoteUrl} target="_blank" rel="noopener noreferrer">
                          {pack.ctaLabel ?? "Demander un devis"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        className={`mt-auto w-full rounded-2xl ${
                          highlighted
                            ? "bg-[#F5C542] text-black hover:bg-[#FFD766]"
                            : "border-[#F5C542]/24 bg-transparent text-white hover:bg-[#F5C542]/10"
                        }`}
                        variant={highlighted ? "default" : "outline"}
                        disabled={loadingPack === pack.key}
                        onClick={() => void startCreditPackCheckout(pack)}
                      >
                        {loadingPack === pack.key ? "Ouverture..." : "Acheter ce pack"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[28px] border border-[#F5C542]/18 bg-[#080808]/88 p-5">
          <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#F5C542]/12 blur-3xl" />
          <BillingSectionTitle
            eyebrow="Vous gardez le contrôle"
            title="Aucun débit caché, aucune recharge opaque."
            description="La facturation reste lisible : historique, anti-doublon, secours admin et transparence des transactions."
          />
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <BillingControlItem title="Paiement contrôlé" description="Aucun débit sans action ou validation." icon={CreditCard} />
            <BillingControlItem title="Historique disponible" description="Suivez les crédits et transactions." icon={ReceiptText} />
            <BillingControlItem title="Protection anti-doublon" description="Sécurité webhook et vérifications." icon={Shield} />
            <BillingControlItem title="Secours admin" description="Intervention humaine si besoin." icon={Headphones} />
            <BillingControlItem title="Aucun débit caché" description="Transparence côté compte." icon={LockKeyhole} />
          </div>
        </section>
      </div>
    </PixelrisesAppShell>
  );
};

export const CreditsPage = () => {
  const { loading, wallet, transactions, usage, dataState } = useBillingAccount();

  return (
    <PixelrisesAppShell
      breadcrumb="Billing"
      title="Credits"
      description="Solde, usage et remboursements. Les generations echouees ne debitent pas vos credits."
      primaryAction={{ label: "Voir les plans", href: "/pricing", icon: TrendingUp }}
      secondaryAction={{ label: "Facturation", href: "/billing", icon: CreditCard }}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <P9Stat label="Solde" value={loading ? "..." : wallet.balance} hint="Credits disponibles" icon={WalletCards} />
        <P9Stat label="Bonus" value={wallet.bonusBalance} hint="Credits additionnels" icon={Sparkles} tone="beta" />
        <P9Stat label="Consommes" value={wallet.lifetimeUsed} hint="Total historique" icon={History} tone="warning" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <P9Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Historique credits</h2>
              <p className="mt-1 text-sm text-muted-foreground">Debit, ajout ou remboursement.</p>
            </div>
            <BillingDataBadge state={dataState} />
          </div>

          {transactions.length === 0 ? (
            <P9EmptyState
              title="Aucune transaction"
              description={clientErrorMessage}
              actionLabel="Creer un site"
              actionHref="/builder/site"
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div>
                    <p className="font-semibold">{transaction.reason || transaction.source_type || "Mouvement credits"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={transaction.delta >= 0 ? "font-black text-green-300" : "font-black text-primary"}>
                      {transaction.delta >= 0 ? "+" : ""}
                      {transaction.amount ?? transaction.delta} credits
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{statusLabel(transaction.status || "active")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </P9Panel>

        <P9Panel>
          <h2 className="text-xl font-black">Actions recentes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Chaque action couteuse a un statut clair.</p>
          <div className="mt-4 space-y-2">
            {usage.length === 0 ? (
              <P9SafeNotice title="Aucun usage facture">
                Lancez une action IA pour voir son statut. En cas d'echec, le debit reste a 0 credit.
              </P9SafeNotice>
            ) : (
              usage.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{event.action_type}</p>
                    <P9Badge tone={event.status === "succeeded" ? "ready" : event.status === "failed" ? "warning" : "soon"}>
                      {event.status}
                    </P9Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.credits_charged} credit debite sur {event.credits_estimated} estime.
                  </p>
                </div>
              ))
            )}
          </div>
        </P9Panel>
      </div>
    </PixelrisesAppShell>
  );
};

export const AdminBillingPage = () => {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Array<{ balance: number; lifetime_used: number; user_id: string }>>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<Array<{ status: string; plan_key: string }>>([]);
  const [events, setEvents] = useState<Array<{ id: string; type: string; status: string; created_at: string }>>([]);

  useEffect(() => {
    const load = async () => {
      const [walletRes, usageRes, subscriptionRes, eventRes] = await Promise.all([
        supabase.from("credit_wallets").select("user_id, balance, lifetime_used").limit(100),
        supabase
          .from("usage_events")
          .select("id, action_type, builder_type, credits_estimated, credits_charged, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("user_subscriptions").select("status, plan_key").limit(100),
        supabase.from("stripe_events").select("id, type, status, created_at").order("created_at", { ascending: false }).limit(20),
      ]);

      setWallets((walletRes.data || []) as Array<{ balance: number; lifetime_used: number; user_id: string }>);
      setUsage((usageRes.data || []) as UsageRow[]);
      setSubscriptions((subscriptionRes.data || []) as Array<{ status: string; plan_key: string }>);
      setEvents((eventRes.data || []) as Array<{ id: string; type: string; status: string; created_at: string }>);
      setLoading(false);
    };

    void load();
  }, []);

  const usageStats = useMemo(() => {
    const creditsCharged = usage.reduce((sum, event) => sum + Number(event.credits_charged || 0), 0);
    const creditsEstimated = usage.reduce((sum, event) => sum + Number(event.credits_estimated || 0), 0);
    const failed = usage.filter((event) => event.status === "failed").length;
    const expensive = [...usage].sort((a, b) => b.credits_estimated - a.credits_estimated).slice(0, 5);

    return { creditsCharged, creditsEstimated, failed, expensive };
  }, [usage]);
  const profitabilityRows = useMemo(() => {
    const focusActions: BillingActionType[] = [
      "site_generation",
      "site_section_improve",
      "site_seo_analysis",
      "game_blueprint",
      "game_prototype",
      "game_package",
      "agent_generation",
      "business_plan",
    ];

    return focusActions
      .map((actionType) => {
        const rule = CREDIT_COST_RULES.find((item) => item.actionType === actionType);
        if (!rule) return null;

        return {
          rule,
          starter: estimateActionProfitability({
            planKey: "starter",
            actionType,
            qualityMode: rule.defaultQualityMode,
          }),
          pro: estimateActionProfitability({
            planKey: "pro",
            actionType,
            qualityMode: rule.defaultQualityMode,
          }),
          business: estimateActionProfitability({
            planKey: "business",
            actionType,
            qualityMode: rule.defaultQualityMode,
          }),
        };
      })
      .filter(Boolean);
  }, []);

  return (
    <PixelrisesAppShell
      breadcrumb="Admin"
      title="Billing & rentabilite"
      description="Vue admin redacted pour surveiller credits, abonnements, usage et alertes d'abus."
      primaryAction={{ label: "Plans", href: "/pricing", icon: CreditCard }}
      secondaryAction={{ label: "Admin", href: "/admin", icon: LockKeyhole }}
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <P9Stat label="Credits utilises" value={loading ? "..." : usageStats.creditsCharged} icon={TrendingUp} />
        <P9Stat label="Estimes" value={usageStats.creditsEstimated} icon={Gauge} tone="beta" />
        <P9Stat label="Wallets" value={wallets.length} icon={WalletCards} tone="ready" />
        <P9Stat label="Echecs" value={usageStats.failed} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <P9Panel>
          <h2 className="text-xl font-black">Actions couteuses</h2>
          <div className="mt-4 space-y-2">
            {usageStats.expensive.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <p className="font-semibold">{event.action_type}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.credits_estimated} estimes / {event.credits_charged} factures
                </p>
              </div>
            ))}
          </div>
        </P9Panel>

        <P9Panel>
          <h2 className="text-xl font-black">Abonnements</h2>
          <div className="mt-4 space-y-2">
            {subscriptions.slice(0, 8).map((subscription, index) => (
              <div key={`${subscription.plan_key}-${index}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <span className="font-semibold">{subscription.plan_key}</span>
                <P9Badge tone={subscription.status === "active" ? "ready" : "warning"}>
                  {statusLabel(subscription.status)}
                </P9Badge>
              </div>
            ))}
          </div>
        </P9Panel>

        <P9Panel>
          <h2 className="text-xl font-black">Evenements Stripe</h2>
          <div className="mt-4 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{event.type}</p>
                  <P9Badge tone={event.status === "ok" ? "ready" : event.status === "skip" ? "soon" : "warning"}>
                    {event.status}
                  </P9Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
              </div>
            ))}
          </div>
        </P9Panel>
      </div>

      <P9Panel className="mt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Bareme credits & marge</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimations admin redacted : credits factures, cout IA estime et marge par plan. Les couts reels restent a verifier dans AI Gateway.
            </p>
          </div>
          <P9Badge tone="safe">Marge protegee</P9Badge>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[1.3fr_0.7fr_0.8fr_0.8fr_0.8fr] gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span>Action</span>
            <span>Credits</span>
            <span>Pro</span>
            <span>Business</span>
            <span>Statut</span>
          </div>
          {profitabilityRows.map((row) => {
            if (!row) return null;
            const tone = row.pro.verdict === "safe" && row.business.verdict === "safe" ? "ready" : "warning";

            return (
              <div
                key={row.rule.actionType}
                className="grid grid-cols-[1.3fr_0.7fr_0.8fr_0.8fr_0.8fr] gap-2 border-b border-white/10 px-4 py-3 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{row.rule.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Cout IA estime {formatEur(row.pro.estimatedInternalCostEur)} · risque {row.rule.abuseRisk}
                  </p>
                </div>
                <span className="font-bold text-primary">{row.pro.credits}</span>
                <span>
                  {formatEur(row.pro.estimatedRevenueEur)}
                  <span className="block text-xs text-muted-foreground">
                    {formatPercent(row.pro.grossMarginRatio)} / {formatRatio(row.pro.revenueToCostRatio)}
                  </span>
                </span>
                <span>
                  {formatEur(row.business.estimatedRevenueEur)}
                  <span className="block text-xs text-muted-foreground">
                    {formatPercent(row.business.grossMarginRatio)} / {formatRatio(row.business.revenueToCostRatio)}
                  </span>
                </span>
                <P9Badge tone={tone}>{tone === "ready" ? "OK" : "A surveiller"}</P9Badge>
              </div>
            );
          })}
        </div>
      </P9Panel>
    </PixelrisesAppShell>
  );
};

export const BillingSettingsPage = () => <BillingPage />;
