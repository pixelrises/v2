export type PublicAISpaceSlug =
  | "general-ai"
  | "business-ai"
  | "student-ai"
  | "creator-ai"
  | "management-ai"
  | "enterprise-ai";

export type PublicAISpace = {
  slug: PublicAISpaceSlug;
  title: string;
  eyebrow: string;
  angle: string;
  subtitle: string;
  objective: string;
  icon: "brain" | "briefcase" | "graduation" | "palette" | "kanban" | "building";
  reassurance: string[];
  useCases: Array<{ title: string; description: string }>;
  prompts: Array<{ label: string; prompt: string; outcome: string }>;
  modules: Array<{ title: string; description: string }>;
  benefits: Array<{ title: string; description: string }>;
  demoPreview: Array<{ label: string; value: string }>;
  workflow: Array<{ step: string; title: string; description: string }>;
  objections: Array<{ title: string; description: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export const publicAISpaces: PublicAISpace[] = [
  {
    slug: "general-ai",
    title: "General AI",
    eyebrow: "Clarification rapide",
    angle: "Clarifier, comprendre, résumer et décider plus vite.",
    subtitle:
      "Transformez une idée floue en réponse claire, plan structuré ou décision exploitable.",
    objective:
      "General AI sert de point d'entrée : il aide à comprendre vite, puis oriente vers l'espace spécialisé le plus logique.",
    icon: "brain",
    reassurance: ["Démo verrouillée", "Actions sensibles protégées", "Connexion requise pour utiliser"],
    useCases: [
      {
        title: "Comprendre un sujet",
        description: "Obtenir une explication simple, avec exemples, sans jargon inutile.",
      },
      {
        title: "Résumer un document",
        description: "Extraire les idées importantes et les prochaines actions possibles.",
      },
      {
        title: "Comparer des options",
        description: "Lister avantages, risques et recommandation la plus logique.",
      },
      {
        title: "Structurer une idée",
        description: "Transformer une note brouillon en plan clair et exploitable.",
      },
    ],
    prompts: [
      {
        label: "Résumé clair",
        prompt: "Résume ce document en 5 idées claires.",
        outcome: "Une synthèse courte et actionnable.",
      },
      {
        label: "Plan d'action",
        prompt: "Transforme cette idée floue en plan d'action.",
        outcome: "Des étapes simples dans le bon ordre.",
      },
      {
        label: "Explication simple",
        prompt: "Explique ce sujet simplement, avec un exemple.",
        outcome: "Une réponse lisible même sans expertise.",
      },
      {
        label: "Décision",
        prompt: "Compare ces options et recommande la plus logique.",
        outcome: "Une recommandation argumentée.",
      },
    ],
    modules: [
      {
        title: "Chat guidé",
        description: "Conversation cadrée pour clarifier sans partir dans tous les sens.",
      },
      {
        title: "Résumé",
        description: "Synthèse rapide de textes, notes ou documents.",
      },
      {
        title: "Comparaison",
        description: "Analyse simple des choix avec avantages, limites et risques.",
      },
    ],
    benefits: [
      {
        title: "Moins de confusion",
        description: "Vous partez d'une question brute et repartez avec une structure claire.",
      },
      {
        title: "Bon point d'entrée",
        description: "Idéal avant Business, Student, Creator, Management ou Enterprise AI.",
      },
      {
        title: "Réponse exploitable",
        description: "Le résultat vise une décision ou une prochaine action, pas seulement du texte.",
      },
    ],
    demoPreview: [
      { label: "Demande", value: "Explique ce sujet simplement." },
      { label: "Sortie", value: "Résumé + exemple + action suivante." },
      { label: "Statut", value: "Lecture seule publique." },
    ],
    workflow: [
      { step: "1", title: "Posez le contexte", description: "Ajoutez votre question, texte ou objectif." },
      { step: "2", title: "Clarifiez", description: "L'espace structure la demande avant de répondre." },
      { step: "3", title: "Décidez", description: "Vous obtenez une réponse exploitable ou une orientation." },
    ],
    objections: [
      {
        title: "Est-ce juste un chatbot ?",
        description: "Non, la logique est cadrée pour clarifier, orienter et préparer une action.",
      },
      {
        title: "Puis-je l'utiliser ici ?",
        description: "Non. Cette page montre l'expérience. L'usage réel demande une connexion.",
      },
    ],
    faq: [
      {
        question: "General AI remplace-t-il les autres espaces ?",
        answer:
          "Non. Il sert de point d'entrée polyvalent et peut orienter vers l'espace le plus adapté.",
      },
      {
        question: "Est-ce que cette page lance une IA ?",
        answer:
          "Non. Elle présente le fonctionnement en lecture seule. Les générations réelles sont protégées.",
      },
    ],
  },
  {
    slug: "business-ai",
    title: "Business AI",
    eyebrow: "Offre, stratégie et vente",
    angle: "Transformer une idée business en offre claire, stratégie et actions commerciales.",
    subtitle:
      "Passez d'une intuition à une offre vendable, avec message, objections, CTA et prochaines actions.",
    objective:
      "Business AI aide à cadrer ce qui rapporte : proposition de valeur, cible, acquisition, conversion et rentabilité.",
    icon: "briefcase",
    reassurance: ["Conversion-first", "Validation humaine", "Mode Plan disponible"],
    useCases: [
      {
        title: "Clarifier une offre",
        description: "Transformer une idée vague en promesse, cible, bénéfices et prix cohérent.",
      },
      {
        title: "Préparer une vente",
        description: "Structurer argumentaire, objections, réponses et prochaine action.",
      },
      {
        title: "Améliorer une page",
        description: "Renforcer sections, CTA, preuve, objections et logique de conversion.",
      },
      {
        title: "Trouver ses premiers clients",
        description: "Définir un plan simple pour créer du contact et tester l'offre.",
      },
    ],
    prompts: [
      {
        label: "Offre vendable",
        prompt: "Transforme mon idée en offre claire et vendable.",
        outcome: "Promesse, cible, bénéfices et prochaine action.",
      },
      {
        label: "Proposition commerciale",
        prompt: "Améliore cette proposition commerciale.",
        outcome: "Texte plus clair, plus crédible et plus orienté décision.",
      },
      {
        label: "Objections prospects",
        prompt: "Trouve les objections de mes prospects et réponds-y.",
        outcome: "Réponses rassurantes et utilisables dans le tunnel.",
      },
      {
        label: "Premiers clients",
        prompt: "Crée une stratégie simple pour obtenir mes premiers clients.",
        outcome: "Plan terrain priorisé, sans dispersion.",
      },
    ],
    modules: [
      {
        title: "Offre",
        description: "Promesse, cible, bénéfices, objections et CTA.",
      },
      {
        title: "Acquisition",
        description: "Plan simple pour trouver, contacter et convaincre les premiers prospects.",
      },
      {
        title: "Page de vente",
        description: "Structure orientée conversion pour site, landing ou proposition.",
      },
    ],
    benefits: [
      {
        title: "Message plus net",
        description: "L'utilisateur comprend mieux ce qu'il vend et pourquoi ça compte.",
      },
      {
        title: "Actions plus simples",
        description: "La stratégie devient une liste d'actions concrètes, pas un grand flou.",
      },
      {
        title: "Pensé rentabilité",
        description: "Chaque recommandation vise valeur, marge et conversion.",
      },
    ],
    demoPreview: [
      { label: "Brief", value: "Restaurant italien à Lyon." },
      { label: "Sortie", value: "Offre + CTA + objections." },
      { label: "Statut", value: "Connexion requise." },
    ],
    workflow: [
      { step: "1", title: "Décrivez l'activité", description: "Cible, offre, blocage et objectif commercial." },
      { step: "2", title: "Structurez l'offre", description: "Business AI organise le message et les priorités." },
      { step: "3", title: "Passez à l'action", description: "Vous récupérez un plan simple ou préparez le Site Builder." },
    ],
    objections: [
      {
        title: "Est-ce que ça vend automatiquement ?",
        description: "Non. L'espace prépare la stratégie. Les décisions et actions restent humaines.",
      },
      {
        title: "Est-ce utile avant un site ?",
        description: "Oui, c'est même idéal pour clarifier l'offre avant de générer une page.",
      },
    ],
    faq: [
      {
        question: "Business AI peut-il appliquer des actions automatiquement ?",
        answer:
          "Non. Il prépare et recommande. Les actions externes restent sous validation humaine.",
      },
      {
        question: "Peut-il aider à préparer un Site Builder ?",
        answer:
          "Oui. Il aide à clarifier le message, les sections, la cible et le CTA avant génération.",
      },
    ],
  },
  {
    slug: "student-ai",
    title: "Student AI",
    eyebrow: "Réviser sans se noyer",
    angle: "Apprendre plus vite avec des explications simples, fiches, quiz et plans de révision.",
    subtitle:
      "Comprenez vos cours, préparez vos oraux et révisez avec une méthode claire au lieu d'accumuler des pages.",
    objective:
      "Student AI aide à apprendre, mémoriser et s'entraîner. Il accompagne l'étudiant sans faire disparaître l'effort.",
    icon: "graduation",
    reassurance: ["Fiches claires", "Quiz d'entraînement", "Méthode conservée"],
    useCases: [
      {
        title: "Fiches de révision",
        description: "Transformer un cours long en points clés, définitions et exemples.",
      },
      {
        title: "Quiz corrigés",
        description: "S'entraîner avec questions, réponses et explications simples.",
      },
      {
        title: "Préparation orale",
        description: "Construire un plan clair, une intro et des transitions.",
      },
      {
        title: "Planning d'examen",
        description: "Répartir les révisions selon temps, priorité et difficulté.",
      },
    ],
    prompts: [
      {
        label: "Fiche claire",
        prompt: "Fais-moi une fiche de révision claire.",
        outcome: "Points clés, définitions et exemples.",
      },
      {
        label: "Niveau simple",
        prompt: "Explique cette notion niveau 3e.",
        outcome: "Explication courte, accessible et illustrée.",
      },
      {
        label: "Quiz",
        prompt: "Crée un quiz pour m'entraîner.",
        outcome: "Questions, réponses et corrections.",
      },
      {
        label: "Oral",
        prompt: "Prépare un plan d'oral simple et efficace.",
        outcome: "Structure claire et déroulé mémorisable.",
      },
    ],
    modules: [
      {
        title: "Fiches",
        description: "Cours synthétisés en points importants.",
      },
      {
        title: "Quiz",
        description: "Entraînement actif avec correction.",
      },
      {
        title: "Oral",
        description: "Plan, transitions, exemples et conclusion.",
      },
    ],
    benefits: [
      {
        title: "Moins de stress",
        description: "Le cours devient une méthode lisible, pas une pile de documents.",
      },
      {
        title: "Meilleure mémorisation",
        description: "Quiz, exemples et fiches aident à retenir activement.",
      },
      {
        title: "Accessible",
        description: "Les crédits peuvent servir à apprendre ou créer selon le plan.",
      },
    ],
    demoPreview: [
      { label: "Entrée", value: "Chapitre ou notion." },
      { label: "Sortie", value: "Fiche + quiz + planning." },
      { label: "Statut", value: "Aperçu public." },
    ],
    workflow: [
      { step: "1", title: "Ajoutez votre cours", description: "Collez une notion, un plan ou un extrait." },
      { step: "2", title: "Choisissez le format", description: "Fiche, quiz, oral, résumé ou planning." },
      { step: "3", title: "Révisez activement", description: "Utilisez le résultat pour comprendre et vous entraîner." },
    ],
    objections: [
      {
        title: "Est-ce que ça fait les devoirs ?",
        description: "Non. L'objectif est d'apprendre, comprendre et s'entraîner proprement.",
      },
      {
        title: "Est-ce trop compliqué ?",
        description: "Non. Les formats sont simples : fiche, quiz, explication, oral ou planning.",
      },
    ],
    faq: [
      {
        question: "Student AI remplace-t-il le travail personnel ?",
        answer:
          "Non. Il simplifie la méthode et aide à comprendre. L'étudiant garde la réflexion.",
      },
      {
        question: "Peut-on utiliser les crédits pour business et études ?",
        answer:
          "Oui, la logique produit prévoit des crédits utilisables dans plusieurs espaces selon les règles du plan.",
      },
    ],
  },
  {
    slug: "creator-ai",
    title: "Creator AI",
    eyebrow: "Hooks, scripts et contenu",
    angle: "Créer plus de contenu avec de meilleurs angles, scripts, hooks et idées.",
    subtitle:
      "Passez d'une idée brute à un contenu prêt à publier : hooks, scripts, posts, angles et calendrier.",
    objective:
      "Creator AI prépare la production de contenu en V2, sans promettre le Creator Studio complet prévu plus tard.",
    icon: "palette",
    reassurance: ["V3 préparée", "Publication non automatique", "Validation humaine"],
    useCases: [
      {
        title: "Hooks vidéo",
        description: "Trouver des ouvertures plus fortes pour capter l'attention.",
      },
      {
        title: "Scripts courts",
        description: "Transformer une idée en vidéo structurée, concise et utile.",
      },
      {
        title: "Calendrier contenu",
        description: "Organiser les sujets, formats et rythmes de publication.",
      },
      {
        title: "Amélioration de posts",
        description: "Rendre un texte plus clair, plus impactant et plus mémorable.",
      },
    ],
    prompts: [
      {
        label: "Hooks",
        prompt: "Trouve 10 hooks pour cette vidéo.",
        outcome: "Angles d'ouverture plus forts.",
      },
      {
        label: "Script",
        prompt: "Écris un script court qui retient l'attention.",
        outcome: "Plan vidéo fluide et direct.",
      },
      {
        label: "Calendrier",
        prompt: "Transforme cette idée en calendrier de contenu.",
        outcome: "Sujets, formats et rythme.",
      },
      {
        label: "Post",
        prompt: "Améliore ce post pour le rendre plus impactant.",
        outcome: "Texte plus clair et plus engageant.",
      },
    ],
    modules: [
      {
        title: "Hooks",
        description: "Accroches pour vidéos, posts et campagnes.",
      },
      {
        title: "Scripts",
        description: "Déroulés courts pour parler clairement.",
      },
      {
        title: "Calendrier",
        description: "Planification simple des contenus.",
      },
    ],
    benefits: [
      {
        title: "Plus d'idées utiles",
        description: "Pas seulement des titres : des angles exploitables.",
      },
      {
        title: "Production plus rapide",
        description: "Vous partez d'une structure prête à retravailler.",
      },
      {
        title: "V3 cadrée",
        description: "Creator Studio reste une évolution future, pas une promesse cachée.",
      },
    ],
    demoPreview: [
      { label: "Idée", value: "Sujet ou concept." },
      { label: "Sortie", value: "Hook + script + calendrier." },
      { label: "Statut", value: "Démo verrouillée." },
    ],
    workflow: [
      { step: "1", title: "Donnez l'idée", description: "Sujet, cible, ton ou plateforme." },
      { step: "2", title: "Choisissez l'angle", description: "Hook, script, post ou calendrier." },
      { step: "3", title: "Finalisez", description: "Vous gardez la validation avant publication." },
    ],
    objections: [
      {
        title: "Est-ce que ça publie tout seul ?",
        description: "Non. La page publique et la V2 gardent une logique de validation humaine.",
      },
      {
        title: "Est-ce la V3 complète ?",
        description: "Non. C'est une base V2 pour préparer le Creator Studio futur.",
      },
    ],
    faq: [
      {
        question: "Creator AI est-il le Creator Studio complet ?",
        answer:
          "Non. Il prépare les usages contenus. Le studio complet reste prévu pour une évolution V3.",
      },
      {
        question: "Peut-il publier automatiquement ?",
        answer:
          "Non. Aucune publication externe réelle n'est active depuis cette page.",
      },
    ],
  },
  {
    slug: "management-ai",
    title: "Management AI",
    eyebrow: "Priorités et exécution",
    angle: "Organiser les priorités, transformer le chaos en plan d'action et suivre les projets.",
    subtitle:
      "Transformez une liste confuse en roadmap, semaine organisée, suivi d'équipe ou plan de décision.",
    objective:
      "Management AI aide à garder le cap : priorités, responsabilités, risques, planning et validations.",
    icon: "kanban",
    reassurance: ["Mode Plan", "Aucune action externe", "Suivi clair"],
    useCases: [
      {
        title: "Prioriser",
        description: "Classer les tâches selon impact, urgence et dépendances.",
      },
      {
        title: "Créer une roadmap",
        description: "Transformer un objectif en étapes visibles et réalistes.",
      },
      {
        title: "Organiser la semaine",
        description: "Répartir le travail sans surcharge ni dispersion.",
      },
      {
        title: "Préparer un suivi",
        description: "Clarifier décisions, responsabilités et points de blocage.",
      },
    ],
    prompts: [
      {
        label: "Plan priorisé",
        prompt: "Transforme cette liste en plan d'action priorisé.",
        outcome: "Ordre clair et prochaines étapes.",
      },
      {
        label: "Roadmap",
        prompt: "Crée une roadmap simple pour ce projet.",
        outcome: "Étapes, timing et dépendances.",
      },
      {
        label: "Semaine",
        prompt: "Organise ma semaine selon mes priorités.",
        outcome: "Planning réaliste et focus.",
      },
      {
        label: "Suivi équipe",
        prompt: "Prépare un suivi clair pour mon équipe.",
        outcome: "Responsables, décisions et risques.",
      },
    ],
    modules: [
      {
        title: "Roadmap",
        description: "Étapes de projet et ordre d'exécution.",
      },
      {
        title: "Priorités",
        description: "Tri impact/urgence pour décider vite.",
      },
      {
        title: "Suivi",
        description: "Points clairs pour garder l'équipe alignée.",
      },
    ],
    benefits: [
      {
        title: "Moins de dispersion",
        description: "Chaque idée est reliée à une prochaine action.",
      },
      {
        title: "Vision plus nette",
        description: "Le projet devient lisible en étapes et risques.",
      },
      {
        title: "Contrôle humain",
        description: "Aucune tâche externe n'est assignée sans validation.",
      },
    ],
    demoPreview: [
      { label: "Objectif", value: "Finaliser une V2." },
      { label: "Sortie", value: "Roadmap + priorités + risques." },
      { label: "Statut", value: "Lecture seule." },
    ],
    workflow: [
      { step: "1", title: "Listez le chaos", description: "Idées, tâches, blocages ou objectifs." },
      { step: "2", title: "Priorisez", description: "L'espace classe ce qui compte vraiment." },
      { step: "3", title: "Suivez", description: "Vous obtenez un plan clair à appliquer." },
    ],
    objections: [
      {
        title: "Est-ce que ça assigne des tâches ?",
        description: "Non. Les actions réelles restent protégées et demandent validation.",
      },
      {
        title: "Est-ce utile en solo ?",
        description: "Oui. C'est pensé pour fondateur solo, petite équipe ou projet en croissance.",
      },
    ],
    faq: [
      {
        question: "Management AI peut-il déclencher des automatisations ?",
        answer:
          "Non depuis cette page. Il prépare l'organisation, mais les actions réelles restent verrouillées.",
      },
      {
        question: "Peut-il aider à prioriser Pixelrises ?",
        answer:
          "Oui. Il peut transformer une liste de modules en plan d'exécution réaliste.",
      },
    ],
  },
  {
    slug: "enterprise-ai",
    title: "Enterprise AI",
    eyebrow: "Process et workflows",
    angle: "Structurer des process, workflows et usages IA avancés avec contrôle humain.",
    subtitle:
      "Préparez documentation, support, process internes et workflows sans ouvrir d'action sensible publiquement.",
    objective:
      "Enterprise AI sert à structurer les usages avancés pour équipes, avec statuts honnêtes, validations et garde-fous.",
    icon: "building",
    reassurance: ["Process cadrés", "Validation humaine", "Intégrations à configurer"],
    useCases: [
      {
        title: "Structurer un process",
        description: "Rendre lisible une procédure interne avec étapes et responsabilités.",
      },
      {
        title: "Préparer le support",
        description: "Créer une base de réponses, règles et escalades.",
      },
      {
        title: "Cadrer un workflow",
        description: "Définir déclencheurs, validations et limites avant automatisation.",
      },
      {
        title: "Documenter une équipe",
        description: "Transformer des habitudes en documentation claire.",
      },
    ],
    prompts: [
      {
        label: "Process",
        prompt: "Structure ce processus interne.",
        outcome: "Étapes, rôles, risques et validations.",
      },
      {
        label: "Support",
        prompt: "Crée une base de support client.",
        outcome: "Catégories, réponses et escalades.",
      },
      {
        label: "Validation",
        prompt: "Liste les validations nécessaires avant automatisation.",
        outcome: "Garde-fous et points de contrôle.",
      },
      {
        label: "Workflow",
        prompt: "Prépare un workflow clair avec étapes et responsabilités.",
        outcome: "Plan exploitable sans action automatique.",
      },
    ],
    modules: [
      {
        title: "Process",
        description: "Documentation opérationnelle claire.",
      },
      {
        title: "Support",
        description: "Base de connaissances et règles d'escalade.",
      },
      {
        title: "Workflow",
        description: "Étapes, responsabilités et validations.",
      },
    ],
    benefits: [
      {
        title: "Plus de contrôle",
        description: "Les usages avancés restent cadrés avant toute automatisation.",
      },
      {
        title: "Process lisibles",
        description: "L'équipe comprend quoi faire, quand et pourquoi.",
      },
      {
        title: "Statuts honnêtes",
        description: "Les intégrations non prouvées restent à configurer.",
      },
    ],
    demoPreview: [
      { label: "Entrée", value: "Process client ou équipe." },
      { label: "Sortie", value: "Workflow + validations." },
      { label: "Statut", value: "Connexion requise." },
    ],
    workflow: [
      { step: "1", title: "Décrivez le process", description: "Objectif, équipe, outils et contraintes." },
      { step: "2", title: "Ajoutez les garde-fous", description: "Validations, risques et limites humaines." },
      { step: "3", title: "Préparez l'exécution", description: "Le workflow devient clair avant toute intégration réelle." },
    ],
    objections: [
      {
        title: "Les intégrations sont-elles live ?",
        description: "Non. Tout ce qui n'est pas prouvé reste à configurer ou verrouillé.",
      },
      {
        title: "Est-ce public ?",
        description: "La présentation est publique, mais les données et usages réels restent protégés.",
      },
    ],
    faq: [
      {
        question: "Enterprise AI donne-t-il accès aux données privées ?",
        answer:
          "Non. Cette page est publique et ne lit aucune donnée privée.",
      },
      {
        question: "Peut-il automatiser des workflows sans validation ?",
        answer:
          "Non. La logique Pixelrises impose des garde-fous et une validation humaine pour les actions sensibles.",
      },
    ],
  },
];

export const publicAISpaceSlugs = publicAISpaces.map((space) => space.slug);

export const getPublicAISpace = (slug?: string) =>
  publicAISpaces.find((space) => space.slug === slug);
