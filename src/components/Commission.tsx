import { Button } from "@/components/ui/button";
import AnimatedSection from "./AnimatedSection";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const Commission = () => {
  const { t, locale } = useTranslation();
  const isFr = locale === "fr";
  const WHATSAPP_LINK = "https://wa.me/33775256214?text=Bonjour,%20je%20souhaite%20devenir%20partenaire.";

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-5 sm:px-4">
        <AnimatedSection>
          <div className="max-w-xl mx-auto text-center">
            <p className="section-title">{t("commission.badge")}</p>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 tracking-tight">{t("commission.title")}</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {isFr
                ? "Vous connaissez des entrepreneurs qui ont besoin d'un site professionnel ? Recommandez Pixelrises et recevez une commission sur chaque projet."
                : "Know entrepreneurs who need a professional site? Recommend Pixelrises and earn a commission on every project."}
            </p>
            <p className="text-xs text-primary/70 italic mb-8">
              {isFr ? "Aucun engagement — contact simple et rapide." : "No commitment — simple and fast."}
            </p>
            <Button asChild size="lg" variant="outline">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                {t("commission.cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Commission;
