import { useState } from "react";
import { Bot, Loader2, Save, Send } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { aiOrchestrator, runBackendAIOrchestrator } from "@/modules/ai";
import {
  createDefaultAgentProject,
  validateAgentProject,
  type CustomAgentProject,
} from "@/modules/creation-engine";
import { projectStorageAdapter } from "@/modules/storage/project-storage-adapter";
import { trackV2Event } from "@/v2/analytics";

const quickCommands = [
  "Cree un agent marketing pour mon site",
  "Cree un agent SEO qui audite mes pages",
  "Cree un agent support client pour mes prospects",
  "Cree un agent game design pour Roblox",
];

const inferRole = (prompt: string) => {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("seo")) return "SEO";
  if (normalized.includes("support")) return "Support client";
  if (normalized.includes("vente") || normalized.includes("lead")) return "Vente";
  if (normalized.includes("game") || normalized.includes("roblox") || normalized.includes("jeu")) return "Game design";
  if (normalized.includes("contenu") || normalized.includes("tiktok")) return "Creation de contenu";
  if (normalized.includes("business") || normalized.includes("strategie")) return "Business strategy";

  return "Marketing";
};

const createAgentName = (role: string) => `Agent ${role}`;

const buildAgentFromPrompt = (current: CustomAgentProject, prompt: string): CustomAgentProject => {
  const cleanPrompt = prompt.trim() || "Cree un agent business qui aide a developper mon projet Pixelrises.";
  const role = inferRole(cleanPrompt);
  const now = new Date().toISOString();

  return {
    ...current,
    name: createAgentName(role),
    role,
    goal: cleanPrompt,
    tone: role === "Support client" ? "calme, utile, rassurant" : "clair, direct, professionnel",
    domain: role === "Game design" ? "Jeux et experiences digitales" : "Business digital",
    level: role === "Game design" ? "advanced" : "simple",
    instructions: [
      "Analyser le contexte du projet.",
      "Proposer des recommandations concretes, priorisees et validables.",
      "Expliquer l'impact business ou produit de chaque proposition.",
      `Respecter la demande utilisateur: ${cleanPrompt}`,
    ].join(" "),
    avoid:
      "Ne jamais publier, envoyer, supprimer, modifier definitivement ou connecter un outil sans validation explicite de l'utilisateur.",
    projectContext: {
      ...current.projectContext,
      projectType: role === "Game design" ? "game" : "site",
      goal: cleanPrompt,
      niche: role,
      offer: "presence digitale, automatisation et recommandations IA",
    },
    permissions: {
      readProject: true,
      suggestChanges: true,
      editWithApproval: false,
      publishWithApproval: false,
      accessAnalytics: false,
      useIntegrations: false,
    },
    updatedAt: now,
  };
};

const AgentBuilder = () => {
  const [agent, setAgent] = useState<CustomAgentProject>(() => createDefaultAgentProject());
  const [prompt, setPrompt] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("Backend Pixelrises utilise si disponible, mock garde en secours.");

  const generateAgent = async () => {
    setIsGenerating(true);
    setPipelineMessage("Creation de l'agent via Pixelrises AI...");

    try {
      const backend = await runBackendAIOrchestrator({
        projectType: "agent",
        mode: "build",
        prompt: prompt.trim() || "Cree un agent business Pixelrises.",
        formData: {
          currentAgentId: agent.id,
          currentAgentName: agent.name,
        },
      });
      const backendOutput = backend.normalizedOutput;
      let nextAgent: CustomAgentProject;
      let source = backend.source ?? "real";

      if (backend.success && backendOutput && "permissions" in backendOutput) {
        nextAgent = backendOutput as CustomAgentProject;
        setPipelineMessage(
          backend.source === "mock-fallback"
            ? "Fallback backend utilise. Les permissions restent securisees."
            : backend.persisted
              ? "Agent cree et sauvegarde dans Supabase."
              : "Agent cree. Sauvegarde locale utilisee faute de session Supabase.",
        );
      } else {
        const orchestrated = await aiOrchestrator.run({
          prompt: prompt.trim() || "Cree un agent business Pixelrises.",
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
            ? (orchestrated.output as CustomAgentProject)
            : buildAgentFromPrompt(agent, prompt);
        source = "mock-fallback";
        setPipelineMessage("Fallback frontend utilise. Le backend n'a pas retourne d'agent exploitable.");
      }

      setAgent(nextAgent);
      setHasGenerated(true);
      setSaveMessage("");
      await projectStorageAdapter.saveAgent(nextAgent);
      trackV2Event("agent_created", {
        agentName: nextAgent.name,
        role: nextAgent.role,
        source,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async () => {
    const updated = { ...agent, updatedAt: new Date().toISOString() };
    const quality = validateAgentProject(updated);

    await projectStorageAdapter.saveAgent(updated);
    const saved = await projectStorageAdapter.saveProject({
      id: updated.id,
      type: "agent",
      title: updated.name,
      status: "generated",
      updatedAt: updated.updatedAt,
      score: quality.score,
      payload: updated,
    });

    setSaveMessage(
      saved.persisted ? `${updated.name} est sauvegarde dans Supabase.` : `${updated.name} est sauvegarde en local.`,
    );
    trackV2Event("agent_created", {
      agentName: updated.name,
      role: updated.role,
      source: "agent_studio_save",
    });
  };

  return (
    <V2PageShell
      title="Agent Studio"
      description="Cree un agent Pixelrises depuis un prompt simple."
      hideHeader
    >
      <SEOHead title="Agent Studio | Pixelrises V2" description="Generateur officiel d'agents Pixelrises V2." noIndex />

      <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-4xl flex-col items-center justify-center px-4 py-8">
        <div className="w-full text-center">
          <h1 className="text-4xl font-medium tracking-[-0.04em] text-white/82 sm:text-5xl">Agent Studio</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            Decris l'agent dont tu as besoin. Pixelrises le prepare avec une configuration claire et des actions qui restent toujours validables.
          </p>
        </div>

        <section className="mt-7 w-full rounded-[32px] border border-[#F5C542]/20 bg-[#17120a]/95 p-4 shadow-[0_35px_130px_-90px_rgba(245,197,66,0.85)]">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void generateAgent();
              }
            }}
            placeholder="Exemple : Cree un agent qui analyse mon site, propose des ameliorations et prepare mes prochaines actions."
            className="min-h-[148px] resize-none border-0 bg-transparent px-2 py-2 text-base leading-7 text-white shadow-none placeholder:text-white/42 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="mt-4 flex justify-end border-t border-[#F5C542]/10 pt-4">
            <Button
              onClick={() => void generateAgent()}
              disabled={isGenerating}
              className="rounded-2xl bg-[#F5C542] px-5 text-black hover:bg-[#FFD766] disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isGenerating ? "Creation..." : "Generer l'agent"}
            </Button>
          </div>
        </section>

        <p className="mt-3 text-center text-xs text-white/42">{pipelineMessage}</p>

        <section className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {quickCommands.map((command) => (
            <button
              key={command}
              type="button"
              onClick={() => setPrompt(command)}
              className="rounded-full border border-[#F5C542]/20 bg-[#F5C542]/[0.05] px-4 py-2 text-sm text-[#F5C542] transition hover:border-[#F5C542]/45 hover:bg-[#F5C542]/10"
            >
              {command}
            </button>
          ))}
        </section>

        {hasGenerated ? (
          <section className="mt-7 flex w-full flex-col gap-4 rounded-[28px] border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5C542] text-black">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5C542]">Agent pret</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{agent.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{agent.goal}</p>
                {saveMessage ? <p className="mt-3 text-sm text-[#F5C542]">{saveMessage}</p> : null}
              </div>
            </div>

            <Button onClick={() => void save()} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </section>
        ) : null}
      </main>
    </V2PageShell>
  );
};

export default AgentBuilder;
