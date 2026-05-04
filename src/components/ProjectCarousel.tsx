import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AnimatedSection from "./AnimatedSection";
import { useTranslation } from "@/i18n/useTranslation";
import { portfolioProjects } from "@/data/portfolio-projects";
import { useIsMobile } from "@/hooks/use-mobile";

const AUTO_ROTATE_MS = 7000;

const ProjectCarousel = () => {
  const { locale } = useTranslation();
  const isFr = locale !== "en";
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { margin: "-120px 0px -120px 0px" });
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = portfolioProjects.length;
  const visibleRange = 0;
  const active = portfolioProjects[activeIdx];

  const next = useCallback(() => {
    setActiveIdx((previous) => (previous + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActiveIdx((previous) => (previous - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused || !isInView || isMobile) return;
    const timer = window.setInterval(next, AUTO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, isInView, isMobile, next]);

  const getOffset = useCallback(
    (index: number) => {
      let diff = index - activeIdx;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      return diff;
    },
    [activeIdx, total],
  );

  const visibleProjects = useMemo(() => {
    return portfolioProjects
      .map((project, index) => ({ project, index, offset: getOffset(index) }))
      .filter(({ offset }) => Math.abs(offset) <= visibleRange);
  }, [getOffset, visibleRange]);

  return (
    <section
      ref={sectionRef}
      className="landing-section"
      id="exemples"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-transparent" />
      </div>

      <div className="landing-section-inner">
        <AnimatedSection>
          <div className="landing-section-header">
            <span className="landing-eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              Exemples
            </span>
            <h2 className="landing-title">
              {isFr ? "Des sites qui inspirent confiance et convertissent" : "Work that creates real business signals"}
            </h2>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.12}>
          <div className="relative">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[90px] sm:h-[420px] sm:w-[520px] sm:blur-[120px]" />

            <div
              className="relative flex h-[300px] items-center justify-center sm:h-[460px] lg:h-[620px]"
              style={{ perspective: isMobile ? "900px" : "1500px" }}
            >
              {visibleProjects.map(({ project, index, offset }) => {
                const abs = Math.abs(offset);
                const isActive = offset === 0;
                const x = isMobile ? offset * 110 : offset * 220;
                const z = isActive ? 0 : -90 - abs * (isMobile ? 40 : 70);
                const rotateY = offset * (isMobile ? -7 : -14);
                const scale = isActive ? 1 : 0.89 - abs * 0.07;
                const opacity = isActive ? 1 : abs === 1 ? 0.62 : 0.28;
                const blur = isMobile ? 0 : isActive ? 0 : abs === 1 ? 1.5 : 3;
                const zIndex = 20 - abs;

                return (
                  <motion.div
                    key={project.title}
                    className="absolute left-1/2 top-1/2 w-[min(100%,280px)] cursor-pointer px-2 sm:w-[430px] sm:px-0 lg:w-[540px]"
                    style={{ transformStyle: "preserve-3d", zIndex }}
                    animate={{
                      x: `calc(-50% + ${x}px)`,
                      y: "-50%",
                      z,
                      rotateY,
                      scale: isActive ? 1 : scale,
                      opacity,
                      filter: `blur(${blur}px)`,
                    }}
                    transition={{ type: "spring", stiffness: 170, damping: 24, mass: 0.85 }}
                    onClick={() => !isActive && setActiveIdx(index)}
                  >
                    <div
                      className={`relative overflow-hidden rounded-[26px] border transition-all duration-500 ${
                        isActive
                          ? "border-primary/40 shadow-[0_24px_70px_-26px_hsl(var(--primary)/0.32),0_0_0_1px_hsl(var(--primary)/0.26)]"
                          : "border-white/10 shadow-[0_20px_50px_-32px_rgba(0,0,0,0.55)]"
                      }`}
                    >
                      {isActive && (
                        <div className="pointer-events-none absolute inset-0 z-20 rounded-[26px] bg-gradient-to-tr from-transparent via-primary/8 to-primary/18 mix-blend-overlay" />
                      )}

                      <div className="relative z-[5] flex items-center gap-1.5 border-b border-white/10 bg-muted/35 px-3 py-2">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-destructive/50" />
                          <div className="h-2 w-2 rounded-full bg-primary/30" />
                          <div className="h-2 w-2 rounded-full bg-accent-foreground/20" />
                        </div>
                        <div className="mx-2 flex-1 rounded-md bg-background/50 px-2 py-0.5">
                          <span className="block truncate text-[9px] text-muted-foreground">
                            {project.link.replace("https://", "")}
                          </span>
                        </div>
                      </div>

                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={project.image}
                          alt={project.title}
                          loading={isActive ? "eager" : "lazy"}
                          decoding="async"
                          draggable={false}
                          className={`h-full w-full object-cover object-top transition-transform duration-700 ${
                            isActive ? "scale-[1.01]" : "scale-100"
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/86 via-transparent to-transparent" />

                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-md">
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <h3 className="truncate text-sm font-bold text-white sm:text-base">{project.title}</h3>
                              <span className="flex-shrink-0 text-[9px] font-medium uppercase tracking-widest text-primary">
                                {project.category}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-xs leading-relaxed text-white/78">
                              {isFr ? project.description : project.descriptionEn}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={prev}
                aria-label={isFr ? "Précédent" : "Previous"}
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/85 transition-all hover:border-primary/40 hover:bg-primary/10"
              >
                <ChevronLeft className="h-5 w-5 text-foreground transition-colors group-hover:text-primary" />
              </button>

              <AnimatePresence mode="wait">
                <motion.a
                  key={`cta-${active.title}`}
                  href={active.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="group flex w-full max-w-[280px] flex-col items-center gap-1 rounded-full border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 px-5 py-3 text-center transition-all hover:border-primary/60 sm:min-w-[220px]"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors group-hover:text-primary sm:text-sm">
                    {isFr ? "Voir le site en ligne" : "View active site"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] text-muted-foreground sm:text-xs">
                    {isFr ? active.resultValue : active.resultValue}
                  </span>
                </motion.a>
              </AnimatePresence>

              <button
                onClick={next}
                aria-label={isFr ? "Suivant" : "Next"}
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/85 transition-all hover:border-primary/40 hover:bg-primary/10"
              >
                <ChevronRight className="h-5 w-5 text-foreground transition-colors group-hover:text-primary" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`impact-${active.title}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.32 }}
                className="mx-auto mt-6 max-w-3xl"
              >
                <div className="landing-card p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                          {isFr ? "Impact concret" : "Concrete impact"}
                        </p>
                      </div>
                      <h3 className="text-lg font-bold sm:text-xl">
                        {isFr ? `${active.title} transforme mieux les visiteurs` : `${active.title} helps convert better`}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {isFr ? active.impact : active.impactEn}
                      </p>
                    </div>

                    <div className="w-full rounded-2xl border border-primary/15 bg-primary/8 p-4 lg:w-auto lg:min-w-[180px]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {isFr ? active.resultLabel : active.resultLabelEn}
                      </p>
                      <p className="mt-2 text-lg font-bold text-primary sm:text-xl">
                        {active.resultValue}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {active.badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant="secondary"
                        className="border-primary/10 bg-primary/5 px-2.5 py-0.5 text-[10px] font-normal text-primary/80"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
              {portfolioProjects.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIdx(index)}
                  aria-label={`${isFr ? "Aller au projet" : "Go to project"} ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIdx ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ProjectCarousel;
