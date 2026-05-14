import { Link } from "react-router-dom";
import { ArrowRight, Bot, FolderKanban, Gamepad2, Globe2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataSourceLabel, EmptyState } from "@/components/ui/data-state";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { readStoredProjects } from "@/modules/storage/v2-storage";

const iconByType = {
  site: Globe2,
  agent: Bot,
  game: Gamepad2,
};

const Projects = () => {
  const projects = typeof window === "undefined" ? [] : readStoredProjects();

  return (
    <V2PageShell
      title="Projects"
      description="Tous les projets V2 sauvegardés localement : sites, agents IA et blueprints jeux."
      action={
        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Link to="/create">
            Créer un projet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <SEOHead title="Projects | Pixelrises V2" description="Projets Pixelrises V2." noIndex />

      <DataSourceLabel
        state={projects.length ? "mock" : "empty"}
        label={projects.length ? "Stockage local V2" : "Aucun projet réel"}
        description={
          projects.length
            ? "Ces projets viennent du stockage local de cet environnement. La synchronisation cloud reste à valider avant un lancement public complet."
            : "Aucun projet n'est encore disponible. Créez un site, un agent ou un blueprint de jeu pour remplir cette vue."
        }
        className="mb-5"
      />

      <section className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-5 w-5 text-[#F5C542]" />
          <h2 className="text-2xl font-semibold">Projets sauvegardés</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.length > 0 ? (
            projects.map((project) => {
              const Icon = iconByType[project.type];
              return (
                <article key={project.id} className="rounded-[28px] border border-white/[0.08] bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge className="border-white/[0.10] bg-white/[0.04] text-white/62">{project.status}</Badge>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{project.title}</h3>
                  <p className="mt-2 text-sm text-white/45">{project.type} · score {project.score}/100</p>
                  <p className="mt-2 text-xs text-white/35">{new Date(project.updatedAt).toLocaleString("fr-FR")}</p>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Aucun projet V2 sauvegardé"
              description="Utilisez un builder puis sauvegardez le projet. Tant qu'aucune donnée réelle n'existe, Pixelrises affiche un état vide clair au lieu de faux chiffres."
              action={
                <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                  <Link to="/create">Créer un projet</Link>
                </Button>
              }
              className="col-span-full"
            />
          )}
        </div>
      </section>
    </V2PageShell>
  );
};

export default Projects;
