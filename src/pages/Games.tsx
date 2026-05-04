import { Link } from "react-router-dom";
import { ArrowRight, Gamepad2, ShieldAlert } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { gameTemplateRegistry } from "@/modules/registries";
import { readStoredGames } from "@/modules/storage/v2-storage";

const Games = () => {
  const savedGames = typeof window === "undefined" ? [] : readStoredGames();

  return (
    <V2PageShell
      title="Game projects"
      description="Tous les jeux V2 restent en bêta : Pixelrises prépare concepts, scripts, assets et checklists, sans publication automatique."
      action={
        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Link to="/builder/game">
            Nouveau jeu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <SEOHead title="Games | Pixelrises V2" description="Game Builder et projets jeux Pixelrises V2." noIndex />

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-2xl font-semibold">Mes jeux</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {savedGames.length > 0 ? (
              savedGames.map((game) => (
                <div key={game.meta.projectId} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{game.meta.title}</h3>
                      <p className="mt-1 text-sm text-white/45">{game.meta.platform} · {game.meta.gameType}</p>
                    </div>
                    <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">Blueprint</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.12] bg-black/20 p-8 text-center">
                <p className="text-lg font-semibold">Aucun jeu sauvegardé</p>
                <p className="mt-2 text-sm text-white/50">Crée un blueprint bêta depuis le Game Builder.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#F5C542]/15 bg-[#F5C542]/[0.06] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#F5C542]">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-sm font-semibold">Bêta responsable</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Les exports de jeux restent des plans de production. Les plateformes officielles doivent être utilisées pour tester, valider et publier.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <h2 className="text-2xl font-semibold">Game Template Registry</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gameTemplateRegistry.map((template) => {
            const Icon = template.icon;
            return (
              <Link key={template.id} to="/builder/game" className="rounded-[28px] border border-white/[0.08] bg-black/20 p-5 transition hover:-translate-y-1 hover:border-[#F5C542]/25">
                <Icon className="h-6 w-6 text-[#F5C542]" />
                <h3 className="mt-4 text-lg font-semibold">{template.name}</h3>
                <p className="mt-2 text-sm text-white/45">{template.platform} · {template.type}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </V2PageShell>
  );
};

export default Games;
