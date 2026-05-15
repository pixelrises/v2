import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Gauge,
  History,
  LockKeyhole,
  RefreshCw,
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
  type PlanKey,
  getPlanByKey,
} from "@/lib/billing";
import { buildAuthRoute, getCurrentRelativeUrl } from "@/lib/auth-redirect";
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

const formatCreditUnitPrice = (price: number, credits: number) =>
  `${(price / credits).toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} EUR / credit`;

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
      if (!isSupabaseConfigured) {
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

  const startCreditPackCheckout = async (packKey: string) => {
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

    setLoadingKey(`pack:${packKey}`);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { packKey, mode: "payment" },
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
        description: "Impossible d'ouvrir le paiement pour ce pack. Verifiez les Price IDs Stripe.",
        variant: "destructive",
      });
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
        {BILLING_PLANS.map((plan) => (
          <P9Panel
            key={plan.key}
            glow={plan.isRecommended}
            className="flex min-h-[360px] flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <P9Badge tone={plan.isRecommended ? "safe" : plan.key === "enterprise" ? "beta" : "ready"}>
                  {plan.isRecommended ? "Recommande" : plan.key === "enterprise" ? "Custom" : "Actif"}
                </P9Badge>
                {plan.monthlyCredits !== null && (
                  <span className="text-xs font-bold text-primary">{plan.monthlyCredits} credits</span>
                )}
              </div>
              <h2 className="mt-5 text-2xl font-black">{plan.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              <p className="mt-5 text-3xl font-black">{formatPlanPrice(plan.priceMonthlyEur)}</p>
              <div className="mt-5 space-y-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {plan.key === "free" ? (
              <Button asChild variant="outline" className="mt-6 rounded-2xl border-white/10">
                <Link to="/builder/site">Essayer</Link>
              </Button>
            ) : plan.isCustom ? (
              <Button asChild variant="outline" className="mt-6 rounded-2xl border-white/10">
                <Link to="/support/new">Contacter Pixelrises</Link>
              </Button>
            ) : (
              <Button
                className="mt-6 rounded-2xl"
                onClick={() => void startCheckout(plan.key)}
                disabled={loadingPlan === plan.key}
              >
                {loadingPlan === plan.key ? "Ouverture..." : "Choisir ce plan"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </P9Panel>
        ))}
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
      title="Facturation"
      description="Plan, credits et renouvellement. Les actions payantes restent sous votre controle."
      primaryAction={{ label: "Changer de plan", href: "/pricing", icon: TrendingUp }}
      secondaryAction={{ label: "Historique credits", href: "/credits", icon: History }}
    >
      {paymentStatus === "success" && (
        <P9SafeNotice title="Paiement confirme">
          Stripe a confirme le paiement. Les credits sont ajoutes par webhook securise et idempotent.
        </P9SafeNotice>
      )}

      {paymentStatus === "cancelled" && (
        <P9Panel className="border-orange-400/20 bg-orange-400/10">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-300" />
            <div>
              <p className="font-bold text-orange-200">Paiement annule</p>
              <p className="mt-1 text-sm text-muted-foreground">Aucun changement n'a ete applique a votre compte.</p>
            </div>
          </div>
        </P9Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <P9Stat
          label="Credits"
          value={loading ? "..." : wallet.balance}
          hint="Solde disponible"
          icon={WalletCards}
        />
        <P9Stat
          label="Plan"
          value={plan.name}
          hint={statusLabel(subscription.status)}
          icon={CreditCard}
          tone="ready"
        />
        <P9Stat
          label="Renouvellement"
          value={formatDate(subscription.currentPeriodEnd)}
          hint={`${wallet.monthlyAllowance} credits inclus`}
          icon={RefreshCw}
          tone="beta"
        />
        <P9Stat
          label="Utilises"
          value={wallet.lifetimeUsed}
          hint="Historique cumule"
          icon={Gauge}
          tone="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <P9Panel glow>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <P9Badge tone="safe">{plan.name}</P9Badge>
                <BillingDataBadge state={dataState} />
              </div>
              <h2 className="mt-4 text-2xl font-black">Votre abonnement</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Les changements de plan, moyens de paiement et factures passent par le portail client securise. Aucune information de paiement sensible n'est stockee dans l'interface Pixelrises.
              </p>
            </div>
            <Button onClick={() => void openPortal()} disabled={portalLoading} className="rounded-2xl">
              {portalLoading ? "Ouverture..." : "Gerer mon abonnement"}
            </Button>
          </div>
        </P9Panel>

        <P9Panel>
          <h3 className="text-lg font-bold">Packs de credits</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Credits ponctuels pour continuer a produire sans changer immediatement de plan. Les credits sont ajoutes apres paiement confirme.
          </p>
          <div className="mt-4 grid gap-3">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.key} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{pack.label}</span>
                      <P9Badge tone={pack.status === "active" ? "ready" : "soon"}>
                        {pack.status === "active" ? "Disponible" : "Bientot"}
                      </P9Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{pack.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{formatOneTimePrice(pack.priceEur)}</p>
                    <p className="mt-1 text-xs text-primary">{pack.credits} credits</p>
                    <p className="mt-1 text-[11px] text-white/38">
                      {formatCreditUnitPrice(pack.priceEur, pack.credits)}
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-3 w-full rounded-2xl"
                  variant={pack.status === "active" ? "default" : "outline"}
                  disabled={pack.status !== "active" || loadingPack === pack.key}
                  onClick={() => void startCreditPackCheckout(pack.key)}
                >
                  {loadingPack === pack.key ? "Ouverture..." : "Acheter ce pack"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </P9Panel>
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
        <h2 className="text-xl font-black">Recommandations rentabilite</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {CREDIT_COST_RULES.filter((rule) => rule.abuseRisk !== "low").slice(0, 3).map((rule) => (
            <div key={rule.actionType} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <P9Badge tone={rule.abuseRisk === "high" ? "warning" : "beta"}>{rule.abuseRisk}</P9Badge>
              <p className="mt-3 font-bold">{rule.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Surveiller quotas et basculer vers un plan superieur si l'usage depasse la marge cible.
              </p>
            </div>
          ))}
        </div>
      </P9Panel>
    </PixelrisesAppShell>
  );
};

export const BillingSettingsPage = () => <BillingPage />;
