import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  FolderKanban,
  Gamepad2,
  Globe2,
  LineChart,
  LogOut,
  Pencil,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SiteManager, { type ManagedSite } from "@/components/SiteManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { toast } from "@/hooks/use-toast";
import { buildAuthRoute, getCurrentRelativeUrl } from "@/lib/auth-redirect";
import { tryBootstrapAdmin } from "@/lib/admin-bootstrap";
import { setPaymentReturnIntent, type PaymentReturnIntent } from "@/lib/payment-return-intent";
import { resolvePublishedSiteUrl } from "@/lib/published-site";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import {
  businessScoreDimensions,
  dashboardAutomations,
  dashboardRecommendations,
  integrationsCatalog,
  officialAgents,
  type BusinessScoreDimension,
} from "@/v2/mock-data";
import { trackV2Event } from "@/v2/analytics";
import { creationCards } from "@/modules/registries";
import { projectStorageAdapter } from "@/modules/storage/project-storage-adapter";
import type { StoredProject } from "@/modules/storage/v2-storage";

type GeneratedSite = {
  id: string;
  business_name: string;
  business_type: string | null;
  city: string | null;
  custom_domain: string | null;
  domain_status: string;
  slug: string | null;
  status: string;
  created_at: string;
  version: number;
};

type BillingFocus = "packs" | "subscriptions";

type BillingOffer = {
  name: string;
  priceLabel: string;
  creditsLabel: string;
  description: string;
  priceId: string;
  mode: "payment" | "subscription";
  recommended?: boolean;
};

const DASHBOARD_REQUEST_TIMEOUT_MS = 6500;

const creditPacks: BillingOffer[] = [
  {
    name: "Pack Starter",
    priceLabel: "13 €/paiement",
    creditsLabel: "10 crédits",
    description: "Tester, générer et améliorer une première présence.",
    priceId: "price_1TOQD8Ro0fDYDUP3kzJA5CrL",
    mode: "payment",
  },
  {
    name: "Pack Pro",
    priceLabel: "25 €/paiement",
    creditsLabel: "25 crédits",
    description: "Créer plusieurs variations et optimiser sans friction.",
    priceId: "price_1TOQEIRo0fDYDUP3gOijNdUZ",
    mode: "payment",
    recommended: true,
  },
  {
    name: "Pack Business",
    priceLabel: "49 €/paiement",
    creditsLabel: "60 crédits",
    description: "Volume confortable pour production régulière.",
    priceId: "price_1TOQEwRo0fDYDUP3BrzOoPEM",
    mode: "payment",
  },
];

const subscriptionOffers: BillingOffer[] = [
  {
    name: "Starter",
    priceLabel: "13 €/mois",
    creditsLabel: "10 crédits / mois",
    description: "Pour lancer proprement un premier rythme.",
    priceId: "price_1TLA8ARo0fDYDUP3fbZmq3nR",
    mode: "subscription",
  },
  {
    name: "Pro",
    priceLabel: "25 €/mois",
    creditsLabel: "25 crédits / mois",
    description: "Le meilleur équilibre pour produire régulièrement.",
    priceId: "price_1TLADZRo0fDYDUP3dk4Rpcfq",
    mode: "subscription",
    recommended: true,
  },
  {
    name: "Business",
    priceLabel: "49 €/mois",
    creditsLabel: "60 crédits / mois",
    description: "Pour agences, studios et volumes plus soutenus.",
    priceId: "price_1TLAEwRo0fDYDUP3zmetuEq5",
    mode: "subscription",
  },
];

const demoSites: GeneratedSite[] = [
  {
    id: "demo-restaurant",
    business_name: "Maison Riviera",
    business_type: "Restaurant",
    city: "Nice",
    custom_domain: null,
    domain_status: "none",
    slug: "maison-riviera",
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    version: 2,
  },
  {
    id: "demo-coach",
    business_name: "Pulse Coaching",
    business_type: "Coach sportif",
    city: "Lyon",
    custom_domain: null,
    domain_status: "none",
    slug: null,
    status: "generated",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 38).toISOString(),
    version: 1,
  },
];

const withDashboardTimeout = async <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), DASHBOARD_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 3600000));
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  return `Il y a ${Math.round(diffHours / 24)} j`;
};

const getStatusLabel = (status: string) => {
  if (status === "published") return "Publié";
  if (status === "generated") return "À finaliser";
  if (status === "draft") return "Brouillon";
  return "En cours";
};

const getV2ProjectHref = (project: StoredProject) => {
  if (project.type === "agent") return "/builder/agent";
  if (project.type === "game") return "/builder/game";
  return "/builder/site";
};

const getV2ProjectTypeLabel = (project: StoredProject) => {
  if (project.type === "agent") return "Agent IA";
  if (project.type === "game") return "Jeu bêta";
  return "Site V2";
};

const getAutomationToneClass = (tone: "ready" | "development" | "blocked") => {
  if (tone === "ready") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (tone === "development") return "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]";
  return "border-white/[0.10] bg-white/[0.04] text-white/58";
};

const getDisplayName = (user: SupabaseUser | null, demoMode: boolean) => {
  if (demoMode) return "Fondateur Pixelrises";
  const metadata = user?.user_metadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
    user?.email?.split("@")[0],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim().replace(/[._-]+/g, " ");
    }
  }

  return "Client Pixelrises";
};

const creationStatusLabel = {
  available: "Disponible",
  beta: "Bêta",
  development: "En développement",
  soon: "Bientôt",
  requested: "Demandé",
  connected: "Connecté",
  configure: "À configurer",
};

const launchPathSteps = [
  {
    title: "Créer",
    description: "Transformer une idée en site, agent IA ou blueprint de jeu.",
    helper: "Point d'entrée",
    href: "/create",
    icon: Sparkles,
  },
  {
    title: "Améliorer",
    description: "Prioriser CTA, SEO, design, offre et structure avec les agents.",
    helper: "Qualité & conversion",
    href: "/agents",
    icon: Target,
  },
  {
    title: "Connecter",
    description: "Brancher analytics, domaine, webhooks et outils business quand ils sont prêts.",
    helper: "Écosystème",
    href: "/integrations",
    icon: Zap,
  },
  {
    title: "Analyser",
    description: "Lire les signaux, comprendre ce qui manque et décider la prochaine action.",
    helper: "Pilotage",
    href: "/analytics",
    icon: BarChart3,
  },
];

const calculateScore = (dimensions: BusinessScoreDimension[], sites: GeneratedSite[]) => {
  const average =
    dimensions.reduce((total, dimension) => total + dimension.score, 0) / dimensions.length;
  const hasPublished = sites.some((site) => site.status === "published");
  const hasDomain = sites.some((site) => site.custom_domain && site.domain_status === "connected");
  const siteBonus = Math.min(8, sites.length * 2) + (hasPublished ? 4 : 0) + (hasDomain ? 4 : 0);
  return Math.min(100, Math.round(average + siteBonus));
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(isSupabaseConfigured ? 0 : 12);
  const [totalUsed, setTotalUsed] = useState(isSupabaseConfigured ? 0 : 18);
  const [sites, setSites] = useState<GeneratedSite[]>(isSupabaseConfigured ? [] : demoSites);
  const [v2Projects, setV2Projects] = useState<StoredProject[]>([]);
  const [siteViewCount, setSiteViewCount] = useState(isSupabaseConfigured ? 0 : 1248);
  const [checkoutLoadingPriceId, setCheckoutLoadingPriceId] = useState<string | null>(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingFocus, setBillingFocus] = useState<BillingFocus>("packs");
  const [checkoutReturnIntent, setCheckoutReturnIntent] =
    useState<Omit<PaymentReturnIntent, "createdAt"> | null>(null);

  const demoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      void projectStorageAdapter.listProjects().then((result) => setV2Projects(result.data));
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async (currentUser: SupabaseUser | null) => {
      if (!mounted) return;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [creditsResult, rolesResult, sitesResult, bootstrapAdminResult] = await Promise.all([
          withDashboardTimeout(
            supabase
              .from("user_credits")
              .select("credits, total_used")
              .eq("user_id", currentUser.id)
              .maybeSingle(),
            { data: null, error: null },
          ),
          withDashboardTimeout(
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", currentUser.id)
              .eq("role", "admin")
              .maybeSingle(),
            { data: null, error: null },
          ),
          withDashboardTimeout(
            supabase
              .from("generated_sites")
              .select(
                "id, business_name, business_type, city, custom_domain, domain_status, slug, status, created_at, version",
              )
              .eq("user_id", currentUser.id)
              .order("created_at", { ascending: false }),
            { data: [], error: null },
          ),
          withDashboardTimeout(tryBootstrapAdmin(), false),
        ]);

        if (!mounted) return;

        const nextSites = (sitesResult.data as GeneratedSite[] | null) || [];
        const v2ProjectsResult = await projectStorageAdapter.listProjects();
        setCredits(creditsResult.data?.credits ?? 0);
        setTotalUsed(creditsResult.data?.total_used ?? 0);
        setIsAdmin(Boolean(rolesResult.data) || Boolean(bootstrapAdminResult));
        setSites(nextSites);
        setV2Projects(v2ProjectsResult.data);

        if (nextSites.length > 0) {
          const viewsResult = await withDashboardTimeout(
            supabase
              .from("site_page_views")
              .select("generated_site_id")
              .in(
                "generated_site_id",
                nextSites.map((site) => site.id),
              ),
            { data: [], error: null },
          );

          if (mounted) setSiteViewCount(viewsResult.data?.length ?? 0);
        } else {
          setSiteViewCount(0);
        }
      } catch (error) {
        console.error("Dashboard V2 loading failed", error);
        toast({
          title: "Chargement incomplet",
          description: "Le cockpit reste accessible avec les données disponibles.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    withDashboardTimeout(supabase.auth.getSession(), { data: { session: null }, error: null }).then(
      ({ data }) => {
        void load(data.session?.user ?? null);
      },
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!loading && !user) {
      navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
    }
  }, [loading, navigate, user]);

  const publishedCount = useMemo(
    () => sites.filter((site) => site.status === "published").length,
    [sites],
  );
  const generatedCount = useMemo(
    () => sites.filter((site) => site.status === "generated").length,
    [sites],
  );
  const leads = Math.max(0, Math.round(siteViewCount * 0.042));
  const ctaClicks = Math.max(0, Math.round(siteViewCount * 0.11));
  const conversionRate = siteViewCount > 0 ? Math.round((leads / siteViewCount) * 1000) / 10 : 0;
  const v2AverageScore =
    v2Projects.length > 0
      ? Math.round(v2Projects.reduce((total, project) => total + project.score, 0) / v2Projects.length)
      : 0;
  const businessScore = v2Projects.length
    ? Math.round((calculateScore(businessScoreDimensions, sites) + v2AverageScore) / 2)
    : calculateScore(businessScoreDimensions, sites);
  const displayName = getDisplayName(user, demoMode);
  const firstName = displayName.split(" ")[0] || "Client";
  const totalProjects = sites.length + v2Projects.length;
  const v2SiteCount = v2Projects.filter((project) => project.type === "site").length;
  const v2AgentCount = v2Projects.filter((project) => project.type === "agent").length;
  const v2GameCount = v2Projects.filter((project) => project.type === "game").length;

  const selectedManagedSite = useMemo<ManagedSite | null>(() => {
    if (demoMode) return null;
    const managerSiteId = searchParams.get("manage");
    if (!managerSiteId) return null;
    return (sites.find((site) => site.id === managerSiteId) as ManagedSite | undefined) ?? null;
  }, [demoMode, searchParams, sites]);

  const selectedManagerTab = useMemo<"details" | "edit" | "improve" | "publish" | "domain">(() => {
    const managerTabParam = searchParams.get("managerTab");
    switch (managerTabParam) {
      case "edit":
      case "improve":
      case "publish":
      case "domain":
        return managerTabParam;
      default:
        return "details";
    }
  }, [searchParams]);

  const stats = [
    {
      label: "Projets créés",
      value: String(totalProjects),
      helper: v2Projects.length ? `${v2Projects.length} projets V2` : generatedCount ? `${generatedCount} à finaliser` : "Base de travail",
      icon: FolderKanban,
    },
    {
      label: "Sites publiés",
      value: String(publishedCount + v2SiteCount),
      helper: publishedCount ? "En ligne" : v2SiteCount ? "Sites V2 préparés" : "Prochaine étape",
      icon: Globe2,
    },
    {
      label: "Visites",
      value: String(siteViewCount),
      helper: "+18% simulé 30 jours",
      icon: Eye,
    },
    {
      label: "Leads",
      value: String(leads),
      helper: `${conversionRate}% conversion`,
      icon: TrendingUp,
    },
    {
      label: "Agents IA",
      value: String(v2AgentCount),
      helper: v2AgentCount ? "Créés dans Agent Studio" : "Officiels et personnalisables",
      icon: Bot,
    },
    {
      label: "Jeux bêta",
      value: String(v2GameCount),
      helper: v2GameCount ? "Blueprints sauvegardés" : "Roblox, Minecraft, UEFN, Web",
      icon: Gamepad2,
    },
  ];

  const nextActions = [
    {
      title: totalProjects ? "Améliorer le CTA principal" : "Créer votre premier site",
      description: totalProjects
        ? "Un CTA plus précis peut augmenter les demandes qualifiées."
        : "Le générateur V2 analyse votre idée avant de produire le site.",
      href: totalProjects ? "/agents" : "/builder/site",
      label: totalProjects ? "Ouvrir Agent Conversion" : "Créer maintenant",
      icon: Target,
      priority: "Priorité haute",
    },
    {
      title: publishedCount ? "Connecter un domaine" : "Publier le site",
      description: publishedCount
        ? "Un domaine professionnel renforce la confiance et la mémorisation."
        : "Passez de preview à lien public pour commencer à mesurer.",
      href: sites[0] && !demoMode ? `/dashboard?manage=${sites[0].id}&managerTab=publish` : "/builder/site",
      label: publishedCount ? "Préparer DNS" : "Préparer publication",
      icon: Rocket,
      priority: "Action business",
    },
    {
      title: "Activer les analytics",
      description: "Suivre page_view, cta_click, lead_created et publish_site.",
      href: "/integrations",
      label: "Voir Integration Hub",
      icon: BarChart3,
      priority: "Mesure",
    },
  ];

  const keyIntegrations = integrationsCatalog.filter((item) =>
    ["stripe", "analytics", "whatsapp", "sheets", "shopify", "webhooks"].includes(item.id),
  );

  const activeAgents = officialAgents.filter((agent) =>
    ["builder", "seo", "conversion", "business"].includes(agent.id),
  );

  const openBillingModal = (
    focus: BillingFocus = "packs",
    returnIntent?: Omit<PaymentReturnIntent, "createdAt">,
  ) => {
    setBillingFocus(focus);
    setCheckoutReturnIntent(returnIntent ?? null);
    setBillingModalOpen(true);
  };

  const startCheckout = useCallback(
    async (priceId: string, mode: "payment" | "subscription") => {
      if (!isSupabaseConfigured) {
        toast({
          title: "Backend V2 non connecté",
          description: "Le checkout est prêt côté UI. Ajoutez les variables V2 pour activer Stripe.",
        });
        return;
      }

      try {
        setCheckoutLoadingPriceId(priceId);
        trackV2Event("checkout_start", { priceId, mode });
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { priceId, mode },
        });

        if (error) throw error;
        const checkoutUrl = typeof data?.url === "string" ? data.url : null;
        if (!checkoutUrl) throw new Error("URL Stripe manquante.");

        if (checkoutReturnIntent) setPaymentReturnIntent(checkoutReturnIntent);
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error("Checkout failed", error);
        toast({
          title: "Paiement indisponible",
          description: "Impossible d'ouvrir Stripe pour le moment.",
          variant: "destructive",
        });
      } finally {
        setCheckoutLoadingPriceId(null);
      }
    },
    [checkoutReturnIntent],
  );

  const closeManager = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("manage");
    nextParams.delete("managerTab");
    setSearchParams(nextParams, { replace: true });
  };

  const updateManagedSite = (updatedSite: Partial<ManagedSite> & { id: string }) => {
    setSites((current) =>
      current.map((site) => (site.id === updatedSite.id ? { ...site, ...updatedSite } : site)),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="rounded-[30px] border border-[#F5C542]/15 bg-white/[0.04] p-7 text-center">
          <Sparkles className="mx-auto h-8 w-8 animate-pulse text-[#F5C542]" />
          <p className="mt-4 text-sm text-white/58">Chargement du cockpit Pixelrises V2...</p>
        </div>
      </div>
    );
  }

  return (
    <V2PageShell
      title={`Votre cockpit business, ${firstName}`}
      description="Suivez l'état de votre présence en ligne, voyez ce qui manque, puis lancez la prochaine action utile : créer, améliorer, publier, connecter ou analyser."
      action={
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <Button
              asChild
              variant="outline"
              className="rounded-2xl border-[#F5C542]/30 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/15"
            >
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
            <Link to="/templates">Templates</Link>
          </Button>
          <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to="/create">
              <Plus className="h-4 w-4" />
              Créer
            </Link>
          </Button>
        </div>
      }
    >
      <SEOHead
        title="Dashboard V2 | Pixelrises"
        description="Cockpit Pixelrises V2 pour piloter projets, score business, recommandations, agents et intégrations."
        noIndex
      />

      {demoMode ? (
        <div className="mb-6 rounded-[24px] border border-[#F5C542]/20 bg-[#F5C542]/[0.07] p-4 text-sm leading-6 text-white/70">
          Mode démo V2 actif : aucun `.env` V1 n'est utilisé. Branchez un backend V2 plus tard pour retrouver auth, projets réels, checkout et analytics live.
        </div>
      ) : null}

      {isAdmin ? (
        <section className="mb-6 overflow-hidden rounded-[32px] border border-[#F5C542]/20 bg-[radial-gradient(circle_at_top_left,rgba(245,197,66,0.16),transparent_34%),rgba(255,255,255,0.035)] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[#F5C542]/25 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                  Espace fondateur
                </Badge>
                <span className="text-xs font-medium text-white/42">V1 + V2 pilotes depuis le meme centre</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">Centre admin Pixelrises</h2>
              <p className="mt-2 text-sm leading-7 text-white/58">
                Gere les credits, utilisateurs, paiements, sites et Product Lab depuis un seul endroit. Les Product Lab V1
                et V2 restent separes cote dossiers, tables et workflows, mais leurs validations arrivent ici pour
                accepter, modifier ou refuser les ameliorations.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[430px]">
              <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                <Link to="/admin">
                  <ShieldCheck className="h-4 w-4" />
                  Ouvrir l'admin
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/20 text-white/80">
                <Link to="/admin">Product Lab V1/V2</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mb-6 rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Que veux-tu créer aujourd'hui ?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">
              Pixelrises V2 sépare la landing publique du cockpit app : choisis un site, un agent IA ou un jeu bêta sans toucher à la V1.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
            <Link to="/projects">Voir les projets</Link>
          </Button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {creationCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.type}
                to={card.href}
                className="group rounded-[28px] border border-white/[0.08] bg-black/20 p-5 transition hover:-translate-y-1 hover:border-[#F5C542]/25 hover:bg-[#F5C542]/[0.045]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                    {creationStatusLabel[card.status]}
                  </Badge>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{card.description}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#F5C542]">
                  Lancer
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-emerald-200">+ stable</span>
              </div>
              <p className="mt-5 text-sm text-white/46">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-2 text-sm text-white/45">{stat.helper}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-[32px] border border-[#F5C542]/15 bg-[radial-gradient(circle_at_top_left,rgba(245,197,66,0.12),transparent_32%),rgba(255,255,255,0.035)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Chemin Pixelrises</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">De l'idée au projet digital concret</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
              Le dashboard doit toujours répondre à une question simple : quelle action rend le projet plus crédible,
              plus connecté ou plus prêt à lancer ?
            </p>
          </div>
          <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to="/create">
              Continuer la création
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {launchPathSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.title}
                to={step.href}
                className="group rounded-[24px] border border-white/[0.08] bg-black/20 p-4 transition hover:-translate-y-1 hover:border-[#F5C542]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-xs text-white/38">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">
                  {step.helper}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-white/54">{step.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#F5C542]">
                  Ouvrir
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Business Score</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{businessScore}/100</h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-white/58">
                Score basé sur clarté de l'offre, design, crédibilité, SEO, conversion, CTA, contact, preuve sociale et complétude.
              </p>
            </div>
            <div className="rounded-[26px] border border-[#F5C542]/20 bg-[#F5C542]/[0.07] p-4 text-center">
              <LineChart className="mx-auto h-6 w-6 text-[#F5C542]" />
              <p className="mt-2 text-sm font-semibold text-[#F5C542]">Progression globale</p>
              <p className="mt-1 text-xs text-white/48">Objectif : 90+</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {businessScoreDimensions.map((dimension) => (
              <div key={dimension.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{dimension.label}</p>
                  <p className="text-sm text-[#F5C542]">{dimension.score}/100</p>
                </div>
                <Progress value={dimension.score} className="h-2 bg-white/[0.06]" />
                <p className="mt-2 text-xs leading-5 text-white/45">{dimension.helper}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Prochaines actions</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Que faire maintenant ?</h2>
            </div>
            <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
              Décisionnel
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {nextActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group flex gap-4 rounded-[24px] border border-white/[0.08] bg-black/20 p-4 transition hover:border-[#F5C542]/25 hover:bg-[#F5C542]/[0.05]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-[#F5C542]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{action.title}</h3>
                      <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-white/45">
                        {action.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-white/52">{action.description}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#F5C542]">
                      {action.label}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Projets récents</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                {v2Projects.length ? "Projets V2 récents" : "Sites créés avec Pixelrises"}
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
              <Link to="/ai">Nouveau projet</Link>
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {v2Projects.length > 0 ? (
              v2Projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold">{project.title}</h3>
                        <Badge className="border-white/[0.10] bg-white/[0.04] text-white/62 hover:bg-white/[0.04]">
                          {getV2ProjectTypeLabel(project)}
                        </Badge>
                        <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                          Score {project.score}/100
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-white/45">
                        {getStatusLabel(project.status)} · {formatRelativeTime(project.updatedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
                        <Link to={getV2ProjectHref(project)}>
                          <Eye className="h-4 w-4" />
                          Ouvrir
                        </Link>
                      </Button>
                      <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                        <Link to={getV2ProjectHref(project)}>
                          Améliorer
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : sites.length > 0 ? (
              sites.slice(0, 5).map((site) => {
                const publicUrl = resolvePublishedSiteUrl({
                  slug: site.slug,
                  customDomain: site.custom_domain,
                  domainStatus: site.domain_status,
                });

                return (
                  <div
                    key={site.id}
                    className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold">{site.business_name}</h3>
                          <Badge className="border-white/[0.10] bg-white/[0.04] text-white/62 hover:bg-white/[0.04]">
                            {getStatusLabel(site.status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-white/45">
                          {[site.business_type, site.city].filter(Boolean).join(" · ") || "Projet business"} ·{" "}
                          {formatRelativeTime(site.created_at)} · v{site.version}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
                          <Link to={demoMode ? "/ai" : `/preview/${site.id}`}>
                            <Eye className="h-4 w-4" />
                            Ouvrir
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
                          <Link to={demoMode ? "/agents" : `/dashboard?manage=${site.id}&managerTab=improve`}>
                            <Pencil className="h-4 w-4" />
                            Améliorer
                          </Link>
                        </Button>
                        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                          {publicUrl ? (
                            <a href={publicUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Public
                            </a>
                          ) : (
                            <Link to={demoMode ? "/integrations" : `/dashboard?manage=${site.id}&managerTab=publish`}>
                              Publier
                            </Link>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/[0.12] bg-black/20 p-8 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-[#F5C542]" />
                <h3 className="mt-4 text-lg font-semibold">Aucun projet pour le moment</h3>
                <p className="mt-2 text-sm text-white/50">Lancez une génération pour créer votre première base business.</p>
                <Button asChild className="mt-5 rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  <Link to="/ai">Créer mon site</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Analytics préparés</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Signaux business</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["Pages vues", siteViewCount],
              ["Clics CTA", ctaClicks],
              ["Leads créés", leads],
              ["Taux conversion", `${conversionRate}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
                <span className="text-sm text-white/55">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-white/42">
            Événements prêts : page_view, cta_click, form_submit, lead_created, checkout_start, publish_site, integration_connected, agent_created, generation_completed.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Automatisations</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Scénarios business préparés</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">
              Les automatisations restent sous contrôle : elles préparent, vérifient et recommandent, mais aucune action sensible n'est exécutée sans validation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Link to="/automations">Ouvrir le hub</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
              <Link to="/integrations">Connecter les outils</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardAutomations.map((automation) => {
            const Icon = automation.icon;
            return (
              <div
                key={automation.id}
                className="rounded-[26px] border border-white/[0.08] bg-black/20 p-4 transition hover:border-[#F5C542]/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className={`${getAutomationToneClass(automation.statusTone)} hover:bg-transparent`}>
                    {automation.statusLabel}
                  </Badge>
                </div>
                <h3 className="mt-4 font-semibold">{automation.name}</h3>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-white/35">Déclencheur</p>
                <p className="mt-1 text-sm leading-6 text-white/58">{automation.trigger}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-white/35">Action</p>
                <p className="mt-1 min-h-[48px] text-sm leading-6 text-white/58">{automation.action}</p>
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-xs text-white/38">Dernière activité</p>
                  <p className="mt-1 text-sm font-medium text-white/80">{automation.lastActivity}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="text-white/42">{automation.nextStep}</span>
                  <span className="text-[#F5C542]">{automation.impact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-xl font-semibold">Agents actifs</h2>
          </div>
          <div className="mt-5 space-y-3">
            {activeAgents.map((agent) => {
              const Icon = agent.icon;
              return (
                <Link
                  key={agent.id}
                  to="/agents"
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-3 transition hover:border-[#F5C542]/25"
                >
                  <Icon className="h-4 w-4 text-[#F5C542]" />
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-white/40">{agent.role}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-xl font-semibold">Intégrations clés</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {keyIntegrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <Link
                  key={integration.id}
                  to="/integrations"
                  className="rounded-2xl border border-white/[0.08] bg-black/20 p-3 transition hover:border-[#F5C542]/25"
                >
                  <Icon className="h-4 w-4 text-[#F5C542]" />
                  <p className="mt-2 text-sm font-medium">{integration.name}</p>
                  <p className="mt-1 text-xs text-white/38">{integration.status}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-xl font-semibold">Monétisation douce</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/55">
            Les upsells restent contextualisés : agent conversion, domaine, analytics, SEO, design premium ou intégration utile.
          </p>
          <Button
            className="mt-5 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
            onClick={() => openBillingModal("packs")}
          >
            <WalletCards className="h-4 w-4" />
            Voir crédits
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Recommandations IA</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Priorisées pour la croissance</h2>
          </div>
          <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
            <Link to="/agents">Ouvrir les agents</Link>
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardRecommendations.map((recommendation) => (
            <Link
              key={recommendation.title}
              to={recommendation.href ?? "/agents"}
              className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 transition hover:-translate-y-1 hover:border-[#F5C542]/25"
            >
              <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                {recommendation.priority}
              </Badge>
              <h3 className="mt-4 font-semibold">{recommendation.title}</h3>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-white/52">{recommendation.description}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#F5C542]">
                {recommendation.action}
                <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {selectedManagedSite ? (
        <SiteManager
          site={selectedManagedSite}
          credits={credits}
          initialTab={selectedManagerTab}
          onClose={closeManager}
          onUpdated={updateManagedSite}
          onCreditsChange={setCredits}
          onOpenCredits={(focus, returnIntent) => openBillingModal(focus ?? "packs", returnIntent)}
        />
      ) : null}

      {billingModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/75 p-2 backdrop-blur-md sm:items-center sm:justify-center sm:p-6"
          onClick={() => setBillingModalOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/[0.10] bg-[#080808] p-5 shadow-[0_40px_120px_-50px_rgba(245,197,66,0.45)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Crédits Pixelrises</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Continuer à créer et améliorer</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">
                  Recharge ponctuelle ou abonnement mensuel. Le checkout réel s'active quand les variables V2 sont configurées.
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-white/[0.10] p-3 text-white/60 transition hover:text-white"
                onClick={() => setBillingModalOpen(false)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 sm:grid-cols-2">
              {(["packs", "subscriptions"] as BillingFocus[]).map((focus) => (
                <button
                  key={focus}
                  type="button"
                  onClick={() => setBillingFocus(focus)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    billingFocus === focus
                      ? "bg-[#F5C542] text-black"
                      : "text-white/58 hover:bg-white/[0.04]"
                  }`}
                >
                  {focus === "packs" ? "Packs de crédits" : "Abonnements"}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(billingFocus === "packs" ? creditPacks : subscriptionOffers).map((offer) => (
                <article
                  key={offer.priceId}
                  className={`rounded-[26px] border p-5 ${
                    offer.recommended
                      ? "border-[#F5C542]/40 bg-[#F5C542]/[0.08]"
                      : "border-white/[0.08] bg-white/[0.03]"
                  }`}
                >
                  {offer.recommended ? (
                    <Badge className="mb-4 border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                      Recommandé
                    </Badge>
                  ) : null}
                  <h3 className="text-lg font-semibold">{offer.name}</h3>
                  <p className="mt-2 text-3xl font-semibold">{offer.priceLabel}</p>
                  <p className="mt-2 text-sm text-[#F5C542]">{offer.creditsLabel}</p>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-white/52">{offer.description}</p>
                  <Button
                    className="mt-5 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
                    disabled={checkoutLoadingPriceId === offer.priceId}
                    onClick={() => void startCheckout(offer.priceId, offer.mode)}
                  >
                    {checkoutLoadingPriceId === offer.priceId ? "Ouverture..." : "Choisir"}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        {isSupabaseConfigured ? (
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-xs text-white/45 transition hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        ) : (
          <span className="text-xs text-white/35">V2 isolée · backend à connecter séparément</span>
        )}
      </div>
    </V2PageShell>
  );
};

export default Dashboard;
