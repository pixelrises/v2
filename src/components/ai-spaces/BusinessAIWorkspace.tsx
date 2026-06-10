import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Code2,
  Download,
  FileText,
  History,
  Loader2,
  Paperclip,
  PlayCircle,
  RefreshCcw,
  Rocket,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge } from "@/components/ui/data-state";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  buildBusinessPlan,
  buildBusinessPreview,
  buildBusinessPromptEnvelope,
  businessCommands,
  businessPreviewTabs,
  detectBusinessIntent,
  estimateBusinessCredits,
  getBusinessExperts,
  getBusinessCommand,
  makeBusinessDraftId,
  readBusinessDrafts,
  requiresBusinessPreview,
  saveBusinessDraft,
  type BusinessAttachmentMeta,
  type BusinessDraftProject,
  type BusinessIntent,
  type BusinessPlan,
  type BusinessPreviewTab,
} from "@/modules/ai-spaces/business-orchestrator";
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

const viewModeStorageKey = "pixelrises-v2-business-ai-view-mode";

type BusinessViewMode = "simple" | "advanced";
type BusinessWorkflowMode = "direct" | "plan";
type BusinessMobilePanel = "chat" | "preview";

const useAutoResizeTextarea = ({ minHeight, maxHeight }: { minHeight: number; maxHeight: number }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(
    (reset = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = `${minHeight}px`;
      if (reset) return;

      const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${nextHeight}px`;
    },
    [maxHeight, minHeight],
  );

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

const makeAttachmentId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const postResponseActions = [
  { id: "copy", label: "Copier", icon: Clipboard, ready: true },
  { id: "save", label: "Sauvegarder", icon: Save, ready: true },
  { id: "regenerate", label: "Régénérer", icon: RefreshCcw, ready: true },
  { id: "improve", label: "Améliorer", icon: Wand2, ready: true },
  { id: "project", label: "Transformer en projet", icon: FileText, ready: false },
  { id: "structure", label: "Voir la structure", icon: Settings2, ready: true },
  { id: "code", label: "Voir le code", icon: Code2, ready: true },
  { id: "test", label: "Tester", icon: PlayCircle, ready: false },
  { id: "export", label: "Exporter", icon: Download, ready: false },
  { id: "publish", label: "Publier", icon: Rocket, ready: false },
];

const quickIdeas = [
  "Créer un site pour un restaurant italien à Lyon avec réservation",
  "Transformer mon idée en offre claire et rentable",
  "Faire une landing page pour vendre un service premium",
  "Comparer mon positionnement avec mes concurrents",
];

function BusinessTypingDots() {
  /*
  const conversationPanel = (
    <div className="rounded-[28px] border border-white/[0.08] bg-black/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Conversation</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Réponses Business AI</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <DataBadge state={storageWarning ? "mock" : storageSource === "supabase" ? "real" : "example"} label={storageLabel} />
          {isGenerating ? <DataBadge state="pending" label="Business AI réfléchit" /> : null}
        </div>
      </div>

      <div className="mt-5 min-h-[320px] space-y-4 rounded-[24px] border border-white/[0.08] bg-black/35 p-4">
        {!messages.length ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Sparkles className="h-10 w-10 text-[#F5C542]" />
            <h4 className="mt-4 text-2xl font-semibold tracking-tight text-white">Lance une demande Business.</h4>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              Exemple : crée une landing, analyse une offre, prépare un prix, ou demande une stratégie claire. Rien n'est publié ni exporté sans validation.
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
            Business AI coordonne les experts <BusinessTypingDots />
          </div>
        ) : null}
      </div>
    </div>
  );

  */

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

function ProjectPreview({
  prompt,
  answer,
  intent,
  activeTab,
  onTabChange,
}: {
  prompt: string;
  answer: string;
  intent: BusinessIntent;
  activeTab: BusinessPreviewTab;
  onTabChange: (tab: BusinessPreviewTab) => void;
}) {
  const preview = useMemo(() => buildBusinessPreview(prompt, answer, intent), [answer, intent, prompt]);
  const experts = getBusinessExperts(intent);
  const command = getBusinessCommand(intent);
  const hasPreview = requiresBusinessPreview(intent);

  const codeSample = [
    "<section class=\"pixelrises-preview\">",
    `  <h1>${preview.hero}</h1>`,
    `  <p>${preview.subtitle.slice(0, 90)}</p>`,
    `  <button>${preview.cta}</button>`,
    "</section>",
  ].join("\n");

  return (
    <aside className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#070707]/92 p-4 shadow-[0_30px_120px_-70px_rgba(245,197,66,0.72)] sm:p-5 xl:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_0%,rgba(245,197,66,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">Atelier preview</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{preview.title}</h3>
          </div>
          <DataBadge state={hasPreview ? "example" : "pending"} label={preview.status} />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {businessPreviewTabs.map((tab) => (
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

        <div className="mt-4 min-h-[430px] rounded-[28px] border border-white/[0.08] bg-black/45 p-4 lg:min-h-[520px] xl:min-h-[640px] xl:p-5">
          {activeTab === "preview" ? (
            <div className="flex min-h-[396px] flex-col justify-between overflow-hidden rounded-[24px] border border-[#F5C542]/18 bg-[radial-gradient(circle_at_20%_0%,rgba(245,197,66,0.18),transparent_32%),linear-gradient(135deg,#111,#050505)] p-5 lg:min-h-[488px] xl:min-h-[600px] xl:p-7">
              <div>
                <Badge className="border-[#F5C542]/25 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                  {command?.shortLabel ?? "Business"}
                </Badge>
                <h4 className="mt-6 max-w-2xl text-3xl font-semibold leading-[0.98] tracking-[-0.05em] text-white xl:text-4xl">
                  {preview.hero}
                </h4>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 xl:text-base">{preview.subtitle}</p>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button type="button" className="rounded-2xl bg-[#F5C542] px-4 py-3 text-sm font-semibold text-black">
                  {preview.cta}
                </button>
                <button type="button" className="rounded-2xl border border-white/[0.10] px-4 py-3 text-sm font-semibold text-white/72">
                  Voir la structure
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "structure" ? (
            <div className="space-y-3">
              {["Objectif", "Audience", "Promesse", "Sections", "CTA", "Validation qualité"].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Étape {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    {index === 5
                      ? "Vérifier cohérence, CTA, limites, responsive et absence de promesses mensongères."
                      : "À préciser avec le contexte utilisateur puis enrichir par Business AI."}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "code" ? (
            <div>
              <DataBadge state="pending" label="Code à configurer" />
              <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/60 p-4 text-xs leading-6 text-white/68">
                <code>{codeSample}</code>
              </pre>
              <p className="mt-3 text-xs leading-5 text-white/42">
                Le code affiché est une structure brouillon. La génération de code réelle reste à brancher au moteur complet.
              </p>
            </div>
          ) : null}

          {activeTab === "brief" ? (
            <div className="space-y-3 text-sm leading-6 text-white/62">
              <p className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">{prompt || "Brief à compléter."}</p>
              <p className="rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.05] p-4">
                Experts routés : {experts.join(", ")}.
              </p>
            </div>
          ) : null}

          {activeTab === "assets" ? (
            <div className="grid gap-3">
              <DataBadge state={intent === "image" ? "pending" : "example"} label={intent === "image" ? "Image à configurer" : "Assets préparés"} />
              {["Prompt image", "Palette", "Message clé", "Format marketing"].map((asset) => (
                <div key={asset} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 text-sm text-white/62">
                  {asset} : préparation disponible, génération réelle seulement si le moteur image serveur est configuré.
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "tests" ? (
            <div className="space-y-3">
              {[
                "Lisibilité du message",
                "CTA visible et cohérent",
                "Pas de faux avis ou fausses statistiques",
                "Responsive à vérifier visuellement",
                "Export/publication non marqués comme faits sans preuve",
              ].map((check) => (
                <div key={check} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 text-sm text-white/62">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                  <span>{check}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function BusinessAIWorkspace({ space }: { space: AISpaceConfig }) {
  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<AISpaceMessage[]>([]);
  const [activeIntent, setActiveIntent] = useState<BusinessIntent>("general");
  const [workflowMode, setWorkflowMode] = useState<BusinessWorkflowMode>("direct");
  const [viewMode, setViewMode] = useState<BusinessViewMode>("simple");
  const [mobilePanel, setMobilePanel] = useState<BusinessMobilePanel>("chat");
  const [activePreviewTab, setActivePreviewTab] = useState<BusinessPreviewTab>("preview");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [attachments, setAttachments] = useState<BusinessAttachmentMeta[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<BusinessPlan | undefined>();
  const [recentConversations, setRecentConversations] = useState<AISpaceConversation[]>([]);
  const [drafts, setDrafts] = useState<BusinessDraftProject[]>([]);
  const [storageSource, setStorageSource] = useState<"supabase" | "localStorage">("localStorage");
  const [storageWarning, setStorageWarning] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commandPaletteRef = useRef<HTMLDivElement | null>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 86, maxHeight: 220 });

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );

  const detectedIntent = useMemo(() => detectBusinessIntent(prompt, activeIntent), [activeIntent, prompt]);
  const selectedCommand = getBusinessCommand(detectedIntent);
  const experts = getBusinessExperts(detectedIntent);
  const estimatedCredits = estimateBusinessCredits(detectedIntent);
  const commandSuggestions = useMemo(() => {
    const normalized = prompt.trim().toLowerCase();
    if (!normalized.startsWith("/")) return businessCommands;
    return businessCommands.filter((command) => command.prefix.startsWith(normalized) || command.label.toLowerCase().includes(normalized.slice(1)));
  }, [prompt]);

  useEffect(() => {
    const storedMode = typeof window !== "undefined" ? window.localStorage.getItem(viewModeStorageKey) : null;
    if (storedMode === "advanced" || storedMode === "simple") setViewMode(storedMode);
    setDrafts(readBusinessDrafts());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(viewModeStorageKey, viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    setRecentConversations(readAISpaceConversations("business").slice(0, 5));

    let active = true;
    void loadAISpaceConversations("business").then((result) => {
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
    const shouldShow = prompt.trim().startsWith("/") && !prompt.trim().includes(" ");
    setShowCommandPalette(shouldShow);
    if (shouldShow) setActiveSuggestionIndex(0);
  }, [prompt]);

  useEffect(() => {
    const closePalette = (event: MouseEvent) => {
      const target = event.target as Node;
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(target)) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", closePalette);
    return () => document.removeEventListener("mousedown", closePalette);
  }, []);

  const setPromptValue = useCallback((value: string) => {
    setPrompt(value);
    window.requestAnimationFrame(() => adjustHeight());
  }, [adjustHeight]);

  useEffect(() => {
    const templatePrompt = searchParams.get("templatePrompt")?.trim();
    if (!templatePrompt) return;

    setPromptValue(templatePrompt);
    setActiveIntent(detectBusinessIntent(templatePrompt, "general"));
    setWorkflowMode(searchParams.get("templateMode") === "plan" ? "plan" : "direct");
    setActivePreviewTab("preview");
    setMobilePanel("chat");
  }, [searchParams, setPromptValue]);

  const selectCommand = (intent: BusinessIntent) => {
    const command = getBusinessCommand(intent);
    if (!command) return;
    setActiveIntent(intent);
    setPromptValue(`${command.prefix} ${command.prompt}`);
    setShowCommandPalette(false);
    setActivePreviewTab("preview");
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files?.length) return;

    const nextFiles = Array.from(files).slice(0, 4).map((file) => ({
      id: makeAttachmentId(),
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    setAttachments((previous) => [...previous, ...nextFiles].slice(0, 6));
    toast({
      title: "Pièce jointe préparée",
      description: "Le fichier est listé localement. L'upload complet reste à configurer si besoin.",
    });
  };

  const handleCommandKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestionIndex((index) => (index + 1) % Math.max(commandSuggestions.length, 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestionIndex((index) => (index <= 0 ? commandSuggestions.length - 1 : index - 1));
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const command = commandSuggestions[activeSuggestionIndex];
        if (command) selectCommand(command.id);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setShowCommandPalette(false);
      }
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendBusinessPrompt();
    }
  };

  const createPlanOnly = () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      toast({
        title: "Ajoute une demande",
        description: "Décris ton projet ou choisis une commande Business.",
        variant: "destructive",
      });
      return;
    }

    const intent = detectBusinessIntent(cleanPrompt, activeIntent);
    const plan = buildBusinessPlan(cleanPrompt, intent);
    setPendingPlan(plan);
    setActiveIntent(intent);
    setMobilePanel("preview");
    toast({
      title: "Plan préparé",
      description: "Business AI attend ta validation avant de générer.",
    });
  };

  const saveResponseDraft = ({
    finalPrompt,
    answer,
    intent,
    source,
  }: {
    finalPrompt: string;
    answer: string;
    intent: BusinessIntent;
    source: "real" | "mock-fallback";
  }) => {
    const command = getBusinessCommand(intent);
    const now = new Date().toISOString();
    const draft: BusinessDraftProject = {
      id: makeBusinessDraftId(),
      title: `${command?.outputType ?? "Projet business"} - ${finalPrompt.slice(0, 42) || "Nouveau brouillon"}`,
      intent,
      prompt: finalPrompt,
      answer,
      source,
      version: 1,
      createdAt: now,
      updatedAt: now,
      estimatedCredits: estimateBusinessCredits(intent),
      attachments,
    };

    saveBusinessDraft(draft);
    setDrafts(readBusinessDrafts());
  };

  const sendBusinessPrompt = async ({ forceDirect = false }: { forceDirect?: boolean } = {}) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      toast({
        title: "Ajoute une demande",
        description: "Décris ce que Business AI doit créer, analyser ou améliorer.",
        variant: "destructive",
      });
      return;
    }

    const intent = detectBusinessIntent(cleanPrompt, activeIntent);

    if (workflowMode === "plan" && !forceDirect) {
      createPlanOnly();
      return;
    }

    const nextExperts = getBusinessExperts(intent);
    const envelope = buildBusinessPromptEnvelope({
      prompt: cleanPrompt,
      intent,
      mode: workflowMode,
      experts: nextExperts,
      attachments,
    });
    const finalPrompt = pendingPlan
      ? [`Plan validé: ${pendingPlan.title}`, ...pendingPlan.steps.map((step, index) => `${index + 1}. ${step}`), "", envelope].join("\n")
      : envelope;

    setIsGenerating(true);
    setActiveIntent(intent);
    setPendingPlan(undefined);
    setMobilePanel("chat");
    const startedAt = performance.now();
    const userMessage = createAISpaceMessage("user", cleanPrompt);
    setMessages((previous) => [...previous, userMessage]);

    try {
      const response = await runAISpaceAssistant({
        spaceType: "business",
        prompt: finalPrompt,
        quickActionId: selectedCommand?.id,
        conversationId,
        history: messages,
        profileLevel: viewMode === "advanced" ? "advanced" : "beginner",
        intent,
        workflowMode,
        expertRoute: nextExperts,
        attachments,
      });

      const assistantMessage = createAISpaceMessage("assistant", response.answer, response.source);
      const saveResult = await saveAISpaceConversationTurnPersistent("business", conversationId, cleanPrompt, [
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
      setPromptValue("");
      saveResponseDraft({
        finalPrompt: cleanPrompt,
        answer: response.answer,
        intent,
        source: response.source,
      });

      void saveAISpaceUsageLog({
        spaceType: "business",
        conversationId: saveResult.conversation.id,
        response,
        durationMs: Math.round(performance.now() - startedAt),
      });

      if (response.source === "mock-fallback") {
        toast({
          title: "Mode secours Pixelrises",
          description: "L'IA réelle n'a pas répondu. La structure affichée reste un point de départ honnête.",
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
      window.requestAnimationFrame(() => adjustHeight(true));
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
        toast({ title: "Rien à sauvegarder", description: "Génère d'abord une réponse Business AI." });
        return;
      }
      saveResponseDraft({
        finalPrompt: prompt || "Sauvegarde manuelle",
        answer,
        intent: activeIntent,
        source: lastAssistantMessage?.source ?? "mock-fallback",
      });
      toast({ title: "Sauvegardé", description: "Le brouillon Business AI est gardé en local." });
      return;
    }

    if (actionId === "regenerate") {
      if (!messages.length) return void sendBusinessPrompt({ forceDirect: true });
      const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content;
      if (lastUser) setPromptValue(lastUser);
      void sendBusinessPrompt({ forceDirect: true });
      return;
    }

    if (actionId === "improve") {
      setPromptValue(`Améliore ce résultat en le rendant plus clair, plus rentable et plus actionnable :\n\n${answer}`);
      return;
    }

    if (actionId === "structure") {
      setActivePreviewTab("structure");
      setMobilePanel("preview");
      return;
    }

    if (actionId === "code") {
      setActivePreviewTab("code");
      setMobilePanel("preview");
      return;
    }

    toast({
      title: "À configurer",
      description: "Cette action est préparée, mais elle n'est pas branchée comme action réelle dans P9-B.",
    });
  };

  const storageLabel =
    storageSource === "supabase" && !storageWarning ? "Historique synchronisé" : storageWarning ? "Historique local" : "Données locales";

  const showLegacyConversationPanel = false;

  const conversationPanel = (
    <div className="rounded-[28px] border border-white/[0.08] bg-black/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Conversation</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Réponses Business AI</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <DataBadge state={storageWarning ? "mock" : storageSource === "supabase" ? "real" : "example"} label={storageLabel} />
          {isGenerating ? <DataBadge state="pending" label="Business AI réfléchit" /> : null}
        </div>
      </div>

      <div className="mt-5 min-h-[320px] space-y-4 rounded-[24px] border border-white/[0.08] bg-black/35 p-4">
        {!messages.length ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Sparkles className="h-10 w-10 text-[#F5C542]" />
            <h4 className="mt-4 text-2xl font-semibold tracking-tight text-white">Lance une demande Business.</h4>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              Exemple : crée une landing, analyse une offre, prépare un prix, ou demande une stratégie claire. Rien n'est publié ni exporté sans validation.
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
            Business AI coordonne les experts <BusinessTypingDots />
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <V2PageShell
      eyebrow="Business AI"
      title="Atelier Business AI"
      description="Crée, analyse, structure et améliore ton business depuis un espace chat + preview, avec actions sensibles toujours sous validation."
      hideHeader
    >
      <SEOHead title={`${space.name} | Pixelrises V2`} description={space.description} noIndex />

      <section className="relative overflow-hidden rounded-[38px] border border-white/[0.08] bg-[#070707]/82 p-4 shadow-[0_34px_140px_-80px_rgba(245,197,66,0.8)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,197,66,0.16),transparent_33%),radial-gradient(circle_at_0%_22%,rgba(245,197,66,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
        <div className="relative">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
              <div className="inline-flex rounded-full border border-[#F5C542]/20 bg-[#F5C542]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">
                Business AI Pixelrises
              </div>
              <h1 className="mt-5 max-w-4xl text-[38px] font-semibold leading-[0.94] tracking-[-0.06em] text-white sm:text-[58px] lg:text-[72px]">
                Crée, teste et structure ton business avec un atelier IA.
              </h1>
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
                Coût estimé : <span className="font-semibold text-[#F5C542]">{estimatedCredits} crédits</span>. Débit réel uniquement après succès si la logique crédits est branchée.
              </div>
            </motion.div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "Chat central",
              "Preview à droite",
              "Router d'experts",
              "Actions sous validation",
            ].map((item) => (
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
                  Que veux-tu construire aujourd'hui ?
                </h2>
                <p className="mt-2 text-sm text-white/42">Tape une demande ou utilise `/` pour ouvrir les commandes Business AI.</p>
              </div>

              <div className="relative mt-6 rounded-[28px] border border-white/[0.08] bg-black/45 shadow-[0_26px_100px_-72px_rgba(245,197,66,0.7)]">
                {showCommandPalette ? (
                  <motion.div
                    ref={commandPaletteRef}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-3 bottom-full z-20 mb-3 overflow-hidden rounded-2xl border border-[#F5C542]/20 bg-[#050505]/96 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="max-h-[320px] overflow-y-auto p-2">
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
                  placeholder="Ex : crée une landing page premium pour une agence immobilière à Marseille..."
                  className="min-h-[86px] w-full resize-none rounded-t-[28px] border-0 bg-transparent px-5 py-5 text-sm leading-6 text-white outline-none placeholder:text-white/28"
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
                      onClick={() => setShowCommandPalette((value) => !value)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/55 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
                    >
                      Commandes
                    </button>
                    <DataBadge state="example" label={selectedCommand?.label ?? "Demande business"} />
                  </div>
                  <Button
                    type="button"
                    onClick={() => void sendBusinessPrompt()}
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
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {businessCommands.map((command) => {
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
                <Button onClick={() => void sendBusinessPrompt({ forceDirect: true })} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
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

          {showLegacyConversationPanel ? (
          <div className="rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Conversation</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Réponses Business AI</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <DataBadge state={storageWarning ? "mock" : storageSource === "supabase" ? "real" : "example"} label={storageLabel} />
                {isGenerating ? <DataBadge state="pending" label="Business AI réfléchit" /> : null}
              </div>
            </div>

            <div className="mt-5 min-h-[360px] space-y-4 rounded-[28px] border border-white/[0.08] bg-black/35 p-4">
              {!messages.length ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <Sparkles className="h-10 w-10 text-[#F5C542]" />
                  <h4 className="mt-4 text-2xl font-semibold tracking-tight text-white">Lance une demande Business.</h4>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                    Exemple : crée une landing, analyse une offre, prépare un prix, ou demande une stratégie claire. Rien n'est publié ni exporté sans validation.
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
                  Business AI coordonne les experts <BusinessTypingDots />
                </div>
              ) : null}
            </div>
          </div>
          ) : null}
        </div>

        <div className={cn("space-y-5 xl:min-w-[600px] 2xl:min-w-[680px]", mobilePanel === "chat" && "hidden lg:block")}>
          <ProjectPreview
            prompt={prompt || lastAssistantMessage?.content || "Aucun brief encore généré."}
            answer={lastAssistantMessage?.content ?? ""}
            intent={activeIntent}
            activeTab={activePreviewTab}
            onTabChange={setActivePreviewTab}
          />

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#F5C542]" />
              <div>
                <p className="text-sm font-semibold text-white">AI Orchestrator / experts</p>
                <p className="text-xs leading-5 text-white/45">Routage d'intention actif côté Business AI, modèles réels choisis côté serveur.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {experts.map((expert) => (
                <Badge key={expert} className="border-[#F5C542]/18 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                  {expert}
                </Badge>
              ))}
            </div>
          </div>

          {viewMode === "advanced" ? (
            <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Avancé</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Contrôle qualité et coûts</h3>
              <div className="mt-4 grid gap-3">
                {[
                  `Intention : ${selectedCommand?.label ?? "Demande business générale"}`,
                  `Experts : ${experts.join(", ")}`,
                  `Coût estimé : ${estimatedCredits} crédits`,
                  "Publication/export : à configurer avant action réelle",
                  "Recherche web/image : signalée si non disponible",
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
                <p className="text-sm font-semibold text-white">Historique & brouillons</p>
              </div>
              <DataBadge state="example" label={`${drafts.length} brouillon(s)`} />
            </div>
            {storageWarning ? (
              <p className="mt-3 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.05] p-3 text-xs leading-5 text-[#F5C542]">
                {storageWarning}
              </p>
            ) : null}
            <div className="mt-4 space-y-2">
              {(drafts.length ? drafts : recentConversations).slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-white/78">{item.title}</p>
                  <p className="mt-1 text-xs text-white/38">
                    {new Date("updatedAt" in item ? item.updatedAt : item.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              ))}
              {!drafts.length && !recentConversations.length ? (
                <p className="text-sm leading-6 text-white/45">Aucun brouillon Business AI pour le moment.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Sécurité</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/58">
              <p>Aucun provider, modèle, secret ou prompt système n'est affiché côté utilisateur.</p>
              <p>Les exports, publications, images et actions externes restent à configurer si la brique réelle n'est pas prouvée.</p>
              <p>Le bypass fondateur local et l'auth production ne sont pas modifiés par P9-B.</p>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full justify-between rounded-2xl border-[#F5C542]/20 bg-black/20 text-[#F5C542]">
              <Link to="/ai-spaces">
                Voir tous les espaces
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </V2PageShell>
  );
}
