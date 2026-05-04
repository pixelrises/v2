import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  CreditCard,
  ExternalLink,
  FolderKanban,
  Gift,
  Globe2,
  History,
  LogIn,
  Menu,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SendHorizontal,
  Settings2,
  Smartphone,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PremiumLoadingAnimation } from "@/components/ai/PremiumLoadingAnimation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { buildAuthRoute, getCurrentRelativeUrl } from "@/lib/auth-redirect";
import { getReadableErrorMessage, reportFrontendError } from "@/lib/monitoring";
import { PUBLIC_ENV } from "@/lib/public-env";
import { sanitizeTextDeep } from "@/lib/text-sanitize";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import pixelrisesLogo from "@/assets/pixelrises-logo.png";

interface FormData {
  businessName: string;
  businessType: string;
  city: string;
  targetAudience: string;
  services: string;
  objective: string;
  positioning: string;
  style: string;
  colors: string;
  cta: string;
  description: string;
}

interface GeneratedContent {
  heroTitle?: string;
  heroSubtitle?: string;
}

type BuilderMessageRole = "user" | "ai";

type BuilderMessage = {
  id: string;
  role: BuilderMessageRole;
  content: string;
  time: string;
  tone?: "default" | "success" | "warning";
};

type BuilderMode = "simple" | "advanced";
type BuilderExecutionMode = "build" | "plan";

type PreviewDevice = "desktop" | "mobile";
type QuickModelKey =
  | "vitrine"
  | "conversion"
  | "tunnel"
  | "local"
  | "modern"
  | "credibility";

type DetectedVision = {
  summary: string;
  chips: string[];
  isActionable: boolean;
};

type FeatureAvailabilityState = "available" | "progress" | "soon";

type SidebarFeatureItem = {
  label: string;
  icon: typeof Sparkles;
  state: FeatureAvailabilityState;
  active?: boolean;
  href?: string;
};

const GENERATION_COST = 3;
const OPTIMIZATION_COST = 5;
const STYLES = ["Moderne", "Minimaliste", "Premium", "\u00c9l\u00e9gant", "Dynamique"];
const POSITIONINGS = ["Accessible", "Professionnel", "Premium"];
const OBJECTIVES = [
  "Attirer des clients",
  "G\u00e9n\u00e9rer des leads",
  "Renforcer la cr\u00e9dibilit\u00e9",
  "Prendre des rendez-vous",
  "Vendre plus",
];

const shellClass =
  "w-full min-w-0 max-w-[calc(100vw_-_2rem)] rounded-[24px] border border-white/10 bg-[#0B0B0B]/95 shadow-[0_24px_70px_-52px_rgba(245,197,66,0.34)] backdrop-blur-xl sm:max-w-full";

const QUICK_MODELS: Array<{
  key: QuickModelKey;
  label: string;
  description: string;
  instruction: string;
}> = [
  {
    key: "vitrine",
    label: "Site vitrine premium",
    description: "Site clair, crédible et vendeur",
    instruction:
      "Rends le site plus premium : hero plus fort, hiérarchie visuelle soignée, réassurance claire, design haut de gamme, CTA visible.",
  },
  {
    key: "conversion",
    label: "Page de vente qui convertit",
    description: "Maximiser les conversions",
    instruction:
      "Structure le site comme une page de vente : promesse forte, bénéfices concrets, objections traitées, preuve sociale et CTA final direct.",
  },
  {
    key: "tunnel",
    label: "Tunnel client complet",
    description: "Parcours client efficace",
    instruction:
      "Ajoute une logique de parcours client claire : découverte, confiance, compréhension de l'offre, passage à l'action.",
  },
  {
    key: "local",
    label: "Site local à fort impact",
    description: "Attirer des clients locaux",
    instruction:
      "Renforce l'ancrage local : ville, zone d'intervention, SEO local, proximité, réassurance et CTA adapté aux clients locaux.",
  },
  {
    key: "modern",
    label: "Design plus moderne",
    description: "Plus d'air, de rythme et de clarté",
    instruction:
      "Améliore le style visuel : design moderne, sections aérées, typographie propre, cartes élégantes, animations légères.",
  },
  {
    key: "credibility",
    label: "Plus de crédibilité",
    description: "Preuves, méthode et confiance",
    instruction:
      "Ajoute davantage de crédibilité : témoignages réalistes, garanties, méthode claire, preuves et éléments de confiance.",
  },
] as const;

const SIDEBAR_FEATURES: SidebarFeatureItem[] = [
  { label: "G\u00e9n\u00e9rateur IA", icon: Sparkles, state: "available", active: true, href: "/ai" },
  { label: "Mes projets", icon: FolderKanban, state: "available", href: "/dashboard?tab=sites" },
  { label: "Templates", icon: Globe2, state: "progress" },
  { label: "Historique", icon: History, state: "soon" },
  { label: "Agents IA", icon: Bot, state: "soon" },
  { label: "Automatisations", icon: Workflow, state: "progress" },
  { label: "R\u00e9sultats", icon: BarChart3, state: "progress" },
  { label: "Int\u00e9grations", icon: Zap, state: "soon" },
  { label: "Facturation", icon: CreditCard, state: "progress" },
  { label: "Param\u00e8tres", icon: Settings2, state: "soon" },
];

const getFeatureStateLabel = (state: FeatureAvailabilityState) =>
  state === "progress" ? "En cours" : state === "soon" ? "Bient\u00f4t disponible" : "Disponible";

const DEVELOPMENT_BADGE_LABEL = "Bientôt";
const DEVELOPMENT_BADGE_CLASS =
  "rounded-md border border-[rgba(212,175,55,0.10)] bg-[rgba(255,216,77,0.06)] px-1.5 py-0.5 text-[9px] font-medium text-[#D8BC63]";
const DEVELOPMENT_SURFACE_CLASS =
  "border border-[rgba(255,255,255,0.04)] bg-[#121212] text-white/60 opacity-70";
const BUILDER_DRAFT_KEY = "pixelrises-ai-builder-draft-v1";

const buildFeatureInfoCopy = (label: string, state: FeatureAvailabilityState) => ({
  title: label,
  badge: getFeatureStateLabel(state),
  description:
    state === "progress"
      ? "Cette fonctionnalit\u00e9 est en cours de d\u00e9veloppement. Elle sera branch\u00e9e proprement d\u00e8s que le flux complet sera pr\u00eat."
      : "Cette fonctionnalit\u00e9 arrive bient\u00f4t sur Pixelrises. Elle sera ajout\u00e9e sans casser le cockpit actuel.",
});

const getDisplayName = (user: User | null) => {
  const metadata = user?.user_metadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
    user?.email?.split("@")[0],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
    }
  }

  return "Client Pixelrises";
};

const formatBuilderTime = () =>
  new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function getSafeRelativeTime(value?: string | null) {
  if (!value) return "Date inconnue";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Date inconnue";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 30) return `Il y a ${diffDays} jours`;

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const createBuilderMessage = (
  role: BuilderMessageRole,
  content: string,
  tone: BuilderMessage["tone"] = "default",
): BuilderMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  time: formatBuilderTime(),
  tone,
});

const defaultForm: FormData = {
  businessName: "",
  businessType: "",
  city: "",
  targetAudience: "",
  services: "",
  objective: "Attirer des clients",
  positioning: "Professionnel",
  style: "Moderne",
  colors: "Auto",
  cta: "Prendre rendez-vous",
  description: "",
};

const LOADING_TIMELINE = [
  { stage: 0, subIndex: 0, progress: 10 },
  { stage: 0, subIndex: 1, progress: 18 },
  { stage: 0, subIndex: 2, progress: 28 },
  { stage: 1, subIndex: 0, progress: 40 },
  { stage: 1, subIndex: 1, progress: 52 },
  { stage: 1, subIndex: 2, progress: 64 },
  { stage: 2, subIndex: 0, progress: 76 },
  { stage: 2, subIndex: 1, progress: 86 },
  { stage: 2, subIndex: 2, progress: 92 },
  { stage: 3, subIndex: 0, progress: 96 },
  { stage: 3, subIndex: 1, progress: 99 },
] as const;

const TEMPLATE_PRESETS: Record<string, FormData> = sanitizeTextDeep({
  restaurant: {
    businessName: "Maison Riviera",
    businessType: "Restaurant",
    city: "Nice",
    targetAudience:
      "Actifs, couples et visiteurs qui veulent une bonne table dans une ambiance soign\u00e9e",
    services:
      "Cuisine maison, menu du midi, r\u00e9servation, \u00e9v\u00e9nements priv\u00e9s",
    objective: "Prendre des rendez-vous",
    positioning: "Premium",
    style: "Premium",
    colors: "Terracotta, cr\u00e8me, noir profond",
    cta: "R\u00e9server une table",
    description:
      "Restaurant chaleureux avec cuisine maison, ambiance soign\u00e9e et objectif clair : donner envie de r\u00e9server rapidement.",
  },
  coach: {
    businessName: "Pulse Coaching",
    businessType: "Coach sportif",
    city: "Lyon",
    targetAudience:
      "Adultes motiv\u00e9s qui veulent un vrai changement et un accompagnement exigeant",
    services: "Coaching individuel, transformation, suivi nutrition, bilan offert",
    objective: "Attirer des clients",
    positioning: "Professionnel",
    style: "Dynamique",
    colors: "Noir, blanc, accent \u00e9nergique",
    cta: "R\u00e9server un bilan",
    description:
      "Coaching sportif orient\u00e9 transformation, r\u00e9sultats visibles, accompagnement humain et prise de rendez-vous rapide.",
  },
  immobilier: {
    businessName: "Nova Immobilier",
    businessType: "Agence immobili\u00e8re",
    city: "Bordeaux",
    targetAudience:
      "Propri\u00e9taires qui veulent vendre proprement et acheteurs qui cherchent un accompagnement rassurant",
    services:
      "Estimation, achat, vente, accompagnement vendeur, biens s\u00e9lectionn\u00e9s",
    objective: "G\u00e9n\u00e9rer des leads",
    positioning: "Premium",
    style: "\u00c9l\u00e9gant",
    colors: "Blanc, gris pierre, dor\u00e9 l\u00e9ger",
    cta: "Demander une estimation",
    description:
      "Agence immobili\u00e8re locale qui doit inspirer confiance, mettre en avant son expertise et g\u00e9n\u00e9rer des demandes qualifi\u00e9es.",
  },
  "service-local": {
    businessName: "Atelier Horizon",
    businessType: "Service local",
    city: "Marseille",
    targetAudience:
      "Clients locaux qui veulent une intervention rapide, claire et fiable",
    services: "Intervention rapide, devis, accompagnement, service apr\u00e8s-vente",
    objective: "Renforcer la cr\u00e9dibilit\u00e9",
    positioning: "Professionnel",
    style: "Moderne",
    colors: "Bleu profond, blanc, gris clair",
    cta: "Demander un devis",
    description:
      "Entreprise locale qui doit rassurer imm\u00e9diatement, expliquer son offre simplement et pousser au contact.",
  },
});


const splitServices = (services: string) =>
  services
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 4);

const normalizeGeneratedPreviewUrl = (
  siteId: unknown,
  previewUrl: unknown,
) => {
  const fallback =
    typeof siteId === "string" && siteId.trim()
      ? `/preview/${siteId.trim()}`
      : null;

  if (typeof previewUrl !== "string" || !previewUrl.trim()) {
    return fallback;
  }

  try {
    const parsed = new URL(previewUrl.trim(), window.location.origin);

    if (parsed.pathname.startsWith("/preview/")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch (_error) {
    return fallback;
  }

  return fallback;
};

const getSafeGenerationAlertMessage = (error: unknown) => {
  const rawMessage = getReadableErrorMessage(
    error,
    "La génération a échoué. Aucun crédit n'a été débité et vous pouvez réessayer.",
  );

  if (
    /quota|rate.?limit|resource_exhausted|googleapis|api\/docs|gemini|429|quotaMetric|quotaId|GenerateContent/i.test(
      rawMessage,
    )
  ) {
    return "Le moteur IA est temporairement saturé. Aucun crédit n'a été débité. Réessayez dans quelques instants.";
  }

  if (
    /Cannot read properties|TypeError|undefined|null|reading/i.test(rawMessage) ||
    rawMessage.length > 220 ||
    /{\s*"|\[\s*{/.test(rawMessage)
  ) {
    return "La génération n'a pas pu se terminer correctement. Aucun crédit n'a été débité. Réessayez dans quelques instants.";
  }

  return rawMessage;
};

const normalizeVisionKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const detectVisionTerms = (source: string, terms: Array<{ label: string; regex: RegExp }>) =>
  terms
    .filter((term) => term.regex.test(source))
    .map((term) => term.label);

const isPhotographyBrief = (form: FormData) =>
  /\b(photographe|photographie|photo|shooting|portrait|mariage|studio photo|reportage photo|seance photo|séance photo)\b/.test(
    normalizeVisionKey(`${form.businessType} ${form.services} ${form.description}`),
  );

const isCarRentalBrief = (form: FormData) =>
  /\b(location de voiture|location voiture|voiture de location|vehicule de location|véhicule de location|loueur auto|rent car|car rental|utilitaire)\b/.test(
    normalizeVisionKey(`${form.businessType} ${form.services} ${form.description}`),
  );

const isVehicleBookingCtaLabel = (value: string) =>
  /\b(reserver|reservation|louer|location|choisir)\b.*\b(voiture|vehicule|auto|utilitaire)\b|\b(reserver une voiture|louer une voiture|location voiture)\b/.test(
    normalizeVisionKey(value),
  );

const isGenericDefaultCtaLabel = (value: string) =>
  /^(prendre rendez vous|demander un devis|prendre contact|contacter|reserver|reservation|reserver maintenant|en savoir plus|voir les offres)$/i.test(
    normalizeVisionKey(value),
  );

const buildContextualCtaForForm = (form: FormData) => {
  const sourceKey = normalizeVisionKey(
    `${form.businessType} ${form.services} ${form.description} ${form.objective} ${form.targetAudience}`,
  );

  if (isPhotographyBrief(form)) {
    if (/\b(mariage|evenement|reportage|entreprise|corporate)\b/.test(sourceKey)) {
      return "Demander un devis photo";
    }
    return "Réserver une séance";
  }

  if (isCarRentalBrief(form)) return "Réserver une voiture";
  if (/\brestaurant|brasserie|pizzeria|traiteur|cafe\b/.test(sourceKey)) return "Réserver une table";
  if (/\bcoach|coaching|fitness|sportif|yoga|pilates\b/.test(sourceKey)) return "Réserver un bilan";
  if (/\bimmobilier|agence immobiliere|estimation\b/.test(sourceKey)) return "Demander une estimation";
  if (/\bbeaute|coiffeur|barbier|spa|esthetique|onglerie\b/.test(sourceKey)) return "Prendre rendez-vous";
  if (/\bdevis|lead|prospect|contact|artisan|plombier|electricien|serrurier\b/.test(sourceKey)) return "Demander un devis";

  return form.cta.trim() || "Demander un devis";
};

const resolveContextualFormCta = (form: FormData) => {
  const currentCta = form.cta.trim();

  if (currentCta && isVehicleBookingCtaLabel(currentCta) && !isCarRentalBrief(form)) {
    return buildContextualCtaForForm(form);
  }

  if (
    isPhotographyBrief(form) &&
    (/\b(voiture|vehicule|auto|utilitaire)\b/.test(normalizeVisionKey(currentCta)) ||
      isGenericDefaultCtaLabel(currentCta))
  ) {
    return buildContextualCtaForForm(form);
  }

  return currentCta || buildContextualCtaForForm(form);
};

const withContextualCta = (form: FormData): FormData => ({
  ...form,
  cta: resolveContextualFormCta(form),
});

const buildDetectedVision = (form: FormData, selectedEnhancers: QuickModelKey[]): DetectedVision => {
  const contextualCta = resolveContextualFormCta(form);
  const source = `${form.businessName} ${form.businessType} ${form.city} ${form.targetAudience} ${form.objective} ${form.style} ${form.positioning} ${form.colors} ${form.services} ${contextualCta} ${form.description}`;
  const sourceKey = normalizeVisionKey(source);
  const colors = detectVisionTerms(source, [
    { label: "noir", regex: /\bnoir\b|\bblack\b/i },
    { label: "doré", regex: /\bdor[eé]\b|\bdor[eé]e\b|\bor\b|\bgold\b/i },
    { label: "rose", regex: /\brose\b|\bpink\b/i },
    { label: "violet", regex: /\bviolet\b|\bpurple\b|\blavande\b/i },
    { label: "bleu", regex: /\bbleu\b|\bblue\b/i },
    { label: "vert", regex: /\bvert\b|\bgreen\b/i },
    { label: "rouge", regex: /\brouge\b|\bred\b/i },
  ]);
  const ambiance = detectVisionTerms(source, [
    { label: "TikTok/social", regex: /\btiktok\b|\btik tok\b|\bsocial\b|\br[eé]seaux/i },
    { label: "jeune", regex: /\bjeune\b|\bgen z\b|\burbain\b/i },
    { label: "premium", regex: /\bpremium\b|\bhaut de gamme\b|\bluxe\b/i },
    { label: "minimaliste", regex: /\bminimaliste\b|\bsobre\b|\b[ée]pur[eé]\b/i },
    { label: "dynamique", regex: /\bdynamique\b|\b[ée]nergique\b|\bimpactant\b/i },
  ]);
  const channel = /\bwhatsapp\b|\bmessage\b|\bdm\b/i.test(source) ? "WhatsApp" : "";
  const selectedDirections = selectedEnhancers
    .map((key) => getBriefEnhancerByKey(key)?.label)
    .filter((label): label is string => Boolean(label));
  const chips = [
    form.businessType.trim() ? `Métier : ${form.businessType.trim()}` : "",
    form.city.trim() ? `Ville : ${form.city.trim()}` : "",
    form.targetAudience.trim() ? `Cible : ${form.targetAudience.trim()}` : "",
    colors.length ? `Couleurs : ${colors.join(" + ")}` : "",
    ambiance.length ? `Ambiance : ${ambiance.join(" + ")}` : "",
    channel ? `Canal : ${channel}` : "",
    contextualCta ? `CTA : ${contextualCta}` : "",
    selectedDirections.length ? `Boost : ${selectedDirections.join(", ")}` : "",
  ].filter(Boolean);
  const summary =
    chips.length > 0
      ? "Pixelrises va respecter ces choix avant d'ajouter la couche business, conversion, SEO et design."
      : sourceKey
        ? "Pixelrises détecte l'idée principale et complétera prudemment les infos manquantes."
        : "Ajoutez le métier, la ville, l'ambiance ou le CTA pour guider la génération.";

  return {
    summary,
    chips: chips.slice(0, 8),
    isActionable: chips.length >= 3 || sourceKey.length > 30,
  };
};


const buildPlanResponse = (form: FormData, prompt: string) => {
  const businessLabel = form.businessName || form.businessType || "votre activité";
  const objective = form.objective || "attirer des clients";
  const style = form.style || "Moderne";
  const city = form.city ? ` à ${form.city}` : "";
  const contextualCta = resolveContextualFormCta(form);

  return `Plan prêt pour ${businessLabel}${city} : on garde un hero fort orienté ${objective.toLowerCase()}, un style ${style.toLowerCase()}, des sections utiles uniquement et un CTA principal "${contextualCta || "Prendre rendez-vous"}". J'ai intégré votre demande : "${prompt}". Passez en mode Build pour lancer la preview réelle.`;
};

const getBriefEnhancerByKey = (modelKey: QuickModelKey) =>
  QUICK_MODELS.find((item) => item.key === modelKey);

const BUSINESS_TYPE_PATTERNS: Array<{ label: string; patterns: RegExp[] }> = [
  {
    label: "Location de voiture",
    patterns: [
      /\blocation\s+(?:de\s+)?voiture/i,
      /\blocation\s+(?:de\s+)?voitures/i,
      /\blocation\s+auto/i,
      /\blouer\s+(?:une\s+)?voiture/i,
      /\bagence\s+de\s+location\s+auto/i,
    ],
  },
  { label: "Restaurant", patterns: [/\brestaurant\b/i, /\bbrasserie\b/i, /\bpizzeria\b/i, /\btraiteur\b/i] },
  { label: "Coach sportif", patterns: [/\bcoach\s+sportif\b/i, /\bcoaching\s+sportif\b/i, /\bfitness\b/i] },
  { label: "Coach", patterns: [/\bcoach\b/i, /\bcoaching\b/i] },
  {
    label: "Agence immobilière",
    patterns: [/\bagence\s+immobili[eè]re\b/i, /\bimmobilier\b/i, /\bestimation\s+immobili[eè]re\b/i],
  },
  { label: "Plombier", patterns: [/\bplombier\b/i, /\bplomberie\b/i] },
  { label: "Électricien", patterns: [/\b[ée]lectricien\b/i, /\b[ée]lectricit[ée]\b/i] },
  { label: "Serrurier", patterns: [/\bserrurier\b/i, /\bserrurerie\b/i] },
  { label: "Avocat", patterns: [/\bavocat\b/i, /\bcabinet\s+d'avocat\b/i] },
  { label: "Dentiste", patterns: [/\bdentiste\b/i, /\bcabinet\s+dentaire\b/i] },
  { label: "Salon de beauté", patterns: [/\bsalon\s+de\s+beaut[ée]\b/i, /\besth[ée]tique\b/i, /\binstitut\b/i] },
  { label: "Coiffeur", patterns: [/\bcoiffeur\b/i, /\bcoiffure\b/i, /\bbarbier\b/i] },
  { label: "Garage", patterns: [/\bgarage\b/i, /\bm[ée]canicien\b/i, /\br[ée]paration\s+auto\b/i] },
  { label: "Photographe", patterns: [/\bphotographe\b/i, /\bphotographie\b/i] },
  { label: "Consultant", patterns: [/\bconsultant\b/i, /\bconsulting\b/i, /\bconseil\b/i] },
  { label: "Boutique", patterns: [/\bboutique\b/i, /\be-commerce\b/i, /\bcommerce\b/i] },
];

const normalizeBusinessTypeLabel = (value: string) => {
  const clean = value
    .replace(/["«»]/g, "")
    .replace(/^[,.;:!?-\s]+|[,.;:!?-\s]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!clean) return "";

  const lower = clean.toLowerCase();
  const directMatch = BUSINESS_TYPE_PATTERNS.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(lower)),
  );
  if (directMatch) return directMatch.label;

  const smallWords = new Set(["de", "du", "des", "d'", "à", "a", "au", "aux", "et"]);
  return clean
    .split(/\s+/)
    .map((word, index) => {
      const wordLower = word.toLowerCase();
      if (index > 0 && smallWords.has(wordLower)) return wordLower;
      return `${word.charAt(0).toLocaleUpperCase("fr-FR")}${word.slice(1).toLocaleLowerCase("fr-FR")}`;
    })
    .join(" ");
};

const cleanBusinessCandidate = (value: string) => {
  const withoutLocation = value.replace(/\b(?:à|a|sur|près de|proche de|dans|en)\s+.+$/i, "");
  const withoutGoal = withoutLocation.replace(/\b(?:avec|qui|afin de|pour attirer|pour vendre|pour prendre)\s+.+$/i, "");

  return withoutGoal
    .replace(/\b(?:site|page|landing|web|vitrine|premium|professionnel)\b/gi, "")
    .replace(/^(?:un|une|des|le|la|les|l'|mon|ma|mes|notre|nos|votre|vos)\s+/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const detectBusinessTypeFromPrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase();
  const directMatch = BUSINESS_TYPE_PATTERNS.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(normalizedPrompt)),
  );

  if (directMatch) return directMatch.label;

  const extractionPatterns = [
    /\b(?:site|landing|page|site web|vitrine)\s+(?:premium\s+)?(?:pour|de|d')\s+(?:un|une|des|mon|ma|mes|notre|nos|votre|vos|le|la|les|l')?\s*([^,.!?;\n]{3,90})/i,
    /\b(?:cr[ée]er|g[ée]n[ée]rer|faire|construire)\s+(?:un|une|des|mon|ma|mes)?\s*(?:site|page|landing)?\s*(?:pour|de|d')\s+(?:un|une|des|mon|ma|mes|notre|nos|votre|vos|le|la|les|l')?\s*([^,.!?;\n]{3,90})/i,
    /\b(?:pour|de|d')\s+(?:un|une|des|mon|ma|mes|notre|nos|votre|vos|le|la|les|l')?\s*([^,.!?;\n]{3,70})/i,
  ];

  for (const pattern of extractionPatterns) {
    const candidate = cleanBusinessCandidate(prompt.match(pattern)?.[1] || "");
    if (candidate.length >= 3 && !/^(clients?|business|activit[ée]|projet)$/i.test(candidate)) {
      return normalizeBusinessTypeLabel(candidate);
    }
  }

  return "Projet client";
};

const detectCityFromPrompt = (prompt: string) => {
  const cityMatch = prompt.match(
    /\b(?:à|a|sur|près de|proche de)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'-]{1,30}(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'-]{1,30}){0,2})/u,
  );
  return cityMatch?.[1]?.replace(/[,.!?;:]$/, "").trim() || "";
};

const detectObjectiveFromPrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase();
  if (/\b(r[ée]servation|r[ée]server|rdv|rendez-vous|prendre rendez-vous|agenda|cr[ée]neau)\b/i.test(normalizedPrompt)) {
    return "Prendre rendez-vous";
  }
  if (/\b(vendre|vente|acheter|commande|panier|achat|conversion|convertir)\b/i.test(normalizedPrompt)) {
    return "Vendre plus";
  }
  if (/\b(lead|leads|prospect|contact|devis|demande qualifi[ée]e)\b/i.test(normalizedPrompt)) {
    return "Générer des leads";
  }
  if (/\b(cr[ée]dibilit[ée]|confiance|rassurer|autorité|preuve|s[ée]rieux)\b/i.test(normalizedPrompt)) {
    return "Renforcer la crédibilité";
  }
  return "";
};

const detectStyleFromPrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase();
  if (/\b(luxe|premium|haut de gamme|[ée]l[ée]gant|raffin[ée])\b/i.test(normalizedPrompt)) return "Premium";
  if (/\b(minimaliste|minimal|sobre|[ée]pur[ée])\b/i.test(normalizedPrompt)) return "Minimaliste";
  if (/\b(dynamique|sportif|[ée]nergique|impactant)\b/i.test(normalizedPrompt)) return "Dynamique";
  if (/\b(chaleureux|convivial|humain|authentique)\b/i.test(normalizedPrompt)) return "Chaleureux";
  if (/\b(moderne|tech|startup|saas)\b/i.test(normalizedPrompt)) return "Moderne";
  return "";
};

const detectPositioningFromPrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase();
  if (/\b(luxe|premium|haut de gamme|prestige)\b/i.test(normalizedPrompt)) return "Premium";
  if (/\b(accessible|simple|pas cher|abordable|essentiel)\b/i.test(normalizedPrompt)) return "Accessible";
  return "";
};

const detectCtaFromPrompt = (prompt: string) => {
  const ctaMatch = prompt.match(
    /\b(?:cta|bouton|appel [aà] l'action|action principale)\s*[:=-]\s*["“”«»]?([^"“”«»\n.;!?]{4,48})/i,
  );
  if (ctaMatch?.[1]) {
    return ctaMatch[1]
      .replace(/^[,.;:!?-\s]+|[,.;:!?-\s]+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  const normalizedPrompt = prompt.toLowerCase();
  if (/\b(photographe|photographie|photo|shooting|portrait|studio photo|seance photo|s[ée]ance photo)\b/i.test(normalizedPrompt)) {
    if (/\b(devis|mariage|evenement|événement|reportage|entreprise|corporate)\b/i.test(normalizedPrompt)) return "Demander un devis photo";
    if (/\b(r[ée]server|r[ée]servation|s[ée]ance|rdv|rendez-vous)\b/i.test(normalizedPrompt)) return "Réserver une séance";
  }
  if (/\b(r[ée]server|r[ée]servation|table)\b/i.test(normalizedPrompt)) return "Réserver maintenant";
  if (/\b(devis|estimation)\b/i.test(normalizedPrompt)) return "Demander un devis";
  if (/\b(rendez-vous|rdv|bilan)\b/i.test(normalizedPrompt)) return "Prendre rendez-vous";
  if (/\b(acheter|commande|commander)\b/i.test(normalizedPrompt)) return "Commander";
  if (/\b(location de voiture|location voiture|louer une voiture|voiture de location|vehicule de location|véhicule de location|car rental|utilitaire)\b/i.test(normalizedPrompt)) return "Réserver une voiture";
  return "";
};

const buildProjectNameFromPrompt = (prompt: string, businessType: string, city: string) => {
  const quotedName = prompt.match(/[«"]([^«"]{2,60})[»"]/)?.[1]?.trim();
  if (quotedName) return quotedName;

  const cleanBusinessType = businessType || "Site Pixelrises";
  return city ? `${cleanBusinessType} ${city}` : cleanBusinessType;
};

const buildFormFromConversation = (current: FormData, prompt: string): FormData => {
  const detectedBusinessType = detectBusinessTypeFromPrompt(prompt);
  const detectedCity = detectCityFromPrompt(prompt);
  const detectedObjective = detectObjectiveFromPrompt(prompt);
  const detectedStyle = detectStyleFromPrompt(prompt);
  const detectedPositioning = detectPositioningFromPrompt(prompt);
  const detectedCta = detectCtaFromPrompt(prompt);
  const hasNewBusinessSignal =
    Boolean(detectedBusinessType && detectedBusinessType !== "Projet client") ||
    Boolean(detectedCity && detectedCity !== current.city.trim()) ||
    Boolean(detectedObjective);
  const businessType =
    detectedBusinessType && detectedBusinessType !== "Projet client"
      ? detectedBusinessType
      : current.businessType.trim() || detectedBusinessType;
  const city = detectedCity || current.city.trim();
  const businessName =
    hasNewBusinessSignal || !current.businessName.trim()
      ? buildProjectNameFromPrompt(prompt, businessType, city)
      : current.businessName.trim();

  return withContextualCta({
    ...current,
    businessName,
    businessType,
    city,
    description: prompt,
    services: hasNewBusinessSignal || !current.services.trim() ? prompt : current.services,
    objective: detectedObjective || current.objective,
    positioning: detectedPositioning || current.positioning,
    style: detectedStyle || current.style,
    targetAudience:
      hasNewBusinessSignal || !current.targetAudience.trim()
        ? "Clients prêts à passer à l'action"
        : current.targetAudience,
    cta: detectedCta || current.cta.trim() || "Demander un devis",
  });
};

const ensureGenerationForm = (current: FormData): FormData => {
  const fallbackPrompt =
    current.description.trim() ||
    current.services.trim() ||
    current.businessName.trim() ||
    current.businessType.trim() ||
    "Créer un site professionnel clair, crédible et orienté conversion.";
  const businessType = current.businessType.trim() || detectBusinessTypeFromPrompt(fallbackPrompt);
  const city = current.city.trim() || detectCityFromPrompt(fallbackPrompt);

  return withContextualCta({
    ...current,
    businessName: current.businessName.trim() || buildProjectNameFromPrompt(fallbackPrompt, businessType, city),
    businessType,
    city,
    description: current.description.trim() || fallbackPrompt,
    services: current.services.trim() || fallbackPrompt,
    targetAudience: current.targetAudience.trim() || "Clients prêts à passer à l'action",
    cta: current.cta.trim() || "Demander un devis",
  });
};

const getPrimaryActionLabel = (hasPendingPrompt: boolean, hasPreview: boolean) => {
  if (hasPendingPrompt) return "Envoyer";
  return hasPreview ? "Régénérer" : "Générer";
};

const PixelrisesAI = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0);
  const [recentSites, setRecentSites] = useState<
    Array<{
      id: string;
      business_name: string;
      created_at: string;
      status: string;
    }>
  >([]);
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [form, setForm] = useState<FormData>(defaultForm);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(
    null,
  );
  const [generatedSiteId, setGeneratedSiteId] = useState<string | null>(null);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const [generatedPublishUrl, setGeneratedPublishUrl] = useState<string | null>(null);
  const [generationAlert, setGenerationAlert] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingSubIndex, setLoadingSubIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<"chat" | "preview">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>("simple");
  const executionMode: BuilderExecutionMode = "build";
  const [selectedEnhancers, setSelectedEnhancers] = useState<QuickModelKey[]>([]);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [chatInput, setChatInput] = useState("");
  const [toolDropdownOpen, setToolDropdownOpen] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState("Aucune sauvegarde");
  const [builderMessages, setBuilderMessages] = useState<BuilderMessage[]>([
    createBuilderMessage(
      "ai",
      "Décrivez votre activité, votre offre et votre ville. Je prépare ensuite la structure, le design et la preview du site.",
    ),
  ]);
  const [activePanel, setActivePanel] = useState<
    null | "search" | "gift" | "notifications" | "account" | "new-project" | "feature"
  >(null);
  const [featurePanel, setFeaturePanel] = useState<{
    label: string;
    state: FeatureAvailabilityState;
  } | null>(null);
  const conversationScrollRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandQuery, setCommandQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsSeen, setNotificationsSeen] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredCommandQuery = useDeferredValue(commandQuery);
  const displayName = useMemo(() => getDisplayName(user), [user]);
  const latestSites = useMemo(
    () =>
      recentSites.map((site) => ({
        id: site.id,
        title: site.business_name,
        status: site.status,
        time: getSafeRelativeTime(site.created_at),
      })),
    [recentSites],
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);
      setIsAdmin(false);

      if (!currentUser) return;

      const [{ data: rolesData }, { data: creditsData }, { data: sitesData }] =
        await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id),
          supabase
            .from("user_credits")
            .select("credits")
            .eq("user_id", currentUser.id)
            .single(),
          supabase
            .from("generated_sites")
            .select("id, business_name, created_at, status")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      setIsAdmin(Boolean(rolesData?.some((entry) => entry.role === "admin")));
      setCredits(creditsData?.credits || 0);

      setRecentSites(
        ((sitesData as typeof recentSites | null) ?? []).filter(Boolean),
      );
    };

    void init();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;

    const sanitizedQuery = sanitizeTextDeep(q);
    setForm((previous) => withContextualCta({
      ...previous,
      businessName: sanitizedQuery,
      businessType: sanitizedQuery,
    }));
  }, [searchParams]);

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem(BUILDER_DRAFT_KEY);
      if (!draft) return;
      const parsed = JSON.parse(draft) as Partial<FormData>;
      setForm((previous) => withContextualCta({ ...previous, ...parsed }));
    } catch {
      // Ignore invalid local drafts and keep the default form.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(BUILDER_DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Ignore localStorage write issues to avoid blocking the builder.
    }
  }, [form]);

  useEffect(() => {
    const templateKey = searchParams.get("template");
    if (!templateKey) return;

    const preset = TEMPLATE_PRESETS[templateKey];
    if (!preset) return;

    setForm((previous) => {
      if (JSON.stringify(previous) !== JSON.stringify(defaultForm)) {
        return previous;
      }

      return withContextualCta(preset);
    });
  }, [searchParams]);

  useEffect(() => {
    if (step !== "loading") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "Une génération Pixelrises est en cours. Si vous quittez maintenant, vous devrez recommencer.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step]);

  useEffect(() => {
    if (step === "loading" || step === "result") {
      setMobilePanel("preview");
    }
  }, [step]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const syncSidebar = () => setSidebarOpen(mediaQuery.matches);

    syncSidebar();
    mediaQuery.addEventListener("change", syncSidebar);

    return () => mediaQuery.removeEventListener("change", syncSidebar);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandQuery("");
        setCommandPaletteOpen(true);
        setActivePanel(null);
      }

      if (event.key === "Escape") {
        setActivePanel(null);
        setCommandPaletteOpen(false);
        setFeaturePanel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((previous) => withContextualCta({ ...previous, [key]: value }));
  };

  const hasConversationBrief =
    chatInput.trim().length > 0 ||
    form.businessName.trim().length > 0 ||
    form.businessType.trim().length > 0 ||
    form.description.trim().length > 0;
  const hasPendingPrompt = chatInput.trim().length > 0;
  const primaryActionLabel = getPrimaryActionLabel(hasPendingPrompt, step === "result");
  const selectedBriefEnhancerInstructions = useMemo(
    () =>
      selectedEnhancers
        .map((key) => getBriefEnhancerByKey(key)?.instruction)
        .filter((instruction): instruction is string => Boolean(instruction)),
    [selectedEnhancers],
  );
  const debugPromptOnly =
    import.meta.env.DEV && searchParams.get("debugPrompt") === "1";
  const detectedVision = useMemo(
    () => buildDetectedVision(form, selectedEnhancers),
    [form, selectedEnhancers],
  );
  const briefQualityScore = useMemo(() => {
    const serviceCount = splitServices(form.services).length;
    const rawScore =
      18 +
      (form.businessName.trim() ? 8 : 0) +
      (form.businessType.trim() ? 14 : 0) +
      (form.city.trim() ? 10 : 0) +
      (form.targetAudience.trim() ? 12 : 0) +
      (serviceCount >= 2 ? 14 : serviceCount === 1 ? 7 : 0) +
      (form.description.trim().length >= 120 ? 16 : form.description.trim().length >= 60 ? 9 : 0) +
      (form.cta.trim() ? 8 : 0) +
      Math.min(selectedEnhancers.length * 4, 12);

    return Math.min(100, rawScore);
  }, [form, selectedEnhancers.length]);
  const briefQualityLabel =
    briefQualityScore >= 82
      ? "Brief solide"
      : briefQualityScore >= 62
        ? "Brief à préciser"
        : "Brief trop léger";

  const isGenerating = step === "loading";
  const hasGeneratedPreview = step === "result" && Boolean(generatedPreviewUrl);
  const previewActionsDisabled = !hasGeneratedPreview;
  const publishManagerUrl =
    generatedPublishUrl ||
    (generatedSiteId
      ? `/dashboard?tab=sites&manage=${generatedSiteId}&managerTab=publish`
      : null);

  const liveSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (!form.cta.trim()) {
      suggestions.push(
        "Ajoute un CTA direct comme \u00ab R\u00e9server \u00bb, \u00ab Demander un devis \u00bb ou \u00ab Prendre rendez-vous \u00bb.",
      );
    }

    if (!form.description.trim() || form.description.trim().length < 80) {
      suggestions.push(
        "Ajoute une promesse plus forte dans la description pour rendre le hero plus vendeur.",
      );
    }

    if (!form.city.trim()) {
      suggestions.push(
        "Ajoute une ville pour renforcer la cr\u00e9dibilit\u00e9 locale et le SEO.",
      );
    }

    if (splitServices(form.services).length < 2) {
      suggestions.push(
        "D\u00e9cris 2 ou 3 services concrets pour obtenir une structure plus cr\u00e9dible.",
      );
    }

    return suggestions.slice(0, 2);
  }, [form]);

  useEffect(() => {
    const scrollNode = conversationScrollRef.current;
    if (!scrollNode) {
      return;
    }

    if (typeof scrollNode.scrollTo === "function") {
      scrollNode.scrollTo({
        top: scrollNode.scrollHeight,
        behavior: "smooth",
      });
    } else {
      scrollNode.scrollTop = scrollNode.scrollHeight;
    }
  }, [builderMessages.length, liveSuggestions.length]);

  const roleLabel = isAdmin ? "Admin" : user ? "Client" : "Invit\u00e9";

  const notifications = useMemo(() => {
    const items = latestSites.slice(0, 3).map((site) => ({
      id: `site-${site.id}`,
      title:
        site.status === "published"
          ? "Site publi\u00e9"
          : site.status === "generated"
            ? "G\u00e9n\u00e9ration termin\u00e9e"
            : "Projet sauvegard\u00e9",
      description: site.title,
      time: site.time,
    }));

    if (credits < GENERATION_COST && user) {
      items.push({
        id: "credits-low",
        title: "Cr\u00e9dits insuffisants",
        description: "Rechargez votre solde pour relancer une g\u00e9n\u00e9ration.",
        time: "Maintenant",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "welcome",
        title: "Bienvenue sur Pixelrises",
        description: "Votre activit\u00e9 appara\u00eetra ici au fur et \u00e0 mesure.",
        time: "Maintenant",
      });
    }

    return items.slice(0, 4);
  }, [credits, latestSites, user]);

  const unreadNotificationsCount = notificationsSeen ? 0 : notifications.length;

  const improveCurrentBrief = useCallback((modelKey: QuickModelKey) => {
    const enhancer = getBriefEnhancerByKey(modelKey);
    const isActive = selectedEnhancers.includes(modelKey);

    setSelectedEnhancers((current) => {
      const currentlyActive = current.includes(modelKey);
      return currentlyActive
        ? current.filter((key) => key !== modelKey)
        : [...current, modelKey];
    });

    setGenerationAlert(null);
    setGenerationNotice(null);
    setLastSavedLabel("Direction du brief mise à jour");
    toast({
      title: isActive ? "Direction retirée" : "Direction ajoutée",
      description: isActive
        ? "Pixelrises garde votre brief tel quel."
        : `${enhancer?.label || "Suggestion"} guidera la génération sans remplacer votre texte.`,
    });
  }, [selectedEnhancers]);

  const handleLockedGeneratorType = (label: string) => {
    toast({
      title: `${label} arrive bient\u00f4t`,
      description:
        "Le moteur principal Site web est d\u00e9j\u00e0 actif. Les autres briques arrivent progressivement.",
    });
  };

  const notifyFeatureInDevelopment = useCallback((label: string) => {
    toast({
      title: `${label} en cours de développement`,
      description: "Fonction en cours de développement.",
    });
  }, []);

  const closePanels = useCallback(() => {
    setActivePanel(null);
    setFeaturePanel(null);
    setCommandPaletteOpen(false);
    setToolDropdownOpen(false);
  }, []);

  const openBillingSpace = useCallback(() => {
    closePanels();
    navigate("/dashboard?tab=subscription");
  }, [closePanels, navigate]);

  const handleFeatureClick = (feature: SidebarFeatureItem) => {
    if (feature.state === "available" && feature.href) {
      closePanels();
      navigate(feature.href);
      return;
    }

    notifyFeatureInDevelopment(feature.label);
    setFeaturePanel({ label: feature.label, state: feature.state });
    setActivePanel("feature");
  };

  const openSoonFeature = (
    label: string,
    state: FeatureAvailabilityState = "soon",
  ) => {
    setFeaturePanel({ label, state });
    setActivePanel("feature");
    setToolDropdownOpen(false);
  };

  const handleToolMenuClick = (label: string) => {
    switch (label) {
      case "Paiements":
        openBillingSpace();
        break;
      case "Analytics":
        notifyFeatureInDevelopment(label);
        openSoonFeature("Analytics avancés", "soon");
        break;
      case "Vitesse":
        notifyFeatureInDevelopment(label);
        openSoonFeature("Vitesse", "progress");
        break;
      default:
        notifyFeatureInDevelopment(label);
        openSoonFeature(label, "soon");
        break;
    }
  };

  const handlePreviewClick = useCallback(() => {
    if (!generatedPreviewUrl || !hasGeneratedPreview) {
      toast({
        title: "Preview indisponible",
        description: "G\u00e9n\u00e9rez un site pour ouvrir une preview r\u00e9elle.",
      });
      return;
    }

    window.open(generatedPreviewUrl, "_blank", "noopener,noreferrer");
  }, [generatedPreviewUrl, hasGeneratedPreview]);

  const handlePublishClick = () => {
    if (!publishManagerUrl || !hasGeneratedPreview) {
      toast({
        title: "Publication indisponible",
        description: "G\u00e9n\u00e9rez un site avant de lancer la publication.",
      });
      return;
    }

    toast({
      title: "Publication pr\u00eate",
      description: "Ouverture du panneau de publication.",
    });
    navigate(publishManagerUrl);
  };

  const handleImproveClick = async () => {
    if (!hasGeneratedPreview) {
      toast({
        title: "Amélioration indisponible",
        description: "Générez d'abord une première version pour lancer une amélioration.",
      });
      return;
    }

    setBuilderMessages((current) => [
      ...current,
      createBuilderMessage(
        "ai",
        "Je prépare une version améliorée avec plus de clarté, de design et de conversion.",
      ),
    ]);
    await handleGenerate(true);
  };

  const handleChangeStyleClick = () => {
    const currentIndex = STYLES.indexOf(form.style);
    const nextStyle = STYLES[(currentIndex + 1 + STYLES.length) % STYLES.length];
    updateForm("style", nextStyle);
    toast({
      title: "Style mis à jour",
      description: `Le builder bascule vers une direction ${nextStyle.toLowerCase()}.`,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    closePanels();
    setCommandPaletteOpen(false);
    toast({
      title: "D\u00e9connexion r\u00e9ussie",
      description: "\u00c0 bient\u00f4t sur Pixelrises.",
    });
    navigate("/auth");
  };

  const commandActions = useMemo(
    () => [
      {
        id: "create-site",
        label: "Cr\u00e9er un site",
        helper: "Repartir d'un brief propre",
        run: () => {
          setForm(defaultForm);
          setSelectedEnhancers([]);
          setGenerationAlert(null);
          setGenerationNotice(null);
          setStep("form");
          setMobilePanel("chat");
          closePanels();
          toast({
            title: "Nouveau projet pr\u00eat",
            description: "Le brief a \u00e9t\u00e9 r\u00e9initialis\u00e9.",
          });
        },
      },
      {
        id: "view-projects",
        label: "Voir mes projets",
        helper: "Ouvrir le dashboard projets",
        run: () => navigate("/dashboard?tab=sites"),
      },
      {
        id: "recharge-credits",
        label: "Recharger des cr\u00e9dits",
        helper: "Ouvrir la zone cr\u00e9dits",
        run: () => openBillingSpace(),
      },
      {
        id: "settings",
        label: "Param\u00e8tres",
        helper: "Ouvrir les param\u00e8tres du compte",
        run: () => {
          notifyFeatureInDevelopment("Paramètres");
          setFeaturePanel({ label: "Param\u00e8tres", state: "soon" });
          setActivePanel("feature");
        },
      },
    ],
    [closePanels, navigate, notifyFeatureInDevelopment, openBillingSpace],
  );

  const filteredCommandActions = useMemo(() => {
    const query = deferredCommandQuery.trim().toLowerCase();
    if (!query) return commandActions;

    return commandActions.filter((action) =>
      `${action.label} ${action.helper}`.toLowerCase().includes(query),
    );
  }, [commandActions, deferredCommandQuery]);

  const searchResults = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    const projectResults = latestSites.map((site) => ({
      id: `project-${site.id}`,
      title: site.title,
      subtitle: `Projet \u00b7 ${site.status}`,
      action: () => {
        closePanels();
        navigate("/dashboard?tab=sites");
      },
    }));

    const templateResults = QUICK_MODELS.map((template) => ({
      id: `template-${template.key}`,
      title: template.label,
      subtitle: template.description,
      action: () => {
        improveCurrentBrief(template.key);
        setMobilePanel("chat");
        closePanels();
      },
    }));

    const generationResults =
      generatedSiteId && generatedPreviewUrl
        ? [
            {
              id: "generated-preview",
              title: "Derni\u00e8re preview g\u00e9n\u00e9r\u00e9e",
              subtitle: "G\u00e9n\u00e9ration \u00b7 ouvrir la preview r\u00e9elle",
              action: () => {
                closePanels();
                handlePreviewClick();
              },
            },
          ]
        : [];

    const all = [...projectResults, ...templateResults, ...generationResults];
    if (!query) return all;

    return all.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(query),
    );
  }, [
    closePanels,
    deferredSearchQuery,
    generatedPreviewUrl,
    generatedSiteId,
    handlePreviewClick,
    improveCurrentBrief,
    latestSites,
    navigate,
  ]);

  const activeFeatureInfo = featurePanel
    ? buildFeatureInfoCopy(featurePanel.label, featurePanel.state)
    : null;
  const projectDisplayName =
    form.businessName.trim() || generatedContent?.heroTitle || "Nouveau projet";
  const previewStatusLabel = hasGeneratedPreview
    ? "Prévisualisation active"
    : isGenerating
      ? "Génération en cours"
      : "Preview prête à construire";
  const builderStatusTone =
    step === "result"
      ? "border-[#7ED957]/20 bg-[#7ED957]/10 text-[#B8F58A]"
      : isGenerating
        ? "border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.10)] text-[#F5C542]"
        : "border-white/10 bg-white/[0.04] text-[#D1D5DB]";
  const toolMenuItems = [
    { label: "Analytics", action: () => setFeaturePanel({ label: "Analytics avancés", state: "soon" }) },
    { label: "Code", action: () => setFeaturePanel({ label: "Code", state: "soon" }) },
    { label: "Fichiers", action: () => setFeaturePanel({ label: "Fichiers", state: "soon" }) },
    { label: "Paiements", action: openBillingSpace },
    { label: "Sécurité", action: () => setFeaturePanel({ label: "Sécurité", state: "soon" }) },
    { label: "Vitesse", action: () => setFeaturePanel({ label: "Vitesse", state: "progress" }) },
  ] as const;

  const copyBrief = async () => {
    const brief = [
      `Business : ${form.businessName || "\u00c0 d\u00e9finir"}`,
      `Activit\u00e9 : ${form.businessType || "\u00c0 d\u00e9finir"}`,
      `Ville : ${form.city || "\u00c0 d\u00e9finir"}`,
      `Cible : ${form.targetAudience || "\u00c0 d\u00e9finir"}`,
      `Objectif : ${form.objective}`,
      `Positionnement : ${form.positioning}`,
      `Style : ${form.style}`,
      `CTA : ${form.cta || "\u00c0 d\u00e9finir"}`,
      `Services : ${form.services || "\u00c0 d\u00e9finir"}`,
      `Description : ${form.description || "\u00c0 d\u00e9finir"}`,
    ].join("\n");

    await navigator.clipboard.writeText(brief);
    toast({
      title: "Brief copi\u00e9",
      description: "Le brief de g\u00e9n\u00e9ration a \u00e9t\u00e9 copi\u00e9.",
    });
  };

  const startLoadingAnimation = () => {
    setLoadingStage(0);
    setLoadingSubIndex(0);
    setLoadingProgress(5);

    let timelineIndex = 0;

    const interval = window.setInterval(() => {
      if (timelineIndex < LOADING_TIMELINE.length - 1) {
        timelineIndex += 1;
      }

      const nextFrame = LOADING_TIMELINE[timelineIndex];
      setLoadingStage(nextFrame.stage);
      setLoadingSubIndex(nextFrame.subIndex);
      setLoadingProgress(nextFrame.progress);
    }, 1400);

    return interval;
  };

  const handleGenerate = async (regenerate = false, formOverride?: FormData) => {
    const workingForm = ensureGenerationForm(formOverride ?? form);

    if (!isSupabaseConfigured) {
      toast({
        title: "Cr\u00e9ation indisponible",
        description: "La configuration du service n'est pas encore pr\u00eate.",
        variant: "destructive",
      });
      return false;
    }

    if (!user) {
      navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
      return false;
    }

    if (credits < GENERATION_COST) {
      const description = `Il vous faut ${GENERATION_COST} cr\u00e9dits pour g\u00e9n\u00e9rer un site.`;
      setGenerationAlert({
        title: "Cr\u00e9dits insuffisants",
        description,
      });
      toast({
        title: "Cr\u00e9dits insuffisants",
        description,
        variant: "destructive",
      });
      return false;
    }

    setForm(workingForm);
    setStep("loading");
    setGenerationAlert(null);
    setGenerationNotice(null);
    const interval = startLoadingAnimation();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.clearInterval(interval);
        setStep("form");
        navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
        return false;
      }

      const response = await fetch(
        `${PUBLIC_ENV.supabaseUrl}/functions/v1/generate-site`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: PUBLIC_ENV.supabasePublishableKey,
          },
          body: JSON.stringify({
            form: {
              ...workingForm,
              regenerate,
              variationSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
              enhancers: selectedBriefEnhancerInstructions,
              ...(debugPromptOnly ? { debugPromptOnly: true } : {}),
            },
          }),
        },
      );

      window.clearInterval(interval);

      const payload = await response
        .json()
        .catch(() => ({ error: "Réponse serveur illisible. Aucun crédit ne doit être débité." }));

      if (!response.ok) {
        if (response.status === 402) {
          const description = payload.error || "Rechargez votre compte pour continuer.";
          setGenerationAlert({
            title: "Cr\u00e9dits insuffisants",
            description,
          });
          toast({
            title: "Cr\u00e9dits insuffisants",
            description,
            variant: "destructive",
          });
          setStep(generatedPreviewUrl ? "result" : "form");
          return false;
        }

        throw new Error(getSafeGenerationAlertMessage(payload.error || "Erreur de génération"));
      }

      if (payload.debugPromptOnly) {
        if (import.meta.env.DEV) {
          console.info("Pixelrises prompt final simulé", payload);
        }
        setGenerationAlert({
          title: "Prompt final simulé",
          description:
            "Mode développement uniquement : aucun appel Gemini, aucune sauvegarde et aucun crédit débité. Le prompt final est disponible dans la console.",
        });
        setStep(generatedPreviewUrl ? "result" : "form");
        return true;
      }

      const nextPreviewUrl = normalizeGeneratedPreviewUrl(payload.siteId, payload.previewUrl);

      if (!payload.siteId || !nextPreviewUrl) {
        throw new Error(
          "Le site a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 mais la preview n'a pas pu \u00eatre pr\u00e9par\u00e9e. Aucun cr\u00e9dit ne doit \u00eatre perdu.",
        );
      }

      setLoadingStage(3);
      setLoadingSubIndex(2);
      setLoadingProgress(100);
      setGeneratedContent(
        payload.content ? sanitizeTextDeep(payload.content as GeneratedContent) : null,
      );
      setGeneratedSiteId(payload.siteId || null);
      setGeneratedPreviewUrl(nextPreviewUrl);
      setPreviewRefreshToken(Date.now());
      setGeneratedPublishUrl(payload.publishUrl || null);
      setCredits(typeof payload.credits === "number" ? payload.credits : Math.max(credits - GENERATION_COST, 0));
      setLastSavedLabel("Dernière sauvegarde à l'instant");
      setGenerationNotice(null);
      setRecentSites((current) => {
        const nextEntry = {
          id: String(payload.siteId),
          business_name:
            workingForm.businessName || workingForm.businessType || "Nouveau site",
          created_at: new Date().toISOString(),
          status: "generated",
        };

        return [nextEntry, ...current.filter((entry) => entry.id !== nextEntry.id)].slice(0, 5);
      });
      setStep("result");

      const usedCredits =
        typeof payload.creditCost === "number" ? payload.creditCost : GENERATION_COST;

      toast({
        title: regenerate ? "Version mise \u00e0 jour" : "Site cr\u00e9\u00e9",
        description: `Preview générée et sauvegardée. ${usedCredits} crédits utilisés.`,
      });
      return true;
    } catch (error: unknown) {
      window.clearInterval(interval);
      reportFrontendError(
        "generate-site",
        error,
        {
          regenerate,
          businessName: workingForm.businessName,
          businessType: workingForm.businessType,
          city: workingForm.city,
        },
        "La g\u00e9n\u00e9ration du site a \u00e9chou\u00e9.",
      );
      const description = getSafeGenerationAlertMessage(error);

      if (import.meta.env.DEV) console.error("Generation error:", error);
      setGenerationAlert({
        title: "G\u00e9n\u00e9ration interrompue",
        description,
      });
      toast({
        title: "G\u00e9n\u00e9ration impossible",
        description,
        variant: "destructive",
      });
      setStep(generatedPreviewUrl ? "result" : "form");
      return false;
    }
  };

  const handleChatSubmit = async () => {
    const prompt = chatInput.trim();
    if (!prompt) return;

    const nextForm = buildFormFromConversation(form, prompt);

    setChatInput("");
    setForm(nextForm);
    setBuilderMessages((current) => [...current, createBuilderMessage("user", prompt)]);

    if (executionMode === "plan") {
      setBuilderMessages((current) => [
        ...current,
        createBuilderMessage("ai", buildPlanResponse(nextForm, prompt)),
      ]);
      toast({
        title: "Plan prêt",
        description: "Passez en mode Build pour lancer la preview réelle.",
      });
      return;
    }

    setBuilderMessages((current) => [
      ...current,
      createBuilderMessage(
        "ai",
        "Je lance l'analyse, la structure, le design et la finalisation de votre site.",
      ),
    ]);

    const success = await handleGenerate(step === "result", nextForm);

    setBuilderMessages((current) => [
      ...current,
      success
        ? createBuilderMessage(
            "ai",
            "La preview est prête. Vous pouvez l'améliorer, l'ouvrir ou la publier immédiatement.",
            "success",
          )
        : createBuilderMessage(
            "ai",
            "La génération a été interrompue. Aucun crédit n'a été débité et vous pouvez corriger le brief avant de relancer.",
            "warning",
          ),
    ]);
  };

  const runPrimaryBuilderAction = async () => {
    if (chatInput.trim()) {
      return handleChatSubmit();
    }

    if (!hasConversationBrief) {
      toast({
        title: "Brief manquant",
        description: "Décrivez votre activité, votre ville et votre offre avant de générer.",
      });
      return false;
    }

    return handleGenerate(hasGeneratedPreview);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[16%] top-[-260px] h-[460px] w-[460px] rounded-full bg-[rgba(245,197,66,0.08)] blur-[150px]" />
        <div className="absolute right-[-180px] top-[28%] h-[420px] w-[420px] rounded-full bg-[rgba(212,175,55,0.055)] blur-[150px]" />
      </div>
      <SEOHead
        title="Créer mon site | Pixelrises AI"
        description="Décrivez votre activité et générez une première version premium de votre site avec preview live."
      />

      {!isSupabaseConfigured ? (
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-16">
          <div className={`${shellClass} w-full p-8 text-center`}>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.10)] text-[#F5C542]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Service indisponible</h1>
            <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
              Le générateur a besoin d'une configuration Supabase valide. Vérifiez vos
              variables publiques avant de continuer.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-2xl">
                <Link to="/">Revenir à l'accueil</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-2xl border-white/10 bg-transparent text-white"
              >
                <Link to="/dashboard">Ouvrir le dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
            />
          )}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-white/10 bg-[rgba(5,5,5,0.96)] px-4 py-5 backdrop-blur-2xl transition-transform duration-300 xl:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                  <img src={pixelrisesLogo} alt="Pixelrises" className="h-10 w-auto" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl border border-[rgba(212,175,55,0.18)] text-[#F5C542] xl:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>

              <nav className="mt-7 space-y-1.5">
                {SIDEBAR_FEATURES.map((item) => {
                  const Icon = item.icon;
                  const isUnavailable = item.state !== "available";

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleFeatureClick(item)}
                       className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all ${
                        item.active
                          ? "border border-[rgba(212,175,55,0.28)] bg-[linear-gradient(180deg,rgba(245,197,66,0.18),rgba(212,175,55,0.08))] text-white shadow-[0_22px_36px_-26px_rgba(245,197,66,0.52)]"
                          : isUnavailable
                            ? DEVELOPMENT_SURFACE_CLASS
                            : "border border-transparent bg-transparent text-[#C7CBD4] hover:border-[rgba(212,175,55,0.14)] hover:bg-[rgba(255,255,255,0.03)]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            item.active
                              ? "bg-[rgba(245,197,66,0.20)] text-[#F5C542]"
                              : "bg-[rgba(255,255,255,0.04)] text-[#9CA3AF]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </span>
                      {isUnavailable && (
                        <span className={DEVELOPMENT_BADGE_CLASS}>
                          {DEVELOPMENT_BADGE_LABEL}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-4">
                <div className="rounded-[28px] border border-[rgba(212,175,55,0.18)] bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.18),transparent_40%),linear-gradient(180deg,rgba(17,17,17,0.98),rgba(8,8,8,0.96))] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(245,197,66,0.16)] text-[#F5C542]">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Passez à Pixelrises Pro</p>
                      <p className="text-xs text-[#9CA3AF]">Crédits, automatisations et support prioritaire.</p>
                    </div>
                  </div>
                  <Button
                    className="mt-4 h-11 w-full rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] text-sm font-semibold text-[#111111]"
                    onClick={openBillingSpace}
                  >
                    Voir les offres
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActivePanel("account");
                    setSidebarOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[24px] border border-[rgba(212,175,55,0.16)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(245,197,66,0.16)] text-sm font-semibold text-[#F5C542]">
                      {(displayName || "P").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      <p className="text-xs text-[#9CA3AF]">{roleLabel}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                </button>
              </div>
            </div>
          </aside>

          <div className="relative z-10 xl:pl-[260px]">
            <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(5,5,5,0.86)] backdrop-blur-2xl">
              <div className="mx-auto flex max-w-[1700px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-2xl border border-[rgba(212,175,55,0.16)] bg-[rgba(255,255,255,0.02)] text-[#F5C542]"
                  onClick={() => setSidebarOpen((previous) => !previous)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActivePanel(activePanel === "search" ? null : "search");
                    setCommandPaletteOpen(false);
                  }}
                  className="hidden min-w-0 flex-1 items-center gap-3 rounded-[24px] border border-[rgba(212,175,55,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-left transition hover:border-[rgba(212,175,55,0.24)] sm:flex sm:px-4"
                >
                  <Search className="h-4 w-4 text-[#9CA3AF]" />
                  <span className="hidden truncate text-sm text-[#9CA3AF] sm:inline">
                    Rechercher un projet, un template ou une génération...
                  </span>
                  <span className="ml-auto hidden rounded-xl border border-white/10 bg-[#111111] px-2.5 py-1 text-xs text-[#9CA3AF] sm:inline-flex">
                    Ctrl + K
                  </span>
                </button>

                <div className="hidden items-center gap-2 lg:flex">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePanel(activePanel === "gift" ? null : "gift");
                      setCommandPaletteOpen(false);
                    }}
                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.14)] bg-[rgba(255,255,255,0.02)] text-white/80 transition hover:border-[rgba(212,175,55,0.24)] hover:text-[#F5C542]"
                  >
                    <Gift className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsSeen(true);
                      setActivePanel(activePanel === "notifications" ? null : "notifications");
                      setCommandPaletteOpen(false);
                    }}
                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.14)] bg-[rgba(255,255,255,0.02)] text-white/80 transition hover:border-[rgba(212,175,55,0.24)] hover:text-[#F5C542]"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F5C542] px-1 text-[10px] font-semibold text-[#111111]">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePanel(activePanel === "account" ? null : "account");
                      setCommandPaletteOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-[24px] border border-[rgba(212,175,55,0.14)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-left transition hover:border-[rgba(212,175,55,0.24)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(245,197,66,0.16)] text-sm font-semibold text-[#F5C542]">
                      {(displayName || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden min-w-0 xl:block">
                      <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                      <p className="truncate text-xs text-[#9CA3AF]">{roleLabel}</p>
                    </div>
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setActivePanel(activePanel === "new-project" ? null : "new-project");
                    setCommandPaletteOpen(false);
                  }}
                  className="h-11 shrink-0 rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] px-3 text-sm font-semibold text-[#111111] sm:px-4"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nouveau projet</span>
                  <ChevronDown className="ml-2 hidden h-4 w-4 sm:inline" />
                </Button>
              </div>
            </header>

            <main className="mx-auto max-w-[1680px] px-4 pb-32 pt-5 sm:px-6 lg:px-7 xl:pb-16">
              <section className={`${shellClass} p-4 sm:p-5`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                      Générateur IA
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#9CA3AF]">
                      Écrivez votre brief à gauche. La preview se construit à droite.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[#D1D5DB]">
                      {credits} crédits
                    </span>
                    <span className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[#D1D5DB]">
                      Génération {GENERATION_COST} · Optimisation {OPTIMIZATION_COST}
                    </span>
                    <span className={`rounded-2xl border px-3 py-2 text-xs font-medium ${builderStatusTone}`}>
                      {previewStatusLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 xl:hidden">
                  {[
                    { key: "chat", label: "Chat" },
                    { key: "preview", label: "Preview" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setMobilePanel(tab.key as typeof mobilePanel)}
                      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        mobilePanel === tab.key
                          ? "bg-[rgba(245,197,66,0.14)] text-[#F5C542]"
                          : "border border-white/10 bg-[rgba(255,255,255,0.03)] text-[#C7CBD4]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(360px,500px)_minmax(0,1fr)]">
                <div className={`${mobilePanel !== "chat" ? "hidden xl:block" : "block"} min-h-0`}>
                  <section className={`${shellClass} flex min-h-[620px] max-h-[calc(100dvh-112px)] min-w-0 flex-col overflow-hidden p-4 xl:sticky xl:top-[84px] xl:h-[calc(100vh-104px)] xl:min-h-0`}>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.025] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.18)] bg-[rgba(245,197,66,0.10)] text-[#F5C542]">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-white">Votre brief</p>
                            <p className="mt-0.5 text-xs leading-5 text-[#9CA3AF]">
                              1 idée suffit. Pixelrises structure.
                            </p>
                          </div>
                        </div>
                        <div className="inline-flex shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                          {(["simple", "advanced"] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setBuilderMode(mode)}
                              className={`rounded-[14px] px-3 py-2 text-xs font-semibold transition ${
                                builderMode === mode
                                  ? "bg-[rgba(245,197,66,0.16)] text-[#F5C542]"
                                  : "text-[#9CA3AF] hover:text-white"
                              }`}
                            >
                              {mode === "simple" ? "Simple" : "Avancé"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/10 bg-[#080808] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{briefQualityLabel}</p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#D4AF37,#F5C542)] transition-all"
                                style={{ width: `${briefQualityScore}%` }}
                              />
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border border-[rgba(245,197,66,0.22)] bg-[rgba(245,197,66,0.10)] px-3 py-1 text-sm font-semibold text-[#F5C542]">
                            {briefQualityScore}%
                          </span>
                        </div>
                      </div>

                      <details className="group mt-3 rounded-2xl border border-white/10 bg-[#080808] p-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                          <span>Vision détectée</span>
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                              detectedVision.isActionable
                                ? "border-[#7ED957]/25 bg-[#7ED957]/10 text-[#B8F58A]"
                                : "border-white/10 bg-white/[0.04] text-[#9CA3AF]"
                            }`}
                          >
                            {detectedVision.isActionable ? "Claire" : "À préciser"}
                          </span>
                        </summary>
                        <p className="mt-2 text-xs leading-5 text-[#8E95A3]">{detectedVision.summary}</p>
                        {detectedVision.chips.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {detectedVision.chips.map((chip) => (
                              <span
                                key={chip}
                                className="rounded-full border border-white/10 bg-[#050505] px-2 py-1 text-[10px] font-medium text-[#D7DCE5]"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                      </details>
                    </div>

                    {hasGeneratedPreview && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => void handleImproveClick()}
                          className="rounded-2xl border border-white/10 bg-white/[0.025] px-2 py-2.5 text-xs font-medium text-white transition hover:border-[rgba(212,175,55,0.28)] hover:bg-[rgba(245,197,66,0.07)] sm:px-3 sm:text-sm"
                        >
                          Améliorer
                        </button>
                        <button
                          type="button"
                          onClick={handleChangeStyleClick}
                          className="rounded-2xl border border-white/10 bg-white/[0.025] px-2 py-2.5 text-xs font-medium text-white transition hover:border-[rgba(212,175,55,0.28)] hover:bg-[rgba(245,197,66,0.07)] sm:px-3 sm:text-sm"
                        >
                          Style
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyBrief()}
                          className="rounded-2xl border border-white/10 bg-white/[0.025] px-2 py-2.5 text-xs font-medium text-white transition hover:border-[rgba(212,175,55,0.28)] hover:bg-[rgba(245,197,66,0.07)] sm:px-3 sm:text-sm"
                        >
                          Copier
                        </button>
                      </div>
                    )}

                    {builderMode === "advanced" && (
                      <div className="mt-4 rounded-[24px] border border-white/10 bg-[#080808] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">Réglages avancés V1</p>
                            <p className="mt-1 text-xs text-[#8E95A3]">
                              Ajustez les leviers importants sans ouvrir un éditeur lourd.
                            </p>
                          </div>
                          <span className={DEVELOPMENT_BADGE_CLASS}>V1 léger</span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <select
                            value={form.objective}
                            onChange={(event) => updateForm("objective", event.target.value)}
                            className="h-11 rounded-2xl border border-white/10 bg-[#050505] px-3 text-sm text-white outline-none focus:border-[rgba(245,197,66,0.36)]"
                          >
                            {OBJECTIVES.map((objective) => (
                              <option key={objective} value={objective}>
                                {objective}
                              </option>
                            ))}
                          </select>
                          <select
                            value={form.style}
                            onChange={(event) => updateForm("style", event.target.value)}
                            className="h-11 rounded-2xl border border-white/10 bg-[#050505] px-3 text-sm text-white outline-none focus:border-[rgba(245,197,66,0.36)]"
                          >
                            {STYLES.map((style) => (
                              <option key={style} value={style}>
                                {style}
                              </option>
                            ))}
                          </select>
                          <select
                            value={form.positioning}
                            onChange={(event) => updateForm("positioning", event.target.value)}
                            className="h-11 rounded-2xl border border-white/10 bg-[#050505] px-3 text-sm text-white outline-none focus:border-[rgba(245,197,66,0.36)]"
                          >
                            {POSITIONINGS.map((positioning) => (
                              <option key={positioning} value={positioning}>
                                {positioning}
                              </option>
                            ))}
                          </select>
                          <input
                            value={form.cta}
                            onChange={(event) => updateForm("cta", event.target.value)}
                            placeholder="CTA principal"
                            className="h-11 rounded-2xl border border-white/10 bg-[#050505] px-3 text-sm text-white outline-none placeholder:text-[#6B7280] focus:border-[rgba(245,197,66,0.36)]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 rounded-[24px] border border-[rgba(212,175,55,0.14)] bg-[#080808] p-3">
                      <div className="space-y-3">
                        <Textarea
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void runPrimaryBuilderAction();
                            }
                          }}
                          placeholder="Décrivez le site à créer : activité, ville, offre, client cible, style souhaité et action principale..."
                          className="min-h-[150px] resize-none rounded-2xl border-white/10 bg-[#050505] text-[15px] leading-7 text-white placeholder:text-[#6B7280] focus:border-[rgba(245,197,66,0.36)] focus:ring-[rgba(245,197,66,0.16)]"
                        />
                        <div className="rounded-[18px] border border-white/10 bg-[#050505] px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F5C542]">
                                  Améliorer le rendu
                                </p>
                                <span className="text-[10px] text-[#8E95A3]">Prompt intact</span>
                              </div>
                            </div>
                            {selectedEnhancers.length > 0 && (
                              <span className="shrink-0 rounded-full border border-[rgba(245,197,66,0.22)] bg-[rgba(245,197,66,0.10)] px-2 py-0.5 text-[10px] font-semibold text-[#F5C542]">
                                {selectedEnhancers.length} actif{selectedEnhancers.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                            {QUICK_MODELS.map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => improveCurrentBrief(item.key)}
                                aria-pressed={selectedEnhancers.includes(item.key)}
                                title={item.instruction}
                                className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left text-[11px] leading-none transition duration-200 hover:-translate-y-0.5 ${
                                  selectedEnhancers.includes(item.key)
                                    ? "border-[#FFD84D] bg-[rgba(245,197,66,0.13)] text-white shadow-[0_10px_28px_-26px_rgba(245,197,66,0.8)]"
                                    : "border-white/10 bg-[#111111] text-[#D7DCE5] hover:border-[rgba(255,216,77,0.75)] hover:bg-[#191919]"
                                }`}
                              >
                                <Sparkles className="h-3 w-3 shrink-0 text-[#F5C542]" />
                                <span className="max-w-[150px] truncate font-semibold">{item.label}</span>
                                {selectedEnhancers.includes(item.key) && (
                                  <span className="ml-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[rgba(245,197,66,0.16)] text-[11px] font-bold text-[#F5C542]">
                                    ×
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        {!user ? (
                          <Button
                            className="hidden h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] px-5 text-sm font-semibold text-[#111111] xl:inline-flex"
                            onClick={() =>
                              navigate(buildAuthRoute(getCurrentRelativeUrl()), {
                                replace: true,
                              })
                            }
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            Connexion
                          </Button>
                        ) : (
                          <Button
                            className="hidden h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] px-5 text-sm font-semibold text-[#111111] xl:inline-flex"
                            onClick={() => void runPrimaryBuilderAction()}
                            disabled={executionMode === "build" && (!hasConversationBrief || isGenerating)}
                          >
                            <SendHorizontal className="mr-2 h-4 w-4" />
                            {primaryActionLabel}
                          </Button>
                        )}
                      </div>
                    </div>

                    {generationAlert && (
                      <div className="mt-4 rounded-[20px] border border-[#F5C542]/20 bg-[#11100A] p-3 shadow-[0_18px_50px_-40px_rgba(245,197,66,0.55)]">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{generationAlert.title}</p>
                            <p className="mt-1 max-h-24 overflow-y-auto break-words text-[13px] leading-6 text-[#D7D2C0]">{generationAlert.description}</p>
                            <p className="mt-2 text-xs font-medium text-[#F5C542]">
                              Aucun crédit n'a été débité.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <details className="group mt-4 rounded-[22px] border border-white/10 bg-white/[0.02] p-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
                        <span>Conseils du brief</span>
                        <span className="text-xs font-medium text-[#8E95A3]">
                          {liveSuggestions.length > 0 ? `${liveSuggestions.length} suggestion${liveSuggestions.length > 1 ? "s" : ""}` : "OK"}
                        </span>
                      </summary>

                    <div
                      ref={conversationScrollRef}
                      data-conversation-scroll="true"
                      aria-label="Conversation builder défilable"
                      className="mt-3 max-h-[280px] min-h-0 touch-pan-y space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(245,197,66,0.36)_transparent] [scrollbar-width:thin]"
                    >
                      {builderMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-[24px] border px-4 py-4 ${
                            message.role === "user"
                              ? "ml-auto max-w-[88%] border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)]"
                              : message.tone === "success"
                                ? "mr-auto max-w-[94%] border-[#7ED957]/20 bg-[#7ED957]/10"
                                : message.tone === "warning"
                                  ? "mr-auto max-w-[94%] border-red-500/20 bg-red-500/10"
                                  : "mr-auto max-w-[94%] border-white/10 bg-[rgba(255,255,255,0.03)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">
                              {message.role === "user" ? "Vous" : "Pixelrises AI"}
                            </span>
                            <span className="text-xs text-[#6B7280]">{message.time}</span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[#E5E7EB]">{message.content}</p>
                        </div>
                      ))}

                      <div className="rounded-[22px] border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">À préciser</p>
                          <Target className="h-4 w-4 text-[#F5C542]" />
                        </div>
                        <div className="mt-3 space-y-2">
                          {liveSuggestions.length > 0 ? (
                            liveSuggestions.map((suggestion) => (
                              <div
                                key={suggestion}
                                className="rounded-2xl border border-white/10 bg-[#080808] px-3 py-2 text-sm leading-6 text-[#C9CDD4]"
                              >
                                {suggestion}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-[rgba(212,175,55,0.18)] bg-[#080808] px-3 py-3 text-sm text-[#9CA3AF]">
                              Le brief est bien cadré. Vous pouvez lancer la génération.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                    </details>

                  </section>
                </div>

                <div className={`${mobilePanel === "chat" ? "hidden xl:block" : "block"} min-w-0 xl:col-span-1`}>
                  <section className={`${shellClass} sticky top-[84px] overflow-visible p-3`}>
                    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#080808] p-3 sm:p-4">
                      <div className="relative flex flex-col gap-4 border-b border-white/10 pb-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-base font-semibold text-white">Preview live</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${builderStatusTone}`}>
                                {previewStatusLabel}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#D1D5DB]">
                                {projectDisplayName}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDevice("desktop")}
                              className={`rounded-2xl border px-3 py-2 text-sm transition ${
                                previewDevice === "desktop"
                                  ? "border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.08)] text-[#F5C542]"
                                  : "border-white/10 text-[#9CA3AF]"
                              }`}
                            >
                              <Monitor className="mr-2 inline h-4 w-4" />
                              Desktop
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewDevice("mobile")}
                              className={`rounded-2xl border px-3 py-2 text-sm transition ${
                                previewDevice === "mobile"
                                  ? "border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.08)] text-[#F5C542]"
                                  : "border-white/10 text-[#9CA3AF]"
                              }`}
                            >
                              <Smartphone className="mr-2 inline h-4 w-4" />
                              Mobile
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setToolDropdownOpen((previous) => !previous)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-[#9CA3AF] transition hover:border-[rgba(212,175,55,0.24)] hover:text-[#F5C542]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {toolDropdownOpen && (
                                <div className="absolute right-0 top-12 z-20 min-w-[200px] rounded-[22px] border border-[rgba(212,175,55,0.16)] bg-[#0B0B0B] p-2 shadow-[0_24px_60px_-36px_rgba(245,197,66,0.45)]">
                                  {toolMenuItems.map((item) => (
                                    <button
                                      key={item.label}
                                      type="button"
                                      onClick={() => handleToolMenuClick(item.label)}
                                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition hover:bg-[rgba(255,255,255,0.03)] ${
                                        item.label === "Paiements"
                                          ? "text-white"
                                          : DEVELOPMENT_SURFACE_CLASS
                                      }`}
                                    >
                                      <span>{item.label}</span>
                                      {item.label !== "Paiements" && (
                                        <span className={DEVELOPMENT_BADGE_CLASS}>
                                          {DEVELOPMENT_BADGE_LABEL}
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handlePreviewClick}
                            disabled={previewActionsDisabled}
                            className="h-11 rounded-2xl border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.08)] text-[#F5C542] disabled:opacity-40"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ouvrir
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleGenerate(true)}
                            disabled={!hasGeneratedPreview || !hasConversationBrief || isGenerating}
                            className="h-11 rounded-2xl border-white/10 bg-transparent text-white/80 disabled:opacity-40"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Régénérer
                          </Button>
                          <Button
                            type="button"
                            onClick={handlePublishClick}
                            disabled={previewActionsDisabled}
                            className="h-11 rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] px-5 text-sm font-semibold text-[#111111] disabled:opacity-40"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Publier
                          </Button>
                        </div>

                        {generationNotice && (
                          <div className="rounded-[18px] border border-[#F5C542]/20 bg-[#11100A] px-4 py-3 text-sm leading-6 text-[#D7D2C0]">
                            <span className="font-semibold text-[#F5C542]">Mode continuité : </span>
                            {generationNotice}
                          </div>
                        )}
                      </div>

                      <div className="relative mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-[#080808] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        {hasGeneratedPreview && generatedPreviewUrl ? (
                          <div
                            className={`mx-auto ${previewDevice === "mobile" ? "max-w-[390px]" : "w-full"} overflow-hidden bg-white`}
                          >
                            <iframe
                              title="Site généré"
                              src={`${generatedPreviewUrl}${generatedPreviewUrl.includes("?") ? "&" : "?"}embed=1&v=${previewRefreshToken || generatedSiteId || "preview"}`}
                              className={`${previewDevice === "mobile" ? "h-[760px]" : "h-[calc(100vh-190px)] min-h-[720px]"} w-full border-0 bg-white`}
                            />
                          </div>
                        ) : isGenerating ? (
                          <div className="min-h-[640px] bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.10),transparent_36%),#090909] p-5 sm:p-7">
                            <PremiumLoadingAnimation
                              currentStage={loadingStage}
                              currentSubIndex={loadingSubIndex}
                              progress={loadingProgress}
                            />
                          </div>
                        ) : (
                          <div className="flex min-h-[640px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.10),transparent_34%),linear-gradient(180deg,#0A0A0A_0%,#080808_100%)] p-5 sm:p-8">
                            <div className="w-full max-w-xl rounded-[28px] border border-[rgba(212,175,55,0.16)] bg-black/35 p-6 text-center shadow-[0_30px_90px_-60px_rgba(245,197,66,0.45)] sm:p-8">
                              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.10)] text-[#F5C542]">
                                <Monitor className="h-6 w-6" />
                              </div>
                              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">Aucune preview générée</h3>
                              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#B8BEC8]">
                                La zone de droite affiche uniquement le site réel créé par Pixelrises. Lancez une génération pour voir la preview finale ici.
                              </p>
                              <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                                {["Brief", "Génération", "Preview réelle"].map((label, index) => (
                                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <span className="text-xs font-semibold text-[#F5C542]">0{index + 1}</span>
                                    <p className="mt-2 text-sm font-medium text-white">{label}</p>
                                  </div>
                                ))}
                              </div>
                              <Button
                                type="button"
                                onClick={() => void handlePrimaryGenerationClick()}
                                disabled={!hasConversationBrief || isGenerating}
                                className="mt-7 h-12 rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] px-6 text-sm font-semibold text-[#111111] shadow-[0_18px_55px_-32px_rgba(245,197,66,0.9)] disabled:opacity-40"
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Générer le site
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </section>
                </div>
              </div>

              {!isGenerating && mobilePanel === "chat" && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgba(212,175,55,0.14)] bg-[rgba(5,5,5,0.94)] p-4 backdrop-blur xl:hidden">
                  {!user ? (
                    <Button
                      size="lg"
                      className="h-14 w-full rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] text-base font-semibold text-[#111111]"
                      onClick={() =>
                        navigate(buildAuthRoute(getCurrentRelativeUrl()), {
                          replace: true,
                        })
                      }
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Me connecter
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="h-14 w-full rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] text-base font-semibold text-[#111111]"
                      onClick={() => void runPrimaryBuilderAction()}
                      disabled={executionMode === "build" && (!hasConversationBrief || isGenerating)}
                    >
                      <SendHorizontal className="mr-2 h-5 w-5" />
                      {primaryActionLabel} avec Pixelrises AI
                    </Button>
                  )}
                </div>
              )}
            </main>
          </div>

          {(activePanel || commandPaletteOpen) && (
            <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={closePanels}>
              <div className="flex min-h-full items-start justify-center px-4 py-20">
                {commandPaletteOpen ? (
                  <div className={`${shellClass} w-full max-w-2xl p-5`} onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                      <Search className="h-4 w-4 text-[#9CA3AF]" />
                      <input value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Chercher une action..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6B7280]" autoFocus />
                    </div>
                    <div className="mt-4 space-y-2">
                      {filteredCommandActions.length > 0 ? (
                        filteredCommandActions.map((action) => (
                          <button key={action.id} type="button" onClick={() => { setCommandPaletteOpen(false); action.run(); }} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left transition hover:border-[rgba(212,175,55,0.20)]">
                            <div>
                              <p className="text-sm font-medium text-white">{action.label}</p>
                              <p className="mt-1 text-xs text-[#9CA3AF]">{action.helper}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 -rotate-90 text-[#F5C542]" />
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[rgba(212,175,55,0.18)] bg-[#0A0A0A] px-4 py-5 text-sm text-[#9CA3AF]">Aucune action ne correspond à votre recherche.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`${shellClass} w-full max-w-xl p-5`} onClick={(event) => event.stopPropagation()}>
                    {activePanel === "search" && (
                      <>
                        <div className="flex items-center gap-3 rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                          <Search className="h-4 w-4 text-[#9CA3AF]" />
                          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher un projet, un template ou une génération..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6B7280]" autoFocus />
                        </div>
                        <div className="mt-4 space-y-2">
                          {searchResults.length > 0 ? (
                            searchResults.map((item) => (
                              <button key={item.id} type="button" onClick={item.action} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left transition hover:border-[rgba(212,175,55,0.20)]">
                                <div>
                                  <p className="text-sm font-medium text-white">{item.title}</p>
                                  <p className="mt-1 text-xs text-[#9CA3AF]">{item.subtitle}</p>
                                </div>
                                <ChevronDown className="h-4 w-4 -rotate-90 text-[#F5C542]" />
                              </button>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-[rgba(212,175,55,0.18)] bg-[#0A0A0A] px-4 py-5 text-sm text-[#9CA3AF]">Recherche avancée bientôt disponible.</div>
                          )}
                        </div>
                      </>
                    )}
                    {activePanel === "gift" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Bonus Pixelrises</h3>
                        <p className="text-sm leading-7 text-[#9CA3AF]">Les offres de bienvenue et bonus complémentaires arrivent bientôt.</p>
                        <div className="rounded-2xl border border-[rgba(212,175,55,0.18)] bg-[rgba(245,197,66,0.08)] p-4 text-sm text-[#E5E7EB]">Bonus bientôt disponible</div>
                        <Button className="rounded-2xl bg-[linear-gradient(180deg,#F5C542_0%,#D4AF37_100%)] text-[#111111]" onClick={openBillingSpace}>Voir les offres</Button>
                      </div>
                    )}
                    {activePanel === "notifications" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                            <p className="mt-1 text-sm text-[#9CA3AF]">Retours utiles sur vos projets et votre activité.</p>
                          </div>
                          <Button variant="outline" className="rounded-2xl border-white/10 bg-transparent text-white" onClick={() => setNotificationsSeen(true)}>Tout lire</Button>
                        </div>
                        <div className="space-y-2">
                          {notifications.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3">
                              <p className="text-sm font-medium text-white">{item.title}</p>
                              <p className="mt-1 text-xs text-[#9CA3AF]">{item.description}</p>
                              <p className="mt-2 text-[11px] text-[#6B7280]">{item.time}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {activePanel === "account" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(245,197,66,0.16)] text-base font-semibold text-[#F5C542]">{(displayName || "P").charAt(0).toUpperCase()}</div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{displayName}</h3>
                            <p className="text-sm text-[#9CA3AF]">{user?.email || "Compte invité"}</p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#E5E7EB]">Crédits : {credits}</div>
                          <Button variant="outline" className="justify-start rounded-2xl border-white/10 bg-transparent text-white" onClick={() => navigate("/dashboard")}>Mon compte</Button>
                          <Button variant="outline" className="justify-start rounded-2xl border-white/10 bg-transparent text-white" onClick={openBillingSpace}>Crédits</Button>
                          <Button variant="outline" className={`justify-start rounded-2xl ${DEVELOPMENT_SURFACE_CLASS}`} onClick={() => { notifyFeatureInDevelopment("Paramètres"); setFeaturePanel({ label: "Paramètres", state: "soon" }); setActivePanel("feature"); }}>Paramètres · {DEVELOPMENT_BADGE_LABEL}</Button>
                          {user && <Button variant="outline" className="justify-start rounded-2xl border-white/10 bg-transparent text-white" onClick={() => void handleSignOut()}>Déconnexion</Button>}
                        </div>
                      </div>
                    )}
                    {activePanel === "new-project" && (
                      <div className="space-y-3">
                        <button type="button" onClick={() => { setForm(defaultForm); setSelectedEnhancers([]); setGenerationAlert(null); setGenerationNotice(null); setStep("form"); setMobilePanel("chat"); closePanels(); toast({ title: "Nouveau brief prêt", description: "Vous pouvez repartir d'une base vide." }); }} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left transition hover:border-[rgba(212,175,55,0.20)]">
                          <div><p className="text-sm font-medium text-white">Créer un site</p><p className="mt-1 text-xs text-[#9CA3AF]">Réinitialiser le brief et repartir proprement.</p></div><ChevronDown className="h-4 w-4 -rotate-90 text-[#F5C542]" />
                        </button>
                        <button type="button" onClick={() => { notifyFeatureInDevelopment("Templates"); setFeaturePanel({ label: "Templates", state: "progress" }); setActivePanel("feature"); }} className={`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left transition hover:border-[rgba(212,175,55,0.16)] ${DEVELOPMENT_SURFACE_CLASS}`}>
                          <div><p className="text-sm font-medium text-white">Utiliser un template</p><p className="mt-1 text-xs text-[#8C919B]">Bientôt disponible</p></div><span className={DEVELOPMENT_BADGE_CLASS}>{DEVELOPMENT_BADGE_LABEL}</span>
                        </button>
                        <button type="button" onClick={() => { notifyFeatureInDevelopment("Importer un brief"); setFeaturePanel({ label: "Importer un brief", state: "soon" }); setActivePanel("feature"); }} className={`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left transition hover:border-[rgba(212,175,55,0.16)] ${DEVELOPMENT_SURFACE_CLASS}`}>
                          <div><p className="text-sm font-medium text-white">Importer un brief</p><p className="mt-1 text-xs text-[#8C919B]">Bientôt disponible</p></div><span className={DEVELOPMENT_BADGE_CLASS}>{DEVELOPMENT_BADGE_LABEL}</span>
                        </button>
                      </div>
                    )}
                    {activePanel === "feature" && activeFeatureInfo && (
                      <div className="space-y-4">
                        <div className="mb-2 inline-flex rounded-full border border-[rgba(212,175,55,0.12)] bg-[rgba(212,175,55,0.05)] px-2.5 py-0.5 text-[11px] font-medium text-[#D8BC63]">{activeFeatureInfo.badge}</div>
                        <h3 className="text-lg font-semibold text-white">{activeFeatureInfo.title}</h3>
                        <p className="text-sm leading-7 text-[#9CA3AF]">{activeFeatureInfo.description}</p>
                        <Button variant="outline" className="rounded-2xl border-white/10 bg-transparent text-white" onClick={closePanels}>Compris</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <Footer />
        </>
      )}
    </div>
  );
};

export default PixelrisesAI;
