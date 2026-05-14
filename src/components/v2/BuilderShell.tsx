import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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
