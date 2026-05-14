import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Code2,
  Download,
  FileJson,
  FileText,
  Flag,
  FolderKanban,
  Gamepad2,
  Gauge,
  History,
  Layers3,
  Loader2,
  PackageCheck,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { DataBadge, DataSourceLabel, EmptyState } from "@/components/ui/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BuilderModeToggle, BuilderSafeNotice, BuilderToolbar } from "@/components/v2/BuilderShell";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { useInterfaceMode } from "@/hooks/use-interface-mode";
import type { DataState } from "@/lib/data-state";
import { aiOrchestrator } from "@/modules/ai";
import type { GamePlatform, GameProject } from "@/modules/creation-engine";
import { gameTemplateRegistry } from "@/modules/registries";
import { projectStorageAdapter } from "@/modules/storage/project-storage-adapter";
import type { StoredProject } from "@/modules/storage/v2-storage";
import {
  buildGamePlan,
  buildGameProductionPackage,
  createGameMarkdownExport,
  createGameVersionRecord,
  downloadGameExport,
  gameAIRoles,
  gameProjectQualityFromPackage,
  improveGamePackage,
  readGameVersionsLocal,
  saveGameVersionLocal,
  toGameProject,
  type GameBuildMode,
  type GameBuilderBriefInput,
  type GameProductionPackage,
  type GameVersionRecord,
  type WebPrototypeConfig,
} from "@/modules/game-builder";
import { trackV2Event } from "@/v2/analytics";

type SelectFieldProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

type GameSuggestion = Required<GameBuilderBriefInput> & {
  badge: string;
};

const platforms: GamePlatform[] = ["Web game", "Roblox", "Minecraft", "Fortnite / UEFN"];
const gameTypes = ["Quiz", "Clicker", "Obby", "Tycoon", "Runner", "Reflex", "RPG", "Mini-game", "Escape room", "Survival", "Idle game", "Puzzle"];
const subGenres = ["Feedback rapide", "Progression", "Checkpoints", "Économie", "Exploration", "Coop", "Puzzle", "Créatif", "Score attack"];
const audiences = ["Joueurs casual", "10-18 ans", "Ados", "Famille", "Créateurs Roblox", "Joueurs compétitifs", "Communauté école", "Formation / business"];
const deliverableOptions = ["Plan Mode", "Prototype Mode", "Scripts / Snippets", "Assets prompts", "Checklist", "Export"];

const defaultBrief: Required<GameBuilderBriefInput> = {
  title: "Pixel Challenge",
  platform: "Web game",
  gameType: "Quiz",
  subGenre: "Feedback rapide",
  theme: "Quiz web avec score, niveaux et feedback immédiat",
  targetAudience: "Joueurs casual",
  freePrompt: "Créer un jeu quiz web avec score, niveaux, feedback, restart et progression claire.",
};

const quickSuggestions: GameSuggestion[] = [
  {
    title: "Pixel Quiz Sprint",
    badge: "Web jouable",
    platform: "Web game",
    gameType: "Quiz",
    subGenre: "Feedback rapide",
    targetAudience: "Joueurs casual",
    theme: "Quiz web rapide avec score, niveaux, feedback et restart.",
    freePrompt: "Créer un jeu quiz web avec score, niveaux et feedback.",
  },
  {
    title: "Upgrade Clicker Lab",
    badge: "Prototype",
    platform: "Web game",
    gameType: "Clicker",
    subGenre: "Progression",
    targetAudience: "Joueurs casual",
    theme: "Clicker game avec points, upgrades simples, score cible et restart.",
    freePrompt: "Créer un clicker game avec points, upgrades simples et restart.",
  },
  {
    title: "Checkpoint Obby",
    badge: "Roblox",
    platform: "Roblox",
    gameType: "Obby",
    subGenre: "Checkpoints",
    targetAudience: "10-18 ans",
    theme: "Obby Roblox avec 5 zones, checkpoints et récompense cosmetic.",
    freePrompt: "Créer un obby Roblox avec 5 zones, checkpoints et récompense.",
  },
  {
    title: "Base Tycoon Core",
    badge: "Roblox",
    platform: "Roblox",
    gameType: "Tycoon",
    subGenre: "Économie",
    targetAudience: "Créateurs Roblox",
    theme: "Tycoon Roblox avec progression de base, score, upgrades et récompenses.",
    freePrompt: "Créer un tycoon Roblox avec progression de base, score et récompenses.",
  },
  {
    title: "UEFN Score Island",
    badge: "UEFN",
    platform: "Fortnite / UEFN",
    gameType: "Mini-game",
    subGenre: "Score attack",
    targetAudience: "Joueurs compétitifs",
    theme: "Île UEFN avec objectifs courts, score, timer et feedback HUD.",
    freePrompt: "Créer une île UEFN avec objectifs courts, score et timer.",
  },
  {
    title: "Minecraft Quest Map",
    badge: "Minecraft",
    platform: "Minecraft",
    gameType: "Survival",
    subGenre: "Exploration",
    targetAudience: "Famille",
    theme: "Map Minecraft avec objectifs, score, progression et zones à débloquer.",
    freePrompt: "Créer une map Minecraft avec objectifs, score et progression.",
  },
];

const platformOutputs: Record<GamePlatform, string[]> = {
  "Web game": ["Prototype jouable", "Score / restart", "Niveaux", "Export JSON/Markdown"],
  Roblox: ["Roblox Studio", "ServerScriptService", "StarterGui", "Checkpoints", "Luau snippets"],
  Minecraft: ["Behavior pack", "manifest.json", "Scoreboard", "Functions", "Test manuel"],
  "Fortnite / UEFN": ["UEFN Island", "Devices", "Score Manager", "Timer", "Pseudo Verse"],
};

const modeTabs: Array<{ id: GameBuildMode; label: string; description: string }> = [
  { id: "plan", label: "Plan", description: "Brief enrichi et structure game design." },
  { id: "prototype", label: "Prototype", description: "Preview jouable web ou package plateforme." },
  { id: "improve", label: "Improve", description: "Amélioration ciblée et versioning." },
  { id: "export", label: "Export", description: "JSON, Markdown, scripts et checklist." },
];

const improveAreas = [
  { id: "concept", label: "Concept" },
  { id: "gameplay", label: "Gameplay loop" },
  { id: "levels", label: "Niveaux" },
  { id: "scripts", label: "Scripts" },
  { id: "assets", label: "Assets prompts" },
  { id: "checklist", label: "Checklist" },
  { id: "prototype", label: "Prototype web" },
] as const;

const stateLabel = (state: DataState) => {
  if (state === "real") return "Préparation complète";
  if (state === "mock") return "Données locales";
  if (state === "example") return "Exemple";
  return undefined;
};

const getPlatformLabel = (platform: GamePlatform) => {
  if (platform === "Roblox") return "Roblox Studio";
  if (platform === "Minecraft") return "Minecraft Bedrock";
  if (platform === "Fortnite / UEFN") return "UEFN";
  return "Prototype Web Pixelrises";
};

const qualityColor = (status: "pass" | "warning" | "fail") => {
  if (status === "pass") return "text-emerald-300";
  if (status === "warning") return "text-[#F5C542]";
  return "text-red-300";
};

const gameSafetyPromise = "Pixelrises ne publie pas automatiquement";
const gameBuilderFallbackSource = "frontend-fallback";

const enforceGameBetaSafety = (gamePackage: GameProductionPackage): GameProductionPackage => ({
  ...gamePackage,
  limitations: Array.from(new Set([...gamePackage.limitations, gameSafetyPromise])),
});

const SelectField = ({ icon: Icon, label, value, options, onChange }: SelectFieldProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative block"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex h-12 w-full items-center gap-3 rounded-[14px] border border-white/[0.10] bg-black/28 px-3 text-left text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[#F5C542]/30"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{value}</span>
        <ChevronDown className={`h-4 w-4 text-white/42 transition ${open ? "rotate-180 text-[#F5C542]" : ""}`} />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-[16px] border border-[#F5C542]/20 bg-[#080808] p-2 shadow-[0_24px_70px_-35px_rgba(245,197,66,0.65)]"
        >
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm transition ${
                  selected ? "bg-[#F5C542] font-semibold text-black" : "text-white/72 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {option}
                {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const persistGameProject = async (gamePackage: GameProductionPackage, summary: string) => {
  const safeGamePackage = enforceGameBetaSafety(gamePackage);
  const gameProject: GameProject = toGameProject(safeGamePackage);
  const quality = gameProjectQualityFromPackage(gamePackage);
  const storedProject: StoredProject = {
    id: gameProject.meta.projectId,
    type: "game",
    title: gameProject.meta.title,
    status: quality.passed ? "generated" : "draft",
    updatedAt: new Date().toISOString(),
    score: quality.score,
    payload: gameProject,
  };

  const savedGame = await projectStorageAdapter.saveGame(gameProject);
  const savedProject = await projectStorageAdapter.saveProject(storedProject);
  await projectStorageAdapter.saveVersion(storedProject, summary);

  return {
    persisted: savedGame.persisted || savedProject.persisted,
    fallback: savedProject.persisted ? "supabase" : gameBuilderFallbackSource,
  };
};

const PlayableWebPrototype = ({ config }: { config: WebPrototypeConfig }) => {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(config.objective);
  const [combo, setCombo] = useState(0);
  const currentLevel = [...config.levels].reverse().find((level) => score >= level.target) ?? config.levels[0];
  const completed = score >= config.scoreTarget;
  const progress = Math.max(4, Math.min(100, (score / config.scoreTarget) * 100));

  const play = (points: number) => {
    setStarted(true);
    setCombo((value) => value + 1);
    setScore((value) => Math.min(config.scoreTarget, value + points));
  };

  const testAction = (action: WebPrototypeConfig["actions"][number]) => {
    play(action.points);
    setLastFeedback(action.feedback);
  };

  const reset = () => {
    setStarted(false);
    setScore(0);
    setCombo(0);
    setLastFeedback(config.objective);
  };

  return (
    <div className="overflow-hidden rounded-[26px] border border-[#F5C542]/20 bg-[#050505] shadow-[0_28px_90px_-60px_rgba(245,197,66,0.85)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.035] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#F5C542]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 rounded-full border border-white/[0.08] bg-black/30 px-3 py-1 text-xs font-semibold text-white/54">
            Preview jouable Pixelrises
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataBadge state="mock" label="Test local" />
          <DataBadge state="example" label="Aucune publication" />
        </div>
      </div>

      <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <DataBadge state="mock" label="Prototype jouable local" />
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{config.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{config.objective}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-white/42">Score</p>
          <p className="mt-1 text-4xl font-semibold tracking-[-0.06em] text-[#F5C542]">{score}</p>
          <p className="text-xs text-white/42">cible {config.scoreTarget}</p>
        </div>
      </div>

      <div className="mt-5 rounded-full border border-white/[0.08] bg-black/30 p-1">
        <div
          className="h-3 rounded-full bg-[linear-gradient(90deg,#F5C542,#64E64A)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="relative mt-5 grid min-h-[240px] place-items-center overflow-hidden rounded-[24px] border border-white/[0.10] bg-[radial-gradient(circle_at_50%_0%,rgba(245,197,66,0.22),transparent_34%),linear-gradient(145deg,#10100c_0%,#050505_62%,#171203_100%)] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        tabIndex={0}
        role="application"
        aria-label="Prototype jouable du jeu"
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && config.actions[0]) {
            event.preventDefault();
            testAction(config.actions[0]);
          }
        }}
      >
        <div className="absolute inset-x-8 bottom-7 h-3 rounded-full bg-[#F5C542]/25 blur-md" />
        <div className="absolute left-[12%] top-[22%] h-10 w-10 rotate-12 rounded-xl border border-[#F5C542]/35 bg-[#F5C542]/10" />
        <div className="absolute right-[16%] top-[18%] h-12 w-12 rounded-full border border-white/[0.10] bg-white/[0.04]" />
        <div className="absolute bottom-[20%] right-[22%] h-8 w-20 rounded-full border border-emerald-300/20 bg-emerald-300/10" />
        <div className="relative z-10 max-w-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#F5C542]/30 bg-[#F5C542]/10 text-[#F5C542] shadow-[0_0_55px_-25px_rgba(245,197,66,0.9)]">
            {completed ? <Trophy className="h-9 w-9" /> : started ? <Gamepad2 className="h-9 w-9" /> : <Play className="h-9 w-9" />}
          </div>
          <p className="mt-5 text-xl font-semibold text-white">
            {completed ? "Victoire : boucle testee" : started ? `Niveau : ${currentLevel.name}` : "Clique pour essayer le jeu"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/52">
            {completed ? "Le score, la progression et le restart fonctionnent dans la preview." : lastFeedback}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {config.controls.map((control) => (
              <span key={control} className="rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-white/58">
                {control}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {config.actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => testAction(action)}
            className="rounded-[18px] border border-white/[0.08] bg-white/[0.045] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#F5C542]/35 hover:bg-[#F5C542]/[0.065] focus:outline-none focus:ring-2 focus:ring-[#F5C542]/35"
          >
            <p className="flex items-center justify-between gap-3 text-sm font-semibold text-white">
              {action.label}
              <span className="rounded-full bg-[#F5C542]/10 px-2 py-1 text-xs text-[#F5C542]">+{action.points}</span>
            </p>
            <p className="mt-1 text-xs text-white/45">{action.feedback}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-white/[0.08] bg-black/20 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Tester le jeu cree</p>
          <p className="text-sm font-semibold text-white">
            {completed ? "Victoire atteinte" : started ? `Niveau actuel : ${currentLevel.name}` : "Prêt à lancer"}
          </p>
          <p className="mt-1 text-xs text-white/38">Combo actuel : {combo}</p>
          <p className="mt-1 text-xs text-white/45">{completed ? "Le restart peut être testé maintenant." : currentLevel.feedback}</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (config.actions[0]) testAction(config.actions[0]);
          }}
          className="rounded-[12px] bg-[#F5C542] text-black hover:bg-[#FFD766]"
        >
          <Play className="h-4 w-4" />
          {started ? "Continuer" : config.startLabel}
        </Button>
        <Button
          type="button"
          onClick={reset}
          variant="outline"
          className="rounded-[12px] border-white/[0.10] bg-black/25 text-white/80 hover:bg-white/[0.06]"
        >
          <RefreshCw className="h-4 w-4" />
          Restart
        </Button>
      </div>
    </div>
    </div>
  );
};

const GameBuilder = () => {
  const { isAdvanced, isSimple } = useInterfaceMode();
  const [brief, setBrief] = useState<Required<GameBuilderBriefInput>>(defaultBrief);
  const [activeMode, setActiveMode] = useState<GameBuildMode>("plan");
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>(deliverableOptions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("Décris ton jeu pour générer un prototype ou package exploitable. Aucune publication automatique.");
  const [saveState, setSaveState] = useState<DataState>("mock");
  const [versions, setVersions] = useState<GameVersionRecord[]>([]);
  const [selectedImproveArea, setSelectedImproveArea] = useState<(typeof improveAreas)[number]["id"]>("gameplay");
  const [improveInstruction, setImproveInstruction] = useState("Rendre plus fun et plus simple à tester sans ajouter de dépendance lourde.");
  const [gamePackage, setGamePackage] = useState<GameProductionPackage>(() =>
    buildGameProductionPackage(defaultBrief, {
      dataState: "mock",
      sourceSummary: "Prototype initial local, sans recherche live.",
      mode: "plan",
    }),
  );

  const plan = useMemo(() => buildGamePlan(brief), [brief]);
  const qualityDegrees = Math.max(0, Math.min(100, gamePackage.qualityScores.score)) * 3.6;

  useEffect(() => {
    trackV2Event("builder_opened", { builder: "game", phase: "phase-8" }, { module: "game-builder" });
  }, []);

  useEffect(() => {
    setVersions(readGameVersionsLocal(gamePackage.gameId));
  }, [gamePackage.gameId]);

  const toggleDeliverable = (deliverable: string) => {
    setSelectedDeliverables((current) =>
      current.includes(deliverable) ? current.filter((item) => item !== deliverable) : [...current, deliverable],
    );
  };

  const updateBrief = (patch: Partial<Required<GameBuilderBriefInput>>) => {
    setBrief((current) => ({ ...current, ...patch }));
  };

  const selectSuggestion = (suggestion: GameSuggestion) => {
    setBrief({
      title: suggestion.title,
      platform: suggestion.platform,
      gameType: suggestion.gameType,
      subGenre: suggestion.subGenre,
      targetAudience: suggestion.targetAudience,
      theme: suggestion.theme,
      freePrompt: suggestion.freePrompt,
    });
    setPipelineMessage(`${suggestion.title} chargé. Plan Mode prêt, génère le package pour appliquer cette direction.`);
    setActiveMode("plan");
  };

  const persistAndVersion = async (
    nextPackage: GameProductionPackage,
    sourceAction: GameVersionRecord["sourceAction"],
    changedArea: string,
    summary: string,
  ) => {
    const saved = await persistGameProject(nextPackage, summary);
    const dataState: DataState = saved.persisted ? "real" : "mock";
    const version = createGameVersionRecord(nextPackage, sourceAction, changedArea, summary, dataState);
    saveGameVersionLocal(version);
    setVersions(readGameVersionsLocal(nextPackage.gameId));
    setSaveState(dataState);
    return dataState;
  };

  const generate = async () => {
    setIsGenerating(true);
    setPipelineMessage("Préparation du prototype et du package...");

    try {
      const orchestrated = await aiOrchestrator.run({
        prompt: `${brief.freePrompt}\nPlateforme: ${brief.platform}\nGenre: ${brief.gameType}\nSous-genre: ${brief.subGenre}\nLivrables: ${selectedDeliverables.join(", ")}`,
        projectType: "game",
        mode: "qualite",
        context: {
          ...brief,
          deliverables: selectedDeliverables,
          gameIntelligenceLayer: true,
          prototypeMode: true,
          roles: gameAIRoles,
        },
      });
      const hasNonMockProvider = orchestrated.providerResults.some((result) => result.providerId !== "mock");
      const nextPackage = buildGameProductionPackage(brief, {
        dataState: hasNonMockProvider ? "real" : "mock",
        routedTasks: orchestrated.tasks,
        sourceSummary: hasNonMockProvider
          ? "Prototype préparé avec vérification complète."
          : "Prototype préparé avec les données disponibles, sans recherche live.",
        mode: "prototype",
      });
      setGamePackage(nextPackage);
      const dataState = await persistAndVersion(nextPackage, "generate", "full_package", "Package Game Builder généré avec Prototype Mode.");
      setActiveMode("prototype");
      setPipelineMessage(
        dataState === "real"
          ? "Package généré et sauvegardé en cloud. Test manuel requis avant toute publication."
          : "Package généré. Sauvegarde locale temporaire utilisée.",
      );
      trackV2Event(
        "game_created",
        {
          platform: nextPackage.platform,
          genre: nextPackage.genre,
          prototypeMode: nextPackage.prototypePreview.mode,
          qualityScore: nextPackage.qualityScores.score,
        },
        { module: "game-builder", projectId: nextPackage.gameId },
      );
    } catch {
      const fallbackPackage = buildGameProductionPackage(brief, {
        dataState: "mock",
        sourceSummary: "Package préparé en mode sécurisé.",
        mode: "prototype",
      });
      setGamePackage(fallbackPackage);
      await persistAndVersion(fallbackPackage, "generate", "fallback_package", "Package de secours Game Builder.");
      setActiveMode("prototype");
      setPipelineMessage("Package bêta créé en mode sécurisé. Aucun détail technique n'est affiché.");
      trackV2Event("error_occurred", { module: "game-builder", phase: "phase-8", fallback: true }, { module: "game-builder" });
    } finally {
      setIsGenerating(false);
    }
  };

  const improve = async () => {
    const nextPackage = improveGamePackage(gamePackage, selectedImproveArea, improveInstruction);
    setGamePackage(nextPackage);
    const dataState = await persistAndVersion(nextPackage, "improve", selectedImproveArea, `Improve Mode ciblé : ${selectedImproveArea}.`);
    setPipelineMessage(
      dataState === "real"
        ? `Amélioration ${selectedImproveArea} sauvegardée. Vérification relancée.`
        : `Amélioration ${selectedImproveArea} appliquée. Vérification relancée.`,
    );
    trackV2Event(
      "project_improved",
      { type: "game", area: selectedImproveArea, qualityScore: nextPackage.qualityScores.score },
      { module: "game-builder", projectId: nextPackage.gameId },
    );
  };

  const resetProject = () => {
    setBrief(defaultBrief);
    const nextPackage = buildGameProductionPackage(defaultBrief, { dataState: "mock", mode: "plan" });
    setGamePackage(nextPackage);
    setVersions([]);
    setSaveState("mock");
    setActiveMode("plan");
    setPipelineMessage("Nouveau projet prêt. Complète le brief puis génère le prototype/package.");
  };

  const exportPackage = async (format: "json" | "markdown") => {
    downloadGameExport(gamePackage, format);
    await persistAndVersion(gamePackage, "export", format, `Export ${format} préparé.`);
    setPipelineMessage(format === "json" ? "Export JSON préparé. Aucune publication automatique." : "Export Markdown préparé. Test manuel requis.");
    trackV2Event("export_requested", { type: "game", format }, { module: "game-builder", projectId: gamePackage.gameId });
  };

  const markdownPreview = useMemo(() => createGameMarkdownExport(gamePackage).slice(0, 900), [gamePackage]);

  return (
    <V2PageShell
      title="Game Builder Bêta"
      description="Transforme une idée en prototype web jouable ou package Roblox, Minecraft ou UEFN exploitable. Publication automatique interdite."
      action={
        <div className="flex flex-wrap gap-3">
          <BuilderModeToggle />
          <Button asChild variant="outline" className="h-12 rounded-[14px] border-white/[0.10] bg-black/25 px-5 text-white/82 hover:bg-white/[0.06]">
            <Link to="/projects">
              <FolderKanban className="h-4 w-4" />
              Voir mes projets
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-[14px] border-white/[0.10] bg-black/25 px-5 text-white/82 hover:bg-white/[0.06]">
            <Link to="/agents">
              <Bot className="h-4 w-4" />
              Mes agents
            </Link>
          </Button>
          <Button onClick={resetProject} className="h-12 rounded-[14px] bg-[#F5C542] px-7 font-semibold text-black shadow-[0_0_34px_-18px_rgba(245,197,66,0.8)] hover:bg-[#FFD766]">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </div>
      }
    >
      <SEOHead title="Game Builder bêta | Pixelrises V2" description="Game Builder Pixelrises V2 avec Prototype Mode." noIndex />

      <BuilderToolbar className="mb-5" />

      <div className="grid gap-4 xl:grid-cols-[410px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-[22px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#F5C542]/30 bg-[#F5C542]/10 text-xs font-bold text-[#F5C542]">1</span>
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Brief du jeu</h2>
            </div>

            <label className="mt-5 block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">Concept du jeu</span>
              <Textarea
                value={brief.freePrompt}
                onChange={(event) => updateBrief({ freePrompt: event.target.value, theme: event.target.value })}
                placeholder="Décris le concept, la boucle, la plateforme, le style et le public cible..."
                className="mt-2 min-h-[124px] rounded-[16px] border-white/[0.10] bg-black/30 p-4 text-sm leading-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-white/28"
              />
            </label>
            <p className="mt-1 text-right text-[11px] text-white/40">{brief.freePrompt.length} / 1000</p>

            <div className="mt-4 grid gap-3">
              <SelectField icon={Gamepad2} label="Plateforme cible" value={brief.platform} options={platforms} onChange={(value) => updateBrief({ platform: value as GamePlatform })} />
              <SelectField icon={Layers3} label="Genre principal" value={brief.gameType} options={gameTypes} onChange={(value) => updateBrief({ gameType: value })} />
              <SelectField icon={Target} label="Sous-genre" value={brief.subGenre} options={subGenres} onChange={(value) => updateBrief({ subGenre: value })} />
              <SelectField icon={Bot} label="Audience cible" value={brief.targetAudience} options={audiences} onChange={(value) => updateBrief({ targetAudience: value })} />
            </div>

            <div className="mt-5 border-t border-white/[0.08] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">Livrables souhaités</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {deliverableOptions.map((deliverable) => {
                  const selected = selectedDeliverables.includes(deliverable);
                  return (
                    <button
                      key={deliverable}
                      type="button"
                      onClick={() => toggleDeliverable(deliverable)}
                      className={`rounded-[12px] border px-3 py-2 text-xs font-semibold transition ${
                        selected
                          ? "border-[#F5C542]/35 bg-[#F5C542]/12 text-[#F5C542]"
                          : "border-white/[0.08] bg-white/[0.035] text-white/42 hover:text-white/72"
                      }`}
                    >
                      {deliverable}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={() => void generate()}
              disabled={isGenerating}
              className="mt-6 h-12 w-full rounded-[14px] bg-[#F5C542] font-semibold text-black shadow-[0_0_36px_-18px_rgba(245,197,66,0.9)] hover:bg-[#FFD766] disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isGenerating ? "Génération..." : "Générer prototype / package"}
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-white/42">Prototype sécurisé · Données non publiées</p>
          </section>

          <section className="rounded-[22px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Exemples rapides</p>
              <span className="rounded-full border border-white/[0.08] bg-black/25 px-2 py-1 text-[10px] text-white/48">6 tests</span>
            </div>
            <div className="mt-3 grid gap-2">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion.title}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="rounded-[12px] border border-white/[0.08] bg-black/24 p-3 text-left transition hover:border-[#F5C542]/30 hover:bg-[#F5C542]/[0.06]"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white/82">{suggestion.title}</span>
                    <span className="rounded-full bg-[#F5C542]/10 px-2 py-1 text-[10px] font-semibold text-[#F5C542]">{suggestion.badge}</span>
                  </span>
                  <span className="mt-1 block text-xs text-white/44">
                    {suggestion.platform} · {suggestion.gameType} · {suggestion.subGenre}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <DataSourceLabel
            state={gamePackage.dataState}
            label={stateLabel(gamePackage.dataState)}
            description={gamePackage.sourceSummary}
          />
        </aside>

        <main className="space-y-4">
          <section className="rounded-[22px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4">
            <div className="grid gap-2 md:grid-cols-4">
              {modeTabs.map((mode) => {
                const active = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setActiveMode(mode.id)}
                    className={`rounded-[16px] border p-4 text-left transition ${
                      active ? "border-[#F5C542]/45 bg-[#F5C542]/10 text-white" : "border-white/[0.08] bg-black/18 text-white/58 hover:border-white/[0.16]"
                    }`}
                  >
                    <p className="text-sm font-semibold">{mode.label}</p>
                    <p className="mt-1 text-xs leading-5 text-white/45">{mode.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[22px] border border-white/[0.10] bg-[radial-gradient(circle_at_top_right,rgba(245,197,66,0.12),rgba(255,255,255,0.045)_34%,rgba(255,255,255,0.02))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <DataBadge state={gamePackage.dataState} label={stateLabel(gamePackage.dataState)} />
                  <DataBadge state="example" label="Bêta premium" />
                  <DataBadge state="mock" label="Test manuel requis" />
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">{gamePackage.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
                  {gamePackage.platform} · {gamePackage.genre} · {gamePackage.coreFantasy}
                </p>
              </div>
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full p-2"
                style={{ background: `conic-gradient(#F5C542 0deg, #F5C542 ${qualityDegrees}deg, rgba(255,255,255,0.10) ${qualityDegrees}deg)` }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#080808]">
                  <span className="text-3xl font-semibold tracking-[-0.06em]">{gamePackage.qualityScores.score}</span>
                  <span className="text-[11px] text-white/45">/100</span>
                  <span className="text-xs text-white/52">Qualité</span>
                </div>
              </div>
            </div>

            {activeMode === "plan" ? (
              <div className={`mt-5 grid gap-4 ${isAdvanced ? "xl:grid-cols-[1.1fr_0.9fr]" : ""}`}>
                <section className="rounded-[18px] border border-white/[0.08] bg-black/22 p-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[#F5C542]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Plan Mode jeu</h3>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {[
                      ["Plateforme", plan.platform],
                      ["Genre", plan.genre],
                      ["Promesse", plan.promise],
                      ["Complexité", plan.complexity],
                      ["Gameplay loop", plan.gameplayLoop],
                      ["Prochaine action", plan.nextAction],
                    ].map(([label, value]) => (
                      <article key={label} className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">{label}</p>
                        <p className="mt-2 text-sm leading-6 text-white/70">{value}</p>
                      </article>
                    ))}
                  </div>
                  <div className="mt-5 rounded-[16px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-4">
                    <p className="text-sm font-semibold text-[#F5C542]">Hypothèses affichées, pas inventées comme vérités</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/58">
                      {plan.assumptions.map((assumption) => (
                        <li key={assumption} className="flex gap-2">
                          <Circle className="mt-1 h-3.5 w-3.5 shrink-0 text-[#F5C542]" />
                          {assumption}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {isSimple ? (
                    <div className="mt-5">
                      <BuilderSafeNotice>
                        Le Game Builder prépare un prototype ou package. Roblox, UEFN et Minecraft demandent toujours une intégration manuelle dans leur outil officiel.
                      </BuilderSafeNotice>
                    </div>
                  ) : null}
                </section>

                {isAdvanced ? (
                <section className="rounded-[18px] border border-white/[0.08] bg-black/22 p-5">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-[#F5C542]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Étapes avancées</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/56">
                    Les étapes de conception, scripts, assets et vérification restent regroupées ici pour les utilisateurs avancés.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(gamePackage.routingRoles.length
                      ? gamePackage.routingRoles
                      : gameAIRoles.map((role) => ({ role, taskType: role, status: "ready" }))).map((role) => (
                      <span key={`${role.role}-${role.taskType}`} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/62">
                        {role.role}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-4">
                    <p className="text-sm font-semibold text-white">Sorties {brief.platform}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {platformOutputs[brief.platform].map((output) => (
                        <span key={output} className="rounded-lg border border-[#F5C542]/15 bg-[#F5C542]/[0.055] px-2.5 py-1 text-[11px] font-medium text-[#F5C542]">
                          {output}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
                ) : null}
              </div>
            ) : null}

            {activeMode === "prototype" ? (
              <div className="mt-5 space-y-4">
                {gamePackage.prototypePreview.webGame ? (
                  <PlayableWebPrototype config={gamePackage.prototypePreview.webGame} />
                ) : (
                  <section className="rounded-[24px] border border-[#F5C542]/20 bg-[#F5C542]/[0.045] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <DataBadge state="mock" label="Package plateforme" />
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{getPlatformLabel(gamePackage.platform)}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{gamePackage.prototypePreview.summary}</p>
                      </div>
                      <DataBadge state="example" label="À intégrer manuellement" />
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {gamePackage.prototypePreview.platformPreview.map((step, index) => (
                        <article key={step} className="rounded-[16px] border border-white/[0.08] bg-black/24 p-4">
                          <p className="text-xs font-semibold text-[#F5C542]">Étape {index + 1}</p>
                          <p className="mt-2 text-sm leading-6 text-white/68">{step}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                <div className="grid gap-4 xl:grid-cols-3">
                  <section className="rounded-[18px] border border-white/[0.10] bg-black/22 p-5 xl:col-span-2">
                    <div className="flex items-center gap-3">
                      <Flag className="h-5 w-5 text-[#F5C542]" />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Niveaux / zones</h3>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {gamePackage.levelsOrZones.map((zone) => (
                        <article key={zone.id} className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{zone.name}</p>
                            <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">{zone.difficulty}</Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/58">{zone.objective}</p>
                          <p className="mt-3 text-xs font-semibold text-emerald-300">{zone.reward}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[18px] border border-white/[0.10] bg-black/22 p-5">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-[#F5C542]" />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Récompenses</h3>
                    </div>
                    <div className="mt-4 space-y-2">
                      {gamePackage.rewardSystem.slice(0, 6).map((reward) => (
                        <p key={reward} className="rounded-[12px] border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm text-white/62">
                          {reward}
                        </p>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : null}

            {activeMode === "improve" ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-[18px] border border-white/[0.10] bg-black/22 p-5">
                  <div className="flex items-center gap-3">
                    <Wand2 className="h-5 w-5 text-[#F5C542]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Improve Mode ciblé</h3>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {improveAreas.map((area) => {
                      const active = selectedImproveArea === area.id;
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => setSelectedImproveArea(area.id)}
                          className={`rounded-[12px] border px-3 py-2 text-xs font-semibold transition ${
                            active ? "border-[#F5C542]/35 bg-[#F5C542]/12 text-[#F5C542]" : "border-white/[0.08] bg-white/[0.035] text-white/45"
                          }`}
                        >
                          {area.label}
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    value={improveInstruction}
                    onChange={(event) => setImproveInstruction(event.target.value)}
                    className="mt-4 min-h-[112px] rounded-[16px] border-white/[0.10] bg-black/30 p-4 text-sm leading-6 text-white"
                  />
                  <Button onClick={() => void improve()} className="mt-4 h-11 w-full rounded-[14px] bg-[#F5C542] font-semibold text-black hover:bg-[#FFD766]">
                    <Sparkles className="h-4 w-4" />
                    Améliorer cette partie
                  </Button>
                  <p className="mt-3 text-xs leading-5 text-white/45">Chaque amélioration crée une version et relance la vérification.</p>
                </section>

                <section className="rounded-[18px] border border-white/[0.10] bg-black/22 p-5">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-[#F5C542]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Versions</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {versions.length ? (
                      versions.slice(0, 5).map((version) => (
                        <article key={version.versionId} className="rounded-[14px] border border-white/[0.08] bg-white/[0.035] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{version.summary}</p>
                            <DataBadge state={version.dataState} label={version.dataState === "real" ? "Version sauvegardée" : "Données locales"} />
                          </div>
                          <p className="mt-2 text-xs text-white/45">
                            {version.sourceAction} · {version.changedArea} · {new Date(version.createdAt).toLocaleString("fr-FR")}
                          </p>
                        </article>
                      ))
                    ) : (
                      <EmptyState title="Aucune version" description="Génère ou améliore un package pour créer une première version." />
                    )}
                  </div>
                </section>
              </div>
            ) : null}

            {activeMode === "export" ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-[18px] border border-white/[0.10] bg-black/22 p-5">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-[#F5C542]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Export honnête</h3>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {gamePackage.exportOptions.map((option) => (
                      <article key={option.id} className="rounded-[14px] border border-white/[0.08] bg-white/[0.035] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{option.label}</p>
                          <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">{option.status}</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-white/45">{option.description}</p>
                      </article>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => void exportPackage("json")} className="rounded-[14px] bg-[#F5C542] font-semibold text-black hover:bg-[#FFD766]">
                      <FileJson className="h-4 w-4" />
                      Export JSON
                    </Button>
                    <Button onClick={() => void exportPackage("markdown")} variant="outline" className="rounded-[14px] border-white/[0.10] bg-black/25 text-white/80 hover:bg-white/[0.06]">
                      <FileText className="h-4 w-4" />
                      Export Markdown
                    </Button>
                  </div>
                </section>

                <section className="rounded-[18px] border border-white/[0.10] bg-black/22 p-5">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-[#F5C542]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Preview export</h3>
                  </div>
                  <pre className="mt-4 max-h-[390px] overflow-auto rounded-[16px] border border-white/[0.08] bg-black/40 p-4 text-xs leading-6 text-white/58">
                    {markdownPreview}
                  </pre>
                </section>
              </div>
            ) : null}
          </section>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
            <section className="rounded-[18px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-purple-300" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Scripts / snippets</h3>
              </div>
              <div className="mt-4 space-y-3">
                {gamePackage.scripts.map((script) => (
                  <article key={script.scriptId} className="rounded-[14px] border border-white/[0.08] bg-black/24 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{script.fileName}</p>
                        <p className="mt-1 text-xs text-white/42">{script.whereToPlaceIt}</p>
                      </div>
                      <Badge className="border-purple-400/20 bg-purple-400/10 text-purple-200 hover:bg-purple-400/10">{script.languageOrFormat}</Badge>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/52">{script.purpose}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[18px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-sky-300" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Checklist de test</h3>
              </div>
              <div className="mt-4 space-y-2">
                {gamePackage.testingChecklist.map((item) => (
                  <div key={item} className="flex gap-2 rounded-[12px] border border-white/[0.07] bg-black/18 px-3 py-2.5 text-sm text-white/64">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[18px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-[#F5C542]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Assets prompts</h3>
              </div>
              <div className="mt-4 space-y-3">
                {gamePackage.assetPrompts.map((asset) => (
                  <article key={asset.id} className="rounded-[14px] border border-white/[0.08] bg-black/24 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{asset.title}</p>
                      <DataBadge state={asset.dataState} label="Exemple" />
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/48">{asset.prompt}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[18px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-[#F5C542]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Qualité du jeu</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DataBadge state={saveState} label={saveState === "real" ? "Sauvegarde cloud" : "Données locales"} />
                <DataBadge state="mock" label="Aucune publication auto" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {gamePackage.qualityScores.scores.map((score) => (
                <article key={score.id} className="rounded-[14px] border border-white/[0.08] bg-black/22 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">{score.label}</p>
                    <span className={`text-sm font-bold ${qualityColor(score.status)}`}>{score.note}</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/48">{score.reason}</p>
                  {score.status !== "pass" ? <p className="mt-3 text-xs font-semibold text-[#F5C542]">{score.recommendation}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-[#F5C542]" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Recherche tendances / garde-fous</h3>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {gamePackage.trendInsights.map((insight) => (
                <article key={insight.id} className="rounded-[14px] border border-white/[0.08] bg-black/22 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{insight.title}</p>
                    <DataBadge state={insight.dataState} label={insight.sourceType === "official_source" ? "Source préparée" : "Recherche limitée"} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/50">{insight.summary}</p>
                  <p className="mt-3 text-xs font-semibold text-[#F5C542]">{insight.relevance}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-[16px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-4">
              <div className="flex items-center gap-2 text-[#F5C542]">
                <Shield className="h-4 w-4" />
                <p className="text-sm font-semibold">Limites affichées clairement</p>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {gamePackage.limitations.map((limitation) => (
                  <p key={limitation} className="text-sm leading-6 text-white/62">
                    {limitation}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-white/[0.10] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-[#F5C542]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Documentation & guide de production</h3>
              </div>
              <p className="text-xs text-white/42">{pipelineMessage}</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {gamePackage.implementationSteps.map((step, index) => (
                <article key={step} className="rounded-[14px] border border-[#F5C542]/15 bg-black/18 p-4">
                  <p className="text-xs font-semibold text-[#F5C542]">Action {index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{step}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </V2PageShell>
  );
};

export default GameBuilder;
