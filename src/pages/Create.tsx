import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { creationCards } from "@/modules/registries";

const statusLabel = {
  available: "Disponible",
  beta: "Bêta",
  development: "En développement",
  soon: "Bientôt",
  configure: "À configurer",
  connected: "Connecté",
  requested: "Demandé",
};

const Create = () => (
  <V2PageShell
    title="Que veux-tu créer aujourd'hui ?"
    description="Pixelrises transforme une idée en projet digital concret : site, agent IA ou jeu structuré. La complexité reste progressive et chaque action sensible reste sous validation."
    action={
      <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
        <Link to="/builder/site">
          Démarrer par un site
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    }
  >
    <SEOHead title="Créer | Pixelrises V2" description="Créer un site, un agent IA ou un jeu avec Pixelrises V2." noIndex />

    <section className="grid gap-4 md:grid-cols-3">
      {creationCards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.type}
            to={card.href}
            className="group relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/30 hover:bg-white/[0.055] sm:p-6"
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#F5C542]/16 via-white/[0.04] to-transparent" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/[0.08] bg-black/35 text-[#F5C542]">
                  <Icon className="h-6 w-6" />
                </div>
                <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                  {statusLabel[card.status]}
                </Badge>
              </div>

              <h2 className="mt-7 text-2xl font-semibold tracking-tight">{card.title}</h2>
              <p className="mt-2 text-sm font-medium text-[#F5C542]">{card.benefit}</p>
              <p className="mt-4 min-h-[84px] text-sm leading-7 text-white/58">{card.description}</p>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Exemple</p>
                <p className="mt-2 text-sm leading-6 text-white/68">{card.example}</p>
              </div>

              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#F5C542]">
                Ouvrir le builder
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </div>
          </Link>
        );
      })}
    </section>

    <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#F5C542]" />
          <h2 className="text-xl font-semibold">Modes Plan / Build / Improve</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["Plan", "Comprendre l'idée, détecter le type de projet et proposer la stratégie."],
            ["Build", "Générer une version structurée avec preview, JSON et recommandations."],
            ["Improve", "Améliorer par patch ciblé sans régénérer tout le projet."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#F5C542]" />
          <h2 className="text-xl font-semibold">Sécurité V2</h2>
        </div>
        <div className="mt-5 space-y-3">
          {[
            "Aucune cle Pixelrises AI exposee cote frontend.",
            "Aucune intégration marquée connectée sans vrai branchement.",
            "Aucune publication automatique pour les jeux ou agents.",
          ].map((item) => (
            <div key={item} className="flex gap-3 text-sm leading-6 text-white/68">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#F5C542]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  </V2PageShell>
);

export default Create;
