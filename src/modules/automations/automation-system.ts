import type { DataState } from "@/lib/data-state";

export type AutomationStatus = "ready" | "beta" | "soon" | "blocked" | "draft";
export type AutomationRiskLevel = "low" | "medium" | "high";
export type AutomationRunStatus =
  | "idle"
  | "prepared"
  | "validation_required"
  | "approved"
  | "executed"
  | "blocked"
  | "failed";

export type AutomationTrigger =
  | "project_created"
  | "site_generated"
  | "site_improved"
  | "score_below_threshold"
  | "lead_created"
  | "form_submitted"
  | "agent_action_proposed"
  | "product_lab_recommendation_created"
  | "integration_connected"
  | "automation_manual_run"
  | "user_requested_action";

export type AutomationStep = {
  id: string;
  title: string;
  description: string;
  requiresValidation: boolean;
};

export type AutomationScenario = {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  condition: string;
  aiAnalysis: string;
  proposedAction: string;
  validationRequired: boolean;
  requiredTools: string[];
  status: AutomationStatus;
  riskLevel: AutomationRiskLevel;
  dataState: DataState;
  successRateLabel: string;
  lastRunLabel: string;
  tags: string[];
};

export type AutomationRunLog = {
  id: string;
  scenarioId: string;
  trigger: AutomationTrigger;
  status: AutomationRunStatus;
  result: string;
  riskLevel: AutomationRiskLevel;
  validationRequired: boolean;
  dataState: DataState;
  createdAt: string;
  error?: string;
};

export type PreparedAutomation = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  condition: string;
  aiAnalysis: string;
  proposedAction: string;
  validationRequired: boolean;
  riskLevel: AutomationRiskLevel;
  status: AutomationRunStatus;
  dataState: DataState;
  createdAt: string;
};

const nowId = (prefix: string) => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now().toString(36)}`;

export const automationTriggerLabels: Record<AutomationTrigger, string> = {
  project_created: "Projet créé",
  site_generated: "Site généré",
  site_improved: "Site amélioré",
  score_below_threshold: "Score sous seuil",
  lead_created: "Lead créé",
  form_submitted: "Formulaire rempli",
  agent_action_proposed: "Action agent proposée",
  product_lab_recommendation_created: "Recommandation admin créée",
  integration_connected: "Intégration connectée",
  automation_manual_run: "Lancement manuel",
  user_requested_action: "Demande utilisateur",
};

export const automationEngineSteps: AutomationStep[] = [
  {
    id: "trigger",
    title: "Déclencheur",
    description: "Un événement interne ou une demande utilisateur prépare le scénario.",
    requiresValidation: false,
  },
  {
    id: "condition",
    title: "Conditions",
    description: "Pixelrises vérifie si le scénario doit vraiment être proposé.",
    requiresValidation: false,
  },
  {
    id: "ai-analysis",
    title: "Analyse IA",
    description: "L'agent prépare une action concrète avec contexte, risque et impact.",
    requiresValidation: false,
  },
  {
    id: "human-validation",
    title: "Validation humaine",
    description: "Toute action sensible reste bloquée tant qu'elle n'est pas validée.",
    requiresValidation: true,
  },
  {
    id: "execution",
    title: "Exécution contrôlée",
    description: "L'action est exécutée uniquement si elle est interne, autorisée et tracée.",
    requiresValidation: true,
  },
];

export const automationScenarios: AutomationScenario[] = [
  {
    id: "seo-after-site-generated",
    name: "Amélioration SEO automatique",
    description: "Quand un site est généré, proposer une FAQ locale, title/meta et corrections H1/H2.",
    trigger: "site_generated",
    condition: "Le site a un score SEO inférieur à 85 ou manque de ville/FAQ.",
    aiAnalysis: "Analyse SEO locale, cohérence H1/H2, CTA et DataState des preuves.",
    proposedAction: "Préparer une amélioration SEO validable sans modifier le site automatiquement.",
    validationRequired: true,
    requiredTools: ["Site Builder", "Agent SEO"],
    status: "ready",
    riskLevel: "low",
    dataState: "example",
    successRateLabel: "Préparé",
    lastRunLabel: "Pas encore lancé",
    tags: ["SEO", "Site", "Validation"],
  },
  {
    id: "launch-checklist-project-created",
    name: "Checklist de lancement",
    description: "Créer une checklist claire quand un projet est créé.",
    trigger: "project_created",
    condition: "Le projet n'a pas encore de prochaines actions structurées.",
    aiAnalysis: "Détecte les étapes manquantes: offre, site, domaine, analytics, intégrations.",
    proposedAction: "Créer une liste de tâches interne, sans action externe.",
    validationRequired: false,
    requiredTools: ["Projects", "Business AI"],
    status: "ready",
    riskLevel: "low",
    dataState: "example",
    successRateLabel: "Préparé",
    lastRunLabel: "Pas encore lancé",
    tags: ["Projet", "Checklist", "Onboarding"],
  },
  {
    id: "lead-follow-up-draft",
    name: "Relance lead",
    description: "Préparer une relance quand un lead arrive, sans l'envoyer automatiquement.",
    trigger: "lead_created",
    condition: "Lead nouveau, aucune relance préparée et consentement requis.",
    aiAnalysis: "Analyse source du lead, projet concerné et ton adapté.",
    proposedAction: "Créer un brouillon de relance validable.",
    validationRequired: true,
    requiredTools: ["Agent Support", "Gmail bientôt", "CRM bientôt"],
    status: "beta",
    riskLevel: "medium",
    dataState: "example",
    successRateLabel: "Validation requise",
    lastRunLabel: "Pas encore lancé",
    tags: ["Lead", "Email", "Validation"],
  },
  {
    id: "conversion-score-low",
    name: "Amélioration conversion",
    description: "Quand le score conversion est faible, proposer un CTA plus précis et une preuve.",
    trigger: "score_below_threshold",
    condition: "Score conversion sous 75 ou CTA générique détecté.",
    aiAnalysis: "Vérifie CTA, objections, preuves, formulaire et cohérence de l'offre.",
    proposedAction: "Préparer une correction CTA + réassurance à valider.",
    validationRequired: true,
    requiredTools: ["Agent Conversion", "Site Builder"],
    status: "ready",
    riskLevel: "low",
    dataState: "example",
    successRateLabel: "Préparé",
    lastRunLabel: "Pas encore lancé",
    tags: ["Conversion", "CTA", "Site"],
  },
  {
    id: "project-follow-up",
    name: "Suivi projet",
    description: "Quand un projet reste incomplet, proposer la meilleure prochaine action.",
    trigger: "user_requested_action",
    condition: "Projet en brouillon ou incomplet depuis plusieurs jours.",
    aiAnalysis: "Classe les actions par impact: finaliser brief, sauvegarder, publier, connecter analytics.",
    proposedAction: "Créer une tâche interne priorisée.",
    validationRequired: false,
    requiredTools: ["Projects", "General AI"],
    status: "ready",
    riskLevel: "low",
    dataState: "example",
    successRateLabel: "Préparé",
    lastRunLabel: "Pas encore lancé",
    tags: ["Projet", "Next action", "Guided"],
  },
  {
    id: "creator-content-plan",
    name: "Optimisation contenu",
    description: "Quand Creator AI produit un plan, proposer script, hooks ou calendrier.",
    trigger: "agent_action_proposed",
    condition: "Action Creator AI liée à un contenu ou une campagne.",
    aiAnalysis: "Vérifie audience, plateforme, angle, promesse et garde-fou anti-viralités garanties.",
    proposedAction: "Préparer un script ou calendrier sans publication automatique.",
    validationRequired: true,
    requiredTools: ["Creator AI", "Agent Content"],
    status: "beta",
    riskLevel: "medium",
    dataState: "example",
    successRateLabel: "Préparé",
    lastRunLabel: "Pas encore lancé",
    tags: ["Creator", "Script", "Calendrier"],
  },
  {
    id: "analytics-drop-review",
    name: "Analyse analytics",
    description: "Quand les données montrent une baisse, proposer une action corrective.",
    trigger: "score_below_threshold",
    condition: "Donnée réelle disponible et baisse mesurable détectée.",
    aiAnalysis: "Compare visites, leads, clics CTA et pages touchées, sans inventer de chiffres.",
    proposedAction: "Préparer une recommandation actionnable.",
    validationRequired: false,
    requiredTools: ["Analytics", "Agent Analytics"],
    status: "beta",
    riskLevel: "low",
    dataState: "example",
    successRateLabel: "En attente données réelles",
    lastRunLabel: "Pas encore lancé",
    tags: ["Analytics", "DataState", "Recommandation"],
  },
  {
    id: "support-reply-draft",
    name: "Support client",
    description: "Préparer une réponse utile quand une demande client arrive.",
    trigger: "form_submitted",
    condition: "Message entrant, réponse non envoyée et validation requise.",
    aiAnalysis: "Analyse ton, urgence, contexte projet et propose une réponse courte.",
    proposedAction: "Créer un brouillon de réponse, jamais envoyé automatiquement.",
    validationRequired: true,
    requiredTools: ["Agent Support", "Gmail bientôt"],
    status: "beta",
    riskLevel: "medium",
    dataState: "example",
    successRateLabel: "Validation requise",
    lastRunLabel: "Pas encore lancé",
    tags: ["Support", "Brouillon", "Validation"],
  },
];

export const externalAutomationTriggers: AutomationTrigger[] = ["lead_created", "form_submitted", "integration_connected"];

export const isExternalAutomationAction = (scenario: Pick<AutomationScenario, "requiredTools" | "trigger">) =>
  externalAutomationTriggers.includes(scenario.trigger) ||
  scenario.requiredTools.some((tool) => /gmail|crm|slack|whatsapp|ads|stripe|hubspot/i.test(tool));

export const createPreparedAutomation = (scenario: AutomationScenario): PreparedAutomation => ({
  id: nowId("automation"),
  name: scenario.name,
  trigger: scenario.trigger,
  condition: scenario.condition,
  aiAnalysis: scenario.aiAnalysis,
  proposedAction: scenario.proposedAction,
  validationRequired: scenario.validationRequired || isExternalAutomationAction(scenario),
  riskLevel: scenario.riskLevel,
  status: scenario.validationRequired || isExternalAutomationAction(scenario) ? "validation_required" : "prepared",
  dataState: scenario.dataState,
  createdAt: new Date().toISOString(),
});

export const simulateAutomationRun = (scenario: AutomationScenario): AutomationRunLog => {
  const externalAction = isExternalAutomationAction(scenario);
  const validationRequired = scenario.validationRequired || externalAction;
  const blocked = scenario.riskLevel === "high" || (externalAction && !validationRequired);

  return {
    id: nowId("automation-run"),
    scenarioId: scenario.id,
    trigger: scenario.trigger,
    status: blocked ? "blocked" : validationRequired ? "validation_required" : "prepared",
    result: blocked
      ? "Action bloquée: scénario externe ou sensible sans validation explicite."
      : validationRequired
        ? "Action préparée. Validation humaine obligatoire avant exécution."
        : "Action interne préparée. Aucune exécution externe réalisée.",
    riskLevel: scenario.riskLevel,
    validationRequired,
    dataState: scenario.dataState,
    createdAt: new Date().toISOString(),
  };
};

export const approveAutomationRun = (run: AutomationRunLog): AutomationRunLog => ({
  ...run,
  status: run.riskLevel === "high" ? "blocked" : "approved",
  result:
    run.riskLevel === "high"
      ? "Validation refusée automatiquement: risque élevé."
      : "Validation enregistrée. Exécution réelle désactivée tant que l'intégration n'est pas prête.",
});

export const redactAutomationError = (message: string) =>
  message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email_redacted]")
    .replace(/(sk|pk|vck|ghp|supabase)[_\-A-Za-z0-9]{8,}/gi, "[secret_redacted]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone_redacted]");
