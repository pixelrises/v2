import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  Globe,
  Lightbulb,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/i18n/useTranslation";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AnimatedCounter from "@/components/ui/animated-counter";

const WHATSAPP_LINK = "https://wa.me/33775256214";

type ResultMode = "idle" | "real" | "estimate" | "unavailable";

type Diagnosis = {
  score_global: number;
  situation: string;
  problemes: string[];
  points_forts?: string[];
  plan_action: string[];
  resultat_attendu: string;
  recommandation_offre: string;
  raison_offre: string;
};

const OFFERS: Record<string, { price: string; link: string }> = {
  Essentiel: { price: "490", link: "https://buy.stripe.com/eVqaEZgHHeF9d6v5qpaZi0k" },
  Professionnel: { price: "790", link: "https://buy.stripe.com/8x200l3UVdB56I7065aZi0j" },
  Premium: { price: "1190", link: "https://buy.stripe.com/bJe00l4YZ9kP3vV1a9aZi0i" },
};

const RecommendationModule = () => {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    hasSite: "",
    url: "",
    objectif: "",
    budget: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultMode, setResultMode] = useState<ResultMode>("idle");
  const [resultMessage, setResultMessage] = useState("");

  const steps = [
    {
      question: isFr ? "Avez-vous déjà un site web ?" : "Do you already have a website?",
      key: "hasSite" as const,
      options: isFr ? ["Oui", "Non"] : ["Yes", "No"],
    },
    ...(answers.hasSite === "Oui" || answers.hasSite === "Yes"
      ? [
          {
            question: isFr ? "Entrez l'URL de votre site" : "Enter your website URL",
            key: "url" as const,
            isInput: true,
            options: [] as string[],
          },
        ]
      : []),
    {
      question: isFr ? "Quel est votre objectif principal ?" : "What is your main goal?",
      key: "objectif" as const,
      options: isFr
        ? ["Obtenir des clients", "Améliorer ma visibilité", "Renforcer mon image"]
        : ["Get clients", "Boost visibility", "Improve image"],
    },
    {
      question: isFr ? "Quel budget envisagez-vous ?" : "What budget are you considering?",
      key: "budget" as const,
      options: isFr
        ? ["Moins de 600€", "Entre 600€ et 1000€", "Plus de 1000€"]
        : ["Under 600€", "Between 600€ and 1000€", "More than 1000€"],
    },
  ];

  const parseBudgetCeiling = (budget: string) => {
    if (!budget) return 0;
    const numbers = budget.match(/\d+/g)?.map(Number) || [];
    if (numbers.length === 0) return 0;
    if (/plus|more|\+/i.test(budget)) return 99999;
    if (/moins|under|</i.test(budget)) return Math.max(...numbers);
    return Math.max(...numbers);
  };

  const getLocalRecommendation = () => {
    const ceiling = parseBudgetCeiling(answers.budget);
    if (ceiling > 1000) return "Premium";
    if (ceiling >= 600) return "Professionnel";
    return "Essentiel";
  };

  const enforceBudget = (offerName: string) => {
    const ceiling = parseBudgetCeiling(answers.budget);
    const price = parseInt(OFFERS[offerName]?.price || "0", 10);
    if (ceiling && price > ceiling) return getLocalRecommendation();
    return offerName;
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setResultMode("idle");
    setResultMessage("");
    setDiagnosis(null);

    try {
      if (!isSupabaseConfigured) {
        toast.info(
          isFr
            ? "Le diagnostic réel n'est pas encore branché ici. On affiche une orientation simple, sans audit fictif."
            : "The real diagnosis is not fully connected here yet. Showing a simple direction, not a fake audit.",
        );
        setResultMode("estimate");
        setResultMessage(
          isFr
            ? "Diagnostic réel indisponible ici. Cette recommandation est une orientation rapide basée sur vos réponses."
            : "Real diagnosis is unavailable here. This recommendation is a quick direction based on your answers.",
        );
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-url", {
        body: {
          url: answers.url || "",
          objectif: answers.objectif,
          budget: answers.budget,
          hasSite: answers.hasSite,
        },
      });

      if (error) throw error;

      if (data?.error) {
        setResultMode("unavailable");
        setResultMessage(
          data.error ||
            (isFr
              ? "Le diagnostic réel est temporairement indisponible."
              : "The real diagnosis is temporarily unavailable."),
        );
      } else if (data?.diagnosis) {
        setDiagnosis(data.diagnosis);
        setResultMode("real");
        setResultMessage(
          isFr
            ? "Diagnostic réel généré par Pixelrises."
            : "Real diagnosis generated by Pixelrises.",
        );
      } else {
        setResultMode("unavailable");
        setResultMessage(
          isFr
            ? "Le diagnostic réel n'a pas pu être généré cette fois."
            : "The real diagnosis could not be generated this time.",
        );
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("analysis error:", error);
      toast.error(
        isFr
          ? "Erreur pendant l'analyse réelle. Le service est disponible, mais il n'a pas répondu correctement."
          : "Real analysis failed. The service is available, but it did not respond correctly.",
      );
      setResultMode("unavailable");
      setResultMessage(
        isFr
          ? "Le diagnostic réel est temporairement indisponible. Réessayez dans quelques instants."
          : "The real diagnosis is temporarily unavailable. Please try again in a moment.",
      );
    } finally {
      setIsAnalyzing(false);
      setShowResult(true);
    }
  };

  const recommendedOffer = enforceBudget(
    diagnosis?.recommandation_offre || getLocalRecommendation(),
  );
  const offer = OFFERS[recommendedOffer] || OFFERS.Professionnel;

  const budgetReason = (() => {
    const ceiling = parseBudgetCeiling(answers.budget);
    const displayBudget = ceiling >= 99999 ? "1000+" : ceiling;

    if (recommendedOffer === "Essentiel") {
      return isFr
        ? `Avec un budget autour de ${displayBudget}€, la formule Essentiel est la plus logique pour publier une base sérieuse sans partir dans un projet trop lourd.`
        : `With a budget around ${displayBudget}€, the Essentiel plan is the most logical way to publish a solid first version without going too heavy.`;
    }

    if (recommendedOffer === "Professionnel") {
      return isFr
        ? `Avec un budget autour de ${displayBudget}€, la formule Professionnel offre le meilleur équilibre entre crédibilité, conversion et vitesse de mise en ligne.`
        : `With a budget around ${displayBudget}€, the Professionnel plan gives the best balance between credibility, conversion and launch speed.`;
    }

    return isFr
      ? `Avec un budget supérieur à ${displayBudget === "1000+" ? "1000€" : `${displayBudget}€`}, la formule Premium est la plus cohérente pour un site plus ambitieux, plus premium et plus différenciant.`
      : `With a budget above ${displayBudget === "1000+" ? "1000€" : `${displayBudget}€`}, the Premium plan is the strongest fit for a more ambitious, premium and differentiated website.`;
  })();

  const next = () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    void runAnalysis();
  };

  const prev = () => {
    if (showResult) {
      setShowResult(false);
      setDiagnosis(null);
      setResultMode("idle");
      setResultMessage("");
      return;
    }
    if (step > 0) setStep((current) => current - 1);
  };

  const restart = () => {
    setStep(0);
    setAnswers({ hasSite: "", url: "", objectif: "", budget: "" });
    setDiagnosis(null);
    setShowResult(false);
    setResultMode("idle");
    setResultMessage("");
  };

  const canProceed = () => {
    const currentStep = steps[step];
    if (!currentStep) return false;
    if ((currentStep as { isInput?: boolean }).isInput) return true;
    return Boolean(answers[currentStep.key as keyof typeof answers]);
  };

  const scoreColor = (score: number) => {
    if (score >= 7) return "text-green-400";
    if (score >= 4) return "text-orange-400";
    return "text-red-400";
  };

  const isRealDiagnosis = resultMode === "real" && Boolean(diagnosis);
  const showFallbackGuidance = resultMode === "estimate" || resultMode === "unavailable";

  return (
    <section className="landing-section" id="diagnostic">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-transparent" />
      </div>

      <div className="landing-section-inner">
        <AnimatedSection>
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {isFr ? "Diagnostic guidé" : "Guided diagnostic"}
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {isFr ? "Choisissez la meilleure suite pour votre business" : "Choose the best next step for your business"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {isFr
                ? "Le but n'est pas de vous noyer dans des options. On vous aide à choisir rapidement entre autonomie, accompagnement et bon niveau d'investissement."
                : "The goal is not to drown you in options. We help you quickly choose between autonomy, service and the right investment level."}
            </p>
          </div>
        </AnimatedSection>

        <div className="mx-auto max-w-5xl">
          {isAnalyzing && (
            <AnimatedSection delay={0.1}>
              <div className="card-premium space-y-6 p-10 text-center sm:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {isFr ? "Analyse en cours..." : "Analyzing..."}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {answers.url
                      ? isFr
                        ? "On vérifie votre présence actuelle pour recommander la meilleure suite."
                        : "Reviewing your current presence to recommend the best next step."
                      : isFr
                        ? "On prépare un diagnostic réel à partir de votre contexte business."
                        : "Preparing a real diagnosis based on your business context."}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          )}

          {!showResult && !isAnalyzing && (
            <AnimatedSection delay={0.1}>
              <div className="card-premium p-7 sm:p-9">
                <div className="mb-6 flex items-center gap-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        index <= step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label className="mb-4 block text-base font-semibold">
                      {steps[step]?.question}
                    </Label>

                    {(steps[step] as { isInput?: boolean })?.isInput ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-xl border border-border p-3.5 focus-within:border-primary/40">
                          <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <Input
                            type="url"
                            placeholder="https://monsite.fr"
                            value={answers.url}
                            onChange={(event) =>
                              setAnswers({ ...answers, url: event.target.value })
                            }
                            className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isFr
                            ? "Optionnel : cela permet une analyse plus précise."
                            : "Optional: this enables a more precise analysis."}
                        </p>
                      </div>
                    ) : (
                      <RadioGroup
                        value={answers[steps[step]?.key as keyof typeof answers] || ""}
                        onValueChange={(value) =>
                          setAnswers({
                            ...answers,
                            [steps[step]?.key as string]: value,
                          })
                        }
                        className="space-y-2.5"
                      >
                        {steps[step]?.options.map((option) => (
                          <div
                            key={option}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3.5 transition-all hover:border-primary/30"
                          >
                            <RadioGroupItem value={option} id={`q${step}-${option}`} />
                            <Label htmlFor={`q${step}-${option}`} className="flex-1 cursor-pointer text-sm">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    {isFr ? "Retour" : "Back"}
                  </Button>
                  <Button size="sm" onClick={next} disabled={!canProceed()}>
                    {step === steps.length - 1 ? (
                      <>
                        {isFr ? "Analyser" : "Analyze"}
                        <Search className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {isFr ? "Suivant" : "Next"}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          )}

          {showResult && !isAnalyzing && (
            <AnimatedSection delay={0.1}>
              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card relative overflow-hidden p-7 sm:p-8"
                  >
                    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
                    <div className="relative flex items-center gap-5">
                      <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                        <span
                          className={`text-2xl font-extrabold ${
                            diagnosis ? scoreColor(diagnosis.score_global) : "text-primary"
                          }`}
                        >
                          {isRealDiagnosis ? (
                            <AnimatedCounter value={diagnosis!.score_global} duration={1400} />
                          ) : (
                            <Target className="h-7 w-7 text-primary" />
                          )}
                        </span>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {isRealDiagnosis
                            ? isFr
                              ? "Diagnostic réel"
                              : "Real diagnosis"
                            : isFr
                              ? "Orientation simple"
                              : "Simple direction"}
                        </p>
                        <h3 className="text-2xl font-bold">
                          {isRealDiagnosis
                            ? isFr
                              ? "Votre situation actuelle"
                              : "Your current position"
                            : isFr
                              ? "Votre meilleure prochaine étape"
                              : "Your best next step"}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {isRealDiagnosis
                            ? diagnosis?.situation
                            : resultMessage ||
                              (isFr
                                ? "On vous guide vers l'offre la plus logique sans afficher de faux audit."
                                : "We guide you toward the right offer without showing a fake audit.")}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {isRealDiagnosis ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="glass-card p-7 sm:p-8"
                      >
                        <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                          {isFr ? "Points à améliorer" : "Areas to improve"}
                        </p>
                        <div className="space-y-3">
                          {(diagnosis?.problemes || []).map((item) => (
                            <div key={item} className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-400/10 text-orange-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </div>
                              <p className="text-sm text-muted-foreground">{item}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16 }}
                        className="glass-card p-7 sm:p-8"
                      >
                        <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          <Lightbulb className="h-3.5 w-3.5 text-primary" />
                          {isFr ? "Plan d'action recommandé" : "Recommended action plan"}
                        </p>
                        <div className="space-y-3">
                          {(diagnosis?.plan_action || []).map((item, index) => (
                            <div key={item} className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </div>
                              <p className="text-sm text-foreground">{item}</p>
                            </div>
                          ))}
                        </div>
                        {diagnosis?.resultat_attendu && (
                          <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                            <p className="flex items-start gap-2 text-sm font-medium text-green-400">
                              <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" />
                              {diagnosis.resultat_attendu}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 }}
                      className="glass-card p-7 sm:p-8"
                    >
                      <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <Lightbulb className="h-3.5 w-3.5 text-primary" />
                        {isFr ? "Ce qu'on vous recommande maintenant" : "What we recommend now"}
                      </p>
                      <div className="space-y-3">
                        {[
                          isFr
                            ? "Valider rapidement l'offre et le message principal."
                            : "Quickly validate the offer and primary message.",
                          isFr
                            ? "Générer une première base crédible, puis l'ajuster."
                            : "Generate a credible first version, then refine it.",
                          isFr
                            ? "Publier vite, puis connecter le domaine une fois le message validé."
                            : "Publish quickly, then connect the domain once the message is validated.",
                        ].map((item, index) => (
                          <div key={item} className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {index + 1}
                            </div>
                            <p className="text-sm text-foreground">{item}</p>
                          </div>
                        ))}
                      </div>
                      {showFallbackGuidance && (
                        <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-4">
                          <p className="text-sm text-muted-foreground">{resultMessage}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="glass-card gradient-border p-7 sm:p-8"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {isFr ? "Recommandation Pixelrises" : "Pixelrises recommendation"}
                      </p>
                      <h3 className="text-2xl font-bold">
                        {recommendedOffer} - {offer.price}€
                      </h3>
                    </div>
                  </div>

                  <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                      <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      {isRealDiagnosis ? diagnosis?.raison_offre || budgetReason : budgetReason}
                    </p>
                  </div>

                  {isRealDiagnosis && diagnosis?.raison_offre && (
                    <p className="mb-5 text-sm italic text-muted-foreground">
                      "{diagnosis.raison_offre}"
                    </p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/25 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {isFr
                          ? "Le but n'est pas de choisir l'offre la moins chère, mais celle qui vous donne le meilleur raccourci vers un site utile et vendable."
                          : "The goal is not to choose the cheapest offer, but the one that gives you the best shortcut to a useful, sellable website."}
                      </p>
                    </div>

                    <Button asChild size="lg" className="w-full glow-primary">
                      <a href={offer.link} target="_blank" rel="noopener noreferrer">
                        {isFr ? "Passer à l'étape suivante" : "Move to the next step"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>

                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {isFr ? "Discuter du projet" : "Discuss the project"}
                      </a>
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button asChild variant="ghost" size="sm" className="text-xs">
                        <a href="https://demo.pixelrises.fr/" target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          {isFr ? "Voir un exemple" : "See an example"}
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={restart}>
                        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                        {isFr ? "Recommencer" : "Start over"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecommendationModule;


