import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Filter, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { agentRegistry, gameTemplateRegistry } from "@/modules/registries";
import { smartTemplates } from "@/v2/mock-data";

const tierLabel = {
  simple: "Simple",
  premium: "Premium",
  luxe: "Luxe",
};

const Templates = () => {
  return (
    <V2PageShell
      title="Templates intelligents pour lancer plus vite"
      description="Chaque template est un point de départ adaptatif : Pixelrises garde la structure business, puis l'adapte à la niche, au niveau de gamme, au CTA et à l'objectif."
      action={
        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Link to="/builder/site">
            Utiliser un template
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <SEOHead
        title="Templates V2 | Pixelrises"
        description="Templates intelligents Pixelrises V2 pour créer des sites business premium."
        noIndex
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Logique adaptative</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
                Un template ne doit pas produire un site copié-collé. Il donne une stratégie de sections, puis le générateur adapte le message, les preuves, les CTA et la direction visuelle.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#F5C542]">
            <Filter className="h-4 w-4" />
            <p className="text-sm font-semibold">Personnalisation progressive</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Débutant : utiliser. Intermédiaire : choisir style et objectif. Avancé : modifier structure, webhooks et paramètres IA.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {smartTemplates.map((template) => {
          const Icon = template.icon;

          return (
            <article
              key={template.id}
              className="group relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/25 hover:bg-white/[0.055]"
            >
              <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${template.accent} opacity-80`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/35 text-[#F5C542] backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                    {tierLabel[template.tier]}
                  </Badge>
                </div>

                <div className="mt-7">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/42">
                    {template.niche} · {template.goal}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{template.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/58">{template.description}</p>
                </div>

                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                  <p className="text-xs font-semibold text-[#F5C542]">Promesse business</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">{template.promise}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {template.sections.map((section) => (
                    <span
                      key={section}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/58"
                    >
                      {section}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex gap-2">
                  <Button asChild className="flex-1 rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                    <Link to={`/builder/site?template=${template.id}`}>Utiliser</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-2xl border-white/[0.10] bg-transparent text-white/80"
                  >
                    <Link to={`/builder/site?template=${template.id}&preview=true`}>Preview</Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Templates agents IA</h2>
              <p className="mt-2 text-sm leading-7 text-white/58">
                Points de départ sûrs : lecture et suggestions activées, aucune action sensible sans validation.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
              <Link to="/builder/agent">Créer un agent</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {agentRegistry.slice(0, 6).map((agent) => {
              const Icon = agent.icon;
              return (
                <Link
                  key={agent.id}
                  to="/builder/agent"
                  className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-[#F5C542]/25"
                >
                  <Icon className="h-4 w-4 text-[#F5C542]" />
                  <p className="mt-3 text-sm font-semibold">{agent.name}</p>
                  <p className="mt-1 text-xs leading-5 text-white/48">{agent.role}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Templates jeux bêta</h2>
              <p className="mt-2 text-sm leading-7 text-white/58">
                Ils génèrent blueprint, snippets, assets et checklist. Aucune publication automatique n'est promise.
              </p>
            </div>
            <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
              <Link to="/builder/game">Créer un jeu</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {gameTemplateRegistry.map((template) => {
              const Icon = template.icon;
              return (
                <Link
                  key={template.id}
                  to={`/builder/game?template=${template.id}`}
                  className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-[#F5C542]/25"
                >
                  <Icon className="h-4 w-4 text-[#F5C542]" />
                  <p className="mt-3 text-sm font-semibold">{template.name}</p>
                  <p className="mt-1 text-xs leading-5 text-white/48">
                    {template.platform} · {template.type}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Règles anti-copié-collé</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            "Adapter la promesse à la niche et au client final.",
            "Changer les sections selon l'objectif : vente, devis, réservation ou crédibilité.",
            "Garder les CTA visibles, simples et cohérents avec le niveau de gamme.",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
              <p className="text-sm leading-6 text-white/62">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </V2PageShell>
  );
};

export default Templates;
