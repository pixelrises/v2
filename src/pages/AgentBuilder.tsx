import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, CheckCircle2, Loader2, Save, Send, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, DataSourceLabel } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BuilderModeToggle, BuilderToolbar } from "@/components/v2/BuilderShell";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { useInterfaceMode } from "@/hooks/use-interface-mode";
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
import { repairMojibake } from "@/lib/text-sanitize";

const quickCommands = [
  "Crée un agent SEO qui audite mes pages et propose des corrections validables",
  "Crée un agent support client qui prépare des réponses sans les envoyer",
  "Crée un agent automatisation qui prépare une relance lead avec validation",
  "Crée un agent student qui aide à réviser sans faire le devoir à ma place",
];

const cleanCopy = (value: string) => repairMojibake(value);

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

const AgentBuilder = () => {
  const { isAdvanced } = useInterfaceMode();
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get("preset");
  const mode = searchParams.get("mode") ?? "use";
  const selectedPreset = useMemo(() => agentRegistry.find((preset) => preset.id === presetId), [presetId]);
  const [agent, setAgent] = useState<CustomAgentProject>(() => createDefaultAgentProject());
  const [prompt, setPrompt] = useState("");
  const [testPrompt, setTestPrompt] = useState("Propose une action utile sans l'exécuter automatiquement.");
  const [testResult, setTestResult] = useState<AgentTestResult | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("Décris l'agent, configure ses capacités, puis teste son comportement avant sauvegarde.");

  useEffect(() => {
    if (!selectedPreset) return;

    setAgent((current) => applyAgentPreset(current, selectedPreset));
    setPrompt((current) => current.trim() || buildPresetPrompt(selectedPreset));
    setTestPrompt(getAgentBlueprint(selectedPreset.id)?.recommendedTestPrompt ?? "Teste cet agent sur une action concrète.");
    setSaveMessage("");
    setPipelineMessage(
      `${cleanCopy(selectedPreset.name)} est préconfiguré en mode ${mode === "config" ? "configuration" : "utilisation"}. Tu peux l'ajuster, le tester puis le sauvegarder.`,
    );
  }, [mode, selectedPreset]);

  const updateAgent = (patch: Partial<CustomAgentProject>) => {
    setAgent((current) => enforceAgentSafety({ ...current, ...patch, updatedAt: new Date().toISOString() }, current));
    setSaveMessage("");
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
    setIsGenerating(true);
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
      setTestResult(null);
      setSaveMessage("");
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
      setTestResult(null);
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

  const quality = validateAgentProject(agent);
  const activePermissions = new Set(agent.allowedActions ?? []);
  const visiblePermissions = isAdvanced ? agentPermissionCatalog : agentPermissionCatalog.slice(0, 4);

  return (
    <V2PageShell
      eyebrow="Agent Builder"
      title="Agent Studio"
      description="Crée un employé virtuel IA avec rôle, mission, permissions, chat de test et actions validables."
      action={
        <>
          <BuilderModeToggle />
          <Button onClick={() => void save()} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        </>
      }
    >
      <SEOHead title="Agent Studio | Pixelrises V2" description="Générateur officiel d'agents Pixelrises V2." noIndex />

      <BuilderToolbar className="mb-5" />

      <DataSourceLabel
        state={agent.dataState ?? "mock"}
        label={agent.dataState === "real" ? "Données réelles" : "Configuration sécurisée"}
        description="Le builder prépare l'agent, ses capacités et son chat de test. Aucune action externe automatique."
        className="mb-5"
      />

      {selectedPreset ? (
        <section className="mb-5 rounded-[24px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Agent préconfiguré</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{cleanCopy(selectedPreset.name)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{cleanCopy(selectedPreset.description)}</p>
            </div>
            <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
              Mode {mode === "config" ? "Configurer" : "Utiliser"}
            </Badge>
          </div>
        </section>
      ) : null}

      <main className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="space-y-5">
          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Brief agent</p>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Exemple : Crée un agent qui analyse mon site, propose des améliorations et prépare mes prochaines actions."
              className="mt-4 min-h-[132px] resize-none rounded-2xl border-white/[0.08] bg-black/25 text-base leading-7 text-white placeholder:text-white/35"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {quickCommands.map((command) => (
                <button
                  key={command}
                  type="button"
                  onClick={() => setPrompt(command)}
                  className="rounded-full border border-[#F5C542]/20 bg-[#F5C542]/[0.05] px-3 py-2 text-xs text-[#F5C542] transition hover:border-[#F5C542]/45 hover:bg-[#F5C542]/10"
                >
                  {command}
                </button>
              ))}
            </div>
            <Button
              onClick={() => void generateAgent()}
              disabled={isGenerating}
              className="mt-5 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766] disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isGenerating ? "Création..." : "Générer / renforcer l'agent"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-white/45">{pipelineMessage}</p>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Configuration</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Nom</span>
                <Input value={agent.name} onChange={(event) => updateAgent({ name: event.target.value })} className="rounded-2xl border-white/[0.08] bg-black/25" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Rôle</span>
                <Input value={agent.role} onChange={(event) => updateAgent({ role: event.target.value })} className="rounded-2xl border-white/[0.08] bg-black/25" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Domaine</span>
                <Input value={agent.domain} onChange={(event) => updateAgent({ domain: event.target.value })} className="rounded-2xl border-white/[0.08] bg-black/25" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold text-white/55">Autonomie</span>
                <select
                  value={agent.autonomyLevel ?? "proposals_validated"}
                  onChange={(event) => updateAgent({ autonomyLevel: event.target.value as AgentAutonomyLevel })}
                  className="h-10 w-full rounded-2xl border border-white/[0.08] bg-black/25 px-3 text-sm text-white outline-none"
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
                className="min-h-[82px] rounded-2xl border-white/[0.08] bg-black/25"
              />
            </label>
            <label className="mt-4 block space-y-2">
              <span className="text-xs font-semibold text-white/55">Instructions personnalisées</span>
              <Textarea
                value={agent.instructions}
                onChange={(event) => updateAgent({ instructions: event.target.value })}
                className="min-h-[98px] rounded-2xl border-white/[0.08] bg-black/25"
              />
            </label>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-[30px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Agent prêt à tester</p>
                <h2 className="mt-2 text-2xl font-semibold">{agent.name}</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">{agent.goal}</p>
              </div>
              <div className="flex flex-col gap-2">
                <DataBadge state={agent.dataState ?? "mock"} label={agent.dataState === "real" ? "Réel" : "Données locales"} />
                <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10">
                  Score {quality.score}/100
                </Badge>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                "Conseil et propositions",
                "Validation avant modification",
                "Aucune action externe automatique",
              ].map((rule) => (
                <div key={rule} className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-xs text-white/62">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-[#F5C542]" />
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">{isAdvanced ? "Permissions agents" : "Autorisations"}</p>
            {!isAdvanced ? (
              <p className="mt-2 text-sm leading-6 text-white/50">
                Mode simple : seules les capacités principales sont visibles. Les permissions détaillées restent dans le mode avancé.
              </p>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {visiblePermissions.map((permission) => (
                <button
                  key={permission.key}
                  type="button"
                  onClick={() => togglePermission(permission.key)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    activePermissions.has(permission.key)
                      ? "border-[#F5C542]/30 bg-[#F5C542]/[0.08]"
                      : "border-white/[0.08] bg-black/20 hover:border-white/[0.16]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{permission.label}</span>
                    {activePermissions.has(permission.key) ? (
                      <CheckCircle2 className="h-4 w-4 text-[#F5C542]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-white/28" />
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/48">{permission.description}</p>
                  {permission.requiresValidation ? <DataBadge state="example" label="Validation requise" className="mt-3" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Chat de test</p>
            <Textarea
              value={testPrompt}
              onChange={(event) => setTestPrompt(event.target.value)}
              className="mt-4 min-h-[94px] rounded-2xl border-white/[0.08] bg-black/25"
              placeholder="Teste une demande réelle avant d'activer l'agent."
            />
            <Button onClick={runAgentTest} className="mt-4 rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Sparkles className="h-4 w-4" />
              Tester l'agent
            </Button>

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
                <p className="mt-4 text-sm leading-6 text-white/70">{testResult.response}</p>
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <p className="font-semibold">{testResult.proposedAction.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/52">{testResult.proposedAction.description}</p>
                  <p className="mt-2 text-xs text-white/38">
                    Validation : {testResult.proposedAction.requiresConfirmation ? "obligatoire" : "non requise"}
                    {isAdvanced ? ` · Module : ${testResult.proposedAction.targetModule}` : ""}
                  </p>
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

          <div className="rounded-[24px] border border-white/[0.08] bg-black/25 p-4">
            <p className="flex gap-2 text-xs leading-5 text-white/48">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5C542]" />
              Les agents peuvent proposer des actions, mais aucun email, publication, connexion externe, paiement, crédit ou suppression n'est exécuté automatiquement.
            </p>
          </div>

          {saveMessage ? <p className="rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-3 text-sm text-[#F5C542]">{saveMessage}</p> : null}
        </section>
      </main>
    </V2PageShell>
  );
};

export default AgentBuilder;
