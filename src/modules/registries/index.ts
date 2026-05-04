import {
  BarChart3,
  Bot,
  Brain,
  Brush,
  Cable,
  Code2,
  CreditCard,
  Gamepad2,
  Globe2,
  MessageCircle,
  Palette,
  PenLine,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  Trophy,
  Webhook,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ProjectType } from "@/modules/creation-engine";

export type RegistryStatus = "connected" | "available" | "development" | "soon" | "requested" | "beta" | "configure";

export type CreationCard = {
  type: ProjectType;
  title: string;
  benefit: string;
  description: string;
  example: string;
  href: string;
  status: RegistryStatus;
  icon: LucideIcon;
};

export const creationCards: CreationCard[] = [
  {
    type: "site",
    title: "Créer un site",
    benefit: "Transformer une idée en présence crédible.",
    description: "Génère structure, textes, CTA, SEO, preuves et preview responsive.",
    example: "Landing premium pour un coach, restaurant, service local ou agence.",
    href: "/builder/site",
    status: "available",
    icon: Globe2,
  },
  {
    type: "agent",
    title: "Créer un agent IA",
    benefit: "Avoir un assistant adapté à ton projet.",
    description: "Définis rôle, ton, contexte, permissions et prompts de test.",
    example: "Agent marketing, SEO, support, game design ou business strategy.",
    href: "/builder/agent",
    status: "available",
    icon: Bot,
  },
  {
    type: "game",
    title: "Créer un jeu",
    benefit: "Passer d'une idée à un blueprint exploitable.",
    description: "Prépare concept, gameplay loop, scripts, assets et checklist.",
    example: "Roblox obby, Minecraft add-on, île UEFN ou web game simple.",
    href: "/builder/game",
    status: "beta",
    icon: Gamepad2,
  },
];

export const componentRegistry = [
  "Hero",
  "Services",
  "Pricing",
  "Testimonials",
  "FAQ",
  "CTA",
  "Forms",
  "Product Cards",
  "Dashboard Cards",
  "Agent Cards",
  "Game Cards",
  "Integration Cards",
  "Preview Frames",
];

export const siteTemplateRegistry = [
  { id: "restaurant", name: "Restaurant premium", category: "site", score: 88, icon: Store },
  { id: "coach", name: "Coach transformation", category: "site", score: 86, icon: Target },
  { id: "service-local", name: "Service local devis", category: "site", score: 84, icon: ShieldCheck },
  { id: "ecommerce", name: "E-commerce produit", category: "site", score: 82, icon: ShoppingBag },
  { id: "agency", name: "Agence B2B", category: "site", score: 87, icon: Rocket },
  { id: "portfolio", name: "Portfolio expert", category: "site", score: 80, icon: Palette },
];

export const agentRegistry = [
  {
    id: "builder",
    name: "Agent Builder",
    role: "Création complète",
    description: "Crée une première version complète de projet.",
    status: "available" as RegistryStatus,
    badge: "Recommandé",
    exampleAction: "Créer une landing premium pour un service local.",
    icon: Sparkles,
  },
  {
    id: "seo",
    name: "Agent SEO",
    role: "Visibilité",
    description: "Optimise titres, descriptions, mots-clés, FAQ et structure.",
    status: "available" as RegistryStatus,
    badge: "Disponible",
    exampleAction: "Préparer le SEO local d'un site.",
    icon: Search,
  },
  {
    id: "design",
    name: "Agent Design",
    role: "Direction visuelle",
    description: "Améliore layout, spacing, cohérence et perception premium.",
    status: "available" as RegistryStatus,
    badge: "Disponible",
    exampleAction: "Rendre une page plus premium sans la surcharger.",
    icon: Brush,
  },
  {
    id: "copywriting",
    name: "Agent Copywriting",
    role: "Clarté et persuasion",
    description: "Réécrit les textes pour la clarté, la crédibilité et la conversion.",
    status: "available" as RegistryStatus,
    badge: "Disponible",
    exampleAction: "Améliorer un hero et ses CTA.",
    icon: PenLine,
  },
  {
    id: "conversion",
    name: "Agent Conversion",
    role: "CTA et preuves",
    description: "Analyse CTA, objections, preuves, tunnel et section contact.",
    status: "available" as RegistryStatus,
    badge: "Recommandé",
    exampleAction: "Identifier les freins qui bloquent les leads.",
    icon: Target,
  },
  {
    id: "business",
    name: "Agent Business",
    role: "Positionnement",
    description: "Améliore offre, promesse, pricing et proposition de valeur.",
    status: "available" as RegistryStatus,
    badge: "Disponible",
    exampleAction: "Clarifier une offre en une phrase.",
    icon: Brain,
  },
  {
    id: "improve",
    name: "Agent Improve",
    role: "Amélioration ciblée",
    description: "Propose des patchs concrets sans tout régénérer.",
    status: "available" as RegistryStatus,
    badge: "Disponible",
    exampleAction: "Améliorer uniquement la section FAQ.",
    icon: Zap,
  },
  {
    id: "game-design",
    name: "Agent Game Design",
    role: "Concept et gameplay",
    description: "Crée concept, gameplay loop, règles et progression.",
    status: "beta" as RegistryStatus,
    badge: "Bêta",
    exampleAction: "Créer un concept Roblox tycoon.",
    icon: Gamepad2,
  },
  {
    id: "script",
    name: "Agent Script",
    role: "Snippets",
    description: "Prépare Luau, Verse, JSON ou JS selon la plateforme.",
    status: "beta" as RegistryStatus,
    badge: "Bêta",
    exampleAction: "Préparer un snippet Luau de checkpoint.",
    icon: Code2,
  },
  {
    id: "assets",
    name: "Agent Assets",
    role: "Assets et prompts",
    description: "Prépare assets, prompts visuels, UI et thumbnails.",
    status: "beta" as RegistryStatus,
    badge: "Bêta",
    exampleAction: "Lister les assets d'une map Minecraft.",
    icon: Palette,
  },
  {
    id: "publishing",
    name: "Agent Publishing",
    role: "Checklist",
    description: "Prépare une checklist publication sans publier automatiquement.",
    status: "beta" as RegistryStatus,
    badge: "Bêta",
    exampleAction: "Préparer une checklist UEFN.",
    icon: Trophy,
  },
];

export const gameTemplateRegistry = [
  { id: "roblox-obby", name: "Roblox Obby", platform: "Roblox", type: "Obby", icon: Gamepad2 },
  { id: "roblox-tycoon", name: "Roblox Tycoon", platform: "Roblox", type: "Tycoon", icon: Trophy },
  { id: "minecraft-addon", name: "Minecraft Add-on", platform: "Minecraft", type: "Add-on", icon: Code2 },
  { id: "uefn-island", name: "Fortnite UEFN Island", platform: "Fortnite / UEFN", type: "Island", icon: Target },
  { id: "web-quiz", name: "Web Quiz Game", platform: "Web game", type: "Quiz", icon: Brain },
  { id: "web-clicker", name: "Web Clicker Game", platform: "Web game", type: "Idle", icon: Zap },
];

export type IntegrationRegistryItem = {
  id: string;
  name: string;
  category:
    | "Business"
    | "Marketing"
    | "Data"
    | "Automatisation"
    | "Dev"
    | "Communication"
    | "IA"
    | "Domaines"
    | "Gaming";
  description: string;
  status: RegistryStatus;
  permissions: string[];
  icon: LucideIcon;
};

export const integrationRegistry: IntegrationRegistryItem[] = [
  {
    id: "stripe",
    name: "Stripe",
    category: "Business",
    description: "Paiements, abonnements et packs de crédits via backend sécurisé.",
    status: "configure",
    permissions: ["Créer checkout", "Lire statut paiement"],
    icon: CreditCard,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    category: "Data",
    description: "Mesure visites, sources, conversions et clics CTA.",
    status: "development",
    permissions: ["Lire métriques", "Importer événements"],
    icon: BarChart3,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    category: "Automatisation",
    description: "Prépare des événements sortants contrôlés par validation utilisateur.",
    status: "development",
    permissions: ["Envoyer événement", "Tester endpoint"],
    icon: Webhook,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "Communication",
    description: "Préparer la prise de contact et les réponses, sans envoyer automatiquement.",
    status: "soon",
    permissions: ["Préparer message", "Validation requise"],
    icon: MessageCircle,
  },
  {
    id: "gemini",
    name: "Gemini adapter",
    category: "IA",
    description: "Adapter mock-safe pour génération structurée; clé backend requise pour réel.",
    status: "development",
    permissions: ["Générer JSON", "Valider sortie"],
    icon: Sparkles,
  },
  {
    id: "github-game",
    name: "GitHub game repo",
    category: "Gaming",
    description: "Préparer un export repo pour jeux web, scripts et checklists.",
    status: "soon",
    permissions: ["Préparer export", "Aucune publication auto"],
    icon: Code2,
  },
  {
    id: "roblox",
    name: "Roblox",
    category: "Gaming",
    description: "Blueprint, Luau snippets et checklist Roblox Studio. Pas de publication automatique.",
    status: "beta",
    permissions: ["Préparer snippets", "Checklist Studio"],
    icon: Gamepad2,
  },
  {
    id: "make",
    name: "Make",
    category: "Automatisation",
    description: "Scénarios d'automatisation à connecter plus tard via webhooks.",
    status: "soon",
    permissions: ["Déclencher scénario", "Validation requise"],
    icon: Workflow,
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "Domaines",
    description: "Préparation domaines, DNS et SSL selon hébergeur futur.",
    status: "soon",
    permissions: ["Lire DNS", "Préparer instructions"],
    icon: Cable,
  },
];

export const analyticsMock = {
  visits: 1248,
  pageViews: 3810,
  ctaClicks: 138,
  leads: 52,
  conversionRate: 4.2,
  sevenDayProgress: 18,
  thirtyDayProgress: 31,
  topPages: ["/", "/builder/site", "/templates", "/integrations"],
};
