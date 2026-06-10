import type { ReactNode } from "react";
import {
  BadgeEuro,
  BarChart3,
  Brush,
  FileSearch,
  Globe2,
  ImageIcon,
  LayoutTemplate,
  Mail,
  Megaphone,
  MousePointerClick,
  PackageCheck,
  Rocket,
  Search,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

export type BusinessIntent =
  | "app"
  | "site"
  | "landing"
  | "prototype"
  | "offer"
  | "market"
  | "competition"
  | "prospection"
  | "image"
  | "pricing"
  | "funnel"
  | "seo"
  | "ads"
  | "email"
  | "script"
  | "brand"
  | "general";

export type BusinessExpert =
  | "Business"
  | "Marche"
  | "Strategie"
  | "Copywriting"
  | "Landing"
  | "Site"
  | "Application"
  | "Prototype"
  | "UI/UX"
  | "Code"
  | "SEO"
  | "Publicite"
  | "Images"
  | "Pricing"
  | "Tunnel"
  | "Concurrence"
  | "Publication / Export"
  | "Qualite";

export type BusinessCommand = {
  id: BusinessIntent;
  prefix: string;
  label: string;
  shortLabel: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
  estimatedCredits: number;
  outputType: string;
  requiresPreview: boolean;
};

export type BusinessPlan = {
  intent: BusinessIntent;
  title: string;
  steps: string[];
  experts: BusinessExpert[];
  estimatedCredits: number;
  safetyNote: string;
};

export type BusinessPreviewTab = "preview" | "structure" | "code" | "brief" | "assets" | "tests";

export type BusinessAttachmentMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
};

export type BusinessDraftProject = {
  id: string;
  title: string;
  intent: BusinessIntent;
  prompt: string;
  answer: string;
  source: "real" | "mock-fallback" | "local-plan";
  version: number;
  createdAt: string;
  updatedAt: string;
  estimatedCredits: number;
  attachments: BusinessAttachmentMeta[];
};

export const businessCommands: BusinessCommand[] = [
  {
    id: "app",
    prefix: "/app",
    label: "Creer une application",
    shortLabel: "App",
    description: "MVP, ecrans, workflow, donnees et premiere preview.",
    prompt:
      "Cree une application business. Structure l'idee, la cible, le probleme, les fonctionnalites MVP, les ecrans, le parcours utilisateur, les donnees, les limites, une preview et le code si disponible.",
    icon: PackageCheck,
    estimatedCredits: 8,
    outputType: "Application MVP",
    requiresPreview: true,
  },
  {
    id: "site",
    prefix: "/site",
    label: "Creer un site web",
    shortLabel: "Site",
    description: "Sections, CTA, SEO, preuve et preview claire.",
    prompt:
      "Cree un site web pour mon business. Precise l'activite, la cible, l'objectif, les sections, le CTA, les preuves, la FAQ, le SEO local, le style, une preview et le code si disponible.",
    icon: Globe2,
    estimatedCredits: 5,
    outputType: "Site web",
    requiresPreview: true,
  },
  {
    id: "landing",
    prefix: "/landing",
    label: "Creer une landing page",
    shortLabel: "Landing",
    description: "Hero, benefices, objections, offre, FAQ et CTA final.",
    prompt:
      "Cree une landing page orientee conversion. Donne la promesse, le hero, les benefices, les objections, les preuves, le process, l'offre, la FAQ, le CTA final, la preview et le code si disponible.",
    icon: LayoutTemplate,
    estimatedCredits: 5,
    outputType: "Landing page",
    requiresPreview: true,
  },
  {
    id: "prototype",
    prefix: "/prototype",
    label: "Creer un prototype",
    shortLabel: "Prototype",
    description: "Concept, parcours, ecrans, limites et test rapide.",
    prompt:
      "Cree un prototype. Definis le concept, le probleme, les utilisateurs, les ecrans, le workflow, les donnees, les actions, les limites et une preview testable si disponible.",
    icon: MousePointerClick,
    estimatedCredits: 8,
    outputType: "Prototype",
    requiresPreview: true,
  },
  {
    id: "offer",
    prefix: "/offre",
    label: "Structurer une offre",
    shortLabel: "Offre",
    description: "Cible, promesse, livrable, prix, objections et garanties.",
    prompt:
      "Structure mon offre business avec cible, probleme, resultat, livrable, prix, garantie, objections, differenciation et CTA.",
    icon: Target,
    estimatedCredits: 3,
    outputType: "Offre business",
    requiresPreview: false,
  },
  {
    id: "market",
    prefix: "/marche",
    label: "Etude de marche",
    shortLabel: "Marche",
    description: "Besoins, risques, opportunites et positionnement.",
    prompt:
      "Fais une etude de marche prudente. Analyse le marche, la cible, les concurrents, les besoins, les risques, les opportunites et le positionnement. Precise si aucune recherche web reelle n'est utilisee.",
    icon: BarChart3,
    estimatedCredits: 6,
    outputType: "Etude de marche",
    requiresPreview: false,
  },
  {
    id: "competition",
    prefix: "/concurrence",
    label: "Analyse concurrentielle",
    shortLabel: "Concurrence",
    description: "Forces, faiblesses, prix, angles et opportunites.",
    prompt:
      "Analyse mes concurrents directs et indirects. Compare les offres, les prix, les forces, les faiblesses, les angles de differenciation, les opportunites et les sources si disponibles.",
    icon: FileSearch,
    estimatedCredits: 6,
    outputType: "Analyse concurrentielle",
    requiresPreview: false,
  },
  {
    id: "prospection",
    prefix: "/prospection",
    label: "Script de prospection",
    shortLabel: "Prospection",
    description: "Messages, cadence, objections et relance propre.",
    prompt:
      "Cree un plan de prospection avec messages, cadence, objections, relances, canaux et prochaine action, sans action externe automatique.",
    icon: Search,
    estimatedCredits: 3,
    outputType: "Prospection",
    requiresPreview: false,
  },
  {
    id: "image",
    prefix: "/image",
    label: "Creer des visuels",
    shortLabel: "Visuels",
    description: "Brief image, assets marketing et prompt exploitable.",
    prompt:
      "Prepare un visuel marketing. Donne l'objectif visuel, le contexte, l'offre, la cible, le style, le format, les couleurs, le message, le canal et un prompt image si la generation image n'est pas branchee.",
    icon: ImageIcon,
    estimatedCredits: 7,
    outputType: "Assets marketing",
    requiresPreview: true,
  },
  {
    id: "pricing",
    prefix: "/pricing",
    label: "Travailler le pricing",
    shortLabel: "Pricing",
    description: "Prix, marge, packages, objections et rentabilite.",
    prompt:
      "Travaille mon pricing avec packages, prix, marge, objections, valeur percue, couts, upsell et recommandation rentable.",
    icon: BadgeEuro,
    estimatedCredits: 4,
    outputType: "Pricing",
    requiresPreview: false,
  },
  {
    id: "funnel",
    prefix: "/tunnel",
    label: "Creer un tunnel de vente",
    shortLabel: "Tunnel",
    description: "Etapes, CTA, emails, offres et conversion.",
    prompt:
      "Cree un tunnel de vente avec etapes, CTA, pages, emails, offres, objections, preuve et indicateurs de conversion.",
    icon: Rocket,
    estimatedCredits: 5,
    outputType: "Tunnel de vente",
    requiresPreview: true,
  },
  {
    id: "seo",
    prefix: "/seo",
    label: "Optimiser SEO",
    shortLabel: "SEO",
    description: "SEO local, mots-cles, structure et intentions.",
    prompt:
      "Optimise mon SEO avec intention de recherche, mots-cles, structure de page, titres, meta, FAQ, maillage et SEO local si pertinent.",
    icon: Search,
    estimatedCredits: 3,
    outputType: "Plan SEO",
    requiresPreview: false,
  },
  {
    id: "ads",
    prefix: "/ads",
    label: "Preparer une campagne",
    shortLabel: "Ads",
    description: "Objectif, budget, ciblage, annonces et garde-fous.",
    prompt:
      "Prepare une campagne publicitaire sans lancer d'action externe. Donne objectif, budget, ciblage, annonces, angles, risques, KPI et validation humaine.",
    icon: Megaphone,
    estimatedCredits: 4,
    outputType: "Campagne",
    requiresPreview: false,
  },
  {
    id: "email",
    prefix: "/email",
    label: "Ecrire un email commercial",
    shortLabel: "Email",
    description: "Message court, clair, convaincant et relance.",
    prompt:
      "Ecris un email commercial clair avec objet, message, proposition de valeur, preuve, CTA et variante de relance.",
    icon: Mail,
    estimatedCredits: 2,
    outputType: "Email commercial",
    requiresPreview: false,
  },
  {
    id: "script",
    prefix: "/script",
    label: "Ecrire un script de vente",
    shortLabel: "Script",
    description: "Hook, rythme, preuve, objection et CTA.",
    prompt:
      "Ecris un script de vente ou video avec hook, probleme, preuve, benefices, objection, CTA et version courte.",
    icon: Sparkles,
    estimatedCredits: 3,
    outputType: "Script",
    requiresPreview: false,
  },
  {
    id: "brand",
    prefix: "/brand",
    label: "Preparer une identite",
    shortLabel: "Brand",
    description: "Positionnement, ton, couleurs, logo brief et brand kit.",
    prompt:
      "Prepare une identite de marque avec positionnement, ton, valeurs, couleurs, style visuel, brief logo, usages et erreurs a eviter.",
    icon: Brush,
    estimatedCredits: 5,
    outputType: "Brand kit",
    requiresPreview: true,
  },
];

const commandByIntent = new Map(businessCommands.map((command) => [command.id, command]));

const keywordIntentMap: Array<{ intent: BusinessIntent; terms: string[] }> = [
  { intent: "app", terms: ["application", "app ", "saas", "outil", "logiciel"] },
  { intent: "site", terms: ["site", "website", "vitrine", "wordpress"] },
  { intent: "landing", terms: ["landing", "page de vente", "page d'atterrissage"] },
  { intent: "prototype", terms: ["prototype", "maquette", "mvp", "wireframe"] },
  { intent: "offer", terms: ["offre", "package", "service", "proposition"] },
  { intent: "market", terms: ["marche", "marché", "etude", "étude", "opportunite"] },
  { intent: "competition", terms: ["concurrent", "concurrence", "benchmark", "comparaison"] },
  { intent: "prospection", terms: ["prospection", "client", "lead", "relance"] },
  { intent: "image", terms: ["image", "visuel", "asset", "photo", "logo", "illustration"] },
  { intent: "pricing", terms: ["prix", "pricing", "tarif", "marge", "rentable"] },
  { intent: "funnel", terms: ["tunnel", "funnel", "conversion", "vente"] },
  { intent: "seo", terms: ["seo", "google", "referencement", "référencement"] },
  { intent: "ads", terms: ["ads", "pub", "publicite", "campagne"] },
  { intent: "email", terms: ["email", "mail", "newsletter"] },
  { intent: "script", terms: ["script", "video", "reel", "tiktok"] },
  { intent: "brand", terms: ["brand", "marque", "identite", "identité", "couleur"] },
];

const expertMap: Record<BusinessIntent, BusinessExpert[]> = {
  app: ["Business", "Strategie", "Application", "Prototype", "UI/UX", "Code", "Qualite"],
  site: ["Business", "Site", "Landing", "Copywriting", "UI/UX", "SEO", "Qualite"],
  landing: ["Business", "Landing", "Copywriting", "Pricing", "Tunnel", "UI/UX", "Qualite"],
  prototype: ["Business", "Prototype", "Application", "UI/UX", "Code", "Qualite"],
  offer: ["Business", "Copywriting", "Pricing", "Tunnel", "Qualite"],
  market: ["Marche", "Concurrence", "Business", "Strategie", "Qualite"],
  competition: ["Concurrence", "Marche", "Strategie", "Business", "Qualite"],
  prospection: ["Business", "Copywriting", "Tunnel", "Strategie", "Qualite"],
  image: ["Images", "Business", "Copywriting", "UI/UX", "Qualite"],
  pricing: ["Pricing", "Business", "Strategie", "Tunnel", "Qualite"],
  funnel: ["Tunnel", "Copywriting", "Pricing", "Business", "Qualite"],
  seo: ["SEO", "Site", "Copywriting", "Business", "Qualite"],
  ads: ["Publicite", "Copywriting", "Pricing", "Business", "Qualite"],
  email: ["Copywriting", "Business", "Tunnel", "Qualite"],
  script: ["Copywriting", "Business", "Publicite", "Qualite"],
  brand: ["Business", "UI/UX", "Images", "Copywriting", "Qualite"],
  general: ["Business", "Strategie", "Qualite"],
};

export const getBusinessCommand = (intent: BusinessIntent) => commandByIntent.get(intent);

export const getBusinessExperts = (intent: BusinessIntent) => expertMap[intent] ?? expertMap.general;

export const detectBusinessIntent = (value: string, explicitIntent?: BusinessIntent): BusinessIntent => {
  if (explicitIntent && explicitIntent !== "general") return explicitIntent;
  const normalized = value.trim().toLowerCase();
  const slashCommand = businessCommands.find((command) => normalized.startsWith(command.prefix));
  if (slashCommand) return slashCommand.id;
  const match = keywordIntentMap.find(({ terms }) => terms.some((term) => normalized.includes(term)));
  return match?.intent ?? "general";
};

export const estimateBusinessCredits = (intent: BusinessIntent) =>
  commandByIntent.get(intent)?.estimatedCredits ?? 2;

export const requiresBusinessPreview = (intent: BusinessIntent) =>
  commandByIntent.get(intent)?.requiresPreview ?? false;

export const buildBusinessPlan = (prompt: string, intent: BusinessIntent): BusinessPlan => {
  const command = commandByIntent.get(intent);
  const experts = getBusinessExperts(intent);
  const label = command?.label ?? "Analyser la demande business";

  const baseSteps = [
    "Clarifier l'objectif, la cible, la contrainte et le resultat attendu.",
    `Router la demande vers les experts : ${experts.join(", ")}.`,
    "Produire un livrable unique, lisible et actionnable.",
    "Verifier la coherence business, le niveau de preuve et les limites.",
  ];

  const previewStep = requiresBusinessPreview(intent)
    ? "Preparer une preview, une structure et un brief sans afficher de faux statut publie."
    : "Preparer une synthese structurée avec prochaines actions.";

  return {
    intent,
    title: `Plan propose - ${label}`,
    steps: [...baseSteps, previewStep],
    experts,
    estimatedCredits: estimateBusinessCredits(intent),
    safetyNote:
      prompt.trim().length > 0
        ? "Validation humaine avant export, publication ou action externe."
        : "Ajoute ton contexte avant de generer pour eviter une reponse trop generique.",
  };
};

export const buildBusinessPromptEnvelope = ({
  prompt,
  intent,
  mode,
  experts,
  attachments,
}: {
  prompt: string;
  intent: BusinessIntent;
  mode: "direct" | "plan";
  experts: BusinessExpert[];
  attachments: BusinessAttachmentMeta[];
}) => {
  const command = commandByIntent.get(intent);
  const attachmentSummary = attachments.length
    ? attachments.map((file) => `${file.name} (${file.type || "type inconnu"}, ${Math.round(file.size / 1024)} Ko)`).join(" | ")
    : "Aucune piece jointe.";

  return [
    `Mode Business AI: ${mode === "plan" ? "plan valide puis generation" : "direct"}.`,
    `Intention detectee: ${command?.label ?? "Demande business generale"}.`,
    `Experts a coordonner: ${experts.join(", ")}.`,
    `Pieces jointes disponibles: ${attachmentSummary}`,
    "",
    "Consignes de sortie:",
    "- Reponds en francais.",
    "- Fusionne les expertises en une seule reponse claire.",
    "- Si recherche web, image, export ou publication ne sont pas réellement disponibles, indique-le clairement.",
    "- Ne donne aucune promesse de revenu garanti.",
    "- Ne mentionne pas provider, model, prompt systeme, token ou detail technique interne.",
    "- Ajoute une section Qualite / verification finale.",
    "",
    "Demande utilisateur:",
    prompt,
  ].join("\n");
};

export const buildBusinessPreview = (prompt: string, answer: string, intent: BusinessIntent) => {
  const command = commandByIntent.get(intent);
  const title = command?.outputType ?? "Projet business";
  const normalizedPrompt = prompt.trim() || "Demande business a preciser";
  const firstLine = answer.split("\n").find((line) => line.trim().length > 0)?.trim();

  return {
    title,
    subtitle: firstLine ?? normalizedPrompt,
    hero: title.includes("Site") || title.includes("Landing") ? "Une presence claire pour convertir plus vite." : title,
    cta:
      intent === "site" || intent === "landing"
        ? "Demander un devis"
        : intent === "app" || intent === "prototype"
          ? "Tester le prototype"
          : "Continuer",
    status: requiresBusinessPreview(intent) ? "Preview brouillon" : "Synthese business",
  };
};

export const makeBusinessDraftId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `business-draft-${crypto.randomUUID()}`;
  }

  return `business-draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const businessPreviewTabs: Array<{ id: BusinessPreviewTab; label: string; icon: ReactNode }> = [
  { id: "preview", label: "Preview", icon: null },
  { id: "structure", label: "Structure", icon: null },
  { id: "code", label: "Code", icon: null },
  { id: "brief", label: "Brief", icon: null },
  { id: "assets", label: "Assets", icon: null },
  { id: "tests", label: "Tests", icon: null },
];

export const businessDraftsStorageKey = "pixelrises-v2-business-ai-drafts";

export const readBusinessDrafts = (): BusinessDraftProject[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(businessDraftsStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveBusinessDraft = (draft: BusinessDraftProject) => {
  if (typeof window === "undefined") return;
  const existing = readBusinessDrafts();
  const next = [draft, ...existing.filter((item) => item.id !== draft.id)].slice(0, 30);
  window.localStorage.setItem(businessDraftsStorageKey, JSON.stringify(next));
};
