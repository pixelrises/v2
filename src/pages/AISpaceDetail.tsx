import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileText,
  Globe2,
  GraduationCap,
  KanbanSquare,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Newspaper,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table2,
  Upload,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, EmptyState } from "@/components/ui/data-state";
import { Textarea } from "@/components/ui/textarea";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { BusinessAIWorkspace } from "@/components/ai-spaces/BusinessAIWorkspace";
import { StudentAIWorkspace } from "@/components/ai-spaces/StudentAIWorkspace";
import {
  createAISpaceMessage,
  getAISpaceConfig,
  loadAISpaceConversations,
  readAISpaceConversations,
  runAISpaceAssistant,
  saveAISpaceConversationTurnPersistent,
  saveAISpaceUsageLog,
  type AISpaceConversation,
  type AISpaceMessage,
  type AISpaceType,
  type AISpaceToolStatus,
  type AISpaceWorkspaceItem,
  type AISpaceWorkspaceSection,
} from "@/modules/ai-spaces";
import { toast } from "@/hooks/use-toast";

const iconMap: Record<string, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  graduation: GraduationCap,
  kanban: KanbanSquare,
  building: Building2,
  sparkles: Sparkles,
  message: MessageCircle,
};

const sectionIconMap: Record<AISpaceWorkspaceSection["kind"], LucideIcon> = {
  business: BriefcaseBusiness,
  study: GraduationCap,
  management: Table2,
  enterprise: Building2,
  creator: Newspaper,
  general: MessageCircle,
  tools: Wand2,
  resources: Search,
  security: LockKeyhole,
};

const statusLabel = {
  active: "Actif",
  beta: "Bêta",
  soon: "Bientôt",
  disabled: "Désactivé",
};

const toolStatusLabel: Record<AISpaceToolStatus, string> = {
  ready: "Prêt",
  prepared: "Préparé",
  "requires-connection": "Connexion requise",
  soon: "Bientôt",
};

const toolStatusClass: Record<AISpaceToolStatus, string> = {
  ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  prepared: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  "requires-connection": "border-blue-400/20 bg-blue-400/10 text-blue-200",
  soon: "border-white/10 bg-white/[0.04] text-white/58",
};

const buildItemPrompt = (item: AISpaceWorkspaceItem) =>
  `Aide-moi à produire "${item.title}". Objectif : ${item.description}. Donne-moi un résultat clair, concret, vérifiable et adapté à mon contexte.`;

const inspirationBySpace: Record<AISpaceType, string[]> = {
  business: ["Offre claire", "Preview rapide", "Tunnel de conversion", "Preuves avant promesses"],
  student: ["Méthode active", "Quiz corrigé", "Fiches courtes", "Progression visible"],
  management: ["Rituels hebdo", "Pipeline simple", "Validation avant action", "Tableau de pilotage"],
  enterprise: ["Process documenté", "Brief clair", "Confidentialité", "Compte rendu actionnable"],
  creator: ["Hook clair", "Calendrier éditorial", "Variantes créatives", "Brief de production"],
  general: ["Réponse courte", "Orientation rapide", "Plan concret", "Routeur vers les espaces"],
};

const WorkspaceSection = ({
  section,
  onUseItem,
}: {
  section: AISpaceWorkspaceSection;
  onUseItem: (item: AISpaceWorkspaceItem) => void;
}) => {
  const SectionIcon = sectionIconMap[section.kind] ?? Sparkles;

  return (
    <article className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
          <SectionIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">{section.title}</h3>
          <p className="mt-1 text-sm leading-6 text-white/52">{section.description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {section.items.map((item) => {
          const status = item.status ?? "prepared";
          const actionContent = (
            <>
              {item.actionLabel ?? "Utiliser"}
              {item.href ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </>
          );

          return (
            <div key={item.title} className="flex min-h-[210px] flex-col rounded-3xl border border-white/[0.08] bg-black/25 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${toolStatusClass[status]} hover:bg-transparent`}>{toolStatusLabel[status]}</Badge>
                {item.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45">
                    {tag}
                  </span>
                ))}
              </div>
              <h4 className="mt-4 text-base font-semibold text-white">{item.title}</h4>
              <p className="mt-2 flex-1 text-sm leading-6 text-white/52">{item.description}</p>
              {item.meta ? <p className="mt-3 text-xs leading-5 text-white/38">{item.meta}</p> : null}

              {item.href ? (
                <Button asChild variant="outline" className="mt-4 justify-between rounded-2xl border-white/[0.10] bg-transparent text-white/72">
                  <Link to={item.href}>{actionContent}</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onUseItem(item)}
                  className="mt-4 justify-between rounded-2xl border-white/[0.10] bg-transparent text-white/72"
                >
                  {actionContent}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
};

const AISpaceDetail = () => {
  const { spaceId } = useParams();
  const space = getAISpaceConfig(spaceId);
  const [prompt, setPrompt] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<AISpaceMessage[]>([]);
  const [activeQuickActionId, setActiveQuickActionId] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentConversations, setRecentConversations] = useState<AISpaceConversation[]>([]);
  const [storageSource, setStorageSource] = useState<"supabase" | "localStorage">("localStorage");
  const [storageWarning, setStorageWarning] = useState<string | undefined>();

  const storageLabel = useMemo(
    () => (storageSource === "supabase" ? "Historique synchronisé" : "Données locales"),
    [storageSource],
  );
  const storageDataState = useMemo(
    () => (storageSource === "supabase" && !storageWarning ? "real" : storageWarning ? "error" : "mock"),
    [storageSource, storageWarning],
  );

  useEffect(() => {
    setMessages([]);
    setConversationId(undefined);
    setPrompt("");
    setActiveQuickActionId(undefined);
    setStorageWarning(undefined);
  }, [spaceId]);

  useEffect(() => {
    if (!space) return;

    let active = true;
    setRecentConversations(readAISpaceConversations(space.id).slice(0, 5));

    void loadAISpaceConversations(space.id).then((result) => {
      if (!active) return;
      setStorageSource(result.source);
      setStorageWarning(result.error);
      setRecentConversations(result.conversations.slice(0, 5));
    });

    return () => {
      active = false;
    };
  }, [space]);

  if (!space) {
    return <Navigate to="/ai-spaces" replace />;
  }

  const Icon = iconMap[space.icon] ?? Sparkles;

  if (space.id === "business") {
    return <BusinessAIWorkspace space={space} />;
  }

  if (space.id === "student") {
    return <StudentAIWorkspace space={space} />;
  }

  const useWorkspaceItem = (item: AISpaceWorkspaceItem) => {
    setActiveQuickActionId(undefined);
    setPrompt(buildItemPrompt(item));
  };

  const sendPrompt = async () => {
    const cleanPrompt = prompt.trim();
    const quickAction = space.quickActions.find((action) => action.id === activeQuickActionId);
    const finalPrompt = cleanPrompt || quickAction?.prompt || "";

    if (!finalPrompt) {
      toast({
        title: "Ajoute une demande",
        description: "Décris ce que tu veux obtenir ou choisis une action rapide.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const startedAt = performance.now();
    const userMessage = createAISpaceMessage("user", finalPrompt);
    setMessages((previous) => [...previous, userMessage]);

    try {
      const response = await runAISpaceAssistant({
        spaceType: space.id,
        prompt: finalPrompt,
        quickActionId: activeQuickActionId,
        conversationId,
        history: messages,
      });
      const assistantMessage = createAISpaceMessage("assistant", response.answer, response.source);
      const saveResult = await saveAISpaceConversationTurnPersistent(space.id, conversationId, finalPrompt, [
        userMessage,
        assistantMessage,
      ]);
      const conversation = saveResult.conversation;

      setConversationId(conversation.id);
      setMessages((previous) => [...previous, assistantMessage]);
      setStorageSource(saveResult.source);
      setStorageWarning(saveResult.error);
      setRecentConversations((previous) =>
        [
          conversation,
          ...previous.filter((recentConversation) => recentConversation.id !== conversation.id),
        ].slice(0, 5),
      );
      setPrompt("");

      void saveAISpaceUsageLog({
        spaceType: space.id,
        conversationId: conversation.id,
        response,
        durationMs: Math.round(performance.now() - startedAt),
      });

      if (response.source === "mock-fallback") {
        toast({
          title: "Mode secours actif",
          description: "L'espace répond avec une réponse structurée tant que le moteur complet n'est pas disponible.",
        });
      }

      if (saveResult.error) {
        toast({
          title: "Synchronisation cloud à vérifier",
          description: "La conversation reste sauvegardée dans le navigateur en attendant la synchronisation cloud.",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <V2PageShell
      eyebrow="AI Space"
      title={space.name}
      description={space.description}
      action={
        <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
          <Link to="/ai-spaces">
            Tous les espaces
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <SEOHead title={`${space.name} | Pixelrises V2`} description={space.description} noIndex />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div className={`overflow-hidden rounded-[34px] border border-white/[0.08] bg-gradient-to-r ${space.accent} p-5 sm:p-6`}>
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/[0.10] bg-black/35 text-[#F5C542]">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                    {statusLabel[space.status]}
                  </Badge>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">{space.workspace.headline}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-white/62">{space.workspace.description}</p>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/[0.08] bg-black/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5C542]">Accès conseillé</p>
                <div className="mt-3">
                  <DataBadge state="example" label="Règle produit" />
                </div>
                <p className="mt-3 text-2xl font-semibold capitalize text-white">{space.workspace.accessPolicy.recommendedPlan}</p>
                <p className="mt-2 text-sm leading-6 text-white/52">{space.workspace.accessPolicy.businessRule}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {space.workspace.accessPolicy.includedIn.map((plan) => (
                    <span key={plan} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/62">
                      {plan}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-white/[0.08] bg-black/25 p-4">
                <Sparkles className="h-5 w-5 text-[#F5C542]" />
                <p className="mt-3 text-sm font-semibold text-white">Sortie principale</p>
                <p className="mt-1 text-sm leading-6 text-white/55">{space.workspace.primaryOutput}</p>
              </div>
              <div className="rounded-3xl border border-white/[0.08] bg-black/25 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="mt-3 text-sm font-semibold text-white">Focus expert</p>
                <p className="mt-1 text-sm leading-6 text-white/55">{space.workspace.expertFocus}</p>
              </div>
              <div className="rounded-3xl border border-white/[0.08] bg-black/25 p-4">
                <CircleAlert className="h-5 w-5 text-blue-300" />
                <p className="mt-3 text-sm font-semibold text-white">Coût estimé</p>
                <p className="mt-1 text-sm leading-6 text-white/55">
                  {space.workspace.accessPolicy.creditCost} crédit(s) par demande spécialisée.
                </p>
                <div className="mt-3">
                  <DataBadge state="example" label="Estimation" />
                </div>
              </div>
            </div>
          </div>

          {space.workspace.sections.map((section) => (
            <WorkspaceSection key={section.id} section={section} onUseItem={useWorkspaceItem} />
          ))}

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#F5C542]" />
              <div>
                <h3 className="text-lg font-semibold text-white">Conseils pour obtenir une meilleure réponse</h3>
                <p className="text-sm leading-6 text-white/52">
                  Clique sur un exemple pour le reprendre dans le chat. C'est le moyen le plus simple de guider l'IA.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {space.workspace.promptTips.map((tip) => (
                <button
                  key={tip.title}
                  type="button"
                  onClick={() => {
                    setActiveQuickActionId(undefined);
                    setPrompt(tip.example);
                  }}
                  className="rounded-3xl border border-white/[0.08] bg-black/25 p-4 text-left transition hover:border-[#F5C542]/30 hover:bg-[#F5C542]/[0.05]"
                >
                  <p className="text-sm font-semibold text-white">{tip.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/52">{tip.description}</p>
                  <p className="mt-3 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.05] p-3 text-xs leading-5 text-[#F5C542]">
                    {tip.example}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
            <div className="min-h-[340px] rounded-[28px] border border-white/[0.08] bg-black/25 p-4">
              {messages.length ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl border p-4 ${
                        message.role === "user"
                          ? "ml-auto max-w-[86%] border-[#F5C542]/25 bg-[#F5C542]/10 text-white"
                          : "mr-auto max-w-[92%] border-white/[0.08] bg-white/[0.04] text-white/74"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                      {message.source === "mock-fallback" ? (
                        <div className="mt-3">
                          <DataBadge state="mock" label="Mode secours Pixelrises" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={space.dashboard.emptyState}
                  description="Choisis une action, une fiche, un outil ou écris librement. L'objectif est de ressortir avec une prochaine étape concrète."
                  className="min-h-[300px] border-transparent bg-transparent"
                />
              )}
            </div>

            <div className="mt-4 rounded-[28px] border border-white/[0.08] bg-black/25 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                {space.quickActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      setActiveQuickActionId(action.id);
                      setPrompt(action.prompt);
                    }}
                    className={`rounded-2xl border p-4 text-left transition hover:border-[#F5C542]/35 ${
                      activeQuickActionId === action.id
                        ? "border-[#F5C542]/35 bg-[#F5C542]/10"
                        : "border-white/[0.08] bg-white/[0.03]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="mt-1 text-xs leading-5 text-white/48">{action.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Écris un prompt ou utilise une action rapide..."
                  className="min-h-[120px] resize-none rounded-2xl border-white/[0.10] bg-black/35 text-white placeholder:text-white/35"
                />
                <Button
                  onClick={() => void sendPrompt()}
                  disabled={isGenerating}
                  className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer à l'IA Pixelrises
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Créer un projet lié</p>
            <div className="mt-3">
              <DataBadge state="example" label="Statuts déclarés" />
            </div>
            <div className="mt-4 grid gap-2">
              {space.builderLinks.map((link) => (
                <Button
                  key={link.label}
                  asChild
                  variant={link.status === "ready" ? "default" : "outline"}
                  className={
                    link.status === "ready"
                      ? "justify-between rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
                      : "justify-between rounded-2xl border-white/[0.10] bg-transparent text-white/70"
                  }
                >
                  <Link to={link.href}>
                    {link.label}
                    <Badge className="ml-2 border-white/10 bg-black/20 text-xs text-current hover:bg-black/20">
                      {link.status === "ready" ? "Prêt" : link.status === "prepared" ? "Préparé" : "Bientôt"}
                    </Badge>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Règle de monétisation</p>
            <div className="mt-3">
              <DataBadge state="example" label="Configuration produit" />
            </div>
            <p className="mt-3 text-sm leading-6 text-white/58">{space.workspace.accessPolicy.modelPolicy}</p>
            <div className="mt-4 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-4">
              <p className="text-sm font-semibold text-[#F5C542]">Conseil produit</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Garde l'accès par abonnement pour la simplicité, puis facture les actions lourdes en crédits. C'est plus
                clair pour vendre et plus sûr pour contrôler les coûts IA.
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Agents recommandés</p>
            <div className="mt-3">
              <DataBadge state="example" label="Registre agents" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {space.recommendedAgents.map((agent) => (
                <Badge key={agent} className="border-white/10 bg-white/[0.04] text-white/68 hover:bg-white/[0.04]">
                  {agent}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Templates spécialisés</p>
            <div className="mt-3">
              <DataBadge state="example" label="Registre templates" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {space.recommendedTemplates.map((template) => (
                <Badge key={template} className="border-white/10 bg-white/[0.04] text-white/68 hover:bg-white/[0.04]">
                  {template}
                </Badge>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full justify-between rounded-2xl border-white/[0.10] bg-transparent text-white/72">
              <Link to="/templates">
                Ouvrir les templates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Inspirations adaptées</p>
            <div className="mt-3">
              <DataBadge state="example" label="Bonnes pratiques" />
            </div>
            <div className="mt-4 grid gap-2">
              {inspirationBySpace[space.id].map((item) => (
                <div key={item} className="rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-2 text-sm text-white/62">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Garde-fous</p>
            <div className="mt-4 space-y-3">
              {space.safetyRules.map((rule) => (
                <div key={rule} className="flex gap-3 text-sm leading-6 text-white/58">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#F5C542]" />
                  <span>{rule}</span>
                </div>
              ))}
              <div className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-sm leading-6 text-white/58">
                <Upload className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
                <span>Aucun fichier local, Google, Excel ou Drive n'est lu sans connexion ou upload autorisé.</span>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Web Agent / Extension</p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Préparé pour lire une page uniquement avec permission, résumer, créer une note ou remplir un brief. Rien n'est activé automatiquement.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <DataBadge state="example" label="Bientôt" />
              <Badge className="border-white/[0.10] bg-black/25 text-white/62 hover:bg-black/25">Feature flag requis</Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6 text-white/58">
              <p>Permission explicite avant lecture d'onglet.</p>
              <p>Aucun mot de passe, paiement ou donnée sensible analysé.</p>
              <p>Aucune action externe sans validation humaine.</p>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full justify-between rounded-2xl border-[#F5C542]/20 bg-black/20 text-[#F5C542]">
              <Link to="/roadmap">
                Voir la roadmap
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Historique</p>
              <DataBadge state={storageDataState} label={storageLabel} />
            </div>
            {storageWarning ? (
              <p className="mt-3 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-3 text-xs leading-5 text-[#F5C542]">
                {storageWarning}
              </p>
            ) : null}
            <div className="mt-4 space-y-2">
              {recentConversations.length ? (
                recentConversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                    <p className="text-sm font-semibold text-white/80">{conversation.title}</p>
                    <p className="mt-1 text-xs text-white/38">
                      {new Date(conversation.updatedAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-white/45">
                  Historique indisponible pour le moment. Les conversations restent en mode local tant que la synchronisation n'est pas prête.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </V2PageShell>
  );
};

export default AISpaceDetail;
