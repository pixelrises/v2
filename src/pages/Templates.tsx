import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Gamepad2,
  GraduationCap,
  History,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataBadge, DataSourceLabel } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { cn } from "@/lib/utils";
import {
  getTemplateUseHref,
  pixelrisesTemplates,
  readTemplateUsageHistory,
  saveTemplateUsage,
  templateFilters,
  templateStatusLabel,
  templateTargetLabel,
  type PixelrisesTemplate,
  type TemplatePreviewLayoutType,
  type TemplateStatus,
  type TemplateUsageEntry,
} from "@/modules/templates/template-registry";

type ActiveFilter = (typeof templateFilters)[number];

const categoryIcons: Partial<Record<PixelrisesTemplate["category"], LucideIcon>> = {
  Business: BriefcaseBusiness,
  Student: GraduationCap,
  Agents: Bot,
  Content: FileText,
  Sites: Boxes,
  Apps: Layers3,
  Landings: Sparkles,
  Prototypes: Wand2,
  Games: Gamepad2,
  Automatisation: Workflow,
};

const statusClasses: Record<TemplateStatus, string> = {
  pret: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  beta: "border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]",
  "a-configurer": "border-white/10 bg-white/[0.04] text-white/52",
};

const filterMatchesTemplate = (filter: ActiveFilter, template: PixelrisesTemplate) => {
  if (filter === "Tous") return true;
  if (filter === "Pret") return template.status === "pret";
  if (filter === "Beta") return template.status === "beta";
  if (filter === "A configurer") return template.status === "a-configurer";
  if (filter === "Simple" || filter === "Avance") return template.level === filter;
  if (filter === "Premium" || filter === "Populaire" || filter === "Recommande") {
    return template.badges.includes(filter);
  }
  return template.category === filter;
};

const searchableText = (template: PixelrisesTemplate) =>
  [
    template.title,
    template.category,
    template.subCategory,
    template.command,
    template.shortDescription,
    template.longDescription,
    template.expectedOutput,
    templateTargetLabel[template.targetSpace],
    template.badges.join(" "),
  ]
    .join(" ")
    .toLowerCase();

const sortTemplates = (templates: PixelrisesTemplate[]) =>
  [...templates].sort((left, right) => {
    const statusRank = { pret: 0, beta: 1, "a-configurer": 2 };
    const leftBadgeRank = left.badges.includes("Recommande") ? 0 : left.badges.includes("Populaire") ? 1 : 2;
    const rightBadgeRank = right.badges.includes("Recommande") ? 0 : right.badges.includes("Populaire") ? 1 : 2;
    return (
      statusRank[left.status] - statusRank[right.status] ||
      leftBadgeRank - rightBadgeRank ||
      left.priority - right.priority
    );
  });

const TemplateCard = ({
  template,
  onPreview,
  onUse,
}: {
  template: PixelrisesTemplate;
  onPreview: (template: PixelrisesTemplate) => void;
  onUse: (template: PixelrisesTemplate) => void;
}) => {
  const Icon = categoryIcons[template.category] ?? Sparkles;

  return (
    <article className="group flex min-h-[292px] flex-col rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018))] p-4 shadow-[0_26px_90px_-70px_rgba(245,197,66,0.65)] transition duration-300 hover:-translate-y-1 hover:border-[#F5C542]/35 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge className={cn("border px-2.5 py-1 text-[11px]", statusClasses[template.status])}>
            {templateStatusLabel[template.status]}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/58">
            {template.level}
          </Badge>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F5C542]">
          {template.category} / {template.subCategory}
        </p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">{template.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/58">{template.shortDescription}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/55">
          {templateTargetLabel[template.targetSpace]}
        </span>
        {template.badges.slice(0, 2).map((badge) => (
          <span key={badge} className="rounded-full border border-[#F5C542]/15 bg-[#F5C542]/10 px-3 py-1 text-xs text-[#F5C542]">
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          aria-label={`Apercu ${template.title}`}
          onClick={() => onPreview(template)}
          className="rounded-2xl border-white/[0.12] bg-black/25 text-white/78"
        >
          Apercu
        </Button>
        <Button
          type="button"
          aria-label={`Utiliser ${template.title}`}
          onClick={() => onUse(template)}
          className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
        >
          Utiliser
        </Button>
      </div>
    </article>
  );
};

type PreviewTab = "apercu" | "structure" | "prompt" | "inputs" | "cout";

const previewTabs: Array<{ id: PreviewTab; label: string }> = [
  { id: "apercu", label: "Apercu" },
  { id: "structure", label: "Structure" },
  { id: "prompt", label: "Prompt" },
  { id: "inputs", label: "Inputs" },
  { id: "cout", label: "Cout / limites" },
];

const visualShellClasses: Record<TemplatePreviewLayoutType, string> = {
  landing: "from-[#120f05] via-black to-[#070707]",
  workspace: "from-[#081012] via-black to-[#090909]",
  "student-sheet": "from-[#101018] via-black to-[#070707]",
  "agent-card": "from-[#061015] via-black to-[#080808]",
  "content-plan": "from-[#140c12] via-black to-[#070707]",
  "game-plan": "from-[#0b1017] via-black to-[#070707]",
  "automation-flow": "from-[#0f1008] via-black to-[#070707]",
};

const MiniPill = ({ children }: { children: string }) => (
  <span className="rounded-full border border-[#F5C542]/18 bg-[#F5C542]/10 px-3 py-1 text-[11px] font-semibold text-[#F5C542]">
    {children}
  </span>
);

const LandingVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const spec = template.previewSpec;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#F5C542]/18 bg-black shadow-[0_32px_120px_-80px_rgba(245,197,66,0.85)]">
      <div className="border-b border-white/[0.08] bg-white/[0.035] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-black/40 px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-[#F5C542]" />
            Mini navbar
          </div>
          <div className="flex gap-2 text-[11px] text-white/45">
            <span>Offre</span>
            <span>Preuves</span>
            <span>FAQ</span>
          </div>
        </div>
      </div>
      <div className="bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.22),transparent_46%),linear-gradient(160deg,#0b0b0b,#020202)] p-4 sm:p-6">
        <MiniPill>{spec.heroBadge}</MiniPill>
        <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">{spec.sampleTitle}</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">{spec.sampleSubtitle}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-2xl bg-[#F5C542] px-5 py-3 text-sm font-bold text-black">{spec.sampleCTA}</span>
          {spec.sampleSecondaryCTA ? (
            <span className="rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/78">
              {spec.sampleSecondaryCTA}
            </span>
          ) : null}
        </div>
        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Bloc preuve sociale</p>
          <p className="mt-2 text-sm text-white/58">Preuves verifiables, avis a confirmer et resultat attendu clairement indique.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {spec.cards.slice(0, 3).map((card) => (
            <div key={card.title} className="rounded-2xl border border-white/[0.08] bg-black/42 p-4">
              <p className="text-sm font-semibold text-white">{card.title}</p>
              <p className="mt-2 text-xs leading-5 text-white/50">{card.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#F5C542]/18 bg-[#F5C542]/[0.07] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Section offre</p>
            <p className="mt-2 text-lg font-semibold text-white">Promesse, benefices, objections et CTA final.</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/42 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Mini FAQ</p>
            <p className="mt-2 text-sm text-white/58">{spec.faq[0]?.question}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkspaceVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const spec = template.previewSpec;

  return (
    <div className="rounded-[28px] border border-white/[0.10] bg-[#050505] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <MiniPill>{spec.heroBadge}</MiniPill>
          <h3 className="mt-3 text-2xl font-semibold text-white">{spec.sampleTitle}</h3>
          <p className="mt-2 text-sm text-white/55">{spec.sampleSubtitle}</p>
        </div>
        <span className="rounded-2xl bg-[#F5C542] px-4 py-2 text-sm font-bold text-black">Preview template</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
        <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-black/38 p-3">
          {["Dashboard", "Workflow", "Donnees", "Validation"].map((item, index) => (
            <div key={item} className={cn("rounded-xl px-3 py-2 text-sm", index === 0 ? "bg-[#F5C542] text-black" : "bg-white/[0.04] text-white/58")}>
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {spec.cards.slice(0, 3).map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#F5C542]">{card.title}</p>
                <p className="mt-2 text-sm text-white/60">{card.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-[#F5C542]/18 bg-[#F5C542]/[0.06] p-4">
            <p className="text-sm font-semibold text-white">Workflow simple</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {spec.steps.slice(0, 4).map((step, index) => (
                <div key={step} className="rounded-xl border border-white/[0.08] bg-black/35 p-3 text-xs text-white/58">
                  <span className="text-[#F5C542]">0{index + 1}</span> {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const spec = template.previewSpec;

  return (
    <div className="rounded-[28px] border border-white/[0.10] bg-[#060608] p-4 sm:p-5">
      <MiniPill>{spec.heroBadge}</MiniPill>
      <h3 className="mt-4 text-3xl font-semibold text-white">{spec.sampleTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{spec.sampleSubtitle}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {spec.cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">{card.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/52">{card.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-[#F5C542]/18 bg-[#F5C542]/[0.06] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Mini quiz final</p>
        <p className="mt-2 text-sm text-white/60">Question de verification, correction courte et notion a revoir.</p>
      </div>
    </div>
  );
};

const AgentVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const spec = template.previewSpec;

  return (
    <div className="rounded-[28px] border border-white/[0.10] bg-[#050809] p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-3xl border border-[#F5C542]/18 bg-[#F5C542]/[0.06] p-5">
          <div className="flex flex-wrap gap-2">
            <MiniPill>{spec.heroBadge}</MiniPill>
            <MiniPill>{spec.statusLabel}</MiniPill>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F5C542] text-black">
              <Bot className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">{spec.sampleTitle}</h3>
              <p className="mt-1 text-sm text-white/52">{spec.sampleSubtitle}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {spec.cards.slice(0, 4).map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/[0.08] bg-black/35 p-3">
                <p className="text-sm font-semibold text-white">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/50">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/[0.08] bg-black/35 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Test local</p>
          <div className="mt-4 rounded-2xl bg-[#181421] p-4 text-sm text-white/72">
            Analyse mon projet et propose 5 ameliorations prioritaires.
          </div>
          <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm leading-6 text-white/55">
            Reponse exemple : priorites, risques, plan d'action et validation humaine avant execution.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Action validable", "Permissions controlees", "Aucun envoi"].map((item) => (
              <MiniPill key={item}>{item}</MiniPill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const spec = template.previewSpec;

  return (
    <div className="rounded-[28px] border border-white/[0.10] bg-[#080506] p-4 sm:p-5">
      <MiniPill>Creator AI bientot</MiniPill>
      <h3 className="mt-4 text-3xl font-semibold text-white">{spec.sampleTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{spec.sampleSubtitle}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {spec.cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">{card.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/52">{card.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-[#F5C542]/18 bg-[#F5C542]/[0.06] p-4">
        <p className="text-sm font-semibold text-white">Calendrier de contenu</p>
        <p className="mt-2 text-sm text-white/55">Jour 1 : hook. Jour 2 : carrousel. Jour 3 : relance douce. Tout reste en brouillon.</p>
      </div>
    </div>
  );
};

const GameVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const spec = template.previewSpec;

  return (
    <div className="rounded-[28px] border border-white/[0.10] bg-[#05070b] p-4 sm:p-5">
      <MiniPill>{spec.statusLabel}</MiniPill>
      <h3 className="mt-4 text-3xl font-semibold text-white">{spec.sampleTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{spec.sampleSubtitle}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {spec.cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">{card.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/52">{card.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {spec.steps.map((step, index) => (
          <div key={step} className="rounded-xl border border-[#F5C542]/14 bg-[#F5C542]/[0.055] p-3 text-xs text-white/62">
            <span className="font-bold text-[#F5C542]">{index + 1}.</span> {step}
          </div>
        ))}
      </div>
    </div>
  );
};

const AutomationVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const spec = template.previewSpec;

  return (
    <div className="rounded-[28px] border border-white/[0.10] bg-[#070704] p-4 sm:p-5">
      <MiniPill>{spec.heroBadge}</MiniPill>
      <h3 className="mt-4 text-3xl font-semibold text-white">{spec.sampleTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{spec.sampleSubtitle}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {spec.steps.map((step, index) => (
          <div key={step} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-[#F5C542]">0{index + 1}</p>
            <p className="mt-2 text-sm font-semibold text-white">{step}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl border border-[#F5C542]/18 bg-[#F5C542]/[0.06] p-4 text-sm text-white/58">
        Aucune action externe live : le workflow reste un modele dry-run jusqu'a validation.
      </p>
    </div>
  );
};

const TemplateVisualPreview = ({ template }: { template: PixelrisesTemplate }) => {
  const layout = template.previewSpec.layoutType;

  return (
    <div className={cn("rounded-[32px] bg-gradient-to-br p-2", visualShellClasses[layout])}>
      {layout === "landing" ? <LandingVisualPreview template={template} /> : null}
      {layout === "workspace" ? <WorkspaceVisualPreview template={template} /> : null}
      {layout === "student-sheet" ? <StudentVisualPreview template={template} /> : null}
      {layout === "agent-card" ? <AgentVisualPreview template={template} /> : null}
      {layout === "content-plan" ? <ContentVisualPreview template={template} /> : null}
      {layout === "game-plan" ? <GameVisualPreview template={template} /> : null}
      {layout === "automation-flow" ? <AutomationVisualPreview template={template} /> : null}
    </div>
  );
};

const TemplatePreview = ({
  template,
  onClose,
  onUse,
}: {
  template: PixelrisesTemplate;
  onClose: () => void;
  onUse: (template: PixelrisesTemplate) => void;
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("apercu");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/78 px-0 backdrop-blur-xl sm:items-center sm:px-4">
      <aside className="max-h-[92vh] w-full overflow-y-auto rounded-t-[34px] border border-white/[0.10] bg-[#070707] p-4 shadow-[0_40px_160px_-70px_rgba(245,197,66,0.9)] sm:max-w-6xl sm:rounded-[34px] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5C542]">
            Preview template / {template.category}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{template.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">{template.longDescription}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] text-white/62 transition hover:border-[#F5C542]/30 hover:text-[#F5C542]"
          aria-label="Fermer la preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <DataBadge state={template.status === "beta" ? "pending" : "example"} label={templateStatusLabel[template.status]} />
        <DataBadge state="example" label={templateTargetLabel[template.targetSpace]} />
        <DataBadge state="example" label={template.previewSpec.statusLabel} />
        {template.targetSpace === "creator-soon" ? <DataBadge state="pending" label="Creator AI bientot" /> : null}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/35 p-2 [scrollbar-width:none]">
        {previewTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition",
              activeTab === tab.id ? "bg-[#F5C542] text-black" : "text-white/58 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-5">
          {activeTab === "apercu" ? (
            <>
              <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.025] p-3 sm:p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Apercu du template</p>
                    <p className="mt-1 text-sm text-white/50">Exemple visuel reutilisable, pas un livrable final publie.</p>
                  </div>
                  <MiniPill>{template.previewSpec.layoutType}</MiniPill>
                </div>
                <TemplateVisualPreview template={template} />
              </section>

              <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Resultat attendu</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{template.previewSpec.exampleOutput}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.previewSpec.visualBlocks.map((block) => (
                    <span key={block} className="rounded-full border border-white/[0.08] bg-black/30 px-3 py-1.5 text-xs text-white/55">
                      {block}
                    </span>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "structure" ? (
            <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Structure du livrable</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {template.structure.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/30 p-3 text-sm text-white/65">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5C542] text-xs font-bold text-black">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {template.previewSpec.sections.map((section) => (
                  <div key={section} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-sm text-white/56">
                    {section}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "prompt" ? (
            <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Prompt pre-rempli</h3>
              <p className="mt-2 text-sm text-white/48">Disponible pour reprendre le modele dans le bon espace. Il ne lance aucune generation tout seul.</p>
              <pre className="mt-4 max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/[0.08] bg-black/55 p-4 text-sm leading-7 text-white/68">
                {template.prefilledPrompt}
              </pre>
            </section>
          ) : null}

          {activeTab === "inputs" ? (
            <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Inputs necessaires</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {template.requiredInputs.map((input) => (
                  <span key={input} className="rounded-full border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white/62">
                    {input}
                  </span>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[#F5C542]/18 bg-[#F5C542]/[0.055] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Resultat attendu</h3>
                <p className="mt-3 text-sm leading-7 text-white/58">{template.expectedOutput}</p>
              </div>
            </section>
          ) : null}

          {activeTab === "cout" ? (
            <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Cout estime et limites honnetes</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-black/28 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Cout estime</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{template.estimatedCost} credits</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-black/28 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Type preview</p>
                  <p className="mt-1 text-lg font-semibold text-white">{template.previewType}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {template.safetyNotes.map((note) => (
                  <div key={note} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-sm leading-6 text-white/58">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                    {note}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-[26px] border border-[#F5C542]/18 bg-[#F5C542]/[0.055] p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#F5C542]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.20em] text-[#F5C542]">Mode recommande</p>
                <p className="mt-1 text-lg font-semibold text-white">{template.suggestedMode === "plan" ? "Plan d'abord" : "Direct controle"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-black/28 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Ce que tu reprends</p>
                <p className="mt-1 text-sm font-semibold text-white">{template.previewSpec.statusLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/28 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Cout estime</p>
                <p className="mt-1 text-2xl font-semibold text-white">{template.estimatedCost} credits</p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F5C542]">Limites honnetes</h3>
            <div className="mt-4 space-y-3">
              {template.safetyNotes.map((note) => (
                <div key={note} className="flex gap-3 text-sm leading-6 text-white/58">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C542]" />
                  {note}
                </div>
              ))}
            </div>
          </div>

          <Button type="button" onClick={() => onUse(template)} className="sticky bottom-4 h-14 w-full rounded-2xl bg-[#F5C542] text-base font-semibold text-black hover:bg-[#FFD766] lg:static">
            Utiliser ce template
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-xs leading-5 text-white/40">
            Aucun credit n'est debite au simple apercu ou a l'ouverture du brouillon.
          </p>
        </div>
      </div>
      </aside>
    </div>
  );
};

const UsageHistory = ({ history }: { history: TemplateUsageEntry[] }) => (
  <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
    <div className="flex items-center gap-3">
      <History className="h-5 w-5 text-[#F5C542]" />
      <div>
        <h2 className="font-semibold text-white">Historique local templates</h2>
        <p className="mt-1 text-sm text-white/45">Visible uniquement dans ce navigateur. Cloud non marque comme branche.</p>
      </div>
    </div>
    {history.length ? (
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {history.slice(0, 4).map((entry) => (
          <div key={`${entry.templateId}-${entry.usedAt}`} className="rounded-2xl border border-white/[0.08] bg-black/28 p-3">
            <p className="text-sm font-semibold text-white">{entry.title}</p>
            <p className="mt-1 text-xs text-white/42">{templateTargetLabel[entry.targetSpace]}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="mt-4 rounded-2xl border border-white/[0.08] bg-black/28 p-4 text-sm text-white/48">
        Aucun template utilise pour le moment.
      </p>
    )}
  </section>
);

const Templates = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("Tous");
  const [selectedTemplate, setSelectedTemplate] = useState<PixelrisesTemplate | null>(null);
  const [usageHistory, setUsageHistory] = useState<TemplateUsageEntry[]>(() => readTemplateUsageHistory());

  const filteredTemplates = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return sortTemplates(
      pixelrisesTemplates.filter((template) => {
        const matchesFilter = filterMatchesTemplate(activeFilter, template);
        const matchesQuery = !cleanQuery || searchableText(template).includes(cleanQuery);
        return matchesFilter && matchesQuery;
      }),
    );
  }, [activeFilter, query]);

  const stats = useMemo(
    () => ({
      total: pixelrisesTemplates.length,
      ready: pixelrisesTemplates.filter((template) => template.status === "pret").length,
      business: pixelrisesTemplates.filter((template) => template.targetSpace === "business").length,
      student: pixelrisesTemplates.filter((template) => template.targetSpace === "student").length,
      agents: pixelrisesTemplates.filter((template) => template.targetSpace === "agent-studio").length,
    }),
    [],
  );

  const handleUseTemplate = (template: PixelrisesTemplate) => {
    setUsageHistory(saveTemplateUsage(template));
    navigate(getTemplateUseHref(template));
  };

  return (
    <V2PageShell
      eyebrow="Templates"
      title="Une bibliotheque premium pour demarrer plus vite"
      description="Choisis un exemple solide, verifie la preview, puis ouvre le bon espace Pixelrises avec le brief deja prepare."
    >
      <SEOHead title="Templates V2 | Pixelrises" description="Bibliotheque de templates Pixelrises V2." noIndex />

      <DataSourceLabel
        state="example"
        label="Bibliotheque de brouillons"
        description="Les templates preparent un prompt et une direction. Rien n'est publie, exporte, envoye ou debite sans generation reelle reussie."
        className="mb-6"
      />

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Templates", stats.total, Boxes],
          ["Prets", stats.ready, CheckCircle2],
          ["Business", stats.business, BriefcaseBusiness],
          ["Student + Agents", stats.student + stats.agents, GraduationCap],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as LucideIcon;
          return (
            <div key={String(label)} className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
              <StatIcon className="h-5 w-5 text-[#F5C542]" />
              <p className="mt-4 text-3xl font-semibold text-white">{String(value)}</p>
              <p className="mt-1 text-sm text-white/48">{String(label)}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-[30px] border border-white/[0.08] bg-[#070707]/88 p-4 shadow-[0_34px_110px_-78px_rgba(245,197,66,0.75)] sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-center">
          <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/[0.10] bg-black/40 px-4">
            <Search className="h-5 w-5 text-white/42" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par objectif, espace, resultat attendu..."
              className="h-12 border-0 bg-transparent px-0 text-white shadow-none placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#F5C542]/14 bg-[#F5C542]/[0.055] p-3 text-sm text-white/58">
            <Clock3 className="h-4 w-4 shrink-0 text-[#F5C542]" />
            Classement : prets, recommandes, puis priorite produit.
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {templateFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
                activeFilter === filter
                  ? "border-[#F5C542] bg-[#F5C542] text-black"
                  : "border-white/[0.10] bg-white/[0.035] text-white/58 hover:border-[#F5C542]/30 hover:text-white",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.templateId}
            template={template}
            onPreview={setSelectedTemplate}
            onUse={handleUseTemplate}
          />
        ))}
      </section>

      {!filteredTemplates.length ? (
        <div className="mt-6 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[#F5C542]" />
          <h2 className="mt-4 text-xl font-semibold text-white">Aucun template trouve.</h2>
          <p className="mt-2 text-sm text-white/48">Essaie une autre recherche ou reviens au filtre Tous.</p>
        </div>
      ) : null}

      <div className="mt-6">
        <UsageHistory history={usageHistory} />
      </div>

      <section className="mt-6 rounded-[30px] border border-[#F5C542]/16 bg-[#F5C542]/[0.045] p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Regles Pixelrises</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Templates = exemples exploitables, pas faux livrables.</h2>
            <p className="mt-2 text-sm leading-6 text-white/58">
              Le Core garde la separation : Business AI, Student AI et Agent Studio executent ou preparent. Templates sert a choisir vite.
            </p>
          </div>
          {["Pas de faux succes", "Pas de debit au clic", "Creator AI bientot"].map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm text-white/64">
              <ShieldCheck className="h-4 w-4 text-[#F5C542]" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {selectedTemplate ? (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={handleUseTemplate}
        />
      ) : null}
    </V2PageShell>
  );
};

export default Templates;
