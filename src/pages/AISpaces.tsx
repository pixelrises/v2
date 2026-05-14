import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Boxes,
  GraduationCap,
  KanbanSquare,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataSourceLabel } from "@/components/ui/data-state";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { aiSpacesList } from "@/modules/ai-spaces";

const iconMap: Record<string, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  graduation: GraduationCap,
  kanban: KanbanSquare,
  building: Building2,
  sparkles: Sparkles,
  message: MessageCircle,
};

const statusLabel = {
  active: "Actif",
  beta: "Bêta",
  soon: "Bientôt",
  disabled: "Désactivé",
};

const spaceAccentClass: Record<string, string> = {
  business: "border-[#F5C542]/45 bg-[#F5C542]/[0.08] text-[#F5C542]",
  student: "border-violet-400/40 bg-violet-400/[0.08] text-violet-200",
  management: "border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-200",
  enterprise: "border-blue-400/40 bg-blue-400/[0.08] text-blue-200",
  creator: "border-pink-400/40 bg-pink-400/[0.08] text-pink-200",
  general: "border-cyan-400/40 bg-cyan-400/[0.08] text-cyan-200",
};

const AISpaces = () => (
  <V2PageShell
    eyebrow="AI Spaces"
    title="Choisissez votre espace IA"
    description="Des espaces spécialisés pour créer, organiser, apprendre ou décider plus vite. Une page, une intention, une prochaine action."
    action={
      <>
        <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
          <Link to="/projects">Voir mes projets</Link>
        </Button>
        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Link to="/ai-spaces/business">
            <Sparkles className="h-4 w-4" />
            Créer avec l'IA
          </Link>
        </Button>
      </>
    }
  >
    <SEOHead
      title="AI Spaces | Pixelrises V2"
      description="Choisir un espace IA spécialisé dans Pixelrises V2."
      noIndex
    />

    <DataSourceLabel
      state="example"
      label="Espaces disponibles"
      description="Chaque espace affiche un statut honnête. Les exemples restent indiqués comme exemples, sans fausse promesse."
      className="mb-5"
    />

    <section className="rounded-[34px] border border-white/[0.08] bg-white/[0.03] p-3 shadow-[0_30px_120px_-90px_rgba(245,197,66,0.8)] sm:p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {aiSpacesList.map((space) => {
          const Icon = iconMap[space.icon] ?? Sparkles;
          const accentClass = spaceAccentClass[space.id] ?? spaceAccentClass.general;
          const workspaceItems = space.workspace.sections[0]?.items.slice(0, 3) ?? [];

          return (
            <Link
              key={space.id}
              to={`/ai-spaces/${space.id}`}
              className="group relative min-h-[330px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/30 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/35 hover:bg-white/[0.045] sm:p-6"
            >
              <div className={`absolute inset-x-0 top-0 h-44 bg-gradient-to-r ${space.accent}`} />
              <div className="absolute right-6 top-8 h-24 w-36 rounded-full bg-white/[0.03] blur-2xl transition group-hover:bg-[#F5C542]/[0.08]" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-3xl border ${accentClass}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-white">{space.name}</h2>
                      <Badge className="border-white/[0.10] bg-white/[0.04] text-[11px] text-white/62 hover:bg-white/[0.04]">
                        {statusLabel[space.status]}
                      </Badge>
                    </div>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/66">{space.description}</p>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  {workspaceItems.map((item) => (
                    <span
                      key={item.title}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-xs font-medium text-white/76"
                    >
                      {item.title}
                    </span>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">
                    Sortie principale
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{space.workspace.primaryOutput}</p>
                  <p className="mt-1 text-xs leading-5 text-white/48">{space.workspace.expertFocus}</p>
                </div>

                <div className="mt-auto pt-6">
                  <span className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${accentClass}`}>
                    Ouvrir cet espace
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>

    <section className="mt-7 rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Une expérience unifiée</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.45fr]">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Des builders puissants.
            <br />
            Des espaces IA spécialisés.
            <br />
            Une même IA Pixelrises.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
            Pixelrises garde une expérience simple : tu choisis un espace, tu obtiens une prochaine action claire,
            et les détails techniques restent masqués côté client.
          </p>
        </div>

        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="rounded-[26px] border border-white/[0.08] bg-black/25 p-5">
            <Boxes className="h-7 w-7 text-[#F5C542]" />
            <h3 className="mt-4 text-lg font-semibold">Builders</h3>
            <p className="mt-2 text-sm leading-6 text-white/52">Site Builder, Agent Builder, Game Builder et modules futurs.</p>
          </div>
          <span className="hidden text-4xl font-light text-white/70 md:block">+</span>
          <div className="rounded-[26px] border border-white/[0.08] bg-black/25 p-5">
            <KanbanSquare className="h-7 w-7 text-blue-300" />
            <h3 className="mt-4 text-lg font-semibold">AI Spaces</h3>
            <p className="mt-2 text-sm leading-6 text-white/52">Des environnements dédiés pour usages ciblés et performants.</p>
          </div>
          <span className="hidden text-4xl font-light text-white/70 md:block">=</span>
          <div className="rounded-[26px] border border-[#F5C542]/20 bg-[#F5C542]/[0.06] p-5">
            <ShieldCheck className="h-7 w-7 text-[#F5C542]" />
            <h3 className="mt-4 text-lg font-semibold">IA Pixelrises sécurisée</h3>
            <p className="mt-2 text-sm leading-6 text-white/52">Données protégées, validation humaine et contrôle total des actions.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-white/[0.08] pt-5">
        {["Données protégées", "Validation humaine", "Actions contrôlées", "Amélioration continue"].map((item) => (
          <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-4 py-2 text-xs text-white/62">
            <LockKeyhole className="h-3.5 w-3.5 text-[#F5C542]" />
            {item}
          </span>
        ))}
      </div>
    </section>
  </V2PageShell>
);

export default AISpaces;
