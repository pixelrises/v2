import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Grid2X2,
  List,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Wand2,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, DataSourceLabel, EmptyState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { V2PageShell } from "@/components/v2/V2PageShell";
import {
  getAgentBlueprint,
  officialAgentBlueprints,
  summarizeAgentPermissions,
  type AgentOperationalStatus,
} from "@/modules/agents/agent-system";
import type { CustomAgentProject } from "@/modules/creation-engine";
import { agentRegistry } from "@/modules/registries";
import { readStoredAgents } from "@/modules/storage/v2-storage";

const agentsStorageKey = "pixelrises-v2-custom-agents";
const AGENT_INTERFACE_MODE_KEY = "pixelrises-agents-interface-mode";

type AgentFilter =
  | "all"
  | "ready"
  | "beta"
  | "custom"
  | "business"
  | "design"
  | "seo"
  | "content"
  | "student"
  | "analytics"
  | "automation"
  | "game"
  | "support"
  | "operations";
type AgentViewMode = "grid" | "list";
type AgentInterfaceMode = "simple" | "advanced";

const statusCopy: Record<AgentOperationalStatus, string> = {
  ready: "Prêt",
  beta: "Bêta",
  soon: "Bientôt",
  disabled: "Désactivé",
};

const statusClass: Record<AgentOperationalStatus, string> = {
  ready: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  beta: "border-[#F5C542]/25 bg-[#F5C542]/10 text-[#F5C542]",
  soon: "border-white/[0.12] bg-white/[0.05] text-white/58",
  disabled: "border-red-300/20 bg-red-300/10 text-red-100",
};

const agentFilters: Array<{ key: AgentFilter; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "ready", label: "Prêts" },
  { key: "beta", label: "Bêta" },
  { key: "custom", label: "Mes agents" },
  { key: "business", label: "Business" },
  { key: "design", label: "Design" },
  { key: "seo", label: "SEO" },
  { key: "content", label: "Content" },
  { key: "student", label: "Student" },
  { key: "analytics", label: "Analytics" },
  { key: "automation", label: "Automatisation" },
  { key: "game", label: "Game" },
  { key: "support", label: "Support" },
  { key: "operations", label: "Operations" },
];

const agentCategoryMap: Record<string, AgentFilter> = {
  builder: "business",
  business: "business",
  conversion: "business",
  copywriting: "content",
  design: "design",
  seo: "seo",
  support: "support",
  analytics: "analytics",
  automation: "automation",
  content: "content",
  student: "student",
  operations: "operations",
  improve: "design",
  "game-design": "game",
  script: "game",
  assets: "content",
  publishing: "operations",
};

const readAgentInterfaceMode = (): AgentInterfaceMode => {
  if (typeof window === "undefined") return "simple";
  return window.localStorage.getItem(AGENT_INTERFACE_MODE_KEY) === "advanced" ? "advanced" : "simple";
};

const persistAgentInterfaceMode = (mode: AgentInterfaceMode) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AGENT_INTERFACE_MODE_KEY, mode);
};

const getRegistryStatus = (status?: string): AgentOperationalStatus => {
  if (status === "available") return "ready";
  if (status === "beta") return "beta";
  if (status === "soon" || status === "development") return "soon";
  return "ready";
};

const Agents = () => {
  const [customAgents, setCustomAgents] = useState<CustomAgentProject[]>([]);
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [viewMode, setViewMode] = useState<AgentViewMode>("grid");
  const [interfaceMode, setInterfaceMode] = useState<AgentInterfaceMode>(() => readAgentInterfaceMode());

  const isAdvanced = interfaceMode === "advanced";

  useEffect(() => {
    setCustomAgents(readStoredAgents());
  }, []);

  const filteredAgents = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return agentRegistry.filter((agent) => {
      const blueprint = getAgentBlueprint(agent.id);
      const status = blueprint?.status ?? getRegistryStatus(agent.status);
      const category = agentCategoryMap[agent.id] ?? "business";
      const filterMatch =
        agentFilter === "all" ||
        (agentFilter === "ready" && status === "ready") ||
        (agentFilter === "beta" && status === "beta") ||
        agentFilter === category;
      const queryMatch =
        !cleanQuery ||
        [agent.name, agent.role, agent.description, agent.exampleAction, blueprint?.mission, category]
          .join(" ")
          .toLowerCase()
          .includes(cleanQuery);

      return filterMatch && queryMatch;
    });
  }, [agentFilter, query]);

  const filteredCustomAgents = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return customAgents.filter(
      (agent) =>
        !cleanQuery ||
        [agent.name, agent.role, agent.goal, agent.domain].join(" ").toLowerCase().includes(cleanQuery),
    );
  }, [customAgents, query]);

  const readyCount = officialAgentBlueprints.filter((agent) => agent.status === "ready").length;
  const betaCount = officialAgentBlueprints.filter((agent) => agent.status === "beta").length;
  const categoryCount = new Set(Object.values(agentCategoryMap)).size;

  const changeInterfaceMode = (mode: AgentInterfaceMode) => {
    setInterfaceMode(mode);
    persistAgentInterfaceMode(mode);
  };

  const deleteAgent = (agentId: string) => {
    const agent = customAgents.find((item) => item.id === agentId);
    const confirmed = window.confirm(
      `Supprimer ${agent?.name || "cet agent"} ? Cette action retire uniquement l'agent personnalisé de ce navigateur.`,
    );

    if (!confirmed) return;

    const nextAgents = customAgents.filter((item) => item.id !== agentId);
    window.localStorage.setItem(agentsStorageKey, JSON.stringify(nextAgents));
    setCustomAgents(nextAgents);
  };

  return (
    <V2PageShell
      eyebrow="Pixelrises V2"
      title="Agents IA"
      description="Déployez des employés virtuels IA avec rôle, mission, permissions et actions validables. Aucun agent ne publie, envoie ou connecte un outil sans validation."
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-2xl border border-white/[0.10] bg-black/40 p-1">
            {(["simple", "advanced"] as AgentInterfaceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeInterfaceMode(mode)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  interfaceMode === mode ? "bg-[#F5C542] text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {mode === "simple" ? "Simple" : "Avancé"}
              </button>
            ))}
          </div>
          <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to="/builder/agent">
              <Plus className="h-4 w-4" />
              Créer un agent
            </Link>
          </Button>
        </div>
      }
    >
      <SEOHead title="Agents IA | Pixelrises V2" description="Agents IA officiels et personnalisés pour Pixelrises V2." noIndex />

      <DataSourceLabel
        state="example"
        label="Bibliothèque préparée"
        description="Les agents officiels sont prêts ou bêta selon leur statut. Les actions externes restent désactivées tant qu'elles ne sont pas validées et connectées."
        className="mb-5"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-h-12 max-w-xl flex-1 items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/35 px-4">
              <Search className="h-4 w-4 text-white/42" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un agent..."
                className="h-12 border-0 bg-transparent px-0 text-white shadow-none placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:max-w-[690px]">
              {agentFilters.map(({ key, label }) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  onClick={() => setAgentFilter(key)}
                  className={`shrink-0 rounded-2xl border-white/[0.10] ${
                    agentFilter === key ? "bg-[#F5C542] text-black hover:bg-[#FFD766]" : "bg-black/25 text-white/82"
                  }`}
                >
                  {label}
                </Button>
              ))}
              <div className="flex shrink-0 overflow-hidden rounded-2xl border border-[#F5C542]/20 bg-black/25">
                <button
                  type="button"
                  aria-label="Afficher en grille"
                  onClick={() => setViewMode("grid")}
                  className={`px-4 transition ${
                    viewMode === "grid" ? "bg-[#F5C542]/10 text-[#F5C542]" : "text-white/48 hover:text-white"
                  }`}
                >
                  <Grid2X2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Afficher en liste"
                  onClick={() => setViewMode("list")}
                  className={`px-4 transition ${
                    viewMode === "list" ? "bg-[#F5C542]/10 text-[#F5C542]" : "text-white/48 hover:text-white"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {agentFilter !== "custom" ? (
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 2xl:grid-cols-3" : "grid gap-3"}>
              {filteredAgents.map((agent) => {
                const Icon = agent.icon;
                const blueprint = getAgentBlueprint(agent.id);
                const status = blueprint?.status ?? getRegistryStatus(agent.status);
                const permissionLabels = blueprint
                  ? summarizeAgentPermissions(blueprint.permissions)
                  : ["Lire projet", "Proposer", "Valider avant action"];

                return (
                  <article
                    key={agent.id}
                    className={`group rounded-[26px] border border-white/[0.08] bg-[#070808] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/30 hover:bg-white/[0.045] ${
                      viewMode === "list" ? "grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_240px] md:items-center" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F5C542]/10 bg-[#F5C542]/[0.08] text-[#F5C542] shadow-[0_0_45px_-26px_rgba(245,197,66,0.9)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${statusClass[status]} hover:bg-transparent`}>{statusCopy[status]}</Badge>
                        {isAdvanced ? <DataBadge state={blueprint?.dataState ?? "example"} label="Exemple" /> : null}
                      </div>
                    </div>
                    <div>
                      <h2 className={viewMode === "list" ? "text-lg font-semibold tracking-tight" : "mt-5 text-lg font-semibold tracking-tight"}>
                        {agent.name}
                      </h2>
                      <p className="mt-2 text-sm font-medium text-[#F5C542]">{blueprint?.role ?? agent.role}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">{blueprint?.mission ?? agent.description}</p>
                      <div className="mt-5 grid gap-2">
                        {permissionLabels.slice(0, isAdvanced ? 4 : 2).map((permission) => (
                          <p key={permission} className="flex items-center gap-2 text-xs text-white/58">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#F5C542]" />
                            {permission}
                          </p>
                        ))}
                      </div>
                      {isAdvanced ? (
                        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                          <p className="text-xs font-semibold text-[#F5C542]">Action validable</p>
                          <p className="mt-1 text-sm leading-6 text-white/72">{agent.exampleAction}</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                        <Link to={`/builder/agent?preset=${agent.id}&mode=use`}>Utiliser</Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/82">
                        <Link to={`/builder/agent?preset=${agent.id}&mode=config`}>Tester</Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredCustomAgents.length ? (
                filteredCustomAgents.map((agent) => (
                  <article key={agent.id} className="rounded-[30px] border border-white/[0.08] bg-[#070808] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                        <Bot className="h-5 w-5" />
                      </div>
                      <DataBadge state={agent.dataState ?? "mock"} label="Stockage local" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold">{agent.name}</h2>
                    <p className="mt-2 text-sm text-[#F5C542]">{agent.role}</p>
                    <p className="mt-3 text-sm leading-6 text-white/58">{agent.goal}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(agent.allowedActions ?? ["read_project", "create_task"]).slice(0, isAdvanced ? 6 : 3).map((action) => (
                        <span key={action} className="rounded-full border border-white/[0.08] bg-black/25 px-3 py-1 text-xs text-white/58">
                          {action}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                        <Link to={`/builder/agent?preset=${agent.id}&mode=config`}>Configurer</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-red-400/20 bg-red-400/[0.06] text-red-200"
                        onClick={() => deleteAgent(agent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Retirer
                      </Button>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Aucun agent personnalisé"
                  description="Crée ton premier agent dans Agent Studio. Il sera sauvegardé localement ou synchronisé dans le cloud selon ta session."
                  action={
                    <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                      <Link to="/builder/agent">Créer un agent</Link>
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[30px] border border-[#F5C542]/20 bg-[#F5C542]/[0.055] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5C542]/10 text-[#F5C542]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Agent Studio</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">Crée, teste et sécurise tes agents IA personnalisés.</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {[
                ["Rôle clair", "Mission, ton, domaine et limites visibles."],
                ["Permissions visibles", "Chaque action autorisée ou interdite est explicite."],
                ["Validation humaine", "Les actions externes restent bloquées sans accord."],
              ].map(([title, description]) => (
                <div key={title} className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-black/25 text-white/70">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/52">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild className="mt-7 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Link to="/builder/agent">
                <Wand2 className="h-4 w-4" />
                Ouvrir Agent Studio
              </Link>
            </Button>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Couverture officielle</h2>
              <DataBadge state="example" label={`${officialAgentBlueprints.length} agents`} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["Total", officialAgentBlueprints.length],
                ["Prêts", readyCount],
                ["Bêta", betaCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-center">
                  <p className="text-lg font-semibold text-white">{value}</p>
                  <p className="text-xs text-white/42">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/25 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-[#F5C542]" />
                {categoryCount} catégories couvertes
              </p>
              <p className="mt-1 text-xs leading-5 text-white/48">Business, design, SEO, contenu, student, analytics, automatisation, game et operations.</p>
            </div>
            {isAdvanced ? (
              <div className="mt-4 space-y-3">
                {officialAgentBlueprints.slice(0, 9).map((agent) => (
                  <div key={agent.id} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{agent.name}</p>
                      <Badge className={`${statusClass[agent.status]} hover:bg-transparent`}>{statusCopy[agent.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-white/46">{agent.role}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-black/25 p-4">
            <p className="flex gap-2 text-xs leading-5 text-white/48">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5C542]" />
              Aucun agent ne peut publier, envoyer, supprimer, modifier crédits/paiement ou connecter un outil sans validation explicite.
            </p>
            <Link to="/builder/agent" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#F5C542]">
              Créer un agent contrôlé
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </section>
    </V2PageShell>
  );
};

export default Agents;
