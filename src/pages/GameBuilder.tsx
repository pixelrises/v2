import { useMemo, useState } from "react";
import { CheckCircle2, Code2, Gamepad2, Loader2, Save, ShieldAlert, Wand2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { aiOrchestrator, pixelrisesAIProviderAdapter, runBackendAIOrchestrator } from "@/modules/ai";
import { createMockGameProject, validateGameProject, type GamePlatform, type GameProject } from "@/modules/creation-engine";
import { projectStorageAdapter } from "@/modules/storage/project-storage-adapter";
import { gameTemplateRegistry } from "@/modules/registries";
import { trackV2Event } from "@/v2/analytics";

const platforms: GamePlatform[] = ["Roblox", "Minecraft", "Fortnite / UEFN", "Web game"];
const gameTypes = ["Obby", "Tycoon", "Simulator", "Survival", "Horror", "Roleplay", "Mini-game", "Escape room", "Quiz", "Battle arena", "Idle game", "Adventure", "Puzzle", "Racing", "Zone wars", "Add-on", "Map"];

const GameBuilder = () => {
  const [brief, setBrief] = useState({
    title: "Pixel Quest",
    platform: "Roblox" as GamePlatform,
    gameType: "Obby",
    theme: "futuriste premium",
    targetAudience: "joueurs casual",
    freePrompt: "Créer un jeu accessible avec progression, récompenses et boucle claire.",
  });
  const [gameProject, setGameProject] = useState<GameProject>(() => createMockGameProject(brief));
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("Game Builder beta: backend Pixelrises utilise si disponible, mock garde en secours.");
  const quality = useMemo(() => validateGameProject(gameProject), [gameProject]);

  const generate = async () => {
    setIsGenerating(true);
    setPipelineMessage("Generation du blueprint via Pixelrises AI...");

    try {
      const backend = await runBackendAIOrchestrator({
        projectType: "game",
        mode: "build",
        prompt: brief.freePrompt,
        formData: brief,
      });
      const backendOutput = backend.normalizedOutput;
      let next: GameProject;
      let source = backend.source ?? "real";

      if (backend.success && backendOutput && "gameplay" in backendOutput) {
        next = backendOutput as GameProject;
        setPipelineMessage(
          backend.source === "mock-fallback"
            ? "Fallback backend utilise. Le blueprint reste beta et sans publication automatique."
            : backend.persisted
              ? "Blueprint reel cree et sauvegarde dans Supabase."
              : "Blueprint cree. Sauvegarde locale utilisee faute de session Supabase.",
        );
      } else {
        const orchestrated = await aiOrchestrator.run({
          prompt: brief.freePrompt,
          projectType: "game",
          mode: "qualite",
          context: brief,
        });
        next =
          orchestrated.projectType === "game" && orchestrated.output && "gameplay" in (orchestrated.output as GameProject)
            ? (orchestrated.output as GameProject)
            : await pixelrisesAIProviderAdapter.generateGame(brief);
        source = "mock-fallback";
        setPipelineMessage("Fallback frontend utilise. Le backend n'a pas retourne de jeu exploitable.");
      }

      setGameProject(next);
      await projectStorageAdapter.saveGame(next);
      trackV2Event("game_created", {
        platform: brief.platform,
        gameType: brief.gameType,
        orchestrator: source,
        qualityScore: backend.qualityGateResult?.score,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async () => {
    await projectStorageAdapter.saveGame(gameProject);
    await projectStorageAdapter.saveProject({
      id: gameProject.meta.projectId,
      type: "game",
      title: gameProject.meta.title,
      status: "generated",
      updatedAt: new Date().toISOString(),
      score: quality.score,
      payload: gameProject,
    });
    trackV2Event("game_created", { saved: true, platform: gameProject.meta.platform });
  };

  return (
    <V2PageShell
      title="Game Builder bêta"
      description="Transforme une idée de jeu en blueprint, gameplay loop, scripts/snippets, assets et checklist. Pixelrises ne publie jamais automatiquement sur Roblox, Minecraft ou Fortnite."
      action={
        <Badge className="rounded-2xl border-[#F5C542]/20 bg-[#F5C542]/10 px-4 py-2 text-[#F5C542] hover:bg-[#F5C542]/10">
          Bêta contrôlée
        </Badge>
      }
    >
      <SEOHead title="Game Builder bêta | Pixelrises V2" description="Game Builder Pixelrises V2." noIndex />

      <section className="grid gap-4 xl:grid-cols-[410px_1fr]">
        <aside className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-2xl font-semibold">Brief jeu</h2>
          </div>
          <div className="mt-5 space-y-3">
            <Input value={brief.title} onChange={(event) => setBrief({ ...brief, title: event.target.value })} placeholder="Nom du jeu" className="rounded-2xl border-white/[0.10] bg-black/35 text-white" />
            <select value={brief.platform} onChange={(event) => setBrief({ ...brief, platform: event.target.value as GamePlatform })} className="h-11 w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 text-sm text-white outline-none">
              {platforms.map((platform) => <option key={platform}>{platform}</option>)}
            </select>
            <select value={brief.gameType} onChange={(event) => setBrief({ ...brief, gameType: event.target.value })} className="h-11 w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 text-sm text-white outline-none">
              {gameTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <Input value={brief.theme} onChange={(event) => setBrief({ ...brief, theme: event.target.value })} placeholder="Thème" className="rounded-2xl border-white/[0.10] bg-black/35 text-white" />
            <Input value={brief.targetAudience} onChange={(event) => setBrief({ ...brief, targetAudience: event.target.value })} placeholder="Public cible" className="rounded-2xl border-white/[0.10] bg-black/35 text-white" />
            <Textarea value={brief.freePrompt} onChange={(event) => setBrief({ ...brief, freePrompt: event.target.value })} placeholder="Décris ton idée de jeu" className="min-h-[130px] rounded-2xl border-white/[0.10] bg-black/35 text-white" />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Button
              onClick={() => void generate()}
              disabled={isGenerating}
              className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766] disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isGenerating ? "Generation..." : "Générer blueprint"}
            </Button>
            <Button onClick={() => void save()} variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/42">{pipelineMessage}</p>
          <div className="mt-5 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-4">
            <div className="flex items-center gap-2 text-[#F5C542]">
              <ShieldAlert className="h-4 w-4" />
              <p className="text-sm font-semibold">Limite V2</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/62">
              Les scripts sont des snippets de départ. Tu dois les tester dans l'outil officiel de la plateforme.
            </p>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Blueprint</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">{gameProject.meta.title}</h2>
                <p className="mt-2 text-sm text-white/50">{gameProject.meta.platform} · {gameProject.meta.gameType} · {gameProject.meta.mode}</p>
              </div>
              <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                Quality {quality.score}/100
              </Badge>
            </div>
            <p className="mt-5 text-lg leading-8 text-white/72">{gameProject.concept.pitch}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["Core fantasy", gameProject.concept.coreFantasy],
                ["Player goal", gameProject.concept.playerGoal],
                ["Loop", gameProject.gameplay.loop],
              ].map(([title, value]) => (
                <div key={title} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
              <h3 className="text-xl font-semibold">Scripts / snippets</h3>
              <div className="mt-4 space-y-3">
                {gameProject.scripts.map((script) => (
                  <div key={script.name} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                    <div className="flex items-center gap-2 text-[#F5C542]">
                      <Code2 className="h-4 w-4" />
                      <p className="text-sm font-semibold">{script.name}</p>
                    </div>
                    <pre className="mt-3 max-h-44 overflow-auto rounded-xl bg-black/50 p-3 text-xs text-white/70">{script.code}</pre>
                    <p className="mt-3 text-sm leading-6 text-white/52">{script.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
              <h3 className="text-xl font-semibold">Checklist et assets</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Assets</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {gameProject.assets.map((asset) => (
                      <span key={asset.name} className="rounded-full border border-white/[0.08] bg-black/25 px-3 py-1 text-xs text-white/62">
                        {asset.type}: {asset.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Publication</p>
                  <div className="mt-3 space-y-2">
                    {gameProject.publishing.checklist.map((item) => (
                      <div key={item} className="flex gap-2 text-sm text-white/62">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Templates game registry</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {gameTemplateRegistry.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setBrief({ ...brief, platform: template.platform as GamePlatform, gameType: template.type })}
                    className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-left transition hover:border-[#F5C542]/25"
                  >
                    <Icon className="h-5 w-5 text-[#F5C542]" />
                    <p className="mt-3 font-semibold">{template.name}</p>
                    <p className="mt-1 text-xs text-white/42">{template.platform} · {template.type}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </V2PageShell>
  );
};

export default GameBuilder;
