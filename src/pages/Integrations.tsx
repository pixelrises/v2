import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, LockKeyhole, MoreHorizontal, Plus, Search, ShieldCheck } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, DataSourceLabel, EmptyState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { V2PageShell } from "@/components/v2/V2PageShell";
import {
  canOpenIntegration,
  getIntegrationSummary,
  getNormalizedIntegrations,
  integrationStatusCopy,
  type IntegrationStatus,
  type NormalizedIntegration,
} from "@/modules/integrations/integration-system";

const categories: Array<NormalizedIntegration["category"] | "Toutes"> = [
  "Toutes",
  "Business",
  "Marketing",
  "Data",
  "Automatisation",
  "Dev",
  "Communication",
  "IA",
  "Domaines",
  "Gaming",
];

const statusFilters: Array<IntegrationStatus | "all"> = [
  "all",
  "connected",
  "not_configured",
  "dry_run",
  "beta",
  "coming_soon",
  "blocked",
  "error",
];

const statusTone: Record<IntegrationStatus, string> = {
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

const filterLabels: Record<(typeof statusFilters)[number], string> = {
  all: "Toutes",
  connected: "Connectées",
  not_configured: "À configurer",
  dry_run: "Dry-run",
  beta: "Bêta",
  coming_soon: "Bientôt",
  blocked: "Bloquées",
  error: "Erreur",
};

type LogoMeta = NonNullable<NormalizedIntegration["logo"]>;

const categoryLogoFallback: Record<NormalizedIntegration["category"], LogoMeta> = {
  Business: { initials: "€", accent: "#F5C542", from: "#1f1a05", to: "#7c5f09", glyph: "payments" },
  Marketing: { initials: "AD", accent: "#ec4899", from: "#330a22", to: "#be185d", glyph: "ads" },
  Data: { initials: "D", accent: "#38bdf8", from: "#082f49", to: "#075985", glyph: "chart" },
  Automatisation: { initials: "A", accent: "#a855f7", from: "#1e103f", to: "#6d28d9", glyph: "workflow" },
  Dev: { initials: "</>", accent: "#ffffff", from: "#111827", to: "#020617", glyph: "code" },
  Communication: { initials: "M", accent: "#22c55e", from: "#052e16", to: "#15803d", glyph: "message" },
  IA: { initials: "AI", accent: "#F5C542", from: "#211a05", to: "#856404", glyph: "ai" },
  Domaines: { initials: "DNS", accent: "#f97316", from: "#2d1304", to: "#c2410c", glyph: "domain" },
  Gaming: { initials: "G", accent: "#a78bfa", from: "#1e1b4b", to: "#6d28d9", glyph: "game" },
};

const getLogoMeta = (integration: NormalizedIntegration): LogoMeta => {
  const fallback = categoryLogoFallback[integration.category];
  const initials = integration.name
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return integration.logo ?? { ...fallback, initials: initials || fallback.initials };
};

const getIntegrationTarget = (integration: NormalizedIntegration, mode: "main" | "details" = "main") => {
  const integrationId = encodeURIComponent(integration.id);
  if (mode === "details") return `/integrations/${integrationId}`;
  if (integration.normalizedStatus === "beta") return `/integrations/${integrationId}/beta`;
  if (integration.normalizedStatus === "coming_soon") return `/integrations/${integrationId}/roadmap`;
  if (integration.normalizedStatus === "blocked" || integration.normalizedStatus === "error") return `/integrations/${integrationId}`;
  return `/integrations/${integrationId}/setup`;
};

function IntegrationLogo({ integration }: { integration: NormalizedIntegration }) {
  const Icon = integration.icon;
  const logo = getLogoMeta(integration);
  const style = {
    "--logo-accent": logo.accent,
    background: `radial-gradient(circle at 28% 20%, ${logo.accent}66, transparent 44%), linear-gradient(135deg, ${logo.from}, ${logo.to})`,
    borderColor: `${logo.accent}55`,
    boxShadow: `0 0 34px -20px ${logo.accent}`,
  } as CSSProperties;

  return (
    <div className="relative grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-[24px] border" style={style}>
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:18px_18px]" />
      <Icon className="relative h-7 w-7 text-white drop-shadow-[0_0_18px_rgba(255,255,255,.24)]" />
      <span className="absolute bottom-2 right-2 rounded-lg border border-white/15 bg-black/45 px-1.5 py-0.5 text-[10px] font-black tracking-[-0.04em] text-white">
        {logo.initials}
      </span>
      <span className="absolute left-2 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: logo.accent }} />
    </div>
  );
}

const Integrations = () => {
  const integrations = useMemo(() => getNormalizedIntegrations(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Toutes");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");

  const visibleIntegrations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return integrations.filter((integration) => {
      const categoryMatch = category === "Toutes" || integration.category === category;
      const statusMatch = status === "all" || integration.normalizedStatus === status;
      const queryMatch =
        !normalizedQuery ||
        [integration.name, integration.category, integration.description, integration.productUse ?? "", integration.normalizedStatus]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && statusMatch && queryMatch;
    });
  }, [category, integrations, query, status]);

  const summary = useMemo(() => getIntegrationSummary(integrations), [integrations]);
  const categoryCounts = useMemo(
    () =>
      categories
        .filter((item): item is NormalizedIntegration["category"] => item !== "Toutes")
        .map((item) => ({
          category: item,
          count: integrations.filter((integration) => integration.category === item).length,
        })),
    [integrations],
  );

  return (
    <V2PageShell
      eyebrow="Intégrations"
      title="Hub d'intégrations"
      description="Chaque connecteur affiche son vrai statut produit : connecté, à configurer, dry-run, bêta ou bientôt. Aucun outil externe n'est activé sans consentement."
      action={
        <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
          <Link to="/integrations/docs">
            <BookOpen className="h-4 w-4" />
            Documentation
          </Link>
        </Button>
      }
    >
      <SEOHead title="Intégrations | Pixelrises V2" description="Integration Hub Pixelrises V2." noIndex />

      <DataSourceLabel
        state="example"
        label="Catalogue produit vérifié"
        description="Les statuts viennent du registre V2 normalisé. Une intégration n'est réellement connectée que si le backend confirme une connexion active."
        className="mb-5"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-4">
                <Search className="h-4 w-4 text-white/42" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher une intégration, un outil ou un usage..."
                  className="h-12 border-0 bg-transparent px-0 text-white shadow-none placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}
                className="h-12 rounded-2xl border border-white/[0.10] bg-black/25 px-4 text-sm text-white outline-none"
              >
                {categories.map((item) => (
                  <option key={item} className="bg-neutral-950">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {statusFilters.map((item) => {
                const count = item === "all" ? summary.total : summary[item];

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                      status === item
                        ? "border-[#F5C542]/40 bg-[#F5C542]/12 text-[#F5C542]"
                        : "border-white/[0.08] bg-white/[0.03] text-white/58 hover:text-white"
                    }`}
                  >
                    {filterLabels[item]}
                    <span className="ml-2 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-white/70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {visibleIntegrations.map((integration) => {
              const statusMeta = integrationStatusCopy[integration.normalizedStatus];
              const canOpen = canOpenIntegration(integration);

              return (
                <article
                  key={integration.id}
                  className="group relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/25 hover:bg-white/[0.055]"
                >
                  <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#F5C542]/[0.06] blur-2xl transition group-hover:bg-[#F5C542]/[0.10]" />
                  <div className="relative flex items-start gap-4">
                    <IntegrationLogo integration={integration} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold tracking-[-0.03em]">{integration.name}</h2>
                        <Badge className={statusTone[integration.normalizedStatus]}>{statusMeta.label}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/56">{integration.description}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <DataBadge state={integration.dataState} label={integration.dataState === "example" ? "Catalogue" : undefined} />
                    <Badge className={`${riskTone[integration.riskLevel]} hover:bg-transparent`}>Risque {integration.riskLevel}</Badge>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/25 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Usage Pixelrises</p>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {integration.productUse ?? "Connecter cet outil à la création, au suivi ou à l'amélioration des projets."}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {integration.requiredPermissions.slice(0, 3).map((permission) => (
                      <span key={permission} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/58">
                        {permission}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    {integration.setupSteps.slice(0, 3).map((step) => (
                      <p key={step} className="flex items-center gap-2 text-xs text-white/48">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F5C542]" />
                        {step}
                      </p>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
                    <Button
                      asChild
                      variant={canOpen ? "default" : "outline"}
                      className={
                        canOpen
                          ? "rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
                          : "rounded-2xl border-white/[0.10] bg-transparent text-white/82 hover:bg-white/[0.06]"
                      }
                    >
                      <Link to={getIntegrationTarget(integration)}>
                        {integration.normalizedStatus === "connected"
                          ? "Ouvrir"
                          : integration.normalizedStatus === "not_configured"
                            ? "Configurer"
                            : integration.normalizedStatus === "dry_run"
                              ? "Tester dry-run"
                              : integration.normalizedStatus === "beta"
                                ? "Demander l'accès"
                                : "Voir la roadmap"}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent px-3 text-white/70 hover:bg-white/[0.06]">
                      <Link to={getIntegrationTarget(integration, "details")} aria-label={`Voir les détails ${integration.name}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}

            {!visibleIntegrations.length ? (
              <EmptyState
                title="Aucune intégration trouvée"
                description="Change le filtre ou recherche un autre outil. Aucun résultat fictif n'est ajouté."
              />
            ) : null}

            <article className="rounded-[30px] border border-dashed border-[#F5C542]/25 bg-[#F5C542]/[0.055] p-5">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] border border-[#F5C542]/25 bg-black/25 text-[#F5C542]">
                <Plus className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">Connecteur personnalisé</h2>
              <p className="mt-2 text-sm leading-6 text-white/56">
                Prépare un connecteur sur mesure via API ou webhook. Activation réelle uniquement après consentement, serveur sécurisé et logs redacted.
              </p>
              <Button asChild variant="outline" className="mt-6 w-full rounded-2xl border-[#F5C542]/25 bg-transparent text-[#F5C542]">
                <Link to="/integrations/custom">Préparer un connecteur</Link>
              </Button>
            </article>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Résumé</p>
            <p className="mt-5 text-5xl font-semibold">{summary.total}</p>
            <p className="mt-1 text-sm text-white/52">intégrations cataloguées</p>
            <div className="mt-6 space-y-3 text-sm">
              {statusFilters.filter((item): item is IntegrationStatus => item !== "all").map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                  <span className="text-white/70">{filterLabels[item]}</span>
                  <span className="font-semibold text-white">{summary[item]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Couverture vision</p>
            <div className="mt-5 space-y-3">
              {categoryCounts.map((item) => {
                const logo = categoryLogoFallback[item.category];
                return (
                  <div key={item.category} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-white/72">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: logo.accent }} />
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold text-white">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Statuts honnêtes</p>
            <div className="mt-5 space-y-4">
              {Object.entries(integrationStatusCopy).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#F5C542]" />
                  <div>
                    <p className="font-semibold text-white/82">{value.label}</p>
                    <p className="mt-1 text-sm leading-6 text-white/48">{value.helper}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Sécurité & consentement</p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/60">
              <p className="flex gap-3"><LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-white/70" />Aucune clé API n'est affichée côté front-end.</p>
              <p className="flex gap-3"><LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-white/70" />Aucune intégration externe n'est connectée sans action explicite.</p>
              <p className="flex gap-3"><LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-white/70" />Email, WhatsApp, publicité, paiement et crédits restent bloqués sans validation.</p>
            </div>
            <Button asChild variant="outline" className="mt-6 w-full rounded-2xl border-[#F5C542]/25 bg-transparent text-[#F5C542]">
              <Link to="/security">Voir les engagements</Link>
            </Button>
          </div>
        </aside>
      </section>
    </V2PageShell>
  );
};

export default Integrations;
