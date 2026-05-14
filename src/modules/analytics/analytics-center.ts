import type { DataState } from "@/lib/data-state";
import type { StoredProject } from "@/modules/storage/v2-storage";
import type { AnalyticsEventPayload } from "@/v2/analytics";

export type AnalyticsPeriod = "day" | "week" | "month";

export type AnalyticsDetailSection =
  | "business-score"
  | "acquisition"
  | "events"
  | "pages"
  | "recommendations";

export type BusinessScoreDimension = {
  label: string;
  score: number;
  weight: number;
  issue: string;
  bestImprovement: string;
  nextAction: string;
  href: string;
  dataState: DataState;
};

export type AnalyticsMetric = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  helper: string;
  dataState: DataState;
  badgeLabel?: string;
  href: string;
};

export type BusinessRecommendation = {
  id: string;
  title: string;
  problem: string;
  action: string;
  impact: "Fort" | "Moyen" | "Faible";
  confidence: "Haute" | "Moyenne" | "Signal faible";
  module: string;
  href: string;
  dataState: DataState;
};

export type AnalyticsSnapshot = {
  sourceState: DataState;
  sourceLabel: string;
  sourceDescription: string;
  metrics: AnalyticsMetric[];
  recommendations: BusinessRecommendation[];
  recentEvents: AnalyticsEventPayload[];
  projects: StoredProject[];
  averageProjectScore: number;
  trafficSeries: Record<AnalyticsPeriod, number[]>;
};

const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

export const analyticsPeriodOptions: { key: AnalyticsPeriod; label: string }[] = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

const countEvents = (events: AnalyticsEventPayload[], names: string[]) =>
  events.filter((event) => names.includes(event.event)).length;

const scoreAverage = (projects: StoredProject[]) => {
  const scored = projects.filter((project) => Number.isFinite(project.score) && project.score > 0);
  if (!scored.length) return 0;
  return Math.round(scored.reduce((sum, project) => sum + project.score, 0) / scored.length);
};

const metricState = (value: number, hasSource: boolean): DataState => {
  if (value > 0) return hasSource ? "mock" : "example";
  return "empty";
};

const buildSeriesFromEvents = (events: AnalyticsEventPayload[], period: AnalyticsPeriod) => {
  const size = period === "day" ? 14 : period === "week" ? 12 : 12;
  const buckets = Array.from({ length: size }, () => 0);
  const now = Date.now();
  const bucketMs = period === "day" ? 1000 * 60 * 60 * 24 : period === "week" ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24 * 30;

  events.forEach((event) => {
    const created = new Date(event.createdAt).getTime();
    if (!Number.isFinite(created)) return;
    const index = size - 1 - Math.floor((now - created) / bucketMs);
    if (index >= 0 && index < size) buckets[index] += 1;
  });

  const max = Math.max(...buckets, 1);
  return buckets.map((value) => (value === 0 ? 8 : Math.max(16, Math.round((value / max) * 92))));
};

export const buildAnalyticsSnapshot = ({
  events,
  projects,
  storageState,
}: {
  events: AnalyticsEventPayload[];
  projects: StoredProject[];
  storageState: DataState;
}): AnalyticsSnapshot => {
  const hasEvents = events.length > 0;
  const hasProjects = projects.length > 0;
  const hasSource = hasEvents || hasProjects;
  const sites = projects.filter((project) => project.type === "site");
  const agents = projects.filter((project) => project.type === "agent");
  const games = projects.filter((project) => project.type === "game");
  const generatedSites = sites.filter((project) => ["generated", "improved", "published"].includes(project.status)).length;
  const improvedSites = sites.filter((project) => project.status === "improved").length + countEvents(events, ["site_improved", "project_improved"]);
  const publishedSites = sites.filter((project) => project.status === "published").length + countEvents(events, ["site_published", "publish_site"]);
  const ctaClicks = countEvents(events, ["cta_click"]);
  const leads = countEvents(events, ["lead_created", "form_submit"]);
  const visits = countEvents(events, ["page_view"]);
  const versions = countEvents(events, ["version_created", "project_improved", "site_improved"]);
  const automationRuns = countEvents(events, ["automation_run"]);
  const aiUsage = countEvents(events, ["generation_completed", "site_generated", "agent_tested", "game_created"]);
  const errors = countEvents(events, ["error_occurred", "integration_failed"]);
  const averageProjectScore = scoreAverage(projects);

  const sourceState: DataState = hasSource ? storageState : "empty";
  const sourceLabel = hasSource
    ? storageState === "real"
      ? "Données cloud"
      : "Stockage local"
    : "Aucune donnée réelle";
  const sourceDescription = hasSource
    ? storageState === "real"
      ? "Les métriques proviennent d'une source connectée et persistée."
      : "Les métriques proviennent du stockage de cette session. Elles sont utiles pour le test, mais ne remplacent pas encore la donnée cloud."
    : "Aucun projet, lead ou événement réel n'est encore disponible. Le dashboard affiche des états vides et des actions pour commencer à collecter.";

  const metrics: AnalyticsMetric[] = [
    {
      id: "projects",
      label: "Projets",
      value: projects.length,
      displayValue: formatNumber(projects.length),
      helper: "Tous les projets Pixelrises sauvegardés.",
      dataState: metricState(projects.length, hasProjects),
      badgeLabel: hasProjects ? sourceLabel : "Vide",
      href: "/projects",
    },
    {
      id: "sites",
      label: "Sites générés",
      value: generatedSites,
      displayValue: formatNumber(generatedSites),
      helper: "Sites présents dans les projets sauvegardés.",
      dataState: metricState(generatedSites, hasProjects),
      badgeLabel: hasProjects ? sourceLabel : "Vide",
      href: "/builder/site",
    },
    {
      id: "agents",
      label: "Agents",
      value: agents.length,
      displayValue: formatNumber(agents.length),
      helper: "Agents personnalisés ou projets agent sauvegardés.",
      dataState: metricState(agents.length, hasProjects),
      badgeLabel: hasProjects ? sourceLabel : "Vide",
      href: "/agents",
    },
    {
      id: "games",
      label: "Jeux",
      value: games.length,
      displayValue: formatNumber(games.length),
      helper: "Blueprints de jeux sauvegardés.",
      dataState: metricState(games.length, hasProjects),
      badgeLabel: hasProjects ? sourceLabel : "Vide",
      href: "/builder/game",
    },
    {
      id: "visits",
      label: "Visites",
      value: visits,
      displayValue: formatNumber(visits),
      helper: "Événements page_view collectés.",
      dataState: metricState(visits, hasEvents),
      badgeLabel: hasEvents ? "Stockage local" : "Vide",
      href: "/analytics/events",
    },
    {
      id: "cta",
      label: "Clics CTA",
      value: ctaClicks,
      displayValue: formatNumber(ctaClicks),
      helper: "Clics CTA réellement trackés.",
      dataState: metricState(ctaClicks, hasEvents),
      badgeLabel: hasEvents ? "Stockage local" : "Vide",
      href: "/analytics/events",
    },
    {
      id: "leads",
      label: "Leads",
      value: leads,
      displayValue: formatNumber(leads),
      helper: "Leads ou formulaires capturés.",
      dataState: metricState(leads, hasEvents),
      badgeLabel: hasEvents ? "Stockage local" : "Vide",
      href: "/integrations",
    },
    {
      id: "versions",
      label: "Versions",
      value: versions,
      displayValue: formatNumber(versions),
      helper: "Améliorations ou versions créées.",
      dataState: metricState(versions, hasEvents),
      badgeLabel: hasEvents ? "Stockage local" : "Vide",
      href: "/projects",
    },
    {
      id: "published",
      label: "Sites publiés",
      value: publishedSites,
      displayValue: formatNumber(publishedSites),
      helper: "Publication confirmée dans les projets ou événements.",
      dataState: metricState(publishedSites, hasSource),
      badgeLabel: publishedSites ? sourceLabel : "Vide",
      href: "/projects",
    },
    {
      id: "automation-runs",
      label: "Runs automation",
      value: automationRuns,
      displayValue: formatNumber(automationRuns),
      helper: "Runs d'automatisation trackés.",
      dataState: metricState(automationRuns, hasEvents),
      badgeLabel: hasEvents ? "Stockage local" : "Vide",
      href: "/automations",
    },
    {
      id: "ai-usage",
      label: "Usage IA",
      value: aiUsage,
      displayValue: formatNumber(aiUsage),
      helper: "Générations ou tests IA trackés.",
      dataState: metricState(aiUsage, hasEvents),
      badgeLabel: hasEvents ? "Stockage local" : "Vide",
      href: "/ai-spaces",
    },
    {
      id: "errors",
      label: "Erreurs",
      value: errors,
      displayValue: formatNumber(errors),
      helper: "Erreurs applicatives redacted.",
      dataState: errors ? "mock" : "empty",
      badgeLabel: errors ? "À vérifier" : "Aucune",
      href: "/analytics/events",
    },
  ];

  return {
    sourceState,
    sourceLabel,
    sourceDescription,
    metrics,
    recommendations: buildBusinessRecommendations({ metrics, averageProjectScore, hasEvents, hasProjects }),
    recentEvents: events.slice(0, 8),
    projects,
    averageProjectScore,
    trafficSeries: {
      day: buildSeriesFromEvents(events, "day"),
      week: buildSeriesFromEvents(events, "week"),
      month: buildSeriesFromEvents(events, "month"),
    },
  };
};

export const businessScoreBreakdown: BusinessScoreDimension[] = [
  {
    label: "Clarté de l'offre",
    score: 82,
    weight: 16,
    issue: "La promesse est lisible, mais certains projets manquent encore d'une preuve concrète dès le hero.",
    bestImprovement: "Ajouter une preuve chiffrée ou un cas client dans le premier écran.",
    nextAction: "Renforcer les hooks et preuves des sites générés",
    href: "/builder/site",
    dataState: "example",
  },
  {
    label: "SEO & visibilité",
    score: 64,
    weight: 16,
    issue: "Le SEO local est préparé, mais les pages détaillées et mots-clés ne sont pas encore totalement branchés.",
    bestImprovement: "Créer une checklist SEO par projet avec title, H1, FAQ, zones et intention.",
    nextAction: "Analyser les pages performantes",
    href: "/analytics/pages",
    dataState: "example",
  },
  {
    label: "Conversion",
    score: 70,
    weight: 16,
    issue: "Les CTA existent, mais les objections et garanties restent trop génériques dans certains templates.",
    bestImprovement: "Ajouter des objections sectorielles et une section réassurance automatique.",
    nextAction: "Voir les recommandations",
    href: "/analytics/recommendations",
    dataState: "example",
  },
  {
    label: "Systèmes & automatisations",
    score: 71,
    weight: 14,
    issue: "Les automatisations sont visibles, mais certaines connexions restent encore à configurer.",
    bestImprovement: "Prioriser les scénarios leads, relance et reporting dans l'Automation Center.",
    nextAction: "Configurer les automatisations",
    href: "/automations",
    dataState: "example",
  },
  {
    label: "Mesure & apprentissage",
    score: 67,
    weight: 14,
    issue: "Les événements locaux existent, mais la synchronisation temps réel doit encore monter en puissance.",
    bestImprovement: "Centraliser événements, leads et usage IA dans le cockpit admin.",
    nextAction: "Consulter les événements",
    href: "/analytics/events",
    dataState: "example",
  },
  {
    label: "Publication & lancement",
    score: 74,
    weight: 12,
    issue: "La préparation publication est claire, mais le statut domaine/export doit devenir plus actionnable.",
    bestImprovement: "Afficher un plan de lancement par projet avec statut, risques et prochaine action.",
    nextAction: "Voir les projets",
    href: "/projects",
    dataState: "example",
  },
];

export const acquisitionSources = [
  {
    source: "Recherche organique",
    visits: 4128,
    share: 32.1,
    trend: "+18%",
    color: "#F5C542",
    recommendation: "Créer plus de pages SEO locales par niche et ville.",
    dataState: "example" as DataState,
  },
  {
    source: "Direct",
    visits: 2793,
    share: 21.7,
    trend: "+9%",
    color: "#8B5CF6",
    recommendation: "Renforcer la mémorisation de marque et le lien dashboard/projets.",
    dataState: "example" as DataState,
  },
  {
    source: "Réseaux sociaux",
    visits: 2410,
    share: 18.8,
    trend: "+24%",
    color: "#22C55E",
    recommendation: "Préparer Creator AI pour transformer les projets en contenus partageables.",
    dataState: "example" as DataState,
  },
];

export const topPages = [
  {
    path: "/create",
    title: "Créer un projet",
    views: 0,
    conversionRate: 0,
    status: "À mesurer",
    nextAction: "Collecter page_view et cta_click avant de conclure.",
    href: "/create",
    dataState: "empty" as DataState,
  },
  {
    path: "/builder/site",
    title: "Site Builder",
    views: 0,
    conversionRate: 0,
    status: "À mesurer",
    nextAction: "Tracker ouverture builder, génération, amélioration et publication.",
    href: "/builder/site",
    dataState: "empty" as DataState,
  },
  {
    path: "/integrations",
    title: "Hub d'intégrations",
    views: 0,
    conversionRate: 0,
    status: "À configurer",
    nextAction: "Activer la collecte analytics interne pour remplacer la donnée locale.",
    href: "/integrations",
    dataState: "empty" as DataState,
  },
];

export const buildBusinessRecommendations = ({
  metrics,
  averageProjectScore,
  hasEvents,
  hasProjects,
}: {
  metrics: AnalyticsMetric[];
  averageProjectScore: number;
  hasEvents: boolean;
  hasProjects: boolean;
}): BusinessRecommendation[] => {
  const getMetric = (id: string) => metrics.find((metric) => metric.id === id)?.value ?? 0;
  const recommendations: BusinessRecommendation[] = [];

  if (!hasProjects) {
    recommendations.push({
      id: "create-first-project",
      title: "Créer un premier projet mesurable",
      problem: "Aucun projet sauvegardé n'est disponible pour calculer un score fiable.",
      action: "Créer un site ou ouvrir Business AI pour générer une base exploitable.",
      impact: "Fort",
      confidence: "Haute",
      module: "Dashboard",
      href: "/create",
      dataState: "empty",
    });
  }

  if (!hasEvents) {
    recommendations.push({
      id: "collect-first-events",
      title: "Commencer la collecte d'événements",
      problem: "Aucun page_view, cta_click ou lead_created n'est encore collecté.",
      action: "Ouvrir le Site Builder, créer un projet et connecter un formulaire quand l'intégration sera prête.",
      impact: "Fort",
      confidence: "Haute",
      module: "Analytics",
      href: "/builder/site",
      dataState: "empty",
    });
  }

  if (getMetric("leads") === 0) {
    recommendations.push({
      id: "lead-capture",
      title: "Ajouter une capture de lead",
      problem: "Aucun lead n'est détecté dans les événements disponibles.",
      action: "Ajouter un CTA contact ou configurer Pixelrises Forms quand la connexion sera prête.",
      impact: "Fort",
      confidence: hasEvents ? "Moyenne" : "Signal faible",
      module: "Integrations",
      href: "/integrations",
      dataState: hasEvents ? "mock" : "empty",
    });
  }

  if (averageProjectScore > 0 && averageProjectScore < 75) {
    recommendations.push({
      id: "score-improve",
      title: "Améliorer le score projet",
      problem: `Le score moyen disponible est de ${averageProjectScore}/100.`,
      action: "Prioriser CTA, preuves, SEO local et section réassurance dans le Site Builder.",
      impact: "Moyen",
      confidence: "Moyenne",
      module: "Site Builder",
      href: "/builder/site",
      dataState: "mock",
    });
  }

  recommendations.push({
    id: "integration-status",
    title: "Vérifier les intégrations à configurer",
    problem: "Les connecteurs externes restent volontairement inactifs tant qu'ils ne sont pas configurés côté serveur.",
    action: "Commencer par Analytics interne et Pixelrises Forms avant les outils marketing.",
    impact: "Moyen",
    confidence: "Haute",
    module: "Integrations",
    href: "/integrations",
    dataState: "example",
  });

  return recommendations.slice(0, 5);
};

export const analyticsRecommendations = buildBusinessRecommendations({
  metrics: [],
  averageProjectScore: 0,
  hasEvents: false,
  hasProjects: false,
});

export const fallbackEvents: AnalyticsEventPayload[] = [
  {
    eventId: "example-lead",
    event: "lead_created",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metadata: { label: "Exemple : nouveau lead capturé", source: "/builder/site" },
    dataState: "example",
  },
  {
    eventId: "example-cta",
    event: "cta_click",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    metadata: { label: "Exemple : clic CTA réserver un appel", source: "/pricing" },
    dataState: "example",
  },
];

export const getBusinessScoreTotal = () => {
  const weightedScore = businessScoreBreakdown.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0);
  const totalWeight = businessScoreBreakdown.reduce((sum, dimension) => sum + dimension.weight, 0);
  return Math.round(weightedScore / totalWeight);
};

export const detailSectionLabels: Record<AnalyticsDetailSection, string> = {
  "business-score": "Score business",
  acquisition: "Acquisition",
  events: "Événements",
  pages: "Pages",
  recommendations: "Recommandations IA",
};

export const isAnalyticsDetailSection = (value: string | undefined): value is AnalyticsDetailSection =>
  Boolean(value && value in detailSectionLabels);

export const buildAnalyticsExport = (snapshot: AnalyticsSnapshot) => ({
  product: "Pixelrises V2",
  generatedAt: new Date().toISOString(),
  source: {
    state: snapshot.sourceState,
    label: snapshot.sourceLabel,
  },
  metrics: snapshot.metrics,
  businessScore: {
    score: snapshot.averageProjectScore || getBusinessScoreTotal(),
    breakdown: businessScoreBreakdown,
  },
  recommendations: snapshot.recommendations,
  events: snapshot.recentEvents,
});

export const downloadAnalyticsExport = (snapshot: AnalyticsSnapshot) => {
  if (typeof document === "undefined") return;

  const payload = buildAnalyticsExport(snapshot);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pixelrises-v2-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
