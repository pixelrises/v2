import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Brain,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  GraduationCap,
  KanbanSquare,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  MousePointerClick,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Footer from "@/components/Footer";
import GlobalBg from "@/components/ui/global-bg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelrisesNavbar } from "@/components/PixelrisesNavbar";
import SEOHead from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { getPublicAISpace } from "@/data/public-ai-spaces";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/useTranslation";

const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  briefcase: Briefcase,
  graduation: GraduationCap,
  palette: Palette,
  kanban: KanbanSquare,
  building: Building2,
};

type ActivePanel = "cases" | "prompts" | "modules";

const panelLabels: Array<{ id: ActivePanel; label: string }> = [
  { id: "cases", label: "Cas d'usage" },
  { id: "prompts", label: "Prompts" },
  { id: "modules", label: "Modules" },
];

const PublicAISpace = () => {
  const { spaceSlug } = useParams();
  const navigate = useNavigate();
  const { locale, setLocale } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>("cases");
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [lockedNotice, setLockedNotice] = useState(false);
  const space = getPublicAISpace(spaceSlug);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  const authTarget = useMemo(() => `/auth?redirect=${encodeURIComponent("/dashboard")}`, []);

  if (!space) {
    return <Navigate to="/espace-ia" replace />;
  }

  const Icon = iconMap[space.icon] ?? Sparkles;
  const handleWorkspaceClick = () => {
    navigate(isLoggedIn ? "/dashboard" : "/auth");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  const handleLockedAction = () => {
    setLockedNotice(true);
    window.setTimeout(() => setLockedNotice(false), 2600);
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      window.setTimeout(() => setCopiedPrompt(null), 1800);
    } catch {
      setCopiedPrompt(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <GlobalBg />
      <div className="relative z-10">
        <SEOHead
          title={`${space.title} | Espace IA Pixelrises`}
          description={space.angle}
          path={`/espace-ia/${space.slug}`}
          keywords={[space.title, "Espace IA Pixelrises", "démo verrouillée", "AI Space"]}
        />

        <section className="relative overflow-hidden px-4 pb-14 pt-24 sm:px-5 lg:pb-20 lg:pt-32">
          <div className="container relative z-10 mx-auto">
            <PixelrisesNavbar
              locale={locale}
              isLoggedIn={isLoggedIn}
              onLocaleChange={setLocale}
              onWorkspaceClick={handleWorkspaceClick}
              onSignOut={handleSignOut}
            />

            <div className="mx-auto max-w-7xl">
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div className="min-w-0">
                  <Badge className="rounded-full border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary hover:bg-primary/10 sm:text-[11px]">
                    <LockKeyhole className="mr-2 h-3.5 w-3.5" />
                    Démo publique verrouillée
                  </Badge>
                  <h1 className="mt-6 max-w-4xl text-[2.45rem] font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    {space.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-xl font-black leading-7 text-primary sm:text-2xl">
                    {space.angle}
                  </p>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/66 sm:text-lg sm:leading-8">
                    {space.subtitle}
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">{space.objective}</p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg" className="h-12 rounded-2xl px-7 text-base font-black sm:h-14">
                      <Link to="/dashboard-demo">
                        Tester en démo
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-12 rounded-2xl border-primary/30 px-7 text-base font-black hover:border-primary/60 hover:bg-primary/5 sm:h-14"
                    >
                      <Link to={authTarget}>
                        Se connecter pour utiliser
                        <LockKeyhole className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-6 grid gap-2 sm:grid-cols-3">
                    {space.reassurance.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/65"
                      >
                        <Sparkles className="mb-2 h-4 w-4 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <LockedPreview Icon={Icon} title={space.title} authTarget={authTarget} items={space.demoPreview} />
              </div>
            </div>
          </div>
        </section>

        <main className="pb-20">
          <section className="px-4 sm:px-5">
            <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-white/[0.03] p-3 shadow-[0_40px_140px_-90px_hsl(var(--primary)/0.9)] sm:rounded-[34px] sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TrustPill icon={ShieldCheck} title="Actions protégées" text="Connexion obligatoire pour agir." />
                <TrustPill icon={KeyRound} title="Lecture seule" text="Aucune donnée privée ouverte." />
                <TrustPill icon={ListChecks} title="Mode Plan" text="On prépare avant d'exécuter." />
                <TrustPill icon={CheckCircle2} title="Crédits sécurisés" text="Aucun débit depuis cette page." />
              </div>
            </div>
          </section>

          <SectionBlock
            eyebrow="Ce que cet espace vous aide à faire"
            title={`${space.title} donne une sortie claire, pas du blabla IA.`}
            description="La page publique vous montre la logique. Les vrais usages restent protégés derrière la connexion."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {space.benefits.map((benefit) => (
                <InfoCard key={benefit.title} icon={CheckCircle2} title={benefit.title} description={benefit.description} />
              ))}
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="Explorer sans débloquer l'outil"
            title="Cas d'usage, prompts et modules au même endroit."
            description="Les onglets sont interactifs côté frontend, mais ils ne lancent aucune génération réelle."
          >
            <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b]/82 p-3 sm:p-4 md:p-5">
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1 sm:inline-grid sm:grid-cols-3">
                {panelLabels.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActivePanel(panel.id)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-black transition",
                      activePanel === panel.id
                        ? "bg-primary text-black shadow-[0_14px_40px_-24px_hsl(var(--primary))]"
                        : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {activePanel === "cases" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {space.useCases.map((useCase) => (
                      <article
                        key={useCase.title}
                        className="group min-h-[170px] rounded-[24px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/[0.07]"
                      >
                        <MousePointerClick className="h-5 w-5 text-primary" />
                        <h3 className="mt-5 text-base font-black text-white">{useCase.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/55">{useCase.description}</p>
                      </article>
                    ))}
                  </div>
                ) : null}

                {activePanel === "prompts" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {space.prompts.map((prompt) => {
                      const copied = copiedPrompt === prompt.prompt;
                      return (
                        <article key={prompt.prompt} className="rounded-[24px] border border-primary/15 bg-primary/[0.055] p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{prompt.label}</p>
                              <p className="mt-3 text-base font-black leading-7 text-white">“{prompt.prompt}”</p>
                              <p className="mt-3 text-sm leading-6 text-white/55">{prompt.outcome}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyPrompt(prompt.prompt)}
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/40 text-primary transition hover:border-primary/35 hover:bg-primary/10"
                              aria-label="Copier cet exemple de prompt"
                            >
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}

                {activePanel === "modules" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {space.modules.map((moduleName) => (
                      <article key={moduleName.title} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-base font-black text-white">{moduleName.title}</h3>
                          <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                            Verrouillé
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/55">{moduleName.description}</p>
                        <button
                          type="button"
                          onClick={handleLockedAction}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-white/70 transition hover:border-primary/30 hover:text-primary"
                        >
                          Utiliser le module
                          <LockKeyhole className="h-4 w-4" />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>

              {lockedNotice ? (
                <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm font-black text-primary">
                  Connectez-vous pour utiliser cette fonctionnalité.
                </div>
              ) : null}
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="Aperçu démo verrouillé"
            title="Vous voyez l'expérience, sans ouvrir l'outil public."
            description="Cet aperçu est public. Connectez-vous pour utiliser l'espace, sauvegarder vos projets et lancer des générations."
          >
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
              <div className="rounded-[30px] border border-white/10 bg-[#080808]/90 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{space.title}</p>
                      <p className="text-xs font-semibold text-white/45">Fenêtre connectée simulée</p>
                    </div>
                  </div>
                  <Badge className="border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.04]">
                    Lecture seule
                  </Badge>
                </div>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-sm text-white/45">
                    Champ prompt désactivé : connectez-vous pour envoyer une demande.
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {space.demoPreview.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">{item.label}</p>
                        <p className="mt-3 text-sm font-black leading-6 text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-[30px] border border-primary/20 bg-primary/[0.08] p-5 sm:p-6">
                <div>
                  <ShieldCheck className="h-9 w-9 text-primary" />
                  <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">Connexion requise</h3>
                  <p className="mt-4 text-sm leading-7 text-white/62">
                    Aucun input public, aucune génération, aucun export, aucune sauvegarde et aucun débit crédit ne sont lancés depuis cette page.
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <Button asChild className="rounded-2xl font-black">
                    <Link to={authTarget}>
                      Se connecter pour utiliser
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-2xl border-primary/25 font-black">
                    <Link to="/dashboard-demo">Voir le dashboard démo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="Comment l'utiliser"
            title="Un workflow simple : cadrer, préparer, valider."
            description="Pixelrises garde une logique propre : on prépare avant d'agir, puis l'utilisateur valide."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {space.workflow.map((item) => (
                <article key={item.step} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-sm font-black text-black">
                    {item.step}
                  </span>
                  <h3 className="mt-5 text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="Objections"
            title="Ce qui reste volontairement verrouillé."
            description="Les pages publiques doivent convaincre sans faire croire que les outils réels sont ouverts."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {space.objections.map((item) => (
                <InfoCard key={item.title} icon={Workflow} title={item.title} description={item.description} />
              ))}
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="Accès"
            title="Tester la vision, puis se connecter pour utiliser."
            description="Les CTA internes restent sûrs : démo visuelle, authentification, tarifs publics et retour à la landing Espace IA."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SafeLinkCard title="Tester en démo" description="Voir le dashboard démo en lecture seule." to="/dashboard-demo" icon={LayoutDashboard} />
              <SafeLinkCard title="Se connecter pour utiliser" description="Accéder aux vrais outils après auth." to={authTarget} icon={KeyRound} />
              <SafeLinkCard title="Voir les tarifs" description="Comparer les offres publiques." to="/pricing" icon={Rocket} />
              <SafeLinkCard title="Retour Espace IA" description="Découvrir la plateforme IA complète." to="/espace-ia" icon={Sparkles} />
            </div>
          </SectionBlock>

          <SectionBlock
            eyebrow="Mini FAQ"
            title="Réponses rapides avant de tester."
            description="Aucune action externe, aucun crédit et aucun accès privé ne sont ouverts depuis cette page."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {space.faq.map((item) => (
                <details key={item.question} className="group rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-white">
                    {item.question}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/20 text-primary transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-white/58">{item.answer}</p>
                </details>
              ))}
            </div>
          </SectionBlock>

        </main>

        <Footer />
      </div>
    </div>
  );
};

const LockedPreview = ({
  Icon,
  title,
  authTarget,
  items,
}: {
  Icon: LucideIcon;
  title: string;
  authTarget: string;
  items: Array<{ label: string; value: string }>;
}) => (
  <div className="relative min-w-0">
    <div className="absolute -inset-8 rounded-[44px] bg-primary/15 blur-[80px]" />
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#090909]/90 p-4 shadow-[0_45px_160px_-80px_hsl(var(--primary)/0.85)] sm:rounded-[38px] sm:p-6">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl border border-primary/25 bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white">{title}</p>
            <p className="text-xs font-semibold text-white/45">Aperçu public verrouillé</p>
          </div>
        </div>
        <Badge className="border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.04]">Lecture seule</Badge>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/35 p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white/58">
          <Sparkles className="h-4 w-4 text-primary" />
          Connectez-vous pour utiliser cette fonctionnalité.
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{item.label}</p>
              <p className="mt-3 text-sm font-black leading-6 text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button asChild className="rounded-2xl font-black">
          <Link to="/dashboard-demo">
            Tester en démo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-2xl border-primary/25 font-black">
          <Link to={authTarget}>Se connecter pour utiliser</Link>
        </Button>
      </div>
    </div>
  </div>
);

const SectionBlock = ({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="landing-section px-4 sm:px-5">
    <div className="landing-section-inner">
      <div className="landing-section-header">
        <span className="landing-eyebrow">
          <Sparkles className="h-3 w-3" />
          {eyebrow}
        </span>
        <h2 className="landing-title">{title}</h2>
        <p className="landing-copy max-w-2xl">{description}</p>
      </div>
      {children}
    </div>
  </section>
);

const TrustPill = ({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/50">{text}</p>
    </div>
  </div>
);

const InfoCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) => (
  <article className="h-full rounded-[26px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/[0.065]">
    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </span>
    <h3 className="mt-5 text-base font-black text-white">{title}</h3>
    <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
  </article>
);

const SafeLinkCard = ({
  title,
  description,
  to,
  icon: Icon,
}: {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
}) => (
  <Link
    to={to}
    className="group flex h-full min-h-[150px] flex-col rounded-[26px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/10"
  >
    <Icon className="h-6 w-6 text-primary" />
    <h3 className="mt-5 text-base font-black text-white">{title}</h3>
    <p className="mt-2 flex-1 text-sm leading-6 text-white/55">{description}</p>
    <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">
      Ouvrir
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
    </span>
  </Link>
);

export default PublicAISpace;
