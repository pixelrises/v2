import type { DataState } from "@/lib/data-state";

export type GeneralAIIntent =
  | "create_site"
  | "create_agent"
  | "create_game"
  | "business_help"
  | "student_help"
  | "creator_help"
  | "management_help"
  | "enterprise_help"
  | "analytics_help"
  | "automation_help"
  | "integration_help"
  | "general_question";

export type GeneralAIAction = {
  label: string;
  href: string;
  description: string;
};

export type GeneralAIRouteResult = {
  intent: GeneralAIIntent;
  answer: string;
  primaryAction: GeneralAIAction;
  secondaryActions: GeneralAIAction[];
  dataState: DataState;
  confidence: "high" | "medium" | "low";
  safetyNote: string;
};

const normalizeIntentText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const intentMatchers: Array<{ intent: GeneralAIIntent; keywords: string[] }> = [
  {
    intent: "create_agent",
    keywords: ["agent", "assistant", "bot", "seo agent", "support client", "automatiser les reponses"],
  },
  {
    intent: "create_site",
    keywords: ["site", "landing", "page web", "restaurant", "vitrine", "seo", "boutique"],
  },
  {
    intent: "create_game",
    keywords: ["jeu", "game", "roblox", "minecraft", "fortnite", "uefn", "gameplay"],
  },
  {
    intent: "student_help",
    keywords: ["reviser", "controle", "cours", "fiche", "quiz", "oral", "devoir", "etudiant", "ecole"],
  },
  {
    intent: "creator_help",
    keywords: ["video", "tiktok", "reels", "shorts", "hook", "script", "contenu", "calendrier editorial"],
  },
  {
    intent: "management_help",
    keywords: ["organiser", "planning", "todo", "tache", "relance", "client", "crm", "tableau"],
  },
  {
    intent: "enterprise_help",
    keywords: ["procedure", "reunion", "compte rendu", "brief", "process", "equipe", "document"],
  },
  {
    intent: "analytics_help",
    keywords: ["analytics", "visites", "leads", "conversion", "kpi", "score", "performance"],
  },
  {
    intent: "automation_help",
    keywords: ["automatisation", "workflow", "scenario", "declencheur", "make", "zapier"],
  },
  {
    intent: "integration_help",
    keywords: ["integration", "connecter", "stripe", "google analytics", "notion", "slack", "webhook"],
  },
  {
    intent: "business_help",
    keywords: ["business", "idee", "offre", "vendre", "clients", "marche", "lancement", "pitch"],
  },
];

const actionByIntent: Record<GeneralAIIntent, Omit<GeneralAIRouteResult, "intent" | "dataState" | "confidence">> = {
  create_site: {
    answer: "Le meilleur point de départ est le Site Builder : il transforme ton idée en brief, preview et amélioration section par section.",
    primaryAction: {
      label: "Ouvrir Site Builder",
      href: "/builder/site",
      description: "Créer un site avec brief, Quality Gate et preview.",
    },
    secondaryActions: [
      {
        label: "Préparer l'offre avec Business AI",
        href: "/ai-spaces/business",
        description: "Clarifier la cible, la promesse, les preuves et le CTA avant la génération.",
      },
    ],
    safetyNote: "Le conseiller prépare et oriente. La publication reste toujours validée par l'utilisateur.",
  },
  create_agent: {
    answer: "Pour créer un agent utile, commence par son rôle, ses permissions et un chat de test avant toute action.",
    primaryAction: {
      label: "Ouvrir Agent Builder",
      href: "/builder/agent",
      description: "Configurer rôle, mission, prompt, permissions et actions validables.",
    },
    secondaryActions: [
      {
        label: "Voir les agents prêts",
        href: "/agents",
        description: "Explorer les agents SEO, business, design, conversion et support.",
      },
    ],
    safetyNote: "Aucun agent ne déclenche d'action externe sans validation humaine.",
  },
  create_game: {
    answer: "Pour un jeu, Pixelrises doit d'abord produire un blueprint clair : loop de gameplay, scripts, assets et checklist.",
    primaryAction: {
      label: "Ouvrir Game Builder",
      href: "/builder/game",
      description: "Créer un blueprint Roblox/Web Game avec Quality Gate et garde-fous.",
    },
    secondaryActions: [
      {
        label: "Explorer les templates jeux",
        href: "/templates",
        description: "Démarrer depuis un Obby, Tycoon, RPG ou UEFN préparé.",
      },
    ],
    safetyNote: "Le jeu n'est jamais publié automatiquement sur une plateforme externe.",
  },
  business_help: {
    answer: "Business AI est l'espace universel : il aide à clarifier l'offre, le plan de lancement et le prochain actif digital.",
    primaryAction: {
      label: "Ouvrir Business AI",
      href: "/ai-spaces/business",
      description: "Structurer l'offre, la cible, les preuves, les objections et le plan d'action.",
    },
    secondaryActions: [
      {
        label: "Créer un projet",
        href: "/create",
        description: "Choisir Site, Agent IA ou Jeu comme prochaine étape concrète.",
      },
    ],
    safetyNote: "Aucune promesse de revenus n'est garantie : les recommandations restent à valider.",
  },
  student_help: {
    answer: "Student AI doit t'aider à comprendre et progresser, pas faire le travail à ta place sans méthode.",
    primaryAction: {
      label: "Ouvrir Student AI",
      href: "/ai-spaces/student",
      description: "Créer une fiche, un quiz, des flashcards ou un planning de révision.",
    },
    secondaryActions: [],
    safetyNote: "L'espace privilégie l'explication, l'entraînement et la correction pédagogique.",
  },
  creator_help: {
    answer: "Creator AI est fait pour transformer une idée en angle, hook, script, calendrier et brief de contenu.",
    primaryAction: {
      label: "Ouvrir Creator AI",
      href: "/ai-spaces/creator",
      description: "Préparer hooks, scripts, storyboard et calendrier éditorial.",
    },
    secondaryActions: [],
    safetyNote: "Pas de promesse de viralité et pas de copie directe de créateur ou de marque.",
  },
  management_help: {
    answer: "Management AI est le meilleur espace pour organiser tes tâches, relances, workflows et suivis.",
    primaryAction: {
      label: "Ouvrir Management AI",
      href: "/ai-spaces/management",
      description: "Créer une todo, un planning, une relance ou un workflow validable.",
    },
    secondaryActions: [
      {
        label: "Voir les automatisations",
        href: "/automations",
        description: "Préparer des scénarios avec déclencheur, validation et action.",
      },
    ],
    safetyNote: "Aucune relance ni action externe n'est envoyée sans validation.",
  },
  enterprise_help: {
    answer: "Enterprise AI sert à produire des documents, procédures, briefs et comptes rendus de manière structurée.",
    primaryAction: {
      label: "Ouvrir Enterprise AI",
      href: "/ai-spaces/enterprise",
      description: "Préparer procédure, compte rendu, brief projet ou support professionnel.",
    },
    secondaryActions: [],
    safetyNote: "Aucun fichier local, Drive ou SharePoint n'est lu sans autorisation explicite.",
  },
  analytics_help: {
    answer: "Pour analyser la performance, commence par les données disponibles et distingue toujours réel, exemple et fallback.",
    primaryAction: {
      label: "Ouvrir Analytics",
      href: "/analytics",
      description: "Lire trafic, leads, conversions, score business et recommandations.",
    },
    secondaryActions: [
      {
        label: "Voir le dashboard",
        href: "/dashboard",
        description: "Revenir au cockpit pour choisir la prochaine meilleure action.",
      },
    ],
    safetyNote: "Les chiffres d'exemple doivent rester marqués comme exemples.",
  },
  automation_help: {
    answer: "Une automatisation Pixelrises doit toujours suivre : déclencheur, analyse IA, validation, action, trace.",
    primaryAction: {
      label: "Ouvrir Automatisations",
      href: "/automations",
      description: "Préparer un scénario sûr avec statuts, outils et garde-fous.",
    },
    secondaryActions: [
      {
        label: "Ouvrir Management AI",
        href: "/ai-spaces/management",
        description: "Transformer ton besoin en workflow clair avant l'activation.",
      },
    ],
    safetyNote: "Les actions sensibles restent bloquées sans validation humaine.",
  },
  integration_help: {
    answer: "Pour connecter un outil, vérifie d'abord son statut : connecté, à configurer, bêta, bientôt ou bloqué.",
    primaryAction: {
      label: "Ouvrir Integrations",
      href: "/integrations",
      description: "Voir les connecteurs et leurs statuts honnêtes.",
    },
    secondaryActions: [],
    safetyNote: "Aucune intégration externe sensible n'est activée sans consentement.",
  },
  general_question: {
    answer: "Je peux t'aider à décider vite : donne ton objectif, ton contexte et le résultat attendu. Si besoin, je t'oriente vers le bon espace.",
    primaryAction: {
      label: "Ouvrir General AI",
      href: "/ai-spaces/general",
      description: "Poser une question, résumer, rédiger ou créer un plan.",
    },
    secondaryActions: [
      {
        label: "Voir tous les AI Spaces",
        href: "/ai-spaces",
        description: "Choisir un espace spécialisé selon ton besoin.",
      },
    ],
    safetyNote: "Le conseiller ne demande pas de secret et n'exécute rien automatiquement.",
  },
};

export const detectGeneralAIIntent = (input: string): GeneralAIIntent => {
  const normalized = normalizeIntentText(input);
  if (!normalized) return "general_question";

  const match = intentMatchers.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(normalizeIntentText(keyword))),
  );

  return match?.intent ?? "general_question";
};

export const routeGeneralAIRequest = (input: string): GeneralAIRouteResult => {
  const intent = detectGeneralAIIntent(input);
  const normalized = normalizeIntentText(input);
  const confidence = normalized.length < 12 ? "low" : intent === "general_question" ? "medium" : "high";

  return {
    intent,
    ...actionByIntent[intent],
    dataState: "mock",
    confidence,
  };
};
