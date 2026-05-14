import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  Link as LinkIcon,
  MoreVertical,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, DataSourceLabel, EmptyState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { V2PageShell } from "@/components/v2/V2PageShell";
import {
  approveAutomationRun,
  automationEngineSteps,
  automationScenarios,
  automationTriggerLabels,
  createPreparedAutomation,
  simulateAutomationRun,
  type AutomationRunLog,
  type AutomationScenario,
  type AutomationStatus,
} from "@/modules/automations/automation-system";

type AutomationPanel = "overview" | "runs" | "observability" | "create" | "templates";
type AutomationFilter = AutomationStatus | "all";

const statusFilters: AutomationFilter[] = ["all", "ready", "beta", "soon", "blocked"];

const filterCopy: Record<AutomationFilter, string> = {
  all: "Tous",
  ready: "Prêts",
  beta: "Bêta",
  soon: "Bientôt",
  blocked: "Bloqués",
  draft: "Brouillons",
};

const statusCopy: Record<AutomationStatus, string> = {
  ready: "Prêt",
  beta: "Bêta",
  soon: "Bientôt",
  blocked: "Bloqué",
  draft: "Brouillon",
};

const statusToneClass: Record<AutomationStatus, string> = {
  ready: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  beta: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  soon: "border-white/[0.10] bg-white/[0.04] text-white/58",
  blocked: "border-red-300/20 bg-red-300/10 text-red-100",
  draft: "border-sky-300/20 bg-sky-300/10 text-sky-100",
};

const riskClass = {
  low: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  medium: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  high: "border-red-300/20 bg-red-300/10 text-red-100",
};

const connectionStatuses = [
  { name: "Gmail", status: "Bientôt", dataState: "empty" as const },
  { name: "Google Sheets", status: "À configurer", dataState: "example" as const },
  { name: "Notion", status: "Bientôt", dataState: "empty" as const },
  { name: "HubSpot", status: "Bientôt", dataState: "empty" as const },
  { name: "Slack", status: "Bientôt", dataState: "empty" as const },
  { name: "Make", status: "Bientôt", dataState: "empty" as const },
];

const panelContent: Record<Exclude<AutomationPanel, "overview">, { title: string; description: string; items: string[]; cta: string; target: string }> = {
  runs: {
    title: "Runs et validations",
    description: "Suivez les dry runs, les validations nécessaires et les blocages de sécurité avant toute exécution réelle.",
    items: ["Aucun email réel envoyé", "Actions externes bloquées", "Logs redacted", "Fallback local explicite"],
    cta: "Voir les derniers logs",
    target: "/automations",
  },
  observability: {
    title: "Observabilité & sécurité",
    description: "Chaque scénario garde un statut clair : préparé, validation requise, bloqué ou exécuté en interne.",
    items: ["Pas de secrets dans les logs", "Validation humaine", "DataState affiché", "Erreur utilisateur propre"],
    cta: "Voir les garde-fous",
    target: "/security",
  },
  create: {
    title: "Créer une automatisation",
    description: "Préparez un scénario contrôlé avec déclencheur, conditions, analyse IA, action proposée et validation.",
    items: ["Choisir un déclencheur", "Définir une condition", "Préparer l'action IA", "Exiger une validation"],
    cta: "Préparer depuis un modèle",
    target: "/automations",
  },
  templates: {
    title: "Scénarios prêts à adapter",
    description: "Démarrez depuis des scénarios utiles, sans activer d'intégration réelle tant que tout n'est pas validé.",
    items: ["SEO après génération", "Checklist projet", "Relance lead", "Support client"],
    cta: "Explorer les scénarios",
    target: "/automations",
  },
};

const Automations = () => {
  const [filter, setFilter] = useState<AutomationFilter>("all");
  const [query, setQuery] = useState("");
  const [activePanel, setActivePanel] = useState<AutomationPanel>("overview");
  const [selectedScenarioId, setSelectedScenarioId] = useState(automationScenarios[0]?.id ?? "");
  const [preparedScenarioId, setPreparedScenarioId] = useState<string | null>(null);
  const [runLogs, setRunLogs] = useState<AutomationRunLog[]>([]);

  const visibleAutomations = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return automationScenarios.filter((automation) => {
      const filterMatch = filter === "all" || automation.status === filter;
      const queryMatch =
        !cleanQuery ||
        [automation.name, automation.description, automation.proposedAction, automationTriggerLabels[automation.trigger]]
          .join(" ")
          .toLowerCase()
          .includes(cleanQuery);
      return filterMatch && queryMatch;
    });
  }, [filter, query]);

  const selectedScenario = automationScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? automationScenarios[0];
  const preparedAutomation = selectedScenario ? createPreparedAutomation(selectedScenario) : null;
  const openedPanel = activePanel === "overview" ? null : panelContent[activePanel];

  const prepareScenario = (scenario: AutomationScenario) => {
    setSelectedScenarioId(scenario.id);
    setPreparedScenarioId(scenario.id);
    setActivePanel("create");
  };

  const runScenario = (scenario: AutomationScenario) => {
    const run = simulateAutomationRun(scenario);
    setRunLogs((current) => [run, ...current].slice(0, 6));
    setSelectedScenarioId(scenario.id);
    setActivePanel("runs");
  };

  const approveRun = (run: AutomationRunLog) => {
    setRunLogs((current) => current.map((item) => (item.id === run.id ? approveAutomationRun(run) : item)));
  };

  return (
    <V2PageShell
      eyebrow="Automatisations"
      title="Centre d'automatisation"
      description="Créez des scénarios utiles avec déclencheur, analyse IA, validation humaine, logs et garde-fous. Aucune action externe sensible ne part automatiquement."
      action={
        <>
          <Button type="button" variant="outline" onClick={() => setActivePanel("runs")} className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
            <Eye className="h-4 w-4" />
            Voir mes runs
          </Button>
          <Button type="button" variant="outline" onClick={() => setActivePanel("observability")} className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
            <LinkIcon className="h-4 w-4" />
            Observabilité
          </Button>
          <Button type="button" onClick={() => setActivePanel("create")} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Plus className="h-4 w-4" />
            Créer une automatisation
          </Button>
        </>
      }
    >
      <SEOHead title="Automatisations | Pixelrises V2" description="Automatisations business Pixelrises V2." noIndex />

      <DataSourceLabel
        state="example"
        label="Scénarios préparés"
        description="Les scénarios affichés sont une bibliothèque contrôlée. Une automatisation devient réelle uniquement après configuration, connexion d'outils et validation humaine."
        className="mb-5"
      />

      {openedPanel ? (
        <section className="mb-5 rounded-[30px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Configuration active</p>
              <h2 className="mt-3 text-2xl font-semibold">{openedPanel.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{openedPanel.description}</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {openedPanel.items.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-sm text-white/70">
                    <CheckCircle2 className="mb-2 h-4 w-4 text-[#F5C542]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                <Link to={openedPanel.target}>{openedPanel.cta}</Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => setActivePanel("overview")} className="rounded-2xl border-white/[0.10] bg-transparent text-white/82">
                Retour au centre
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Moteur d'automatisation sous contrôle</p>
        <p className="mt-2 text-sm leading-6 text-white/56">Chaque scénario suit un pipeline clair avant toute exécution.</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-[repeat(5,minmax(0,1fr))]">
          {automationEngineSteps.map((step, index) => {
            const icons = [Zap, Workflow, Sparkles, ShieldCheck, Play];
            const Icon = icons[index] ?? Workflow;
            return (
              <div key={step.id} className="rounded-[24px] border border-white/[0.08] bg-black/25 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F5C542]/30 bg-[#F5C542]/[0.08] text-[#F5C542]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">
                  {index + 1}. {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/52">{step.description}</p>
                {step.requiresValidation ? <DataBadge state="example" label="Validation" className="mt-4" /> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Scénarios prêts</p>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {statusFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      filter === item
                        ? "border-[#F5C542]/35 bg-[#F5C542] text-black"
                        : "border-white/[0.08] bg-white/[0.04] text-white/58 hover:text-white"
                    }`}
                  >
                    {filterCopy[item]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-4">
              <Search className="h-4 w-4 text-white/42" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un scénario..."
                className="h-12 border-0 bg-transparent px-0 text-white shadow-none placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {visibleAutomations.map((automation) => (
              <article key={automation.id} className="rounded-[26px] border border-white/[0.08] bg-black/25 p-5 transition hover:-translate-y-1 hover:border-[#F5C542]/25">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusToneClass[automation.status]} hover:bg-transparent`}>{statusCopy[automation.status]}</Badge>
                    <MoreVertical className="h-4 w-4 text-white/42" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{automation.name}</h3>
                <p className="mt-3 text-sm leading-6 text-white/56">{automation.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-white/58">
                    {automationTriggerLabels[automation.trigger]}
                  </span>
                  <Badge className={`${riskClass[automation.riskLevel]} hover:bg-transparent`}>Risque {automation.riskLevel}</Badge>
                  <DataBadge state={automation.dataState} label="Exemple" />
                </div>
                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <p className="text-xs font-semibold text-[#F5C542]">Action proposée</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">{automation.proposedAction}</p>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-4 text-xs">
                  <div>
                    <p className="text-white/38">Dernier run</p>
                    <p className="mt-1 text-white/70">{automation.lastRunLabel}</p>
                  </div>
                  <div>
                    <p className="text-white/38">Validation</p>
                    <p className="mt-1 text-[#F5C542]">{automation.validationRequired ? "Oui" : "Interne"}</p>
                  </div>
                  <div>
                    <p className="text-white/38">Statut</p>
                    <p className="mt-1 text-emerald-300">{automation.successRateLabel}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={() => prepareScenario(automation)} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                    Préparer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => runScenario(automation)} className="rounded-2xl border-white/[0.10] bg-transparent text-white/82">
                    Dry run
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {!visibleAutomations.length ? (
            <EmptyState
              title="Aucun scénario trouvé"
              description="Change le filtre ou prépare un nouveau scénario depuis le builder."
              className="mt-5"
            />
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[30px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Automation Builder</p>
            {preparedAutomation && selectedScenario ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold">{preparedAutomation.name}</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">{selectedScenario.description}</p>
                <div className="mt-5 space-y-3">
                  {[
                    ["Déclencheur", automationTriggerLabels[preparedAutomation.trigger]],
                    ["Condition", preparedAutomation.condition],
                    ["Analyse IA", preparedAutomation.aiAnalysis],
                    ["Action proposée", preparedAutomation.proposedAction],
                  ].map(([title, value]) => (
                    <div key={title} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                      <p className="text-xs font-semibold text-[#F5C542]">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/66">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <DataBadge state={preparedAutomation.dataState} label={preparedAutomation.dataState === "example" ? "Exemple" : undefined} />
                  <Badge className={`${riskClass[preparedAutomation.riskLevel]} hover:bg-transparent`}>Risque {preparedAutomation.riskLevel}</Badge>
                  <Badge className="border-white/[0.10] bg-white/[0.05] text-white/70 hover:bg-white/[0.05]">
                    {preparedAutomation.validationRequired ? "Validation requise" : "Action interne"}
                  </Badge>
                </div>
                <Button type="button" onClick={() => runScenario(selectedScenario)} className="mt-5 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  Lancer un dry run
                </Button>
              </>
            ) : (
              <EmptyState
                title="Aucun scénario préparé"
                description="Choisis un scénario puis clique sur Préparer pour voir le déclencheur, les conditions et l'action validable."
              />
            )}
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Logs / historique</p>
              <DataBadge state="mock" label="Fallback local" />
            </div>
            <div className="mt-4 space-y-3">
              {runLogs.length ? (
                runLogs.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{automationTriggerLabels[run.trigger]}</p>
                      <Badge className={`${riskClass[run.riskLevel]} hover:bg-transparent`}>{run.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/52">{run.result}</p>
                    {run.validationRequired && run.status === "validation_required" ? (
                      <Button type="button" onClick={() => approveRun(run)} className="mt-3 h-9 rounded-xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                        Valider en interne
                      </Button>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.12] bg-black/20 p-4 text-sm leading-6 text-white/50">
                  Aucun run réel. Lance un dry run pour vérifier le comportement sans exécuter d'action externe.
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1fr]">
        <div className="rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Créer une automatisation personnalisée</p>
          <p className="mt-2 text-sm leading-6 text-white/56">Le builder prépare le scénario. L'exécution réelle restera désactivée tant qu'une intégration n'est pas connectée et validée.</p>
          <div className="mt-7 grid gap-4 md:grid-cols-5">
            {automationEngineSteps.map((step, index) => (
              <div key={step.id} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#F5C542]/30 bg-black/25 text-[#F5C542]">
                  <span className="text-sm font-semibold">{index + 1}</span>
                </div>
                <p className="mt-3 text-sm font-semibold">{step.title}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={() => setActivePanel("create")} className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Plus className="h-4 w-4" />
              Préparer un scénario
            </Button>
            <Button type="button" variant="outline" onClick={() => setActivePanel("templates")} className="rounded-2xl border-white/[0.10] bg-transparent text-white/82">
              Utiliser un modèle
            </Button>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Connexions honnêtes</p>
          <p className="mt-2 text-sm leading-6 text-white/56">Aucune intégration n'est affichée comme connectée si elle ne l'est pas réellement.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {connectionStatuses.map((tool) => (
              <div key={tool.name} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[#F5C542]">
                  <Workflow className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">{tool.name}</p>
                <DataBadge state={tool.dataState} label={tool.status} className="mt-2 justify-center" />
              </div>
            ))}
            <Link to="/integrations" className="rounded-2xl border border-dashed border-white/[0.18] bg-black/25 p-4 text-center transition hover:border-[#F5C542]/30 hover:text-[#F5C542]">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-white/72">
                <Plus className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold">Configurer</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        {[
          ["8 scénarios préparés", "Bibliothèque Phase 6"],
          ["0 exécution externe", "Sécurité par défaut"],
          ["100% validation humaine", "Pour actions sensibles"],
          ["0 incident critique", "Aucun secret exposé"],
        ].map(([title, subtitle]) => (
          <div key={title} className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5">
            {title.includes("0") ? <AlertTriangle className="h-5 w-5 text-[#F5C542]" /> : <Clock3 className="h-5 w-5 text-[#F5C542]" />}
            <p className="mt-4 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-white/45">{subtitle}</p>
          </div>
        ))}
      </section>

      <button type="button" onClick={() => setActivePanel("runs")} className="mx-auto mt-5 flex w-fit items-center gap-2 text-sm font-semibold text-white/82">
        Voir tous les logs
        <ArrowRight className="h-4 w-4" />
      </button>
    </V2PageShell>
  );
};

export default Automations;
