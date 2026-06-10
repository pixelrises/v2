import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import AILanding from "@/components/AILanding";
import Footer from "@/components/Footer";
import GlobalBg from "@/components/ui/global-bg";
import Hero from "@/components/Hero";
import SEOHead from "@/components/SEOHead";
import type { LandingMode } from "@/components/HomeModeSwitch";

const EspaceIA = () => {
  const navigate = useNavigate();

  const handleModeChange = (mode: LandingMode) => {
    if (mode === "delegation") {
      navigate("/");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <GlobalBg />
      <div className="relative z-10">
        <SEOHead
          title="Espace IA Pixelrises | Plateforme IA, builders et agents"
          description="Découvrez l'Espace IA Pixelrises : 6 espaces spécialisés, builders, agents IA contrôlés, dashboard démo et actions verrouillées sans connexion."
          path="/espace-ia"
          keywords={["Espace IA Pixelrises", "AI Spaces", "agents IA", "builders IA", "dashboard IA"]}
        />
        <Hero mode="ai" onModeChange={handleModeChange} />
        <Suspense fallback={null}>
          <AILanding />
          <Footer />
        </Suspense>
      </div>
    </div>
  );
};

export default EspaceIA;
