import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, CheckCircle2, Eye, Gamepad2, Globe2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import portfolioPreview from "@/assets/template-previews/portfolio-expert.svg";
import salonPreview from "@/assets/template-previews/salon-premium.svg";
import medicalPreview from "@/assets/template-previews/cabinet-confiance.svg";
import businessPreview from "@/assets/template-previews/business-pro.svg";
import agentBuilderPreview from "@/assets/template-previews/agent-builder.svg";
import agentSeoPreview from "@/assets/template-previews/agent-seo.svg";
import agentDesignPreview from "@/assets/template-previews/agent-design.svg";
import gameObbyPreview from "@/assets/template-previews/game-roblox-obby.svg";
import gameTycoonPreview from "@/assets/template-previews/game-roblox-tycoon.svg";
import gameUefnPreview from "@/assets/template-previews/game-uefn-island.svg";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataSourceLabel } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { agentRegistry, gameTemplateRegistry } from "@/modules/registries";
import { smartTemplates, type SmartTemplate } from "@/v2/mock-data";

type TemplateTab = "sites" | "agents" | "games";
type TemplateSort = "popularite" | "premium";
type TemplateVisual = {
  category: string;
  description: string;
  image: string;
  name: string;
  tags: string[];
  tier: "Simple" | "Premium" | "Bêta";
};

const siteTemplateOrder = ["portfolio", "beauty", "medical", "agence"] as const;

const siteVisuals: Record<string, TemplateVisual> = {
  portfolio: {
    category: "Créatif • Portfolio",
    description: "Un site vitrine premium pour mettre en valeur votre travail avec une direction visuelle forte.",
    image: portfolioPreview,
    name: "Portfolio Expert",
    tags: ["Portfolio", "Créatif", "Personnel"],
    tier: "Premium",
  },
  beauty: {
    category: "Beauté • Bien-être",
    description: "Un site élégant pour salon, spa, coiffure ou institut, pensé pour la réservation.",
    image: salonPreview,
    name: "Salon Premium",
    tags: ["Beauté", "Réservation", "Local"],
    tier: "Premium",
  },
  medical: {
    category: "Santé • Médical",
    description: "Un site clair pour rassurer vos patients, expliquer vos soins et générer des rendez-vous.",
    image: medicalPreview,
    name: "Cabinet Confiance",
    tags: ["Santé", "Médical", "Rendez-vous"],
    tier: "Simple",
  },
  agence: {
    category: "Business • Services",
    description: "Un site professionnel pour vendre vos services, clarifier l'offre et convertir.",
    image: businessPreview,
    name: "Business Pro",
    tags: ["Services", "Business", "B2B"],
    tier: "Premium",
  },
};

const agentVisuals: Record<string, TemplateVisual> = {
  builder: {
    category: "Création • Projet",
    description: "Transforme un brief en plan, structure, contenu et prochaines actions.",
    image: agentBuilderPreview,
    name: "Agent Builder Pro",
    tags: ["Brief", "Plan", "Projet"],
    tier: "Premium",
  },
  seo: {
    category: "Trafic • SEO",
    description: "Prépare titres, pages, FAQ et mots-clés pour gagner en visibilité.",
    image: agentSeoPreview,
    name: "Agent SEO Growth",
    tags: ["SEO", "FAQ", "Local"],
    tier: "Premium",
  },
  design: {
    category: "UI • Direction artistique",
    description: "Améliore la hiérarchie, le spacing et la perception premium de vos interfaces.",
    image: agentDesignPreview,
    name: "Agent Design Studio",
    tags: ["UI", "Premium", "Layout"],
    tier: "Premium",
  },
};

const gameVisuals: Record<string, TemplateVisual> = {
  "roblox-obby": {
    category: "Roblox • Obby",
    description: "Blueprint d'obstacles, progression, checkpoints et loop de rétention.",
    image: gameObbyPreview,
    name: "Roblox Obby Rush",
    tags: ["Obby", "Progression", "Roblox"],
    tier: "Bêta",
  },
  "roblox-tycoon": {
    category: "Roblox • Tycoon",
    description: "Économie, upgrades, zones, récompenses et logique de progression.",
    image: gameTycoonPreview,
    name: "Roblox Tycoon Lab",
    tags: ["Tycoon", "Économie", "Roblox"],
    tier: "Bêta",
  },
  "uefn-island": {
    category: "Fortnite • UEFN",
    description: "Concept d'île, scoring, level design et checklist de production.",
    image: gameUefnPreview,
    name: "UEFN Island Kit",
    tags: ["UEFN", "Island", "Gameplay"],
    tier: "Bêta",
  },
};

const getSiteVisual = (template: SmartTemplate): TemplateVisual => {
  return (
    siteVisuals[template.id] ?? {
      category: `${template.niche} • ${template.goal}`,
      description: template.description,
      image: businessPreview,
      name: template.name,
      tags: template.sections.slice(0, 3),
      tier: template.tier === "simple" ? "Simple" : "Premium",
    }
  );
};

const tierClasses: Record<TemplateVisual["tier"], string> = {
  Simple: "border-emerald-400/20 text-emerald-300",
  Premium: "border-[#F5C542]/25 text-[#F5C542]",
  Bêta: "border-violet-300/25 text-violet-200",
};

const Templates = () => {
  const [tab, setTab] = useState<TemplateTab>("sites");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TemplateSort>("popularite");

  const siteTemplates = useMemo(() => {
    const ordered = siteTemplateOrder
      .map((id) => smartTemplates.find((template) => template.id === id))
      .filter((template): template is SmartTemplate => Boolean(template));
    const cleanQuery = query.trim().toLowerCase();
    const base = cleanQuery ? smartTemplates : ordered;
    const filtered = base.filter((template) =>
      [template.name, template.niche, template.goal, template.description, template.promise, getSiteVisual(template).name]
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery),
    );

    if (sort === "premium") {
      filtered.sort((left, right) => {
        const leftTier = getSiteVisual(left).tier === "Premium" ? 0 : 1;
        const rightTier = getSiteVisual(right).tier === "Premium" ? 0 : 1;
        return leftTier - rightTier || getSiteVisual(left).name.localeCompare(getSiteVisual(right).name);
      });
    }

    return filtered.slice(0, cleanQuery ? 8 : 4);
  }, [query, sort]);

  const featuredAgents = agentRegistry.slice(0, 3);
  const featuredGames = gameTemplateRegistry.filter((template) =>
    ["roblox-obby", "roblox-tycoon", "uefn-island"].includes(template.id),
  );

  return (
    <V2PageShell
      eyebrow="Templates"
      title="Accélérez vos lancements avec des templates prêts à performer"
      description="Gagnez du temps et lancez plus vite. Nos templates sont pensés comme des points de départ premium pour sites, agents IA et jeux."
    >
      <SEOHead title="Templates V2 | Pixelrises" description="Templates intelligents Pixelrises V2." noIndex />

      <DataSourceLabel
        state="example"
        label="Catalogue de templates"
        description="Ces templates sont des points de départ éditoriaux et visuels. Ils ne sont pas des projets client réels tant qu'ils n'ont pas été utilisés et sauvegardés."
        className="mb-6"
      />

      <section className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.035] sm:w-[640px] sm:grid-cols-3">
          {[
            { id: "sites" as const, label: "Sites", icon: Globe2 },
            { id: "agents" as const, label: "Agents", icon: Bot },
            { id: "games" as const, label: "Jeux", icon: Gamepad2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center justify-center gap-2 border-white/[0.08] px-5 py-4 text-sm font-semibold transition ${
                  tab === item.id
                    ? "bg-[#F5C542] text-black shadow-[0_0_34px_-18px_rgba(245,197,66,0.9)]"
                    : "border-l text-white/62 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-white/[0.10] bg-black/25 px-4 sm:w-[310px]">
            <Search className="h-4 w-4 text-white/42" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un template..."
              className="h-11 border-0 bg-transparent px-0 text-white shadow-none placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSort((current) => (current === "popularite" ? "premium" : "popularite"))}
            className="h-12 rounded-xl border-white/[0.10] bg-black/25 px-5 text-white/82"
          >
            {sort === "popularite" ? "Popularité" : "Premium d'abord"}
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {tab === "sites" ? (
        <section className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/86">Sites</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">Templates de sites prêts à l'emploi pour lancer une présence crédible.</p>
            </div>
            <Link to="/builder/site" className="text-sm font-semibold text-[#F5C542]">
              Voir tous les sites <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {siteTemplates.map((template) => {
              const visual = getSiteVisual(template);
              return (
                <TemplateCard
                  key={template.id}
                  visual={visual}
                  useHref={`/builder/site?template=${template.id}`}
                  previewHref={`/builder/site?template=${template.id}&preview=true`}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/86">Agents IA</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">Templates d'agents avec prompt, permissions et cas d'usage prêts à adapter.</p>
            </div>
            <Link to="/agents" className="text-sm font-semibold text-[#F5C542]">
              Voir tous les agents <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {featuredAgents.map((agent) => {
              const visual =
                agentVisuals[agent.id] ??
                ({
                  category: "Agent IA • Productivité",
                  description: agent.description,
                  image: agentBuilderPreview,
                  name: agent.name,
                  tags: [agent.role, agent.badge, "IA"],
                  tier: "Premium",
                } satisfies TemplateVisual);

              return <TemplateCard key={agent.id} visual={visual} useHref="/builder/agent" previewHref="/agents" compact />;
            })}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/86">Jeux</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">Templates de jeux avec blueprint, gameplay loop, assets et checklist.</p>
            </div>
            <Link to="/builder/game" className="text-sm font-semibold text-[#F5C542]">
              Voir tous les jeux <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {featuredGames.map((template) => {
              const visual =
                gameVisuals[template.id] ??
                ({
                  category: `${template.platform} • ${template.type}`,
                  description: "Blueprint de jeu avec loop, règles, assets et checklist.",
                  image: gameObbyPreview,
                  name: template.name,
                  tags: [template.platform, template.type, "Blueprint"],
                  tier: "Bêta",
                } satisfies TemplateVisual);

              return (
                <TemplateCard
                  key={template.id}
                  visual={visual}
                  useHref={`/builder/game?template=${template.id}`}
                  previewHref={`/builder/game?template=${template.id}&preview=true`}
                  compact
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[16px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Des templates pensés par des experts, optimisés pour la performance.</h2>
              <p className="mt-1 text-sm leading-6 text-white/52">Chaque preview montre une vraie intention : site, agent ou jeu, pas un visuel générique.</p>
            </div>
          </div>
          {["Design premium", "100% personnalisable", "Performance optimale", "Mises à jour incluses"].map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm text-white/64">
              <CheckCircle2 className="h-4 w-4 text-[#F5C542]" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </V2PageShell>
  );
};

type TemplateCardProps = {
  compact?: boolean;
  previewHref: string;
  useHref: string;
  visual: TemplateVisual;
};

const TemplateCard = ({ compact = false, previewHref, useHref, visual }: TemplateCardProps) => (
  <article
    className={`group flex flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/35 hover:shadow-[0_28px_80px_-62px_rgba(245,197,66,0.9)] ${
      compact ? "min-h-[332px]" : "min-h-[310px]"
    }`}
  >
    <div className="relative h-[138px] overflow-hidden rounded-[16px] border border-white/[0.08] bg-black/35">
      <img
        src={visual.image}
        alt={`Aperçu ${visual.name}`}
        className="h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-[1.035]"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.38))]" />
      <Badge className={`absolute right-3 top-3 border bg-black/55 px-3 py-1 text-[11px] ${tierClasses[visual.tier]}`}>
        {visual.tier}
      </Badge>
    </div>

    <div className="mt-4 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">{visual.category}</p>
      <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">{visual.name}</h3>
      <p className="mt-3 text-sm leading-6 text-white/60">{visual.description}</p>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {visual.tags.map((tag) => (
        <span key={tag} className="rounded-lg border border-white/[0.08] bg-white/[0.055] px-2.5 py-1 text-xs text-white/58">
          {tag}
        </span>
      ))}
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <Button asChild className="rounded-xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
        <Link to={useHref}>Utiliser</Link>
      </Button>
      <Button asChild variant="outline" className="rounded-xl border-white/[0.12] bg-black/20 text-white/82">
        <Link to={previewHref}>
          <Eye className="h-4 w-4" />
          Preview
        </Link>
      </Button>
    </div>
  </article>
);

export default Templates;
