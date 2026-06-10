import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  History,
  Loader2,
  MessageSquareText,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { InterfaceModeToggle } from "@/components/v2/InterfaceModeToggle";
import { builderTools, type BuilderTool } from "@/lib/builder-tools";
import { cn } from "@/lib/utils";

const toolStatusLabel: Record<BuilderTool["status"], string> = {
  ready: "Prêt",
  beta: "Bêta",
  soon: "Bientôt",
  configure: "À configurer",
};

export function BuilderModeToggle({ className }: { className?: string }) {
  return <InterfaceModeToggle compact className={className} />;
}

export type BuilderPlanStepState = "done" | "active" | "pending" | "blocked";

export type BuilderPlanStep = {
  title: string;
  description?: string;
  status?: string;
  state?: BuilderPlanStepState;
  items?: { label: string; state?: BuilderPlanStepState }[];
};

export type BuilderPlan = {
  id?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  questions?: string[];
  sections?: { label: string; value?: string; items?: string[] }[];
};

export type BuilderGenerationMode = "direct" | "plan";

export function BuilderGenerationModeSelector({
  value,
  onChange,
  className,
}: {
  value: BuilderGenerationMode;
  onChange: (value: BuilderGenerationMode) => void;
  className?: string;
}) {
  const modes: {
    id: BuilderGenerationMode;
    title: string;
    description: string;
    microcopy?: string;
  }[] = [
    {
      id: "direct",
      title: "Mode Direct",
      description: "Génération immédiate à partir de votre prompt.",
    },
    {
      id: "plan",
      title: "Mode Plan",
      description: "Pixelrises prépare un plan avant de générer.",
      microcopy:
        "Idéal si vous voulez un résultat plus précis. Pixelrises explique les étapes avant de lancer la génération.",
    },
  ];

  return (
    <div
      data-testid="builder-generation-mode-selector"
      className={cn(
        "grid gap-2 rounded-[18px] border border-[#F5C542]/14 bg-black/24 p-2 sm:grid-cols-2",
        className,
      )}
    >
      {modes.map((mode) => {
        const isSelected = value === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(mode.id)}
            className={cn(
              "rounded-[14px] border p-3 text-left transition",
              isSelected
                ? "border-[#F5C542]/45 bg-[#F5C542]/12 shadow-[0_16px_44px_-32px_rgba(245,197,66,0.95)]"
                : "border-white/[0.08] bg-white/[0.025] hover:border-[#F5C542]/24 hover:bg-[#F5C542]/[0.045]",
            )}
          >
            <span className={cn("block text-xs font-semibold uppercase tracking-[0.18em]", isSelected ? "text-[#F5C542]" : "text-white/58")}>
              {mode.title}
            </span>
            <span className="mt-2 block text-sm leading-5 text-white/72">{mode.description}</span>
            {mode.microcopy ? <span className="mt-2 block text-xs leading-5 text-white/46">{mode.microcopy}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

const planStepLabel: Record<BuilderPlanStepState, string> = {
  done: "validé",
  active: "en cours",
  pending: "en attente",
  blocked: "à valider",
};

const getPlanFileName = (plan: BuilderPlan) => {
  const rawId = plan.id?.trim();
  if (!rawId) return "plan-en-cours.md";
  if (rawId.endsWith(".md")) return rawId;
  return `plan-${rawId}.md`;
};

const getPlanStepTone = (state: BuilderPlanStepState = "pending") => {
  if (state === "done") return "border-emerald-300/35 bg-emerald-300/10 text-emerald-200";
  if (state === "active") return "border-[#F5C542]/45 bg-[#F5C542]/12 text-[#F5C542]";
  if (state === "blocked") return "border-red-300/30 bg-red-300/10 text-red-200";
  return "border-white/20 bg-white/[0.04] text-white/45";
};

export function BuilderPlanTool({
  state = "idle",
  plan,
  approved = false,
  approveLabel = "Valider le plan",
  editPromptLabel = "Modifier mon prompt",
  editPreferencesLabel = "Modifier mes préférences",
  generateLabel = "Générer avec ce plan",
  onApprove,
  onEditPrompt,
  onEditPreferences,
  onGenerate,
  className,
}: {
  state?: "idle" | "pending";
  plan: BuilderPlan;
  approved?: boolean;
  approveLabel?: string;
  editPromptLabel?: string;
  editPreferencesLabel?: string;
  generateLabel?: string;
  onApprove?: () => void;
  onEditPrompt?: () => void;
  onEditPreferences?: () => void;
  onGenerate?: () => void;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localApproved, setLocalApproved] = useState(false);
  const isPending = state === "pending";
  const isApproved = approved || localApproved;
  const fileName = getPlanFileName(plan);
  const planSections = plan.sections?.length
    ? plan.sections
    : [{ label: "Résumé du projet", value: plan.summary || "Aucun résumé de plan disponible" }];
  const visibleSections = isExpanded ? planSections : planSections.slice(0, 5);
  const statusLabel = isPending ? "Plan en préparation" : isApproved ? "Plan validé" : "Plan à valider";

  useEffect(() => {
    if (!approved) setLocalApproved(false);
  }, [approved, plan.id, plan.title]);

  const handleApprove = () => {
    if (isApproved) return;
    setLocalApproved(true);
    onApprove?.();
  };

  return (
    <section
      data-testid="builder-plan-tool"
      className={cn(
        "overflow-hidden rounded-[22px] border border-[#F5C542]/18 bg-[radial-gradient(circle_at_top_right,rgba(245,197,66,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] shadow-[0_28px_90px_-72px_rgba(245,197,66,0.95)]",
        className,
      )}
    >
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#F5C542]" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-[#F5C542]" />
          )}
          <span className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-white/48">{fileName}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-black/25 text-white/54 transition hover:border-[#F5C542]/35 hover:text-[#F5C542]"
          aria-label={isExpanded ? "Réduire le plan" : "Lire le plan détaillé"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Plan IA à valider</p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">{plan.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/58">
              {plan.subtitle ?? "Vérifiez ce que l'IA va créer avant de lancer la génération."}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              isApproved ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-[#F5C542]/25 bg-[#F5C542]/10 text-[#F5C542]",
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-4 rounded-[18px] border border-[#F5C542]/14 bg-[#F5C542]/[0.045] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Résumé du plan</p>
          <p className="mt-2 text-sm leading-6 text-white/64">{plan.summary || "Aucun résumé de plan disponible"}</p>
        </div>

        {plan.questions?.length ? (
          <div className="mt-4 rounded-[16px] border border-white/[0.08] bg-black/24 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Questions / préférences</p>
            <div className="mt-2 grid gap-2">
              {plan.questions.map((question) => (
                <p key={question} className="flex gap-2 text-xs leading-5 text-white/58">
                  <Circle className="mt-1 h-3 w-3 shrink-0 text-[#F5C542]" />
                  {question}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          {visibleSections.map((section) => (
            <article key={section.label} className="rounded-[16px] border border-white/[0.08] bg-black/22 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F5C542]">{section.label}</p>
              {section.value ? <p className="mt-2 text-sm leading-6 text-white/62">{section.value}</p> : null}
              {section.items?.length ? (
                <div className="mt-2 grid gap-1.5">
                  {section.items.map((item) => (
                    <p key={item} className="flex items-center gap-2 text-xs leading-5 text-white/56">
                      <Circle className="h-3 w-3 shrink-0 text-[#F5C542]" />
                      {item}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="text-left text-xs font-semibold text-white/50 transition hover:text-[#F5C542]"
          >
            {isExpanded ? "Masquer le plan" : "Lire le plan détaillé"}
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onEditPrompt}
              disabled={isPending}
              className="rounded-[14px] border-white/[0.10] bg-black/20 font-semibold text-white/74 hover:border-[#F5C542]/28 hover:bg-[#F5C542]/[0.06] hover:text-[#F5C542]"
            >
              <MessageSquareText className="h-4 w-4" />
              {editPromptLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onEditPreferences}
              disabled={isPending}
              className="rounded-[14px] border-white/[0.10] bg-black/20 font-semibold text-white/74 hover:border-[#F5C542]/28 hover:bg-[#F5C542]/[0.06] hover:text-[#F5C542]"
            >
              <PanelRight className="h-4 w-4" />
              {editPreferencesLabel}
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isApproved || isPending}
              className={cn(
                "rounded-[14px] font-semibold",
                isApproved
                  ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10"
                  : "bg-[#F5C542] text-black hover:bg-[#FFD766]",
              )}
            >
              {isApproved ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {isApproved ? "Plan validé" : approveLabel}
            </Button>
            <Button
              type="button"
              onClick={onGenerate}
              disabled={!isApproved || isPending}
              className={cn(
                "rounded-[14px] font-semibold",
                isApproved
                  ? "bg-[#F5C542] text-black hover:bg-[#FFD766]"
                  : "border border-white/[0.08] bg-white/[0.035] text-white/35 hover:bg-white/[0.035]",
              )}
            >
              <ArrowRight className="h-4 w-4" />
              {isApproved ? generateLabel : `${generateLabel} après validation`}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BuilderGenerationTimeline({
  steps,
  className,
}: {
  steps: BuilderPlanStep[];
  className?: string;
}) {
  return (
    <section
      data-testid="builder-generation-timeline"
      className={cn(
        "rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4 shadow-[0_28px_90px_-78px_rgba(245,197,66,0.8)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Progression de génération</p>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">Timeline de génération</h3>
          <p className="mt-2 text-sm leading-6 text-white/52">
            Pixelrises suit les étapes nécessaires pour produire un résultat propre.
          </p>
        </div>
        <span className="rounded-full border border-[#F5C542]/20 bg-[#F5C542]/10 px-3 py-1.5 text-xs font-semibold text-[#F5C542]">
          suivi d'étapes
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {steps.map((step, index) => {
          const stepState = step.state ?? "pending";

          return (
            <article key={`${step.title}-${index}`} className="relative grid grid-cols-[28px_1fr] gap-3">
              {index < steps.length - 1 ? <span className="absolute left-[13px] top-8 h-[calc(100%+0.5rem)] w-px bg-[#F5C542]/18" /> : null}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold",
                  getPlanStepTone(stepState),
                )}
              >
                {stepState === "done" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              <div className="min-w-0 rounded-[16px] border border-white/[0.08] bg-black/22 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <span className={cn("rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", getPlanStepTone(stepState))}>
                    {step.status ?? planStepLabel[stepState]}
                  </span>
                </div>
                {step.description ? <p className="mt-2 text-xs leading-5 text-white/48">{step.description}</p> : null}
                {step.items?.length ? (
                  <div className="mt-3 grid gap-1.5">
                    {step.items.map((item) => (
                      <p key={item.label} className="flex items-center gap-2 text-xs text-white/52">
                        <span className={cn("h-1.5 w-1.5 rounded-full", item.state === "done" ? "bg-emerald-300" : item.state === "active" ? "bg-[#F5C542]" : "bg-white/25")} />
                        {item.label}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function BuilderToolbar({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <nav
      aria-label="Outils du builder"
      className={cn(
        "flex gap-2 overflow-x-auto rounded-[22px] border border-white/[0.08] bg-black/25 p-2",
        compact ? "max-w-full" : "w-full",
        className,
      )}
    >
      {builderTools.map((tool) => {
        const Icon = tool.icon;

        return (
          <Button
            key={tool.id}
            asChild
            variant="ghost"
            className="h-10 shrink-0 rounded-2xl px-3 text-white/68 hover:bg-white/[0.06] hover:text-white"
            title={`${tool.label} · ${toolStatusLabel[tool.status]}`}
          >
            <Link to={tool.href} aria-label={`${tool.label} - ${toolStatusLabel[tool.status]}`}>
              <Icon className="h-4 w-4 text-[#F5C542]" />
              <span className={compact ? "sr-only" : "text-xs font-semibold"}>{tool.label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

export function BuilderShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid min-w-0 gap-5", className)}>{children}</div>;
}

export function BuilderSidebar({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={cn("min-w-0 space-y-4", className)}>{children}</aside>;
}

export function BuilderTopbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex flex-col gap-3 rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-3 lg:flex-row lg:items-center lg:justify-between", className)}>
      {children}
    </div>
  );
}

export function BuilderInput({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5", className)}>
      <h2 className="text-lg font-semibold tracking-[-0.025em] text-white">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-white/52">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function BuilderPromptBox({
  value,
  onChange,
  onSubmit,
  placeholder,
  isLoading,
  submitLabel = "Générer",
  suggestions = [],
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  isLoading?: boolean;
  submitLabel?: string;
  suggestions?: string[];
}) {
  return (
    <div className="rounded-[22px] border border-[#F5C542]/18 bg-black/28 p-3 shadow-[0_24px_90px_-74px_rgba(245,197,66,0.95)]">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className="min-h-[108px] resize-none border-0 bg-transparent text-sm leading-6 text-white shadow-none outline-none placeholder:text-white/32 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <div className="mt-3 flex flex-col gap-3">
        {suggestions.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange(suggestion)}
                className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/58 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
        <Button onClick={onSubmit} disabled={isLoading} className="h-11 rounded-2xl bg-[#F5C542] font-semibold text-black hover:bg-[#FFD766] disabled:opacity-70">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isLoading ? "Création..." : submitLabel}
          <ArrowRight className="ml-auto h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function BuilderChatPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5", className)}>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <MessageSquareText className="h-4 w-4 text-[#F5C542]" />
        Amélioration par prompt
      </div>
      {children}
    </section>
  );
}

export function BuilderPreview({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("min-w-0 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-3", className)}>{children}</main>;
}

export function BuilderInspector({
  title = "Édition",
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <PanelRight className="h-4 w-4 text-[#F5C542]" />
        {title}
      </div>
      {description ? <p className="mt-2 text-sm leading-6 text-white/50">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </aside>
  );
}

export function BuilderVisualEditor({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[24px] border border-[#F5C542]/15 bg-black/26 p-4", className)}>{children}</section>;
}

export function BuilderActionPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[28px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-5", className)}>{children}</section>;
}

export function BuilderQuickActions({
  actions,
}: {
  actions: { label: string; onClick?: () => void; href?: string; disabled?: boolean }[];
}) {
  return (
    <div className="grid gap-2">
      {actions.slice(0, 3).map((action) =>
        action.href && !action.disabled ? (
          <Button key={action.label} asChild variant="outline" className="justify-between rounded-2xl border-white/[0.10] bg-black/20 text-white/82">
            <Link to={action.href}>
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            variant="outline"
            className="justify-between rounded-2xl border-white/[0.10] bg-black/20 text-white/82 disabled:text-white/35"
          >
            {action.label}
            {action.disabled ? <span className="text-xs">Bientôt</span> : <ArrowRight className="h-4 w-4" />}
          </Button>
        ),
      )}
    </div>
  );
}

export function BuilderVersionHistory({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <History className="h-4 w-4 text-[#F5C542]" />
        Versions
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function BuilderPublishBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("sticky bottom-4 z-20 rounded-[24px] border border-[#F5C542]/18 bg-[#070707]/92 p-3 shadow-[0_22px_80px_-55px_rgba(245,197,66,0.95)] backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

export function BuilderExportPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5", className)}>{children}</section>;
}

export function BuilderEmptyState(props: Parameters<typeof EmptyState>[0]) {
  return <EmptyState {...props} />;
}

export function BuilderLoadingState(props: Parameters<typeof LoadingState>[0]) {
  return <LoadingState {...props} />;
}

export function BuilderErrorState(props: Parameters<typeof ErrorState>[0]) {
  return <ErrorState {...props} />;
}

export function BuilderSafeNotice({ children, tone = "safe" }: { children: ReactNode; tone?: "safe" | "warning" }) {
  const Icon = tone === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-sm leading-6",
        tone === "warning"
          ? "border-orange-300/15 bg-orange-300/[0.06] text-orange-50/82"
          : "border-emerald-300/15 bg-emerald-300/[0.055] text-white/62",
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn("mt-1 h-4 w-4 shrink-0", tone === "warning" ? "text-orange-200" : "text-emerald-300")} />
        <span>{children}</span>
      </div>
    </div>
  );
}
