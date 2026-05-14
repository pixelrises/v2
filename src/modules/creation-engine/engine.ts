import type {
  CreationRequest,
  CustomAgentProject,
  GamePlatform,
  GameProject,
  NormalizedSiteProject,
  PlanModeOutput,
  ProjectType,
} from "./types";
import { createNicheSiteProjectParts } from "./site-blueprints";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "pixelrises-project";

const nowId = (prefix: string) => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now().toString(36)}`;

export const detectProjectType = (idea: string): ProjectType => {
  const normalized = idea.toLowerCase();
  if (/(jeu|game|roblox|minecraft|fortnite|uefn|obby|tycoon|verse|luau)/.test(normalized)) {
    return "game";
  }
  if (/(agent|assistant|bot|support|seo|copywriting|marketing)/.test(normalized)) {
    return "agent";
  }
  if (/(template|modèle|modele|kit)/.test(normalized)) {
    return "template";
  }
  if (/(api|webhook|integration|intégration|stripe|analytics|zapier|make)/.test(normalized)) {
    return "integration";
  }
  return "site";
};

export const createProjectPlan = (request: CreationRequest): PlanModeOutput => {
  const projectType = request.projectType ?? detectProjectType(request.idea);
  const projectId = nowId(projectType);
  const strategyByType: Record<ProjectType, string[]> = {
    site: ["Clarifier l'offre", "Structurer les sections", "Rendre les CTA visibles", "Préparer SEO et preuves"],
    agent: ["Définir rôle et limites", "Choisir contexte utile", "Verrouiller les permissions", "Tester avec prompts réels"],
    game: ["Définir boucle de jeu", "Choisir plateforme", "Lister scripts et assets", "Préparer checklist de création"],
    template: ["Définir niche", "Lister sections adaptatives", "Prévoir variantes de style", "Relier au builder"],
    integration: ["Identifier permissions", "Prévoir statut honnête", "Isoler secrets serveur", "Tester sans action réelle"],
  };

  return {
    projectId,
    projectType,
    mode: "plan",
    summary: `Pixelrises a détecté un projet ${projectType} à partir de l'idée : ${request.idea || "nouveau projet digital"}.`,
    targetAudience: request.context?.targetAudience || "entrepreneurs, indépendants et créateurs",
    strategy: strategyByType[projectType],
    recommendedModules: ["Plan Mode", "Build Mode", "Improve Mode", "Quality Gate", "Preview"],
    risks: [
      "Ne pas exposer de clé API côté frontend.",
      "Ne pas promettre d'intégration ou publication automatique si elle n'est pas connectée.",
      "Garder les actions sensibles sous validation utilisateur.",
    ],
    nextSteps: ["Compléter le brief", "Générer une première version", "Valider la qualité", "Sauvegarder ou améliorer"],
  };
};

export const createLegacyMockSiteProject = (input: Partial<NormalizedSiteProject["meta"]> & { offer?: string } = {}): NormalizedSiteProject => {
  const businessName = input.businessName || "Studio Pixel";
  const niche = input.niche || "service premium";
  const city = input.city || "France";
  const goal = input.goal || "générer des demandes qualifiées";
  const projectId = input.projectId || nowId("site");
  const cta = goal.includes("vendre") ? "Acheter maintenant" : "Demander un devis";

  return {
    meta: {
      projectId,
      projectType: "site",
      businessName,
      niche,
      goal,
      targetAudience: input.targetAudience || "clients exigeants",
      city,
      tier: input.tier || "premium",
      style: input.style || "dark gold premium",
      language: "fr",
    },
    strategy: {
      mainPromise: `${businessName} transforme une demande floue en solution claire et premium.`,
      marketingAngle: `Positionnement ${niche} crédible, local et orienté résultat.`,
      conversionGoal: goal,
      primaryCTA: cta,
      trustStrategy: "Preuves sociales, méthode, garanties et contact visible.",
      objectionsToHandle: ["Manque de confiance", "Prix peu clair", "Doute sur le résultat"],
    },
    brand: {
      name: businessName,
      tagline: "Une présence digitale claire, crédible et prête à convertir.",
      colors: ["#050505", "#F5C542", "#FFFFFF"],
      fonts: ["Sora", "Inter"],
      tone: "professionnel, direct, rassurant",
    },
    pages: [
      {
        slug: "/",
        title: businessName,
        sections: [
          {
            id: "hero",
            type: "hero",
            title: `${businessName}, la vitrine premium pour ${niche}`,
            subtitle: `Un site pensé pour rassurer, expliquer l'offre et convertir à ${city}.`,
            content: input.offer || "Une offre structurée pour transformer les visiteurs en demandes qualifiées.",
            cta: { label: cta, action: "#contact" },
            items: ["Promesse claire", "CTA visible", "Preuves immédiates"],
            media: [],
            layout: "split-premium",
            conversionRole: "clarifier et convertir",
          },
          {
            id: "services",
            type: "services",
            title: "Services essentiels",
            subtitle: "Une structure simple pour comprendre l'offre rapidement.",
            content: "Chaque service met en avant un résultat concret et mesurable.",
            cta: { label: "Voir les offres", action: "#services" },
            items: ["Audit", "Accompagnement", "Optimisation"],
            media: [],
            layout: "cards",
            conversionRole: "présenter la valeur",
          },
          {
            id: "proof",
            type: "proof",
            title: "Pourquoi faire confiance",
            subtitle: "Des preuves visibles pour réduire les objections.",
            content: "Méthode claire, résultats, avis et garanties renforcent la crédibilité.",
            cta: { label: "Voir la méthode", action: "#method" },
            items: ["Méthode transparente", "Suivi personnalisé", "Résultats concrets"],
            media: [],
            layout: "trust-grid",
            conversionRole: "rassurer",
          },
          {
            id: "faq",
            type: "faq",
            title: "Questions fréquentes",
            subtitle: "Réponses simples aux objections avant le contact.",
            content: "La FAQ prépare le visiteur à passer à l'action.",
            cta: { label: "Poser une question", action: "#contact" },
            items: ["Délais", "Tarifs", "Process", "Garanties"],
            media: [],
            layout: "accordion",
            conversionRole: "lever les freins",
          },
          {
            id: "contact",
            type: "cta",
            title: "Prêt à lancer une présence plus crédible ?",
            subtitle: "La prochaine étape est simple et sans engagement.",
            content: "Demandez un devis ou un audit pour savoir quoi améliorer en priorité.",
            cta: { label: cta, action: "mailto:contact@example.com" },
            items: ["Réponse rapide", "Conseil clair", "Sans automatisation forcée"],
            media: [],
            layout: "centered",
            conversionRole: "capturer le lead",
          },
        ],
      },
    ],
    seo: {
      title: `${businessName} | ${niche} premium à ${city}`,
      description: `${businessName} aide les clients à obtenir une présence professionnelle claire, crédible et orientée conversion.`,
      keywords: [niche, businessName, "site professionnel", "conversion"],
      localKeywords: [city, `${niche} ${city}`],
      h1: `${businessName}, ${niche} premium`,
      h2: ["Services essentiels", "Pourquoi faire confiance", "Questions fréquentes"],
    },
    business: {
      offer: input.offer || "Offre premium structurée",
      valueProposition: "Clarté, crédibilité et conversion dans une base digitale solide.",
      pricingSuggestion: "Afficher une fourchette ou un premier pack pour réduire la friction.",
      leadCapture: "Formulaire, email ou prise de rendez-vous.",
      trustElements: ["Avis", "Méthode", "FAQ", "Garanties"],
    },
    conversion: {
      primaryGoal: goal,
      ctaStrategy: "CTA principal dans le hero, rappel après preuves et CTA final.",
      objections: ["Est-ce fiable ?", "Combien ça coûte ?", "Quel résultat attendre ?"],
      proofElements: ["Avis", "Avant/après", "Méthode", "Garanties"],
      recommendedSections: ["Hero", "Services", "Preuves", "FAQ", "CTA final"],
    },
    design: {
      style: "dark gold premium",
      layoutDirection: "cartes sobres, contraste fort, sections aérées",
      spacing: "généreux",
      radius: "large",
      visualMood: "premium, moderne, rassurant",
      components: ["Hero", "ServiceCard", "ProofCard", "FAQ", "CTA"],
    },
    recommendations: [
      {
        priority: "high",
        title: "Ajouter une preuve sociale",
        description: "Un témoignage ou résultat réduit les hésitations avant le contact.",
        action: "Ajouter une section avis",
      },
      {
        priority: "medium",
        title: "Connecter les analytics",
        description: "Suivre les CTA aide à savoir quoi améliorer après publication.",
        action: "Préparer Analytics",
      },
    ],
  };
};

export const createMockSiteProject = (
  input: Partial<NormalizedSiteProject["meta"]> & { offer?: string } = {},
): NormalizedSiteProject => {
  const businessName = input.businessName || "Studio Pixel";
  const niche = input.niche || "service premium";
  const city = input.city || "France";
  const goal = input.goal || "generer des demandes qualifiees";
  const projectId = input.projectId || nowId("site");
  const targetAudience = input.targetAudience || "clients exigeants";
  const tier = input.tier || "premium";
  const style = input.style || "dark gold premium";
  const siteParts = createNicheSiteProjectParts({
    businessName,
    niche,
    city,
    goal,
    offer: input.offer,
    targetAudience,
    tier,
    style,
  });
  const sections = siteParts.sections;

  return {
    meta: {
      projectId,
      projectType: "site",
      businessName,
      niche,
      goal,
      targetAudience,
      city,
      tier,
      style,
      language: "fr",
    },
    strategy: {
      mainPromise: siteParts.strategy.mainPromise,
      marketingAngle: siteParts.strategy.marketingAngle,
      conversionGoal: goal,
      primaryCTA: siteParts.cta,
      trustStrategy: siteParts.strategy.trustStrategy,
      objectionsToHandle: siteParts.strategy.objectionsToHandle,
    },
    brand: {
      name: businessName,
      tagline: siteParts.brand.tagline,
      colors: ["#050505", "#F5C542", "#FFFFFF"],
      fonts: ["Sora", "Inter"],
      tone: siteParts.brand.tone,
    },
    pages: [
      {
        slug: "/",
        title: businessName,
        sections,
      },
    ],
    seo: {
      title: `${businessName} | ${niche} premium ${city}`,
      description: `${businessName} presente une offre ${niche} claire, specifique et orientee conversion pour ${city}.`,
      keywords: [niche, businessName, "site professionnel", "conversion", siteParts.blueprint.key],
      localKeywords: [city, `${niche} ${city}`],
      h1: `${businessName}, ${niche} premium`,
      h2: sections.slice(1, 4).map((section) => section.title),
    },
    business: {
      offer: input.offer || sections[0].content,
      valueProposition: siteParts.business.valueProposition,
      pricingSuggestion: siteParts.business.pricingSuggestion,
      leadCapture: siteParts.business.leadCapture,
      trustElements: siteParts.business.trustElements,
    },
    conversion: {
      primaryGoal: goal,
      ctaStrategy: siteParts.conversion.ctaStrategy,
      objections: siteParts.conversion.objections,
      proofElements: siteParts.conversion.proofElements,
      recommendedSections: siteParts.conversion.recommendedSections,
    },
    design: {
      style,
      layoutDirection: siteParts.design.layoutDirection,
      spacing: "genereux",
      radius: "large",
      visualMood: siteParts.design.visualMood,
      components: siteParts.design.components,
    },
    recommendations: [
      {
        priority: "high",
        title: "Verifier la specificite de la niche",
        description: `Chaque section doit parler de ${niche}, de ${city} et de l'objectif "${goal}" sans texte interchangeable.`,
        action: "Relire les sections generiques",
      },
      {
        priority: "medium",
        title: "Tester une variation de layout",
        description: "Changer l'ordre ou la mise en scene d'une section permet d'eviter l'effet template recopie.",
        action: "Generer une variante",
      },
    ],
  };
};

const scriptByPlatform = (platform: GamePlatform) => {
  if (platform === "Roblox") {
    return {
      language: "Luau",
      name: "CheckpointManager.server.lua",
      code: "local Players = game:GetService('Players')\n-- Exemple: sauvegarder le dernier checkpoint validé par joueur.",
    };
  }
  if (platform === "Minecraft") {
    return {
      language: "JSON",
      name: "behavior_pack_manifest.json",
      code: '{\n  "format_version": 2,\n  "header": { "name": "Pixelrises Add-on", "version": [1,0,0] }\n}',
    };
  }
  if (platform === "Fortnite / UEFN") {
    return {
      language: "Verse",
      name: "score_manager.verse",
      code: "# Snippet de départ Verse: gérer score, objectif et fin de round.",
    };
  }
  return {
    language: "JavaScript",
    name: "game-loop.js",
    code: "let score = 0;\nfunction updateGame(delta) {\n  score += delta > 0 ? 1 : 0;\n}",
  };
};

export const createMockGameProject = (input: {
  title?: string;
  platform?: GamePlatform;
  gameType?: string;
  theme?: string;
  targetAudience?: string;
} = {}): GameProject => {
  const platform = input.platform || "Roblox";
  const title = input.title || "Pixel Quest";
  const gameType = input.gameType || "Adventure";
  const script = scriptByPlatform(platform);

  return {
    meta: {
      projectId: nowId("game"),
      projectType: "game",
      platform,
      gameType,
      title,
      targetAudience: input.targetAudience || "joueurs casual",
      difficulty: "progressive",
      mode: "both",
    },
    concept: {
      pitch: `${title} est un ${gameType} bêta où le joueur progresse par objectifs courts et récompenses lisibles.`,
      theme: input.theme || "monde futuriste premium",
      world: "Un hub central relie des zones de difficulté croissante.",
      playerGoal: "Débloquer toutes les zones, maîtriser les mécaniques et obtenir les récompenses finales.",
      coreFantasy: "Partir de zéro et devenir le meilleur joueur du serveur.",
    },
    gameplay: {
      loop: "Entrer dans une zone, réussir un défi, gagner une récompense, améliorer son accès, recommencer plus loin.",
      rules: ["Objectifs lisibles", "Échec sans frustration", "Progression sauvegardée"],
      mechanics: ["Checkpoints", "Défis courts", "Récompenses", "Déblocage de zones"],
      progression: ["Tutoriel", "Zone facile", "Zone avancée", "Défi final"],
      rewards: ["Badges", "Cosmétiques", "Monnaie douce", "Accès zones"],
      economy: ["Récompenses gagnées en jeu", "Options premium non obligatoires"],
    },
    levelDesign: {
      mapStructure: "Hub central avec quatre branches thématiques.",
      zones: ["Accueil", "Zone test", "Zone expert", "Zone finale"],
      objectives: ["Comprendre", "Réussir", "Optimiser", "Partager"],
      flow: "Le joueur revient souvent au hub pour comprendre sa progression.",
    },
    scripts: [
      {
        language: script.language,
        name: script.name,
        purpose: "Base technique indicative pour démarrer le prototype.",
        code: script.code,
        explanation: "Snippet bêta à adapter dans l'éditeur officiel de la plateforme. Pixelrises ne publie rien automatiquement.",
      },
    ],
    assets: [
      {
        type: "UI",
        name: "HUD progression",
        description: "Barre claire avec score, zone active et objectif suivant.",
        prompt: `Interface ${platform} premium, HUD lisible, dark gold, ${gameType}.`,
      },
      {
        type: "Environment",
        name: "Hub principal",
        description: "Zone d'accueil qui explique les objectifs et dirige vers les défis.",
        prompt: `Hub de jeu ${input.theme || "futuriste"}, lisible, premium, adapté ${platform}.`,
      },
    ],
    monetization: {
      strategy: "Monétisation douce, optionnelle, jamais pay-to-win.",
      items: ["Cosmétiques", "Boost confort limité", "Pass soutien"],
      passes: platform === "Roblox" ? ["VIP cosmétique", "Accès lounge"] : [],
      ethicalNotes: "Les achats ne doivent pas bloquer la progression principale.",
    },
    publishing: {
      checklist: [
        "Tester le gameplay dans l'outil officiel.",
        "Remplacer les assets placeholders par des assets validés.",
        "Vérifier règles, droits, sécurité et performance.",
        "Faire tester par un petit groupe avant publication.",
      ],
      warnings: [
        "Pixelrises ne publie pas automatiquement sur Roblox, Minecraft ou Fortnite.",
        "Les snippets sont des bases de travail à adapter et tester.",
      ],
      nextSteps: ["Créer une première map", "Tester le script", "Itérer sur la boucle", "Préparer thumbnail et description"],
    },
  };
};

export const createDefaultAgentProject = (): CustomAgentProject => ({
  id: nowId("agent"),
  name: "Agent Business",
  role: "Business strategy",
  goal: "Prioriser les actions qui transforment une idée en projet digital concret.",
  tone: "Clair, direct, professionnel",
  domain: "Projet digital",
  level: "simple",
  instructions: "Analyse le brief, propose des recommandations concrètes et explique l'impact business.",
  avoid: "Ne jamais publier, envoyer, supprimer ou connecter un outil sans validation utilisateur.",
  projectContext: {
    projectId: "demo",
    projectType: "site",
    businessName: "Projet Pixelrises",
    niche: "création digitale",
    offer: "site, agent IA ou jeu structuré",
    goal: "lancer un projet crédible",
  },
  permissions: {
    readProject: true,
    suggestChanges: true,
    editWithApproval: false,
    publishWithApproval: false,
    accessAnalytics: false,
    useIntegrations: false,
  },
  autonomyLevel: "proposals_validated",
  allowedActions: [
    "read_project",
    "suggest_site_improvement",
    "suggest_copywriting",
    "create_task",
    "create_agent_note",
  ],
  forbiddenActions: [
    "send_email_without_validation",
    "publish_site_without_validation",
    "modify_credits",
    "modify_payment",
    "access_other_user_data",
    "connect_external_tool_without_consent",
    "call_external_api_without_permission",
    "prospect_automatically",
  ],
  connectedTools: ["Business AI", "Site Builder", "Projects"],
  status: "ready",
  riskLevel: "low",
  dataState: "mock",
  testHistory: [],
  proposedActions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const summarizeProject = (project: NormalizedSiteProject | CustomAgentProject | GameProject) => {
  if ("pages" in project) return `${project.meta.businessName} · site · ${project.meta.goal}`;
  if ("permissions" in project) return `${project.name} · agent · ${project.goal}`;
  return `${project.meta.title} · ${project.meta.platform} · ${project.meta.gameType}`;
};

export { slugify };
