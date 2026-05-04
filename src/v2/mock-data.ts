import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Brain,
  BriefcaseBusiness,
  Brush,
  CalendarCheck,
  Code2,
  CreditCard,
  FileText,
  Globe2,
  GraduationCap,
  LineChart,
  MapPin,
  Megaphone,
  MessageCircle,
  Palette,
  PenLine,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  Wand2,
  Webhook,
  Zap,
} from "lucide-react";

export type V2Status = "connected" | "available" | "development" | "soon" | "requested";
export type RecommendationPriority = "high" | "medium" | "low";

export type BusinessScoreDimension = {
  label: string;
  score: number;
  helper: string;
};

export type Recommendation = {
  type: "conversion" | "seo" | "business" | "design" | "integration" | "agent" | "game";
  priority: RecommendationPriority;
  title: string;
  description: string;
  action: string;
  href?: string;
};

export type OfficialAgent = {
  id: string;
  name: string;
  role: string;
  description: string;
  status: V2Status;
  badge: string;
  exampleAction: string;
  icon: LucideIcon;
};

export type DashboardAutomation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  statusLabel: string;
  statusTone: "ready" | "development" | "blocked";
  lastActivity: string;
  nextStep: string;
  impact: string;
  icon: LucideIcon;
};

export type IntegrationItem = {
  id: string;
  name: string;
  category:
    | "Business"
    | "Marketing"
    | "Data"
    | "Automatisation"
    | "Dev"
    | "Communication"
    | "Domaines";
  description: string;
  status: V2Status;
  permissions: string[];
  icon: LucideIcon;
};

export type SmartTemplate = {
  id: string;
  name: string;
  niche: string;
  goal: string;
  style: string;
  tier: "simple" | "premium" | "luxe";
  description: string;
  promise: string;
  sections: string[];
  accent: string;
  icon: LucideIcon;
};

export type AnalyticsEventName =
  | "page_view"
  | "cta_click"
  | "form_submit"
  | "lead_created"
  | "checkout_start"
  | "publish_site"
  | "integration_connected"
  | "agent_created"
  | "game_created"
  | "generation_completed"
  | "project_improved";

export const analyticsEvents: AnalyticsEventName[] = [
  "page_view",
  "cta_click",
  "form_submit",
  "lead_created",
  "checkout_start",
  "publish_site",
  "integration_connected",
  "agent_created",
  "game_created",
  "generation_completed",
  "project_improved",
];

export const businessScoreDimensions: BusinessScoreDimension[] = [
  {
    label: "Clarté de l'offre",
    score: 82,
    helper: "La promesse est lisible, mais le bénéfice principal peut être plus direct.",
  },
  {
    label: "Design et crédibilité",
    score: 88,
    helper: "La base visuelle inspire confiance avec une direction premium.",
  },
  {
    label: "SEO local",
    score: 64,
    helper: "Des mots-clés locaux et FAQ peuvent renforcer la visibilité.",
  },
  {
    label: "Conversion",
    score: 76,
    helper: "Les CTA sont visibles; ajoutez plus de preuves sociales.",
  },
  {
    label: "Complétude business",
    score: 71,
    helper: "Domaine, analytics et témoignages restent à finaliser.",
  },
];

export const dashboardRecommendations: Recommendation[] = [
  {
    type: "conversion",
    priority: "high",
    title: "Renforcer le CTA principal",
    description: "Un CTA plus spécifique augmente la probabilité de contact dès le premier écran.",
    action: "Optimiser le CTA",
    href: "/ai",
  },
  {
    type: "business",
    priority: "high",
    title: "Clarifier l'offre en une phrase",
    description: "Expliquez le résultat concret obtenu par le client, pas seulement le service.",
    action: "Améliorer l'offre",
    href: "/agents",
  },
  {
    type: "seo",
    priority: "medium",
    title: "Ajouter une section FAQ SEO",
    description: "Les questions fréquentes améliorent la confiance et les requêtes longue traîne.",
    action: "Préparer la FAQ",
    href: "/templates",
  },
  {
    type: "integration",
    priority: "medium",
    title: "Activer les analytics",
    description: "Suivre les visites et clics CTA permet de savoir quoi améliorer ensuite.",
    action: "Voir les intégrations",
    href: "/integrations",
  },
];

export const officialAgents: OfficialAgent[] = [
  {
    id: "builder",
    name: "Agent Builder",
    role: "Création complète",
    description: "Transforme un brief en première version structurée et publiable.",
    status: "available",
    badge: "Recommandé",
    exampleAction: "Créer une landing premium pour un coach sportif.",
    icon: Sparkles,
  },
  {
    id: "seo",
    name: "Agent SEO",
    role: "Visibilité",
    description: "Optimise titres, descriptions, mots-clés, FAQ et structure SEO.",
    status: "available",
    badge: "Disponible",
    exampleAction: "Améliorer le SEO local d'un service à Paris.",
    icon: Search,
  },
  {
    id: "design",
    name: "Agent Design",
    role: "Direction visuelle",
    description: "Améliore cohérence, hiérarchie, sections et perception premium.",
    status: "available",
    badge: "Disponible",
    exampleAction: "Rendre le site plus luxe sans le surcharger.",
    icon: Brush,
  },
  {
    id: "copywriting",
    name: "Agent Copywriting",
    role: "Clarté et persuasion",
    description: "Réécrit les textes pour être plus simples, crédibles et orientés action.",
    status: "available",
    badge: "Disponible",
    exampleAction: "Réécrire le hero pour augmenter les demandes.",
    icon: PenLine,
  },
  {
    id: "conversion",
    name: "Agent Conversion",
    role: "CTA et preuves",
    description: "Analyse CTA, objections, preuves, urgence douce et tunnel de contact.",
    status: "available",
    badge: "Recommandé",
    exampleAction: "Trouver les 5 freins qui bloquent les leads.",
    icon: Target,
  },
  {
    id: "business",
    name: "Agent Business",
    role: "Offre et positionnement",
    description: "Travaille promesse, pricing, valeur perçue et différenciation.",
    status: "available",
    badge: "Disponible",
    exampleAction: "Proposer une offre plus claire et plus vendable.",
    icon: BriefcaseBusiness,
  },
  {
    id: "improve",
    name: "Agent Improve",
    role: "Audit et patchs",
    description: "Analyse un site existant et propose des améliorations validables.",
    status: "available",
    badge: "Disponible",
    exampleAction: "Auditer la page et prioriser les actions.",
    icon: Wand2,
  },
];

export const dashboardAutomations: DashboardAutomation[] = [
  {
    id: "lead-follow-up",
    name: "Relance lead chaud",
    trigger: "Quand un formulaire est envoyé",
    action: "Préparer un message de relance validable avant envoi.",
    statusLabel: "Préparé",
    statusTone: "ready",
    lastActivity: "Simulation prête",
    nextStep: "Connecter WhatsApp ou Gmail",
    impact: "+12% leads recontactés",
    icon: Send,
  },
  {
    id: "weekly-report",
    name: "Rapport business hebdo",
    trigger: "Chaque lundi matin",
    action: "Résumer visites, clics CTA, leads et actions prioritaires.",
    statusLabel: "En développement",
    statusTone: "development",
    lastActivity: "Structure analytics prête",
    nextStep: "Activer analytics réels",
    impact: "Décisions plus rapides",
    icon: BarChart3,
  },
  {
    id: "publish-checklist",
    name: "Checklist publication",
    trigger: "Avant de publier un site",
    action: "Vérifier CTA, SEO, contact, domaine et preuves sociales.",
    statusLabel: "Préparé",
    statusTone: "ready",
    lastActivity: "Garde-fous définis",
    nextStep: "Valider avant publication",
    impact: "Moins d'erreurs au lancement",
    icon: ShieldCheck,
  },
  {
    id: "crm-sync",
    name: "Synchronisation leads",
    trigger: "Quand un lead est créé",
    action: "Préparer l'ajout du contact dans Google Sheets ou CRM.",
    statusLabel: "À connecter",
    statusTone: "blocked",
    lastActivity: "Connecteur prêt côté UI",
    nextStep: "Connecter Google Sheets",
    impact: "Suivi commercial centralisé",
    icon: Webhook,
  },
];

export const integrationsCatalog: IntegrationItem[] = [
  {
    id: "stripe",
    name: "Stripe",
    category: "Business",
    description: "Paiements, packs de crédits, abonnements et checkout sécurisé.",
    status: "available",
    permissions: ["Créer checkout", "Lire paiement", "Webhook"],
    icon: CreditCard,
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "Business",
    description: "Préparer une boutique, des fiches produits et une présence e-commerce.",
    status: "soon",
    permissions: ["Lire produits", "Synchroniser boutique"],
    icon: ShoppingBag,
  },
  {
    id: "paypal",
    name: "PayPal",
    category: "Business",
    description: "Option de paiement complémentaire pour offres simples.",
    status: "soon",
    permissions: ["Créer paiement", "Lire statut"],
    icon: CreditCard,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "Business",
    description: "Connecter un catalogue WordPress/WooCommerce plus tard.",
    status: "requested",
    permissions: ["Lire catalogue", "Créer webhook"],
    icon: ShoppingBag,
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Marketing",
    description: "Préparer idées de contenus et tracking campagne.",
    status: "development",
    permissions: ["Préparer contenu", "Lire statistiques plus tard"],
    icon: Megaphone,
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    category: "Marketing",
    description: "Préparer audiences, pages de conversion et suivi de campagne.",
    status: "development",
    permissions: ["Préparer audiences", "Lire campagnes plus tard"],
    icon: Megaphone,
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "Marketing",
    description: "Préparer landing pages et mots-clés pour acquisition payante.",
    status: "development",
    permissions: ["Préparer mots-clés", "Lire campagnes plus tard"],
    icon: Megaphone,
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "Marketing",
    description: "Préparer contenus et CTA sociaux sans publication automatique.",
    status: "development",
    permissions: ["Préparer posts", "Lire profil plus tard"],
    icon: Megaphone,
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Marketing",
    description: "Préparer scripts, descriptions et idées vidéo.",
    status: "development",
    permissions: ["Préparer scripts", "Lire chaîne plus tard"],
    icon: Megaphone,
  },
  {
    id: "analytics",
    name: "Google Analytics",
    category: "Data",
    description: "Mesurer visites, sources, événements et conversions.",
    status: "available",
    permissions: ["Lire métriques", "Créer événements"],
    icon: BarChart3,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    category: "Data",
    description: "Exporter leads, recommandations et suivis business.",
    status: "soon",
    permissions: ["Lire feuilles", "Ajouter lignes"],
    icon: FileText,
  },
  {
    id: "search-console",
    name: "Search Console",
    category: "Data",
    description: "Suivre requêtes SEO, impressions et pages à améliorer.",
    status: "soon",
    permissions: ["Lire performances", "Lire sitemap"],
    icon: LineChart,
  },
  {
    id: "make",
    name: "Make",
    category: "Automatisation",
    description: "Déclencher des scénarios à partir de leads et événements.",
    status: "soon",
    permissions: ["Envoyer webhook", "Lire scénario"],
    icon: Zap,
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automatisation",
    description: "Connecter Pixelrises aux outils no-code les plus utilisés.",
    status: "soon",
    permissions: ["Envoyer trigger", "Lire zap"],
    icon: Zap,
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automatisation",
    description: "Préparer des workflows avancés auto-hébergés.",
    status: "soon",
    permissions: ["Envoyer webhook", "Tester workflow"],
    icon: Webhook,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    category: "Automatisation",
    description: "Notifier vos outils lors d'une génération, publication ou lead.",
    status: "available",
    permissions: ["Envoyer événement", "Tester endpoint"],
    icon: Webhook,
  },
  {
    id: "github",
    name: "GitHub",
    category: "Dev",
    description: "Préparer exports et synchronisations futures vers repository.",
    status: "soon",
    permissions: ["Créer repo", "Lire branches"],
    icon: Code2,
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "Dev",
    description: "Préparer publication, preview et déploiement frontend.",
    status: "soon",
    permissions: ["Créer déploiement", "Lire domaines"],
    icon: Globe2,
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "Dev",
    description: "Stockage projets, auth, analytics et edge functions.",
    status: "available",
    permissions: ["Lire projets", "Écrire sites", "Auth"],
    icon: ShieldCheck,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "Communication",
    description: "Préparer les CTA de contact et messages de réponse.",
    status: "available",
    permissions: ["Préparer message", "Ouvrir lien"],
    icon: MessageCircle,
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Communication",
    description: "Préparer emails de suivi; aucun envoi sans validation.",
    status: "soon",
    permissions: ["Préparer email", "Brouillon plus tard"],
    icon: Send,
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "Domaines",
    description: "Préparer DNS, domaine personnalisé et SSL.",
    status: "soon",
    permissions: ["Lire DNS", "Préparer instructions"],
    icon: Globe2,
  },
  {
    id: "custom-domain",
    name: "Domaine personnalisé",
    category: "Domaines",
    description: "Connecter un domaine professionnel à un site publié.",
    status: "available",
    permissions: ["Lire domaine", "Préparer DNS"],
    icon: Globe2,
  },
];

export const smartTemplates: SmartTemplate[] = [
  {
    id: "restaurant",
    name: "Restaurant Signature",
    niche: "Restaurant",
    goal: "Réservations",
    style: "Chaleureux premium",
    tier: "premium",
    description: "Une base pensée pour donner faim, rassurer et pousser à réserver.",
    promise: "Transformer une visite en réservation claire et rapide.",
    sections: ["Hero", "Menu", "Spécialités", "Avis", "Réservation", "Localisation"],
    accent: "from-orange-500/18 to-amber-300/10",
    icon: CalendarCheck,
  },
  {
    id: "coach",
    name: "Coach Transformation",
    niche: "Coach",
    goal: "Rendez-vous",
    style: "Dynamique",
    tier: "premium",
    description: "Une structure orientée transformation, preuve et bilan.",
    promise: "Rendre l'accompagnement crédible et actionnable.",
    sections: ["Hero", "Problème", "Méthode", "Offres", "Résultats", "FAQ"],
    accent: "from-lime-400/18 to-emerald-400/10",
    icon: Target,
  },
  {
    id: "immobilier",
    name: "Immobilier Prestige",
    niche: "Immobilier",
    goal: "Estimations",
    style: "Luxe sobre",
    tier: "luxe",
    description: "Pour agences qui veulent rassurer vendeurs et acheteurs exigeants.",
    promise: "Créer une perception haut de gamme dès la première seconde.",
    sections: ["Hero", "Estimation", "Biens", "Méthode", "Avis", "Contact"],
    accent: "from-stone-200/18 to-yellow-300/10",
    icon: BriefcaseBusiness,
  },
  {
    id: "service-local",
    name: "Service Local Lead",
    niche: "Service local",
    goal: "Demandes de devis",
    style: "Clair et rassurant",
    tier: "simple",
    description: "Une page efficace pour expliquer vite, rassurer et capter des devis.",
    promise: "Simplifier le passage de prospect local à demande qualifiée.",
    sections: ["Hero", "Services", "Zones", "Preuves", "Devis", "Contact"],
    accent: "from-sky-400/18 to-cyan-300/10",
    icon: MapPin,
  },
  {
    id: "ecommerce",
    name: "E-commerce Launch",
    niche: "E-commerce",
    goal: "Ventes",
    style: "Produit premium",
    tier: "premium",
    description: "Une base produit avec bénéfices, garanties, avis et CTA achat.",
    promise: "Rendre l'offre plus désirable et plus facile à acheter.",
    sections: ["Hero produit", "Bénéfices", "Produits", "Garanties", "Avis", "FAQ"],
    accent: "from-fuchsia-400/16 to-rose-300/10",
    icon: ShoppingBag,
  },
  {
    id: "agence",
    name: "Agence Authority",
    niche: "Agence",
    goal: "Leads B2B",
    style: "SaaS premium",
    tier: "premium",
    description: "Pour présenter services, méthode, preuves et prise de contact.",
    promise: "Positionner une expertise claire sans jargon inutile.",
    sections: ["Hero", "Services", "Méthode", "Réalisations", "Preuves", "Contact"],
    accent: "from-violet-400/16 to-blue-300/10",
    icon: Rocket,
  },
  {
    id: "portfolio",
    name: "Portfolio Expert",
    niche: "Créatif",
    goal: "Demandes entrantes",
    style: "Editorial",
    tier: "premium",
    description: "Une vitrine forte pour montrer projets, expertise et méthode.",
    promise: "Transformer un portfolio en preuve commerciale.",
    sections: ["Hero", "Projets", "Expertise", "Méthode", "Contact"],
    accent: "from-indigo-400/16 to-white/8",
    icon: Palette,
  },
  {
    id: "beauty",
    name: "Salon Premium",
    niche: "Beauté",
    goal: "Réservations",
    style: "Élégant",
    tier: "luxe",
    description: "Une base visuelle pour salon, spa, coiffure ou institut.",
    promise: "Donner envie de réserver une expérience, pas seulement un service.",
    sections: ["Hero", "Prestations", "Avant/Après", "Avis", "Réservation"],
    accent: "from-pink-300/16 to-amber-200/10",
    icon: Sparkles,
  },
  {
    id: "medical",
    name: "Cabinet Confiance",
    niche: "Santé",
    goal: "Rendez-vous",
    style: "Rassurant",
    tier: "simple",
    description: "Une structure sobre, claire et rassurante pour activité médicale.",
    promise: "Réduire l'anxiété et rendre le parcours patient clair.",
    sections: ["Hero", "Soins", "Équipe", "Infos pratiques", "FAQ", "Contact"],
    accent: "from-teal-300/16 to-blue-200/10",
    icon: ShieldCheck,
  },
  {
    id: "barbershop",
    name: "Barbershop Local",
    niche: "Barbershop",
    goal: "Réservations",
    style: "Urbain premium",
    tier: "premium",
    description: "Une base locale forte avec style, tarifs, équipe et réservation.",
    promise: "Transformer l'image du salon en rendez-vous récurrents.",
    sections: ["Hero", "Services", "Tarifs", "Galerie", "Avis", "Réserver"],
    accent: "from-neutral-100/16 to-yellow-300/10",
    icon: Users,
  },
  {
    id: "startup",
    name: "Startup Waitlist",
    niche: "Startup",
    goal: "Inscriptions",
    style: "Tech premium",
    tier: "premium",
    description: "Une landing claire pour expliquer, prouver et capter une waitlist.",
    promise: "Transformer une idée en première traction crédible.",
    sections: ["Hero", "Problème", "Solution", "Démo", "Preuves", "Waitlist"],
    accent: "from-cyan-300/16 to-indigo-300/10",
    icon: Brain,
  },
  {
    id: "education",
    name: "Formation Expert",
    niche: "Formation",
    goal: "Inscriptions",
    style: "Pédagogique",
    tier: "simple",
    description: "Une base pour école, formation, cours ou accompagnement.",
    promise: "Rendre la progression visible et l'inscription évidente.",
    sections: ["Hero", "Programme", "Résultats", "Formateur", "FAQ", "Inscription"],
    accent: "from-emerald-300/16 to-sky-300/10",
    icon: GraduationCap,
  },
];

export const customAgentDefaults = {
  permissions: {
    readProject: true,
    suggestChanges: true,
    editWithApproval: false,
    publishWithApproval: false,
    accessAnalytics: false,
    useIntegrations: false,
  },
  testPrompts: [
    "Améliore mon site",
    "Propose une meilleure offre",
    "Optimise mon SEO",
    "Crée 5 idées de contenu TikTok",
    "Améliore mes CTA",
    "Analyse mon positionnement",
    "Propose une stratégie pour avoir plus de leads",
    "Crée un concept de jeu Roblox",
    "Améliore ce script Roblox",
    "Prépare une checklist Minecraft",
  ],
};
