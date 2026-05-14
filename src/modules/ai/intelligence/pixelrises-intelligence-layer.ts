import type { AIProjectType, AITaskType } from "@/modules/ai/schemas/ai-task.schema";
import { redactPersonalDataForAI } from "@/modules/ai/security/redactSecrets";

export type PixelrisesAIRole =
  | "strategy"
  | "structure"
  | "copywriting"
  | "design"
  | "seo"
  | "images"
  | "code"
  | "quality"
  | "fallback";

export type PixelrisesAssumption = {
  id: string;
  text: string;
  reason: string;
  confidence: "low" | "medium" | "high";
  user_can_edit: true;
};

export type PixelrisesAITask = {
  id: string;
  role: PixelrisesAIRole;
  taskType: AITaskType;
  goal: string;
  qualityFocus: string[];
  risk: "low" | "medium" | "high";
};

export type PixelrisesEnrichedBrief = {
  project_type: AIProjectType;
  user_request_summary: string;
  sanitized_user_request: string;
  business_context: string;
  target: string;
  objective: string;
  niche: string;
  city: string;
  tone: string;
  tier: string;
  design_direction: string;
  conversion_strategy: string;
  seo_strategy: string;
  public_offer: string;
  required_sections: string[];
  assumptions: PixelrisesAssumption[];
  forbidden_claims: string[];
  quality_criteria: string[];
  data_safety_rules: string[];
};

export type PixelrisesIntelligenceResult = {
  enrichedBrief: PixelrisesEnrichedBrief;
  aiTasks: PixelrisesAITask[];
  enrichedPrompt: string;
  publicContext: Record<string, unknown>;
};

type IntelligenceInput = {
  rawUserRequest: string;
  projectType?: AIProjectType;
  context?: Record<string, unknown>;
};

const asText = (value: unknown, fallback = "") => (typeof value === "string" && value.trim() ? value.trim() : fallback);

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const compact = (value: string, max = 260) => {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
};

const cityCandidates = [
  "Paris",
  "Lyon",
  "Marseille",
  "Lille",
  "Bordeaux",
  "Toulouse",
  "Nice",
  "Nantes",
  "Strasbourg",
  "Montpellier",
  "Rennes",
  "France",
];

const nicheRules: Array<{ key: string; label: string; sections: string[]; cta: string; design: string }> = [
  {
    key: "restaurant|bistrot|brasserie|menu|pizzeria|sushi|bar a vin",
    label: "restaurant",
    sections: ["Hero réservation", "Menu signature", "Ambiance", "Horaires et localisation", "FAQ réservation", "CTA final"],
    cta: "Réserver une table",
    design: "chaleureux, sensoriel, premium local",
  },
  {
    key: "coach|coaching|sport|fitness|mentor|formation",
    label: "coaching",
    sections: ["Hero transformation", "Méthode", "Programmes", "Preuves", "FAQ bilan", "CTA rendez-vous"],
    cta: "Planifier un bilan",
    design: "motivant, humain, premium, orienté transformation",
  },
  {
    key: "garage|auto|voiture|vehicule|location|rental",
    label: "automobile",
    sections: ["Hero disponibilité", "Services ou flotte", "Garanties", "Process réservation", "Contact rapide"],
    cta: "Vérifier les disponibilités",
    design: "fiable, mobile-first, net, premium pratique",
  },
  {
    key: "immobilier|agence immobiliere|bien|estimation",
    label: "immobilier",
    sections: ["Hero estimation", "Biens ou services", "Méthode", "Confiance locale", "Contact estimation"],
    cta: "Demander une estimation",
    design: "sobre, local premium, rassurant",
  },
  {
    key: "barber|coiffeur|salon|beaute|spa|bien-etre",
    label: "beauté / salon",
    sections: ["Hero réservation", "Prestations", "Galerie", "Avis exemples", "Horaires", "CTA réservation"],
    cta: "Réserver un créneau",
    design: "élégant, visuel, luxe accessible",
  },
  {
    key: "artisan|plombier|electricien|renovation|devis",
    label: "artisan / service local",
    sections: ["Hero devis", "Services", "Zone d'intervention", "Garanties", "Urgences si pertinent", "CTA devis"],
    cta: "Demander un devis",
    design: "local premium, clair, confiance immédiate",
  },
  {
    key: "e-commerce|boutique|produit|achat|commande",
    label: "e-commerce léger",
    sections: ["Hero produit", "Bénéfices", "Preuves", "Garanties", "FAQ achat", "CTA achat"],
    cta: "Acheter maintenant",
    design: "premium produit, preuve visuelle, conversion directe",
  },
];

const findNicheRule = (text: string) => {
  const normalized = normalize(text);
  return nicheRules.find((rule) => new RegExp(rule.key).test(normalized));
};

const inferObjective = (text: string, fallback: string) => {
  const normalized = normalize(text);
  if (/(reservation|reserver|rdv|rendez-vous|booking)/.test(normalized)) return "générer des réservations";
  if (/(devis|lead|prospect|contact|demande)/.test(normalized)) return "générer des demandes qualifiées";
  if (/(vente|vendre|achat|acheter|commande|checkout)/.test(normalized)) return "vendre";
  if (/(credibilite|rassurer|confiance|portfolio)/.test(normalized)) return "renforcer la crédibilité";
  if (/(audit|diagnostic|appel)/.test(normalized)) return "obtenir des appels qualifiés";
  return fallback || "transformer une idée en projet digital concret";
};

const inferCity = (text: string, fallback: string) => {
  const normalized = normalize(text);
  const found = cityCandidates.find((city) => normalized.includes(normalize(city)));
  return found ?? fallback ?? "France";
};

const inferStyle = (text: string, fallback: string) => {
  const normalized = normalize(text);
  if (normalized.includes("minimal")) return "minimal premium";
  if (normalized.includes("luxe")) return "luxe sobre";
  if (normalized.includes("corporate")) return "corporate premium";
  if (normalized.includes("audacieux")) return "audacieux";
  if (normalized.includes("startup")) return "startup moderne";
  if (normalized.includes("premium")) return "dark gold premium";
  return fallback || "dark gold premium";
};

const siteTasks: PixelrisesAITask[] = [
  {
    id: "site-strategy",
    role: "strategy",
    taskType: "strategy_analysis",
    goal: "Clarifier promesse, cible, objection principale et stratégie de conversion.",
    qualityFocus: ["business-first", "promesse claire", "pas de fausse preuve"],
    risk: "medium",
  },
  {
    id: "site-structure",
    role: "structure",
    taskType: "site_structure",
    goal: "Construire le parcours de page et l'ordre des sections selon la niche.",
    qualityFocus: ["hiérarchie", "parcours client", "CTA cohérent"],
    risk: "low",
  },
  {
    id: "site-copywriting",
    role: "copywriting",
    taskType: "site_copywriting",
    goal: "Écrire titres, textes courts, FAQ et CTA concrets sans phrases génériques.",
    qualityFocus: ["clarté", "conversion", "anti-générique"],
    risk: "medium",
  },
  {
    id: "site-design",
    role: "design",
    taskType: "site_design",
    goal: "Définir direction artistique, layouts, spacing et variation visuelle.",
    qualityFocus: ["premium", "responsive", "variation par niche"],
    risk: "low",
  },
  {
    id: "site-seo",
    role: "seo",
    taskType: "site_seo",
    goal: "Préparer title, meta, H1/H2, FAQ et SEO local si une ville est fournie.",
    qualityFocus: ["SEO local", "mots-clés honnêtes", "pas de zone inventée"],
    risk: "low",
  },
  {
    id: "site-images",
    role: "images",
    taskType: "site_design",
    goal: "Proposer images, prompts visuels, alt text et placeholders cohérents par niche.",
    qualityFocus: ["cohérence visuelle", "alt text", "statut placeholder clair"],
    risk: "low",
  },
  {
    id: "site-quality",
    role: "quality",
    taskType: "quality_gate",
    goal: "Critiquer la sortie, détecter générique, fausses preuves, CTA faibles et incohérences.",
    qualityFocus: ["anti-générique", "sécurité", "readiness"],
    risk: "high",
  },
];

const defaultTasks: PixelrisesAITask[] = [
  {
    id: "pixelrises-brief",
    role: "strategy",
    taskType: "brief_analysis",
    goal: "Comprendre la demande et enrichir le contexte Pixelrises avant génération.",
    qualityFocus: ["intention", "sécurité", "prochaine action"],
    risk: "low",
  },
  {
    id: "pixelrises-quality",
    role: "quality",
    taskType: "quality_gate",
    goal: "Vérifier que la réponse reste utile, actionnable, sûre et honnête.",
    qualityFocus: ["données honnêtes", "pas d'action sensible", "clarté"],
    risk: "medium",
  },
];

export const createPixelrisesIntelligenceLayer = ({
  rawUserRequest,
  projectType = "site",
  context = {},
}: IntelligenceInput): PixelrisesIntelligenceResult => {
  const sanitizedRequest = redactPersonalDataForAI(rawUserRequest || "Créer un projet digital Pixelrises.");
  const contextText = [sanitizedRequest, Object.values(context).filter((value) => typeof value === "string").join(" ")].join(" ");
  const nicheRule = findNicheRule(contextText);

  const businessName = asText(context.businessName, "Projet Pixelrises");
  const niche = asText(context.niche, nicheRule?.label ?? "projet digital");
  const city = inferCity(contextText, asText(context.city, "France"));
  const objective = inferObjective(contextText, asText(context.goal, ""));
  const target = asText(context.targetAudience, "utilisateurs ou clients à préciser");
  const tier = asText(context.tier, "premium");
  const tone = asText(context.tone, tier.includes("premium") ? "clair, crédible, business-first" : "simple, utile, direct");
  const designDirection = nicheRule?.design ?? inferStyle(contextText, asText(context.style, "dark gold premium"));
  const publicOffer = compact(asText(context.offer, sanitizedRequest), 220);
  const requiredSections =
    projectType === "site"
      ? nicheRule?.sections ?? ["Hero spécifique", "Offre", "Preuves", "Process", "FAQ", "CTA final"]
      : ["Contexte", "Actions principales", "Garde-fous", "Prochaine étape"];

  const assumptions: PixelrisesAssumption[] = [
    !asText(context.targetAudience)
      ? {
          id: "target-assumption",
          text: "La cible exacte n'est pas encore confirmée.",
          reason: "Le brief ne donne pas de persona précis.",
          confidence: "medium",
          user_can_edit: true,
        }
      : null,
    !asText(context.city) && city !== "France"
      ? {
          id: "city-detected",
          text: `La ville ${city} a été détectée dans la demande.`,
          reason: "Le SEO local peut être renforcé si cette ville est correcte.",
          confidence: "high",
          user_can_edit: true,
        }
      : null,
    !nicheRule
      ? {
          id: "niche-assumption",
          text: "La structure de page utilise un blueprint business général.",
          reason: "La niche exacte n'a pas été reconnue avec assez de confiance.",
          confidence: "medium",
          user_can_edit: true,
        }
      : null,
  ].filter(Boolean) as PixelrisesAssumption[];

  const enrichedBrief: PixelrisesEnrichedBrief = {
    project_type: projectType,
    user_request_summary: compact(sanitizedRequest, 180),
    sanitized_user_request: sanitizedRequest,
    business_context: `${businessName} - ${niche}`,
    target,
    objective,
    niche,
    city,
    tone,
    tier,
    design_direction: designDirection,
    conversion_strategy: `CTA principal orienté ${objective}. Les sections doivent lever les objections avant l'action.`,
    seo_strategy:
      city && city !== "France"
        ? `SEO local autour de ${niche} à ${city}, sans inventer de quartier ou de preuve non fournie.`
        : `SEO clair autour de ${niche}, sans prétendre à une présence locale non fournie.`,
    public_offer: publicOffer,
    required_sections: requiredSections,
    assumptions,
    forbidden_claims: [
      "revenus garantis",
      "résultats impossibles à vérifier",
      "faux avis réels",
      "fausses statistiques",
      "certifications non fournies",
      "données personnelles inutiles",
    ],
    quality_criteria: [
      "Chaque section sert l'objectif principal.",
      "Le CTA est concret et cohérent avec la niche.",
      "Les preuves sont fournies, marquées comme exemples ou remplacées par de la réassurance honnête.",
      "Le style demandé est respecté.",
      "La ville et la cible sont utilisées si fournies.",
      "Le résultat évite les phrases génériques et les templates interchangeables.",
    ],
    data_safety_rules: [
      "Ne jamais envoyer de secret, token, clé API, mot de passe ou paiement aux providers IA.",
      "Redacter emails et téléphones avant logs ou providers si non nécessaires.",
      "Ne pas afficher les prompts internes à l'utilisateur.",
      "Aucune publication, intégration ou action externe sans validation humaine.",
    ],
  };

  const aiTasks = projectType === "site" ? siteTasks : defaultTasks;
  const publicContext = {
    projectType,
    businessName,
    niche,
    city,
    objective,
    target,
    designDirection,
    requiredSections,
    assumptions,
    aiRoles: aiTasks.map((task) => task.role),
  };

  const enrichedPrompt = [
    "PIXELRISES INTELLIGENCE LAYER",
    "N'envoie jamais la demande brute seule. Utilise le brief enrichi, les garde-fous et les critères qualité ci-dessous.",
    "",
    `Demande utilisateur redacted: ${sanitizedRequest}`,
    "",
    "Brief enrichi:",
    JSON.stringify(enrichedBrief, null, 2),
    "",
    "Sous-tâches IA à router:",
    JSON.stringify(aiTasks, null, 2),
    "",
    "Règles de sortie:",
    "- Produire un résultat concret, exploitable, business-first et conversion-first.",
    "- Marquer les hypothèses comme hypothèses.",
    "- Ne pas inventer de preuve, avis, revenu, statistique, intégration ou donnée réelle.",
    "- Ne pas inclure de prompt système, clé, token, erreur technique brute ou détail fournisseur dans la sortie utilisateur.",
  ].join("\n");

  return {
    enrichedBrief,
    aiTasks,
    enrichedPrompt,
    publicContext,
  };
};

export const buildSiteBuilderPublicOffer = (result: PixelrisesIntelligenceResult) => result.enrichedBrief.public_offer;
