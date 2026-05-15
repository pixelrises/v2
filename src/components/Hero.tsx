import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles as SparklesIcon,
  ArrowRight,
  Star,
  Briefcase,
  Globe,
  LogOut,
  User,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import {
  PixelrisesLaunchIcon,
  PixelrisesOptimizeIcon,
  PixelrisesPreviewIcon,
} from "@/components/ui/pixelrises-state-icons";

const PLACEHOLDER_EXAMPLES_FR = [
  "Restaurant italien à Lyon",
  "Coach sportif à Marseille",
  "Salon de coiffure à Paris",
  "Agence immobilière à Bordeaux",
  "Boulangerie artisanale à Toulouse",
  "Cabinet d'avocats à Lille",
  "Studio de yoga à Nice",
  "Garage automobile à Nantes",
];

const PLACEHOLDER_EXAMPLES_EN = [
  "Italian restaurant in London",
  "Personal trainer in New York",
  "Hair salon in Paris",
  "Real estate agency in Berlin",
  "Bakery in Toronto",
  "Law firm in Sydney",
];

const HEADLINES_FR = [
  "Un site qui donne confiance en 3 secondes.",
  "Un site qui transforme vos visiteurs en clients.",
  "Un site pensé pour vendre, pas juste exister.",
  "Une présence web conçue pour attirer et convertir.",
];

const HEADLINES_EN = [
  "The website that turns\nvisitors into clients",
  "Launch a web presence\nthat builds trust in 3 seconds",
  "A site designed to sell,\npublish and grow fast",
];

const Hero = () => {
  const { locale, setLocale } = useTranslation();
  const isFr = locale === "fr";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [siteCount, setSiteCount] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const examples = isFr ? PLACEHOLDER_EXAMPLES_FR : PLACEHOLDER_EXAMPLES_EN;
  const headlines = isFr ? HEADLINES_FR : HEADLINES_EN;

  useEffect(() => {
    supabase
      .from("generated_sites")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => {
        setSiteCount(count ? Math.max(count, 30) : 30);
      });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((previous) => (previous + 1) % examples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [examples.length, query]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIdx((previous) => (previous + 1) % headlines.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [headlines.length]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current || !spotlightRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(600px circle at ${x}% ${y}%, hsl(var(--primary) / 0.11), transparent 60%)`;
      }
    });
  }, []);

  const prefetchAI = useCallback(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "/ai";
    if (!document.querySelector('link[href="/ai"]')) {
      document.head.appendChild(link);
    }
  }, []);

  const handleCreateWithAI = () => {
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    navigate(`/ai${params}`);
  };

  const handleDelegate = () => {
    const element = document.getElementById("diagnostic");
    if (element) element.scrollIntoView({ behavior: "smooth" });
    else navigate("/#diagnostic");
  };

  const handleWorkspaceClick = () => {
    navigate(isLoggedIn ? "/dashboard" : "/auth");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden pb-16 pt-20 sm:pb-20 sm:pt-24 lg:pb-28 lg:pt-32"
    >
      <div ref={spotlightRef} className="pointer-events-none absolute inset-0 -z-10 hidden md:block" />

      <div className="container relative z-10 mx-auto px-5">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 flex justify-center sm:justify-end">
            <div className="inline-flex w-full max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-background/70 px-2 py-2 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:w-auto sm:justify-end">
              <div
                className="inline-flex items-center rounded-xl border border-border/70 bg-background/70 p-1"
                role="group"
                aria-label={isFr ? "Choix de la langue" : "Language selection"}
              >
                <button
                  type="button"
                  onClick={() => setLocale("fr")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 ${
                    isFr
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={isFr}
                >
                  <Globe className="h-3.5 w-3.5" />
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 ${
                    !isFr
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={!isFr}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                onClick={handleWorkspaceClick}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/15 hover:text-primary sm:text-sm"
              >
                <User className="h-3.5 w-3.5 text-primary" />
                {isFr ? "Mon espace" : "My space"}
              </button>

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary sm:text-sm"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {isFr ? "Deconnexion" : "Sign out"}
                </button>
              )}
            </div>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-1">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-primary/20 bg-card/60 px-3 py-1.5 backdrop-blur-sm"
              >
                <div className="flex -space-x-2">
                  {[
                    { src: "https://i.pravatar.cc/64?img=47", alt: "Sophie" },
                    { src: "https://i.pravatar.cc/64?img=12", alt: "Marc" },
                    { src: "https://i.pravatar.cc/64?img=45", alt: "Léa" },
                    { src: "https://i.pravatar.cc/64?img=33", alt: "Thomas" },
                  ].map((avatar) => (
                    <img
                      key={avatar.alt}
                      src={avatar.src}
                      alt={avatar.alt}
                      loading="lazy"
                      className="h-6 w-6 rounded-full border-2 border-card object-cover"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pr-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <Star key={index} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-foreground sm:text-xs">
                    <span className="font-bold">4.9/5</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · 8 {isFr ? "avis Google vérifiés" : "verified Google reviews"} · +
                        {siteCount ?? 30} {isFr ? "sites créés" : "sites created"}
                    </span>
                  </span>
                </div>
              </motion.div>

              <h1 className="mt-6 flex min-h-[3em] items-center justify-center text-[2rem] font-extrabold leading-[1.02] tracking-tight sm:min-h-[3.2em] sm:text-5xl md:text-6xl lg:text-7xl">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={headlineIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="gradient-text block whitespace-pre-line"
                  >
                    {headlines[headlineIdx]}
                  </motion.span>
                </AnimatePresence>
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground/90 sm:text-lg lg:text-xl">
                {isFr ? (
                  "Décrivez votre activité. Pixelrises crée un site clair, crédible et prêt à attirer vos premiers clients en quelques secondes."
                ) : (
                  <>
                    Describe your business: Pixelrises generates a credible, clear and
                    conversion-focused first version in <span className="font-semibold text-foreground">30 seconds</span>.
                    Then you can preview it, edit it, publish it, or delegate it to our agency.
                  </>
                )}
              </p>

              <motion.div
                className="mx-auto mt-10 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="group relative">
                  <div className="animate-pulse-glow absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-primary/15 to-primary/40 opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
                  <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-card shadow-2xl shadow-primary/10">
                    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 text-left">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                        <SparklesIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{isFr ? "Créer mon site" : "Create my site"}</p>
                        <p className="text-xs text-muted-foreground">
                          {isFr
                            ? "Décris ton activité, on prépare une première version claire et prête à publier."
                            : "Describe your business and we prepare a clear first version ready to publish."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && handleCreateWithAI()}
                        placeholder={`Ex : ${examples[placeholderIdx]}`}
                        aria-label={isFr ? "Décrivez votre activité" : "Describe your business"}
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-lg"
                      />
                      <Button
                        onClick={handleCreateWithAI}
                        onMouseEnter={prefetchAI}
                        size="lg"
                        className="btn-hover-lift glow-primary h-12 gap-2 rounded-xl px-5 text-sm font-bold sm:h-14 sm:px-7 sm:text-base"
                      >
                        <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{isFr ? "Créer mon site" : "Create my site"}</span>
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-center text-xs text-muted-foreground sm:text-sm">
                  <span>{isFr ? "Essai simple" : "Simple start"}</span>
                  <span>·</span>
                  <span>{isFr ? "Aucune carte bancaire pour démarrer" : "No card to start"}</span>
                  <span>·</span>
                  <span>{isFr ? "Preview avant publication" : "Preview before publishing"}</span>
                </div>
              </motion.div>

              <div className="mx-auto mt-6 flex max-w-2xl items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground/60">
                  {isFr ? "Ou" : "Or"}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              <motion.div
                className="mt-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
              >
                <Button
                  onClick={handleDelegate}
                  variant="outline"
                  size="lg"
                  className="btn-hover-lift h-12 gap-2 rounded-xl border-primary/30 px-7 text-base font-semibold hover:border-primary/60 hover:bg-primary/5 sm:h-14 sm:px-9 sm:text-lg"
                >
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  {isFr ? "Déléguer à notre agence" : "Delegate to our agency"}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </motion.div>

              <motion.div
                className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 sm:gap-x-7"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  {
                    icon: PixelrisesLaunchIcon,
                    text: isFr ? "Génération en 30 sec" : "30 sec generation",
                  },
                  {
                    icon: PixelrisesPreviewIcon,
                    text: isFr ? "Mobile + SEO inclus" : "Mobile + SEO included",
                  },
                  {
                    icon: PixelrisesOptimizeIcon,
                    text: isFr ? "Flux simple et guidé" : "Simple guided flow",
                  },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                    <span className="flex h-4 w-4 items-center justify-center text-primary">
                      <item.icon size={16} />
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
