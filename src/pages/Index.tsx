import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SocialProof from "@/components/SocialProof";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import GlobalBg from "@/components/ui/global-bg";
import HowItWorks from "@/components/HowItWorks";
import FinalCTA from "@/components/FinalCTA";
import Hero from "@/components/Hero";
import { supabase } from "@/integrations/supabase/client";
import { isPixelrisesAppHostname } from "@/lib/browser-context";
import { getPublishedSiteSlugFromHostname } from "@/lib/published-site";
import Preview from "./Preview";

type IdleCallbackHandle = number;
type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type WindowWithIdleCallbacks = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: (deadline: IdleDeadline) => void,
      options?: { timeout: number },
    ) => IdleCallbackHandle;
    cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
  };

const CursorHalo = lazy(() => import("@/components/ui/cursor-halo"));
const Benefits = lazy(() => import("@/components/Benefits"));
const BeforeAfter = lazy(() => import("@/components/BeforeAfter"));
const DemoShowcase = lazy(() => import("@/components/DemoShowcase"));
const ProjectCarousel = lazy(() => import("@/components/ProjectCarousel"));
const Reviews = lazy(() => import("@/components/Reviews"));
const Pricing = lazy(() => import("@/components/Pricing"));
const RecommendationModule = lazy(() => import("@/components/RecommendationModule"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Commission = lazy(() => import("@/components/Commission"));
const SocialSection = lazy(() => import("@/components/SocialSection"));
const FloatingButtons = lazy(() => import("@/components/FloatingButtons"));
const ActivityNotifications = lazy(() => import("@/components/ActivityNotifications"));
const ExitPopup = lazy(() => import("@/components/ExitPopup"));

const SESSION_CHECK_TIMEOUT_MS = 2500;

const getCurrentHostname = () => (typeof window === "undefined" ? "" : window.location.hostname);

const isAppEntryHostname = () => isPixelrisesAppHostname(getCurrentHostname());

const AppEntryLoading = () => (
  <div className="min-h-screen bg-[#050505] text-white">
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[28px] border border-yellow-400/15 bg-white/[0.03] px-8 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300 shadow-[0_0_38px_rgba(250,204,21,0.22)]">
          <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-300" />
        </div>
        <p className="text-sm font-semibold text-white">Ouverture de votre espace Pixelrises</p>
        <p className="mt-2 text-xs text-white/50">Vérification de votre session...</p>
      </div>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [showDeferred, setShowDeferred] = useState(false);
  const [isCoarse, setIsCoarse] = useState(true);
  const publishedSiteSlug = getPublishedSiteSlugFromHostname(getCurrentHostname());
  const shouldCheckAppSession = !publishedSiteSlug && isAppEntryHostname();
  const [isCheckingAppSession, setIsCheckingAppSession] = useState(shouldCheckAppSession);

  useEffect(() => {
    if (!shouldCheckAppSession) {
      setIsCheckingAppSession(false);
      return;
    }

    let isMounted = true;
    const timeout = window.setTimeout(() => {
      if (isMounted) setIsCheckingAppSession(false);
    }, SESSION_CHECK_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;

        if (data.session?.user) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setIsCheckingAppSession(false);
      })
      .catch(() => {
        if (isMounted) setIsCheckingAppSession(false);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [navigate, shouldCheckAppSession]);

  useEffect(() => {
    if (publishedSiteSlug || isCheckingAppSession) return;

    setIsCoarse(window.matchMedia("(pointer: coarse)").matches);
    const idleWindow = window as WindowWithIdleCallbacks;
    const idle = (cb: () => void) =>
      idleWindow.requestIdleCallback
        ? idleWindow.requestIdleCallback(() => cb(), { timeout: 2500 })
        : window.setTimeout(cb, 1500);

    const id = idle(() => setShowDeferred(true));
    return () => {
      if (idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(id);
        return;
      }
      window.clearTimeout(id);
    };
  }, [isCheckingAppSession, publishedSiteSlug]);

  if (publishedSiteSlug) {
    return <Preview />;
  }

  if (isCheckingAppSession) {
    return <AppEntryLoading />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <GlobalBg />
      <div className="relative z-10">
        {!isCoarse && (
          <Suspense fallback={null}>
            <CursorHalo />
          </Suspense>
        )}
        <SEOHead
          title="Pixelrises | Création de sites web professionnels qui inspirent confiance"
          description="Créez un site professionnel clair, crédible et pensé pour attirer vos premiers clients. Design premium, mobile-first et prêt à être publié rapidement."
          path="/"
          keywords={[
            "création site web",
            "site internet professionnel",
            "générateur de site web",
            "site qui convertit",
            "agence web France",
            "site vitrine SEO",
          ]}
        />
        <Hero />
        <SocialProof />

        <Suspense fallback={null}>
          <Benefits />
          <HowItWorks />
          <RecommendationModule />
          <BeforeAfter />
          <DemoShowcase />
          <ProjectCarousel />
        </Suspense>

        <Suspense fallback={null}>
          <Reviews />
          <Pricing />
          <FAQ />
        </Suspense>

        <Suspense fallback={null}>
          <Commission />
          <SocialSection />
          <FinalCTA />
          <Footer />
        </Suspense>

        {showDeferred && (
          <Suspense fallback={null}>
            <FloatingButtons />
            <ActivityNotifications />
            <ExitPopup />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Index;
