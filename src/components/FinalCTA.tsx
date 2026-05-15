import { Button } from "@/components/ui/button";
import AnimatedSection from "./AnimatedSection";
import { ArrowRight, Shield, Zap, MessageCircle } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const WHATSAPP_LINK = "https://api.whatsapp.com/send/?phone=33775256214&text=Bonjour%2C+je+souhaite+creer+un+site+web.";

const FinalCTA = () => {
  const { locale } = useTranslation();
  const isFr = locale === "fr";

  return (
    <section className="landing-section">
      <div className="landing-section-inner z-10">
        <AnimatedSection>
          <div className="premium-shell-strong mx-auto max-w-4xl px-6 py-10 text-center sm:px-10 sm:py-12">
            <span className="landing-eyebrow">
              <Zap className="h-3 w-3" />
              {isFr ? "Passage à l'action" : "Take action"}
            </span>
            <h2 className="landing-title">
              {isFr ? "Prêt à attirer plus de clients ?" : "Ready to attract more clients?"}
            </h2>
            <p className="landing-copy mb-6 max-w-2xl">
              {isFr
                ? "Choisissez votre chemin : avancer en autonomie avec Pixelrises ou déléguer votre projet à un professionnel."
                : "Choose your path: move forward on your own or delegate your project to a Pixelrises expert."}
            </p>
            <div className="mb-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {[
                { icon: Zap, text: isFr ? "Démarrage rapide" : "Fast start" },
                { icon: Shield, text: isFr ? "Structure pensée pour convertir" : "Built to convert" },
              ].map((item, i) => (
                <span key={i} className="micro-kpi">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                  {item.text}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="glow-primary px-10 py-6 text-base btn-hover-lift">
                <a href="/ai">
                  {isFr ? "Créer mon site" : "Create my site"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border hover:border-primary/40">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {isFr ? "Déléguer mon projet" : "Delegate my project"}
                </a>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FinalCTA;
