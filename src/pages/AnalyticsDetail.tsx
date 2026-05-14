import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Download, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, DataSourceLabel, EmptyState } from "@/components/ui/data-state";
import { Progress } from "@/components/ui/progress";
import { V2PageShell } from "@/components/v2/V2PageShell";
import type { DataState } from "@/lib/data-state";
import {
  acquisitionSources,
  buildAnalyticsSnapshot,
  businessScoreBreakdown,
  detailSectionLabels,
  downloadAnalyticsExport,
  fallbackEvents,
  getBusinessScoreTotal,
  isAnalyticsDetailSection,
  topPages,
} from "@/modules/analytics/analytics-center";
import { readStoredProjects } from "@/modules/storage/v2-storage";
import { readLocalV2Events } from "@/v2/analytics";

const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

const getDetailSnapshot = () => {
  const events = typeof window === "undefined" ? [] : readLocalV2Events();
  const projects = typeof window === "undefined" ? [] : readStoredProjects();
  const storageState: DataState = events.length || projects.length ? "mock" : "empty";

  return buildAnalyticsSnapshot({ events, projects, storageState });
};

const AnalyticsDetail = () => {
  const { section } = useParams();

  if (!isAnalyticsDetailSection(section)) {
    return <Navigate to="/analytics" replace />;
  }

  const title = detailSectionLabels[section];
  const snapshot = getDetailSnapshot();
  const score = snapshot.averageProjectScore || getBusinessScoreTotal();
  const scoreState: DataState = snapshot.averageProjectScore ? snapshot.sourceState : "example";

  return (
    <V2PageShell
      title={title}
      description="Détail opérationnel pour comprendre les signaux réels, distinguer les exemples et agir sans faux chiffre."
      action={
        <>
          <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
            <Link to="/analytics">
              <ArrowLeft className="h-4 w-4" />
              Retour analytics
            </Link>
          </Button>
          <Button onClick={() => downloadAnalyticsExport(snapshot)} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </>
      }
    >
      <SEOHead title={`${title} | Analytics Pixelrises V2`} description={`Détail ${title} Pixelrises V2.`} noIndex />

      <DataSourceLabel
        state={snapshot.sourceState}
        label={snapshot.sourceLabel}
        description={snapshot.sourceDescription}
        className="mb-5"
      />

      {section === "business-score" ? (
        <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="rounded-[34px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Score global</p>
              <DataBadge state={scoreState} label={snapshot.averageProjectScore ? snapshot.sourceLabel : "Exemple"} />
            </div>
            <div className="mt-6 grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#F5C542_0_78%,rgba(255,255,255,.12)_78%_100%)] p-3">
              <div className="grid h-full w-full place-items-center rounded-full bg-[#090909] text-center">
                <div>
                  <p className="text-5xl font-semibold tracking-[-0.08em]">{score}</p>
                  <p className="text-xs text-white/42">sur 100</p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-white/62">
              {snapshot.averageProjectScore
                ? "Score moyen calculé depuis les projets sauvegardés localement ou via la source connectée."
                : "Score exemple utilisé tant qu'aucun projet réel n'est disponible. Il ne représente pas encore tes performances."}
            </p>
            <Button asChild className="mt-6 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Link to="/builder/site">
                Améliorer un projet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {businessScoreBreakdown.map((dimension) => (
              <article key={dimension.label} className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{dimension.label}</h2>
                    <p className="mt-2 text-xs text-white/42">Poids : {dimension.weight}%</p>
                  </div>
                  <DataBadge state={dimension.dataState} />
                </div>
                <Progress value={dimension.score} className="mt-4 h-2 bg-white/[0.08]" />
                <p className="mt-4 text-sm leading-6 text-white/58">{dimension.issue}</p>
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Meilleure amélioration</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{dimension.bestImprovement}</p>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
                  <Link to={dimension.href}>{dimension.nextAction}</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {section === "acquisition" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {acquisitionSources.map((source) => (
            <article key={source.source} className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: source.color }} />
                  <div>
                    <h2 className="text-lg font-semibold">{source.source}</h2>
                    <p className="mt-1 text-xs text-white/42">{source.share}% du trafic exemple</p>
                  </div>
                </div>
                <DataBadge state={source.dataState} />
              </div>
              <p className="mt-5 text-4xl font-semibold">{formatNumber(source.visits)}</p>
              <p className="mt-2 text-sm text-white/45">visites de démonstration, non réelles</p>
              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Action recommandée</p>
                <p className="mt-2 text-sm leading-6 text-white/68">{source.recommendation}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {section === "events" ? (
        <section className="rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Journal analytics</p>
              <h2 className="mt-2 text-2xl font-semibold">Derniers événements</h2>
              <p className="mt-2 text-sm leading-7 text-white/55">Les métadonnées sont redacted. Aucun secret ni prompt sensible n'est affiché.</p>
            </div>
            <Badge className="border-white/10 bg-black/25 text-white/55 hover:bg-black/25">
              {snapshot.recentEvents.length} événement(s)
            </Badge>
          </div>

          {snapshot.recentEvents.length ? (
            <div className="mt-6 space-y-3">
              {snapshot.recentEvents.map((event) => (
                <div key={event.eventId} className="grid gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-4 sm:grid-cols-[210px_1fr_180px_auto]">
                  <p className="font-semibold text-[#F5C542]">{event.event}</p>
                  <p className="text-sm text-white/68">{String(event.metadata?.label ?? "Événement Pixelrises V2")}</p>
                  <p className="text-sm text-white/42">{new Date(event.createdAt).toLocaleString("fr-FR")}</p>
                  <DataBadge state={event.dataState ?? "mock"} label={event.dataState === "mock" ? "Local" : undefined} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun événement réel pour le moment"
              description="Ouvre un builder, crée un projet ou teste une action pour alimenter le journal analytics."
              action={
                <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  <Link to="/create">Créer un projet</Link>
                </Button>
              }
              className="mt-6"
            />
          )}

          {!snapshot.recentEvents.length ? (
            <div className="mt-5 rounded-[28px] border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <LineChart className="h-5 w-5 text-[#F5C542]" />
                <h3 className="font-semibold">Exemples d'événements attendus</h3>
                <DataBadge state="example" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {fallbackEvents.map((event) => (
                  <div key={event.eventId} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                    <p className="font-semibold text-[#F5C542]">{event.event}</p>
                    <p className="mt-2 text-sm text-white/60">{String(event.metadata?.label ?? "Événement exemple")}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {section === "pages" ? (
        <section className="grid gap-4">
          {topPages.map((page) => (
            <article key={page.path} className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-[#F5C542]" />
                    <h2 className="text-xl font-semibold">{page.title}</h2>
                    <DataBadge state={page.dataState} />
                  </div>
                  <p className="mt-2 text-sm text-white/45">{page.path}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-white/10 bg-black/25 text-white/70 hover:bg-black/25">{formatNumber(page.views)} vues</Badge>
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                    {page.conversionRate}% conversion
                  </Badge>
                  <Badge className="border-white/[0.10] bg-white/[0.04] text-white/58 hover:bg-white/[0.04]">{page.status}</Badge>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px]">
                <p className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-sm leading-6 text-white/68">{page.nextAction}</p>
                <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  <Link to={page.href}>Ouvrir la page</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {section === "recommendations" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {snapshot.recommendations.map((item) => (
            <article key={item.id} className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-3">
                <Sparkles className="h-6 w-6 text-[#F5C542]" />
                <div className="flex flex-wrap justify-end gap-2">
                  <DataBadge state={item.dataState} />
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">Impact {item.impact.toLowerCase()}</Badge>
                  <Badge className="border-white/[0.10] bg-white/[0.04] text-white/58 hover:bg-white/[0.04]">{item.confidence}</Badge>
                </div>
              </div>
              <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/58">{item.problem}</p>
              <p className="mt-3 rounded-2xl border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-4 text-sm leading-6 text-[#F5C542]">
                {item.action}
              </p>
              <Button asChild variant="outline" className="mt-5 w-full rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
                <Link to={item.href}>
                  Ouvrir {item.module}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}

          <article className="rounded-[28px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-5">
            <ShieldCheck className="h-6 w-6 text-[#F5C542]" />
            <h2 className="mt-5 text-xl font-semibold">Règle de sécurité</h2>
            <p className="mt-3 text-sm leading-7 text-white/58">
              Les recommandations guident des actions internes ou des micro-améliorations. Tout changement de compte, paiement, données sensibles, moteur IA ou intégration externe reste bloqué sans validation humaine.
            </p>
            <div className="mt-5 space-y-2">
              {["Pas de secret frontend", "Pas d'action externe automatique", "Pas de donnée mock présentée comme réelle", "Pas d'intégration déclarée active sans preuve"].map((rule) => (
                <span key={rule} className="flex items-center gap-2 text-sm text-white/66">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {rule}
                </span>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </V2PageShell>
  );
};

export default AnalyticsDetail;
