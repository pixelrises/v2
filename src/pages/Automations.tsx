import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Cable,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Plus,
  Settings2,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { dashboardAutomations, type DashboardAutomation } from "@/v2/mock-data";

const statusFilters: Array<DashboardAutomation["statusTone"] | "all"> = [
  "all",
  "ready",
  "development",
  "blocked",
];

const filterCopy: Record<(typeof statusFilters)[number], string> = {
  all: "Tous",
  ready: "Préparés",
  development: "En développement",
  blocked: "À connecter",
};

const statusToneClass: Record<DashboardAutomation["statusTone"], string> = {
  ready: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  development: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  blocked: "border-white/[0.10] bg-white/[0.04] text-white/58",
};

const approvalRules = [
  "Aucune publication sans validation utilisateur.",
  "Aucun message envoyé automatiquement sans confirmation.",
  "Aucune intégration connectée ou modifiée sans accord explicite.",
  "Les agents proposent des brouillons, patchs et recommandations validables.",
];

const Automations = () => {
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");
  const [scenarioName, setScenarioName] = useState("Relance nouveau lead");
  const [savedScenario, setSavedScenario] = useState<string | null>(null);

  const visibleAutomations = useMemo(() => {
    if (filter === "all") return dashboardAutomations;
    return dashboardAutomations.filter((automation) => automation.statusTone === filter);
  }, [filter]);

  const preparedCount = dashboardAutomations.filter((item) => item.statusTone === "ready").length;
  const pendingCount = dashboardAutomations.length - preparedCount;

  return (
    <V2PageShell
      title="Automatisations business sous contrôle"
      description="Préparez des scénarios qui accélèrent le suivi, la publication et les décisions, sans jamais exécuter d'action sensible sans validation."
      action={
        <Button className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Plus className="h-4 w-4" />
          Créer un scénario
        </Button>
      }
    >
      <SEOHead
        title="Automatisations | Pixelrises V2"
        description="Automatisations business préparées pour Pixelrises V2."
        noIndex
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#F5C542]/10 text-[#F5C542]">
                <Workflow className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">Votre moteur de croissance assistée</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
                Pixelrises prépare les bonnes actions au bon moment : relancer, vérifier, résumer, synchroniser et recommander. Pour V2, l'interface et les garde-fous sont prêts; les connexions réelles arriveront via les intégrations.
              </p>
            </div>
            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <div className="rounded-3xl border border-[#F5C542]/15 bg-[#F5C542]/[0.07] p-4">
                <p className="text-3xl font-semibold text-[#F5C542]">{preparedCount}</p>
                <p className="mt-1 text-xs text-white/48">scénarios préparés</p>
              </div>
              <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-3xl font-semibold">{pendingCount}</p>
                <p className="mt-1 text-xs text-white/48">à connecter</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              ["Déclencheur", "Lead, publication, rapport, formulaire"],
              ["Agent", "Analyse, vérifie ou prépare un brouillon"],
              ["Validation", "L'utilisateur confirme l'action sensible"],
              ["Exécution", "Envoi, sync ou publication après accord"],
            ].map(([label, value], index) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">
                  Étape {index + 1}
                </p>
                <p className="mt-3 font-semibold">{label}</p>
                <p className="mt-2 text-sm leading-6 text-white/52">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[32px] border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-xl font-semibold">Garde-fous V2</h2>
          </div>
          <div className="mt-5 space-y-3">
            {approvalRules.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                <p className="text-sm leading-6 text-white/64">{rule}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Scénarios</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Automatisations disponibles</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  filter === item
                    ? "border-[#F5C542]/35 bg-[#F5C542]/10 text-[#F5C542]"
                    : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white"
                }`}
              >
                {filterCopy[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleAutomations.map((automation) => {
            const Icon = automation.icon;
            return (
              <article
                key={automation.id}
                className="rounded-[28px] border border-white/[0.08] bg-black/20 p-5 transition hover:-translate-y-1 hover:border-[#F5C542]/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className={`${statusToneClass[automation.statusTone]} hover:bg-transparent`}>
                    {automation.statusLabel}
                  </Badge>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{automation.name}</h3>
                <p className="mt-3 text-sm leading-7 text-white/56">{automation.action}</p>
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/38">Déclencheur</p>
                    <p className="mt-1 text-sm text-white/76">{automation.trigger}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/38">Prochaine étape</p>
                    <p className="mt-1 text-sm text-white/76">{automation.nextStep}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-white/42">
                    <Clock3 className="h-3.5 w-3.5" />
                    {automation.lastActivity}
                  </span>
                  <span className="text-[#F5C542]">{automation.impact}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-xl font-semibold">Créer une automatisation personnalisée</h2>
          </div>
          <div className="mt-5 space-y-3">
            <Input
              value={scenarioName}
              onChange={(event) => setScenarioName(event.target.value)}
              className="rounded-2xl border-white/[0.10] bg-black/30 text-white"
              placeholder="Nom du scénario"
            />
            <select className="h-11 w-full rounded-2xl border border-white/[0.10] bg-black/30 px-3 text-sm text-white outline-none">
              <option>Nouveau lead créé</option>
              <option>Site prêt à publier</option>
              <option>Clic CTA détecté</option>
              <option>Rapport hebdomadaire</option>
            </select>
            <Textarea
              className="min-h-[120px] rounded-2xl border-white/[0.10] bg-black/30 text-white"
              placeholder="Décrivez l'action à préparer. Exemple : rédiger un message de relance personnalisé, puis demander validation avant envoi."
            />
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                <p className="text-sm leading-6 text-white/58">
                  Les permissions sensibles restent désactivées par défaut : modifier, publier, envoyer ou connecter demande une validation utilisateur.
                </p>
              </div>
            </div>
            <Button
              className="w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
              onClick={() => setSavedScenario(scenarioName.trim() || "Nouveau scénario")}
            >
              Préparer le scénario
            </Button>
            {savedScenario ? (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
                “{savedScenario}” est préparé côté UI. Connexions réelles à brancher via Integration Hub.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Cable className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-xl font-semibold">Connexions prévues</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">
            Une automatisation devient réellement utile quand elle reçoit un événement fiable et qu'elle peut préparer une action dans le bon outil.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["WhatsApp", "Préparer une relance lead"],
              ["Gmail", "Créer un brouillon email"],
              ["Google Sheets", "Centraliser les leads"],
              ["Webhooks", "Déclencher un scénario externe"],
              ["Analytics", "Identifier les pages à améliorer"],
              ["Stripe", "Suivre checkout_start et conversions"],
            ].map(([name, helper]) => (
              <div key={name} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{name}</p>
                  <CheckCircle2 className="h-4 w-4 text-[#F5C542]" />
                </div>
                <p className="mt-2 text-sm leading-6 text-white/50">{helper}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-5 rounded-2xl border-white/[0.10] bg-transparent text-white/80">
            <Link to="/integrations">
              Ouvrir Integration Hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </V2PageShell>
  );
};

export default Automations;
