import type { DataState } from "@/lib/data-state";
import type { CustomAgentProject } from "@/modules/creation-engine";

export type AgentPermissionKey =
  | "read_project"
  | "edit_project_after_validation"
  | "suggest_site_improvement"
  | "suggest_seo"
  | "suggest_copywriting"
  | "suggest_automation"
  | "suggest_email"
  | "draft_message"
  | "read_analytics"
  | "read_integrations_status"
  | "create_task"
  | "create_agent_note"
  | "trigger_internal_action_after_validation"
  | "trigger_external_action_after_validation";

export type AgentAutonomyLevel =
  | "advice_only"
  | "proposals_validated"
  | "internal_actions_validated"
  | "external_actions_validated";

export type AgentRiskLevel = "low" | "medium" | "high";
export type AgentOperationalStatus = "ready" | "beta" | "soon" | "disabled";

export type AgentActionStatus =
  | "draft"
  | "proposed"
  | "approved"
  | "rejected"
  | "executed"
  | "failed"
  | "cancelled"
  | "blocked"
  | "requires_external_connection";

export type AgentActionType =
  | "site_improvement"
  | "seo_recommendation"
  | "conversion_recommendation"
  | "draft_message"
  | "create_task"
  | "automation_proposal"
  | "content_plan"
  | "game_blueprint"
  | "learning_plan"
  | "analytics_review";

export type AgentPermissionDefinition = {
  key: AgentPermissionKey;
  label: string;
  description: string;
  requiresValidation: boolean;
};

export type OfficialAgentBlueprint = {
  id: string;
  name: string;
  role: string;
  mission: string;
  useCases: string[];
  systemPrompt: string;
  permissions: AgentPermissionKey[];
  forbiddenActions: string[];
  availableActions: AgentActionType[];
  tools: string[];
  status: AgentOperationalStatus;
  dataState: DataState;
  riskLevel: AgentRiskLevel;
  costEstimate: string;
  recommendedTestPrompt: string;
};

export type ValidatableAgentAction = {
  id: string;
  agentId: string;
  projectId?: string;
  title: string;
  description: string;
  actionType: AgentActionType;
  targetModule: string;
  riskLevel: AgentRiskLevel;
  requiresConfirmation: boolean;
  status: AgentActionStatus;
  proposedPayload: Record<string, unknown>;
  dataState: DataState;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  result?: string;
  error?: string;
};

export type AgentTestResult = {
  id: string;
  agentId: string;
  prompt: string;
  response: string;
  proposedAction: ValidatableAgentAction;
  safetyNotes: string[];
  dataState: DataState;
  createdAt: string;
};

const nowId = (prefix: string) => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now().toString(36)}`;

export const agentPermissionCatalog: AgentPermissionDefinition[] = [
  {
    key: "read_project",
    label: "Lire le projet",
    description: "Acceder au brief, au statut et aux donnees utiles du projet courant.",
    requiresValidation: false,
  },
  {
    key: "edit_project_after_validation",
    label: "Modifier apres validation",
    description: "Preparer une modification interne, appliquee uniquement apres accord utilisateur.",
    requiresValidation: true,
  },
  {
    key: "suggest_site_improvement",
    label: "Proposer amelioration site",
    description: "Identifier une correction utile sur structure, UX, CTA, SEO ou design.",
    requiresValidation: false,
  },
  {
    key: "suggest_seo",
    label: "Proposer SEO",
    description: "Creer title, FAQ, H1/H2 et recommandations locales.",
    requiresValidation: false,
  },
  {
    key: "suggest_copywriting",
    label: "Proposer copywriting",
    description: "Reecrire les textes pour plus de clarte, preuve et conversion.",
    requiresValidation: false,
  },
  {
    key: "suggest_automation",
    label: "Proposer automatisation",
    description: "Preparer un scenario controle avec validation humaine.",
    requiresValidation: false,
  },
  {
    key: "suggest_email",
    label: "Preparer email",
    description: "Rediger un brouillon sans l'envoyer automatiquement.",
    requiresValidation: true,
  },
  {
    key: "draft_message",
    label: "Rediger message",
    description: "Creer un message de support, relance ou reponse client.",
    requiresValidation: true,
  },
  {
    key: "read_analytics",
    label: "Lire analytics",
    description: "Analyser les metriques disponibles sans inventer de chiffres.",
    requiresValidation: false,
  },
  {
    key: "read_integrations_status",
    label: "Lire integrations",
    description: "Verifier les integrations connectees, a configurer ou indisponibles.",
    requiresValidation: false,
  },
  {
    key: "create_task",
    label: "Creer tache",
    description: "Preparer une tache interne actionnable.",
    requiresValidation: false,
  },
  {
    key: "create_agent_note",
    label: "Creer note agent",
    description: "Sauvegarder une note de travail non sensible.",
    requiresValidation: false,
  },
  {
    key: "trigger_internal_action_after_validation",
    label: "Action interne validee",
    description: "Executer une action Pixelrises interne apres validation explicite.",
    requiresValidation: true,
  },
  {
    key: "trigger_external_action_after_validation",
    label: "Action externe validee",
    description: "Preparer une action externe; execution seulement avec consentement explicite.",
    requiresValidation: true,
  },
];

export const forbiddenAgentCapabilities = [
  "send_email_without_validation",
  "publish_site_without_validation",
  "modify_credits",
  "modify_payment",
  "access_private_conversations",
  "access_other_user_data",
  "delete_project_without_confirmation",
  "connect_external_tool_without_consent",
  "call_external_api_without_permission",
  "launch_ads",
  "prospect_automatically",
  "read_files_without_upload_or_consent",
];

export const autonomyLevels: Array<{
  id: AgentAutonomyLevel;
  label: string;
  description: string;
}> = [
  {
    id: "advice_only",
    label: "Conseil uniquement",
    description: "L'agent repond et propose, sans modifier.",
  },
  {
    id: "proposals_validated",
    label: "Propositions validables",
    description: "L'agent prepare des actions, l'utilisateur valide.",
  },
  {
    id: "internal_actions_validated",
    label: "Actions internes validees",
    description: "L'agent peut preparer une modification Pixelrises apres validation.",
  },
  {
    id: "external_actions_validated",
    label: "Actions externes validees",
    description: "L'agent prepare une action externe, jamais executee sans accord explicite.",
  },
];

export const officialAgentBlueprints: OfficialAgentBlueprint[] = [
  {
    id: "builder",
    name: "Agent Builder",
    role: "Creation complete",
    mission: "Transformer un brief en premiere version de projet claire, testable et prete a iterer.",
    useCases: ["Premier projet", "Structure de page", "Plan de prototype"],
    systemPrompt: "Agent de creation Pixelrises: structure, priorise, propose et garde les actions sensibles validables.",
    permissions: ["read_project", "suggest_site_improvement", "suggest_copywriting", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["site_improvement", "conversion_recommendation", "create_task"],
    tools: ["Agent Studio", "Site Builder", "Projects"],
    status: "ready",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Moyen selon le niveau de detail genere.",
    recommendedTestPrompt: "Cree la structure d'une landing premium pour un service local.",
  },
  {
    id: "business",
    name: "Agent Business",
    role: "Strategie et positionnement",
    mission: "Clarifier l'offre, prioriser les actions et transformer une idee en plan business concret.",
    useCases: ["Structurer une offre", "Preparer un plan de lancement", "Trouver la prochaine action"],
    systemPrompt: "Business-first, clair, concret, sans promesse de revenu garanti.",
    permissions: ["read_project", "suggest_site_improvement", "suggest_copywriting", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["site_improvement", "conversion_recommendation", "create_task"],
    tools: ["Business AI", "Site Builder", "Projects"],
    status: "ready",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible a moyen selon le contexte analyse.",
    recommendedTestPrompt: "Clarifie mon offre et propose 3 actions pour obtenir plus de leads.",
  },
  {
    id: "seo",
    name: "Agent SEO",
    role: "SEO local et contenu",
    mission: "Proposer des corrections SEO concretes: title, meta, H1/H2, FAQ et signaux locaux.",
    useCases: ["SEO local", "FAQ utile", "Meta title/description"],
    systemPrompt: "SEO actionnable, local si ville fournie, aucune fausse source.",
    permissions: ["read_project", "suggest_site_improvement", "suggest_seo", "create_task"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["seo_recommendation", "site_improvement"],
    tools: ["Site Builder", "Analytics", "Search Console bientot"],
    status: "ready",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Ameliore le SEO de mon site de coach sportif a Lyon.",
  },
  {
    id: "conversion",
    name: "Agent Conversion",
    role: "CTA, preuves et tunnel",
    mission: "Identifier les freins de conversion et proposer des changements validables.",
    useCases: ["CTA principal", "Objections", "Preuves sociales"],
    systemPrompt: "Conversion-first, sans dark pattern, avec impact business clair.",
    permissions: ["read_project", "suggest_site_improvement", "suggest_copywriting", "read_analytics", "create_task"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["conversion_recommendation", "site_improvement"],
    tools: ["Site Builder", "Analytics"],
    status: "ready",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Trouve les freins qui bloquent les demandes de contact sur mon site.",
  },
  {
    id: "design",
    name: "Agent Design",
    role: "Direction visuelle",
    mission: "Rendre les interfaces plus premium, lisibles et coherentes sans casser l'UX.",
    useCases: ["Ameliorer une section", "Harmoniser spacing", "Rendre plus premium"],
    systemPrompt: "Design utile, premium, responsive, pas de decoration gratuite.",
    permissions: ["read_project", "suggest_site_improvement", "create_task"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["site_improvement"],
    tools: ["Site Builder", "Templates"],
    status: "ready",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Rends ma landing plus premium sans changer toute la structure.",
  },
  {
    id: "copywriting",
    name: "Agent Copywriting",
    role: "Clarite et persuasion",
    mission: "Reecrire les textes pour renforcer la comprehension, la credibilite et la conversion.",
    useCases: ["Hero", "CTA", "Objections", "Preuves"],
    systemPrompt: "Copywriting clair, credible, oriente action, sans promesse mensongere.",
    permissions: ["read_project", "suggest_copywriting", "suggest_site_improvement", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["conversion_recommendation", "site_improvement", "content_plan"],
    tools: ["Site Builder", "Business AI", "Templates"],
    status: "ready",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Ameliore mon hero et mon CTA pour donner plus envie de reserver.",
  },
  {
    id: "support",
    name: "Agent Support",
    role: "Support client",
    mission: "Preparer des reponses utiles, calmes et validables pour clients/prospects.",
    useCases: ["Reponse client", "FAQ support", "Brouillon de relance"],
    systemPrompt: "Empathique, clair, jamais d'envoi sans validation.",
    permissions: ["read_project", "draft_message", "suggest_email", "create_task"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["draft_message", "create_task"],
    tools: ["General AI", "Gmail bientot", "CRM bientot"],
    status: "beta",
    dataState: "example",
    riskLevel: "medium",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Prepare une reponse a un client mecontent, sans l'envoyer.",
  },
  {
    id: "analytics",
    name: "Agent Analytics",
    role: "Analyse performance",
    mission: "Lire les metriques disponibles, detecter les baisses et proposer une action suivante.",
    useCases: ["Baisse conversion", "Suivi leads", "Priorites analytics"],
    systemPrompt: "Data-first, aucune conclusion si la donnee est exemple ou manquante.",
    permissions: ["read_project", "read_analytics", "read_integrations_status", "create_task"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["analytics_review", "create_task"],
    tools: ["Analytics", "Integrations"],
    status: "beta",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Analyse mes conversions et propose la prochaine action prioritaire.",
  },
  {
    id: "automation",
    name: "Agent Automatisation",
    role: "Workflows controles",
    mission: "Preparer des scenarios trigger -> analyse IA -> validation -> action.",
    useCases: ["Relance lead", "Checklist lancement", "Tache projet"],
    systemPrompt: "Automatisation sous controle, aucune action externe sans validation.",
    permissions: ["read_project", "suggest_automation", "read_integrations_status", "trigger_internal_action_after_validation"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["automation_proposal", "create_task"],
    tools: ["Automations", "Integrations"],
    status: "beta",
    dataState: "example",
    riskLevel: "medium",
    costEstimate: "Moyen si analyse multi-etapes.",
    recommendedTestPrompt: "Prepare une relance client apres formulaire rempli, sans l'envoyer.",
  },
  {
    id: "content",
    name: "Agent Content",
    role: "Creation de contenu",
    mission: "Transformer une idee en hooks, scripts et calendrier de contenu.",
    useCases: ["Script TikTok", "Hooks", "Calendrier editorial"],
    systemPrompt: "Creatif et utile, pas de promesse de viralite.",
    permissions: ["read_project", "suggest_copywriting", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["content_plan", "draft_message"],
    tools: ["Creator AI", "Templates"],
    status: "beta",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Cree 5 idees de videos pour presenter mon offre.",
  },
  {
    id: "improve",
    name: "Agent Improve",
    role: "Amelioration ciblee",
    mission: "Ameliorer une section precise sans tout regenerer ni casser la structure existante.",
    useCases: ["FAQ", "Hero", "CTA", "Section preuve"],
    systemPrompt: "Ameliorations courtes, ciblees, mesurables et faciles a valider.",
    permissions: ["read_project", "suggest_site_improvement", "suggest_copywriting", "create_task"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["site_improvement", "conversion_recommendation"],
    tools: ["Site Builder", "Agent Studio"],
    status: "ready",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Ameliore uniquement la section FAQ de mon site sans toucher au reste.",
  },
  {
    id: "student",
    name: "Agent Student",
    role: "Apprentissage",
    mission: "Aider a comprendre, reviser et s'entrainer sans faire le travail a la place.",
    useCases: ["Fiche de revision", "Quiz", "Planning"],
    systemPrompt: "Pedagogique, guide pas a pas, pas de triche.",
    permissions: ["create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["learning_plan", "create_task"],
    tools: ["Student AI"],
    status: "beta",
    dataState: "example",
    riskLevel: "low",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Aide-moi a reviser ce cours sans faire le devoir a ma place.",
  },
  {
    id: "game-design",
    name: "Agent Game Design",
    role: "Concept et gameplay",
    mission: "Preparer gameplay loop, progression, scripts/snippets et checklist de test manuel.",
    useCases: ["Roblox", "Web game", "Gameplay loop"],
    systemPrompt: "Game design concret, fun, testable, aucune publication automatique.",
    permissions: ["read_project", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["game_blueprint", "create_task"],
    tools: ["Game Builder", "Templates"],
    status: "beta",
    dataState: "example",
    riskLevel: "medium",
    costEstimate: "Moyen selon scripts/assets.",
    recommendedTestPrompt: "Cree un concept Roblox tycoon avec boucle de retention.",
  },
  {
    id: "script",
    name: "Agent Script",
    role: "Scripts et snippets",
    mission: "Preparer des snippets ou scripts de base selon la plateforme, avec limites de test claires.",
    useCases: ["Luau", "Verse", "JSON", "JavaScript"],
    systemPrompt: "Produit du code de depart explique, jamais une publication ou execution automatique.",
    permissions: ["read_project", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["game_blueprint", "create_task"],
    tools: ["Game Builder", "Templates", "Projects"],
    status: "beta",
    dataState: "example",
    riskLevel: "medium",
    costEstimate: "Moyen selon la longueur du script.",
    recommendedTestPrompt: "Prepare un snippet Luau de checkpoint avec explication et checklist de test.",
  },
  {
    id: "assets",
    name: "Agent Assets",
    role: "Assets et prompts visuels",
    mission: "Lister les assets, prompts visuels, UI, thumbnails et contraintes de production.",
    useCases: ["Prompts image", "UI kits", "Thumbnails", "Assets jeu"],
    systemPrompt: "Prepare des assets et prompts exploitables, sans pretendre posseder de droits externes.",
    permissions: ["read_project", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["content_plan", "game_blueprint", "create_task"],
    tools: ["Game Builder", "Creator AI", "Templates"],
    status: "beta",
    dataState: "example",
    riskLevel: "medium",
    costEstimate: "Moyen si generation visuelle branchee plus tard.",
    recommendedTestPrompt: "Liste les assets et prompts visuels pour une map Minecraft premium.",
  },
  {
    id: "publishing",
    name: "Agent Publishing",
    role: "Checklist publication",
    mission: "Preparer les etapes de publication, les controles et les risques sans publier automatiquement.",
    useCases: ["Checklist", "Domaine", "Export", "Validation finale"],
    systemPrompt: "Publication prudente: guide, verifie et demande validation humaine avant toute action.",
    permissions: ["read_project", "read_integrations_status", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["create_task", "automation_proposal"],
    tools: ["Projects", "Integrations", "Publishing a configurer"],
    status: "beta",
    dataState: "example",
    riskLevel: "medium",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Prepare une checklist de publication pour un site sans le publier.",
  },
  {
    id: "operations",
    name: "Agent Operations",
    role: "Management et suivi",
    mission: "Transformer le chaos en taches, priorites, relances et rituels simples.",
    useCases: ["Todo list", "Relances", "Suivi projet"],
    systemPrompt: "Organise, priorise, propose des actions courtes et traçables.",
    permissions: ["read_project", "create_task", "suggest_automation", "draft_message"],
    forbiddenActions: forbiddenAgentCapabilities,
    availableActions: ["create_task", "automation_proposal", "draft_message"],
    tools: ["Management AI", "Automations", "Projects"],
    status: "beta",
    dataState: "example",
    riskLevel: "medium",
    costEstimate: "Faible.",
    recommendedTestPrompt: "Organise ma semaine et prepare les relances importantes.",
  },
];

const riskyRequestPatterns = [
  /envoie|envoyer|publie|publier|supprime|supprimer|stripe|paiement|cr[eé]dit|mot de passe|password|secret|api key|prospecte|appelle/i,
];

export const getAgentBlueprint = (id: string) => officialAgentBlueprints.find((agent) => agent.id === id);

export const getPermissionDefinition = (permission: AgentPermissionKey) =>
  agentPermissionCatalog.find((item) => item.key === permission);

export const summarizeAgentPermissions = (permissions: AgentPermissionKey[]) =>
  permissions
    .map((permission) => getPermissionDefinition(permission)?.label)
    .filter(Boolean)
    .slice(0, 4) as string[];

export const isSensitiveAgentRequest = (prompt: string) => riskyRequestPatterns.some((pattern) => pattern.test(prompt));

export const resolveAgentRiskLevel = (agent: CustomAgentProject, prompt: string): AgentRiskLevel => {
  if (isSensitiveAgentRequest(prompt)) return "high";
  if (agent.autonomyLevel === "external_actions_validated" || agent.permissions.useIntegrations) return "medium";
  return agent.riskLevel ?? "low";
};

export const getAllowedPermissionKeys = (agent: CustomAgentProject): AgentPermissionKey[] => {
  const fromAgent = agent.allowedActions?.filter((permission): permission is AgentPermissionKey =>
    agentPermissionCatalog.some((item) => item.key === permission),
  );
  if (fromAgent?.length) return fromAgent;

  return [
    agent.permissions.readProject ? "read_project" : null,
    agent.permissions.suggestChanges ? "suggest_site_improvement" : null,
    agent.permissions.accessAnalytics ? "read_analytics" : null,
    agent.permissions.useIntegrations ? "read_integrations_status" : null,
    "create_task",
  ].filter(Boolean) as AgentPermissionKey[];
};

export const enrichAgentWithBlueprint = (
  agent: CustomAgentProject,
  blueprint?: OfficialAgentBlueprint,
): CustomAgentProject => {
  if (!blueprint) {
    return {
      ...agent,
      autonomyLevel: agent.autonomyLevel ?? "proposals_validated",
      allowedActions: agent.allowedActions ?? getAllowedPermissionKeys(agent),
      forbiddenActions: agent.forbiddenActions ?? forbiddenAgentCapabilities,
      connectedTools: agent.connectedTools ?? ["Pixelrises"],
      status: agent.status ?? "ready",
      riskLevel: agent.riskLevel ?? "low",
      dataState: agent.dataState ?? "mock",
    };
  }

  return {
    ...agent,
    name: blueprint.name,
    role: blueprint.role,
    goal: blueprint.mission,
    instructions: blueprint.systemPrompt,
    avoid: "Ne jamais executer d'action externe, publier, envoyer, supprimer, modifier credits/paiement ou connecter un outil sans validation explicite.",
    autonomyLevel: agent.autonomyLevel ?? "proposals_validated",
    allowedActions: blueprint.permissions,
    forbiddenActions: blueprint.forbiddenActions,
    connectedTools: blueprint.tools,
    status: blueprint.status,
    riskLevel: blueprint.riskLevel,
    dataState: blueprint.dataState,
    permissions: {
      ...agent.permissions,
      readProject: blueprint.permissions.includes("read_project"),
      suggestChanges: blueprint.permissions.some((permission) => permission.startsWith("suggest_")),
      editWithApproval: blueprint.permissions.includes("edit_project_after_validation"),
      publishWithApproval: false,
      accessAnalytics: blueprint.permissions.includes("read_analytics"),
      useIntegrations: blueprint.permissions.includes("read_integrations_status"),
    },
  };
};

export const createValidatableAgentAction = ({
  agent,
  prompt,
  actionType,
  title,
  description,
  targetModule,
}: {
  agent: CustomAgentProject;
  prompt: string;
  actionType: AgentActionType;
  title: string;
  description: string;
  targetModule: string;
}): ValidatableAgentAction => {
  const riskLevel = resolveAgentRiskLevel(agent, prompt);
  const requiresConfirmation =
    riskLevel !== "low" ||
    actionType === "draft_message" ||
    actionType === "automation_proposal" ||
    agent.autonomyLevel !== "advice_only";

  return {
    id: nowId("agent-action"),
    agentId: agent.id,
    projectId: agent.projectContext?.projectId,
    title,
    description,
    actionType,
    targetModule,
    riskLevel,
    requiresConfirmation,
    status: riskLevel === "high" ? "blocked" : "proposed",
    proposedPayload: {
      prompt,
      agentRole: agent.role,
      validationRequired: requiresConfirmation,
      executionAllowed: false,
      executionStatus: "not_requested",
    },
    dataState: agent.dataState ?? "mock",
    createdAt: new Date().toISOString(),
  };
};

export const simulateAgentTest = (agent: CustomAgentProject, prompt: string): AgentTestResult => {
  const cleanPrompt = prompt.trim() || "Propose une action utile pour mon projet.";
  const riskLevel = resolveAgentRiskLevel(agent, cleanPrompt);
  const normalizedRole = agent.role.toLowerCase();
  const actionType: AgentActionType = normalizedRole.includes("seo")
    ? "seo_recommendation"
    : normalizedRole.includes("conversion")
      ? "conversion_recommendation"
      : normalizedRole.includes("support")
        ? "draft_message"
        : normalizedRole.includes("game")
          ? "game_blueprint"
          : normalizedRole.includes("student") || normalizedRole.includes("apprentissage")
            ? "learning_plan"
            : normalizedRole.includes("automation") || normalizedRole.includes("operation")
              ? "automation_proposal"
              : "site_improvement";

  const blocked = riskLevel === "high";
  const proposedAction = createValidatableAgentAction({
    agent,
    prompt: cleanPrompt,
    actionType,
    title: blocked ? "Action bloquee par garde-fou" : `Proposition ${agent.role}`,
    description: blocked
      ? "La demande touche une action sensible. L'agent peut preparer un brouillon ou une checklist, mais ne peut pas executer automatiquement."
      : "Action concrete preparee par l'agent. Elle reste validable avant toute modification ou execution.",
    targetModule:
      actionType === "automation_proposal"
        ? "Automations"
        : actionType === "game_blueprint"
          ? "Game Builder"
          : actionType === "learning_plan"
            ? "Student AI"
            : "Site Builder",
  });

  return {
    id: nowId("agent-test"),
    agentId: agent.id,
    prompt: cleanPrompt,
    response: blocked
      ? "Je ne peux pas executer cette action directement. Je peux la transformer en brouillon validable, avec risque, payload et checklist de controle."
      : `Je propose une action courte, mesurable et validable: ${proposedAction.description}`,
    proposedAction,
    safetyNotes: [
      "Aucune action externe n'est executee automatiquement.",
      "Les secrets, paiements, credits, publication et connexions outil restent bloques sans validation.",
      proposedAction.requiresConfirmation
        ? "Validation humaine requise avant une execution separee. L'approbation seule n'envoie rien."
        : "Conseil uniquement, aucune execution.",
    ],
    dataState: agent.dataState ?? "mock",
    createdAt: new Date().toISOString(),
  };
};

export const canExecuteAgentAction = (action: ValidatableAgentAction) =>
  action.status === "approved" &&
  action.riskLevel !== "high" &&
  action.requiresConfirmation &&
  action.proposedPayload.executionStatus === "execution_confirmed" &&
  action.proposedPayload.executionAllowed === true;

export const approveAgentAction = (action: ValidatableAgentAction): ValidatableAgentAction => {
  const blocked = action.riskLevel === "high";

  return {
    ...action,
    status: blocked ? "blocked" : "approved",
    approvedAt: blocked ? undefined : new Date().toISOString(),
    proposedPayload: {
      ...action.proposedPayload,
      approvedOnly: !blocked,
      executionAllowed: false,
      executionStatus: blocked ? "blocked_by_guardrail" : "not_executed",
    },
    result: blocked
      ? "Action bloquee par garde-fou. Rien n'a ete execute."
      : "Validation enregistree. Aucune action externe n'a ete executee.",
  };
};

export const rejectAgentAction = (action: ValidatableAgentAction): ValidatableAgentAction => ({
  ...action,
  status: "rejected",
  proposedPayload: {
    ...action.proposedPayload,
    executionAllowed: false,
    executionStatus: "rejected",
  },
  result: "Proposition refusee. Rien n'a ete applique.",
});
