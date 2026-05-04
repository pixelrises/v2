import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  LayoutTemplate,
  MapPinned,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

interface LoadingStage {
  label: string;
  subTexts: string[];
}

const STAGES: LoadingStage[] = [
  {
    label: "Analyse du business",
    subTexts: [
      "Analyse de votre activité et de votre cible.",
      "Détection du bon angle de conversion.",
      "Sélection des messages les plus crédibles.",
    ],
  },
  {
    label: "Construction de la stratégie",
    subTexts: [
      "Organisation d'une structure claire et rassurante.",
      "Mise en avant des offres, du contact et des CTA.",
      "Construction d'un parcours pensé pour l'action.",
    ],
  },
  {
    label: "Création du design",
    subTexts: [
      "Assemblage du hero, des sections et des preuves.",
      "Préparation d'une base fidèle au rendu final.",
      "Optimisation de la lisibilité sur desktop et mobile.",
    ],
  },
  {
    label: "Optimisation mobile",
    subTexts: [
      "Vérification du rendu et de la cohérence globale.",
      "Nettoyage du contenu et des détails clés.",
      "Préparation de la preview finale.",
    ],
  },
];

interface PremiumLoadingAnimationProps {
  currentStage: number;
  currentSubIndex: number;
  progress: number;
}

export function PremiumLoadingAnimation({
  currentStage,
  currentSubIndex,
  progress,
}: PremiumLoadingAnimationProps) {
  const safeStage = Math.min(currentStage, STAGES.length - 1);
  const currentSubText = STAGES[safeStage]?.subTexts[currentSubIndex] || "";
  const loadingState: "starting" | "generating" | "completed" =
    progress >= 100 ? "completed" : progress < 18 ? "starting" : "generating";

  const helperText = useMemo(() => {
    if (loadingState === "starting") return "Préparation du projet.";
    if (loadingState === "completed") return "Site prêt.";
    return "Création premium en cours. Cela peut prendre quelques instants.";
  }, [loadingState]);

  return (
    <div className="mx-auto max-w-5xl py-12 sm:py-16">
      <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Pixelrises
          </div>

          <div className="space-y-3">
            <motion.span
              className="inline-block bg-[linear-gradient(110deg,hsl(var(--muted-foreground)),35%,hsl(var(--foreground)),50%,hsl(var(--muted-foreground)),75%,hsl(var(--muted-foreground)))] bg-[length:200%_100%] bg-clip-text text-base font-medium text-transparent"
              initial={{ backgroundPosition: "200% 0" }}
              animate={{
                backgroundPosition:
                  loadingState === "completed" ? "0% 0" : "-200% 0",
              }}
              transition={{
                repeat: loadingState === "completed" ? 0 : Infinity,
                duration: 3,
                ease: "linear",
              }}
            >
              {helperText}
            </motion.span>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Nous préparons votre site
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Pixelrises construit une première version claire, crédible et prête
              à être prévisualisée puis publiée.
            </p>
          </div>

          <div className="space-y-3">
            {STAGES.map((stage, index) => {
              const isDone = index < safeStage || progress >= 100;
              const isActive = index === safeStage && progress < 100;

              return (
                <div
                  key={stage.label}
                  className={`rounded-2xl border p-4 transition-all duration-500 ${
                    isActive
                      ? "border-primary/35 bg-primary/10 shadow-[0_24px_50px_-30px_rgba(214,178,85,0.45)]"
                      : isDone
                        ? "border-white/10 bg-background/70"
                        : "border-white/10 bg-background/35 opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                        isDone
                          ? "bg-primary text-primary-foreground"
                          : isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{stage.label}</p>
                      {isActive ? (
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={currentSubText}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mt-1 text-xs text-muted-foreground"
                          >
                            {currentSubText}
                          </motion.p>
                        </AnimatePresence>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isDone ? "Terminé" : stage.subTexts[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary-glow"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="relative rounded-[28px] border border-white/10 bg-card/90 p-4 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-background/90">
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded-full bg-primary/20" />
                  <div className="h-8 w-64 rounded-full bg-foreground/90" />
                  <div className="h-4 w-80 max-w-full rounded-full bg-muted" />
                </div>
                <div className="hidden rounded-2xl border border-white/10 bg-background/80 p-3 sm:block">
                  <LayoutTemplate className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4">
                  <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(214,178,85,0.12),rgba(255,255,255,0.03))] p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                      <MessageSquareQuote className="h-4 w-4" />
                      Proposition de valeur
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 w-4/5 rounded-full bg-foreground/85" />
                      <div className="h-4 w-full rounded-full bg-muted" />
                      <div className="h-4 w-3/4 rounded-full bg-muted" />
                    </div>
                    <div className="mt-5 flex gap-3">
                      <div className="h-11 w-36 rounded-2xl bg-primary/90" />
                      <div className="h-11 w-28 rounded-2xl border border-white/10 bg-background/80" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-background/70 p-4"
                      >
                        <div className="mb-3 h-9 w-9 rounded-2xl bg-primary/12" />
                        <div className="h-4 w-24 rounded-full bg-foreground/80" />
                        <div className="mt-2 h-3 w-full rounded-full bg-muted" />
                        <div className="mt-1.5 h-3 w-2/3 rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-background/75 p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <MapPinned className="h-4 w-4 text-primary" />
                      Présence locale
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 rounded-full bg-foreground/75" />
                      <div className="h-3 w-full rounded-full bg-muted" />
                      <div className="h-3 w-4/5 rounded-full bg-muted" />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-3xl border border-white/10 bg-background/75 p-5">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-background/65 p-4"
                      >
                        <div className="h-4 w-32 rounded-full bg-foreground/80" />
                        <div className="mt-2 h-3 w-full rounded-full bg-muted" />
                        <div className="mt-1.5 h-3 w-5/6 rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="pointer-events-none absolute inset-0 backdrop-blur-3xl"
              initial={false}
              animate={{
                opacity: loadingState === "completed" ? 0.12 : 0.3,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
