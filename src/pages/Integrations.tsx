import { useMemo, useState } from "react";
import { ArrowRight, Cable, Search, Settings2, Webhook } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { integrationRegistry, type IntegrationRegistryItem, type RegistryStatus } from "@/modules/registries";

const categories: Array<IntegrationRegistryItem["category"] | "Toutes"> = [
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

const statusCopy: Record<RegistryStatus, { label: string; className: string; cta: string }> = {
  connected: {
    label: "Connecté",
    className: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
    cta: "Configurer",
  },
  available: {
    label: "Disponible",
    className: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
    cta: "Préparer",
  },
  configure: {
    label: "À configurer",
    className: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
    cta: "Configurer",
  },
  development: {
    label: "En développement",
    className: "border-blue-300/20 bg-blue-300/[0.08] text-blue-100",
    cta: "Suivre",
  },
  beta: {
    label: "Bêta",
    className: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
    cta: "Ouvrir bêta",
  },
  soon: {
    label: "Bientôt",
    className: "border-white/[0.10] bg-white/[0.04] text-white/58",
    cta: "Demander",
  },
  requested: {
    label: "Demandé",
    className: "border-purple-300/20 bg-purple-300/[0.08] text-purple-100",
    cta: "Voter",
  },
};

const Integrations = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Toutes");
  const [connectorName, setConnectorName] = useState("");

  const visibleIntegrations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return integrationRegistry.filter((integration) => {
      const categoryMatch = category === "Toutes" || integration.category === category;
      const queryMatch =
        !normalizedQuery ||
        [integration.name, integration.category, integration.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  return (
    <V2PageShell
      title="Integration Hub business-first"
      description="Connecteurs préparés pour vendre, mesurer, automatiser et développer. Les statuts restent honnêtes : aucune carte mockée n'est marquée connectée."
      action={
        <Button className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          Demander une intégration
          <ArrowRight className="h-4 w-4" />
        </Button>
      }
    >
      <SEOHead title="Integrations | Pixelrises V2" description="Integration Hub Pixelrises V2." noIndex />

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3">
            <Search className="h-4 w-4 text-white/42" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher Stripe, Analytics, Webhooks, Roblox..."
              className="h-10 border-0 bg-transparent px-0 text-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  category === item
                    ? "border-[#F5C542]/35 bg-[#F5C542]/10 text-[#F5C542]"
                    : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#F5C542]">
            <Cable className="h-4 w-4" />
            <p className="text-sm font-semibold">Statuts honnêtes</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/62">
            “Connecté” est réservé aux intégrations réellement branchées. Les cartes V2 actuelles affichent plutôt disponible, bêta, à configurer, bientôt ou en développement.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleIntegrations.map((integration) => {
          const Icon = integration.icon;
          const status = statusCopy[integration.status];

          return (
            <article
              key={integration.id}
              className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#F5C542]/25 hover:bg-white/[0.055]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/25 text-[#F5C542]">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/38">{integration.category}</p>
              <h2 className="mt-2 text-xl font-semibold">{integration.name}</h2>
              <p className="mt-3 min-h-[72px] text-sm leading-7 text-white/58">{integration.description}</p>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-xs font-semibold text-white/48">Permissions prévues</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {integration.permissions.map((permission) => (
                    <span key={permission} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/58">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                variant={integration.status === "available" || integration.status === "configure" ? "default" : "outline"}
                className={`mt-5 w-full rounded-2xl ${
                  integration.status === "available" || integration.status === "configure"
                    ? "bg-[#F5C542] text-black hover:bg-[#FFD766]"
                    : "border-white/[0.10] bg-transparent text-white/75"
                }`}
              >
                {status.cta}
              </Button>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Connecteur personnalisé</h2>
              <p className="text-sm text-white/45">Préparé pour API, webhook et test de connexion.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Input value={connectorName} onChange={(event) => setConnectorName(event.target.value)} placeholder="Nom de l'intégration" className="rounded-2xl border-white/[0.10] bg-black/30 text-white" />
            <Input placeholder="URL API ou Webhook URL" className="rounded-2xl border-white/[0.10] bg-black/30 text-white" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="h-11 rounded-2xl border border-white/[0.10] bg-black/30 px-3 text-sm text-white outline-none">
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
              </select>
              <Input placeholder="API key (backend requis)" type="password" className="rounded-2xl border-white/[0.10] bg-black/30 text-white" />
            </div>
            <Textarea placeholder='Body JSON exemple : { "event": "lead_created" }' className="min-h-[118px] rounded-2xl border-white/[0.10] bg-black/30 text-white" />
            <Button variant="outline" className="w-full rounded-2xl border-white/[0.10] bg-transparent text-white/80">
              <Settings2 className="h-4 w-4" />
              Préparer le test
            </Button>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Règles de sécurité</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-white/58">
            <p>Aucune clé API ne doit être stockée dans le frontend.</p>
            <p>Les intégrations marketing, IA et gaming restent en préparation tant que le backend V2 n'est pas branché.</p>
            <p>Un connecteur personnalisé ne doit jamais envoyer de données sans validation explicite.</p>
          </div>
        </div>
      </section>
    </V2PageShell>
  );
};

export default Integrations;
