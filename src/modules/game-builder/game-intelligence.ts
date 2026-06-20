import type { DataState } from "@/lib/data-state";
import {
  createMockGameProject,
  validateGameProject,
  type GamePlatform,
  type GameProject,
} from "@/modules/creation-engine";
import type { RoutedAITask } from "@/modules/ai";

export type GameBuildMode = "plan" | "prototype" | "improve" | "export";

export type GameTrendInsight = {
  id: string;
  sourceType: "official_source" | "prepared_reference" | "fallback_hypothesis";
  title: string;
  source?: string;
  summary: string;
  relevance: string;
  date?: string;
  dataState: DataState;
  usedFor: Array<"gameplay" | "platform_constraints" | "monetization" | "ui" | "assets" | "scripting" | "prototype_code">;
};

export type GameScriptPackage = {
  scriptId: string;
  platform: GamePlatform;
  languageOrFormat: "Luau" | "Verse" | "JSON" | "JavaScript" | "TypeScript" | "Pseudo-code";
  fileName: string;
  whereToPlaceIt: string;
  purpose: string;
  codeOrPseudocode: string;
  setupInstructions: string[];
  testInstructions: string[];
  warnings: string[];
};

export type GameLevelZone = {
  id: string;
  name: string;
  objective: string;
  mechanics: string[];
  difficulty: "easy" | "medium" | "hard";
  reward: string;
  assetsNeeded: string[];
  testPoints: string[];
};

export type GameAssetPrompt = {
  id: string;
  type: "thumbnail" | "environment" | "character" | "ui" | "item" | "reward";
  title: string;
  prompt: string;
  dataState: DataState;
};

export type WebPrototypeConfig = {
  type: "quiz" | "clicker" | "reflex" | "runner" | "obby2d" | "idle";
  title: string;
  startLabel: string;
  objective: string;
  scoreTarget: number;
  levels: Array<{
    id: string;
    name: string;
    target: number;
    feedback: string;
  }>;
  actions: Array<{
    id: string;
    label: string;
    points: number;
    feedback: string;
  }>;
  controls: string[];
};

export type GamePrototypePreview = {
  mode: "web_playable" | "platform_package";
  status: "ready" | "beta" | "manual_integration_required";
  summary: string;
  webGame?: WebPrototypeConfig;
  platformPreview: string[];
  dataState: DataState;
};

export type GameQualityScore = {
  id:
    | "game_concept_score"
    | "gameplay_loop_score"
    | "prototype_playability_score"
    | "platform_fit_score"
    | "scripting_readiness_score"
    | "asset_clarity_score"
    | "implementation_score"
    | "production_readiness_score"
    | "trend_relevance_score"
    | "safety_score";
  label: string;
  note: number;
  reason: string;
  mainIssue: string;
  recommendation: string;
  status: "pass" | "warning" | "fail";
};

export type GameQualityGate = {
  passed: boolean;
  score: number;
  scores: GameQualityScore[];
  blockers: string[];
  warnings: string[];
  recommendations: string[];
};

export type GameProductionPackage = {
  gameId: string;
  title: string;
  platform: GamePlatform;
  genre: string;
  targetPlayer: string;
  mode: GameBuildMode;
  dataState: DataState;
  trendInsights: GameTrendInsight[];
  coreFantasy: string;
  gameplayLoop: string;
  playerObjectives: string[];
  progression: string[];
  mechanics: string[];
  levelsOrZones: GameLevelZone[];
  scoringSystem: string;
  rewardSystem: string[];
  difficultyCurve: string;
  scripts: GameScriptPackage[];
  assetPrompts: GameAssetPrompt[];
  implementationSteps: string[];
  testingChecklist: string[];
  prototypePreview: GamePrototypePreview;
  exportOptions: Array<{
    id: "json" | "markdown" | "scripts" | "checklist" | "asset_prompts" | "web_prototype";
    label: string;
    status: "ready" | "beta" | "coming_soon" | "not_configured";
    description: string;
  }>;
  limitations: string[];
  qualityScores: GameQualityGate;
  routingRoles: Array<{
    role: string;
    taskType: string;
    provider: string;
    fallbackProvider: string;
    status: string;
  }>;
  sourceSummary: string;
  createdAt: string;
};

export type GameBuilderBriefInput = {
  title?: string;
  platform?: GamePlatform;
  gameType?: string;
  subGenre?: string;
  theme?: string;
  targetAudience?: string;
  visualStyle?: string;
  prototypeTarget?: string;
  qualityTier?: string;
  gameplayLoopHint?: string;
  coreMechanics?: string;
  mainCharacter?: string;
  enemyType?: string;
  worldMap?: string;
  progressionStyle?: string;
  levelCount?: string;
  difficultyTarget?: string;
  enemyAIStyle?: string;
  freePrompt?: string;
};

export type GameVersionRecord = {
  versionId: string;
  gameId: string;
  sourceAction: "generate" | "improve" | "manual_edit" | "restore" | "export";
  changedArea: string;
  summary: string;
  blueprintSnapshot: GameProductionPackage;
  scores: GameQualityGate;
  createdAt: string;
  dataState: DataState;
};

const nowId = (prefix: string) => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now().toString(36)}`;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const gameAIRoles = [
  "game_research",
  "game_strategy",
  "gameplay_design",
  "level_design",
  "platform_constraints",
  "scripting",
  "assets",
  "ui_ux",
  "prototype_code",
  "quality",
] as const;

const officialSourceInsights: Record<GamePlatform, GameTrendInsight[]> = {
  Roblox: [
    {
      id: "roblox-luau",
      sourceType: "official_source",
      title: "Roblox Luau et scripts Studio",
      source: "https://create.roblox.com/docs/luau",
      summary: "Luau est le langage de scripting utilisé dans Roblox Studio, avec autocomplétion, linting et analyse dans l'éditeur.",
      relevance: "Le package doit donner des scripts Luau commentés et indiquer où les placer dans Roblox Studio.",
      dataState: "mock",
      usedFor: ["scripting", "platform_constraints"],
    },
    {
      id: "roblox-spawnlocation",
      sourceType: "official_source",
      title: "SpawnLocation et checkpoints Roblox",
      source: "https://create.roblox.com/docs/reference/engine/classes/SpawnLocation",
      summary: "Les SpawnLocation peuvent servir de checkpoints, notamment dans les obbys, avec des règles de respawn et d'équipe.",
      relevance: "Le blueprint Roblox doit inclure checkpoints, respawn et test manuel dans Studio.",
      dataState: "mock",
      usedFor: ["gameplay", "scripting", "platform_constraints"],
    },
  ],
  "Fortnite / UEFN": [
    {
      id: "uefn-devices",
      sourceType: "official_source",
      title: "Devices UEFN et Verse",
      source: "https://dev.epicgames.com/documentation/uefn/devices-in-unreal-editor-for-fortnite",
      summary: "UEFN combine devices Fortnite Creative et Verse pour construire des règles, interactions et systèmes de jeu.",
      relevance: "Le package doit parler en devices, objectifs, timer, score et playtest manuel.",
      dataState: "mock",
      usedFor: ["platform_constraints", "scripting", "ui"],
    },
    {
      id: "uefn-score-hud",
      sourceType: "official_source",
      title: "Score Manager, HUD Message et Timer",
      source: "https://dev.epicgames.com/documentation/en-us/uefn/5-spice-up-the-gameplay-with-verse-in-unreal-editor-for-fortnite",
      summary: "Les devices Score Manager, HUD Message et Timer peuvent gérer score, feedback et objectifs dans une île UEFN.",
      relevance: "Le blueprint UEFN doit lister les devices et préciser la configuration à tester.",
      dataState: "mock",
      usedFor: ["gameplay", "ui", "scripting"],
    },
  ],
  Minecraft: [
    {
      id: "minecraft-manifest",
      sourceType: "official_source",
      title: "Manifest Minecraft Bedrock add-ons",
      source: "https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest",
      summary: "Le fichier manifest.json identifie un behavior/resource pack avec format_version, header, modules, dépendances et version.",
      relevance: "Le package Minecraft doit proposer manifest, behavior pack et checklist d'import.",
      dataState: "mock",
      usedFor: ["platform_constraints", "scripting"],
    },
    {
      id: "minecraft-pack-contents",
      sourceType: "official_source",
      title: "Structure de packs Minecraft",
      source: "https://learn.microsoft.com/en-us/minecraft/creator/documents/comprehensivepackcontents",
      summary: "Les add-ons Bedrock dépendent de dossiers et types de fichiers précis, dont behavior_pack, resource_pack et fonctions.",
      relevance: "Le blueprint doit expliquer la structure sans prétendre publier automatiquement.",
      dataState: "mock",
      usedFor: ["platform_constraints", "assets", "scripting"],
    },
  ],
  "Web game": [
    {
      id: "web-request-animation-frame",
      sourceType: "official_source",
      title: "Boucle d'animation web",
      source: "https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame",
      summary: "requestAnimationFrame synchronise les animations avec le repaint navigateur et doit être rappelé pour continuer l'animation.",
      relevance: "Les prototypes web doivent rester légers, testables et compatibles navigateur.",
      dataState: "mock",
      usedFor: ["prototype_code", "ui", "gameplay"] as GameTrendInsight["usedFor"],
    },
  ],
};

const platformKeywords: Array<[GamePlatform, RegExp]> = [
  ["Fortnite / UEFN", /\b(fortnite|uefn|verse|island|île|ile)\b/i],
  ["Minecraft", /\b(minecraft|bedrock|datapack|addon|add-on|map)\b/i],
  ["Web game", /\b(web|html|javascript|typescript|react|quiz|clicker|browser|navigateur)\b/i],
  ["Roblox", /\b(roblox|obby|tycoon|luau|studio)\b/i],
];

export const detectGamePlatform = (idea: string, explicit?: GamePlatform): GamePlatform => {
  if (explicit) return explicit;
  const match = platformKeywords.find(([, pattern]) => pattern.test(idea));
  return match?.[0] ?? "Web game";
};

export const detectGameGenre = (idea: string, explicit?: string) => {
  if (explicit?.trim()) return explicit.trim();
  const normalized = normalize(idea);
  if (normalized.includes("quiz")) return "Quiz";
  if (normalized.includes("clicker")) return "Clicker";
  if (normalized.includes("obby")) return "Obby";
  if (normalized.includes("tycoon")) return "Tycoon";
  if (normalized.includes("runner")) return "Runner";
  if (normalized.includes("survival")) return "Survival";
  if (normalized.includes("escape")) return "Escape room";
  return "Mini-game";
};

const platformLabel = (platform: GamePlatform) => {
  if (platform === "Roblox") return "Roblox Studio";
  if (platform === "Minecraft") return "Minecraft Bedrock";
  if (platform === "Fortnite / UEFN") return "UEFN";
  return "Pixelrises Web Prototype";
};

const webPrototypeType = (brief: Required<GameBuilderBriefInput>): WebPrototypeConfig["type"] => {
  const text = normalize(`${brief.gameType} ${brief.freePrompt}`);
  if (text.includes("clicker") || text.includes("idle")) return "clicker";
  if (text.includes("runner")) return "runner";
  if (text.includes("obby")) return "obby2d";
  if (text.includes("reflex") || text.includes("reaction")) return "reflex";
  return "quiz";
};

export const normalizeGameBuilderBrief = (input: GameBuilderBriefInput): Required<GameBuilderBriefInput> => {
  const freePrompt =
    input.freePrompt?.trim() ||
    input.theme?.trim() ||
    "Créer un jeu court, testable, avec score, progression et récompenses.";
  const platform = detectGamePlatform(freePrompt, input.platform);
  const gameType = detectGameGenre(freePrompt, input.gameType);

  return {
    title: input.title?.trim() || (platform === "Web game" ? "Pixel Challenge" : "Pixel Quest"),
    platform,
    gameType,
    subGenre: input.subGenre?.trim() || (gameType === "Quiz" ? "Feedback rapide" : "Progression"),
    theme: input.theme?.trim() || freePrompt,
    targetAudience: input.targetAudience?.trim() || "joueurs casual",
    visualStyle: input.visualStyle?.trim() || "Stylise premium lisible",
    prototypeTarget: input.prototypeTarget?.trim() || (platform === "Web game" ? "Prototype web React" : platformLabel(platform)),
    qualityTier: input.qualityTier?.trim() || "Standard",
    gameplayLoopHint: input.gameplayLoopHint?.trim() || "Boucle courte, feedback rapide, progression visible",
    coreMechanics: input.coreMechanics?.trim() || "Objectif principal, score, progression, restart",
    mainCharacter: input.mainCharacter?.trim() || "Joueur principal",
    enemyType: input.enemyType?.trim() || "Obstacle / challenge contextuel",
    worldMap: input.worldMap?.trim() || "Carte simple en 3 a 5 zones",
    progressionStyle: input.progressionStyle?.trim() || "Niveaux courts avec montee progressive",
    levelCount: input.levelCount?.trim() || "5",
    difficultyTarget: input.difficultyTarget?.trim() || "Accessible puis progressif",
    enemyAIStyle: input.enemyAIStyle?.trim() || "Comportements simples et testables",
    freePrompt,
  };
};

export const buildGamePlan = (input: GameBuilderBriefInput) => {
  const brief = normalizeGameBuilderBrief(input);
  const isWeb = brief.platform === "Web game";

  return {
    title: brief.title,
    platform: brief.platform,
    genre: brief.gameType,
    targetPlayer: brief.targetAudience,
    promise: isWeb
      ? "Un prototype jouable directement dans Pixelrises, simple à tester et à améliorer."
      : `Un package ${platformLabel(brief.platform)} exploitable, avec scripts, structure et test manuel.`,
    coreFantasy:
      brief.gameType === "Tycoon"
        ? "Partir de rien, améliorer une base et voir la progression devenir visible."
        : brief.gameType === "Obby"
          ? "Traverser des zones courtes, réussir des obstacles et débloquer une récompense finale."
          : "Comprendre vite, agir souvent, progresser clairement et vouloir relancer une partie.",
    gameplayLoop:
      brief.gameplayLoopHint ||
      (brief.gameType === "Clicker"
        ? "Cliquer, gagner des points, acheter une amélioration, accélérer la progression, recommencer."
        : "Entrer dans un défi, réussir une action courte, recevoir un feedback, gagner une récompense, passer au niveau suivant."),
    complexity: `${brief.qualityTier} · ${isWeb ? "Bêta légère, jouable dans le navigateur" : "Bêta premium, intégration manuelle requise"}`,
    assumptions: [
      "Hypothèse : la première version privilégie une boucle courte et testable plutôt qu'un jeu complet.",
      "Hypothèse : les assets restent des prompts ou placeholders tant que l'utilisateur ne fournit pas ses visuels.",
      `Hypothèse : la direction visuelle reste ${brief.visualStyle.toLowerCase()} tant qu'aucun asset final n'est fourni.`,
    ],
    risks: [
      "Test manuel obligatoire avant toute publication.",
      "Les snippets ne sont pas garantis production-ready sans adaptation dans l'éditeur officiel.",
      "Aucune API Roblox, Minecraft ou Fortnite n'est appelée par Pixelrises.",
    ],
    nextAction: isWeb ? "Tester le prototype web et ajuster score/restart." : `Créer la scène de base dans ${platformLabel(brief.platform)} puis intégrer les scripts manuellement.`,
  };
};

const buildZones = (brief: Required<GameBuilderBriefInput>): GameLevelZone[] => {
  const zoneBase =
    brief.gameType === "Tycoon"
      ? ["Terrain de départ", "Production", "Upgrade hub", "Zone prestige", "Défi final"]
      : brief.gameType === "Obby"
        ? ["Spawn", "Zone précision", "Zone timing", "Zone risque", "Finish reward"]
        : brief.gameType === "Quiz"
          ? ["Tutoriel", "Niveau facile", "Niveau moyen", "Niveau rapide", "Résultat"]
        : ["Onboarding", "Défi 1", "Défi 2", "Défi avancé", "Victoire"];

  const parsedLevelCount = Number.parseInt(brief.levelCount, 10);
  const wantedLevels = Number.isFinite(parsedLevelCount) ? Math.max(3, Math.min(8, parsedLevelCount)) : zoneBase.length;
  const finalZones = zoneBase.slice(0, wantedLevels);

  return finalZones.map((name, index) => ({
    id: `zone-${index + 1}`,
    name,
    objective:
      index === 0
        ? "Expliquer la règle en moins de 10 secondes."
        : index === finalZones.length - 1
          ? "Valider la maîtrise et donner une récompense claire."
          : `Faire réussir une action principale liée à ${brief.gameType}.`,
    mechanics:
      index === 0
        ? ["Onboarding", "Feedback immédiat", brief.coreMechanics]
        : ["Objectif court", "Score", "Checkpoint", "Récompense visible", brief.enemyAIStyle],
    difficulty: index <= 1 ? "easy" : index <= Math.max(2, finalZones.length - 2) ? "medium" : "hard",
    reward: index === finalZones.length - 1 ? "Badge final et cosmetic symbolique" : `+${(index + 1) * 10} points et accès zone suivante`,
    assetsNeeded: ["UI objectif", "Feedback réussite", `${brief.subGenre} prop ${index + 1}`, brief.visualStyle],
    testPoints: ["Le joueur comprend l'objectif", "Le feedback apparaît", "La progression est sauvegardable ou visible", `Vérifier la difficulté : ${brief.difficultyTarget}`],
  }));
};

const buildWebPrototype = (brief: Required<GameBuilderBriefInput>): WebPrototypeConfig => {
  const type = webPrototypeType(brief);
  const target = type === "clicker" ? 150 : type === "quiz" ? 50 : 100;

  return {
    type,
    title: brief.title,
    startLabel: "Lancer le prototype",
    objective:
      type === "clicker"
        ? "Accumuler assez de points pour débloquer les upgrades de base."
        : type === "quiz"
          ? "Répondre juste, monter de niveau et atteindre le score cible."
          : "Réagir vite, éviter les erreurs et atteindre le niveau final.",
    scoreTarget: target,
    levels: [
      { id: "level-1", name: "Découverte", target: Math.round(target * 0.25), feedback: "La règle est comprise." },
      { id: "level-2", name: "Progression", target: Math.round(target * 0.6), feedback: "La boucle devient engageante." },
      { id: "level-3", name: "Maîtrise", target, feedback: "Le joueur peut relancer ou partager." },
    ],
    actions:
      type === "clicker"
        ? [
            { id: "click", label: "Gagner +5", points: 5, feedback: "Progression ajoutée." },
            { id: "upgrade", label: "Upgrade +15", points: 15, feedback: "Upgrade simulé." },
            { id: "combo", label: "Combo +25", points: 25, feedback: "Bonus de rythme." },
          ]
        : [
            { id: "correct", label: "Bonne action +10", points: 10, feedback: "Feedback positif." },
            { id: "bonus", label: "Bonus niveau +20", points: 20, feedback: "Niveau accéléré." },
            { id: "risk", label: "Action risquée +5", points: 5, feedback: "Risque contrôlé." },
          ],
    controls: ["Souris ou tactile", "Boutons d'action", "Restart manuel", brief.prototypeTarget],
  };
};

const buildScripts = (brief: Required<GameBuilderBriefInput>, zones: GameLevelZone[]): GameScriptPackage[] => {
  if (brief.platform === "Roblox") {
    return [
      {
        scriptId: "roblox-checkpoint",
        platform: brief.platform,
        languageOrFormat: "Luau",
        fileName: "CheckpointManager.server.lua",
        whereToPlaceIt: "ServerScriptService",
        purpose: "Sauvegarder le checkpoint touché et respawn le joueur au bon endroit.",
        codeOrPseudocode:
          "local Players = game:GetService('Players')\nlocal checkpoints = workspace:WaitForChild('Checkpoints')\n\nlocal function setCheckpoint(player, checkpoint)\n  player:SetAttribute('CheckpointName', checkpoint.Name)\nend\n\nfor _, checkpoint in ipairs(checkpoints:GetChildren()) do\n  checkpoint.Touched:Connect(function(hit)\n    local player = Players:GetPlayerFromCharacter(hit.Parent)\n    if player then setCheckpoint(player, checkpoint) end\n  end)\nend\n\nPlayers.PlayerAdded:Connect(function(player)\n  player.CharacterAdded:Connect(function(character)\n    local checkpointName = player:GetAttribute('CheckpointName')\n    local checkpoint = checkpointName and checkpoints:FindFirstChild(checkpointName)\n    if checkpoint then character:PivotTo(checkpoint.CFrame + Vector3.new(0, 4, 0)) end\n  end)\nend)",
        setupInstructions: ["Créer un folder Workspace/Checkpoints.", "Nommer les parts Checkpoint_01 à Checkpoint_05.", "Coller le script dans ServerScriptService."],
        testInstructions: ["Toucher chaque checkpoint.", "Reset le personnage.", "Vérifier que le respawn revient au dernier checkpoint."],
        warnings: ["Snippet bêta à tester dans Roblox Studio.", "Ne publie rien automatiquement."],
      },
      {
        scriptId: "roblox-reward",
        platform: brief.platform,
        languageOrFormat: "Luau",
        fileName: "RewardService.server.lua",
        whereToPlaceIt: "ServerScriptService",
        purpose: "Attribuer une récompense symbolique quand la dernière zone est terminée.",
        codeOrPseudocode:
          "local finish = workspace:WaitForChild('FinishReward')\nfinish.Touched:Connect(function(hit)\n  local player = game.Players:GetPlayerFromCharacter(hit.Parent)\n  if not player then return end\n  player:SetAttribute('PixelrisesRewardUnlocked', true)\n  print(player.Name .. ' a débloqué la récompense finale')\nend)",
        setupInstructions: ["Créer une part FinishReward.", "Ajouter une UI ou un badge interne après test.", "Garder la récompense non pay-to-win."],
        testInstructions: ["Toucher FinishReward.", "Vérifier l'attribut joueur.", "Afficher un feedback HUD ensuite."],
        warnings: ["Ne pas connecter de paiement ou gamepass automatiquement."],
      },
    ];
  }

  if (brief.platform === "Minecraft") {
    return [
      {
        scriptId: "minecraft-manifest",
        platform: brief.platform,
        languageOrFormat: "JSON",
        fileName: "behavior_pack/manifest.json",
        whereToPlaceIt: "Dossier behavior_pack du monde Minecraft Bedrock",
        purpose: "Déclarer le behavior pack et préparer l'import manuel.",
        codeOrPseudocode:
          '{\n  "format_version": 2,\n  "header": {\n    "name": "Pixelrises Mini-game Pack",\n    "description": "Prototype à tester manuellement",\n    "uuid": "REPLACE-WITH-UUID-1",\n    "version": [1, 0, 0],\n    "min_engine_version": [1, 20, 0]\n  },\n  "modules": [{\n    "type": "data",\n    "uuid": "REPLACE-WITH-UUID-2",\n    "version": [1, 0, 0]\n  }]\n}',
        setupInstructions: ["Générer deux UUIDs.", "Remplacer les valeurs REPLACE-WITH-UUID.", "Importer dans un monde de test."],
        testInstructions: ["Vérifier que le pack apparaît.", "Activer le behavior pack.", "Tester les objectifs sur une copie du monde."],
        warnings: ["Structure indicative, test manuel obligatoire.", "Ne pas utiliser sur monde de production sans backup."],
      },
      {
        scriptId: "minecraft-score",
        platform: brief.platform,
        languageOrFormat: "Pseudo-code",
        fileName: "behavior_pack/functions/progression.mcfunction",
        whereToPlaceIt: "Dossier functions du behavior pack si utilisé",
        purpose: "Créer un scoreboard et suivre la progression.",
        codeOrPseudocode:
          "scoreboard objectives add pixel_score dummy Pixel Score\nscoreboard players add @p pixel_score 10\ntitle @p actionbar Progression +10",
        setupInstructions: ["Créer le dossier functions.", "Ajouter le fichier .mcfunction.", "Appeler la fonction depuis un command block ou trigger."],
        testInstructions: ["Lancer la fonction.", "Vérifier le score.", "Vérifier le feedback actionbar."],
        warnings: ["Commandes à adapter selon édition et version."],
      },
    ];
  }

  if (brief.platform === "Fortnite / UEFN") {
    return [
      {
        scriptId: "uefn-devices",
        platform: brief.platform,
        languageOrFormat: "Pseudo-code",
        fileName: "UEFN_Device_Setup.md",
        whereToPlaceIt: "Documentation de l'île UEFN",
        purpose: "Lister les devices à placer et leur rôle.",
        codeOrPseudocode:
          "Devices: Player Spawner, Timer, Score Manager, HUD Message, Trigger, Checkpoint.\nFlow: Player Spawner -> Trigger Start -> Timer Start -> Score Manager awards points -> HUD Message shows feedback -> End condition.",
        setupInstructions: ["Créer l'île.", "Placer les devices.", "Nommer clairement chaque device.", "Relier les events avant playtest."],
        testInstructions: ["Lancer session UEFN.", "Vérifier timer.", "Vérifier score HUD.", "Tester condition de victoire."],
        warnings: ["Preview conceptuelle, intégration manuelle requise dans UEFN."],
      },
      {
        scriptId: "uefn-verse-score",
        platform: brief.platform,
        languageOrFormat: "Verse",
        fileName: "pixel_score_manager.verse",
        whereToPlaceIt: "Verse device UEFN",
        purpose: "Esquisser la logique score et feedback.",
        codeOrPseudocode:
          "using { /Fortnite.com/Devices }\nusing { /Verse.org/Simulation }\n\npixel_score_manager := class(creative_device):\n  @editable ScoreManager:score_manager_device = score_manager_device{}\n  @editable Hud:hud_message_device = hud_message_device{}\n\n  AwardPoint(Player:agent):void =\n    ScoreManager.Activate(Player)\n    Hud.Show(Player, \"Objectif validé\", 2.0)",
        setupInstructions: ["Créer un Verse device.", "Compiler.", "Associer Score Manager et HUD Message dans Details."],
        testInstructions: ["Déclencher AwardPoint via un Trigger.", "Vérifier score et HUD.", "Ajuster valeurs après playtest."],
        warnings: ["Pseudo-snippet à valider avec la version UEFN installée."],
      },
    ];
  }

  const prototype = buildWebPrototype(brief);
  return [
    {
      scriptId: "web-prototype-react",
      platform: brief.platform,
      languageOrFormat: "TypeScript",
      fileName: "PixelrisesWebPrototype.tsx",
      whereToPlaceIt: "Prototype Mode Pixelrises ou composant React exporté",
      purpose: "Faire tourner une boucle score/niveaux/restart jouable dans le navigateur.",
      codeOrPseudocode:
        "const [score, setScore] = useState(0);\nconst [running, setRunning] = useState(false);\nconst level = score >= target ? 'Victoire' : score >= target * 0.6 ? 'Maîtrise' : 'Découverte';\nfunction play(points) { setRunning(true); setScore((value) => Math.min(target, value + points)); }\nfunction restart() { setScore(0); setRunning(false); }",
      setupInstructions: ["Utiliser le Prototype Mode intégré.", "Tester score, restart et feedback.", `Objectif cible : ${prototype.scoreTarget} points.`, `Cible prototype : ${brief.prototypeTarget}`],
      testInstructions: ["Cliquer sur Lancer.", "Ajouter des points.", "Atteindre le score cible.", "Relancer avec Restart."],
      warnings: ["Prototype léger, pas un moteur complet.", "Pas de dépendance externe lourde."],
    },
  ];
};

const buildAssets = (brief: Required<GameBuilderBriefInput>): GameAssetPrompt[] => [
  {
    id: "asset-thumbnail",
    type: "thumbnail",
    title: "Thumbnail premium",
    prompt: `Thumbnail ${brief.platform} pour ${brief.title}, ${brief.gameType}, contraste fort, action lisible, aucune marque protégée, style original, direction ${brief.visualStyle}.`,
    dataState: "example",
  },
  {
    id: "asset-ui",
    type: "ui",
    title: "HUD score et objectif",
    prompt: `Interface HUD dark premium avec accent jaune Pixelrises, score, niveau actuel, objectif court, feedback victoire/défaite, responsive, niveau qualité ${brief.qualityTier}.`,
    dataState: "example",
  },
  {
    id: "asset-environment",
    type: "environment",
    title: `Environnement ${brief.subGenre}`,
    prompt: `Zone de jeu ${brief.subGenre}, lisible, testable, progression visuelle claire, obstacles ou objectifs adaptés à ${brief.targetAudience}, carte ${brief.worldMap}.`,
    dataState: "example",
  },
  {
    id: "asset-reward",
    type: "reward",
    title: "Récompense non pay-to-win",
    prompt: `Cosmetic symbolique pour ${brief.title}, récompense optionnelle, valorisante, sans avantage injuste, cohérente avec ${brief.visualStyle}.`,
    dataState: "example",
  },
];

const buildImplementationSteps = (brief: Required<GameBuilderBriefInput>) => {
  if (brief.platform === "Roblox") {
    return [
      "Créer une baseplate Roblox Studio.",
      "Ajouter Workspace/Checkpoints avec 5 parts nommées.",
      "Ajouter les scripts dans ServerScriptService.",
      "Créer StarterGui/HUD pour score et objectif.",
      `Poser la direction artistique : ${brief.visualStyle}.`,
      "Playtest solo, puis test avec un autre compte si possible.",
    ];
  }
  if (brief.platform === "Fortnite / UEFN") {
    return [
      "Créer une île UEFN vide.",
      "Placer Player Spawner, Timer, Score Manager, HUD Message et Trigger.",
      "Ajouter le Verse device si utilisé.",
      `Prévoir les zones selon : ${brief.worldMap}.`,
      "Relier les devices et lancer une session.",
      "Ajuster score, timer et objectifs après playtest.",
    ];
  }
  if (brief.platform === "Minecraft") {
    return [
      "Créer une copie du monde de test.",
      "Préparer behavior_pack et resource_pack si nécessaire.",
      "Remplir manifest.json avec UUIDs uniques.",
      `Intégrer le rythme de progression : ${brief.progressionStyle}.`,
      "Ajouter fonctions ou commandes scoreboard.",
      "Importer et tester sur une copie avant partage.",
    ];
  }
  return [
    "Tester le prototype dans Pixelrises.",
    `Respecter la boucle de gameplay : ${brief.gameplayLoopHint}.`,
    "Ajuster score cible, actions et niveaux.",
    "Exporter JSON ou Markdown.",
    "Transformer en composant web si besoin.",
    "Faire tester la boucle à un utilisateur réel.",
  ];
};

const buildTestingChecklist = (brief: Required<GameBuilderBriefInput>) => [
  "Le joueur comprend la règle en moins de 10 secondes.",
  "Le score ou la progression change après chaque action.",
  "Le restart fonctionne sans bloquer la partie.",
  `La difficulté augmente progressivement (${brief.difficultyTarget}).`,
  "Les récompenses restent éthiques et non pay-to-win.",
  `Le résultat est testé manuellement dans ${platformLabel(brief.platform)}.`,
  "Aucune publication automatique n'est déclenchée.",
];

const buildExportOptions = (platform: GamePlatform): GameProductionPackage["exportOptions"] => [
  { id: "json", label: "Export JSON blueprint", status: "ready", description: "Structure complète exploitable par Pixelrises." },
  { id: "markdown", label: "Export Markdown", status: "ready", description: "Plan lisible pour production et partage interne." },
  { id: "scripts", label: "Copier scripts/snippets", status: "beta", description: `À intégrer manuellement dans ${platformLabel(platform)}.` },
  { id: "checklist", label: "Exporter checklist", status: "ready", description: "Checklist de test manuel et intégration." },
  { id: "asset_prompts", label: "Exporter assets prompts", status: "beta", description: "Prompts visuels sans génération d'image automatique." },
  {
    id: "web_prototype",
    label: platform === "Web game" ? "Prototype jouable" : "Preview conceptuelle",
    status: platform === "Web game" ? "ready" : "coming_soon",
    description: platform === "Web game" ? "Jouable dans Pixelrises." : "Prototype jouable externe non activé pour cette plateforme.",
  },
];

export const buildGameProductionPackage = (
  input: GameBuilderBriefInput,
  options: {
    dataState?: DataState;
    routedTasks?: RoutedAITask[];
    sourceSummary?: string;
    mode?: GameBuildMode;
  } = {},
): GameProductionPackage => {
  const brief = normalizeGameBuilderBrief(input);
  const zones = buildZones(brief);
  const scripts = buildScripts(brief, zones);
  const prototypeConfig = brief.platform === "Web game" ? buildWebPrototype(brief) : undefined;
  const insights = [
    ...officialSourceInsights[brief.platform],
    {
      id: "trend-fallback",
      sourceType: "fallback_hypothesis",
      title: "Recherche tendances indisponible dans l'app",
      summary: "Génération basée sur la logique Pixelrises, les contraintes connues et les sources officielles préparées.",
      relevance: "Le Game Builder reste honnête : aucune tendance live n'est inventée.",
      dataState: "mock" as const,
      usedFor: ["gameplay", "platform_constraints"] as GameTrendInsight["usedFor"],
    },
  ];

  const packageDraft: Omit<GameProductionPackage, "qualityScores"> = {
    gameId: nowId("game"),
    title: brief.title,
    platform: brief.platform,
    genre: brief.gameType,
    targetPlayer: brief.targetAudience,
    mode: options.mode ?? "prototype",
    dataState: options.dataState ?? "mock",
    trendInsights: insights,
    coreFantasy: buildGamePlan(brief).coreFantasy,
    gameplayLoop: buildGamePlan(brief).gameplayLoop,
    playerObjectives: zones.map((zone) => zone.objective),
    progression: zones.map((zone) => `${zone.name}: ${zone.reward}`),
    mechanics: Array.from(new Set(zones.flatMap((zone) => zone.mechanics))),
    levelsOrZones: zones,
    scoringSystem:
      brief.platform === "Web game"
        ? `Score cible ${prototypeConfig?.scoreTarget ?? 100}, progression par actions et restart manuel.`
        : "Score ou progression préparé via scripts/devices/commands selon plateforme, test manuel requis.",
    rewardSystem: zones.map((zone) => zone.reward),
    difficultyCurve: `${brief.progressionStyle}. Difficulté visée : ${brief.difficultyTarget}.`,
    scripts,
    assetPrompts: buildAssets(brief),
    implementationSteps: buildImplementationSteps(brief),
    testingChecklist: buildTestingChecklist(brief),
    prototypePreview: {
      mode: brief.platform === "Web game" ? "web_playable" : "platform_package",
      status: brief.platform === "Web game" ? "ready" : "manual_integration_required",
      summary:
        brief.platform === "Web game"
          ? "Prototype jouable directement dans Pixelrises avec score, niveaux et restart."
          : `Package exploitable à intégrer manuellement dans ${platformLabel(brief.platform)}.`,
      webGame: prototypeConfig,
      platformPreview: buildImplementationSteps(brief).slice(0, 4),
      dataState: options.dataState ?? "mock",
    },
    exportOptions: buildExportOptions(brief.platform),
    limitations: [
      "Pixelrises ne publie pas automatiquement sur Roblox, Minecraft ou Fortnite.",
      "Les scripts/snippets doivent être testés et adaptés dans l'éditeur officiel.",
      "Aucune API plateforme externe n'est appelée.",
      "Aucune marque, IP protégée ou jeu existant ne doit être copié.",
      "Les trailers, pubs vidéo et assets marketing avancés passent par Creator AI / Video AI.",
    ],
    routingRoles:
      options.routedTasks?.map((task) => ({
        role: task.type.replace(/^game_/, "game_"),
        taskType: task.type,
        provider: task.selectedProvider,
        fallbackProvider: task.fallbackProvider,
        status: task.status,
      })) ?? [],
    sourceSummary:
      options.sourceSummary ??
      `Recherche live non activée : sources officielles préparées et logique Pixelrises utilisées en fallback honnête. Qualité ${brief.qualityTier}, cible ${brief.prototypeTarget}.`,
    createdAt: new Date().toISOString(),
  };

  return {
    ...packageDraft,
    qualityScores: validateGameProductionPackage(packageDraft),
  };
};

const scoreStatus = (note: number): GameQualityScore["status"] => (note >= 85 ? "pass" : note >= 65 ? "warning" : "fail");

const qualityScore = (
  id: GameQualityScore["id"],
  label: string,
  note: number,
  reason: string,
  mainIssue: string,
  recommendation: string,
): GameQualityScore => ({
  id,
  label,
  note,
  reason,
  mainIssue,
  recommendation,
  status: scoreStatus(note),
});

export const validateGameProductionPackage = (
  gamePackage: Omit<GameProductionPackage, "qualityScores"> | GameProductionPackage,
): GameQualityGate => {
  const hasScripts = gamePackage.scripts.length > 0 && gamePackage.scripts.every((script) => script.whereToPlaceIt && script.testInstructions.length > 0);
  const hasZones = gamePackage.levelsOrZones.length >= 3;
  const hasAssets = gamePackage.assetPrompts.length >= 3;
  const hasNoAutoPublish = gamePackage.limitations.some((item) => normalize(item).includes("ne publie pas automatiquement"));
  const hasWebPrototype = gamePackage.platform !== "Web game" || Boolean(gamePackage.prototypePreview.webGame);
  const hasOfficialContext = gamePackage.trendInsights.some((insight) => insight.sourceType === "official_source");

  const scores: GameQualityScore[] = [
    qualityScore(
      "game_concept_score",
      "Concept clair",
      gamePackage.coreFantasy.length > 20 && gamePackage.playerObjectives.length >= 3 ? 92 : 62,
      "La promesse joueur et les objectifs sont explicités.",
      "Concept encore trop court ou objectifs incomplets.",
      "Ajouter une promesse joueur et 3 objectifs mesurables.",
    ),
    qualityScore(
      "gameplay_loop_score",
      "Gameplay loop",
      gamePackage.gameplayLoop.length > 40 && gamePackage.mechanics.length >= 3 ? 90 : 58,
      "La boucle explique action, feedback, récompense et retour au défi.",
      "Boucle trop vague.",
      "Décrire action principale, récompense et relance.",
    ),
    qualityScore(
      "prototype_playability_score",
      "Prototype jouable",
      hasWebPrototype ? 88 : 74,
      gamePackage.platform === "Web game" ? "Le prototype web contient score, niveaux et actions." : "Preview externe claire, test manuel requis.",
      "Prototype non jouable pour plateforme externe.",
      "Limiter la promesse à un package intégrable manuellement.",
    ),
    qualityScore(
      "platform_fit_score",
      "Adaptation plateforme",
      gamePackage.implementationSteps.length >= 4 ? 90 : 60,
      `Les étapes ciblent ${platformLabel(gamePackage.platform)}.`,
      "Étapes plateforme insuffisantes.",
      "Lister les emplacements, devices ou dossiers requis.",
    ),
    qualityScore(
      "scripting_readiness_score",
      "Scripts exploitables",
      hasScripts ? 88 : 50,
      "Chaque snippet indique placement, rôle et test.",
      "Scripts sans emplacement ou test.",
      "Ajouter where_to_place_it et instructions de test.",
    ),
    qualityScore(
      "asset_clarity_score",
      "Assets prompts",
      hasAssets ? 86 : 55,
      "Les assets couvrent thumbnail, UI, environnement et récompense.",
      "Prompts visuels incomplets.",
      "Ajouter prompts UI, thumbnail, environnement et récompenses.",
    ),
    qualityScore(
      "implementation_score",
      "Checklist intégration",
      gamePackage.testingChecklist.length >= 6 && hasZones ? 91 : 63,
      "Le package donne des zones, étapes et tests manuels.",
      "Checklist ou niveaux trop faibles.",
      "Ajouter étapes à créer, tester et corriger.",
    ),
    qualityScore(
      "production_readiness_score",
      "Readiness bêta",
      hasNoAutoPublish ? 84 : 35,
      "Le package est vendable en bêta sans fausse promesse.",
      "Promesse de publication automatique détectée.",
      "Afficher test manuel requis et aucune publication auto.",
    ),
    qualityScore(
      "trend_relevance_score",
      "Sources et inspirations",
      hasOfficialContext ? 76 : 55,
      "Sources officielles préparées, recherche live non prétendue.",
      "Recherche live non disponible.",
      "Citer les sources utilisées ou marquer fallback.",
    ),
    qualityScore(
      "safety_score",
      "Sécurité",
      hasNoAutoPublish && gamePackage.scripts.every((script) => !/token|secret|password|api[_-]?key/i.test(script.codeOrPseudocode)) ? 96 : 40,
      "Aucune API externe, secret ou publication automatique.",
      "Risque de secret ou action externe.",
      "Bloquer toute publication et redacter les données sensibles.",
    ),
  ];

  const blockers = scores.filter((score) => score.status === "fail").map((score) => score.mainIssue);
  const warnings = scores.filter((score) => score.status === "warning").map((score) => score.recommendation);
  const score = Math.round(scores.reduce((sum, item) => sum + item.note, 0) / scores.length);

  return {
    passed: blockers.length === 0,
    score,
    scores,
    blockers,
    warnings,
    recommendations: scores.filter((item) => item.status !== "pass").map((item) => item.recommendation),
  };
};

export const toGameProject = (gamePackage: GameProductionPackage): GameProject => {
  const base = createMockGameProject({
    title: gamePackage.title,
    platform: gamePackage.platform,
    gameType: gamePackage.genre,
    targetAudience: gamePackage.targetPlayer,
    theme: gamePackage.coreFantasy,
  });

  return {
    ...base,
    meta: {
      ...base.meta,
      projectId: gamePackage.gameId,
      title: gamePackage.title,
      platform: gamePackage.platform,
      gameType: gamePackage.genre,
      targetAudience: gamePackage.targetPlayer,
    },
    concept: {
      ...base.concept,
      pitch: `${gamePackage.title}: ${gamePackage.coreFantasy}`,
      playerGoal: gamePackage.playerObjectives[0] ?? base.concept.playerGoal,
      coreFantasy: gamePackage.coreFantasy,
    },
    gameplay: {
      ...base.gameplay,
      loop: gamePackage.gameplayLoop,
      mechanics: gamePackage.mechanics,
      progression: gamePackage.progression,
      rewards: gamePackage.rewardSystem,
    },
    levelDesign: {
      mapStructure: gamePackage.levelsOrZones.map((zone) => zone.name).join(" -> "),
      zones: gamePackage.levelsOrZones.map((zone) => zone.name),
      objectives: gamePackage.levelsOrZones.map((zone) => zone.objective),
      flow: gamePackage.difficultyCurve,
    },
    scripts: gamePackage.scripts.map((script) => ({
      language: script.languageOrFormat,
      name: script.fileName,
      purpose: script.purpose,
      code: script.codeOrPseudocode,
      explanation: `${script.whereToPlaceIt}. ${script.testInstructions.join(" ")}`,
    })),
    assets: gamePackage.assetPrompts.map((asset) => ({
      type: asset.type,
      name: asset.title,
      description: asset.prompt,
      prompt: asset.prompt,
    })),
    publishing: {
      checklist: gamePackage.testingChecklist,
      warnings: gamePackage.limitations,
      nextSteps: gamePackage.implementationSteps,
    },
  };
};

export const improveGamePackage = (
  current: GameProductionPackage,
  area: "concept" | "gameplay" | "levels" | "scripts" | "assets" | "checklist" | "prototype",
  action: string,
): GameProductionPackage => {
  const improved: GameProductionPackage = {
    ...current,
    mode: "improve",
    createdAt: new Date().toISOString(),
  };

  if (area === "concept") {
    improved.coreFantasy = `${current.coreFantasy} Version améliorée: ${action}.`;
    improved.playerObjectives = Array.from(new Set([...current.playerObjectives, "Créer un moment mémorable dès la première minute."]));
  }

  if (area === "gameplay") {
    improved.gameplayLoop = `${current.gameplayLoop} Ajout ciblé: ${action}.`;
    improved.mechanics = Array.from(new Set([...current.mechanics, "Combo feedback", "Objectif bonus"]));
  }

  if (area === "levels") {
    improved.levelsOrZones = [
      ...current.levelsOrZones,
      {
        id: `zone-${current.levelsOrZones.length + 1}`,
        name: "Zone bonus",
        objective: `Tester l'amélioration: ${action}.`,
        mechanics: ["Objectif bonus", "Récompense visible"],
        difficulty: "medium",
        reward: "Badge bonus",
        assetsNeeded: ["Feedback bonus", "Prop distinctif"],
        testPoints: ["La zone bonus ne bloque pas la progression", "Le reward apparaît clairement"],
      },
    ];
  }

  if (area === "scripts") {
    improved.scripts = current.scripts.map((script, index) =>
      index === 0
        ? {
            ...script,
            setupInstructions: [...script.setupInstructions, `Amélioration demandée: ${action}`],
            warnings: Array.from(new Set([...script.warnings, "Relancer un test manuel après modification du script."])),
          }
        : script,
    );
  }

  if (area === "assets") {
    improved.assetPrompts = [
      ...current.assetPrompts,
      {
        id: `asset-${current.assetPrompts.length + 1}`,
        type: "item",
        title: "Asset d'amélioration ciblée",
        prompt: `Asset original pour ${current.title}, amélioration: ${action}, style propre, aucune IP protégée.`,
        dataState: "example",
      },
    ];
  }

  if (area === "checklist") {
    improved.testingChecklist = Array.from(new Set([...current.testingChecklist, `Tester spécifiquement: ${action}.`]));
  }

  if (area === "prototype" && current.prototypePreview.webGame) {
    improved.prototypePreview = {
      ...current.prototypePreview,
      webGame: {
        ...current.prototypePreview.webGame,
        scoreTarget: current.prototypePreview.webGame.scoreTarget + 25,
        actions: [
          ...current.prototypePreview.webGame.actions,
          { id: "improve-action", label: "Action bonus +30", points: 30, feedback: action },
        ],
      },
    };
  }

  return {
    ...improved,
    qualityScores: validateGameProductionPackage(improved),
  };
};

export const createGameVersionRecord = (
  gamePackage: GameProductionPackage,
  sourceAction: GameVersionRecord["sourceAction"],
  changedArea: string,
  summary: string,
  dataState: DataState,
): GameVersionRecord => ({
  versionId: nowId("game-version"),
  gameId: gamePackage.gameId,
  sourceAction,
  changedArea,
  summary,
  blueprintSnapshot: gamePackage,
  scores: gamePackage.qualityScores,
  createdAt: new Date().toISOString(),
  dataState,
});

const gameVersionKey = "pixelrises-v2-game-versions";

const readVersionsFromLocalStorage = (): GameVersionRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(gameVersionKey);
    return raw ? (JSON.parse(raw) as GameVersionRecord[]) : [];
  } catch {
    return [];
  }
};

export const saveGameVersionLocal = (version: GameVersionRecord) => {
  if (typeof window === "undefined") return version;
  const next = [version, ...readVersionsFromLocalStorage().filter((item) => item.versionId !== version.versionId)].slice(0, 40);
  window.localStorage.setItem(gameVersionKey, JSON.stringify(next));
  return version;
};

export const readGameVersionsLocal = (gameId: string) =>
  readVersionsFromLocalStorage().filter((version) => version.gameId === gameId);

export const createGameMarkdownExport = (gamePackage: GameProductionPackage) => {
  const scripts = gamePackage.scripts
    .map(
      (script) =>
        `### ${script.fileName}\n\n- Plateforme: ${script.platform}\n- Placement: ${script.whereToPlaceIt}\n- Rôle: ${script.purpose}\n\n\`\`\`${script.languageOrFormat.toLowerCase()}\n${script.codeOrPseudocode}\n\`\`\`\n\nTests: ${script.testInstructions.join(" | ")}\n`,
    )
    .join("\n");

  return `# ${gamePackage.title}

## Résumé
- Plateforme: ${gamePackage.platform}
- Genre: ${gamePackage.genre}
- Cible: ${gamePackage.targetPlayer}
- DataState: ${gamePackage.dataState}

## Core fantasy
${gamePackage.coreFantasy}

## Gameplay loop
${gamePackage.gameplayLoop}

## Niveaux / zones
${gamePackage.levelsOrZones.map((zone) => `- ${zone.name}: ${zone.objective} | reward: ${zone.reward}`).join("\n")}

## Scripts / snippets
${scripts}

## Checklist de test
${gamePackage.testingChecklist.map((item) => `- ${item}`).join("\n")}

## Limites
${gamePackage.limitations.map((item) => `- ${item}`).join("\n")}
`;
};

export const downloadGameExport = (gamePackage: GameProductionPackage, format: "json" | "markdown") => {
  if (typeof window === "undefined") return;
  const content = format === "json" ? JSON.stringify(gamePackage, null, 2) : createGameMarkdownExport(gamePackage);
  const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${gamePackage.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "game-blueprint"}.${format === "json" ? "json" : "md"}`;
  link.click();
  URL.revokeObjectURL(url);
};

export const gameProjectQualityFromPackage = (gamePackage: GameProductionPackage) =>
  validateGameProject(toGameProject(gamePackage));
