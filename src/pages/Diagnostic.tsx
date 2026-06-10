import { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import GlobalBg from "@/components/ui/global-bg";
import SEOHead from "@/components/SEOHead";
import { PixelrisesNavbar } from "@/components/PixelrisesNavbar";
import { useTranslation } from "@/i18n/useTranslation";
import { supabase } from "@/integrations/supabase/client";

const RecommendationModule = lazy(() => import("@/components/RecommendationModule"));

const Diagnostic = () => {
  const { locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const handleWorkspaceClick = () => {
    navigate(isLoggedIn ? "/dashboard" : "/auth");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <GlobalBg />
      <SEOHead
        title="Diagnostic Pixelrises - Choisir la meilleure suite pour votre site"
        description="Lancez un diagnostic guidé Pixelrises pour cadrer votre projet, clarifier vos priorités et choisir entre autonomie, accompagnement et investissement."
        path="/diagnostic"
        keywords={["diagnostic site web", "audit site web", "Pixelrises diagnostic", "site qui convertit"]}
      />
      <div className="relative z-10">
        <div className="container mx-auto px-5 pt-8 sm:pt-10">
          <PixelrisesNavbar
            locale={locale}
            isLoggedIn={isLoggedIn}
            onLocaleChange={setLocale}
            onWorkspaceClick={handleWorkspaceClick}
            onSignOut={handleSignOut}
          />
        </div>

        <Suspense fallback={null}>
          <RecommendationModule />
        </Suspense>

        <Footer />
      </div>
    </div>
  );
};

export default Diagnostic;
