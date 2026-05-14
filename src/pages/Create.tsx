import { Link } from "react-router-dom";
import { ArrowRight, Bot, CheckCircle2, FolderKanban, Gamepad2, Globe2, Plus, ShieldCheck, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { V2PageShell } from "@/components/v2/V2PageShell";

const creationOptions = [
  {
    title: "Créer un site",
    description: "Transforme ton idée en présence crédible, responsive et orientée conversion.",
    href: "/builder/site",
    icon: Globe2,
    status: "Disponible",
    accent: "border-violet-400/30 bg-violet-400/[0.08] text-violet-200",
    bullets: ["Design professionnel et responsive", "SEO, performance et sécurité intégrés", "Prévisualisation et publication préparées"],
    cta: "Créer un site",
  },
  {
    title: "Créer un agent IA",
    description: "Automatise, réponds, assiste et convertis avec un agent contrôlé.",
    href: "/builder/agent",
    icon: Bot,
    status: "Disponible",
    accent: "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200",
    bullets: ["Assistant entraîné à ton business", "Connexions préparées à tes outils", "Permissions validées avant action sensible"],
    cta: "Créer un agent IA",
  },
  {
    title: "Créer un jeu",
    description: "De ton concept à un blueprint exploitable, scripts, assets et checklist.",
    href: "/builder/game",
    icon: Gamepad2,
    status: "Bêta",
    accent: "border-[#F5C542]/35 bg-[#F5C542]/[0.08] text-[#F5C542]",
    bullets: ["Mécaniques et gameplay assistés par IA", "Assets, niveaux et scripts générés", "Export structuré, sans publication automatique"],
    cta: "Créer un jeu",
  },
];

const Create = () => (
  <V2PageShell
    eyebrow="Pixelrises V2"
    title="Que veux-tu créer aujourd’hui ?"
    description="Pixelrises transforme une idée en projet digital concret : site, agent IA ou jeu. Choisis ton point de départ, on t’accompagne à chaque étape."
    action={
      <>
        <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
          <Link to="/projects">Voir mes projets</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
          <Link to="/agents">Mes agents</Link>
        </Button>
        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Link to="/builder/site">
            <Plus className="h-4 w-4" />
            Créer quelque chose
          </Link>
        </Button>
      </>
    }
  >
    <SEOHead title="Créer | Pixelrises V2" description="Créer un site, un agent IA ou un jeu avec Pixelrises V2." noIndex />

    <section className="grid gap-4 xl:grid-cols-3">
      {creationOptions.map((option) => {
        const Icon = option.icon;
        return (
          <Link
            key={option.title}
            to={option.href}
            className="group relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/35 hover:bg-white/[0.055] sm:p-6"
          >
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(245,197,66,0.18),transparent_34%)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full border ${option.accent}`}>
                  <Icon className="h-9 w-9" />
                </div>
                <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                  {option.status}
                </Badge>
              </div>
              <h2 className="mt-8 text-2xl font-semibold tracking-tight">{option.title}</h2>
              <p className="mt-2 text-sm leading-7 text-white/58">{option.description}</p>
              <div className="mt-6 space-y-3 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                {option.bullets.map((bullet) => (
                  <div key={bullet} className="flex gap-3 text-sm leading-6 text-white/68">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white/68" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
              <span className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/[0.07] px-4 py-3 text-sm font-semibold text-[#F5C542] transition group-hover:bg-[#F5C542] group-hover:text-black">
                {option.cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        );
      })}
    </section>

    <section className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[34px] border border-white/[0.08] bg-white/[0.035] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
            <FolderKanban className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold">Plan / Build / Improve</h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Plan", "Clarifie ton idée, ton audience et tes objectifs clés."],
            ["2", "Build", "Nous construisons la structure, les fonctionnalités et le contenu."],
            ["3", "Improve", "On mesure, on optimise et on fait évoluer ton projet."],
          ].map(([step, title, description]) => (
            <div key={step} className="relative rounded-2xl border border-white/[0.08] bg-black/20 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F5C542]/35 text-sm font-semibold text-[#F5C542]">
                {step}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/52">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[34px] border border-[#F5C542]/15 bg-[#F5C542]/[0.055] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold">Sécurité & Permissions</h2>
        </div>
        <div className="mt-6 space-y-4">
          {[
            "Aucune donnée sensible n’est exposée côté front-end.",
            "Connexion sécurisée et secrets uniquement côté serveur.",
            "Aucune publication automatique sans validation humaine.",
            "Contrôle total des accès et permissions par projet.",
          ].map((item) => (
            <div key={item} className="flex gap-3 text-sm leading-7 text-white/66">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#F5C542]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Link to="/settings" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#F5C542]">
          En savoir plus sur la sécurité
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  </V2PageShell>
);

export default Create;
