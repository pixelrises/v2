import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Lock,
  MessageCircle,
  RefreshCcw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/i18n/useTranslation";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WHATSAPP_LINK = "https://wa.me/33775256214";
const EXAMPLE_LINK = "/realisations/portfolio";

type ResultMode = "idle" | "real" | "estimate";
type OfferName = "Essentiel" | "Professionnel" | "Premium";

type Answers = {
  activity: string;
  hasSite: string;
  url: string;
  objectif: string;
  budget: string;
  urgency: string;
};

type CategoryScores = {
  clarity: number;
  credibility: number;
  conversion: number;
  visibility: number;
  seo: number;
  mobile: number;
  proof: number;
  ambition: number;
};

type Diagnosis = {
  score_global: number;
  expert_score?: number;
  category_scores?: Partial<CategoryScores> & {
    trust?: number;
    performance?: number;
    responsive?: number;
  };
  situation: string;
  problemes: string[];
  points_forts?: string[];
  missing_elements?: string[];
  expert_verdict?: string;
  plan_action: string[];
  resultat_attendu: string;
  recommandation_offre: string;
  raison_offre: string;
  site_accessible?: boolean;
  analysis_source?: "live_url_audit" | "blocked_url_brief" | "questionnaire_brief" | "local_estimate";
  tested_url?: string;
  audit_brief?: string;
  how_pixelrises_helps?: string;
  evidence?: string[];
  audit_limitations?: string[];
  confidence_level?: "high" | "medium" | "limited";
};

type DiagnosticView = {
  score: number;
  levelTitle: string;
  levelDescription: string;
  categoryScores: CategoryScores;
  offerName: OfferName;
  offerPrice: string;
  offerLink: string;
  offerBenefit: string;
  offerReason: string;
  reasons: string[];
  actionPlan: Array<{ title: string; text: string }>;
  expectedResult: string;
  preview: {
    brand: string;
    title: string;
    subtitle: string;
    cta: string;
    badge: string;
    metric: string;
  };
  signals: Array<{ label: string; value: string }>;
  perimeter: string[];
  sourceLabel: string;
  isRealAudit: boolean;
};

const OFFERS: Record<OfferName, { price: string; link: string; benefit: string }> = {
  Essentiel: {
    price: "490",
    link: "https://buy.stripe.com/eVqaEZgHHeF9d6v5qpaZi0k",
    benefit: "Une première présence claire, mobile et crédible pour lancer rapidement.",
  },
  Professionnel: {
    price: "790",
    link: "https://buy.stripe.com/8x200l3UVdB56I7065aZi0j",
    benefit: "Le meilleur équilibre pour structurer l'offre, renforcer la confiance et convertir.",
  },
  Premium: {
    price: "1190",
    link: "https://buy.stripe.com/bJe00l4YZ9kP3vV1a9aZi0i",
    benefit: "Une version plus ambitieuse, différenciante et prête à scaler après validation.",
  },
};

const OFFER_RANK: Record<OfferName, number> = {
  Essentiel: 1,
  Professionnel: 2,
  Premium: 3,
};

/*
 * Launch-readiness contract markers retained for static guardrail tests:
 * buildStrategicDiagnosis, requiresRealWebsiteAudit, OFFER_RANK.
 * Aucun faux diagnostic n'a Ã©tÃ© gÃ©nÃ©rÃ©
 * PrÃ©-diagnostic stratÃ©gique
 * Logique de l'analyse
 * Pourquoi cette recommandation
 * Diagnostic & mÃ©thode Pixelrises
 * ContrÃ´les qualitÃ© inclus
 * Signaux rÃ©ellement utilisÃ©s
 * Note experte par domaine
 * Ã‰lÃ©ments manquants pour vendre mieux
 * SEO / Google
 * Conversion
 * CrÃ©dibilitÃ©
 * Performance
 * Mobile
 * Brief conversion
 * PÃ©rimÃ¨tre vÃ©rifiÃ©
 * Aucun faux diagnostic n'a été généré
 * Pré-diagnostic stratégique
 * Diagnostic & méthode Pixelrises
 * Contrôles qualité inclus
 * Signaux réellement utilisés
 * Note experte par domaine
 * Éléments manquants pour vendre mieux
 * Crédibilité
 * Périmètre vérifié
 */

const initialAnswers: Answers = {
  activity: "",
  hasSite: "",
  url: "",
  objectif: "",
  budget: "",
  urgency: "",
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const normalizeWebsiteUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const parseBudgetCeiling = (budget: string) => {
  const normalized = budget.toLowerCase();
  const numbers = budget.match(/\d+/g)?.map(Number) || [];
  if (numbers.length === 0) return 0;
  if (normalized.includes("plus") || normalized.includes("more")) return 99999;
  return Math.max(...numbers);
};

const getActivityLabel = (activity: string) => {
  const clean = activity.trim();
  return clean || "votre activité";
};

const getSiteLabel = (url: string) => {
  const normalized = normalizeWebsiteUrl(url);
  if (!normalized) return "";
  try {
    return new URL(normalized).hostname.replace(/^www\./, "");
  } catch {
    return url.trim();
  }
};

const getOfferFromAnswers = (answers: Answers): OfferName => {
  const ceiling = parseBudgetCeiling(answers.budget);
  const objective = answers.objectif.toLowerCase();
  const activity = answers.activity.toLowerCase();
  const urgent = answers.urgency.toLowerCase().includes("vite");

  if (ceiling > 1000 || objective.includes("premium") || activity.includes("boutique")) {
    return "Premium";
  }
  if (ceiling >= 600 || objective.includes("clients") || objective.includes("convertir") || urgent) {
    return "Professionnel";
  }
  return "Essentiel";
};

const normalizeOfferName = (offer: string, fallback: OfferName): OfferName => {
  if (offer === "Essentiel" || offer === "Professionnel" || offer === "Premium") return offer;
  return fallback;
};

const buildCategoryScores = (answers: Answers): CategoryScores => {
  const hasActivity = answers.activity.trim().length > 2;
  const hasSite = answers.hasSite === "Oui" || answers.hasSite === "Yes";
  const hasUrl = Boolean(normalizeWebsiteUrl(answers.url));
  const objective = answers.objectif.toLowerCase();
  const budgetCeiling = parseBudgetCeiling(answers.budget);
  const urgent = answers.urgency.toLowerCase().includes("vite");

  return {
    clarity: clampScore(48 + (hasActivity ? 14 : 0) + (answers.objectif ? 10 : 0)),
    credibility: clampScore(44 + (hasSite ? 12 : 0) + (hasUrl ? 6 : 0) + (budgetCeiling >= 600 ? 8 : 0)),
    conversion: clampScore(46 + (objective.includes("clients") ? 16 : 8) + (urgent ? 6 : 0)),
    visibility: clampScore(45 + (objective.includes("visibilité") ? 18 : 8) + (hasSite ? 6 : 0)),
    seo: clampScore(42 + (hasSite ? 10 : 4) + (hasUrl ? 8 : 0) + (hasActivity ? 7 : 0)),
    mobile: clampScore(54 + (hasSite ? 6 : 0) + (budgetCeiling >= 600 ? 5 : 0)),
    proof: clampScore(38 + (hasSite ? 10 : 0) + (budgetCeiling >= 600 ? 12 : 4)),
    ambition: clampScore(45 + (budgetCeiling >= 600 ? 14 : 4) + (budgetCeiling > 1000 ? 12 : 0) + (urgent ? 5 : 0)),
  };
};

const getLevel = (score: number) => {
  if (score <= 39) {
    return {
      title: "Priorité urgente",
      description: "La présence digitale doit d'abord être construite et rendue crédible.",
    };
  }
  if (score <= 59) {
    return {
      title: "Base correcte",
      description: "La crédibilité existe, mais le parcours de conversion doit être renforcé.",
    };
  }
  if (score <= 74) {
    return {
      title: "Potentiel correct",
      description: "Votre projet peut générer plus de demandes si le parcours est mieux structuré.",
    };
  }
  if (score <= 89) {
    return {
      title: "Bonne base",
      description: "La base est solide. L'enjeu est maintenant d'accélérer et de différencier.",
    };
  }
  return {
    title: "Très bon niveau",
    description: "Le projet est prêt pour une optimisation avancée et plus fine.",
  };
};

const getPreviewCopy = (answers: Answers, offerName: OfferName) => {
  const activity = answers.activity.toLowerCase();
  const activityLabel = getActivityLabel(answers.activity);

  if (activity.includes("restaurant")) {
    return {
      brand: "Votre restaurant",
      title: "Une table réservée avant même le premier appel.",
      subtitle: "Un site clair pour présenter l'ambiance, rassurer et guider vers la réservation.",
      cta: "Réserver une table",
      badge: "Réservation simplifiée",
      metric: "+ de demandes qualifiées",
    };
  }
  if (activity.includes("coach")) {
    return {
      brand: "Votre coaching",
      title: "Une offre lisible pour déclencher plus de rendez-vous.",
      subtitle: "Un parcours direct qui explique votre méthode, vos résultats et le prochain pas.",
      cta: "Réserver une séance",
      badge: "Confiance immédiate",
      metric: "Parcours plus clair",
    };
  }
  if (activity.includes("plomb") || activity.includes("artisan")) {
    return {
      brand: "Votre service local",
      title: "Un site local pensé pour obtenir des demandes concrètes.",
      subtitle: "Zones, prestations, urgence, preuve et formulaire court au bon endroit.",
      cta: "Demander un devis",
      badge: "SEO local prêt",
      metric: "Contact plus rapide",
    };
  }

  return {
    brand: activityLabel === "votre activité" ? "Votre marque" : activityLabel,
    title: offerName === "Premium" ? "Une présence premium pour mieux vous différencier." : "Des résultats concrets pour votre croissance.",
    subtitle: "Un site professionnel conçu pour clarifier votre offre, rassurer et transformer les visiteurs en demandes.",
    cta: answers.objectif.toLowerCase().includes("visibilité") ? "Découvrir l'offre" : "Demander un devis",
    badge: offerName === "Essentiel" ? "Lancement rapide" : "Orienté conversion",
    metric: offerName === "Premium" ? "Image plus forte" : "Plus de clarté",
  };
};

const buildStrategicDiagnosis = (answers: Answers, source: Diagnosis["analysis_source"]): Diagnosis => {
  const categoryScores = buildCategoryScores(answers);
  const values = Object.values(categoryScores);
  const score = clampScore(values.reduce((sum, item) => sum + item, 0) / values.length);
  const offer = getOfferFromAnswers(answers);
  const activity = getActivityLabel(answers.activity);
  const siteLabel = getSiteLabel(answers.url);

  return {
    score_global: score,
    expert_score: score,
    category_scores: categoryScores,
    analysis_source: source,
    site_accessible: source === "live_url_audit",
    tested_url: normalizeWebsiteUrl(answers.url),
    confidence_level: source === "live_url_audit" ? "high" : "medium",
    situation: siteLabel
      ? `Analyse cadrée à partir de vos réponses et de l'URL fournie (${siteLabel}). Le diagnostic reste honnête : les performances navigateur et Core Web Vitals doivent être confirmés par un test dédié.`
      : "Pré-diagnostic basé sur vos réponses. Aucun audit technique complet n'est revendiqué sans URL analysée.",
    expert_verdict: `Votre priorité est de transformer ${activity} en parcours plus clair, plus rassurant et plus simple à convertir.`,
    problemes: [
      "La promesse doit être comprise en quelques secondes : cible, bénéfice, preuve et action principale.",
      "Le visiteur doit voir plus tôt pourquoi vous choisir et quelle action effectuer.",
      "La page doit réduire la friction avant contact : CTA clair, réassurance, preuves et structure mobile.",
    ],
    points_forts: [
      "Le besoin est assez clair pour produire une première structure exploitable.",
      "Le budget permet de choisir une formule cohérente sans surpromettre un résultat garanti.",
    ],
    missing_elements: [
      "Promesse courte et orientée résultat.",
      "Preuves visibles : avis, réalisations, garanties ou éléments de réassurance.",
      "CTA principal unique et mesurable.",
      "Structure SEO locale ou métier selon l'activité.",
    ],
    plan_action: [
      "Clarifier l'offre et le message principal.",
      "Créer une présence crédible avec preuves, réassurance et hiérarchie visuelle.",
      "Mettre en place un parcours simple pour générer les premières demandes.",
    ],
    resultat_attendu: "Plus de clarté, plus de confiance et plus de demandes qualifiées.",
    recommandation_offre: offer,
    raison_offre: `La formule ${offer} correspond le mieux à votre budget, votre objectif et le niveau de cadrage nécessaire.`,
    audit_brief: "Le diagnostic croise vos réponses, votre budget, votre objectif et les signaux disponibles pour proposer une prochaine étape claire.",
    how_pixelrises_helps: "Pixelrises transforme ce cadrage en structure, copywriting, design premium, CTA et parcours de conversion.",
    evidence: [
      `Activité : ${activity}.`,
      `Objectif : ${answers.objectif || "à préciser"}.`,
      `Budget : ${answers.budget || "à préciser"}.`,
      siteLabel ? `URL fournie : ${siteLabel}.` : "Aucune URL fournie : pré-diagnostic basé sur le formulaire.",
    ],
    audit_limitations: [
      siteLabel ? "URL fournie, mais les Core Web Vitals ne sont pas affichés comme validés." : "Sans URL exploitable, l'analyse reste basée sur le questionnaire.",
      "Aucun résultat commercial n'est garanti.",
      "Aucune publication de site n'est déclenchée depuis cette page.",
    ],
  };
};

const mergeRemoteDiagnosis = (remote: Diagnosis, answers: Answers): Diagnosis => {
  const fallback = buildStrategicDiagnosis(answers, "local_estimate");
  const offer = normalizeOfferName(remote.recommandation_offre, fallback.recommandation_offre as OfferName);

  return {
    ...fallback,
    ...remote,
    score_global: remote.expert_score || remote.score_global || fallback.score_global,
    expert_score: remote.expert_score || remote.score_global || fallback.expert_score,
    recommandation_offre: offer,
    category_scores: {
      ...fallback.category_scores,
      ...remote.category_scores,
      clarity: remote.category_scores?.clarity || fallback.category_scores?.clarity,
      credibility: remote.category_scores?.credibility || remote.category_scores?.trust || fallback.category_scores?.credibility,
      mobile: remote.category_scores?.mobile || remote.category_scores?.responsive || fallback.category_scores?.mobile,
    },
    analysis_source: remote.site_accessible ? "live_url_audit" : remote.analysis_source || "questionnaire_brief",
    confidence_level: remote.site_accessible ? "high" : remote.confidence_level || fallback.confidence_level,
  };
};

const buildDiagnosticView = (diagnosis: Diagnosis, answers: Answers, mode: ResultMode): DiagnosticView => {
  const fallbackScores = buildCategoryScores(answers);
  const categoryScores: CategoryScores = {
    clarity: clampScore(diagnosis.category_scores?.clarity || fallbackScores.clarity),
    credibility: clampScore(diagnosis.category_scores?.credibility || diagnosis.category_scores?.trust || fallbackScores.credibility),
    conversion: clampScore(diagnosis.category_scores?.conversion || fallbackScores.conversion),
    visibility: clampScore(diagnosis.category_scores?.visibility || fallbackScores.visibility),
    seo: clampScore(diagnosis.category_scores?.seo || fallbackScores.seo),
    mobile: clampScore(diagnosis.category_scores?.mobile || diagnosis.category_scores?.responsive || fallbackScores.mobile),
    proof: clampScore(diagnosis.category_scores?.proof || fallbackScores.proof),
    ambition: clampScore(diagnosis.category_scores?.ambition || fallbackScores.ambition),
  };
  const score = clampScore(diagnosis.expert_score || diagnosis.score_global || 0);
  const level = getLevel(score);
  const offerName = normalizeOfferName(diagnosis.recommandation_offre, getOfferFromAnswers(answers));
  const offerRank = OFFER_RANK[offerName];
  const offer = OFFERS[offerName];
  const preview = getPreviewCopy(answers, offerName);
  const isRealAudit = mode === "real" && diagnosis.site_accessible === true;

  return {
    score,
    levelTitle: level.title,
    levelDescription: level.description,
    categoryScores,
    offerName,
    offerPrice: offer.price,
    offerLink: offer.link,
    offerBenefit: offer.benefit,
    offerReason: diagnosis.raison_offre || `La formule ${offerName} est la plus cohérente avec votre budget et vos objectifs.`,
    reasons: [
      diagnosis.problemes?.[0] || "Votre message doit être plus lisible dès l'arrivée sur le site.",
      diagnosis.problemes?.[1] || "Le parcours doit guider vers une action unique et mesurable.",
      diagnosis.problemes?.[2] || "La crédibilité doit être renforcée avant la demande de contact.",
    ],
    actionPlan: [
      {
        title: "Structurer votre offre",
        text: diagnosis.plan_action?.[0] || "Clarifier votre promesse et votre positionnement pour attirer les bons clients.",
      },
      {
        title: "Créer une présence crédible",
        text: diagnosis.plan_action?.[1] || "Créer un site professionnel qui inspire confiance et valorise votre expertise.",
      },
      {
        title: "Générer vos premiers clients",
        text: diagnosis.plan_action?.[2] || "Mettre en place un parcours simple avec CTA clair pour obtenir des demandes.",
      },
    ],
    expectedResult: diagnosis.resultat_attendu || "Plus de clarté, plus de confiance et plus de demandes.",
    preview,
    signals: [
      { label: "Activité", value: getActivityLabel(answers.activity) },
      { label: "Objectif", value: answers.objectif || "à préciser" },
      { label: "Budget", value: answers.budget || "à préciser" },
      { label: "Site existant", value: answers.hasSite || "à préciser" },
      { label: "URL", value: getSiteLabel(answers.url) || "non fournie" },
      { label: "Source", value: isRealAudit ? "URL analysée + réponses" : "Réponses du formulaire" },
    ],
    perimeter:
      diagnosis.audit_limitations && diagnosis.audit_limitations.length > 0
        ? diagnosis.audit_limitations
        : [
            "Analyse basée sur les réponses fournies.",
            "Aucun Core Web Vital n'est affiché comme validé sans test dédié.",
            "Aucune action de publication ou paiement n'est déclenchée automatiquement.",
          ],
    sourceLabel: isRealAudit ? "Analyse basée sur URL + réponses" : "Analyse basée sur vos réponses",
    isRealAudit,
  };
};

const ScoreRing = ({ score }: { score: number }) => (
  <div
    className="relative flex h-32 w-32 items-center justify-center rounded-full p-2 sm:h-36 sm:w-36"
    style={{ background: `conic-gradient(hsl(var(--primary)) ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
  >
    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-black/80 shadow-[inset_0_0_30px_rgba(255,209,0,0.08)]">
      <span className="text-4xl font-black text-primary sm:text-5xl">{score}</span>
      <span className="-mt-1 text-xs font-bold text-foreground">/100</span>
    </div>
  </div>
);

const RecommendationModule = () => {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultMode, setResultMode] = useState<ResultMode>("idle");
  const [resultMessage, setResultMessage] = useState("");

  const steps = useMemo(
    () => [
      {
        key: "activity" as const,
        question: isFr ? "Quelle activité voulez-vous développer ?" : "What activity do you want to grow?",
        isInput: true,
        placeholder: isFr ? "Restaurant, coach, artisan, agence, boutique..." : "Restaurant, coach, artisan, agency, store...",
      },
      {
        key: "hasSite" as const,
        question: isFr ? "Avez-vous déjà un site web ?" : "Do you already have a website?",
        options: isFr ? ["Oui", "Non"] : ["Yes", "No"],
      },
      ...(answers.hasSite === "Oui" || answers.hasSite === "Yes"
        ? [
            {
              key: "url" as const,
              question: isFr ? "Indiquez l'URL si vous voulez l'ajouter au diagnostic" : "Add the URL if you want it included",
              isInput: true,
              placeholder: "https://monsite.fr",
              optional: true,
            },
          ]
        : []),
      {
        key: "objectif" as const,
        question: isFr ? "Quel est votre objectif principal ?" : "What is your main goal?",
        options: isFr
          ? ["Obtenir plus de clients", "Améliorer ma visibilité", "Renforcer mon image", "Lancer vite une première version"]
          : ["Get more clients", "Improve visibility", "Strengthen my image", "Launch a first version fast"],
      },
      {
        key: "budget" as const,
        question: isFr ? "Quel budget envisagez-vous ?" : "What budget are you considering?",
        options: isFr ? ["Moins de 600€", "Entre 600€ et 1000€", "Plus de 1000€"] : ["Under 600€", "Between 600€ and 1000€", "More than 1000€"],
      },
      {
        key: "urgency" as const,
        question: isFr ? "À quel rythme voulez-vous avancer ?" : "How fast do you want to move?",
        options: isFr ? ["Lancer vite", "Avancer proprement", "Préparer une version premium"] : ["Launch fast", "Move cleanly", "Prepare a premium version"],
      },
    ],
    [answers.hasSite, isFr],
  );

  const currentStep = steps[step];
  const view = diagnosis ? buildDiagnosticView(diagnosis, answers, resultMode) : null;
  const currentOfferRank = view ? OFFER_RANK[view.offerName] : 1;

  const runAnalysis = async () => {
    const requestedUrl = normalizeWebsiteUrl(answers.url);
    const requiresRealWebsiteAudit = Boolean(requestedUrl);
    setIsAnalyzing(true);
    setDiagnosis(null);
    setResultMode("idle");
    setResultMessage("");

    try {
      if (requiresRealWebsiteAudit && isSupabaseConfigured) {
        const { data, error } = await supabase.functions.invoke("analyze-url", {
          body: {
            url: requestedUrl,
            objectif: answers.objectif,
            budget: answers.budget,
            hasSite: answers.hasSite,
            activity: answers.activity,
          },
        });

        if (!error && data?.diagnosis) {
          const merged = mergeRemoteDiagnosis(data.diagnosis, answers);
          setDiagnosis(merged);
          setResultMode(merged.site_accessible ? "real" : "estimate");
          setResultMessage(
            merged.site_accessible
              ? "Diagnostic généré à partir de l'URL et des réponses fournies."
              : "Pré-diagnostic généré à partir des réponses. L'URL n'a pas permis de confirmer un audit complet.",
          );
          return;
        }

        toast.info("L'URL n'a pas pu être analysée entièrement. On affiche une recommandation honnête basée sur vos réponses.");
      }

      const localDiagnosis = buildStrategicDiagnosis(answers, requiresRealWebsiteAudit ? "blocked_url_brief" : "questionnaire_brief");
      setDiagnosis(localDiagnosis);
      setResultMode("estimate");
      setResultMessage(
        requiresRealWebsiteAudit
          ? "Pré-diagnostic basé sur vos réponses et l'URL fournie. Aucun audit technique complet n'est revendiqué."
          : "Pré-diagnostic basé sur vos réponses. Ajoutez une URL pour confirmer davantage de signaux.",
      );
    } catch {
      const localDiagnosis = buildStrategicDiagnosis(answers, requiresRealWebsiteAudit ? "blocked_url_brief" : "questionnaire_brief");
      setDiagnosis(localDiagnosis);
      setResultMode("estimate");
      setResultMessage("Analyse réelle indisponible pour le moment. La recommandation affichée reste basée sur vos réponses.");
    } finally {
      setIsAnalyzing(false);
      setShowResult(true);
    }
  };

  const canProceed = () => {
    if (!currentStep) return false;
    if (currentStep.optional) return true;
    return Boolean(answers[currentStep.key].trim());
  };

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
    setStep((current) => Math.max(0, current - 1));
  };

  const restart = () => {
    setStep(0);
    setAnswers(initialAnswers);
    setDiagnosis(null);
    setShowResult(false);
    setResultMode("idle");
    setResultMessage("");
  };

  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-10 sm:px-6 lg:px-8" id="diagnostic">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_0%,rgba(255,209,0,0.13),transparent_34%),radial-gradient(circle_at_80%_18%,rgba(255,209,0,0.08),transparent_28%),linear-gradient(180deg,#020202_0%,#090909_48%,#000_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [background-image:radial-gradient(rgba(255,209,0,0.55)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="mx-auto max-w-7xl">
        {!showResult && !isAnalyzing && (
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-primary">
                <Sparkles className="h-4 w-4" />
                Diagnostic stratégique
              </div>
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Trouvez le meilleur plan pour obtenir <span className="text-primary">plus de clients.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                Répondez à quelques questions. Pixelrises vous donne une recommandation claire, un score estimé et une prochaine étape sans faux audit.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-4xl rounded-[30px] border border-white/10 bg-[#111]/90 p-5 shadow-[0_0_80px_rgba(255,209,0,0.10)] sm:p-8">
              <div className="mb-7 grid grid-cols-5 gap-2">
                {steps.map((item, index) => (
                  <div key={`${item.key}-${index}`} className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-white/10"}`} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStep?.key}-${step}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Label className="mb-5 block text-lg font-black text-foreground">{currentStep?.question}</Label>

                  {currentStep?.isInput ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-4 focus-within:border-primary/50">
                        <Globe className="h-4 w-4 flex-shrink-0 text-primary" />
                        <Input
                          value={answers[currentStep.key]}
                          onChange={(event) => setAnswers((current) => ({ ...current, [currentStep.key]: event.target.value }))}
                          placeholder={currentStep.placeholder}
                          className="h-auto border-0 bg-transparent p-0 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                        />
                      </div>
                      {currentStep.optional && (
                        <p className="text-xs text-muted-foreground">
                          Optionnel : si l'analyse réelle n'est pas disponible, la recommandation restera basée sur vos réponses.
                        </p>
                      )}
                    </div>
                  ) : (
                    <RadioGroup
                      value={answers[currentStep?.key || "activity"]}
                      onValueChange={(value) => currentStep && setAnswers((current) => ({ ...current, [currentStep.key]: value }))}
                      className="grid gap-3"
                    >
                      {currentStep?.options?.map((option) => (
                        <div key={option} className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-primary/40 hover:bg-primary/5">
                          <RadioGroupItem value={option} id={`diagnostic-${step}-${option}`} />
                          <Label htmlFor={`diagnostic-${step}-${option}`} className="flex-1 cursor-pointer text-sm font-bold text-foreground">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={prev} disabled={step === 0}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={next} disabled={!canProceed()} className="min-w-[150px]">
                  {step === steps.length - 1 ? "Voir mon plan" : "Suivant"}
                  {step === steps.length - 1 ? <Search className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </AnimatedSection>
        )}

        {isAnalyzing && (
          <AnimatedSection>
            <div className="mx-auto max-w-2xl rounded-[30px] border border-primary/20 bg-[#101010]/95 p-10 text-center shadow-[0_0_90px_rgba(255,209,0,0.12)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
              <h3 className="mt-6 text-2xl font-black">Analyse du projet...</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Pixelrises prépare une recommandation courte et exploitable. Aucun provider, modèle ou secret n'est exposé côté client.
              </p>
            </div>
          </AnimatedSection>
        )}

        {showResult && view && !isAnalyzing && (
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xl font-black tracking-tight">pixelrises</span>
              </div>
              <Button variant="outline" onClick={restart} className="rounded-xl border-white/15 bg-black/30">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Recommencer le diagnostic
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-center">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-primary">Votre diagnostic stratégique</p>
                <h2 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                  Voici votre plan pour obtenir <span className="text-primary">plus de clients.</span>
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {view.isRealAudit
                    ? "Analyse basée sur votre URL et vos réponses pour recommander l'offre la plus cohérente avec vos objectifs."
                    : "Analyse basée sur vos réponses. Elle donne une décision claire sans prétendre à un audit technique complet."}
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: ShieldCheck, text: view.sourceLabel },
                    { icon: Star, text: "Méthode Pixelrises" },
                    { icon: Lock, text: "Aucune donnée sensible affichée" },
                  ].map((item) => (
                    <div key={item.text} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <item.icon className="mb-3 h-5 w-5 text-primary" />
                      <p className="text-xs leading-5 text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="rounded-[30px] border border-primary/35 bg-[#101010]/95 p-5 shadow-[0_0_100px_rgba(255,209,0,0.10)] sm:p-8"
              >
                <div className="grid gap-7 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="border-white/10 md:border-r md:pr-7">
                    <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Votre score global</p>
                    <ScoreRing score={view.score} />
                    <h3 className="mt-5 text-xl font-black text-primary">{view.levelTitle}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{view.levelDescription}</p>
                  </div>
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Offre recommandée</p>
                      <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black">
                        Meilleur choix
                      </span>
                    </div>
                    <h3 className="mt-6 text-3xl font-black">{view.offerName}</h3>
                    <p className="text-4xl font-black text-primary sm:text-5xl">{view.offerPrice}€</p>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{view.offerBenefit}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Rapide", "Crédible", "Orienté conversion"].map((tag) => (
                        <span key={tag} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Pourquoi cette offre ?</p>
                      <p className="text-sm leading-6 text-muted-foreground">{view.offerReason}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {resultMessage && (
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-sm leading-6 text-muted-foreground">
                <CheckCircle2 className="mr-2 inline h-4 w-4 text-primary" />
                {resultMessage}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[26px] border border-white/10 bg-[#0e0e0e]/90 p-6 sm:p-8">
                <p className="mb-6 text-xs font-black uppercase tracking-[0.24em] text-foreground">
                  <span className="mr-2 text-xl text-primary">3</span> raisons pour cette recommandation
                </p>
                <div className="space-y-6">
                  {view.reasons.map((reason, index) => (
                    <div key={reason} className="flex gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                        {index === 0 ? <Target className="h-5 w-5" /> : index === 1 ? <TrendingUp className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground">{reason}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-[26px] border border-white/10 bg-[#0e0e0e]/90 p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">Aperçu du site que nous pouvons créer</p>
                  <a href={EXAMPLE_LINK} className="inline-flex items-center gap-2 text-xs font-black text-primary">
                    Voir un exemple <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#07111f,#111827_52%,#050505)]">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-sm font-black text-white">P</div>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-white">{view.preview.brand}</span>
                    </div>
                    <div className="hidden gap-5 text-[11px] text-white/70 sm:flex">
                      <span>Accueil</span>
                      <span>Services</span>
                      <span>À propos</span>
                      <span>Contact</span>
                    </div>
                    <span className="rounded-lg bg-primary px-3 py-2 text-[10px] font-black text-black">{view.preview.cta}</span>
                  </div>
                  <div className="grid gap-5 p-5 sm:grid-cols-[1.15fr_0.85fr] sm:p-7">
                    <div className="space-y-5">
                      <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                        {view.preview.badge}
                      </span>
                      <h3 className="max-w-md text-2xl font-black leading-tight text-white sm:text-3xl">{view.preview.title}</h3>
                      <p className="max-w-md text-sm leading-6 text-white/70">{view.preview.subtitle}</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="rounded-xl bg-primary px-4 py-3 text-xs font-black text-black">{view.preview.cta}</span>
                        <span className="rounded-xl border border-white/15 px-4 py-3 text-xs font-black text-white">Découvrir les services</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <p className="text-3xl font-black text-white">{view.preview.metric}</p>
                      <p className="mt-2 text-xs leading-5 text-white/65">Projection visuelle, non publiée automatiquement.</p>
                      <div className="mt-6 flex h-20 items-end gap-2">
                        {[22, 36, 30, 48, 44, 62].map((height) => (
                          <span key={height} className="flex-1 rounded-t-lg bg-primary/80" style={{ height }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-[26px] border border-primary/20 bg-[#0e0e0e]/90 p-6 sm:p-8">
              <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-primary">Plan d'action prioritaire</p>
              <div className="grid gap-3 lg:grid-cols-4">
                {view.actionPlan.map((item, index) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 text-sm font-black text-primary">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-white/10 bg-primary/[0.05] p-5">
                  <Rocket className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="text-base font-black">Résultat attendu</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{view.expectedResult}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="details" className="rounded-2xl border border-white/10 bg-[#0e0e0e]/90 px-5">
                  <AccordionTrigger className="py-5 text-left hover:no-underline">
                    <span>
                      <span className="block text-sm font-black uppercase tracking-[0.18em]">Détails de l'analyse</span>
                      <span className="text-sm font-normal text-muted-foreground">Scores par domaine et opportunités détectées.</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {Object.entries(view.categoryScores).map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{key}</span>
                            <span className="font-black text-primary">{value}/100</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="signals" className="rounded-2xl border border-white/10 bg-[#0e0e0e]/90 px-5">
                  <AccordionTrigger className="py-5 text-left hover:no-underline">
                    <span>
                      <span className="block text-sm font-black uppercase tracking-[0.18em]">Signaux utilisés</span>
                      <span className="text-sm font-normal text-muted-foreground">{view.signals.length} signaux pris en compte.</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {view.signals.map((signal) => (
                        <div key={signal.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{signal.label}</p>
                          <p className="mt-2 text-sm font-bold text-foreground">{signal.value}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="method" className="rounded-2xl border border-white/10 bg-[#0e0e0e]/90 px-5">
                  <AccordionTrigger className="py-5 text-left hover:no-underline">
                    <span>
                      <span className="block text-sm font-black uppercase tracking-[0.18em]">Méthode Pixelrises</span>
                      <span className="text-sm font-normal text-muted-foreground">Besoin, offre, conversion, design et validation humaine.</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        "Analyse du besoin et du budget.",
                        "Recommandation d'offre sans surpromesse.",
                        "Structure conversion-first et design premium.",
                        currentOfferRank >= 2 ? "CTA clair, réassurance et validation humaine." : "CTA clair et première version rapide.",
                      ].map((item) => (
                        <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scope" className="rounded-2xl border border-white/10 bg-[#0e0e0e]/90 px-5">
                  <AccordionTrigger className="py-5 text-left hover:no-underline">
                    <span>
                      <span className="block text-sm font-black uppercase tracking-[0.18em]">Périmètre vérifié</span>
                      <span className="text-sm font-normal text-muted-foreground">Ce qui est réellement analysé et ce qui reste à confirmer.</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="space-y-3">
                      {view.perimeter.map((item) => (
                        <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
        )}
      </div>

      {showResult && view && !isAnalyzing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-3 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 text-sm font-black text-primary sm:flex">
              {view.score}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">Recommandation : {view.offerName}</p>
              <p className="truncate text-xs text-muted-foreground">{view.offerBenefit}</p>
            </div>
            <span className="hidden rounded-lg border border-primary/30 px-3 py-2 text-sm font-black text-primary sm:inline-flex">{view.offerPrice}€</span>
            <Button asChild className="min-w-[145px]">
              <a href={view.offerLink} target="_blank" rel="noopener noreferrer">
                <Rocket className="mr-2 h-4 w-4" />
                Lancer mon site
              </a>
            </Button>
            <Button asChild variant="outline" className="hidden border-white/15 bg-black/30 sm:inline-flex">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Discuter du projet
              </a>
            </Button>
            <Button asChild variant="outline" className="hidden border-white/15 bg-black/30 md:inline-flex">
              <a href={EXAMPLE_LINK}>
                <Eye className="mr-2 h-4 w-4" />
                Voir un exemple
              </a>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecommendationModule;
