import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BuilderGenerationModeSelector,
  BuilderGenerationTimeline,
  BuilderPlanTool,
} from "@/components/v2/BuilderShell";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { repairMojibake } from "@/lib/text-sanitize";
import { aiOrchestrator, runBackendAIOrchestrator } from "@/modules/ai";
import {
  agentPermissionCatalog,
  approveAgentAction,
  autonomyLevels,
  enrichAgentWithBlueprint,
  forbiddenAgentCapabilities,
  getAgentBlueprint,
  rejectAgentAction,
  simulateAgentTest,
  type AgentAutonomyLevel,
  type AgentPermissionKey,
  type AgentTestResult,
  type ValidatableAgentAction,
} from "@/modules/agents/agent-system";
import {
  createDefaultAgentProject,
  validateAgentProject,
  type CustomAgentProject,
} from "@/modules/creation-engine";
import { agentRegistry } from "@/modules/registries";
import { projectStorageAdapter } from "@/modules/storage/project-storage-adapter";
import { trackV2Event } from "@/v2/analytics";

type AgentInterfaceMode = "simple" | "advanced";
type StudioMobilePanel = "brief" | "agent" | "permissions" | "test" | "config";

const AGENT_INTERFACE_MODE_KEY = "pixelrises-agents-interface-mode";

const quickCommands = [
  "Crée un agent SEO qui audite mes pages et propose des corrections validables",
  "Crée un agent support client qui prépare des réponses sans les envoyer",
  "Crée un agent automatisation qui prépare une relance lead avec validation",
  "Crée un agent student qui aide à réviser sans faire le devoir à ma place",
];

const actionStatusCopy: Record<string, string> = {
  proposed: "Proposée",
  approved: "Approuvée, non exécutée",
  rejected: "Refusée",
  blocked: "Bloquée",
  draft: "Brouillon",
  executed: "Exécutée",
  failed: "Échec",
  cancelled: "Annulée",
  requires_external_connection: "Connexion requise",
};

const decisionLockedStatuses: ValidatableAgentAction["status"][] = [
  "approved",
  "rejected",
  "blocked",
  "executed",
  "failed",
  "cancelled",
  "requires_external_connection",
];

const cleanCopy = (value: string) => repairMojibake(value);

const prettifyTechnicalLabel = (value: string) =>
  cleanCopy(value.replaceAll("_", " ")).replace(/^\w/, (letter) => letter.toUpperCase());

const getPermissionDisplayLabel = (permission: string) =>
  agentPermissionCatalog.find((item) => item.key === permission)?.label ?? prettifyTechnicalLabel(permission);

const forbiddenActionLabels: Record<string, string> = {
  send_email_without_validation: "Envoyer des emails ou messages",
  publish_site_without_validation: "Publier ou modifier sans validation",
  modify_credits: "Modifier les crédits",
  modify_payment: "Changer les paiements",
  access_private_conversations: "Lire des conversations privées",
  access_other_user_data: "Accéder aux données d'autres utilisateurs",
  delete_project_without_confirmation: "Supprimer sans confirmation",
  connect_external_tool_without_consent: "Connecter un outil externe",
  call_external_api_without_permission: "Appeler une API externe",
  launch_ads: "Lancer des publicités",
  prospect_automatically: "Prospecter automatiquement",
  read_files_without_upload_or_consent: "Lire des fichiers sans accord",
};

const getForbiddenActionDisplayLabel = (permission: string) =>
  forbiddenActionLabels[permission] ?? prettifyTechnicalLabel(permission);

const readAgentInterfaceMode = (): AgentInterfaceMode => {
  if (typeof window === "undefined") return "simple";
  return window.localStorage.getItem(AGENT_INTERFACE_MODE_KEY) === "advanced" ? "advanced" : "simple";
};

const persistAgentInterfaceMode = (mode: AgentInterfaceMode) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AGENT_INTERFACE_MODE_KEY, mode);
};

const inferRole = (prompt: string) => {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("seo")) return "SEO";
  if (normalized.includes("support")) return "Support client";
  if (normalized.includes("student") || normalized.includes("révision") || normalized.includes("reviser")) return "Student";
  if (normalized.includes("automatisation") || normalized.includes("workflow")) return "Automatisation";
  if (normalized.includes("vente") || normalized.includes("lead") || normalized.includes("conversion")) return "Conversion";
  if (normalized.includes("game") || normalized.includes("roblox") || normalized.includes("jeu")) return "Game design";
  if (normalized.includes("contenu") || normalized.includes("tiktok") || normalized.includes("creator")) return "Content";
  if (normalized.includes("management") || normalized.includes("tâche") || normalized.includes("organiser")) return "Operations";

  return "Business";
};

const createAgentName = (role: string) => `Agent ${role}`;

const buildPresetPrompt = (preset: (typeof agentRegistry)[number]) =>
  `Configure ${cleanCopy(preset.name)} pour Pixelrises V2. Rôle: ${cleanCopy(preset.role)}. Objectif: ${cleanCopy(
    preset.description,
  )}. Exemple d'action: ${cleanCopy(preset.exampleAction)}. L'agent doit proposer des actions concrètes, mesurables et validables sans jamais publier, envoyer ou modifier sans accord.`;

const applyAgentPreset = (current: CustomAgentProject, preset: (typeof agentRegistry)[number]): CustomAgentProject => {
  const now = new Date().toISOString();
  const prompt = buildPresetPrompt(preset);
  const blueprint = getAgentBlueprint(preset.id);
  const base = enrichAgentWithBlueprint(current, blueprint);

  return {
    ...base,
    name: cleanCopy(preset.name),
    role: cleanCopy(blueprint?.role ?? preset.role),
    goal: cleanCopy(blueprint?.mission ?? preset.exampleAction),
    tone: preset.id === "copywriting" || preset.id === "conversion" ? "direct, persuasif, orienté conversion" : "clair, expert, actionnable",
    domain: preset.id.includes("game") || preset.id === "script" || preset.id === "assets" ? "Jeux et expériences digitales" : "Business digital",
    level: preset.status === "beta" ? "advanced" : "simple",
    instructions: [
      blueprint?.systemPrompt ?? prompt,
      "Commencer par comprendre le contexte, puis produire une proposition structurée.",
      "Séparer les quick wins, les risques et les actions nécessitant validation humaine.",
      "Toujours expliquer l'impact business, UX, SEO, code ou sécurité selon le rôle.",
    ].join(" "),
    avoid:
      "Ne jamais publier, envoyer, supprimer, connecter un outil, changer un paiement, changer l'auth ou modifier définitivement sans validation explicite.",
    projectContext: {
      ...current.projectContext,
      projectType: preset.id.includes("game") || preset.id === "script" || preset.id === "assets" ? "game" : "site",
      goal: cleanCopy(preset.exampleAction),
      niche: cleanCopy(blueprint?.role ?? preset.role),
      offer: cleanCopy(preset.description),
    },
    permissions: {
      ...base.permissions,
      readProject: true,
      suggestChanges: true,
      editWithApproval: false,
      publishWithApproval: false,
      useIntegrations: false,
    },
    updatedAt: now,
  };
};

const buildAgentFromPrompt = (current: CustomAgentProject, prompt: string): CustomAgentProject => {
  const cleanPrompt = prompt.trim() || "Crée un agent business qui aide à développer mon projet Pixelrises.";
  const role = inferRole(cleanPrompt);
  const now = new Date().toISOString();

  return {
    ...current,
    name: createAgentName(role),
    role,
    goal: cleanPrompt,
    tone: role === "Support client" ? "calme, utile, rassurant" : "clair, direct, professionnel",
    domain: role === "Game design" ? "Jeux et expériences digitales" : "Business digital",
    level: role === "Game design" ? "advanced" : "simple",
    instructions: [
      "Analyser le contexte du projet.",
      "Proposer des recommandations concrètes, priorisées et validables.",
      "Expliquer l'impact business ou produit de chaque proposition.",
      `Respecter la demande utilisateur: ${cleanPrompt}`,
    ].join(" "),
    avoid:
      "Ne jamais publier, envoyer, supprimer, modifier définitivement ou connecter un outil sans validation explicite de l'utilisateur.",
    projectContext: {
      ...current.projectContext,
      projectType: role === "Game design" ? "game" : "site",
      goal: cleanPrompt,
      niche: role,
      offer: "présence digitale, automatisation et recommandations IA",
    },
    permissions: {
      readProject: true,
      suggestChanges: true,
      editWithApproval: false,
      publishWithApproval: false,
      accessAnalytics: role === "SEO" || role === "Conversion",
      useIntegrations: false,
    },
    autonomyLevel: "proposals_validated",
    allowedActions: ["read_project", "suggest_site_improvement", "create_task", "create_agent_note"],
    forbiddenActions: forbiddenAgentCapabilities,
    connectedTools: ["Pixelrises"],
    status: "ready",
    riskLevel: "low",
    dataState: "mock",
    updatedAt: now,
  };
};

const enforceAgentSafety = (candidate: CustomAgentProject, fallback: CustomAgentProject): CustomAgentProject => {
  const now = new Date().toISOString();

  return {
    ...fallback,
    ...candidate,
    id: candidate.id || fallback.id,
    name: candidate.name?.trim() || fallback.name,
    role: candidate.role?.trim() || fallback.role,
    goal: candidate.goal?.trim() || fallback.goal,
    instructions: candidate.instructions?.trim() || fallback.instructions,
    avoid:
      candidate.avoid?.trim() ||
      "Ne jamais publier, envoyer, supprimer, modifier définitivement ou connecter un outil sans validation explicite.",
    projectContext: {
      ...fallback.projectContext,
      ...candidate.projectContext,
      projectId: candidate.projectContext?.projectId || candidate.id || fallback.projectContext.projectId,
      goal: candidate.projectContext?.goal || candidate.goal || fallback.projectContext.goal,
    },
    permissions: {
      ...fallback.permissions,
      ...candidate.permissions,
      readProject: true,
      suggestChanges: true,
      editWithApproval: false,
      publishWithApproval: false,
      useIntegrations: false,
    },
    autonomyLevel: candidate.autonomyLevel ?? fallback.autonomyLevel ?? "proposals_validated",
    allowedActions: candidate.allowedActions?.length ? candidate.allowedActions : fallback.allowedActions ?? ["read_project", "create_task"],
    forbiddenActions: Array.from(new Set([...(candidate.forbiddenActions ?? []), ...forbiddenAgentCapabilities])),
    connectedTools: candidate.connectedTools?.length ? candidate.connectedTools : fallback.connectedTools ?? ["Pixelrises"],
    status: candidate.status ?? fallback.status ?? "ready",
    riskLevel: candidate.riskLevel ?? fallback.riskLevel ?? "low",
    dataState: candidate.dataState ?? fallback.dataState ?? "mock",
    createdAt: candidate.createdAt || fallback.createdAt || now,
    updatedAt: now,
  };
};

const persistAgentProject = async (nextAgent: CustomAgentProject) => {
  const quality = validateAgentProject(nextAgent);
  await projectStorageAdapter.saveAgent(nextAgent);

  return projectStorageAdapter.saveProject({
    id: nextAgent.id,
    type: "agent",
    title: nextAgent.name,
    status: quality.passed ? "generated" : "draft",
    updatedAt: nextAgent.updatedAt,
    score: quality.score,
    payload: nextAgent,
  });
};

const isAgentActionDecisionLocked = (status: ValidatableAgentAction["status"]) => decisionLockedStatuses.includes(status);

const getAgentActionStatusLabel = (action: ValidatableAgentAction) => {
  if (action.status === "approved" && action.actionType === "draft_message") return "Brouillon approuvé, non envoyé";
  return actionStatusCopy[action.status] ?? action.status;
};

const getAgentActionDecisionMessage = (action: ValidatableAgentAction) => {
  if (action.status === "approved") {
    return "Validation enregistrée. Rien n'a été envoyé, publié, modifié ou exécuté automatiquement.";
  }
  if (action.status === "rejected") return "Proposition refusée. Rien n'a été appliqué.";
  if (action.status === "blocked") return "Action bloquée par sécurité. Transforme-la en brouillon ou checklist validable.";
  return "";
};

const mobilePanelCopy: Array<{ id: StudioMobilePanel; label: string }> = [
  { id: "brief", label: "Brief" },
  { id: "agent", label: "Agent" },
  { id: "permissions", label: "Permissions" },
  { id: "test", label: "Test" },
  { id: "config", label: "Config" },
];

const AgentBuilder = () => {
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get("preset");
  const mode = searchParams.get("mode") ?? "use";
  const templatePrompt = searchParams.get("templatePrompt");
  const selectedPreset = useMemo(() => agentRegistry.find((preset) => preset.id === presetId), [presetId]);

  const [interfaceMode, setInterfaceMode] = useState<AgentInterfaceMode>(() => readAgentInterfaceMode());
  const [studioMobilePanel, setStudioMobilePanel] = useState<StudioMobilePanel>("brief");
  const [agent, setAgent] = useState<CustomAgentProject>(() => createDefaultAgentProject());
  const [prompt, setPrompt] = useState("");
  const [planApproved, setPlanApproved] = useState(false);
  const [generationMode, setGenerationMode] = useState<"direct" | "plan">("direct");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Analyse mon site pixelrises.com et propose 5 améliorations SEO.");
  const [testResult, setTestResult] = useState<AgentTestResult | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentGenerated, setAgentGenerated] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("Décris l'agent, configure ses capacités, puis teste son comportement avant sauvegarde.");

  const isAdvanced = interfaceMode === "advanced";

  useEffect(() => {
    if (!selectedPreset) return;

    setAgent((current) => applyAgentPreset(current, selectedPreset));
    setPrompt((current) => current.trim() || buildPresetPrompt(selectedPreset));
    setPlanApproved(false);
    setTestPrompt(getAgentBlueprint(selectedPreset.id)?.recommendedTestPrompt ?? "Teste cet agent sur une action concrète.");
    setSaveMessage("");
    setAgentGenerated(false);
    setPipelineMessage(
      `${cleanCopy(selectedPreset.name)} est préconfiguré en mode ${mode === "config" ? "configuration" : "utilisation"}. Tu peux l'ajuster, le tester puis le sauvegarder.`,
    );
  }, [mode, selectedPreset]);

  useEffect(() => {
    const cleanTemplatePrompt = templatePrompt?.trim();
    if (!cleanTemplatePrompt || selectedPreset) return;

    setPrompt(cleanTemplatePrompt);
    setAgent((current) => enforceAgentSafety(buildAgentFromPrompt(current, cleanTemplatePrompt), current));
    setPlanApproved(false);
    setTestPrompt("Teste cet agent sur une action concrete et verifie qu'il ne fait rien sans validation humaine.");
    setSaveMessage("");
    setAgentGenerated(false);
    setPipelineMessage(
      "Template Agent Studio charge : ajuste la mission, controle les permissions, puis genere ou sauvegarde seulement apres verification.",
    );
  }, [selectedPreset, templatePrompt]);

  const updateAgent = (patch: Partial<CustomAgentProject>) => {
    setPlanApproved(false);
    setAgent((current) => enforceAgentSafety({ ...current, ...patch, updatedAt: new Date().toISOString() }, current));
    setSaveMessage("");
  };

  const changeInterfaceMode = (nextMode: AgentInterfaceMode) => {
    setInterfaceMode(nextMode);
    persistAgentInterfaceMode(nextMode);
  };

  const togglePermission = (permission: AgentPermissionKey) => {
    const current = new Set(agent.allowedActions ?? []);
    if (current.has(permission)) {
      current.delete(permission);
    } else {
      current.add(permission);
    }
    updateAgent({ allowedActions: Array.from(current) });
  };

  const generateAgent = async () => {
    if (generationMode === "plan" && !planApproved) {
      setPipelineMessage("Validez le plan de l'agent avant de lancer la génération.");
      setTimelineOpen(true);
      return;
    }

    setIsGenerating(true);
    setTimelineOpen(true);
    setPipelineMessage("Création de l'agent via Pixelrises AI...");

    try {
      const backend = await runBackendAIOrchestrator({
        projectType: "agent",
        mode: "build",
        prompt: prompt.trim() || "Crée un agent business Pixelrises.",
        formData: {
          currentAgentId: agent.id,
          currentAgentName: agent.name,
        },
      });
      const backendOutput = backend.normalizedOutput;
      let nextAgent: CustomAgentProject;
      let source = backend.source ?? "real";

      if (backend.success && backendOutput && "permissions" in backendOutput) {
        nextAgent = enforceAgentSafety(backendOutput as CustomAgentProject, agent);
        setPipelineMessage(
          backend.source === "mock-fallback"
            ? "Agent préparé en mode sécurisé. Les permissions restent protégées."
            : backend.persisted
              ? "Agent créé et sauvegardé."
              : "Agent créé. Sauvegarde locale utilisée.",
        );
      } else {
        const orchestrated = await aiOrchestrator.run({
          prompt: prompt.trim() || "Crée un agent business Pixelrises.",
          projectType: "agent",
          mode: "business",
          context: {
            currentAgentId: agent.id,
          },
        });
        nextAgent =
          orchestrated.projectType === "agent" &&
          orchestrated.output &&
          "permissions" in (orchestrated.output as CustomAgentProject)
            ? enforceAgentSafety(orchestrated.output as CustomAgentProject, agent)
            : buildAgentFromPrompt(agent, prompt);
        source = "mock-fallback";
        setPipelineMessage("Agent préparé en mode sécurisé. Vérifie ses capacités avant sauvegarde.");
      }

      setAgent(nextAgent);
      setAgentGenerated(true);
      setTestResult(null);
      setSaveMessage("");
      setStudioMobilePanel("agent");
      const saved = await persistAgentProject(nextAgent);
      if (!saved.persisted) {
        setPipelineMessage((current) => `${current} Projet visible dans le dashboard.`);
      }
      trackV2Event("agent_created", {
        agentName: nextAgent.name,
        role: nextAgent.role,
        source,
      });
    } catch {
      const fallbackAgent = enforceAgentSafety(buildAgentFromPrompt(agent, prompt), agent);
      setAgent(fallbackAgent);
      setAgentGenerated(true);
      setTestResult(null);
      setStudioMobilePanel("agent");
      await persistAgentProject(fallbackAgent);
      setPipelineMessage("Agent sécurisé créé sans afficher de détail technique.");
      trackV2Event("agent_created", {
        agentName: fallbackAgent.name,
        role: fallbackAgent.role,
        source: "frontend-fallback",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const approvePlan = () => {
    setPlanApproved(true);
    setPipelineMessage("Plan Agent Builder validé. Vous pouvez générer l'agent.");
  };

  const editPlan = () => {
    setPlanApproved(false);
    setPipelineMessage("Modifiez le prompt, le rôle ou les permissions, puis relisez le plan avant validation.");
  };

  const requestPlanReview = () => {
    setTimelineOpen(true);
    setPipelineMessage("Plan préparé. Lisez le plan détaillé, ajustez vos réponses si besoin, puis validez-le.");
  };

  const handlePrimaryGenerationAction = () => {
    if (generationMode === "plan" && !planApproved) {
      requestPlanReview();
      return;
    }
    void generateAgent();
  };

  const runAgentTest = () => {
    const result = simulateAgentTest(agent, testPrompt);
    const nextAgent = enforceAgentSafety(
      {
        ...agent,
        testHistory: [
          ...(agent.testHistory ?? []),
          {
            id: result.id,
            prompt: result.prompt,
            response: result.response,
            riskLevel: result.proposedAction.riskLevel,
            requiresConfirmation: result.proposedAction.requiresConfirmation,
            createdAt: result.createdAt,
          },
        ],
        proposedActions: [...(agent.proposedActions ?? []), result.proposedAction],
      },
      agent,
    );
    setAgent(nextAgent);
    setTestResult(result);
    setSaveMessage("");
    setStudioMobilePanel("test");
  };

  const updateAction = (action: ValidatableAgentAction, nextAction: ValidatableAgentAction) => {
    setTestResult((current) => (current ? { ...current, proposedAction: nextAction } : current));
    setAgent((current) => ({
      ...current,
      proposedActions: (current.proposedActions ?? []).map((item) => (item.id === action.id ? nextAction : item)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const save = async () => {
    const updated = enforceAgentSafety({ ...agent, updatedAt: new Date().toISOString() }, agent);
    const saved = await persistAgentProject(updated);

    setAgent(updated);
    setSaveMessage(
      saved.persisted
        ? `${updated.name} est sauvegardé.`
        : `${updated.name} est sauvegardé sur cet appareil. La sauvegarde cloud sera reprise quand elle sera disponible.`,
    );
    trackV2Event("agent_created", {
      agentName: updated.name,
      role: updated.role,
      source: "agent_studio_save",
    });
  };

  const duplicateAgent = async () => {
    const now = new Date().toISOString();
    const duplicate = enforceAgentSafety(
      {
        ...agent,
        id: globalThis.crypto?.randomUUID?.() ?? `agent-copy-${Date.now().toString(36)}`,
        name: `${agent.name} copie`,
        createdAt: now,
        updatedAt: now,
        dataState: "mock",
      },
      agent,
    );
    await persistAgentProject(duplicate);
    setAgent(duplicate);
    setSaveMessage("Copie locale préparée. Aucune action externe n'a été exécutée.");
  };

  const exportAgentConfiguration = () => {
    const payload = {
      name: agent.name,
      role: agent.role,
      goal: agent.goal,
      domain: agent.domain,
      autonomyLevel: agent.autonomyLevel,
      allowedActions: agent.allowedActions,
      forbiddenActions: agent.forbiddenActions,
      exportedAt: new Date().toISOString(),
      note: "Configuration locale. Aucun secret, token, provider ou paiement n'est inclus.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${agent.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "agent"}-configuration.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSaveMessage("Configuration exportée localement. Rien n'a été envoyé à un service externe.");
  };

  const deleteAgentLocal = () => {
    const confirmed = window.confirm(`Supprimer ${agent.name} de ce brouillon local ?`);
    if (!confirmed) return;

    const reset = createDefaultAgentProject();
    setAgent(reset);
    setPrompt("");
    setAgentGenerated(false);
    setTestResult(null);
    setSaveMessage("Brouillon local réinitialisé. Aucune donnée cloud n'a été supprimée.");
    setStudioMobilePanel("brief");
  };

  const quality = validateAgentProject(agent);
  const activePermissions = new Set(agent.allowedActions ?? []);
  const visiblePermissions = isAdvanced ? agentPermissionCatalog : agentPermissionCatalog.slice(0, 5);
  const allowedPermissionLabels = (agent.allowedActions ?? ["read_project", "create_task"]).slice(0, isAdvanced ? 6 : 4);
  const forbiddenPermissionLabels = (agent.forbiddenActions ?? forbiddenAgentCapabilities).slice(0, isAdvanced ? 7 : 4);
  const tested = Boolean(testResult);
  const stepIndex = saveMessage ? 3 : tested ? 2 : agentGenerated || isGenerating ? 1 : 0;
  const saveStateLabel = saveMessage ? "Sauvegarde locale" : "Brouillon non sauvegardé";

  const generationTimelineSteps = useMemo(
    () => [
      {
        title: "Analyse de l'agent",
        description: "Rôle, mission, utilisateurs et ton sont cadrés.",
        status: planApproved || isGenerating || agent.status === "ready" ? "validé" : "en attente",
        state: planApproved || isGenerating || agent.status === "ready" ? ("done" as const) : ("pending" as const),
        items: [
          { label: "rôle", state: agent.role ? ("done" as const) : ("pending" as const) },
          { label: "mission", state: agent.goal ? ("done" as const) : ("pending" as const) },
          { label: "utilisateurs", state: agent.domain ? ("active" as const) : ("pending" as const) },
          { label: "ton", state: prompt.trim().length >= 30 ? ("done" as const) : ("pending" as const) },
        ],
      },
      {
        title: "Permissions et limites",
        description: "Actions autorisées, limites et validation humaine restent visibles.",
        status: activePermissions.size ? "contrôlé" : "à compléter",
        state: activePermissions.size ? ("done" as const) : ("pending" as const),
        items: [
          { label: "actions autorisées", state: activePermissions.size ? ("done" as const) : ("pending" as const) },
          { label: "validation humaine", state: "done" as const },
          { label: "actions externes bloquées", state: "done" as const },
          { label: "Workflow", state: generationMode === "plan" ? ("active" as const) : ("done" as const) },
        ],
      },
      {
        title: "Réponses et comportement",
        description: "Le chat vérifie que l'agent propose sans exécuter.",
        status: testResult ? "test local" : "à tester",
        state: testResult ? ("done" as const) : ("pending" as const),
        items: [
          { label: "message de test", state: testPrompt ? ("done" as const) : ("pending" as const) },
          { label: "réponse agent", state: testResult ? ("done" as const) : ("pending" as const) },
          { label: "action validable", state: testResult ? ("done" as const) : ("pending" as const) },
          { label: "aucun faux succès", state: "done" as const },
        ],
      },
      {
        title: "Création finale",
        description: "Configuration, vérification, test et agent prêt sont suivis honnêtement.",
        status: isGenerating ? "en cours" : agent.status === "ready" ? "terminé" : "en attente",
        state: isGenerating ? ("active" as const) : agent.status === "ready" ? ("done" as const) : ("pending" as const),
        items: [
          { label: "configuration", state: agent.status === "ready" ? ("done" as const) : isGenerating ? ("active" as const) : ("pending" as const) },
          { label: "vérification", state: quality.score >= 75 ? ("done" as const) : ("pending" as const) },
          { label: "test", state: testResult ? ("done" as const) : ("pending" as const) },
          { label: "agent prêt", state: agent.status === "ready" ? ("done" as const) : ("pending" as const) },
        ],
      },
    ],
    [
      activePermissions.size,
      agent.domain,
      agent.goal,
      agent.role,
      agent.status,
      generationMode,
      isGenerating,
      planApproved,
      prompt,
      quality.score,
      testPrompt,
      testResult,
    ],
  );

  const studioSteps = [
    { label: "Brief", description: "Définir l'agent" },
    { label: "Génération", description: "Créer l'agent" },
    { label: "Test", description: "Valider le comportement" },
    { label: "Finalisation", description: "Sauvegarder l'agent" },
  ];

  return (
    <V2PageShell
      eyebrow="Agent Builder"
      title="Agent Studio"
      description="Crée, teste et sécurise vos agents IA personnalisés."
      hideHeader
      hideAssistant
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-2xl border border-white/[0.10] bg-black/40 p-1">
            {(["simple", "advanced"] as AgentInterfaceMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeInterfaceMode(item)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  interfaceMode === item ? "bg-[#F5C542] text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {item === "simple" ? "Simple" : "Avancé"}
              </button>
            ))}
          </div>
          <span className="hidden rounded-2xl border border-white/[0.08] bg-black/35 px-4 py-2 text-xs text-white/62 sm:inline-flex">
            <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-[#F5C542]" />
            {saveStateLabel}
          </span>
          <Button onClick={() => void save()} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      }
    >
      <SEOHead title="Agent Studio | Pixelrises V2" description="Générateur officiel d'agents Pixelrises V2." noIndex />

      <div className="agent-studio-page">
        <header className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#F5C542]/35 bg-[#F5C542]/10 text-[#F5C542] shadow-[0_0_34px_-18px_rgba(245,197,66,0.9)]">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[42px]">
                Agent Studio
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Créez, testez et sécurisez vos agents IA personnalisés.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-[18px] border border-white/[0.10] bg-black/45 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {(["simple", "advanced"] as AgentInterfaceMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeInterfaceMode(item)}
                  className={`rounded-[14px] px-5 py-2.5 text-sm font-semibold transition ${
                    interfaceMode === item
                      ? "bg-[#F5C542] text-black shadow-[0_0_24px_-10px_rgba(245,197,66,0.9)]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {item === "simple" ? "Simple" : "Avancé"}
                </button>
              ))}
            </div>

            <span className="inline-flex items-center rounded-[18px] border border-white/[0.09] bg-black/38 px-4 py-3 text-sm text-white/68">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#9da25a]" />
              {saveStateLabel}
            </span>

            <Button onClick={() => void save()} className="rounded-[16px] bg-[#F5C542] px-5 py-6 text-black hover:bg-[#FFD766]">
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>

            <button
              type="button"
              onClick={() => void duplicateAgent()}
              aria-label="Dupliquer l'agent"
              className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-black/35 text-white/68 transition hover:border-[#F5C542]/30 hover:text-[#F5C542] md:inline-flex"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Options de l'agent"
              className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-black/35 text-white/68 transition hover:border-[#F5C542]/30 hover:text-[#F5C542] md:inline-flex"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <Link
              to="/agents"
              className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-black/35 text-white/68 transition hover:border-[#F5C542]/30 hover:text-white md:inline-flex"
              aria-label="Retour aux agents"
            >
              <X className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <section className="mb-5 grid overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#07090a]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_24px_80px_-52px_rgba(0,0,0,1)] md:grid-cols-4">
        {studioSteps.map((step, index) => {
          const active = index === stepIndex;
          const done = index < stepIndex;
          return (
            <div
              key={step.label}
              className={`relative flex min-h-[88px] items-center gap-4 border-white/[0.07] p-5 md:border-r md:last:border-r-0 ${
                active
                  ? "border-[#F5C542]/18 bg-[#F5C542]/[0.075] shadow-[inset_0_0_42px_rgba(245,197,66,0.12)]"
                  : "bg-white/[0.012]"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-bold ${
                  active || done
                    ? "border-[#F5C542] bg-[#F5C542] text-black shadow-[0_0_30px_-12px_rgba(245,197,66,0.95)]"
                    : "border-white/[0.16] bg-black/25 text-white/60"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className={`font-semibold ${active ? "text-[#F5C542]" : "text-white"}`}>{step.label}</p>
                <p className="text-xs text-white/45">{step.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 xl:hidden">
        {mobilePanelCopy.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStudioMobilePanel(item.id)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold ${
              studioMobilePanel === item.id
                ? "border-[#F5C542] bg-[#F5C542] text-black"
                : "border-white/[0.10] bg-black/35 text-white/70"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

        <main className="agent-studio-grid grid gap-5 xl:grid-cols-[minmax(360px,1.04fr)_minmax(310px,0.82fr)_minmax(390px,1.06fr)]">
        <section className={`space-y-4 ${studioMobilePanel === "brief" || studioMobilePanel === "config" ? "block" : "hidden xl:block"}`}>
          <div className={`${studioMobilePanel === "config" ? "hidden xl:block" : ""} agent-studio-card rounded-[24px] border border-white/[0.08] bg-[#070808] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)]`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">1. Brief de l'agent</p>
            <p className="mt-2 text-xs text-white/45">Décrivez le rôle, la mission et les objectifs de votre agent.</p>
            <Textarea
              value={prompt}
              maxLength={1000}
              onChange={(event) => {
                setPlanApproved(false);
                setPrompt(event.target.value);
              }}
              placeholder="Crée un agent qui analyse mon site, propose des améliorations SEO concrètes et prépare un plan d'actions priorisées."
               className="mt-4 min-h-[142px] resize-none rounded-2xl border-[#F5C542]/18 bg-black/55 text-sm leading-6 text-white placeholder:text-white/38 focus-visible:ring-[#F5C542]/35"
            />
            <p className="mt-2 text-right text-xs text-white/45">{prompt.length} / 1000</p>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5C542]">Suggestions rapides</p>
              <p className="mt-2 text-xs text-white/42">Utilisez un exemple comme base ou inspirez-vous de nos modèles.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {quickCommands.map((command) => (
                  <button
                    key={command}
                    type="button"
                    onClick={() => {
                      setPlanApproved(false);
                      setPrompt(command);
                    }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 text-left text-xs leading-5 text-white/72 transition hover:border-[#F5C542]/35 hover:bg-[#F5C542]/[0.06]"
                  >
                    <Sparkles className="mb-2 h-4 w-4 text-[#F5C542]" />
                    {command.replace("Crée un ", "").slice(0, 68)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-white/[0.08] pt-5">
              <BuilderGenerationModeSelector
                value={generationMode}
                onChange={(nextMode) => {
                  setGenerationMode(nextMode);
                  setPipelineMessage(
                    nextMode === "direct"
                      ? "Mode Direct actif : l'agent sera généré directement à partir de votre prompt."
                      : "Mode Plan actif : Pixelrises prépare un plan avant de créer l'agent.",
                  );
                }}
              />
            </div>

            <Button
              onClick={handlePrimaryGenerationAction}
              disabled={isGenerating}
              className="mt-5 w-full rounded-2xl bg-[#F5C542] py-6 text-black shadow-[0_18px_44px_-24px_rgba(245,197,66,0.95)] hover:bg-[#FFD766] disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating
                ? "Création..."
                : generationMode === "plan"
                  ? planApproved
                    ? "Générer avec ce plan"
                    : "Créer le plan"
                  : "Générer / renforcer l'agent"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-white/45">Coût estimé : 10 crédits. Aucun débit si l'appel IA échoue.</p>
          </div>

          <div className="agent-studio-card rounded-[24px] border border-white/[0.08] bg-[#070808] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5C542]">Timeline de génération</p>
                <p className="mt-1 text-xs text-white/42">Suivez les étapes de création de votre agent.</p>
              </div>
              <button
                type="button"
                onClick={() => setTimelineOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-white/70"
              >
                {timelineOpen ? "Masquer" : "Afficher"}
                <ChevronDown className={`h-4 w-4 transition ${timelineOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {timelineOpen ? <div className="mt-4"><BuilderGenerationTimeline steps={generationTimelineSteps} /></div> : null}
          </div>

          {generationMode === "plan" ? (
            <BuilderPlanTool
              plan={{
                id: "agent-builder",
                title: "Plan proposé par Pixelrises",
                subtitle: "Vérifiez ce que l'IA va créer avant de lancer la génération.",
                summary: `Mission : ${agent.goal}. Rôle : ${agent.role}. Autonomie : ${agent.autonomyLevel ?? "propositions validées"}.`,
                questions: [
                  "Quel est l'objectif principal ?",
                  "À qui s'adresse le projet ?",
                  "Quel niveau voulez-vous ?",
                  "Quel style voulez-vous ?",
                  "Quelle priorité ?",
                  "Quels éléments sont obligatoires ?",
                  "Quels éléments sont à éviter ?",
                  "Voulez-vous un résultat rapide, équilibré ou très détaillé ?",
                  "Quelles actions l'agent peut-il seulement proposer ?",
                  "Quelles actions doivent rester interdites sans validation humaine ?",
                  "Quel test prouve que l'agent répond sans exécuter automatiquement ?",
                ],
                sections: [
                  { label: "Résumé du projet", value: `Créer ou renforcer ${agent.name} pour ${agent.domain}.` },
                  { label: "Objectif", value: agent.goal },
                  { label: "Cible", value: `Utilisateurs concernés : ${agent.domain}.` },
                  { label: "Style", value: `Ton ${agent.tone}. Autonomie : ${agent.autonomyLevel ?? "propositions validées"}.` },
                  { label: "Structure prévue", items: ["Rôle clair", "Mission", "Permissions", "Chat de test", "Actions validables"] },
                  { label: "Fonctionnalités prévues", items: (agent.allowedActions ?? []).slice(0, 6) },
                  {
                    label: "Contenu prévu",
                    items: ["Instructions de rôle", "Limites d'action", "Exemples de réponses", "Message de test", "Workflow de validation humaine"],
                  },
                  { label: "Points importants", items: ["Aucune action externe automatique", "Permissions contrôlées", "Validation humaine avant action sensible"] },
                  { label: "Éléments à éviter", items: ["Agent autonome sans limite", "Email ou intégration externe automatique", "Accès admin", "Promesse d'action non prouvée"] },
                  { label: "Résultat attendu", value: "Un agent IA utile, testable, sauvegardable et limité à des propositions validables." },
                ],
              }}
              state={isGenerating ? "pending" : "idle"}
              approved={planApproved}
              onApprove={approvePlan}
              onEditPrompt={editPlan}
              onEditPreferences={editPlan}
              onGenerate={() => void generateAgent()}
            />
          ) : null}

          <div className={`${studioMobilePanel === "config" ? "block" : "hidden"} agent-studio-card rounded-[24px] border border-white/[0.08] bg-[#070808] p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Configuration agent</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Nom</span>
                <Input value={agent.name} onChange={(event) => updateAgent({ name: event.target.value })} className="rounded-2xl border-white/[0.08] bg-black/45" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Rôle</span>
                <Input value={agent.role} onChange={(event) => updateAgent({ role: event.target.value })} className="rounded-2xl border-white/[0.08] bg-black/45" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Domaine</span>
                <Input value={agent.domain} onChange={(event) => updateAgent({ domain: event.target.value })} className="rounded-2xl border-white/[0.08] bg-black/45" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Autonomie</span>
                <select
                  value={agent.autonomyLevel ?? "proposals_validated"}
                  onChange={(event) => updateAgent({ autonomyLevel: event.target.value as AgentAutonomyLevel })}
                  className="h-10 w-full rounded-2xl border border-white/[0.08] bg-black/45 px-3 text-sm text-white outline-none"
                >
                  {autonomyLevels.map((level) => (
                    <option key={level.id} value={level.id} className="bg-neutral-950">
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-4 block space-y-2">
              <span className="text-xs font-semibold text-white/55">Mission principale</span>
              <Textarea
                value={agent.goal}
                onChange={(event) => updateAgent({ goal: event.target.value })}
                className="min-h-[82px] rounded-2xl border-white/[0.08] bg-black/45"
              />
            </label>
            {isAdvanced ? (
              <>
                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold text-white/55">Instructions personnalisées</span>
                  <Textarea
                    value={agent.instructions}
                    onChange={(event) => updateAgent({ instructions: event.target.value })}
                    className="min-h-[98px] rounded-2xl border-white/[0.08] bg-black/45"
                  />
                </label>
                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold text-white/55">Limites internes</span>
                  <Textarea
                    value={agent.avoid}
                    onChange={(event) => updateAgent({ avoid: event.target.value })}
                    className="min-h-[78px] rounded-2xl border-white/[0.08] bg-black/45"
                  />
                </label>
              </>
            ) : null}
          </div>
        </section>

        <section className={`space-y-4 ${studioMobilePanel === "agent" || studioMobilePanel === "permissions" ? "block" : "hidden xl:block"}`}>
          <div className={`${studioMobilePanel === "permissions" ? "hidden xl:block" : ""} agent-studio-card rounded-[24px] border border-white/[0.08] bg-[#070808] p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">2. Agent prêt à tester</p>
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f6bff] to-[#0f2b8f] text-white shadow-[0_0_40px_rgba(31,107,255,0.22)]">
                    <Search className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{agent.name}</h2>
                    <p className="mt-1 text-sm text-white/52">{agent.goal}</p>
                  </div>
                </div>
              </div>
              <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10">
                {agent.status === "ready" ? "Prêt" : "Bêta"}
              </Badge>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                ["Domaine", agent.role],
                ["Autonomie", autonomyLevels.find((level) => level.id === agent.autonomyLevel)?.label ?? "Moyenne"],
                ["Statut", agent.status === "ready" ? "Prêt" : "Bêta"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <p className="text-xs text-white/42">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5C542]">Capacités principales</p>
              <div className="mt-3 space-y-2">
                {allowedPermissionLabels.map((permission) => (
                  <p key={permission} className="flex items-start gap-2 text-sm leading-5 text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    {getPermissionDisplayLabel(permission)}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/[0.06] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5C542]">Action validable</p>
              <p className="mt-2 text-sm text-white/75">Préparer un plan d'actions priorisées sans exécution.</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[agent.role, agent.domain, agent.riskLevel ?? "low", agent.autonomyLevel ?? "proposals_validated"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/58">
                  {cleanCopy(tag)}
                </span>
              ))}
            </div>
          </div>

          <div className={`${studioMobilePanel === "agent" ? "hidden xl:block" : ""} agent-studio-card rounded-[24px] border border-white/[0.08] bg-[#070808] p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">3. Permissions & limites</p>
            <p className="mt-2 text-xs text-white/45">Contrôlez ce que l'agent peut ou ne peut pas faire.</p>
            <div className="mt-4 space-y-2">
              {visiblePermissions.map((permission) => (
                <button
                  key={permission.key}
                  type="button"
                  onClick={() => togglePermission(permission.key)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    activePermissions.has(permission.key)
                      ? "border-emerald-300/20 bg-emerald-300/[0.055]"
                      : "border-white/[0.08] bg-black/30 hover:border-[#F5C542]/25"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{permission.label}</span>
                    {activePermissions.has(permission.key) ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <XCircle className="h-4 w-4 text-white/28" />
                    )}
                  </div>
                  {isAdvanced ? <p className="mt-2 text-xs leading-5 text-white/48">{permission.description}</p> : null}
                </button>
              ))}
              {forbiddenPermissionLabels.map((permission) => (
                <div key={permission} className="flex items-center justify-between gap-3 rounded-2xl border border-red-300/10 bg-red-300/[0.035] p-3">
                  <span className="text-sm text-white/64">{getForbiddenActionDisplayLabel(permission)}</span>
                  <XCircle className="h-4 w-4 shrink-0 text-red-300" />
                </div>
              ))}
            </div>
            <p className="mt-4 flex gap-2 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.04] p-3 text-xs leading-5 text-white/54">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
              Aucune action externe automatique : publication, email, paiement, crédits, intégrations et suppression restent bloqués sans validation humaine.
            </p>
            <button
              type="button"
              onClick={() => setStudioMobilePanel("config")}
              className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white/70 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
            >
              Configurer en détail
              <ArrowRight className="h-4 w-4 text-[#F5C542]" />
            </button>
          </div>
        </section>

        <section className={`space-y-4 ${studioMobilePanel === "test" ? "block" : "hidden xl:block"}`}>
          <div className="agent-studio-card rounded-[24px] border border-white/[0.08] bg-[#070808] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">4. Tester l'agent</p>
                <p className="mt-2 text-xs text-white/45">Discutez avec votre agent et évaluez ses réponses.</p>
              </div>
              <DataBadge state="mock" label="Test local" />
            </div>

            <div className="mt-5 space-y-4">
              <div className="ml-auto max-w-[88%] rounded-2xl bg-[#221a3a] p-4 text-sm leading-6 text-white/84">
                {testPrompt || "Posez une question à votre agent."}
              </div>
              <div className="max-w-[92%] rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 text-sm leading-6 text-white/72">
                {testResult ? (
                  <>
                    <p>{testResult.response}</p>
                    <p className="mt-3 text-xs text-white/38">
                      Basé sur l'analyse actuelle · Source : simulation locale contrôlée
                    </p>
                  </>
                ) : (
                  <>
                    <p>Test à configurer : lance une demande pour vérifier que l'agent propose sans exécuter automatiquement.</p>
                    <p className="mt-3 text-xs text-white/38">Aucun provider, token ou prompt système n'est affiché.</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Peux-tu détailler l'amélioration ?", "Propose un plan d'actions complet."].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setTestPrompt(chip)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-white/62 hover:border-[#F5C542]/25"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/35 p-3">
              <Textarea
                value={testPrompt}
                onChange={(event) => setTestPrompt(event.target.value)}
                className="min-h-[70px] resize-none border-0 bg-transparent p-0 text-sm text-white shadow-none placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Posez une question à votre agent..."
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex gap-2 text-white/38">
                  <MessageSquare className="h-4 w-4" />
                  <Sparkles className="h-4 w-4" />
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <Button onClick={runAgentTest} className="rounded-xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  <Send className="h-4 w-4" />
                  Tester l'agent
                </Button>
              </div>
            </div>

            {testResult ? (
              <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-black/25 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <DataBadge state={testResult.dataState} label={testResult.dataState === "mock" ? "Simulation locale" : undefined} />
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                    Risque {testResult.proposedAction.riskLevel}
                  </Badge>
                  <Badge className="border-white/[0.10] bg-white/[0.05] text-white/70 hover:bg-white/[0.05]">
                    {getAgentActionStatusLabel(testResult.proposedAction)}
                  </Badge>
                </div>
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <p className="font-semibold">{testResult.proposedAction.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/52">{testResult.proposedAction.description}</p>
                  <p className="mt-2 text-xs leading-5 text-[#F5C542]">
                    Validation = accord sur la proposition. L'envoi ou l'exécution demande une action séparée.
                  </p>
                </div>
                {getAgentActionDecisionMessage(testResult.proposedAction) ? (
                  <p className="mt-4 rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-3 text-sm leading-6 text-[#F5C542]">
                    {getAgentActionDecisionMessage(testResult.proposedAction)}
                  </p>
                ) : null}
                {!isAgentActionDecisionLocked(testResult.proposedAction.status) ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      onClick={() => updateAction(testResult.proposedAction, approveAgentAction(testResult.proposedAction))}
                      className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
                    >
                      Approuver sans exécuter
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => updateAction(testResult.proposedAction, rejectAgentAction(testResult.proposedAction))}
                      className="rounded-2xl border-white/[0.10] bg-transparent text-white/82"
                    >
                      Refuser
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="agent-studio-card rounded-[24px] border border-white/[0.08] bg-[#070808] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">5. Actions</p>
            <p className="mt-2 text-xs text-white/45">Que souhaitez-vous faire avec cet agent ?</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {[
                { label: "Sauvegarder l'agent", description: "Enregistrer et réutiliser plus tard", icon: Save, action: () => void save() },
                { label: "Dupliquer l'agent", description: "Créer une copie pour l'adapter", icon: Copy, action: () => void duplicateAgent() },
                { label: "Exporter la configuration", description: "Télécharger le fichier de configuration", icon: Download, action: exportAgentConfiguration },
                { label: "Supprimer l'agent", description: "Supprimer uniquement ce brouillon local", icon: Trash2, action: deleteAgentLocal, danger: true },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                      item.danger
                        ? "border-red-300/10 bg-red-300/[0.035] text-red-200"
                        : "border-white/[0.08] bg-white/[0.04] text-white hover:border-[#F5C542]/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className={`h-5 w-5 ${item.danger ? "text-red-300" : "text-[#F5C542]"}`} />
                      <ArrowRight className="h-4 w-4 text-[#F5C542]" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-white/42">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {saveMessage ? <p className="rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-3 text-sm text-[#F5C542]">{saveMessage}</p> : null}
        </section>
      </main>

      <footer className="mt-5 grid gap-3 rounded-2xl border border-white/[0.08] bg-[#070808] p-4 text-xs text-white/52 md:grid-cols-[1fr_auto] md:items-center">
        <p className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
          Sécurité maximale : aucune action externe n'est exécutée sans validation humaine.
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Activité récente · Tous les changements sont sauvegardés localement après action.
        </p>
      </footer>

      </div>
    </V2PageShell>
  );
};

export default AgentBuilder;
