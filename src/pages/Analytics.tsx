import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  Download,
  FileText,
  Gamepad2,
  Globe2,
  LineChart,
  MousePointerClick,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, DataSourceLabel, EmptyState } from "@/components/ui/data-state";
import { V2PageShell } from "@/components/v2/V2PageShell";
import type { DataState } from "@/lib/data-state";
import {
  acquisitionSources,
  analyticsPeriodOptions,
  buildAnalyticsSnapshot,
  downloadAnalyticsExport,
  getBusinessScoreTotal,
  topPages,
  type AnalyticsMetric,
  type AnalyticsPeriod,
} from "@/modules/analytics/analytics-center";
import { getIntegrationSummary, getNormalizedIntegrations } from "@/modules/integrations/integration-system";
import { projectStorageAdapter } from "@/modules/storage/project-storage-adapter";
import { readStoredProjects, type StoredProject } from "@/modules/storage/v2-storage";
import { readLocalV2Events, trackV2Event, type AnalyticsEventPayload } from "@/v2/analytics";

const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

const metricIcons: Record<string, typeof BarChart3> = {
  projects: Rocket,
  sites: Globe2,
  agents: Bot,
  games: Gamepad2,
  visits: Users,
  cta: MousePointerClick,
  leads: Users,
  versions: FileText,
  published: TrendingUp,
  "automation-runs": Sparkles,
  "ai-usage": Bot,
  errors: AlertTriangle,
};

const metricColors: Record<string, string> = {
  projects: "#F5C542",
  sites: "#22C55E",
  agents: "#EC4899",
  games: "#8B5CF6",
  visits: "#3B82F6",
  cta: "#F5C542",
  leads: "#22C55E",
  versions: "#A855F7",
  published: "#F97316",
  "automation-runs": "#06B6D4",
  "ai-usage": "#F5C542",
  errors: "#EF4444",
};

const getMetric = (metrics: AnalyticsMetric[], id: string) => metrics.find((metric) => metric.id === id)?.value ?? 0;

const Analytics = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("day");
  const [projects, setProjects] = useState<StoredProject[]>(() => (typeof window === "undefined" ? [] : readStoredProjects()));
  const [events, setEvents] = useState<AnalyticsEventPayload[]>(() => (typeof window === "undefined" ? [] : readLocalV2Events()));
  const [storageState, setStorageState] = useState<DataState>(() => (projects.length ? "mock" : "empty"));

  useEffect(() => {
    const tracked = trackV2Event("page_view", { label: "Analytics ouvert", source: "/analytics", module: "analytics" }, { module: "analytics" });
    setEvents((current) => [tracked, ...current].slice(0, 300));

    let mounted = true;
    void projectStorageAdapter.listProjects().then((result) => {
      if (!mounted) return;
      setProjects(result.data);
      setStorageState(result.persisted ? "real" : result.data.length ? "mock" : "empty");
    });

    return () => {
      mounted = false;
    };
  }, []);

  const snapshot = useMemo(
    () =>
      buildAnalyticsSnapshot({
        events,
        projects,
        storageState,
      }),
    [events, projects, storageState],
  );
  const integrations = useMemo(() => getNormalizedIntegrations(), []);
  const integrationSummary = useMemo(() => getIntegrationSummary(integrations), [integrations]);
  const chartBars = snapshot.trafficSeries[period];
  const visits = getMetric(snapshot.metrics, "visits");
  const ctaClicks = getMetric(snapshot.metrics, "cta");
  const leads = getMetric(snapshot.metrics, "leads");
  const conversionRate = visits > 0 ? Number(((leads / visits) * 100).toFixed(2)) : 0;
  const score = snapshot.averageProjectScore || getBusinessScoreTotal();
  const scoreState: DataState = snapshot.averageProjectScore ? snapshot.sourceState : "example";

  return (
    <V2PageShell
      title="Analytics"
      description="Centre de pilotage data-first : données réelles quand elles existent, stockage local clairement marqué, aucun faux chiffre présenté comme réel."
      action={
        <>
          <span className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/[0.10] bg-black/25 px-4 text-sm font-medium text-white/82">
            <CalendarDays className="h-4 w-4" />
            Session actuelle
          </span>
          <Button
            onClick={() => downloadAnalyticsExport(snapshot)}
            className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </>
      }
    >
      <SEOHead title="Analytics | Pixelrises V2" description="Analytics Pixelrises V2." noIndex />

      <DataSourceLabel
        state={snapshot.sourceState}
        label={snapshot.sourceLabel}
        description={snapshot.sourceDescription}
        className="mb-5"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.slice(0, 8).map((metric) => {
          const Icon = metricIcons[metric.id] ?? BarChart3;
          const color = metricColors[metric.id] ?? "#F5C542";

          return (
            <Link
              key={metric.id}
              to={metric.href}
              className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#F5C542]/25"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22`, color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <DataBadge state={metric.dataState} label={metric.badgeLabel} />
              </div>
              <p className="mt-4 text-sm text-white/58">{metric.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{metric.displayValue}</p>
              <p className="mt-2 min-h-[36px] text-xs leading-5 text-white/42">{metric.helper}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Activité réelle disponible</h2>
              <p className="mt-2 text-sm text-white/45">La courbe utilise uniquement les événements collectés localement ou via source réelle.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-1">
              {analyticsPeriodOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={`rounded-xl px-3 py-2 text-xs transition ${
                    period === item.key ? "bg-white/[0.10] text-white" : "text-white/48 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {events.length ? (
            <div className="mt-8 flex h-72 items-end gap-3 border-b border-l border-white/[0.08] px-4 pb-4">
              {chartBars.map((height, index) => (
                <div key={`${period}-${height}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-xl bg-[#F5C542]/80 shadow-[0_0_26px_-12px_rgba(245,197,66,0.9)]" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune activité mesurée"
              description="Crée ou ouvre un projet pour commencer à collecter des événements. Aucun graphique exemple n'est affiché comme réel."
              action={
                <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  <Link to="/create">Créer un projet</Link>
                </Button>
              }
              className="mt-6"
            />
          )}
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Conversion</h2>
              <p className="mt-2 text-sm text-white/45">Calculée uniquement si visites, CTA et leads sont réellement trackés.</p>
            </div>
            <DataBadge state={visits ? snapshot.sourceState : "empty"} label={visits ? snapshot.sourceLabel : "Vide"} />
          </div>
          <div className="mt-6 space-y-2">
            {[
              ["Visites", visits, "100%"],
              ["Clics CTA", ctaClicks, visits ? `${Math.round((ctaClicks / Math.max(visits, 1)) * 100)}%` : "0%"],
              ["Leads", leads, ctaClicks ? `${Math.round((leads / Math.max(ctaClicks, 1)) * 100)}%` : "0%"],
            ].map(([label, value, percent], index) => (
              <div
                key={String(label)}
                className="mx-auto flex items-center justify-between rounded-xl bg-[#F5C542] px-5 py-4 text-black"
                style={{ width: `${100 - index * 14}%`, opacity: Number(value) > 0 ? 1 - index * 0.12 : 0.38 }}
              >
                <span className="font-semibold">{label}</span>
                <span className="text-sm">{formatNumber(Number(value))} · {percent}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
              <p className="text-sm text-white/52">Taux de conversion réel</p>
              <p className="mt-2 text-4xl font-semibold">{conversionRate}%</p>
              <p className="mt-2 text-xs text-white/38">{visits ? "Calculé depuis les événements disponibles." : "Aucune visite trackée."}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
              <p className="text-sm text-white/52">Intégrations prêtes</p>
              <p className="mt-2 text-4xl font-semibold">{integrationSummary.not_configured + integrationSummary.dry_run}</p>
              <p className="mt-2 text-xs text-white/38">À configurer ou dry-run, pas faussement connectées.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.78fr_1fr_0.9fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Sources d'acquisition</h2>
            <DataBadge state="example" label="Exemple" />
          </div>
          <p className="mt-2 text-sm leading-6 text-white/45">Ces sources sont des exemples tant que Search Console/Analytics n'est pas connecté.</p>
          <div className="mt-6 space-y-3">
            {acquisitionSources.map((source) => (
              <Link key={source.source} to="/analytics/acquisition" className="block rounded-2xl border border-white/[0.08] bg-black/25 p-4 transition hover:border-[#F5C542]/25">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-white/72">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                    {source.source}
                  </span>
                  <span className="text-xs text-white/42">{source.share}%</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/40">{source.recommendation}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recommandations business</h2>
              <p className="mt-2 text-sm text-white/45">Actions concrètes générées depuis les signaux disponibles.</p>
            </div>
            <Button asChild variant="ghost" className="rounded-2xl text-[#F5C542] hover:bg-[#F5C542]/10 hover:text-[#F5C542]">
              <Link to="/analytics/recommendations">Voir tout</Link>
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.recommendations.map((item) => (
              <Link key={item.id} to={item.href} className="block rounded-2xl border border-white/[0.08] bg-black/25 p-4 transition hover:border-[#F5C542]/25">
                <div className="flex flex-wrap items-center gap-2">
                  <DataBadge state={item.dataState} />
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">Impact {item.impact.toLowerCase()}</Badge>
                  <Badge className="border-white/[0.10] bg-white/[0.04] text-white/58 hover:bg-white/[0.04]">{item.confidence}</Badge>
                </div>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/54">{item.problem}</p>
                <p className="mt-2 text-sm leading-6 text-[#F5C542]">{item.action}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <h2 className="text-xl font-semibold">Score business</h2>
          <div className="mt-5 flex items-center gap-5">
            <div className="grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(#F5C542_0_78%,rgba(255,255,255,.12)_78%_100%)] p-2">
              <div className="grid h-full w-full place-items-center rounded-full bg-[#090909]">
                <p className="text-2xl font-semibold">{score}<span className="text-sm text-white/42">/100</span></p>
              </div>
            </div>
            <div>
              <DataBadge state={scoreState} label={snapshot.averageProjectScore ? snapshot.sourceLabel : "Exemple"} />
              <p className="mt-3 text-sm leading-6 text-white/52">
                {snapshot.averageProjectScore ? "Score moyen calculé depuis tes projets." : "Score exemple en attendant des projets réels."}
              </p>
            </div>
          </div>
          <Button asChild className="mt-5 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to="/analytics/business-score">Voir le détail du score</Link>
          </Button>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Événements récents</h2>
              <p className="mt-2 text-sm text-white/45">Metadata redacted, aucun secret ni prompt sensible.</p>
            </div>
            <Button asChild variant="ghost" className="rounded-2xl text-[#F5C542] hover:bg-[#F5C542]/10 hover:text-[#F5C542]">
              <Link to="/analytics/events">Voir tous</Link>
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.recentEvents.length ? (
              snapshot.recentEvents.slice(0, 6).map((event) => (
                <div key={event.eventId} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5C542]/10 text-[#F5C542]">
                    <LineChart className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{String(event.metadata?.label ?? event.event)}</p>
                    <p className="mt-1 text-xs text-white/38">{new Date(event.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <DataBadge state={event.dataState ?? "mock"} label={event.dataState === "mock" ? "Local" : undefined} />
                </div>
              ))
            ) : (
              <EmptyState title="Aucun événement" description="Les prochains événements apparaîtront ici sans données sensibles." />
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Configuration</p>
              <h2 className="mt-2 text-2xl font-semibold">Ce qui rend Analytics vraiment fiable</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">
                Les tables `analytics_events`, `ai_usage_logs` et `integration_statuses` existent déjà côté migrations V2. Les prochaines données à connecter proprement sont leads, formulaires et statuts d'intégration live.
              </p>
            </div>
            <FileText className="h-6 w-6 shrink-0 text-[#F5C542]" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Score business détaillé", "/analytics/business-score"],
              ["Sources d'acquisition", "/analytics/acquisition"],
              ["Événements et logs", "/analytics/events"],
              ["Recommandations IA", "/analytics/recommendations"],
            ].map(([label, href]) => (
              <Button key={href} asChild variant="outline" className="justify-start rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
                <Link to={href}>{label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </V2PageShell>
  );
};

export default Analytics;
