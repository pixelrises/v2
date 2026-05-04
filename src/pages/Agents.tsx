import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CheckCircle2, Lock, Plus, Trash2, Wand2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { V2PageShell } from "@/components/v2/V2PageShell";
import type { CustomAgentProject } from "@/modules/creation-engine";
import { agentRegistry } from "@/modules/registries";
import { readStoredAgents } from "@/modules/storage/v2-storage";

const agentsStorageKey = "pixelrises-v2-custom-agents";

const Agents = () => {
  const [customAgents, setCustomAgents] = useState<CustomAgentProject[]>([]);

  useEffect(() => {
    setCustomAgents(readStoredAgents());
  }, []);

  const deleteAgent = (agentId: string) => {
    const agent = customAgents.find((item) => item.id === agentId);
    const confirmed = window.confirm(
      `Supprimer ${agent?.name || "cet agent"} ? Cette action retire l'agent personnalise de ce navigateur.`,
    );

    if (!confirmed) return;

    const nextAgents = customAgents.filter((item) => item.id !== agentId);
    window.localStorage.setItem(agentsStorageKey, JSON.stringify(nextAgents));
    setCustomAgents(nextAgents);
  };

  return (
    <V2PageShell
      title="Agents IA pour creer, ameliorer et developper"
      description="Tous les agents passent maintenant par Agent Studio. Les agents proposent des recommandations validables et ne publient, n'envoient ou ne connectent rien sans validation utilisateur."
      action={
        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Link to="/builder/agent">
            <Plus className="h-4 w-4" />
            Creer un agent
          </Link>
        </Button>
      }
    >
      <SEOHead
        title="Agents IA | Pixelrises V2"
        description="Agents IA officiels et personnalises pour Pixelrises V2."
        noIndex
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          {agentRegistry.map((agent) => {
            const Icon = agent.icon;

            return (
              <article
                key={agent.id}
                className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 transition hover:border-[#F5C542]/25 hover:bg-white/[0.055]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                    {agent.badge}
                  </Badge>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{agent.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/38">{agent.role}</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{agent.description}</p>
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-xs font-semibold text-[#F5C542]">Exemple d'action</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{agent.exampleAction}</p>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button asChild className="flex-1 rounded-2xl bg-white text-black hover:bg-white/90">
                    <Link to="/builder/agent">Utiliser</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
                    <Link to="/builder/agent">Configurer</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="sticky top-6 rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Agent Studio</h2>
                <p className="text-sm text-white/48">Generateur officiel</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-white/62">
              La creation, configuration et sauvegarde des agents passe par une interface unique inspiree d'Agent Studio.
            </p>

            <div className="mt-5 grid gap-3">
              {[
                "Prompt unique",
                "Modele IA mock-safe",
                "Permissions securisees",
                "Sauvegarde dans Mes agents",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                  <p className="text-sm text-white/64">{item}</p>
                </div>
              ))}
            </div>

            <Button asChild className="mt-5 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Link to="/builder/agent">
                <Wand2 className="h-4 w-4" />
                Ouvrir Agent Studio
              </Link>
            </Button>

            <p className="mt-4 flex gap-2 text-xs leading-5 text-white/45">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Aucun agent ne peut publier, envoyer, supprimer ou connecter un outil sans validation utilisateur.
            </p>
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Mes agents personnalises</h2>
            <p className="mt-2 text-sm text-white/48">Les agents sauvegardes depuis Agent Studio apparaissent ici.</p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
            <Link to="/builder/agent">Creer un nouvel agent</Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customAgents.length > 0 ? (
            customAgents.map((agent) => (
              <article key={agent.id} className="rounded-[26px] border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">{agent.role}</p>
                  </div>
                  <Badge className="border-white/[0.10] bg-white/[0.04] text-white/65 hover:bg-white/[0.04]">
                    Actif
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/58">{agent.goal}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/48">
                    {agent.level}
                  </span>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/48">
                    {agent.domain}
                  </span>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button asChild variant="outline" className="flex-1 rounded-2xl border-white/[0.10] bg-transparent text-white/80">
                    <Link to="/builder/agent">Ouvrir Studio</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-red-400/20 bg-red-400/[0.06] text-red-200 hover:bg-red-400/[0.10]"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[26px] border border-dashed border-white/[0.12] bg-black/20 p-6 text-sm leading-7 text-white/55 md:col-span-2 xl:col-span-3">
              Aucun agent personnalise pour le moment. Ouvrez Agent Studio pour creer votre premier agent.
            </div>
          )}
        </div>
      </section>
    </V2PageShell>
  );
};

export default Agents;
