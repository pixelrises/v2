import { BarChart3, LineChart, MousePointerClick, TrendingUp, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { analyticsMock } from "@/modules/registries";
import { readLocalV2Events } from "@/v2/analytics";

const Analytics = () => {
  const events = typeof window === "undefined" ? [] : readLocalV2Events();
  const stats = [
    { label: "Visites", value: analyticsMock.visits, icon: Users },
    { label: "Pages vues", value: analyticsMock.pageViews, icon: BarChart3 },
    { label: "Clics CTA", value: analyticsMock.ctaClicks, icon: MousePointerClick },
    { label: "Leads", value: analyticsMock.leads, icon: TrendingUp },
  ];

  return (
    <V2PageShell
      title="Analytics V2 préparés"
      description="Les métriques sont séparées des mocks et prêtes à accueillir un backend V2, Google Analytics ou Search Console plus tard."
    >
      <SEOHead title="Analytics | Pixelrises V2" description="Analytics préparés Pixelrises V2." noIndex />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
              <Icon className="h-5 w-5 text-[#F5C542]" />
              <p className="mt-4 text-sm text-white/46">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold">{stat.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <LineChart className="h-5 w-5 text-[#F5C542]" />
            <h2 className="text-2xl font-semibold">Progression</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="text-sm text-white/45">7 jours</p>
              <p className="mt-1 text-2xl font-semibold text-[#F5C542]">+{analyticsMock.sevenDayProgress}%</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="text-sm text-white/45">30 jours</p>
              <p className="mt-1 text-2xl font-semibold text-[#F5C542]">+{analyticsMock.thirtyDayProgress}%</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/52">
            Événements prévus : page_view, cta_click, form_submit, lead_created, checkout_start, publish_site, integration_connected, agent_created, game_created, generation_completed, project_improved.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">Événements locaux</h2>
          <div className="mt-5 space-y-2">
            {events.slice(0, 8).length > 0 ? (
              events.slice(0, 8).map((event, index) => (
                <div key={`${event.event}-${index}`} className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="mt-1 text-xs text-white/38">{new Date(event.createdAt).toLocaleString("fr-FR")}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/[0.12] bg-black/20 p-5 text-sm text-white/48">
                Aucun événement local pour le moment.
              </p>
            )}
          </div>
        </div>
      </section>
    </V2PageShell>
  );
};

export default Analytics;
