import AnimatedSection from "./AnimatedSection";
import { useTranslation } from "@/i18n/useTranslation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HowItWorks = () => {
  const { locale } = useTranslation();
  const isFr = locale !== "en";

  const steps = [
    {
      number: "01",
      title: isFr ? "Diagnostic stratégique" : "Strategic diagnostic",
      description: isFr
        ? "Vous décrivez votre activité, votre objectif et votre budget. On pose une base claire avant de produire quoi que ce soit."
        : "You describe your business, goal and budget. We set a clear base before producing anything.",
    },
    {
      number: "02",
      title: isFr ? "Conception sous 48h" : "Design in 48h",
      description: isFr
        ? "Nous préparons une structure personnalisée, pensée pour la clarté, la conversion et la crédibilité de votre offre."
        : "We prepare a custom structure designed for clarity, conversion and credibility.",
    },
    {
      number: "03",
      title: isFr ? "Validation et mise en ligne" : "Validation & launch",
      description: isFr
        ? "Vous validez le rendu, puis nous finalisons la publication sur votre sous-domaine Pixelrises ou votre domaine."
        : "You validate the result, then we finalize the launch on your Pixelrises subdomain or your domain.",
    },
  ];

  return (
    <section className="landing-section">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-transparent" />
      </div>

      <div className="landing-section-inner">
        <AnimatedSection>
          <div className="landing-section-header">
            <div className="landing-eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {isFr ? "Processus" : "Process"}
              </span>
            </div>
            <h2 className="landing-title">
              {isFr ? "Un chemin clair jusqu'à la mise en ligne" : "A clear path to launch"}
            </h2>
            <p className="landing-copy max-w-xl">
              {isFr
                ? "Un cadre simple, rapide et rassurant pour passer du besoin à un site prêt à être publié."
                : "A simple, fast and reassuring path from need to a site ready to launch."}
            </p>
          </div>
        </AnimatedSection>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <div className="glass-card group relative h-full overflow-hidden rounded-[26px] border border-border/70 p-6 sm:p-7">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                <div className="relative">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 text-primary/40 lg:block" />
                    )}
                  </div>
                  <h3 className="mb-3 text-lg font-bold sm:text-xl">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {step.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
            <p className="flex items-center justify-center gap-2 text-center text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {isFr
                ? "Vous gardez une validation claire avant la mise en ligne finale."
                : "You keep a clear validation step before the final launch."}
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.5}>
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="glow-primary">
              <a href="/agence/diagnostic">
                {isFr ? "Lancer mon diagnostic" : "Start my diagnostic"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default HowItWorks;
