import {
  estimatePixelrisesCoreCost,
  type PixelrisesGenerationType,
} from "@/modules/ai/intelligence/pixelrises-intelligence-layer";

export type TemplateCategory =
  | "Business"
  | "Student"
  | "Agents"
  | "Content"
  | "Sites"
  | "Apps"
  | "Landings"
  | "Prototypes"
  | "Games"
  | "Automatisation";

export type TemplateTargetSpace = "business" | "student" | "agent-studio" | "creator-soon";
export type TemplateLevel = "Simple" | "Avance";
export type TemplateStatus = "pret" | "beta" | "a-configurer";
export type TemplateBadge = "Premium" | "Populaire" | "Recommande" | "Creator AI bientot";
export type TemplatePreviewType = "business" | "student" | "agent" | "content" | "game" | "automation";
export type TemplateMode = "direct" | "plan";
export type TemplatePreviewLayoutType =
  | "landing"
  | "workspace"
  | "student-sheet"
  | "agent-card"
  | "content-plan"
  | "game-plan"
  | "automation-flow";

export type TemplatePreviewSpec = {
  layoutType: TemplatePreviewLayoutType;
  heroBadge: string;
  sampleTitle: string;
  sampleSubtitle: string;
  sampleCTA: string;
  sampleSecondaryCTA?: string;
  cards: Array<{ title: string; body: string; meta?: string }>;
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
  sections: string[];
  visualBlocks: string[];
  exampleOutput: string;
  statusLabel: string;
};

export type PixelrisesTemplate = {
  templateId: string;
  title: string;
  category: TemplateCategory;
  subCategory: string;
  targetSpace: TemplateTargetSpace;
  command: string;
  shortDescription: string;
  longDescription: string;
  prefilledPrompt: string;
  expectedOutput: string;
  suggestedMode: TemplateMode;
  requiredInputs: string[];
  status: TemplateStatus;
  badges: TemplateBadge[];
  estimatedCost: number;
  safetyNotes: string[];
  previewType: TemplatePreviewType;
  version: string;
  priority: number;
  coreGenerationType: PixelrisesGenerationType;
  structure: string[];
  previewSpec: TemplatePreviewSpec;
};

const costFor = (generationType: PixelrisesGenerationType) =>
  estimatePixelrisesCoreCost(generationType).estimatedCredits;

const templateVersion = "p9-f.1";

export const templateStatusLabel: Record<TemplateStatus, string> = {
  pret: "Pret",
  beta: "Beta",
  "a-configurer": "A configurer",
};

export const templateTargetLabel: Record<TemplateTargetSpace, string> = {
  business: "Business AI",
  student: "Student AI",
  "agent-studio": "Agent Studio",
  "creator-soon": "Creator AI bientot",
};

export const templateFilters = [
  "Tous",
  "Business",
  "Student",
  "Agents",
  "Content",
  "Sites",
  "Apps",
  "Landings",
  "Prototypes",
  "Games",
  "Automatisation",
  "Pret",
  "Beta",
  "A configurer",
  "Premium",
  "Populaire",
  "Recommande",
  "Simple",
  "Avance",
] as const;

type TemplateDraft = Omit<PixelrisesTemplate, "estimatedCost" | "version" | "previewSpec"> & {
  previewSpec?: TemplatePreviewSpec;
};

const buildPreviewSpec = (template: TemplateDraft): TemplatePreviewSpec => {
  if (template.previewSpec) return template.previewSpec;

  if (template.previewType === "student") {
    const isQuiz = template.command === "/quiz";
    const isOral = template.command === "/oral";
    const isSlides = template.command === "/slides";
    return {
      layoutType: "student-sheet",
      heroBadge: "Apercu pedagogique",
      sampleTitle: isQuiz
        ? "Quiz progressif avec correction"
        : isOral
          ? "Oral structure, script et questions"
          : isSlides
            ? "Diaporama pret a structurer"
            : "Fiche claire pour reviser vite",
      sampleSubtitle: "Un modele de livrable etudiant, a adapter avec ton cours avant generation.",
      sampleCTA: "Preparer dans Student AI",
      cards: [
        { title: "Notions cles", body: "Les idees a connaitre sont regroupees en blocs courts." },
        { title: "Definitions", body: "Chaque notion est expliquee simplement avec un exemple." },
        { title: isQuiz ? "Correction" : "Erreurs frequentes", body: "Les points qui font perdre du temps sont identifies." },
        { title: isSlides ? "Slides 1-3" : "Mini quiz", body: "Un controle rapide permet de verifier la comprehension." },
      ],
      steps: template.structure,
      faq: [
        { question: "Est-ce un devoir termine ?", answer: "Non, c'est un brouillon pedagogique a verifier." },
        { question: "Peut-on l'utiliser avec un cours ?", answer: "Oui, Student AI pre-remplit la demande et attend ton contenu." },
      ],
      sections: ["Cours fourni", "Synthese", "Exercices", "Correction", "A revoir"],
      visualBlocks: ["Fiche", "Quiz", "Plan", "Revision"],
      exampleOutput: template.expectedOutput,
      statusLabel: "Brouillon pedagogique",
    };
  }

  if (template.previewType === "agent") {
    return {
      layoutType: "agent-card",
      heroBadge: "Agent Studio preview",
      sampleTitle: template.title,
      sampleSubtitle: "Role, mission, permissions et limites avant test local.",
      sampleCTA: "Ouvrir Agent Studio",
      sampleSecondaryCTA: "Tester localement",
      cards: [
        { title: "Mission", body: template.shortDescription },
        { title: "Permissions", body: "Lire le contexte, proposer, preparer une action validable." },
        { title: "Limites", body: "Pas de publication, pas d'envoi, pas d'action externe sans validation." },
        { title: "Test local", body: "Une question de test permet de verifier le comportement." },
      ],
      steps: ["Brief", "Generation", "Test", "Finalisation"],
      faq: [
        { question: "L'agent agit-il seul ?", answer: "Non, il prepare uniquement des actions validables." },
        { question: "Peut-il toucher aux services externes ?", answer: "Non, les integrations restent bloquees sans validation." },
      ],
      sections: ["Role", "Capacites", "Permissions", "Limites", "Test"],
      visualBlocks: ["Profil agent", "Capacites", "Permissions", "Chat test"],
      exampleOutput: template.expectedOutput,
      statusLabel: template.status === "pret" ? "Pret a tester" : "Beta controlee",
    };
  }

  if (template.previewType === "content") {
    return {
      layoutType: "content-plan",
      heroBadge: "Creator AI bientot",
      sampleTitle: "Brouillon contenu pret a reprendre",
      sampleSubtitle: "Hook, angle, structure et CTA sans publication automatique.",
      sampleCTA: "Preparer le brouillon",
      cards: [
        { title: "Hook", body: "Ouvre avec une promesse concrete ou une tension client." },
        { title: "Angle", body: "Clarifie le point de vue avant de produire le contenu." },
        { title: "Structure", body: "3 a 6 blocs courts selon le format choisi." },
        { title: "CTA", body: "Invite a repondre, reserver, tester ou demander un avis." },
      ],
      steps: ["Hook", "Angle", "Script", "CTA", "Validation"],
      faq: [
        { question: "Creator AI est-il finalise ?", answer: "Non, le template prepare un brouillon dans Business AI." },
        { question: "Le contenu est-il publie ?", answer: "Non, aucune publication automatique." },
      ],
      sections: ["Idee", "Hook", "Slides ou scenes", "CTA", "Checklist"],
      visualBlocks: ["Script", "Carrousel", "Calendrier", "Email"],
      exampleOutput: template.expectedOutput,
      statusLabel: "Creator AI bientot",
    };
  }

  if (template.previewType === "game") {
    return {
      layoutType: "game-plan",
      heroBadge: "Brouillon Game Builder",
      sampleTitle: "Concept de jeu exploitable",
      sampleSubtitle: "Loop, objectifs, progression, assets et checklist de test.",
      sampleCTA: "Preparer le concept",
      sampleSecondaryCTA: "Voir la checklist",
      cards: [
        { title: "Gameplay loop", body: "Entrer, agir, gagner un feedback, progresser." },
        { title: "Objectifs", body: "Objectif principal, objectifs secondaires et conditions de victoire." },
        { title: "Progression", body: "Niveaux, difficulte, score et recompenses." },
        { title: "Assets", body: "Elements visuels, sons, scripts et map a prevoir." },
      ],
      steps: ["Concept", "Loop", "Niveaux", "Assets", "Tests"],
      faq: [
        { question: "Est-ce un jeu finalise ?", answer: "Non, c'est un modele de concept a generer ensuite." },
        { question: "Peut-on publier directement ?", answer: "Non, publication et export restent a configurer." },
      ],
      sections: ["Concept", "Regles", "Progression", "Assets", "Checklist"],
      visualBlocks: ["Carte concept", "Loop", "Niveaux", "Tests"],
      exampleOutput: template.expectedOutput,
      statusLabel: "Brouillon exploitable",
    };
  }

  if (template.previewType === "automation") {
    return {
      layoutType: "automation-flow",
      heroBadge: "Dry-run automation",
      sampleTitle: "Workflow controle avant connexion",
      sampleSubtitle: "Trigger, conditions, validation humaine et brouillons de messages.",
      sampleCTA: "Preparer le workflow",
      cards: [
        { title: "Trigger", body: "Evenement qui lance le brouillon, sans action live." },
        { title: "Conditions", body: "Regles de controle avant toute proposition." },
        { title: "Validation", body: "Humain obligatoire avant action externe." },
        { title: "Sortie", body: "Message, rapport ou checklist en brouillon." },
      ],
      steps: ["Trigger", "Condition", "Validation", "Brouillon", "Audit"],
      faq: [
        { question: "Le workflow agit-il seul ?", answer: "Non, il reste en dry-run." },
        { question: "Les integrations sont-elles live ?", answer: "Non, elles restent a configurer." },
      ],
      sections: ["Trigger", "Regles", "Validation", "Sortie", "Risques"],
      visualBlocks: ["Dry-run", "Controle", "Journal", "Validation"],
      exampleOutput: template.expectedOutput,
      statusLabel: "Dry-run a configurer",
    };
  }

  const workspaceLayout = template.category === "Apps" || template.category === "Prototypes";
  return {
    layoutType: workspaceLayout ? "workspace" : "landing",
    heroBadge: workspaceLayout ? "Apercu produit" : "Apercu landing",
    sampleTitle: workspaceLayout ? "Cockpit simple pour piloter le projet" : "Une offre claire qui donne envie d'agir",
    sampleSubtitle: workspaceLayout
      ? "Dashboard, modules, actions et workflow a adapter avant generation."
      : "Une structure de page conversion-first, prete a personnaliser avec ton offre.",
    sampleCTA: workspaceLayout ? "Ouvrir le prototype" : "Demander un devis",
    sampleSecondaryCTA: workspaceLayout ? "Voir le workflow" : "Voir les preuves",
    cards: workspaceLayout
      ? [
          { title: "Vue principale", body: "Cartes, indicateurs et actions claires." },
          { title: "Workflow", body: "Etapes de travail et validations visibles." },
          { title: "Donnees", body: "Champs et objets a confirmer avant build." },
          { title: "Limites", body: "Backend et integrations non annonces comme actifs." },
        ]
      : [
          { title: "Hero fort", body: "Promesse, cible, CTA et reassurance visibles." },
          { title: "Preuve sociale", body: "Preuves verifiables, sans faux avis ni statistiques inventees." },
          { title: "Offre claire", body: "Benefices, objections et CTA final." },
          { title: "FAQ utile", body: "Repond aux doutes avant la prise de contact." },
        ],
    steps: template.structure,
    faq: [
      { question: "Est-ce publie ?", answer: "Non, c'est un apercu template a reprendre." },
      { question: "Peut-on le personnaliser ?", answer: "Oui, Business AI pre-remplit le brief avant generation." },
    ],
    sections: workspaceLayout
      ? ["Sidebar", "Stats", "Workflow", "Actions", "Validation"]
      : ["Navbar", "Hero", "Preuves", "Benefices", "Offre", "FAQ", "CTA"],
    visualBlocks: workspaceLayout
      ? ["Topbar", "Cards", "Timeline", "Actions"]
      : ["Mini navbar", "Hero", "Bloc preuve sociale", "3 benefices", "Mini FAQ"],
    exampleOutput: template.expectedOutput,
    statusLabel: "Modele pret a reprendre",
  };
};

const makeTemplate = (template: TemplateDraft): PixelrisesTemplate => ({
  ...template,
  previewSpec: buildPreviewSpec(template),
  estimatedCost: costFor(template.coreGenerationType),
  version: templateVersion,
});

export const pixelrisesTemplates: PixelrisesTemplate[] = [
  makeTemplate({
    templateId: "business-landing-premium",
    title: "Landing page premium",
    category: "Landings",
    subCategory: "Conversion",
    targetSpace: "business",
    command: "/landing",
    shortDescription: "Une page de vente claire pour transformer une offre en demandes qualifiees.",
    longDescription:
      "Prepare une landing avec hero fort, promesse, cible, preuves, objections, FAQ, CTA et preview de structure.",
    prefilledPrompt:
      "/landing Cree une landing page premium pour mon offre. Precise la cible, la promesse, les benefices, les objections, les preuves, la FAQ, le CTA, le style et les sections de conversion.",
    expectedOutput: "Structure de landing, copywriting, CTA, sections, objections et preview business.",
    suggestedMode: "plan",
    requiredInputs: ["Offre", "Cible", "Objectif", "CTA", "Style"],
    status: "pret",
    badges: ["Premium", "Recommande"],
    safetyNotes: ["Aucune publication automatique.", "Les preuves doivent rester verifiables."],
    previewType: "business",
    priority: 1,
    coreGenerationType: "site_landing",
    structure: ["Hero", "Probleme", "Offre", "Preuves", "FAQ", "CTA final"],
  }),
  makeTemplate({
    templateId: "business-site-local",
    title: "Site vitrine local",
    category: "Sites",
    subCategory: "Presence locale",
    targetSpace: "business",
    command: "/site",
    shortDescription: "Un brief de site local pour attirer des appels, devis ou reservations.",
    longDescription:
      "Transforme une activite locale en site clair avec SEO local, zones desservies, confiance et contact rapide.",
    prefilledPrompt:
      "/site Cree un brief complet pour un site vitrine local. Inclure activite, ville, cible, objectif, sections, SEO local, preuves, FAQ, CTA et style premium.",
    expectedOutput: "Brief Site Builder, structure SEO locale, sections et CTA.",
    suggestedMode: "plan",
    requiredInputs: ["Activite", "Ville", "Objectif", "Contact", "Preuves"],
    status: "pret",
    badges: ["Populaire", "Recommande"],
    safetyNotes: ["Ne pas inventer d'avis.", "Publication a valider dans le Builder."],
    previewType: "business",
    priority: 2,
    coreGenerationType: "site_landing",
    structure: ["Hero local", "Services", "Pourquoi nous", "Zones", "FAQ", "Contact"],
  }),
  makeTemplate({
    templateId: "business-saas-app",
    title: "App SaaS simple",
    category: "Apps",
    subCategory: "Produit digital",
    targetSpace: "business",
    command: "/app",
    shortDescription: "Un concept SaaS transforme en ecrans, roles, donnees et premiere logique.",
    longDescription:
      "Prepare un blueprint d'application SaaS simple avec dashboard, utilisateurs, flux, donnees et limites.",
    prefilledPrompt:
      "/app Structure une app SaaS simple pour mon idee. Donne le probleme, les utilisateurs, les ecrans, les donnees, les actions, l'onboarding, les limites et une preview de dashboard.",
    expectedOutput: "Blueprint produit, ecrans, parcours, donnees et prochaines etapes.",
    suggestedMode: "plan",
    requiredInputs: ["Probleme", "Utilisateur cible", "Fonction principale", "Donnees"],
    status: "beta",
    badges: ["Premium"],
    safetyNotes: ["Prototype seulement tant que le build n'est pas lance.", "Pas de backend cree automatiquement."],
    previewType: "business",
    priority: 3,
    coreGenerationType: "app_prototype",
    structure: ["Probleme", "Utilisateurs", "Ecrans", "Donnees", "Risques", "MVP"],
  }),
  makeTemplate({
    templateId: "business-prototype-tool",
    title: "Prototype outil interne",
    category: "Prototypes",
    subCategory: "Workflow",
    targetSpace: "business",
    command: "/prototype",
    shortDescription: "Un outil interne de gestion transforme en prototype clair et testable.",
    longDescription:
      "Prepare un prototype d'outil interne avec roles, tableaux, actions, validations et preview fonctionnelle.",
    prefilledPrompt:
      "/prototype Prepare un prototype d'outil interne. Decris les roles, les donnees, les ecrans, les actions, les validations, les erreurs, la securite et une preview de workflow.",
    expectedOutput: "Plan prototype, composants, workflow et limites honnetes.",
    suggestedMode: "plan",
    requiredInputs: ["Workflow", "Roles", "Donnees", "Action principale"],
    status: "beta",
    badges: ["Premium"],
    safetyNotes: ["Aucune action externe sans validation.", "Donnees sensibles a proteger."],
    previewType: "business",
    priority: 4,
    coreGenerationType: "app_prototype",
    structure: ["Roles", "Workflow", "Ecrans", "Validation", "Erreurs", "Prototype"],
  }),
  makeTemplate({
    templateId: "business-offer-clarity",
    title: "Offre commerciale claire",
    category: "Business",
    subCategory: "Positionnement",
    targetSpace: "business",
    command: "/offre",
    shortDescription: "Clarifie une offre en promesse, packages, objections et CTA.",
    longDescription:
      "Transforme une idee confuse en offre vendable avec cible, douleur, resultat, garanties et prochaines actions.",
    prefilledPrompt:
      "/offre Clarifie mon offre commerciale. Donne cible, douleur, promesse, benefices, packages, objections, garanties, prix indicatifs a valider et CTA.",
    expectedOutput: "Offre structuree, message, objections, CTA et plan d'action.",
    suggestedMode: "direct",
    requiredInputs: ["Idee", "Cible", "Resultat attendu"],
    status: "pret",
    badges: ["Recommande"],
    safetyNotes: ["Prix a valider humainement.", "Aucune promesse de revenu garantie."],
    previewType: "business",
    priority: 5,
    coreGenerationType: "text_generation",
    structure: ["Cible", "Promesse", "Packages", "Objections", "CTA"],
  }),
  makeTemplate({
    templateId: "business-sales-funnel",
    title: "Tunnel de vente simple",
    category: "Business",
    subCategory: "Acquisition",
    targetSpace: "business",
    command: "/tunnel",
    shortDescription: "Un parcours prospect de la decouverte a la prise de contact.",
    longDescription:
      "Prepare un tunnel simple avec source de trafic, page, lead magnet, relance et conversion sans automatisation live.",
    prefilledPrompt:
      "/tunnel Cree un tunnel de vente simple. Inclure source de trafic, message, page, lead magnet, relance, conversion, objections, suivi et actions a valider.",
    expectedOutput: "Tunnel clair, etapes, messages, relances en brouillon et indicateurs.",
    suggestedMode: "plan",
    requiredInputs: ["Offre", "Canal", "Objectif", "Audience"],
    status: "pret",
    badges: ["Populaire"],
    safetyNotes: ["Relances en brouillon seulement.", "Pas d'envoi automatique."],
    previewType: "business",
    priority: 6,
    coreGenerationType: "text_generation",
    structure: ["Trafic", "Page", "Capture", "Relance", "Conversion", "Suivi"],
  }),
  makeTemplate({
    templateId: "business-market-research",
    title: "Etude de marche rapide",
    category: "Business",
    subCategory: "Recherche",
    targetSpace: "business",
    command: "/marche",
    shortDescription: "Cadre une recherche marche sans inventer de sources.",
    longDescription:
      "Prepare les angles, hypotheses, questions client, concurrents a analyser et sources a verifier.",
    prefilledPrompt:
      "/marche Prepare une etude de marche rapide. Donne hypotheses, segments, questions client, concurrents, sources a verifier, risques et plan d'analyse. N'invente aucune source.",
    expectedOutput: "Plan de recherche, hypotheses, questions et criteres de validation.",
    suggestedMode: "plan",
    requiredInputs: ["Idee", "Marche", "Zone", "Client cible"],
    status: "pret",
    badges: ["Recommande"],
    safetyNotes: ["Ne pas inventer de statistiques.", "Sources a verifier manuellement."],
    previewType: "business",
    priority: 7,
    coreGenerationType: "text_generation",
    structure: ["Hypotheses", "Segments", "Questions", "Sources", "Risques"],
  }),
  makeTemplate({
    templateId: "business-competitor-analysis",
    title: "Analyse concurrentielle",
    category: "Business",
    subCategory: "Positionnement",
    targetSpace: "business",
    command: "/concurrence",
    shortDescription: "Compare ton positionnement sans copier les concurrents.",
    longDescription:
      "Prepare une grille de comparaison avec angles, promesses, forces, faiblesses et opportunites.",
    prefilledPrompt:
      "/concurrence Analyse mon positionnement face a mes concurrents. Donne criteres, angles, forces, faiblesses, opportunites, differenciation et actions prioritaires.",
    expectedOutput: "Grille comparative, opportunites, differenciation et plan d'action.",
    suggestedMode: "direct",
    requiredInputs: ["Offre", "Concurrents", "Cible"],
    status: "pret",
    badges: ["Premium"],
    safetyNotes: ["Ne pas copier une marque.", "Comparer uniquement les logiques utiles."],
    previewType: "business",
    priority: 8,
    coreGenerationType: "text_generation",
    structure: ["Criteres", "Forces", "Faiblesses", "Angles", "Actions"],
  }),
  makeTemplate({
    templateId: "student-revision-sheet",
    title: "Fiche de revision",
    category: "Student",
    subCategory: "Revision",
    targetSpace: "student",
    command: "/fiche",
    shortDescription: "Transforme un cours en fiche claire, courte et exploitable.",
    longDescription:
      "Prepare une fiche avec notions cles, definitions, exemples, pieges et mini questions.",
    prefilledPrompt:
      "/fiche Cree une fiche de revision claire a partir de mon cours. Ajoute notions cles, definitions, exemples, pieges, mini synthese et questions possibles.",
    expectedOutput: "Fiche pedagogique, definitions, exemples et questions.",
    suggestedMode: "direct",
    requiredInputs: ["Cours ou sujet", "Niveau", "Objectif"],
    status: "pret",
    badges: ["Populaire", "Recommande"],
    safetyNotes: ["Aide a comprendre, pas a tricher.", "Sources a fournir si necessaire."],
    previewType: "student",
    priority: 9,
    coreGenerationType: "study_sheet",
    structure: ["Notions", "Definitions", "Exemples", "Pieges", "Questions"],
  }),
  makeTemplate({
    templateId: "student-corrected-quiz",
    title: "Quiz corrige",
    category: "Student",
    subCategory: "Entrainement",
    targetSpace: "student",
    command: "/quiz",
    shortDescription: "Cree un quiz progressif avec correction expliquee.",
    longDescription:
      "Prepare des questions faciles, moyennes et difficiles, puis une correction utile pour progresser.",
    prefilledPrompt:
      "/quiz Cree un quiz progressif sur mon cours avec questions faciles, moyennes et difficiles. Ajoute correction detaillee, explications et points a revoir.",
    expectedOutput: "Quiz progressif, corrections, explications et revision ciblee.",
    suggestedMode: "direct",
    requiredInputs: ["Sujet", "Niveau", "Nombre de questions"],
    status: "pret",
    badges: ["Populaire"],
    safetyNotes: ["Ne remplace pas l'effort de revision.", "Corrections pedagogiques uniquement."],
    previewType: "student",
    priority: 10,
    coreGenerationType: "quiz",
    structure: ["Questions", "Niveaux", "Correction", "Explications", "A revoir"],
  }),
  makeTemplate({
    templateId: "student-flashcards",
    title: "Flashcards",
    category: "Student",
    subCategory: "Memoire active",
    targetSpace: "student",
    command: "/flashcards",
    shortDescription: "Cartes question/reponse pour memoriser vite.",
    longDescription:
      "Transforme un cours en cartes courtes avec notion, question, reponse et niveau.",
    prefilledPrompt:
      "/flashcards Transforme mon cours en flashcards question/reponse. Ajoute niveau, pieges, exemples et ordre de revision.",
    expectedOutput: "Flashcards structurees avec niveaux et ordre de revision.",
    suggestedMode: "direct",
    requiredInputs: ["Cours", "Nombre de cartes", "Niveau"],
    status: "pret",
    badges: ["Recommande"],
    safetyNotes: ["Toujours verifier avec le cours fourni.", "Pas de source inventee."],
    previewType: "student",
    priority: 11,
    coreGenerationType: "study_sheet",
    structure: ["Question", "Reponse", "Niveau", "Piege", "Exemple"],
  }),
  makeTemplate({
    templateId: "student-revision-planning",
    title: "Planning de revision",
    category: "Student",
    subCategory: "Organisation",
    targetSpace: "student",
    command: "/planning",
    shortDescription: "Un planning simple et realiste pour preparer une evaluation.",
    longDescription:
      "Organise les sessions, priorites, pauses, exercices et revision finale.",
    prefilledPrompt:
      "/planning Fais un planning de revision realiste. Precise mes matieres, le temps disponible, la date, les priorites, les exercices et les pauses.",
    expectedOutput: "Planning priorise, sessions courtes et checkpoints.",
    suggestedMode: "plan",
    requiredInputs: ["Date", "Matieres", "Temps disponible", "Difficultes"],
    status: "pret",
    badges: ["Populaire"],
    safetyNotes: ["Planning a ajuster selon ton rythme.", "Aucune promesse de note."],
    previewType: "student",
    priority: 12,
    coreGenerationType: "text_generation",
    structure: ["Priorites", "Sessions", "Exercices", "Repos", "Checklist"],
  }),
  makeTemplate({
    templateId: "student-oral-prep",
    title: "Preparation oral",
    category: "Student",
    subCategory: "Oral",
    targetSpace: "student",
    command: "/oral",
    shortDescription: "Prepare un oral avec plan, script et questions possibles.",
    longDescription:
      "Structure l'introduction, le plan, la conclusion, le script et les objections du jury.",
    prefilledPrompt:
      "/oral Aide-moi a preparer mon oral. Donne introduction, problematique, plan, script, transitions, conclusion, questions possibles et conseils de presentation.",
    expectedOutput: "Plan oral, script, transitions et questions possibles.",
    suggestedMode: "plan",
    requiredInputs: ["Sujet", "Duree", "Niveau", "Consignes"],
    status: "pret",
    badges: ["Premium"],
    safetyNotes: ["L'eleve doit s'entrainer lui-meme.", "Pas de fausse source."],
    previewType: "student",
    priority: 13,
    coreGenerationType: "text_generation",
    structure: ["Intro", "Plan", "Script", "Questions", "Entrainement"],
  }),
  makeTemplate({
    templateId: "student-slides",
    title: "Diaporama",
    category: "Student",
    subCategory: "Slides",
    targetSpace: "student",
    command: "/slides",
    shortDescription: "Prepare un diaporama complet avec script oral.",
    longDescription:
      "Cree un plan slide par slide avec titres, contenus, transitions, visuels a prevoir et script.",
    prefilledPrompt:
      "/slides Prepare un diaporama complet. Donne le plan, les slides, le contenu, les transitions, les visuels a prevoir, le script oral et les questions possibles.",
    expectedOutput: "Plan de slides, contenu, script et checklist visuelle.",
    suggestedMode: "plan",
    requiredInputs: ["Sujet", "Duree", "Nombre de slides", "Niveau"],
    status: "pret",
    badges: ["Recommande"],
    safetyNotes: ["Export reel non marque comme actif.", "Support a verifier avant presentation."],
    previewType: "student",
    priority: 14,
    coreGenerationType: "text_generation",
    structure: ["Slides", "Transitions", "Visuels", "Script", "Questions"],
  }),
  makeTemplate({
    templateId: "student-course-summary",
    title: "Resume de cours",
    category: "Student",
    subCategory: "Comprehension",
    targetSpace: "student",
    command: "/resume",
    shortDescription: "Resume un cours en idees cles et points a retenir.",
    longDescription:
      "Produit une synthese courte avec notions, explications et plan de revision.",
    prefilledPrompt:
      "/resume Resume ce cours en idees principales, notions importantes, definitions, exemples simples, points a retenir et questions a reviser.",
    expectedOutput: "Resume clair, notions, exemples et revision ciblee.",
    suggestedMode: "direct",
    requiredInputs: ["Cours", "Objectif", "Niveau"],
    status: "pret",
    badges: ["Populaire"],
    safetyNotes: ["Ne pas inventer de contenu hors cours.", "Demander le cours si absent."],
    previewType: "student",
    priority: 15,
    coreGenerationType: "study_sheet",
    structure: ["Idees", "Definitions", "Exemples", "A retenir", "Questions"],
  }),
  makeTemplate({
    templateId: "student-answer-correction",
    title: "Correction de reponse",
    category: "Student",
    subCategory: "Correction",
    targetSpace: "student",
    command: "/corriger",
    shortDescription: "Corrige une reponse sans faire le travail a la place.",
    longDescription:
      "Analyse les points justes, erreurs, manques et propose une version amelioree expliquee.",
    prefilledPrompt:
      "/corriger Corrige ma reponse avec methode. Indique les points justes, erreurs, manques, explications et une version amelioree sans faire le travail a ma place.",
    expectedOutput: "Correction pedagogique, explication et version amelioree.",
    suggestedMode: "direct",
    requiredInputs: ["Enonce", "Reponse", "Bareme si disponible"],
    status: "pret",
    badges: ["Recommande"],
    safetyNotes: ["Ne pas encourager la triche.", "Correction pedagogique seulement."],
    previewType: "student",
    priority: 16,
    coreGenerationType: "text_generation",
    structure: ["Points justes", "Erreurs", "Manques", "Explication", "Version amelioree"],
  }),
  ...[
    ["agent-builder", "Agent Builder", "Creation complete", "Configure un agent qui transforme un brief en plan de projet complet."],
    ["agent-seo", "Agent SEO", "SEO", "Configure un agent qui audite pages, titres, FAQ et SEO local."],
    ["agent-design", "Agent Design", "Design", "Configure un agent qui ameliore hierarchie, spacing et coherence visuelle."],
    ["agent-copywriting", "Agent Copywriting", "Copywriting", "Configure un agent qui clarifie les textes, CTA et objections."],
    ["agent-conversion", "Agent Conversion", "Conversion", "Configure un agent qui analyse tunnel, preuves, CTA et freins."],
    ["agent-business", "Agent Business", "Business", "Configure un agent qui clarifie offre, promesse, pricing et positionnement."],
    ["agent-support", "Agent Support", "Support", "Configure un agent qui prepare des reponses client sans les envoyer."],
    ["agent-analytics", "Agent Analytics", "Analytics", "Configure un agent qui lit des indicateurs et propose des actions."],
    ["agent-automation", "Agent Automatisation", "Workflows", "Configure un agent qui prepare des workflows validables sans action externe."],
    ["agent-content", "Agent Content", "Contenu", "Configure un agent qui cree hooks, scripts et calendriers de contenu."],
    ["agent-student", "Agent Student", "Apprentissage", "Configure un agent qui aide a reviser sans faire le devoir a la place."],
    ["agent-operations", "Agent Operations", "Operations", "Configure un agent qui organise taches, priorites et rituels."],
    ["agent-improve", "Agent Improve", "Amelioration", "Configure un agent qui propose des patchs cibles sans tout regenerer."],
    ["agent-game-design", "Agent Game Design", "Game design", "Configure un agent qui prepare concept, loop, progression et regles."],
    ["agent-script", "Agent Script", "Scripts", "Configure un agent qui prepare snippets Luau, Verse, JS ou JSON."],
    ["agent-assets", "Agent Assets", "Assets", "Configure un agent qui prepare prompts visuels, assets et thumbnails."],
    ["agent-publishing", "Agent Publishing", "Publication", "Configure un agent qui prepare une checklist sans publier automatiquement."],
  ].map(([id, title, subCategory, description], index) =>
    makeTemplate({
      templateId: id,
      title,
      category: "Agents",
      subCategory,
      targetSpace: "agent-studio",
      command: "/agent",
      shortDescription: description,
      longDescription:
        "Prepare un agent Pixelrises avec mission, contexte, permissions, limites, test local et actions validables.",
      prefilledPrompt: `/agent ${description} Ajoute mission, contexte, capacites, permissions, limites, test local et interdictions de publication ou action externe sans validation.`,
      expectedOutput: "Agent preconfigure, permissions, limites et test a valider.",
      suggestedMode: "plan",
      requiredInputs: ["Role", "Objectif", "Contexte", "Permissions", "Limites"],
      status: index < 6 || id === "agent-improve" ? "pret" : "beta",
      badges: index < 6 ? ["Recommande"] : ["Premium"],
      safetyNotes: ["Aucune action externe sans validation humaine.", "Permissions sensibles bloquees par defaut."],
      previewType: "agent",
      priority: 17 + index,
      coreGenerationType: "agent",
      structure: ["Mission", "Capacites", "Permissions", "Limites", "Test"],
    }),
  ),
  makeTemplate({
    templateId: "content-tiktok-script",
    title: "Script TikTok",
    category: "Content",
    subCategory: "Video courte",
    targetSpace: "creator-soon",
    command: "/script",
    shortDescription: "Un script court avec hook, structure et CTA.",
    longDescription:
      "Prepare un script video court. Creator AI n'est pas marque comme finalise : le brouillon peut etre prepare dans Business AI.",
    prefilledPrompt:
      "/script Prepare un script TikTok/Reels/Shorts pour mon offre. Donne hook, scene, message, CTA, variations et limites. Creator AI n'est pas encore finalise.",
    expectedOutput: "Brouillon de script, hooks, variantes et CTA.",
    suggestedMode: "direct",
    requiredInputs: ["Offre", "Cible", "Angle", "CTA"],
    status: "a-configurer",
    badges: ["Creator AI bientot"],
    safetyNotes: ["Creator AI bientot.", "Aucune publication automatique."],
    previewType: "content",
    priority: 34,
    coreGenerationType: "text_generation",
    structure: ["Hook", "Scene", "Message", "CTA", "Variantes"],
  }),
  makeTemplate({
    templateId: "content-carousel",
    title: "Carrousel",
    category: "Content",
    subCategory: "Social",
    targetSpace: "creator-soon",
    command: "/content",
    shortDescription: "Un plan de carrousel clair, utile et actionnable.",
    longDescription:
      "Prepare slides, titres, message, ordre et CTA. Creator AI reste marque bientot.",
    prefilledPrompt:
      "/content Prepare un carrousel Instagram/LinkedIn. Donne angle, slides, titres, textes courts, CTA et direction visuelle. Creator AI bientot.",
    expectedOutput: "Structure de carrousel et textes slide par slide.",
    suggestedMode: "plan",
    requiredInputs: ["Sujet", "Audience", "Objectif", "Ton"],
    status: "a-configurer",
    badges: ["Creator AI bientot"],
    safetyNotes: ["Pas de creation visuelle reelle annoncee.", "Brouillon seulement."],
    previewType: "content",
    priority: 35,
    coreGenerationType: "template",
    structure: ["Angle", "Slides", "Texte", "CTA", "Direction"],
  }),
  makeTemplate({
    templateId: "content-email-commercial",
    title: "Email commercial",
    category: "Content",
    subCategory: "Vente",
    targetSpace: "creator-soon",
    command: "/email",
    shortDescription: "Un email de vente humain, clair et non agressif.",
    longDescription:
      "Prepare un brouillon d'email avec objet, accroche, valeur, preuve, CTA et relance possible.",
    prefilledPrompt:
      "/email Prepare un email commercial pour mon offre. Donne objet, accroche, valeur, preuve, CTA, relance possible et ton humain. Ne rien envoyer automatiquement.",
    expectedOutput: "Email brouillon, objet, relance et CTA.",
    suggestedMode: "direct",
    requiredInputs: ["Offre", "Destinataire", "Objectif", "Ton"],
    status: "beta",
    badges: ["Creator AI bientot"],
    safetyNotes: ["Email brouillon seulement.", "Aucun envoi automatique."],
    previewType: "content",
    priority: 36,
    coreGenerationType: "text_generation",
    structure: ["Objet", "Accroche", "Valeur", "CTA", "Relance"],
  }),
  makeTemplate({
    templateId: "game-roblox-concept",
    title: "Concept Roblox",
    category: "Games",
    subCategory: "Roblox",
    targetSpace: "business",
    command: "/game",
    shortDescription: "Concept, gameplay loop, progression et checklist Roblox.",
    longDescription:
      "Prepare un blueprint Roblox sans promettre de publication ou package executable automatiquement.",
    prefilledPrompt:
      "/game Prepare un concept Roblox. Donne gameplay loop, progression, score, niveaux, assets, scripts a prevoir, limites et checklist de production.",
    expectedOutput: "Blueprint jeu, loop, progression, scripts a prevoir et checklist.",
    suggestedMode: "plan",
    requiredInputs: ["Genre", "Public", "Objectif", "Plateforme"],
    status: "beta",
    badges: ["Premium"],
    safetyNotes: ["Prototype/brief seulement.", "Publication Roblox non automatique."],
    previewType: "game",
    priority: 37,
    coreGenerationType: "app_prototype",
    structure: ["Concept", "Loop", "Progression", "Assets", "Checklist"],
  }),
  makeTemplate({
    templateId: "game-minecraft-map",
    title: "Map Minecraft",
    category: "Games",
    subCategory: "Minecraft",
    targetSpace: "business",
    command: "/game",
    shortDescription: "Plan de map, progression, zones, objectifs et checklist.",
    longDescription:
      "Prepare une map Minecraft exploitable comme brief de production, pas comme export direct.",
    prefilledPrompt:
      "/game Prepare une map Minecraft. Donne theme, zones, objectifs, progression, regles, assets, commandes a prevoir et checklist. Ne dis pas que la map est publiee.",
    expectedOutput: "Brief map, zones, progression et checklist.",
    suggestedMode: "plan",
    requiredInputs: ["Theme", "Mode", "Objectif", "Contraintes"],
    status: "beta",
    badges: ["Premium"],
    safetyNotes: ["Pas d'export automatique.", "Brief a valider avant production."],
    previewType: "game",
    priority: 38,
    coreGenerationType: "app_prototype",
    structure: ["Theme", "Zones", "Regles", "Assets", "Checklist"],
  }),
  makeTemplate({
    templateId: "automation-client-workflow",
    title: "Workflow client",
    category: "Automatisation",
    subCategory: "Client",
    targetSpace: "business",
    command: "/automation",
    shortDescription: "Un workflow client en brouillon, sans action externe active.",
    longDescription:
      "Prepare les etapes client, triggers, conditions, validations humaines et messages brouillons.",
    prefilledPrompt:
      "/automation Prepare un workflow client. Donne trigger, etapes, conditions, validations humaines, messages brouillons, risques et ce qui reste a connecter.",
    expectedOutput: "Workflow brouillon, conditions, validations et limites.",
    suggestedMode: "plan",
    requiredInputs: ["Objectif", "Trigger", "Donnees", "Action souhaitee"],
    status: "a-configurer",
    badges: ["Recommande"],
    safetyNotes: ["Aucune action externe live.", "Validation humaine obligatoire."],
    previewType: "automation",
    priority: 39,
    coreGenerationType: "template",
    structure: ["Trigger", "Conditions", "Validation", "Message", "Risques"],
  }),
  makeTemplate({
    templateId: "automation-reporting-workflow",
    title: "Workflow reporting",
    category: "Automatisation",
    subCategory: "Reporting",
    targetSpace: "business",
    command: "/automation",
    shortDescription: "Un reporting recurrent prepare en dry-run.",
    longDescription:
      "Prepare un workflow de suivi avec metriques, frequence, format, sources et statut a configurer.",
    prefilledPrompt:
      "/automation Prepare un workflow reporting. Donne metriques, sources, frequence, format, alertes, validation humaine et ce qui reste a connecter.",
    expectedOutput: "Plan reporting, metriques, sources et dry-run.",
    suggestedMode: "plan",
    requiredInputs: ["Metriques", "Source", "Frequence", "Destinataire"],
    status: "a-configurer",
    badges: ["Premium"],
    safetyNotes: ["Dry-run seulement.", "Sources a connecter et verifier."],
    previewType: "automation",
    priority: 40,
    coreGenerationType: "template",
    structure: ["Metriques", "Sources", "Frequence", "Alertes", "Validation"],
  }),
];

export const getTemplateUseHref = (template: PixelrisesTemplate) => {
  const params = new URLSearchParams({
    templateId: template.templateId,
    templateCommand: template.command,
    templateMode: template.suggestedMode,
    templatePrompt: template.prefilledPrompt,
  });

  if (template.targetSpace === "student") return `/ai-spaces/student?${params.toString()}`;
  if (template.targetSpace === "agent-studio") return `/builder/agent?${params.toString()}`;
  return `/ai-spaces/business?${params.toString()}`;
};

export type TemplateUsageEntry = {
  templateId: string;
  title: string;
  targetSpace: TemplateTargetSpace;
  prefilledPrompt: string;
  status: TemplateStatus;
  usedAt: string;
};

export const templateUsageStorageKey = "pixelrises:v2:templates:usage-history";

export const readTemplateUsageHistory = (): TemplateUsageEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(templateUsageStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
};

export const saveTemplateUsage = (template: PixelrisesTemplate): TemplateUsageEntry[] => {
  if (typeof window === "undefined") return [];
  const next: TemplateUsageEntry[] = [
    {
      templateId: template.templateId,
      title: template.title,
      targetSpace: template.targetSpace,
      prefilledPrompt: template.prefilledPrompt,
      status: template.status,
      usedAt: new Date().toISOString(),
    },
    ...readTemplateUsageHistory().filter((entry) => entry.templateId !== template.templateId),
  ].slice(0, 8);
  window.localStorage.setItem(templateUsageStorageKey, JSON.stringify(next));
  return next;
};
