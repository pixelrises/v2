import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, LockKeyhole, ShieldCheck, Zap } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge } from "@/components/ui/data-state";
import { V2PageShell } from "@/components/v2/V2PageShell";
import {
  canOpenIntegration,
  getNormalizedIntegrations,
  integrationStatusCopy,
  type NormalizedIntegration,
} from "@/modules/integrations/integration-system";

const statusTone: Record<NormalizedIntegration["normalizedStatus"], string> = {
  connected: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
  not_configured: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  beta: "border-purple-300/20 bg-purple-300/[0.08] text-purple-100",
  coming_soon: "border-white/[0.10] bg-white/[0.04] text-white/58",
  blocked: "border-red-300/20 bg-red-300/[0.08] text-red-100",
  error: "border-red-300/20 bg-red-300/[0.10] text-red-100",
  dry_run: "border-sky-300/20 bg-sky-300/[0.08] text-sky-100",
};

const riskTone: Record<NormalizedIntegration["riskLevel"], string> = {
  low: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  medium: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  high: "border-red-300/20 bg-red-300/10 text-red-100",
};

const categoryTone: Record<NormalizedIntegration["category"], { accent: string; from: string; to: string }> = {
  Business: { accent: "#F5C542", from: "#1f1a05", to: "#7c5f09" },
  Marketing: { accent: "#ec4899", from: "#330a22", to: "#be185d" },
  Data: { accent: "#38bdf8", from: "#082f49", to: "#075985" },
  Automatisation: { accent: "#a855f7", from: "#1e103f", to: "#6d28d9" },
  Dev: { accent: "#ffffff", from: "#111827", to: "#020617" },
  Communication: { accent: "#22c55e", from: "#052e16", to: "#15803d" },
  IA: { accent: "#F5C542", from: "#211a05", to: "#856404" },
  Domaines: { accent: "#f97316", from: "#2d1304", to: "#c2410c" },
  Gaming: { accent: "#a78bfa", from: "#1e1b4b", to: "#6d28d9" },
};

function IntegrationLogo({ integration }: { integration: NormalizedIntegration }) {
  const Icon = integration.icon;
  const tone = integration.logo ?? categoryTone[integration.category];
  const initials =
    integration.logo?.initials ??
    integration.name
      .split(/\s|-/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  const style = {
    background: `radial-gradient(circle at 28% 20%, ${tone.accent}66, transparent 44%), linear-gradient(135deg, ${tone.from}, ${tone.to})`,
    borderColor: `${tone.accent}55`,
    boxShadow: `0 0 42px -22px ${tone.accent}`,
  } as CSSProperties;

  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[26px] border" style={style}>
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:18px_18px]" />
      <Icon className="relative h-8 w-8 text-white" />
      <span className="absolute bottom-2 right-2 rounded-lg border border-white/15 bg-black/45 px-1.5 py-0.5 text-[10px] font-black text-white">
        {initials}
      </span>
    </div>
  );
}

const getModeCopy = (mode?: string) => {
  if (mode === "setup") return "Configuration";
  if (mode === "beta") return "Accès bêta";
  if (mode === "roadmap") return "Roadmap";
  return "Détails";
};

const IntegrationDetail = () => {
  const { integrationId, mode } = useParams();
  const integration = getNormalizedIntegrations().find((item) => item.id === integrationId);

  if (!integration) {
    return (
      <V2PageShell
        eyebrow="Intégration"
        title="Intégration introuvable"
        description="Cette intégration n'existe pas dans le registre V2. Retourne au hub pour choisir un connecteur disponible."
        action={
          <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to="/integrations">Retour au hub</Link>
          </Button>
        }
      >
        <SEOHead title="Intégration introuvable | Pixelrises V2" description="Intégration introuvable." noIndex />
      </V2PageShell>
    );
  }

  const status = integrationStatusCopy[integration.normalizedStatus];
  const actionLabel = canOpenIntegration(integration)
    ? integration.normalizedStatus === "dry_run"
      ? "Tester en dry-run"
      : "Préparer la configuration"
    : "Suivre la roadmap";

  return (
    <V2PageShell
      eyebrow={`${getModeCopy(mode)} intégration`}
      title={integration.name}
      description={integration.description}
      action={
        <>
          <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
            <Link to="/integrations">
              <ArrowLeft className="h-4 w-4" />
              Hub intégrations
            </Link>
          </Button>
          <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to={canOpenIntegration(integration) ? `/integrations/${integration.id}/setup` : `/roadmap?integration=${integration.id}`}>
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <SEOHead title={`${integration.name} | Pixelrises V2`} description={integration.description} noIndex />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <IntegrationLogo integration={integration} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusTone[integration.normalizedStatus]}>{status.label}</Badge>
                <Badge className={riskTone[integration.riskLevel]}>Risque {integration.riskLevel}</Badge>
                <DataBadge state={integration.dataState} />
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{integration.name}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                {integration.productUse ?? "Cette page prépare l'usage produit, les permissions et les garde-fous avant toute activation réelle."}
              </p>
              <p className="mt-4 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.055] px-4 py-3 text-sm leading-6 text-[#F5C542]">
                {status.helper}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { title: "Usage produit", value: integration.productUse ?? "Création, suivi ou automatisation", icon: Zap },
              { title: "Mode", value: getModeCopy(mode), icon: FileText },
              { title: "Statut", value: status.label, icon: Clock3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[24px] border border-white/[0.08] bg-black/25 p-4">
                  <Icon className="h-5 w-5 text-[#F5C542]" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">{item.title}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/80">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[34px] border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-5 sm:p-6">
          <ShieldCheck className="h-7 w-7 text-[#F5C542]" />
          <h2 className="mt-4 text-xl font-semibold">Activation contrôlée</h2>
          <div className="mt-5 space-y-3">
            {integration.setupSteps.map((step) => (
              <p key={step} className="flex gap-3 text-sm leading-6 text-white/62">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                {step}
              </p>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-6 w-full rounded-2xl border-[#F5C542]/25 bg-transparent text-[#F5C542]">
            <Link to="/security">Voir les garde-fous sécurité</Link>
          </Button>
        </aside>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Permissions déclarées</p>
          <div className="mt-5 grid gap-3">
            {integration.requiredPermissions.map((permission) => (
              <div key={permission} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-sm leading-6 text-white/62">
                <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[#F5C542]" />
                {permission}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Ce qui ne sera pas automatisé sans validation</p>
          <div className="mt-5 space-y-3">
            {[
              "Aucun secret ou token n'est demandé côté interface client.",
              "Aucun email, message WhatsApp, publicité ou paiement n'est exécuté automatiquement.",
              "Aucune donnée externe n'est lue sans consentement utilisateur.",
              "Les erreurs sont redacted et ne doivent jamais afficher d'erreur technique brute ou clé.",
              "Toute action sensible doit passer par confirmation humaine.",
            ].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-sm leading-6 text-white/62">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#F5C542]/30 bg-[#F5C542]/10 text-xs font-bold text-[#F5C542]">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>
    </V2PageShell>
  );
};

export default IntegrationDetail;
