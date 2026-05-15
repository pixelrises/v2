import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ExternalLink,
  Eye,
  Monitor,
  MousePointerClick,
  Smartphone,
  Sparkles,
  Tablet,
  Zap,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { useTranslation } from "@/i18n/useTranslation";
import { ContainerScroll } from "@/components/ui/container-scroll";

const DEMO_URL = "https://demo.pixelrises.fr/";
const SCREENSHOT_FALLBACK = `https://api.microlink.io/?url=${encodeURIComponent(DEMO_URL)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&waitFor=1500`;

type Device = "desktop" | "tablet" | "mobile";

const DemoShowcase = () => {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [device, setDevice] = useState<Device>("desktop");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) setIframeFailed(true);
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [iframeLoaded]);

  const deviceWidths: Record<Device, string> = {
    desktop: "100%",
    tablet: "860px",
    mobile: "420px",
  };

  const deviceTabs: { id: Device; icon: typeof Monitor; label: string }[] = [
    { id: "desktop", icon: Monitor, label: "Desktop" },
    { id: "tablet", icon: Tablet, label: "Tablet" },
    { id: "mobile", icon: Smartphone, label: isFr ? "Mobile" : "Mobile" },
  ];

  return (
    <section className="landing-section" id="demo-showcase">
      <div className="landing-section-inner">
        <AnimatedSection>
          <ContainerScroll
            titleComponent={
              <div className="landing-section-header mb-8">
                <div className="landing-eyebrow">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {isFr ? "Démo universelle Pixelrises" : "Pixelrises universal demo"}
                </div>

                <h2 className="landing-title mt-5">
                  {isFr ? (
                    <>
                      Une vraie <span className="gradient-text">présence premium</span>, visible avant même de commander
                    </>
                  ) : (
                    <>
                      A real <span className="gradient-text">premium presence</span>, visible before you even order
                    </>
                  )}
                </h2>

                <p className="landing-copy">
                  {isFr
                    ? "Explorez un exemple Pixelrises dans un cadre immersif. Vous voyez le niveau de clarté, de structure et de crédibilité qu'un client peut obtenir avant publication."
                    : "Explore a Pixelrises example in an immersive frame. See the level of clarity, structure and credibility a client can get before publishing."}
                </p>
              </div>
            }
          >
            <div className="relative flex h-full flex-col bg-[radial-gradient(circle_at_top,rgba(255,215,90,0.10),transparent_42%),linear-gradient(180deg,#151515_0%,#0b0b0c_100%)]">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/90" />
                </div>

                <div className="hidden min-w-0 flex-1 justify-center px-6 sm:flex">
                  <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="truncate">demo.pixelrises.fr</span>
                  </div>
                </div>

                <a
                  href={DEMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={isFr ? "Ouvrir la démo" : "Open demo"}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 border-b border-white/10 px-3 py-3">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                  {deviceTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = device === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDevice(tab.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          active ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex-1 p-3 sm:p-5">
                <div
                  className="relative mx-auto h-full overflow-hidden rounded-[22px] border border-white/10 bg-background/90 shadow-2xl transition-all duration-500"
                  style={{ maxWidth: deviceWidths[device] }}
                >
                  {!iframeLoaded && !iframeFailed && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                        <p className="text-xs text-muted-foreground">
                          {isFr ? "Chargement de la démo..." : "Loading demo..."}
                        </p>
                      </div>
                    </div>
                  )}

                  {iframeFailed ? (
                    <a
                      href={DEMO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/demo block h-full"
                    >
                      <img
                        src={SCREENSHOT_FALLBACK}
                        alt={isFr ? "Aperçu de la démo Pixelrises" : "Pixelrises demo preview"}
                        loading="lazy"
                        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover/demo:scale-[1.015]"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-background via-background/40 to-transparent pb-7 pt-16 opacity-100">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-2xl">
                          <Eye className="h-4 w-4" />
                          {isFr ? "Voir la démo en plein écran" : "View fullscreen demo"}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </a>
                  ) : (
                    <iframe
                      src={DEMO_URL}
                      title="Pixelrises live demo"
                      loading="lazy"
                      onLoad={() => setIframeLoaded(true)}
                      className="h-full w-full bg-background"
                    />
                  )}
                </div>

                <div className="pointer-events-none absolute right-5 top-5 hidden items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-lg sm:inline-flex">
                  <MousePointerClick className="h-3 w-3" />
                  {isFr ? "Explorer" : "Explore"}
                </div>
              </div>
            </div>
          </ContainerScroll>
        </AnimatedSection>

        <AnimatedSection delay={0.12}>
          <div className="mx-auto -mt-10 max-w-3xl">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Zap,
                  label: isFr ? "Rapide à comprendre" : "Quick to understand",
                },
                {
                  icon: Sparkles,
                  label: isFr ? "Crédible dès l'ouverture" : "Credible from the first glance",
                },
                {
                  icon: Monitor,
                  label: isFr ? "Pensé pour tous les écrans" : "Built for every screen",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="action-card flex items-center justify-center gap-2 px-4 py-3 text-xs text-muted-foreground sm:text-sm">
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="glow-primary btn-hover-lift w-full sm:w-auto">
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  {isFr ? "Ouvrir la démo" : "Open the demo"}
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-border hover:border-primary/40 sm:w-auto"
              >
                <a href="#tarifs">
                  {isFr ? "Je veux le mien" : "I want mine"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default DemoShowcase;
