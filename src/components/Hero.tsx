import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  CheckCircle2,
  CreditCard,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HomeModeSwitch, { type LandingMode } from "@/components/HomeModeSwitch";
import { PixelrisesNavbar } from "@/components/PixelrisesNavbar";
import { useTranslation } from "@/i18n/useTranslation";
import { supabase } from "@/integrations/supabase/client";

interface HeroSlide {
  title: string;
  subtitle: string;
}

interface HeroProps {
  mode: LandingMode;
  onModeChange: (mode: LandingMode) => void;
}

const HERO_ROTATION_MS = 5000;

const delegationHeroSlides: HeroSlide[] = [
  {
    title: "Un site qui donne confiance en trois secondes.",
    subtitle:
      "Montrez une image professionnelle dès la première impression, avec une page claire, crédible et pensée pour rassurer vos visiteurs.",
  },
  {
    title: "Un site qui transforme vos visiteurs en clients.",
    subtitle:
      "Chaque section guide vos visiteurs vers l'action : comprendre votre offre, vous faire confiance et vous contacter.",
  },
  {
    title: "Un site pensé pour vendre, pas juste exister.",
    subtitle: "Une présence web conçue pour attirer, convaincre et convertir les bons clients.",
  },
];

const aiHeroSlides: HeroSlide[] = [
  {
    title: "Votre cockpit IA pour créer, organiser et développer sans limites.",
    subtitle:
      "Accédez à 6 espaces IA spécialisés, des builders puissants, des agents contrôlés et des outils pour transformer vos idées en projets concrets.",
  },
  {
    title: "Une équipe IA contrôlée pour avancer sans perdre le fil.",
    subtitle:
      "Chaque espace a un rôle clair : business, études, création, management, entreprise ou IA générale.",
  },
  {
    title: "Des builders, agents et espaces IA reliés dans un seul OS.",
    subtitle:
      "Demandez, prévisualisez, organisez et améliorez sans activer d'action sensible sans validation.",
  },
];

const delegationHeroSlidesEn: HeroSlide[] = [
  {
    title: "A website that builds trust in three seconds.",
    subtitle:
      "Show a professional image from the first impression with a clear, credible page designed to reassure visitors.",
  },
  {
    title: "A website that turns visitors into clients.",
    subtitle:
      "Every section guides visitors toward action: understanding your offer, trusting you and contacting you.",
  },
  {
    title: "A website built to sell, not just exist.",
    subtitle: "A web presence designed to attract, convince and convert the right clients.",
  },
];

const aiHeroSlidesEn: HeroSlide[] = [
  {
    title: "Your AI cockpit to create, organize and grow without limits.",
    subtitle:
      "Access 6 specialized AI spaces, powerful builders, controlled agents and tools to turn ideas into concrete projects.",
  },
  {
    title: "A controlled AI team to move forward without losing the thread.",
    subtitle:
      "Each space has a clear role: business, student, creator, management, enterprise or general AI.",
  },
  {
    title: "Builders, agents and AI spaces connected in one OS.",
    subtitle:
      "Ask, preview, organize and improve without triggering sensitive actions without validation.",
  },
];

const aiQuickAccess = [
  { label: "General AI", icon: Brain },
  { label: "Business AI", icon: Briefcase },
  { label: "Student AI", icon: GraduationCap },
  { label: "Creator AI", icon: Sparkles },
  { label: "Site Builder", icon: Wand2 },
  { label: "Agent Builder", icon: Bot },
  { label: "Management AI", icon: FolderKanban },
  { label: "Enterprise AI", icon: LayoutDashboard },
];

const aiRecentActivity = [
  "Génération image",
  "Analyse de document",
  "Résumé de réunion",
  "Agent SEO",
  "Création de site",
];

const PixelrisesRetroGrid = () => {
  const gridStyles = {
    backgroundImage:
      "linear-gradient(to right, rgba(245, 197, 66, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 197, 66, 0.12) 1px, transparent 1px)",
    backgroundSize: "72px 72px",
    transform: "rotateX(64deg)",
    transformOrigin: "50% 0%",
  } as CSSProperties;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden [perspective:260px]">
      <div className="absolute inset-x-[-120%] top-[-34%] h-[210%] opacity-35" style={gridStyles} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_42%_at_50%_6%,hsl(var(--primary)/0.22),transparent_68%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/62 to-background" />
    </div>
  );
};

const GradientTitlePart = ({ children }: { children: ReactNode }) => (
  <span className="bg-gradient-to-r from-primary via-white to-[hsl(var(--primary-light))] bg-clip-text text-transparent">
    {children}
  </span>
);

const renderAIHeroTitle = (slide: number, isFr: boolean) => {
  if (slide === 0) {
    return isFr ? (
      <>
        {"Votre cockpit IA pour "}
        <GradientTitlePart>{"cr\u00e9er, organiser et d\u00e9velopper"}</GradientTitlePart>
        {" sans limites."}
      </>
    ) : (
      <>
        Your AI cockpit to <GradientTitlePart>create, organize and grow</GradientTitlePart> without limits.
      </>
    );
  }

  if (slide === 1) {
    return isFr ? (
      <>
        {"Une "}
        <GradientTitlePart>{"\u00e9quipe IA contr\u00f4l\u00e9e"}</GradientTitlePart>
        {" pour avancer sans perdre le fil."}
      </>
    ) : (
      <>
        A <GradientTitlePart>controlled AI team</GradientTitlePart> to move forward without losing the thread.
      </>
    );
  }

  return isFr ? (
    <>
      {"Des "}
      <GradientTitlePart>{"builders, agents et espaces IA reli\u00e9s"}</GradientTitlePart>
      {" dans un seul OS."}
    </>
  ) : (
    <>
      <GradientTitlePart>Builders, agents and AI spaces</GradientTitlePart> connected in one OS.
    </>
  );
};

const Hero = ({ mode, onModeChange }: HeroProps) => {
  const { locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const isFr = locale === "fr";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const isAI = mode === "ai";

  const slides = useMemo(() => {
    if (isAI) return isFr ? aiHeroSlides : aiHeroSlidesEn;
    return isFr ? delegationHeroSlides : delegationHeroSlidesEn;
  }, [isAI, isFr]);

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

  useEffect(() => {
    setSlideIndex(0);
    const interval = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, HERO_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [slides.length, mode, locale]);

  const handleWorkspaceClick = () => {
    navigate(isLoggedIn ? "/dashboard" : "/auth");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  const activeSlide = slides[slideIndex] ?? slides[0];

  return (
    <section className="relative overflow-hidden pb-20 pt-24 lg:pb-28 lg:pt-32">
      <div className="container relative z-10 mx-auto px-5">
        <PixelrisesNavbar
          locale={locale}
          isLoggedIn={isLoggedIn}
          onLocaleChange={setLocale}
          onWorkspaceClick={handleWorkspaceClick}
          onSignOut={handleSignOut}
        />

        <HomeModeSwitch mode={mode} onModeChange={onModeChange} />

        {isAI ? (
          <div className="relative mx-auto mt-8 max-w-7xl overflow-hidden rounded-[36px] border border-white/[0.06] px-3 py-10 sm:rounded-[48px] sm:px-6 sm:py-14 lg:px-10">
            <PixelrisesRetroGrid />
            <motion.div
              className="relative z-10 text-center"
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto max-w-4xl text-center">
                <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary shadow-[0_0_45px_-22px_hsl(var(--primary))] backdrop-blur-sm sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Espace IA Pixelrises</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>

                <h1 className="mx-auto mt-7 flex min-h-[4.7em] max-w-5xl items-center justify-center text-[2.45rem] font-black leading-[0.95] tracking-[-0.06em] text-white sm:min-h-[3.25em] sm:text-5xl md:text-6xl lg:text-7xl">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${mode}-${locale}-${slideIndex}`}
                      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                      className="block"
                    >
                      {renderAIHeroTitle(slideIndex, isFr)}
                    </motion.span>
                  </AnimatePresence>
                </h1>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${mode}-${locale}-${slideIndex}-subtitle`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground/90 sm:text-lg lg:text-xl"
                  >
                    {activeSlide.subtitle}
                  </motion.p>
                </AnimatePresence>

                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="btn-hover-lift glow-primary h-12 w-full gap-2 rounded-2xl px-7 text-base font-black sm:h-14 sm:w-auto"
                  >
                    <Link to="/dashboard-demo">
                      Tester Pixelrises gratuitement
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="btn-hover-lift h-12 w-full gap-2 rounded-2xl border-primary/30 px-7 text-base font-black hover:border-primary/60 hover:bg-primary/5 sm:h-14 sm:w-auto"
                  >
                    <Link to="/pricing?mode=ai#tarifs">
                      Tarifs
                      <CreditCard className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>

                <div className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-2.5 text-xs text-muted-foreground sm:text-sm">
                  {["Aucune carte bancaire", "Accès immédiat", "Actions IA contrôlées"].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 backdrop-blur-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>

              </div>

              <div className="mx-auto mt-12 max-w-7xl sm:mt-16 lg:mt-20">
                <AIHeroPreview />
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            className="mx-auto max-w-6xl text-center"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-card/55 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary backdrop-blur-sm sm:text-xs">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Parcours délégation</span>
            </div>

            <h1 className="mx-auto mt-7 flex min-h-[3.75em] max-w-5xl items-center justify-center text-[2.45rem] font-black leading-[0.98] tracking-[-0.055em] text-primary sm:min-h-[3.25em] sm:text-5xl md:text-6xl lg:text-7xl">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${mode}-${locale}-${slideIndex}`}
                  initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                  transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  {activeSlide.title}
                </motion.span>
              </AnimatePresence>
            </h1>

            <AnimatePresence mode="wait">
              <motion.p
                key={`${mode}-${locale}-${slideIndex}-subtitle`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground/90 sm:text-lg lg:text-xl"
              >
                {activeSlide.subtitle}
              </motion.p>
            </AnimatePresence>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="btn-hover-lift glow-primary h-12 w-full gap-2 rounded-2xl px-7 text-base font-black sm:h-14 sm:w-auto"
              >
                <Link to="/diagnostic">
                  <Briefcase className="h-5 w-5" />
                Déléguer mon site
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="btn-hover-lift h-12 w-full gap-2 rounded-2xl border-primary/30 px-7 text-base font-black hover:border-primary/60 hover:bg-primary/5 sm:h-14 sm:w-auto"
              >
                <Link to="/pricing">
                  Voir les offres
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5 text-xs text-muted-foreground sm:text-sm">
              {["Diagnostic guidé", "Mobile-first", "Statuts honnêtes"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

const DASHBOARD_HERO_FRAME_WIDTH = 2048;
const DASHBOARD_HERO_FRAME_HEIGHT = 1152;

const AIHeroPreview = () => {
  const frameShellRef = useRef<HTMLDivElement | null>(null);
  const [frameScale, setFrameScale] = useState(1);

  useLayoutEffect(() => {
    const frameShell = frameShellRef.current;
    if (!frameShell) return undefined;

    const syncFrameScale = () => {
      setFrameScale(Math.min(1, frameShell.clientWidth / DASHBOARD_HERO_FRAME_WIDTH));
    };

    syncFrameScale();
    const resizeObserver = new ResizeObserver(syncFrameScale);
    resizeObserver.observe(frameShell);

    return () => resizeObserver.disconnect();
  }, []);

  const scaledHeight = DASHBOARD_HERO_FRAME_HEIGHT * frameScale;

  return (
    <motion.div
      className="relative w-full"
      data-testid="ai-hero-dashboard-preview"
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -inset-8 rounded-[48px] bg-primary/15 blur-[80px]" />
      <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-[#050505]/95 p-2 shadow-[0_55px_180px_-86px_hsl(var(--primary)/0.95)] sm:rounded-[38px] sm:p-3">
        <div
          ref={frameShellRef}
          className="relative w-full overflow-hidden rounded-[22px] border border-white/[0.08] bg-black sm:rounded-[30px]"
          style={{ height: scaledHeight || DASHBOARD_HERO_FRAME_HEIGHT }}
        >
          <iframe
            title="Aperçu du dashboard Pixelrises"
            src="/dashboard-demo?landingHeroPreview=1"
            className="pointer-events-none absolute left-0 top-0 border-0 bg-black"
            style={{
              width: DASHBOARD_HERO_FRAME_WIDTH,
              height: DASHBOARD_HERO_FRAME_HEIGHT,
              transform: `scale(${frameScale})`,
              transformOrigin: "top left",
            }}
            loading="lazy"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>
      <div className="mx-auto mt-4 max-w-3xl text-center text-xs font-semibold text-white/46 sm:text-sm">
        Aperçu visuel en lecture seule : le vrai dashboard connecté reste séparé et protégé.
      </div>
    </motion.div>
  );
};

const AIHeroPreviewArtwork = () => (
  <motion.div
    className="relative w-full"
    data-testid="ai-hero-dashboard-preview"
    initial={{ opacity: 0, scale: 0.96, y: 24 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className="absolute -inset-8 rounded-[48px] bg-primary/15 blur-[80px]" />
    <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-[#050505]/95 p-2 shadow-[0_55px_180px_-86px_hsl(var(--primary)/0.95)] sm:rounded-[38px] sm:p-3">
      <svg
        className="block w-full"
        viewBox="0 0 1440 820"
        role="img"
        aria-label="Apercu visuel du dashboard Pixelrises"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="aiHeroGold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFE789" />
            <stop offset="44%" stopColor="#F5C542" />
            <stop offset="100%" stopColor="#C58B00" />
          </linearGradient>
          <linearGradient id="aiHeroPanel" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#151515" />
            <stop offset="64%" stopColor="#080808" />
            <stop offset="100%" stopColor="#020202" />
          </linearGradient>
          <radialGradient id="aiHeroGlow" cx="50%" cy="0%" r="85%">
            <stop offset="0%" stopColor="#F5C542" stopOpacity="0.26" />
            <stop offset="48%" stopColor="#F5C542" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id="aiHeroSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="34" stdDeviation="38" floodColor="#000000" floodOpacity="0.8" />
          </filter>
          <filter id="aiHeroGoldShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#F5C542" floodOpacity="0.46" />
          </filter>
        </defs>

        <rect width="1440" height="820" rx="34" fill="#030303" />
        <rect width="1440" height="820" rx="34" fill="url(#aiHeroGlow)" />
        <rect x="1" y="1" width="1438" height="818" rx="33" fill="none" stroke="#F5C542" strokeOpacity="0.18" />

        <g filter="url(#aiHeroSoftShadow)">
          <rect x="38" y="34" width="230" height="752" rx="28" fill="#050505" stroke="#FFFFFF" strokeOpacity="0.08" />
          <rect x="292" y="34" width="1102" height="752" rx="30" fill="url(#aiHeroPanel)" stroke="#FFFFFF" strokeOpacity="0.08" />
        </g>

        <g>
          <rect x="64" y="58" width="42" height="42" rx="14" fill="#171717" />
          <text x="122" y="75" fill="#FFFFFF" fontSize="19" fontWeight="800" letterSpacing="1">
            PIXELRISES V2
          </text>
          <text x="122" y="96" fill="#FFFFFF" fillOpacity="0.52" fontSize="12" fontWeight="700">
            Démo visuelle
          </text>
          <path d="M78 84 C78 68 94 68 96 80 C99 96 76 93 76 105" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
        </g>

        {[
          ["Dashboard", "active", 112],
          ["Créer", "", 178],
          ["AI Spaces", "", 244],
          ["Site Builder", "", 310],
          ["Agents IA", "", 376],
          ["Game Builder", "", 442],
          ["Templates", "", 508],
          ["Intégrations", "", 574],
          ["Analytics", "", 640],
          ["Projets", "", 706],
        ].map(([label, state, y]) => (
          <g key={String(label)}>
            <rect
              x="58"
              y={Number(y)}
              width="176"
              height="46"
              rx="16"
              fill={state ? "#F5C542" : "#FFFFFF"}
              fillOpacity={state ? "0.12" : "0.025"}
              stroke={state ? "#F5C542" : "#FFFFFF"}
              strokeOpacity={state ? "0.65" : "0.06"}
            />
            <circle cx="82" cy={Number(y) + 23} r="6" fill={state ? "#F5C542" : "#FFFFFF"} fillOpacity={state ? "1" : "0.42"} />
            <text x="104" y={Number(y) + 29} fill={state ? "#F5C542" : "#FFFFFF"} fillOpacity={state ? "1" : "0.76"} fontSize="15" fontWeight="800">
              {label}
            </text>
          </g>
        ))}

        <g>
          <rect x="58" y="708" width="184" height="72" rx="18" fill="#101010" stroke="#FFFFFF" strokeOpacity="0.08" />
          <circle cx="88" cy="744" r="18" fill="url(#aiHeroGold)" />
          <text x="116" y="737" fill="#FFFFFF" fontSize="14" fontWeight="800">
            Votre espace
          </text>
          <text x="116" y="757" fill="#FFFFFF" fillOpacity="0.54" fontSize="12" fontWeight="700">
            Lecture seule
          </text>
        </g>

        <text x="332" y="74" fill="#F5C542" fontSize="12" fontWeight="900" letterSpacing="8">
          BONJOUR FONDATEUR
        </text>
        <text x="332" y="118" fill="#FFFFFF" fontSize="42" fontWeight="900">
          Votre guide IA pour créer sans vous disperser.
        </text>
        <text x="332" y="154" fill="#FFFFFF" fillOpacity="0.74" fontSize="18" fontWeight="700">
          Une recommandation, trois actions et vos projets récents. Rien de plus que ce qui aide à avancer.
        </text>

        <g>
          <rect x="948" y="56" width="132" height="42" rx="18" fill="url(#aiHeroGold)" filter="url(#aiHeroGoldShadow)" />
          <text x="982" y="82" fill="#111111" fontSize="14" fontWeight="900">
            Créer
          </text>
          <rect x="1094" y="56" width="122" height="42" rx="18" fill="#FFFFFF" fillOpacity="0.04" stroke="#FFFFFF" strokeOpacity="0.1" />
          <rect x="1104" y="64" width="58" height="26" rx="12" fill="url(#aiHeroGold)" />
          <text x="1118" y="82" fill="#111111" fontSize="12" fontWeight="900">
            Simple
          </text>
          <text x="1178" y="82" fill="#FFFFFF" fontSize="12" fontWeight="900">
            Avancé
          </text>
          {[1246, 1292, 1338].map((x) => (
            <circle key={x} cx={x} cy="77" r="18" fill="#FFFFFF" fillOpacity="0.035" stroke="#FFFFFF" strokeOpacity="0.1" />
          ))}
        </g>

        <g>
          <rect x="332" y="198" width="1008" height="70" rx="18" fill="#070707" stroke="#FFFFFF" strokeOpacity="0.08" />
          <rect x="350" y="214" width="82" height="26" rx="13" fill="#F5C542" fillOpacity="0.14" stroke="#F5C542" strokeOpacity="0.32" />
          <text x="372" y="232" fill="#F5C542" fontSize="12" fontWeight="900">
            Exemple
          </text>
          <text x="350" y="254" fill="#FFFFFF" fillOpacity="0.62" fontSize="15" fontWeight="700">
            Exemples de démonstration : ces chiffres présentent l'expérience V2, ils ne sont pas des résultats réels.
          </text>
        </g>

        <g>
          <rect x="332" y="300" width="1008" height="112" rx="24" fill="#101010" stroke="#FFFFFF" strokeOpacity="0.08" />
          <text x="352" y="334" fill="#F5C542" fontSize="13" fontWeight="900" letterSpacing="4">
            MODE DASHBOARD
          </text>
          <text x="352" y="366" fill="#FFFFFF" fontSize="28" fontWeight="900">
            Guided Mode : aller à l'essentiel
          </text>
          <text x="352" y="394" fill="#FFFFFF" fillOpacity="0.58" fontSize="16" fontWeight="700">
            Interface légère pour savoir quoi faire maintenant sans être noyé dans les métriques.
          </text>
          <rect x="1152" y="330" width="80" height="42" rx="16" fill="url(#aiHeroGold)" />
          <text x="1170" y="356" fill="#111111" fontSize="14" fontWeight="900">
            Guided
          </text>
          <rect x="1238" y="330" width="88" height="42" rx="16" fill="#FFFFFF" fillOpacity="0.035" stroke="#FFFFFF" strokeOpacity="0.08" />
          <text x="1260" y="356" fill="#FFFFFF" fillOpacity="0.7" fontSize="14" fontWeight="900">
            Cockpit
          </text>
        </g>

        <g>
          <rect x="332" y="438" width="1008" height="136" rx="28" fill="#090909" stroke="#F5C542" strokeOpacity="0.22" />
          <rect x="354" y="462" width="150" height="28" rx="14" fill="#F5C542" fillOpacity="0.12" stroke="#F5C542" strokeOpacity="0.3" />
          <text x="376" y="481" fill="#F5C542" fontSize="12" fontWeight="900">
            Recommandation exemple
          </text>
          <text x="520" y="481" fill="#FFFFFF" fontSize="12" fontWeight="900" letterSpacing="3">
            GUIDAGE PRIORITAIRE
          </text>
          <text x="354" y="530" fill="#FFFFFF" fontSize="30" fontWeight="900">
            Améliorer le CTA principal
          </text>
          <text x="354" y="558" fill="#FFFFFF" fillOpacity="0.66" fontSize="16" fontWeight="700">
            Un CTA plus précis peut augmenter les demandes qualifiées.
          </text>
          <text x="354" y="596" fill="#F5C542" fontSize="15" fontWeight="900">
            Impact estimé : améliore la conversion et la clarté du projet.
          </text>
          <rect x="1116" y="474" width="210" height="54" rx="18" fill="url(#aiHeroGold)" />
          <text x="1154" y="508" fill="#111111" fontSize="16" fontWeight="900">
            Ouvrir Agent Conversion
          </text>
          <rect x="1116" y="544" width="210" height="46" rx="16" fill="#FFFFFF" fillOpacity="0.03" stroke="#FFFFFF" strokeOpacity="0.08" />
          <text x="1162" y="573" fill="#FFFFFF" fillOpacity="0.82" fontSize="15" fontWeight="900">
            Ouvrir General AI
          </text>
        </g>

        <g>
          <rect x="332" y="602" width="1008" height="182" rx="28" fill="#101010" stroke="#FFFFFF" strokeOpacity="0.08" />
          <text x="352" y="646" fill="#FFFFFF" fontSize="29" fontWeight="900">
            Que veux-tu créer aujourd'hui ?
          </text>
          <text x="352" y="676" fill="#FFFFFF" fillOpacity="0.68" fontSize="15" fontWeight="700">
            Pixelrises V2 sépare la landing publique du cockpit app : choisis un site, un agent IA ou un jeu bêta.
          </text>
          {[
            ["Créer un site", "Génère structure, textes, CTA, SEO, preuves et preview responsive.", "Disponible"],
            ["Créer un agent IA", "Définis rôle, ton, contexte, permissions et prompts de test.", "Disponible"],
            ["Créer un jeu", "Prépare concept, gameplay loop, scripts, assets et checklist.", "Bêta"],
          ].map(([title, copy, badge], index) => {
            const x = 352 + index * 322;

            return (
              <g key={title}>
                <rect
                  x={x}
                  y="704"
                  width="296"
                  height="56"
                  rx="18"
                  fill={index === 2 ? "#F5C542" : "#FFFFFF"}
                  fillOpacity={index === 2 ? "0.08" : "0.035"}
                  stroke={index === 2 ? "#F5C542" : "#FFFFFF"}
                  strokeOpacity={index === 2 ? "0.22" : "0.08"}
                />
                <text x={x + 18} y="728" fill="#FFFFFF" fontSize="17" fontWeight="900">
                  {title}
                </text>
                <text x={x + 18} y="748" fill="#FFFFFF" fillOpacity="0.58" fontSize="12" fontWeight="700">
                  {copy}
                </text>
                <rect x={x + 218} y="714" width="62" height="20" rx="10" fill="#F5C542" fillOpacity="0.12" stroke="#F5C542" strokeOpacity="0.25" />
                <text x={x + 232} y="728" fill="#F5C542" fontSize="10" fontWeight="900">
                  {badge}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
    <div className="mx-auto mt-4 max-w-3xl text-center text-xs font-semibold text-white/46 sm:text-sm">
      Aperçu visuel en lecture seule : le vrai dashboard connecté reste séparé et protégé.
    </div>
  </motion.div>
);

const LegacyAIHeroPreview = () => (
  <motion.div
    className="relative w-full"
    initial={{ opacity: 0, scale: 0.96, y: 24 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className="absolute -inset-8 rounded-[44px] bg-primary/15 blur-[70px]" />
    <div className="relative overflow-hidden rounded-[26px] border border-white/[0.12] bg-[#090909]/90 shadow-[0_45px_160px_-80px_hsl(var(--primary)/0.8)] sm:rounded-[32px]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-white">Pixelrises</p>
            <p className="text-[11px] font-semibold text-white/45">Business OS</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs font-bold text-white/55 sm:flex">
          <span className="rounded-full border border-white/10 px-2 py-1">QG</span>
          <span className="rounded-full border border-white/10 px-2 py-1">IA</span>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-primary">12 450 crédits</span>
        </div>
      </div>

      <div className="grid min-h-0 gap-0 md:min-h-[420px] md:grid-cols-[148px_1fr]">
        <aside className="hidden border-r border-white/[0.08] bg-white/[0.025] p-4 md:block">
          {["Accueil", "Espace IA", "Builders", "Agents", "Automatisations", "Analytics", "Crédits"].map((item, index) => (
            <div
              key={item}
              className={`mb-2 rounded-xl px-3 py-2 text-[11px] font-extrabold ${
                index === 1 ? "bg-primary/[0.12] text-primary" : "text-white/52"
              }`}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="p-4 sm:p-5">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-sm font-black text-white">Bonjour, prêt à créer quelque chose d'extraordinaire ?</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/45 px-3 py-3 text-xs font-semibold text-white/45">
              <Sparkles className="h-4 w-4 text-primary" />
              Décrivez votre besoin ou votre projet...
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">Accès rapides</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {aiQuickAccess.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                      <Icon className="mx-auto h-5 w-5 text-primary" />
                      <p className="mt-2 text-[10px] font-extrabold text-white/72">{item.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">Projets récents</p>
                {["Refonte site Luxe Immobilier", "Application CoachFit", "Campagne Marketing Q2"].map((item, index) => (
                  <div key={item} className="mb-2 flex items-center justify-between rounded-xl bg-black/35 px-3 py-2 text-xs">
                    <span className="font-semibold text-white/72">{item}</span>
                    <span className="text-primary">{index === 0 ? "En cours" : "Prêt"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">Activité récente</p>
                {aiRecentActivity.map((item, index) => (
                  <div key={item} className="mb-2 flex items-center gap-2 text-xs text-white/68">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-primary/20 text-[10px] text-primary">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-white/50">Crédits disponibles</p>
                <p className="mt-1 text-3xl font-black text-white">12 450</p>
                <button className="mt-4 w-full rounded-xl border border-primary/30 px-3 py-2 text-xs font-black text-primary">
                  Recharger
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { label: "Mode Plan", icon: FolderKanban },
              { label: "Données protégées", icon: Lock },
              { label: "Performances", icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-xs font-black text-white/76">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default Hero;
