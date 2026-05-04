import { ArrowRight, CheckCircle, Clock, GripVertical, Sparkles, Target, TrendingUp, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedSection from "./AnimatedSection";
import { useTranslation } from "@/i18n/useTranslation";
import TiltCard from "@/components/ui/tilt-card";
import AnimatedCounter from "@/components/ui/animated-counter";
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from "@/components/ui/image-comparison";

const BeforeAfter = () => {
  const { locale } = useTranslation();

  const beforeItems = locale === "en"
    ? ["Visitors leave in seconds", "Low trust, no credibility", "Lost clients to competitors"]
    : [
        "Les visiteurs partent en quelques secondes",
        "Peu de confiance, aucune crédibilité",
        "Des clients perdus au profit de vos concurrents",
      ];

  const afterItems = locale === "en"
    ? ["Visitors stay and take action", "Professional image that sells", "A site that works for you 24/7"]
    : [
        "Les visiteurs restent et passent à l'action",
        "Une image professionnelle qui vend",
        "Un site qui travaille pour vous 24h/24",
      ];

  return (
    <section className="landing-section">
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-transparent" />
      </div>

      <div className="landing-section-inner">
        <AnimatedSection>
          <div className="landing-section-header">
            <span className="landing-eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              {locale === "en" ? "The difference" : "La différence"}
            </span>
            <h2 className="landing-title">
              {locale === "en" ? "Before / After Pixelrises" : "Avant / Après Pixelrises"}
            </h2>
            <p className="landing-copy max-w-2xl">
              {locale === "en"
                ? "Drag the slider and see the transformation that converts visitors into clients."
                : "Glissez le curseur et découvrez la transformation qui convertit vos visiteurs en clients."}
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="mx-auto mb-16 max-w-4xl relative group">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-primary-glow/20 to-primary/20 blur-2xl opacity-60 transition-opacity duration-700 group-hover:opacity-100" />
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl shadow-primary/10">
              <ImageComparison className="relative aspect-[16/10]">
                <ImageComparisonImage
                  src="/projects/before-after-1.webp"
                  alt={locale === "en" ? "After Pixelrises" : "Après Pixelrises"}
                  position="left"
                />
                <ImageComparisonImage
                  src="/projects/before-after-2.webp"
                  alt={locale === "en" ? "Before Pixelrises" : "Avant Pixelrises"}
                  position="right"
                />
                <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/40 backdrop-blur-sm">
                  <CheckCircle className="h-3 w-3" />
                  {locale === "en" ? "AFTER" : "APRÈS"}
                </div>
                <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow-lg backdrop-blur-sm">
                  <XCircle className="h-3 w-3" />
                  {locale === "en" ? "BEFORE" : "AVANT"}
                </div>
                <ImageComparisonSlider className="w-1 bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/50 ring-4 ring-primary/20">
                    <GripVertical className="h-5 w-5 text-primary-foreground" />
                  </div>
                </ImageComparisonSlider>
              </ImageComparison>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <span className="inline-block h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
              {locale === "en" ? "Drag the slider to compare" : "Glissez le curseur pour comparer"}
              <span className="inline-block h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="mx-auto mb-14 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                value: 47,
                prefix: "+",
                suffix: "%",
                label: locale === "en" ? "Conversion rate" : "Taux de conversion",
              },
              {
                icon: Users,
                value: 3,
                prefix: "x",
                suffix: "",
                label: locale === "en" ? "More leads" : "Plus de leads",
              },
              {
                icon: Clock,
                value: 68,
                prefix: "-",
                suffix: "%",
                label: locale === "en" ? "Bounce rate" : "Taux de rebond",
              },
              {
                icon: Target,
                value: 4.9,
                prefix: "",
                suffix: "/5",
                decimals: 1,
                label: locale === "en" ? "Client satisfaction" : "Satisfaction client",
              },
            ].map((stat, i) => (
              <div key={i} className="landing-card p-4 text-center sm:p-5">
                <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mb-1.5 text-2xl font-extrabold leading-none tracking-tight text-primary sm:text-3xl">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals ?? 0}
                  />
                </div>
                <p className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          <AnimatedSection delay={0.2}>
            <TiltCard className="h-full">
              <div className="landing-card h-full border-destructive/20 p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold">{locale === "en" ? "Without Pixelrises" : "Sans Pixelrises"}</h3>
                </div>
                <ul className="space-y-3.5">
                  {beforeItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </TiltCard>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <TiltCard className="h-full">
              <div className="landing-card relative h-full overflow-hidden border-primary/30 p-8">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30 shadow-lg shadow-primary/10">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">{locale === "en" ? "With Pixelrises" : "Avec Pixelrises"}</h3>
                  </div>
                  <ul className="space-y-3.5">
                    {afterItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-foreground">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TiltCard>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.4}>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="group magnetic-glow bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] hover:bg-primary/90 hover:shadow-primary/40">
              <a href="#exemples">
                {locale === "en" ? "See real results" : "Voir des résultats concrets"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default BeforeAfter;
