import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import GlobalBg from "@/components/ui/global-bg";
import SEOHead from "@/components/SEOHead";
import { PixelrisesNavbar } from "@/components/PixelrisesNavbar";
import { useTranslation } from "@/i18n/useTranslation";
import { supabase } from "@/integrations/supabase/client";

const ProjectCarousel = lazy(() => import("@/components/ProjectCarousel"));
const DemoShowcase = lazy(() => import("@/components/DemoShowcase"));

type RealisationsSection = "portfolio" | "demos" | "prototypes";

const sectionConfig: Record<
  RealisationsSection,
  {
    label: string;
    href: string;
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  portfolio: {
    label: "Portfolio",
    href: "/realisations/portfolio",
    eyebrow: "Réalisations préparées",
    title: "Portfolio Pixelrises",
    description: "Les vrais exemples déjà préparés dans Pixelrises, sans remplacer le portfolio par des cartes génériques.",
  },
  demos: {
    label: "Démos",
    href: "/realisations/demos",
    eyebrow: "Démo visible",
    title: "Démos Pixelrises",
    description: "Un aperçu immersif de ce que Pixelrises peut produire ou présenter.",
  },
  prototypes: {
    label: "Prototypes",
    href: "/realisations/prototypes",
    eyebrow: "Sites et applications",
    title: "Prototypes web générables",
    description: "Sites, dashboards, outils internes et interfaces testables avant publication.",
  },
};

const isRealisationsSection = (value?: string): value is RealisationsSection =>
  Boolean(value && Object.prototype.hasOwnProperty.call(sectionConfig, value));

const SectionLoader = () => (
  <div className="mx-auto my-12 max-w-5xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center text-sm font-bold text-white/58">
    Chargement de la section Réalisations...
  </div>
);

const RealisationsHero = ({
  isSectionPage,
  section,
}: {
  isSectionPage: boolean;
  section?: RealisationsSection;
}) => {
  const content = section ? sectionConfig[section] : undefined;

  return (
    <section className="relative overflow-hidden pb-12 pt-24 lg:pt-32">
      <div className="container relative z-10 mx-auto px-5">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {content?.eyebrow ?? "Réalisations Pixelrises"}
          </div>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-7xl">
            {content?.title ?? "Voir ce que Pixelrises peut créer, sans tout mélanger."}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/62 sm:text-lg">
            {content?.description ??
              "Portfolio, démos et prototypes ont chacun leur route dédiée pour rester lisibles et honnêtes."}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-2xl px-7 font-black text-black">
              <Link to="/realisations/portfolio">
                Voir le portfolio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-2xl border-primary/25 bg-black/20 px-7 font-black text-white hover:bg-primary/10"
            >
              <Link to={isSectionPage ? "/realisations" : "/dashboard-demo"}>
                {isSectionPage ? "Voir toutes les réalisations" : "Tester Pixelrises AI"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const SectionIntro = ({ section }: { section: RealisationsSection }) => {
  const content = sectionConfig[section];

  return (
    <div className="container mx-auto px-5">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-4">
        <Link
          to="/realisations"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/58 transition hover:border-primary/30 hover:text-primary"
        >
          Retour réalisations
        </Link>
        <Link
          to="/dashboard-demo"
          className="hidden rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black sm:inline-flex"
        >
          Tester Pixelrises AI
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

const PrototypesSection = () => {
  const prototypes = [
    {
      icon: Sparkles,
      title: "Prototype de site complet",
      description: "Une première version claire avec sections, CTA, SEO de base et preview améliorable.",
    },
    {
      icon: Code2,
      title: "Prototype d'application web",
      description: "Interface SaaS, outil interne, espace client ou mini-dashboard pour tester une idée avant développement lourd.",
    },
    {
      icon: Layers,
      title: "Prototype de dashboard",
      description: "Vue synthèse, cartes de données, navigation et états vides pour valider l'expérience.",
    },
    {
      icon: Eye,
      title: "Preview contrôlée",
      description: "Aperçu visuel avant publication, avec corrections et validation humaine si une action externe est prévue.",
    },
  ];

  return (
    <section className="landing-section" data-realisations-section="prototypes">
      <div className="landing-section-inner">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {prototypes.map((prototype) => {
            const Icon = prototype.icon;

            return (
              <article key={prototype.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black tracking-[-0.03em] text-white">{prototype.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/58">{prototype.description}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="rounded-2xl font-black text-black">
            <Link to="/dashboard-demo">Tester Pixelrises AI</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl border-primary/25 bg-black/20 font-black text-white hover:bg-primary/10">
            <Link to="/builder/site">Créer un prototype</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const FinalRealisationsCta = () => (
  <section className="relative px-5 py-16">
    <div className="mx-auto max-w-5xl rounded-[36px] border border-primary/20 bg-gradient-to-br from-primary/16 via-white/[0.04] to-black/60 p-7 text-center shadow-[0_30px_120px_rgba(250,204,21,0.08)] sm:p-10">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
        Une preuve claire, puis un cadrage sérieux.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
        Les réalisations montrent les possibilités. Le cadrage transforme ensuite l'idée en projet concret, validé et sécurisé.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="rounded-2xl font-black text-black">
          <Link to="/agence/contact">Demander un cadrage</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-2xl border-primary/25 bg-black/20 font-black text-white hover:bg-primary/10">
          <Link to="/pricing">Voir les prix</Link>
        </Button>
      </div>
    </div>
  </section>
);

const renderSection = (section: RealisationsSection) => (
  <>
    <Suspense fallback={<SectionLoader />}>
      {section === "portfolio" && (
        <div data-realisations-section="portfolio">
          <ProjectCarousel />
        </div>
      )}
      {section === "demos" && (
        <div data-realisations-section="demos">
          <DemoShowcase />
        </div>
      )}
      {section === "prototypes" && <PrototypesSection />}
    </Suspense>
  </>
);

const Realisations = () => {
  const { section: sectionSlug } = useParams();
  const { locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const section = isRealisationsSection(sectionSlug) ? sectionSlug : undefined;
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
    const title = section ? `${sectionConfig[section].title} | Pixelrises Réalisations` : "Réalisations Pixelrises";
    const description = section
      ? sectionConfig[section].description
      : "Explorez le portfolio, les démos et les prototypes Pixelrises.";

    return { title, description };
  }, [section]);

  if (sectionSlug && !section) {
    return <Navigate to="/realisations" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <GlobalBg />
      <div className="relative z-10">
        <SEOHead
          title={seo.title}
          description={seo.description}
          path={section ? `/realisations/${section}` : "/realisations"}
          keywords={["réalisations Pixelrises", "portfolio Pixelrises", "démos Pixelrises", "prototypes web"]}
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

        {!isSectionPage && <RealisationsHero isSectionPage={isSectionPage} section={section} />}

        {section ? (
          renderSection(section)
        ) : (
          <>
            <Suspense fallback={<SectionLoader />}>
              <div data-realisations-section="portfolio">
                <ProjectCarousel />
              </div>
              <div data-realisations-section="demos">
                <DemoShowcase />
              </div>
              <PrototypesSection />
            </Suspense>
            <FinalRealisationsCta />
          </>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default Realisations;
