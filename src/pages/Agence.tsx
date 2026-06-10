import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Briefcase, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import GlobalBg from "@/components/ui/global-bg";
import SEOHead from "@/components/SEOHead";
import { PixelrisesNavbar } from "@/components/PixelrisesNavbar";
import { useTranslation } from "@/i18n/useTranslation";
import { supabase } from "@/integrations/supabase/client";

const Benefits = lazy(() => import("@/components/Benefits"));
const RecommendationModule = lazy(() => import("@/components/RecommendationModule"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const BeforeAfter = lazy(() => import("@/components/BeforeAfter"));
const FAQ = lazy(() => import("@/components/FAQ"));

type AgenceSection = "diagnostic" | "benefices" | "process" | "avant-apres" | "faq" | "contact";

const sectionConfig: Record<
  AgenceSection,
  {
    label: string;
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  diagnostic: {
    label: "Diagnostic",
    eyebrow: "Cadrage projet",
    title: "Diagnostic de votre projet",
    description: "Répondez à quelques questions pour cadrer votre besoin et obtenir une direction claire.",
  },
  benefices: {
    label: "Bénéfices",
    eyebrow: "Pourquoi déléguer",
    title: "Les bénéfices de la délégation Pixelrises",
    description: "Une page claire pour comprendre ce que Pixelrises apporte avant de lancer un projet.",
  },
  process: {
    label: "Process",
    eyebrow: "Méthode",
    title: "Un fonctionnement simple, encadré et validé",
    description: "Diagnostic, cadrage, création, corrections et validation humaine avant toute mise en ligne.",
  },
  "avant-apres": {
    label: "Avant / Après",
    eyebrow: "Transformation",
    title: "Avant / Après Pixelrises",
    description: "Visualisez la différence entre une présence web faible et une page pensée pour convertir.",
  },
  faq: {
    label: "FAQ agence",
    eyebrow: "Questions utiles",
    title: "FAQ agence",
    description: "Les réponses importantes sur le diagnostic, la livraison, la validation et l’accompagnement.",
  },
  contact: {
    label: "Contact agence",
    eyebrow: "Demande de cadrage",
    title: "Parlez-nous de votre projet",
    description: "Décrivez votre activité, votre objectif et vos priorités. Pixelrises vous répond avec un cadrage clair.",
  },
};

const sectionOrder = Object.keys(sectionConfig) as AgenceSection[];

const isAgenceSection = (value?: string): value is AgenceSection =>
  Boolean(value && Object.prototype.hasOwnProperty.call(sectionConfig, value));

const SectionLoader = () => (
  <div className="mx-auto my-12 max-w-5xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center text-sm font-bold text-white/58">
    Chargement de la section Agence...
  </div>
);

const AgenceHero = ({ isSectionPage, section }: { isSectionPage: boolean; section?: AgenceSection }) => {
  const content = section ? sectionConfig[section] : undefined;

  return (
    <section className="relative overflow-hidden pb-12 pt-24 lg:pt-32">
      <div className="container relative z-10 mx-auto px-5">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            <Briefcase className="h-3.5 w-3.5" />
            {content?.eyebrow ?? "Agence Pixelrises"}
          </div>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-7xl">
            {content?.title ?? "Déléguer la création de votre site, sans tout mélanger."}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/62 sm:text-lg">
            {content?.description ??
              "Une page complète pour comprendre le parcours agence Pixelrises : bénéfices, diagnostic, process, avant/après, FAQ et cadrage."}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-2xl px-7 font-black text-black">
              <Link to="/agence/diagnostic">
                Démarrer le diagnostic
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-2xl border-primary/25 bg-black/20 px-7 font-black text-white hover:bg-primary/10"
            >
              <Link to={isSectionPage ? "/agence" : "/pricing"}>
                {isSectionPage ? "Voir toute l’agence" : "Voir les offres"}
              </Link>
            </Button>
          </div>

          {!isSectionPage && <AgenceSectionNav />}
        </div>
      </div>
    </section>
  );
};

const AgenceSectionNav = () => (
  <div className="mx-auto mt-9 flex max-w-4xl flex-wrap justify-center gap-2">
    {sectionOrder.map((section) => (
      <Link
        key={section}
        to={`/agence/${section}`}
        className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white/62 transition hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
      >
        {sectionConfig[section].label}
      </Link>
    ))}
    <Link
      to="/pricing"
      className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary transition hover:bg-primary hover:text-black"
    >
      Prix sur /pricing
    </Link>
  </div>
);

const SectionIntro = ({ section }: { section: AgenceSection }) => {
  const content = sectionConfig[section];

  return (
    <div className="container mx-auto px-5">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-4">
        <Link
          to="/agence"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/58 transition hover:border-primary/30 hover:text-primary"
        >
          Retour agence
        </Link>
        <Link
          to="/pricing"
          className="hidden rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black sm:inline-flex"
        >
          Voir les offres
        </Link>
      </div>
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/[0.035] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">{content.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">{content.title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">{content.description}</p>
      </div>
    </div>
  );
};

const ContactSection = () => (
  <section className="landing-section" data-agence-section="contact">
    <div className="landing-section-inner">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[34px] border border-primary/20 bg-primary/10 p-7 shadow-[0_24px_90px_rgba(250,204,21,0.08)] sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
            <MessageCircle className="h-4 w-4" />
            Demande de cadrage
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            Envoyez le contexte, on clarifie la suite.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/64 sm:text-base">
            L’objectif est simple : comprendre votre activité, votre cible, votre budget et vos priorités avant de produire.
            Aucune publication automatique, aucune action externe sans validation humaine.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-2xl font-black text-black">
              <Link to="/support/new">
                Faire une demande
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border-primary/25 bg-black/20 font-black text-white hover:bg-primary/10"
            >
              <a href="https://wa.me/33775256214" target="_blank" rel="noopener noreferrer">
                En parler sur WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            "Brief de votre activité et de votre objectif",
            "Validation humaine avant livraison ou mise en ligne",
            "Statut clair : bêta, à configurer ou prêt selon preuve",
            "Prix centralisés sur la page publique /pricing",
          ].map((item) => (
            <div key={item} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <p className="flex items-start gap-3 text-sm font-bold leading-relaxed text-white/76">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const FinalAgenceCta = () => (
  <section className="relative px-5 py-16">
    <div className="mx-auto max-w-5xl rounded-[36px] border border-primary/20 bg-gradient-to-br from-primary/16 via-white/[0.04] to-black/60 p-7 text-center shadow-[0_30px_120px_rgba(250,204,21,0.08)] sm:p-10">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
        Avancez avec une page claire, pas un tunnel confus.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
        Les raccourcis Agence affichent maintenant une seule section à la fois. Les offres et paiements restent séparés dans Pricing.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="rounded-2xl font-black text-black">
          <Link to="/agence/diagnostic">Lancer mon diagnostic</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-2xl border-primary/25 bg-black/20 font-black text-white hover:bg-primary/10"
        >
          <Link to="/pricing">Comparer les offres</Link>
        </Button>
      </div>
    </div>
  </section>
);

const renderSection = (section: AgenceSection) => (
  <>
    <SectionIntro section={section} />
    <Suspense fallback={<SectionLoader />}>
      {section === "diagnostic" && (
        <div data-agence-section="diagnostic">
          <RecommendationModule />
        </div>
      )}
      {section === "benefices" && (
        <div data-agence-section="benefices">
          <Benefits />
        </div>
      )}
      {section === "process" && (
        <div data-agence-section="process">
          <HowItWorks />
        </div>
      )}
      {section === "avant-apres" && (
        <div data-agence-section="avant-apres">
          <BeforeAfter />
        </div>
      )}
      {section === "faq" && (
        <div data-agence-section="faq">
          <FAQ />
        </div>
      )}
      {section === "contact" && <ContactSection />}
    </Suspense>
  </>
);

const Agence = () => {
  const { section: sectionSlug } = useParams();
  const { locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const section = isAgenceSection(sectionSlug) ? sectionSlug : undefined;
  const isSectionPage = Boolean(section);

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

  const seo = useMemo(() => {
    const title = section ? `${sectionConfig[section].title} | Pixelrises Agence` : "Agence Pixelrises | Délégation site web";
    const description = section
      ? sectionConfig[section].description
      : "Découvrez le parcours agence Pixelrises : bénéfices, diagnostic, process, avant/après, FAQ et demande de cadrage.";

    return { title, description };
  }, [section]);

  if (sectionSlug && !section) {
    return <Navigate to="/agence" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <GlobalBg />
      <div className="relative z-10">
        <SEOHead
          title={seo.title}
          description={seo.description}
          path={section ? `/agence/${section}` : "/agence"}
          keywords={["agence Pixelrises", "délégation site web", "diagnostic site", "site vitrine premium"]}
        />

        <div className="container relative z-20 mx-auto px-5 pt-6">
          <PixelrisesNavbar
            locale={locale}
            isLoggedIn={isLoggedIn}
            onLocaleChange={setLocale}
            onWorkspaceClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
            onSignOut={async () => {
              await supabase.auth.signOut();
              setIsLoggedIn(false);
              navigate("/", { replace: true });
            }}
          />
        </div>

        <AgenceHero isSectionPage={isSectionPage} section={section} />

        {section ? (
          renderSection(section)
        ) : (
          <>
            <Suspense fallback={<SectionLoader />}>
              <div data-agence-section="benefices">
                <Benefits />
              </div>
              <div data-agence-section="diagnostic">
                <RecommendationModule />
              </div>
              <div data-agence-section="process">
                <HowItWorks />
              </div>
              <div data-agence-section="avant-apres">
                <BeforeAfter />
              </div>
              <div data-agence-section="faq">
                <FAQ />
              </div>
            </Suspense>
            <ContactSection />
            <FinalAgenceCta />
          </>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default Agence;
