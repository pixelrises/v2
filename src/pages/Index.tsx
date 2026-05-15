import { lazy, Suspense, useEffect, useState } from "react";
import SocialProof from "@/components/SocialProof";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import GlobalBg from "@/components/ui/global-bg";
import HowItWorks from "@/components/HowItWorks";
import FinalCTA from "@/components/FinalCTA";
import Hero from "@/components/Hero";
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

const getCurrentHostname = () => (typeof window === "undefined" ? "" : window.location.hostname);

const Index = () => {
  const [showDeferred, setShowDeferred] = useState(false);
  const [isCoarse, setIsCoarse] = useState(true);
  const publishedSiteSlug = getPublishedSiteSlugFromHostname(getCurrentHostname());

  useEffect(() => {
    if (publishedSiteSlug) return;

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
  }, [publishedSiteSlug]);

  if (publishedSiteSlug) {
    return <Preview />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <GlobalBg />
      <div className="relative z-10">
        {!isCoarse && (
          <Suspense fallback={null}>
            <CursorHalo />
          </Suspense>
        )}
        <SEOHead
          title="Pixelrises - Création de site web professionnel | Site qui convertit"
          description="Créez un site web professionnel qui attire des clients : création rapide en autonomie ou service clé en main. Design premium, mobile-first, SEO optimisé. Dès 490€. Livraison rapide."
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
