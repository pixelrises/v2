import { CheckCircle2, KeyRound, Route, ShieldCheck } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { aiModesConfig, aiProvidersConfig, defaultRoutingRules, pixelrisesAIProviderAdapter } from "@/modules/ai";

const statusTone: Record<string, string> = {
  configured: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  missing: "border-white/10 bg-white/[0.05] text-white/55",
  invalid: "border-red-400/20 bg-red-400/10 text-red-200",
  mock: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  disabled: "border-white/10 bg-black/20 text-white/35",
};

const Settings = () => {
  const providers = Object.values(aiProvidersConfig);
  const routingPreview = Object.values(defaultRoutingRules).slice(0, 8);
  const runtimeStatuses = [
    {
      label: "Vercel AI Gateway",
      status: "server-only",
      helper: "AI_GATEWAY_API_KEY reste uniquement cote Supabase Edge Function.",
    },
    {
      label: "Supabase",
      status: isSupabaseConfigured ? "configured" : "missing",
      helper: isSupabaseConfigured ? "Client public configure. Sauvegarde DB si session active." : "Fallback localStorage V2 actif.",
    },
    {
      label: "Site Builder",
      status: "real + fallback",
      helper: "Appelle ai-orchestrator, puis fallback mock si indisponible.",
    },
    {
      label: "Agent Builder",
      status: "real + fallback",
      helper: "Config agent normalisee avec permissions securisees.",
    },
    {
      label: "Game Builder",
      status: "beta",
      helper: "Blueprint, snippets, assets et checklist sans publication automatique.",
    },
  ];

  return (
    <V2PageShell
      title="Settings V2"
      description="Parametres de securite, isolation et Multi-IA. Les appels reels devront passer par un backend securise."
    >
      <SEOHead title="Settings | Pixelrises V2" description="Parametres Pixelrises V2." noIndex />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <ShieldCheck className="h-6 w-6 text-[#F5C542]" />
          <h2 className="mt-4 text-xl font-semibold">Isolation officielle</h2>
          <p className="mt-3 text-sm leading-7 text-white/58">
            Dossier V2 officiel : C:\Users\rkf\Desktop\pixelrises v2. Aucun fichier V1 ne doit etre modifie.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <KeyRound className="h-6 w-6 text-[#F5C542]" />
          <h2 className="mt-4 text-xl font-semibold">Pixelrises AI</h2>
          <Badge className={`mt-3 ${statusTone[pixelrisesAIProviderAdapter.status.mode] ?? statusTone.mock}`}>
            {pixelrisesAIProviderAdapter.status.mode}
          </Badge>
          <p className="mt-3 text-sm leading-7 text-white/58">{pixelrisesAIProviderAdapter.status.message}</p>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <CheckCircle2 className="h-6 w-6 text-[#F5C542]" />
          <h2 className="mt-4 text-xl font-semibold">Actions sensibles</h2>
          <p className="mt-3 text-sm leading-7 text-white/58">
            Publication, envoi, suppression, connexion outil et transmission de donnees restent sous validation utilisateur.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[34px] border border-[#F5C542]/15 bg-[#F5C542]/[0.045] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">AI Settings</p>
            <h2 className="mt-2 text-2xl font-semibold">Multi-IA Pixelrises</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
              Le routing est pret pour Vercel AI Gateway, Gemini, OpenAI, Claude, Cloud Design, Cloud Code, Mistral et Mock Provider.
              Les providers non configures restent en fallback mock pour eviter tout crash.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">Mock mode actif</Badge>
            <Badge className="border-white/10 bg-black/25 text-white/55 hover:bg-black/25">Gateway server-only</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => (
            <div key={provider.providerId} className="rounded-[24px] border border-white/[0.08] bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{provider.displayName}</h3>
                  <p className="mt-1 text-xs text-white/38">{provider.defaultModel}</p>
                </div>
                <Badge className={statusTone[provider.status] ?? statusTone.missing}>{provider.status}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/56">{provider.role}</p>
              <p className="mt-3 text-xs text-white/34">
                {provider.serverOnly ? "Backend requis pour appel reel" : "Execution locale autorisee en mock"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Mock vs réel</p>
          <h2 className="mt-2 text-2xl font-semibold">État runtime V2</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
            Cette vue ne montre jamais les clés. Elle indique seulement si Pixelrises peut appeler le backend et où le fallback reste actif.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {runtimeStatuses.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-white/[0.08] bg-black/25 p-4">
              <p className="text-sm font-semibold">{item.label}</p>
              <Badge className="mt-3 border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10">
                {item.status}
              </Badge>
              <p className="mt-3 text-xs leading-5 text-white/45">{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <Route className="h-6 w-6 text-[#F5C542]" />
          <h2 className="mt-4 text-xl font-semibold">Routing mode</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.values(aiModesConfig).map((mode) => (
              <Badge
                key={mode.mode}
                className={
                  mode.mode === "business"
                    ? "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/10"
                    : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.04]"
                }
              >
                {mode.label}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-white/56">
            Mode par defaut : business. Le mode avance pourra afficher le provider choisi sans exposer de secret.
          </p>
          <Button className="mt-5 rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            Tester connexion mock
          </Button>
        </div>

        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Apercu routing</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {routingPreview.map((rule) => (
              <div key={rule.taskType} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                <p className="text-sm font-semibold text-white/78">{rule.taskType}</p>
                <p className="mt-1 text-xs text-white/42">
                  {rule.provider} vers {rule.fallbackProvider}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </V2PageShell>
  );
};

export default Settings;
