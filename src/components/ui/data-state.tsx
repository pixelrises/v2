import type { ReactNode } from "react";
import { AlertTriangle, CircleDashed, Database, Info, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataStateMeta, getDataStateMeta, type DataState } from "@/lib/data-state";

const stateClasses: Record<DataState, string> = {
  real: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  example: "border-[#F5C542]/25 bg-[#F5C542]/10 text-[#F5C542]",
  mock: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  pending: "border-white/[0.12] bg-white/[0.05] text-white/70",
  error: "border-red-300/20 bg-red-300/10 text-red-100",
  empty: "border-white/[0.12] bg-white/[0.04] text-white/58",
};

const stateIcons: Record<DataState, typeof Info> = {
  real: Database,
  example: Sparkles,
  mock: CircleDashed,
  pending: Loader2,
  error: AlertTriangle,
  empty: Info,
};

export function DataBadge({
  state,
  label,
  className,
}: {
  state: DataState;
  label?: string;
  className?: string;
}) {
  const Icon = stateIcons[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        stateClasses[state],
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", state === "pending" && "animate-spin")} />
      {label ?? dataStateMeta[state].label}
    </span>
  );
}

export function DataSourceLabel({
  state,
  label,
  description,
  className,
}: {
  state: DataState;
  label?: string;
  description?: string;
  className?: string;
}) {
  const meta = getDataStateMeta(state, { label, description });

  return (
    <div className={cn("rounded-2xl border border-white/[0.08] bg-black/20 p-3 text-sm text-white/60", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <DataBadge state={state} label={meta.label} />
      </div>
      <p className="mt-2 leading-6">{meta.description}</p>
    </div>
  );
}

function StatePanel({
  state,
  title,
  description,
  action,
  className,
}: {
  state: DataState;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = stateIcons[state];

  return (
    <div className={cn("rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 text-center", className)}>
      <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-2xl", stateClasses[state])}>
        <Icon className={cn("h-5 w-5", state === "pending" && "animate-spin")} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/55">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function EmptyState(props: Omit<Parameters<typeof StatePanel>[0], "state">) {
  return <StatePanel {...props} state="empty" />;
}

export function LoadingState(props: Omit<Parameters<typeof StatePanel>[0], "state">) {
  return <StatePanel {...props} state="pending" />;
}

export function ErrorState(props: Omit<Parameters<typeof StatePanel>[0], "state">) {
  return <StatePanel {...props} state="error" />;
}

export function ExampleState(props: Omit<Parameters<typeof StatePanel>[0], "state">) {
  return <StatePanel {...props} state="example" />;
}
