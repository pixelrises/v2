import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clipboard,
  Code2,
  Download,
  FileQuestion,
  FileText,
  GraduationCap,
  History,
  Layers3,
  LayoutList,
  Loader2,
  MessageCircle,
  Mic,
  Paperclip,
  PlayCircle,
  RefreshCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge } from "@/components/ui/data-state";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  createAISpaceMessage,
  loadAISpaceConversations,
  readAISpaceConversations,
  runAISpaceAssistant,
  saveAISpaceConversationTurnPersistent,
  saveAISpaceUsageLog,
  type AISpaceConfig,
  type AISpaceConversation,
  type AISpaceMessage,
} from "@/modules/ai-spaces";

type StudentIntent =
  | "fiche"
  | "quiz"
  | "flashcards"
  | "slides"
  | "oral"
  | "resume"
  | "planning"
  | "interro"
  | "corriger"
  | "expliquer"
  | "methode"
  | "sources"
  | "recherche"
  | "site"
  | "app"
  | "jeu"
  | "agent"
  | "general";

type StudentViewMode = "simple" | "advanced";
type StudentWorkflowMode = "direct" | "plan";
type StudentPreviewTab = "preview" | "structure" | "questions" | "correction" | "method" | "export";
type StudentMobilePanel = "chat" | "preview";

type StudentAttachmentMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
};

type StudentDraft = {
  id: string;
  title: string;
  intent: StudentIntent;
  answer: string;
  createdAt: string;
};

type StudentCommand = {
  id: StudentIntent;
  prefix: string;
  label: string;
  description: string;
  prompt: string;
  cost: number;
  icon: LucideIcon;
};

type StudentPlan = {
  title: string;
  steps: string[];
  safetyNote: string;
};

const viewModeStorageKey = "pixelrises-v2-student-ai-view-mode";
const draftsStorageKey = "pixelrises-v2-student-ai-drafts";

const studentCommands: StudentCommand[] = [
  {
    id: "fiche",
    prefix: "/fiche",
    label: "Créer une fiche de révision",
    description: "Notions clés, définitions, exemples, erreurs fréquentes et mini synthèse.",
    prompt: "/fiche Crée une fiche de révision claire à partir de mon cours. Ajoute notions clés, définitions, exemples, erreurs fréquentes et questions possibles.",
    cost: 2,
    icon: BookOpen,
  },
  {
    id: "quiz",
    prefix: "/quiz",
    label: "Créer un quiz corrigé",
    description: "Questions faciles, moyennes, difficiles avec correction expliquée.",
    prompt: "/quiz Crée un quiz progressif avec correction détaillée pour m'entraîner sur ce cours.",
    cost: 2,
    icon: FileQuestion,
  },
  {
    id: "flashcards",
    prefix: "/flashcards",
    label: "Créer des flashcards",
    description: "Cartes question/réponse pour mémoriser activement.",
    prompt: "/flashcards Transforme ce cours en flashcards question/réponse avec niveau et pièges à éviter.",
    cost: 2,
    icon: Layers3,
  },
  {
    id: "slides",
    prefix: "/slides",
    label: "Créer des slides",
    description: "Plan de présentation, contenu slide par slide et script oral.",
    prompt: "/slides Crée une présentation claire avec plan, slides, transitions et script oral.",
    cost: 3,
    icon: LayoutList,
  },
  {
    id: "oral",
    prefix: "/oral",
    label: "Préparer un oral",
    description: "Introduction, problématique, plan, conclusion et questions possibles.",
    prompt: "/oral Aide-moi à préparer un oral : introduction, problématique, plan, script, conclusion et questions possibles.",
    cost: 2,
    icon: Mic,
  },
  {
    id: "resume",
    prefix: "/resume",
    label: "Résumer un cours",
    description: "Idée générale, notions importantes, mots-clés et synthèse claire.",
    prompt: "/resume Résume ce cours en expliquant les idées principales, les mots-clés et ce qu'il faut retenir.",
    cost: 1,
    icon: FileText,
  },
  {
    id: "planning",
    prefix: "/planning",
    label: "Planning de révision",
    description: "Sessions courtes, priorités, exercices et révisions finales.",
    prompt: "/planning Fais un planning de révision réaliste avec priorités, sessions courtes et exercices.",
    cost: 1,
    icon: TimerReset,
  },
  {
    id: "interro",
    prefix: "/interro",
    label: "Mode interrogation",
    description: "Questions actives pour vérifier la compréhension.",
    prompt: "/interro Interroge-moi progressivement sur ce cours, puis corrige mes réponses avec méthode.",
    cost: 1,
    icon: MessageCircle,
  },
  {
    id: "corriger",
    prefix: "/corriger",
    label: "Corriger une réponse",
    description: "Points forts, erreurs, version améliorée et méthode.",
    prompt: "/corriger Corrige ma réponse sans faire le travail à ma place : indique ce qui est bon, ce qui manque, les erreurs et une version améliorée expliquée.",
    cost: 2,
    icon: CheckCircle2,
  },
  {
    id: "expliquer",
    prefix: "/expliquer",
    label: "Expliquer une notion",
    description: "Explication simple, exemple, mini-exercice et vérification.",
    prompt: "/expliquer Explique cette notion simplement avec un exemple, une méthode et un mini-exercice.",
    cost: 1,
    icon: Brain,
  },
  {
    id: "methode",
    prefix: "/methode",
    label: "Méthode étape par étape",
    description: "Procédure claire pour refaire seul.",
    prompt: "/methode Donne-moi une méthode étape par étape pour réussir ce type d'exercice, puis un exemple guidé.",
    cost: 1,
    icon: Wand2,
  },
  {
    id: "sources",
    prefix: "/sources",
    label: "Préparer recherche / sources",
    description: "Requêtes, critères de fiabilité et bibliographie si les sources sont fournies.",
    prompt: "/sources Prépare une recherche fiable : requêtes, critères de vérification et méthode de bibliographie. N'invente aucune source.",
    cost: 1,
    icon: Search,
  },
  {
    id: "recherche",
    prefix: "/recherche",
    label: "Faire une recherche guidée",
    description: "Plan de recherche, mots-clés, sources à vérifier et synthèse exploitable.",
    prompt: "/recherche Prépare une recherche guidée sur mon sujet : angle, requêtes, sources à vérifier, plan de synthèse et limites. N'invente aucune source.",
    cost: 2,
    icon: Search,
  },
  {
    id: "site",
    prefix: "/site",
    label: "Créer un site étudiant",
    description: "Brief pour Site Builder : objectif, pages, contenu, CTA, SEO et preview.",
    prompt: "/site Prépare un brief complet pour créer un site web étudiant avec Pixelrises : objectif, public, sections, contenu, CTA, SEO, style et limites de publication.",
    cost: 3,
    icon: Code2,
  },
  {
    id: "app",
    prefix: "/app",
    label: "Créer une app ou un prototype",
    description: "Concept, écrans, fonctionnalités, données, UX et première logique technique.",
    prompt: "/app Prépare un concept d'application ou de prototype étudiant : problème, utilisateurs, écrans, fonctionnalités, logique, données, design et étapes de construction.",
    cost: 3,
    icon: Code2,
  },
  {
    id: "jeu",
    prefix: "/jeu",
    label: "Créer un jeu éducatif",
    description: "Concept, règles, progression, score, prototype et limites de publication.",
    prompt: "/jeu Prépare un jeu éducatif ou un mini-jeu étudiant : objectif pédagogique, gameplay loop, règles, score, progression, prototype et limites honnêtes.",
    cost: 3,
    icon: PlayCircle,
  },
  {
    id: "agent",
    prefix: "/agent",
    label: "Créer un agent IA étudiant",
    description: "Rôle, mission, limites, permissions, exemples et tests de comportement.",
    prompt: "/agent Prépare un agent IA étudiant : rôle, mission, contexte, limites, permissions sûres, exemples de réponses et tests avant utilisation.",
    cost: 3,
    icon: Sparkles,
  },
];

const quickIdeas = [
  "Crée une fiche de révision sur mon cours de spécialité.",
  "Prépare un diaporama et un script oral pour mon exposé.",
  "Crée un site étudiant pour présenter mon projet de groupe.",
  "Prépare un agent IA qui m'interroge et corrige mes erreurs.",
  "Fais une recherche guidée sans inventer de source.",
  "Transforme mon idée en mini-jeu éducatif avec score.",
];

const studentVisibleCommandIds: StudentIntent[] = [
  "fiche",
  "quiz",
  "flashcards",
  "slides",
  "oral",
  "resume",
  "planning",
  "interro",
  "corriger",
  "expliquer",
  "methode",
  "sources",
  "recherche",
  "agent",
];

const previewTabs: Array<{ id: StudentPreviewTab; label: string }> = [
  { id: "preview", label: "Aperçu" },
  { id: "structure", label: "Structure" },
  { id: "questions", label: "Questions" },
  { id: "correction", label: "Correction" },
  { id: "method", label: "Méthode" },
  { id: "export", label: "Export" },
];

const postResponseActions = [
  { id: "copy", label: "Copier", icon: Clipboard, ready: true },
  { id: "save", label: "Sauvegarder", icon: Save, ready: true },
  { id: "regenerate", label: "Régénérer", icon: RefreshCcw, ready: true },
  { id: "improve", label: "Améliorer", icon: Wand2, ready: true },
  { id: "project", label: "Transformer en projet", icon: FileText, ready: false },
  { id: "edit", label: "Modifier avec l'IA", icon: Sparkles, ready: true },
  { id: "method", label: "Voir la méthode", icon: LayoutList, ready: true },
  { id: "correction", label: "Voir la correction", icon: CheckCircle2, ready: true },
  { id: "train", label: "M'entraîner", icon: PlayCircle, ready: false },
  { id: "export", label: "Exporter", icon: Download, ready: false },
];

const makeAttachmentId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

const readStudentDrafts = (): StudentDraft[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(draftsStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveStudentDraft = (draft: StudentDraft) => {
  if (typeof window === "undefined") return [];
  const nextDrafts = [draft, ...readStudentDrafts().filter((item) => item.id !== draft.id)].slice(0, 20);
  window.localStorage.setItem(draftsStorageKey, JSON.stringify(nextDrafts));
  return nextDrafts;
};

const detectStudentIntent = (value: string, fallback: StudentIntent = "general"): StudentIntent => {
  const normalized = value.toLowerCase();
  const command = studentCommands.find((item) => normalized.startsWith(item.prefix));
  if (command) return command.id;
  if (normalized.includes("quiz") || normalized.includes("qcm")) return "quiz";
  if (normalized.includes("flashcard") || normalized.includes("carte")) return "flashcards";
  if (normalized.includes("slide") || normalized.includes("présentation")) return "slides";
  if (normalized.includes("oral") || normalized.includes("exposé")) return "oral";
  if (normalized.includes("planning") || normalized.includes("réviser")) return "planning";
  if (normalized.includes("résume") || normalized.includes("resume")) return "resume";
  if (normalized.includes("corrige") || normalized.includes("correction")) return "corriger";
  if (normalized.includes("explique") || normalized.includes("notion")) return "expliquer";
  if (normalized.includes("méthode") || normalized.includes("methode")) return "methode";
  if (normalized.includes("source") || normalized.includes("bibliographie")) return "sources";
  if (normalized.includes("recherche") || normalized.includes("documentaire")) return "recherche";
  if (normalized.includes("site") || normalized.includes("landing")) return "site";
  if (normalized.includes("application") || normalized.includes("app ") || normalized.includes("prototype")) return "app";
  if (normalized.includes("jeu") || normalized.includes("game") || normalized.includes("score")) return "jeu";
  if (normalized.includes("agent") || normalized.includes("assistant ia")) return "agent";
  if (normalized.includes("fiche")) return "fiche";
  return fallback;
};

const getStudentCommand = (intent: StudentIntent) =>
  studentCommands.find((command) => command.id === intent) ?? studentCommands[0];

const getPreviewTitle = (intent: StudentIntent) => {
  const titles: Record<StudentIntent, string> = {
    fiche: "Fiche de révision structurée",
    quiz: "Quiz corrigé",
    flashcards: "Flashcards actives",
    slides: "Slides de présentation",
    oral: "Plan d'oral",
    resume: "Résumé de cours",
    planning: "Planning de révision",
    interro: "Mode interrogation",
    corriger: "Correction pédagogique",
    expliquer: "Explication simple",
    methode: "Méthode étape par étape",
    sources: "Recherche / sources préparées",
    recherche: "Recherche guidée",
    site: "Brief de site étudiant",
    app: "Prototype d'application",
    jeu: "Mini-jeu éducatif",
    agent: "Agent IA étudiant",
    general: "Atelier de progression",
  };

  return titles[intent];
};

const getPreviewSections = (intent: StudentIntent) => {
  const sections: Record<StudentIntent, string[]> = {
    fiche: ["Notions clés", "Définitions", "Exemples", "Erreurs fréquentes", "Mini synthèse"],
    quiz: ["Questions faciles", "Questions moyennes", "Questions difficiles", "Correction", "Score conseillé"],
    flashcards: ["Question", "Réponse", "Niveau", "Piège", "Rappel rapide"],
    slides: ["Titre", "Plan", "Slides", "Transitions", "Script oral"],
    oral: ["Introduction", "Problématique", "Plan", "Conclusion", "Questions possibles"],
    resume: ["Idée générale", "Notions importantes", "Mots-clés", "Synthèse", "À retenir"],
    planning: ["Priorités", "Sessions courtes", "Exercices", "Révision finale", "Jour J"],
    interro: ["Question", "Réponse attendue", "Indice", "Correction", "Progression"],
    corriger: ["Ce qui est bon", "Ce qui manque", "Erreurs", "Version améliorée", "Conseil"],
    expliquer: ["Explication simple", "Exemple", "Méthode", "Mini-exercice", "Vérification"],
    methode: ["Étape 1", "Étape 2", "Étape 3", "Exemple guidé", "À refaire seul"],
    sources: ["Requêtes", "Critères fiables", "Sources fournies", "Bibliographie", "À vérifier"],
    recherche: ["Angle", "Requêtes", "Sources à vérifier", "Synthèse", "Limites"],
    site: ["Objectif", "Pages", "Sections", "CTA", "SEO local ou scolaire"],
    app: ["Problème", "Utilisateurs", "Écrans", "Fonctionnalités", "Étapes de build"],
    jeu: ["Objectif pédagogique", "Gameplay loop", "Règles", "Score", "Prototype"],
    agent: ["Rôle", "Mission", "Permissions", "Limites", "Tests"],
    general: ["Objectif", "Méthode", "Entraînement", "Correction", "Prochaine étape"],
  };

  return sections[intent];
};

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      textarea.style.height = `${Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY))}px`;
    },
    [maxHeight, minHeight],
  );

  useEffect(() => {
    adjustHeight(true);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

function StudentTypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((item) => (
        <span
          key={item}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F5C542]"
          style={{ animationDelay: `${item * 120}ms` }}
        />
      ))}
    </span>
  );
}

function StudentPreview({
  prompt,
  answer,
  intent,
  activeTab,
  onTabChange,
}: {
  prompt: string;
  answer: string;
  intent: StudentIntent;
  activeTab: StudentPreviewTab;
  onTabChange: (tab: StudentPreviewTab) => void;
}) {
  const command = getStudentCommand(intent);
  const title = getPreviewTitle(intent);
  const sections = getPreviewSections(intent);
  const hasAnswer = Boolean(answer.trim());

  return (
    <aside className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#070707]/92 p-4 shadow-[0_30px_120px_-70px_rgba(245,197,66,0.72)] sm:p-5 xl:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_0%,rgba(245,197,66,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">Preview Student</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h3>
          </div>
          <DataBadge state={hasAnswer ? "example" : "pending"} label={hasAnswer ? "Brouillon prêt" : "À générer"} />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {previewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                activeTab === tab.id
                  ? "border-[#F5C542]/45 bg-[#F5C542] text-black"
                  : "border-white/[0.08] bg-white/[0.035] text-white/60 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[520px] rounded-[28px] border border-white/[0.08] bg-black/45 p-4 xl:min-h-[640px] xl:p-5">
          {activeTab === "preview" ? (
            <div className="flex min-h-[488px] flex-col justify-between overflow-hidden rounded-[24px] border border-[#F5C542]/18 bg-[radial-gradient(circle_at_20%_0%,rgba(245,197,66,0.18),transparent_32%),linear-gradient(135deg,#111,#050505)] p-5 xl:min-h-[600px] xl:p-7">
              <div>
                <Badge className="border-[#F5C542]/25 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                  {command.label}
                </Badge>
                <h4 className="mt-6 max-w-2xl text-3xl font-semibold leading-[0.98] tracking-[-0.05em] text-white xl:text-4xl">
                  {hasAnswer ? title : "Colle ton cours, pose ta question, puis transforme la réponse en support clair."}
                </h4>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 xl:text-base">
                  {hasAnswer
                    ? answer.slice(0, 360)
                    : prompt || "La preview se remplit après génération : fiche, quiz, slides, oral, planning, recherche, site, app, jeu ou agent selon ta commande."}
                </p>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button type="button" className="rounded-2xl bg-[#F5C542] px-4 py-3 text-sm font-semibold text-black">
                  Modifier avec l'IA
                </button>
                <button type="button" className="rounded-2xl border border-white/[0.10] px-4 py-3 text-sm font-semibold text-white/72">
                  M'entraîner
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "structure" ? (
            <div className="space-y-3">
              {sections.map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Bloc {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">À compléter avec ton cours, puis à vérifier avant sauvegarde ou export.</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "questions" ? (
            <div className="space-y-3">
              {["Question de compréhension", "Question d'application", "Question piège", "Question d'oral", "Question de synthèse"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-sm text-white/62">
                  {item} : générée après réponse IA ou à partir du cours collé.
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "correction" ? (
            <div className="space-y-3">
              {["Ce qui est juste", "Ce qui manque", "Erreur à corriger", "Version améliorée", "Conseil pour progresser"].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 text-sm text-white/62">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "method" ? (
            <div className="space-y-3">
              {["Comprendre l'objectif", "Repérer les notions clés", "S'entraîner activement", "Corriger avec méthode", "Revoir avant l'évaluation"].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Étape {index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{item}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "export" ? (
            <div className="space-y-4">
              <DataBadge state="pending" label="Export à configurer" />
              <p className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-sm leading-6 text-white/62">
                L'export PDF, slides ou document n'est pas marqué comme actif tant que la brique réelle n'est pas branchée.
              </p>
              <pre className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/60 p-4 text-xs leading-6 text-white/68">
                <code>{`Type: ${intent}\nTitre: ${title}\nSections: ${sections.join(", ")}\nStatut: brouillon à sauvegarder`}</code>
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function StudentAIWorkspace({ space }: { space: AISpaceConfig }) {
  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<AISpaceMessage[]>([]);
  const [activeIntent, setActiveIntent] = useState<StudentIntent>("fiche");
  const [workflowMode, setWorkflowMode] = useState<StudentWorkflowMode>("direct");
  const [viewMode, setViewMode] = useState<StudentViewMode>("simple");
  const [mobilePanel, setMobilePanel] = useState<StudentMobilePanel>("chat");
  const [activePreviewTab, setActivePreviewTab] = useState<StudentPreviewTab>("preview");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [attachments, setAttachments] = useState<StudentAttachmentMeta[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<StudentPlan | undefined>();
  const [recentConversations, setRecentConversations] = useState<AISpaceConversation[]>([]);
  const [drafts, setDrafts] = useState<StudentDraft[]>([]);
  const [storageSource, setStorageSource] = useState<"supabase" | "localStorage">("localStorage");
  const [storageWarning, setStorageWarning] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commandPaletteRef = useRef<HTMLDivElement | null>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 92, maxHeight: 240 });

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );

  const detectedIntent = useMemo(() => detectStudentIntent(prompt, activeIntent), [activeIntent, prompt]);
  const selectedCommand = getStudentCommand(detectedIntent);
  const estimatedCredits = selectedCommand.cost;
  const commandSuggestions = useMemo(() => {
    const normalized = prompt.trim().toLowerCase();
    if (!normalized.startsWith("/")) return studentCommands;
    return studentCommands.filter((command) => command.prefix.startsWith(normalized) || command.label.toLowerCase().includes(normalized.slice(1)));
  }, [prompt]);
  const storageLabel =
    storageSource === "supabase" && !storageWarning ? "Historique synchronisé" : storageWarning ? "Historique local" : "Données locales";

  useEffect(() => {
    const storedMode = typeof window !== "undefined" ? window.localStorage.getItem(viewModeStorageKey) : null;
    if (storedMode === "advanced" || storedMode === "simple") setViewMode(storedMode);
    setDrafts(readStudentDrafts());
    setRecentConversations(readAISpaceConversations("student").slice(0, 5));

    let active = true;
    void loadAISpaceConversations("student").then((result) => {
      if (!active) return;
      setStorageSource(result.source);
      setStorageWarning(result.error);
      setRecentConversations(result.conversations.slice(0, 5));
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(viewModeStorageKey, viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (!prompt.trim().startsWith("/")) {
      setShowCommandPalette(false);
      return;
    }
    setShowCommandPalette(true);
    const index = commandSuggestions.findIndex((command) => command.prefix.startsWith(prompt.trim().toLowerCase()));
    setActiveSuggestionIndex(index >= 0 ? index : 0);
  }, [commandSuggestions, prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-student-command-button]");
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(target) && !commandButton?.contains(target)) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setPromptValue = useCallback((value: string) => {
    setPrompt(value);
    setActiveIntent(detectStudentIntent(value, activeIntent));
    window.requestAnimationFrame(() => adjustHeight());
  }, [activeIntent, adjustHeight]);

  useEffect(() => {
    const templatePrompt = searchParams.get("templatePrompt")?.trim();
    if (!templatePrompt) return;

    setPromptValue(templatePrompt);
    setActiveIntent(detectStudentIntent(templatePrompt, "general"));
    setWorkflowMode(searchParams.get("templateMode") === "plan" ? "plan" : "direct");
    setActivePreviewTab("preview");
    setMobilePanel("chat");
  }, [searchParams, setPromptValue]);

  const selectCommand = (intent: StudentIntent) => {
    const command = getStudentCommand(intent);
    setActiveIntent(intent);
    setPromptValue(`${command.prefix} `);
    setShowCommandPalette(false);
    textareaRef.current?.focus();
  };

  const handleCommandKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestionIndex((previous) => (previous < commandSuggestions.length - 1 ? previous + 1 : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestionIndex((previous) => (previous > 0 ? previous - 1 : commandSuggestions.length - 1));
        return;
      }
      if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        const command = commandSuggestions[activeSuggestionIndex];
        if (command) selectCommand(command.id);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setShowCommandPalette(false);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendStudentPrompt();
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files?.length) return;
    const nextFiles = Array.from(files).map((file) => ({
      id: makeAttachmentId(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    }));
    setAttachments((previous) => [...previous, ...nextFiles].slice(0, 6));
    toast({
      title: "Pièce jointe préparée",
      description: "Le fichier est listé localement. L'analyse complète du contenu reste à configurer si elle n'est pas branchée.",
    });
  };

  const buildPlan = (intent: StudentIntent): StudentPlan => ({
    title: `Plan Student AI - ${getPreviewTitle(intent)}`,
    safetyNote: "Student AI prépare la méthode avant génération : objectif apprendre, pas tricher.",
    steps: [
      "Identifier le niveau, le sujet et l'échéance.",
      "Transformer la demande en support pédagogique clair.",
      "Ajouter entraînement actif, questions, correction ou brief builder selon le format.",
      "Vérifier anti-triche, méthode, sources, limites et absence de fausse publication.",
      "Sauvegarder en brouillon local si le résultat est utilisable.",
    ],
  });

  const saveResponseDraft = ({ finalPrompt, answer, intent }: { finalPrompt: string; answer: string; intent: StudentIntent }) => {
    const draft: StudentDraft = {
      id: makeAttachmentId(),
      title: `${getPreviewTitle(intent)} - ${finalPrompt.trim().slice(0, 46) || "Student AI"}`,
      intent,
      answer,
      createdAt: new Date().toISOString(),
    };
    setDrafts(saveStudentDraft(draft));
  };

  const sendStudentPrompt = async ({ forceDirect = false }: { forceDirect?: boolean } = {}) => {
    const cleanPrompt = prompt.trim();
    const intent = detectStudentIntent(cleanPrompt, activeIntent);
    const command = getStudentCommand(intent);
    const finalPrompt = cleanPrompt || command.prompt;

    if (!finalPrompt) {
      toast({
        title: "Ajoute une demande",
        description: "Colle ton cours, pose une question ou choisis une commande Student AI.",
        variant: "destructive",
      });
      return;
    }

    if (workflowMode === "plan" && !forceDirect) {
      setActiveIntent(intent);
      setPendingPlan(buildPlan(intent));
      setActivePreviewTab("structure");
      return;
    }

    setPendingPlan(undefined);
    setIsGenerating(true);
    const startedAt = performance.now();
    const userMessage = createAISpaceMessage("user", finalPrompt);
    setMessages((previous) => [...previous, userMessage]);

    try {
      const response = await runAISpaceAssistant({
        spaceType: "student",
        prompt: finalPrompt,
        conversationId,
        history: messages,
        profileLevel: viewMode === "advanced" ? "advanced" : "beginner",
        intent,
        workflowMode,
        expertRoute: [
          "Pédagogie",
          "Méthode",
          "Mémorisation",
          "Correction",
          "Recherche",
          "Slides",
          "Site Builder",
          "Game Builder",
          "Agent Builder",
          "App Prototype",
          "Quality Gate",
        ],
        attachments,
      });
      const assistantMessage = createAISpaceMessage("assistant", response.answer, response.source);
      const saveResult = await saveAISpaceConversationTurnPersistent("student", conversationId, finalPrompt, [
        userMessage,
        assistantMessage,
      ]);

      setConversationId(saveResult.conversation.id);
      setMessages((previous) => [...previous, assistantMessage]);
      setStorageSource(saveResult.source);
      setStorageWarning(saveResult.error);
      setRecentConversations((previous) =>
        [saveResult.conversation, ...previous.filter((conversation) => conversation.id !== saveResult.conversation.id)].slice(0, 5),
      );
      setActiveIntent(intent);
      setActivePreviewTab("preview");
      setPrompt("");
      saveResponseDraft({ finalPrompt, answer: response.answer, intent });

      void saveAISpaceUsageLog({
        spaceType: "student",
        conversationId: saveResult.conversation.id,
        response,
        durationMs: Math.round(performance.now() - startedAt),
      });

      if (response.source === "mock-fallback") {
        toast({
          title: "Mode secours Pixelrises",
          description: "L'IA réelle n'a pas répondu. La structure affichée reste un point de départ pédagogique.",
        });
      }

      if (saveResult.error) {
        toast({
          title: "Synchronisation cloud à vérifier",
          description: "La conversation reste sauvegardée localement.",
        });
      }
    } finally {
      setIsGenerating(false);
      startTransition(() => adjustHeight(true));
    }
  };

  const handlePostAction = (actionId: string) => {
    const answer = lastAssistantMessage?.content ?? "";

    if (actionId === "copy") {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        void navigator.clipboard.writeText(answer || prompt);
      }
      toast({ title: "Copié", description: "Le dernier résultat a été copié si le navigateur l'autorise." });
      return;
    }

    if (actionId === "save") {
      if (!answer) {
        toast({ title: "Rien à sauvegarder", description: "Génère d'abord une réponse Student AI." });
        return;
      }
      saveResponseDraft({
        finalPrompt: prompt || "Sauvegarde manuelle",
        answer,
        intent: activeIntent,
      });
      toast({ title: "Sauvegardé", description: "Le brouillon Student AI est gardé en local." });
      return;
    }

    if (actionId === "regenerate") {
      const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content;
      if (lastUser) setPromptValue(lastUser);
      void sendStudentPrompt({ forceDirect: true });
      return;
    }

    if (actionId === "improve" || actionId === "edit") {
      setPromptValue(`Améliore ce support pédagogique en le rendant plus clair, plus court et plus facile à retenir :\n\n${answer}`);
      return;
    }

    if (actionId === "method") {
      setActivePreviewTab("method");
      setMobilePanel("preview");
      return;
    }

    if (actionId === "correction") {
      setActivePreviewTab("correction");
      setMobilePanel("preview");
      return;
    }

    toast({
      title: "À configurer",
      description: "Cette action est préparée, mais elle n'est pas branchée comme action réelle pour Student AI.",
    });
  };

  const conversationPanel = (
    <div className="rounded-[28px] border border-white/[0.08] bg-black/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Conversation</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Réponses Student AI</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <DataBadge state={storageWarning ? "mock" : storageSource === "supabase" ? "real" : "example"} label={storageLabel} />
          {isGenerating || isPending ? <DataBadge state="pending" label="Student AI réfléchit" /> : null}
        </div>
      </div>

      <div className="mt-5 min-h-[320px] space-y-4 rounded-[24px] border border-white/[0.08] bg-black/35 p-4">
        {!messages.length ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <GraduationCap className="h-10 w-10 text-[#F5C542]" />
            <h4 className="mt-4 text-2xl font-semibold tracking-tight text-white">Lance une demande Student.</h4>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              Exemple : colle un cours, crée une fiche, prépare un oral, fais un quiz, corrige une interrogation ou prépare un site, une app, un jeu ou un agent IA. L'objectif est d'apprendre, pas de tricher.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-[24px] border p-4",
                message.role === "user"
                  ? "ml-auto max-w-[88%] border-[#F5C542]/24 bg-[#F5C542]/10 text-white"
                  : "mr-auto max-w-[94%] border-white/[0.08] bg-white/[0.04] text-white/72",
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
              {message.role === "assistant" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {postResponseActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handlePostAction(action.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                          action.ready
                            ? "border-white/[0.08] bg-black/25 text-white/58 hover:border-[#F5C542]/28 hover:text-[#F5C542]"
                            : "border-white/[0.08] bg-white/[0.025] text-white/36",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {action.label}
                        {!action.ready ? <span className="text-[10px] text-[#F5C542]">À configurer</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {message.source === "mock-fallback" ? (
                <div className="mt-3">
                  <DataBadge state="mock" label="Mode secours Pixelrises" />
                </div>
              ) : null}
            </div>
          ))
        )}

        {isGenerating ? (
          <div className="mr-auto max-w-[94%] rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white/60">
            Student AI prépare une réponse pédagogique <StudentTypingDots />
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <V2PageShell
      eyebrow="Student AI"
      title="Atelier Student AI"
      description="Comprends, révise, prépare tes supports et entraîne-toi avec une IA pédagogique qui explique la méthode avant le résultat."
      hideHeader
    >
      <SEOHead title={`${space.name} | Pixelrises V2`} description={space.description} noIndex />

      <section className="relative overflow-hidden rounded-[38px] border border-white/[0.08] bg-[#070707]/82 p-4 shadow-[0_34px_140px_-80px_rgba(245,197,66,0.8)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,197,66,0.16),transparent_33%),radial-gradient(circle_at_0%_22%,rgba(245,197,66,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
        <div className="relative">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
              <div className="inline-flex rounded-full border border-[#F5C542]/20 bg-[#F5C542]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">
                Student AI Pixelrises
              </div>
              <h1 className="mt-5 max-w-4xl text-[38px] font-semibold leading-[0.94] tracking-[-0.06em] text-white sm:text-[58px] lg:text-[72px]">
                Comment puis-je t'aider à apprendre aujourd'hui ?
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                Tape une commande ou pose une question. Student AI transforme ton cours ou ton idée en fiche, quiz, diaporama, oral, planning, recherche, site, app, jeu ou agent IA guidé.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
              className="grid gap-3 rounded-[28px] border border-white/[0.08] bg-black/30 p-3"
            >
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-1">
                {(["simple", "advanced"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition",
                      viewMode === mode ? "bg-[#F5C542] text-black" : "text-white/62 hover:text-white",
                    )}
                  >
                    {mode === "simple" ? "Simple" : "Avancé"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-1">
                {(["direct", "plan"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWorkflowMode(mode)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition",
                      workflowMode === mode ? "bg-white text-black" : "text-white/62 hover:text-white",
                    )}
                  >
                    {mode === "direct" ? "Mode Direct" : "Mode Plan"}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.05] p-3 text-xs leading-5 text-white/58">
                Coût estimé : <span className="font-semibold text-[#F5C542]">{estimatedCredits} crédit(s)</span>. Aucun débit affiché comme réel si la génération échoue.
              </div>
            </motion.div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {["Fiches & quiz", "Slides & oral", "Sites, apps, jeux", "Agents IA guidés", "Recherche fiable", "Anti-triche pédagogique"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white/68">
                <Sparkles className="mr-2 inline h-4 w-4 text-[#F5C542]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 flex rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-1 lg:hidden">
        {(["chat", "preview"] as const).map((panel) => (
          <button
            key={panel}
            type="button"
            onClick={() => setMobilePanel(panel)}
            className={cn(
              "flex-1 rounded-[20px] px-4 py-3 text-sm font-semibold transition",
              mobilePanel === panel ? "bg-[#F5C542] text-black" : "text-white/62",
            )}
          >
            {panel === "chat" ? "Chat" : "Preview"}
          </button>
        ))}
      </div>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(600px,720px)]">
        <div className={cn("space-y-5", mobilePanel === "preview" && "hidden lg:block")}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.42 }}
            className="rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5"
          >
            <div className="relative mx-auto max-w-4xl">
              {conversationPanel}

              <div className="mt-6 border-t border-white/[0.06] pt-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">Commande ou question</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                  Que veux-tu apprendre ou préparer ?
                </h2>
                <p className="mt-2 text-sm text-white/42">Utilise `/` pour ouvrir les commandes Student AI.</p>
              </div>

              <div className="relative mt-6 rounded-[28px] border border-white/[0.08] bg-black/45 shadow-[0_26px_100px_-72px_rgba(245,197,66,0.7)]">
                {showCommandPalette ? (
                  <motion.div
                    ref={commandPaletteRef}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-3 bottom-full z-20 mb-3 overflow-hidden rounded-2xl border border-[#F5C542]/20 bg-[#050505]/96 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="max-h-[360px] overflow-y-auto p-2">
                      {commandSuggestions.map((command, index) => {
                        const Icon = command.icon;
                        return (
                          <button
                            key={command.prefix}
                            type="button"
                            onClick={() => selectCommand(command.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                              index === activeSuggestionIndex ? "bg-[#F5C542]/12 text-white" : "text-white/68 hover:bg-white/[0.04]",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-[#F5C542]" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold">{command.label}</span>
                              <span className="block text-xs text-white/42">{command.description}</span>
                            </span>
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-[#F5C542]">
                              {command.prefix}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}

                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(event) => setPromptValue(event.target.value)}
                  onKeyDown={handleCommandKeyDown}
                  placeholder="Ex : crée un diaporama, une fiche, une app, un jeu éducatif ou un agent IA pour mon projet..."
                  className="min-h-[92px] w-full resize-none rounded-t-[28px] border-0 bg-transparent px-5 py-5 text-sm leading-6 text-white outline-none placeholder:text-white/28"
                />

                <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => handleFileChange(event.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-2 text-white/55 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
                      aria-label="Ajouter une pièce jointe"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      data-student-command-button
                      onClick={() => setShowCommandPalette((value) => !value)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/55 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
                    >
                      Commandes
                    </button>
                    <DataBadge state="example" label={selectedCommand.label} />
                  </div>
                  <Button
                    type="button"
                    onClick={() => void sendStudentPrompt()}
                    disabled={isGenerating}
                    className="rounded-2xl bg-[#F5C542] px-5 text-black hover:bg-[#FFD766]"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {workflowMode === "plan" ? "Préparer le plan" : "Générer"}
                  </Button>
                </div>
              </div>

              {attachments.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <span key={file.id} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-white/58">
                      {file.name} · {formatFileSize(file.size)}
                      <button type="button" onClick={() => setAttachments((previous) => previous.filter((item) => item.id !== file.id))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <DataBadge state="pending" label="Pièce jointe à configurer" />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {studentCommands.filter((command) => studentVisibleCommandIds.includes(command.id)).map((command) => {
                  const Icon = command.icon;
                  return (
                    <button
                      key={command.prefix}
                      type="button"
                      onClick={() => selectCommand(command.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/56 transition hover:border-[#F5C542]/35 hover:text-[#F5C542]"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {command.prefix}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {quickIdeas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setPromptValue(idea)}
                    className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-left text-sm text-white/58 transition hover:border-[#F5C542]/28 hover:text-white"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {pendingPlan ? (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[34px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <DataBadge state="example" label="Mode Plan" />
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{pendingPlan.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">{pendingPlan.safetyNote}</p>
                </div>
                <Button onClick={() => void sendStudentPrompt({ forceDirect: true })} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  Valider et générer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {pendingPlan.steps.map((step, index) => (
                  <div key={step} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Étape {index + 1}</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          <div className="sr-only">
            <span>Fiche de révision structurée</span>
            <span>Recherche Google préparée</span>
            <span>Connexion requise</span>
            <span>Studio de révision</span>
          </div>
        </div>

        <div className={cn("space-y-5 xl:min-w-[600px] 2xl:min-w-[680px]", mobilePanel === "chat" && "hidden lg:block")}>
          <StudentPreview
            prompt={prompt || lastAssistantMessage?.content || "Aucun cours encore collé."}
            answer={lastAssistantMessage?.content ?? ""}
            intent={activeIntent}
            activeTab={activePreviewTab}
            onTabChange={setActivePreviewTab}
          />

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#F5C542]" />
              <div>
                <p className="text-sm font-semibold text-white">AI Orchestrator / pédagogie</p>
                <p className="text-xs leading-5 text-white/45">Routage Student AI sécurisé côté serveur, sans détail interne ni donnée sensible côté client.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {["Pédagogie", "Méthode", "Recherche", "Slides", "Site/App", "Jeu", "Agent IA", "Correction", "Anti-triche"].map((expert) => (
                <Badge key={expert} className="border-[#F5C542]/18 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                  {expert}
                </Badge>
              ))}
            </div>
          </div>

          {viewMode === "advanced" ? (
            <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Avancé</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Qualité, coûts et limites honnêtes</h3>
              <div className="mt-4 grid gap-3">
                {[
                  `Format : ${selectedCommand.label}`,
                  `Coût estimé : ${estimatedCredits} crédit(s)`,
                  "Upload : fichier listé localement, analyse complète à configurer si non branchée",
                  "Recherche web : à configurer, aucune source inventée",
                  "Builders : site, app, jeu et agent préparés comme briefs ou brouillons, sans publication automatique",
                  "Export : préparé, pas présenté comme fichier réel sans preuve",
                ].map((line) => (
                  <div key={line} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-sm text-white/58">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-[#F5C542]" />
                <p className="text-sm font-semibold text-white">Historique & travaux</p>
              </div>
              <DataBadge state="example" label={`${drafts.length} brouillon(s)`} />
            </div>
            {storageWarning ? (
              <p className="mt-3 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.05] p-3 text-xs leading-5 text-[#F5C542]">
                {storageWarning}
              </p>
            ) : null}
            <div className="mt-4 space-y-2">
              {drafts.slice(0, 4).map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => {
                    setPromptValue(draft.answer);
                    setActiveIntent(draft.intent);
                  }}
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-left transition hover:border-[#F5C542]/25"
                >
                  <p className="text-sm font-semibold text-white/78">{draft.title}</p>
                  <p className="mt-1 text-xs text-white/36">{new Date(draft.createdAt).toLocaleString("fr-FR")}</p>
                </button>
              ))}
              {!drafts.length ? <p className="text-sm leading-6 text-white/42">Aucun brouillon Student AI pour le moment.</p> : null}
            </div>
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <DataBadge state={storageWarning ? "mock" : storageSource === "supabase" ? "real" : "example"} label={storageLabel} />
              <div className="mt-3 space-y-2">
                {recentConversations.slice(0, 3).map((conversation) => (
                  <div key={conversation.id} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                    <p className="text-sm font-semibold text-white/78">{conversation.title}</p>
                    <p className="mt-1 text-xs text-white/36">{new Date(conversation.updatedAt).toLocaleString("fr-FR")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full justify-between rounded-2xl border-white/[0.10] bg-transparent text-white/72">
            <Link to="/ai-spaces">
              Tous les AI Spaces
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </V2PageShell>
  );
}
