import { ArrowRight, Image, Sparkles, TrendingUp, Users } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import ParallaxTitle from "@/components/ui/parallax-title";
import TiltCard from "@/components/ui/tilt-card";
import { useTranslation } from "@/i18n/useTranslation";

const Benefits = () => {
  const { locale } = useTranslation();
  const isFr = locale === "fr";

  const benefits = [
    {
      icon: Users,
      title: isFr ? "Attirer plus de clients" : "Attract more clients",
      description: isFr
        ? "Votre site devient un levier d'acquisition conçu pour transformer chaque visiteur en opportunité concrète."
        : "Your site becomes a client magnet designed to convert visitors into real opportunities.",
      result: isFr ? "Plus de leads, plus de ventes" : "More leads, more sales",
      stat: "+47%",
      statLabel: isFr ? "conversions" : "conversions",
    },
    {
      icon: Image,
      title: isFr ? "Renforcer votre crédibilité" : "Enhance your image",
      description: isFr
        ? "Une apparence professionnelle qui inspire confiance dès la première seconde. Votre image vend avant même votre prise de contact."
        : "A professional look that inspires trust from the first second. Your image sells before you do.",
      result: isFr ? "Confiance immédiate" : "Instant trust",
      stat: "3s",
      statLabel: isFr ? "pour convaincre" : "to convince",
    },
    {
      icon: TrendingUp,
      title: isFr ? "Développer votre visibilité" : "Grow your visibility",
      description: isFr
        ? "Chaque élément guide vers l'action. Votre site continue d'expliquer votre offre, de rassurer et de capter des demandes même hors ligne."
        : "Every element guides toward action. Your site keeps explaining your offer and capturing demand even while you are offline.",
      result: isFr ? "Visible sur Google" : "Visible on Google",
      stat: "24/7",
      statLabel: isFr ? "actif" : "active",
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="container relative z-10 mx-auto px-5 sm:px-4">
        <AnimatedSection>
          <ParallaxTitle className="mb-14 text-center" intensity={30}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary sm:text-[11px]">
              <Sparkles className="h-3 w-3" />
              {isFr ? "Pourquoi c'est important" : "Why it matters"}
            </span>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {isFr ? (
                <>
                  Votre site doit vous <span className="shimmer-text">rapporter</span> des clients
                </>
              ) : (
                <>
                  Your website should <span className="shimmer-text">bring</span> you clients
                </>
              )}
            </h2>
            <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
              {isFr
                ? "Pas juste être joli : clarifier votre offre, rassurer vite et pousser à l'action."
                : "Not just look good: clarify your offer, build trust fast and drive action."}
            </p>
          </ParallaxTitle>
        </AnimatedSection>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          {benefits.map((benefit, index) => (
            <AnimatedSection key={benefit.title} delay={index * 0.1}>
              <BenefitCard benefit={benefit} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

interface BenefitCardProps {
  benefit: {
    icon: typeof Users;
    title: string;
    description: string;
    result: string;
    stat: string;
    statLabel: string;
  };
}

const BenefitCard = ({ benefit }: BenefitCardProps) => {
  return (
    <TiltCard maxTilt={6} className="h-full">
      <div className="glass-card card-shine group relative h-full overflow-hidden rounded-2xl p-7 text-center sm:p-8">
        <div className="absolute right-4 top-4 flex flex-col items-end opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="shimmer-text text-lg font-extrabold leading-none">{benefit.stat}</span>
          <span className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">{benefit.statLabel}</span>
        </div>

        <div className="relative mx-auto mb-5 h-16 w-16">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 transition-colors duration-500 group-hover:bg-primary/20" />
          <div className="absolute inset-0 rounded-2xl border border-primary/20 transition-colors duration-500 group-hover:border-primary/40" />
          <div className="absolute -inset-2 rounded-3xl border border-primary/0 transition-all duration-500 group-hover:scale-110 group-hover:border-primary/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <benefit.icon className="h-7 w-7 text-primary transition-transform duration-500 group-hover:scale-110" />
          </div>
        </div>

        <h3 className="mb-3 text-lg font-bold sm:text-xl">{benefit.title}</h3>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">{benefit.description}</p>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary sm:text-sm">
          <ArrowRight className="h-3.5 w-3.5" />
          {benefit.result}
        </div>
      </div>
    </TiltCard>
  );
};

export default Benefits;