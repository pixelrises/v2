import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataBadge } from "@/components/ui/data-state";
import type { DataState } from "@/lib/data-state";
import { cn } from "@/lib/utils";

const clientDataLabel: Record<DataState, string> = {
  real: "Données réelles",
  example: "Exemple",
  mock: "Données locales",
  pending: "En cours",
  error: "Indisponible",
  empty: "Aucune donnée",
};

export function ClientDataBadge({ state, label, className }: { state: DataState; label?: string; className?: string }) {
  return <DataBadge state={state} label={label ?? clientDataLabel[state]} className={className} />;
}

export function HeroPanel({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[34px] border border-[#F5C542]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,197,66,0.15),transparent_34%),rgba(255,255,255,0.035)] p-5 sm:p-6",
        className,
      )}
    >
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">{eyebrow}</p> : null}
      <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function ActionTile({
  title,
  description,
  href,
  action = "Ouvrir",
  icon,
  disabled,
}: {
  title: string;
  description: string;
  href: string;
  action?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <article className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-[#F5C542]/25">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
          {icon ?? <ArrowRight className="h-4 w-4" />}
        </div>
        {disabled ? <ClientDataBadge state="empty" label="Bientôt" /> : null}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/54">{description}</p>
      <Button
        asChild={!disabled}
        disabled={disabled}
        variant={disabled ? "outline" : "default"}
        className={cn(
          "mt-5 w-full justify-between rounded-2xl",
          disabled ? "border-white/[0.10] bg-transparent text-white/38" : "bg-[#F5C542] text-black hover:bg-[#FFD766]",
        )}
      >
        {disabled ? (
          <span>{action}</span>
        ) : (
          <Link to={href}>
            {action}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </Button>
    </article>
  );
}

export function AdvancedSection({
  enabled,
  title,
  description,
  children,
}: {
  enabled: boolean;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  if (!enabled) return null;

  return (
    <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
      <div className="mb-4 flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#F5C542]" />
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-white/48">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ClientSafeNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055] p-4 text-sm leading-6 text-white/62">
      <div className="flex gap-3">
        <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
        <span>{children ?? "Aucune action sensible n'est lancée sans validation humaine. Les détails techniques restent masqués côté client."}</span>
      </div>
    </div>
  );
}
