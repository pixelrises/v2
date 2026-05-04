import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Monitor,
  Save,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { V2PageShell } from "@/components/v2/V2PageShell";
import {
  aiOrchestrator,
  pixelrisesAIProviderAdapter,
  runBackendAIOrchestrator,
  type BackendGenerationSource,
} from "@/modules/ai";
import {
  createMockSiteProject,
  validateSiteProject,
  type NormalizedSiteProject,
} from "@/modules/creation-engine";
import { projectStorageAdapter } from "@/modules/storage/project-storage-adapter";
import { trackV2Event } from "@/v2/analytics";

type Device = "desktop" | "tablet" | "mobile";
type MobilePanel = "brief" | "preview";

const deviceWidth: Record<Device, string> = {
  desktop: "w-full",
  tablet: "max-w-3xl",
  mobile: "max-w-sm",
};

const deviceOptions = [
  { key: "desktop", icon: Monitor },
  { key: "tablet", icon: Tablet },
  { key: "mobile", icon: Smartphone },
] satisfies { key: Device; icon: typeof Monitor }[];

const defaultSite = createMockSiteProject({
  businessName: "Atelier Nova",
  niche: "service local premium",
  city: "Lyon",
  goal: "generer des demandes de devis",
});

const promptPresets = [
  {
    label: "Restaurant",
    prompt:
      "Cree un site premium pour un restaurant a Lyon, avec menu, specialites, avis, reservation et localisation.",
    brief: {
      businessName: "Maison Riviera",
      niche: "Restaurant premium",
      city: "Lyon",
      goal: "Obtenir des reservations",
      targetAudience: "Clients locaux et visiteurs",
      offer: "Cuisine signature, reservation simple et experience chaleureuse.",
    },
  },
  {
    label: "Coach",
    prompt:
      "Cree une landing pour un coach sportif qui veut generer des rendez-vous et montrer des transformations clients.",
    brief: {
      businessName: "Pulse Coaching",
      niche: "Coach sportif",
      city: "Paris",
      goal: "Generer des rendez-vous",
      targetAudience: "Personnes actives qui veulent se remettre en forme",
      offer: "Coaching personnalise, bilan offert et suivi premium.",
    },
  },
  {
    label: "Service local",
    prompt:
      "Cree un site clair pour un service local premium avec demande de devis, preuves, zones desservies et contact rapide.",
    brief: {
      businessName: "Atelier Nova",
      niche: "Service local premium",
      city: "Lyon",
      goal: "Generer des demandes de devis",
      targetAudience: "Entrepreneurs et commercants",
      offer: "Audit, devis et accompagnement premium.",
    },
  },
  {
    label: "E-commerce",
    prompt:
      "Cree une page produit e-commerce orientee conversion avec benefices, garanties, avis, FAQ et CTA achat.",
    brief: {
      businessName: "Nova Goods",
      niche: "E-commerce produit",
      city: "France",
      goal: "Vendre des produits",
      targetAudience: "Acheteurs exigeants",
      offer: "Produit premium avec benefices clairs, garantie et livraison rapide.",
    },
  },
];

const SiteBuilder = () => {
  const [brief, setBrief] = useState({
    businessName: "Atelier Nova",
    niche: "Service local premium",
    city: "Lyon",
    goal: "Generer des demandes de devis",
    targetAudience: "Entrepreneurs et commercants",
    tier: "premium",
    style: "dark gold premium",
    offer: "Audit, devis et accompagnement premium.",
    freePrompt: "Cree une landing credible, claire et orientee conversion.",
  });
  const [mode, setMode] = useState<"plan" | "build" | "improve">("build");
  const [device, setDevice] = useState<Device>("desktop");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("brief");
  const [siteProject, setSiteProject] = useState<NormalizedSiteProject>(defaultSite);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<BackendGenerationSource | "frontend-mock">("frontend-mock");
  const [generationMessage, setGenerationMessage] = useState("Mode dev pret. Le backend est utilise si la fonction Supabase est disponible.");

  const quality = useMemo(() => validateSiteProject(siteProject), [siteProject]);

  const applyPreset = (preset: (typeof promptPresets)[number]) => {
    setBrief((current) => ({
      ...current,
      ...preset.brief,
      freePrompt: preset.prompt,
    }));
  };

  const generate = async () => {
    setIsGenerating(true);
    setGenerationMessage("Generation en cours via Pixelrises AI...");

    try {
      const backend = await runBackendAIOrchestrator({
        projectType: "site",
        mode: "build",
        prompt: brief.freePrompt.trim() || brief.offer,
        formData: brief,
      });
      const backendOutput = backend.normalizedOutput;

      if (backend.success && backendOutput && "pages" in backendOutput) {
        const next = backendOutput as NormalizedSiteProject;
        setSiteProject(next);
        setGenerationSource(backend.source ?? "real");
        setGenerationMessage(
          backend.source === "mock-fallback"
            ? "Backend appele, fallback mock utilise car la generation reelle est indisponible."
            : backend.persisted
              ? "Generation reelle terminee et sauvegardee dans Supabase."
              : "Generation terminee. Sauvegarde locale utilisee faute de session Supabase.",
        );

        await projectStorageAdapter.saveProject({
          id: next.meta.projectId,
          type: "site",
          title: next.meta.businessName,
          status: "generated",
          updatedAt: new Date().toISOString(),
          score: backend.qualityGateResult?.score ?? validateSiteProject(next).score,
          payload: next,
        });

        trackV2Event("generation_completed", {
          projectType: "site",
          businessName: next.meta.businessName,
          orchestrator: backend.source ?? "real",
          qualityScore: backend.qualityGateResult?.score,
          persisted: backend.persisted,
        });
      } else {
        const orchestrated = await aiOrchestrator.run({
          prompt: brief.freePrompt.trim() || brief.offer,
          projectType: "site",
          mode: "business",
          context: brief,
        });
        const next =
          orchestrated.projectType === "site" &&
          orchestrated.output &&
          "pages" in (orchestrated.output as NormalizedSiteProject)
            ? (orchestrated.output as NormalizedSiteProject)
            : await pixelrisesAIProviderAdapter.generateSite({
                ...brief,
                offer: brief.freePrompt.trim() || brief.offer,
              });

        setSiteProject(next);
        setGenerationSource("frontend-mock");
        setGenerationMessage("Fallback frontend utilise. Le backend n'a pas retourne de site exploitable.");
        trackV2Event("generation_completed", {
          projectType: "site",
          businessName: brief.businessName,
          orchestrator: "frontend-mock",
          qualityScore: orchestrated.quality.score,
        });
      }

      setMode("build");
      setMobilePanel("preview");
    } catch (error) {
      setGenerationSource("frontend-mock");
      setGenerationMessage(error instanceof Error ? error.message : "Generation indisponible, fallback local actif.");
      const fallback = await pixelrisesAIProviderAdapter.generateSite({
        ...brief,
        offer: brief.freePrompt.trim() || brief.offer,
      });
      setSiteProject(fallback);
      setMode("build");
      setMobilePanel("preview");
    } finally {
      setIsGenerating(false);
    }
  };

  const improve = () => {
    setSiteProject((current) => ({
      ...current,
      recommendations: [
        {
          priority: "high",
          title: "CTA renforce",
          description: "Le CTA principal a ete rendu plus direct pour ameliorer les demandes.",
          action: "Tester le nouveau CTA",
        },
        ...current.recommendations,
      ].slice(0, 4),
      strategy: {
        ...current.strategy,
        primaryCTA: "Demander mon audit",
      },
      pages: current.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) =>
          section.type === "hero"
            ? { ...section, cta: { label: "Demander mon audit", action: "#contact" } }
            : section,
        ),
      })),
    }));
    setMode("improve");
    setMobilePanel("preview");
    trackV2Event("project_improved", { projectType: "site" });
  };

  const save = async () => {
    const saved = await projectStorageAdapter.saveProject({
      id: siteProject.meta.projectId,
      type: "site",
      title: siteProject.meta.businessName,
      status: "generated",
      updatedAt: new Date().toISOString(),
      score: quality.score,
      payload: siteProject,
    });
    setGenerationMessage(
      saved.persisted ? "Projet sauvegarde dans Supabase." : "Projet sauvegarde en localStorage V2.",
    );
    trackV2Event("generation_completed", { saved: true, projectType: "site" });
  };

  return (
    <V2PageShell
      title="Site Builder V2"
      description="Prompt, analyse business, structure, site premium et amelioration ciblee. Ce builder est la base propre de la V2."
    >
      <SEOHead title="Site Builder V2 | Pixelrises" description="Site Builder V2 Pixelrises." noIndex />

      <div className="sticky top-2 z-20 mb-4 grid grid-cols-2 gap-1 rounded-[22px] border border-[#F5C542]/15 bg-[#080604]/90 p-1 shadow-[0_18px_70px_-52px_rgba(245,197,66,0.9)] backdrop-blur-xl xl:hidden">
        {[
          { key: "brief" as const, label: "Brief" },
          { key: "preview" as const, label: "Preview" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMobilePanel(item.key)}
            className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
              mobilePanel === item.key
                ? "bg-[#F5C542] text-black"
                : "text-white/58 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section
        data-testid="site-builder-split-layout"
        className="grid min-w-0 items-start gap-4 overflow-hidden sm:gap-5 xl:grid-cols-[clamp(300px,32vw,420px)_minmax(0,1fr)]"
      >
        <aside
          data-testid="site-builder-input-panel"
          className={`${mobilePanel === "brief" ? "block" : "hidden"} min-w-0 rounded-[24px] border border-[#F5C542]/20 bg-[#080604]/90 p-3 shadow-[0_28px_120px_-80px_rgba(245,197,66,0.95)] sm:rounded-[32px] sm:p-5 xl:sticky xl:top-6 xl:block xl:self-start`}
        >
          <div className="rounded-[22px] border border-[#F5C542]/15 bg-[radial-gradient(circle_at_top_left,rgba(245,197,66,0.14),transparent_36%),rgba(0,0,0,0.32)] p-3 shadow-[0_24px_90px_-70px_rgba(245,197,66,0.8)] sm:rounded-[28px] sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C542]/10 text-[#F5C542]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Pixelrises AI</p>
                  <p className="mt-1 text-xs text-white/45">Tape ton idee ici, la preview se met a jour.</p>
                  <h2 className="text-lg font-semibold">Decris ton site</h2>
                </div>
              </div>
              <Badge className="shrink-0 border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">{mode}</Badge>
            </div>

            <div className="mt-4 rounded-[20px] border border-white/[0.10] bg-black/45 p-3 sm:rounded-[24px]">
              <Textarea
                value={brief.freePrompt}
                onChange={(event) => setBrief({ ...brief, freePrompt: event.target.value })}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    void generate();
                  }
                }}
                placeholder="Exemple : Cree un site premium pour un barbershop a Marseille, avec tarifs, galerie, avis et bouton reservation..."
                className="min-h-[150px] resize-none border-0 bg-transparent px-1 text-[15px] leading-7 text-white shadow-none outline-none placeholder:text-white/32 focus-visible:ring-0 focus-visible:ring-offset-0 sm:min-h-[210px] sm:text-base"
              />

              <div className="mt-3 flex flex-col gap-3 border-t border-white/[0.08] pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  {promptPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/62 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={generate}
                  disabled={isGenerating}
                  className="w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766] disabled:opacity-70 sm:w-auto"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isGenerating ? "Generation..." : "Generer"}
                </Button>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-white/42">
              Astuce : Ctrl + Entree genere directement. Les parametres business restent en arriere-plan pour garder
              l'interface simple.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Contexte utilise</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[brief.businessName, brief.niche, brief.city, brief.goal].map((item) => (
                  <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/62">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button onClick={improve} variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
                <Sparkles className="h-4 w-4" />
                Ameliorer
              </Button>
              <Button onClick={() => void save()} variant="outline" className="rounded-2xl border-white/[0.10] bg-transparent text-white/80">
                <Save className="h-4 w-4" />
                Sauvegarder
              </Button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-sm font-semibold text-[#F5C542]">Quality Gate - {quality.score}/100</p>
            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Pipeline</p>
              <p className="mt-2 text-xs text-white/55">
                {generationSource === "real" ? "Backend reel" : generationSource === "mock-fallback" ? "Fallback backend" : "Mock frontend"}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/42">{generationMessage}</p>
            </div>
            <div className="mt-3 space-y-2">
              {quality.checks.map((check) => (
                <div key={check.id} className="flex gap-2 text-xs text-white/58">
                  <CheckCircle2 className={`h-4 w-4 ${check.passed ? "text-emerald-300" : "text-[#F5C542]"}`} />
                  <span>{check.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div
          data-testid="site-builder-preview-panel"
          className={`${mobilePanel === "preview" ? "block" : "hidden"} min-w-0 rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-3 sm:rounded-[32px] sm:p-5 xl:block`}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Preview live</p>
              <h2 className="mt-1 truncate text-lg font-semibold sm:text-xl">{siteProject.meta.businessName}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              {deviceOptions.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDevice(key)}
                  className={`flex items-center justify-center rounded-2xl border px-3 py-2 text-xs ${
                    device === key
                      ? "border-[#F5C542]/30 bg-[#F5C542]/10 text-[#F5C542]"
                      : "border-white/[0.08] bg-black/20 text-white/55"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className={`mx-auto max-w-full overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#080808] transition-all sm:rounded-[30px] ${deviceWidth[device]}`}>
            {siteProject.pages[0].sections.map((section, index) => (
              <section
                key={section.id}
                className={`p-4 sm:p-8 ${
                  index === 0 ? "bg-[radial-gradient(circle_at_top_left,rgba(245,197,66,0.18),transparent_34%)]" : ""
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">{section.type}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-4xl">{section.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{section.subtitle}</p>
                <p className="mt-3 text-sm leading-7 text-white/48">{section.content}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {section.items.map((item) => (
                    <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/62">
                      {item}
                    </span>
                  ))}
                </div>
                <Button className="mt-5 w-full rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766] sm:w-auto">
                  {section.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </section>
            ))}
          </div>
        </div>
      </section>
    </V2PageShell>
  );
};

export default SiteBuilder;
