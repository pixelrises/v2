import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getReadableErrorMessage, reportFrontendError } from "@/lib/monitoring";
import type { PaymentReturnIntent } from "@/lib/payment-return-intent";
import {
  isAllowedCustomDomainHostname,
  resolvePublishedSiteUrl,
} from "@/lib/published-site";
import { PUBLIC_ENV } from "@/lib/public-env";
import { sanitizeTextDeep } from "@/lib/text-sanitize";

export interface ManagedSite {
  id: string;
  business_name: string;
  business_type: string | null;
  city: string | null;
  status: string;
  slug: string | null;
  custom_domain: string | null;
  domain_status: string;
  version: number;
  created_at: string;
}

type Tab = "details" | "edit" | "improve" | "publish" | "domain";

interface SiteContent {
  heroTitle?: string;
  heroSubtitle?: string;
  problemTitle?: string;
  problemContent?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButton?: string;
  services?: { name: string; description: string }[];
  testimonials?: { name: string; role: string; text: string }[];
  faqItems?: { question: string; answer: string }[];
  [key: string]: unknown;
}

interface Props {
  site: ManagedSite;
  credits: number;
  initialTab: Tab;
  onClose: () => void;
  onUpdated: (site: Partial<ManagedSite> & { id: string }) => void;
  onCreditsChange: (newCredits: number) => void;
  onOpenCredits: (
    focus?: "packs" | "subscriptions",
    returnIntent?: Omit<PaymentReturnIntent, "createdAt">,
  ) => void;
}

const ACTIVATION_CREDIT_THRESHOLD = 3;
const IMPROVE_COST = 5;
const IMPROVEMENT_TIMEOUT_MS = 45000;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const buildSeoSlug = (businessName: string, businessType?: string | null, city?: string | null) => {
  const seoBase = [businessType, city].map((value) => value?.trim()).filter(Boolean).join(" ");
  return slugify(seoBase || businessName);
};

const parseList = (value: string) =>
  value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

const stringifyPairs = (
  items: Array<{ a: string; b: string; c?: string }> | undefined,
  includeThird = false,
) =>
  (items || [])
    .map((item) =>
      includeThird
        ? `${item.a} | ${item.b} | ${item.c || ""}`.trim()
        : `${item.a} | ${item.b}`.trim(),
    )
    .join("\n");

const SiteManager = ({
  site,
  credits,
  initialTab = "details",
  onClose,
  onUpdated,
  onCreditsChange,
  onOpenCredits,
}: Props) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [name, setName] = useState(site.business_name);
  const [city, setCity] = useState(site.city || "");
  const [type, setType] = useState(site.business_type || "");
  const [improvePrompt, setImprovePrompt] = useState("");
  const [slug, setSlug] = useState(
    site.slug || buildSeoSlug(site.business_name, site.business_type, site.city),
  );
  const [domain, setDomain] = useState(site.custom_domain || "");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [problemTitle, setProblemTitle] = useState("");
  const [problemContent, setProblemContent] = useState("");
  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaSubtitle, setCtaSubtitle] = useState("");
  const [ctaButton, setCtaButton] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [testimonialsText, setTestimonialsText] = useState("");
  const [faqText, setFaqText] = useState("");

  const isPublished = site.status === "published";
  const hasActivationCredits = isPublished || credits >= ACTIVATION_CREDIT_THRESHOLD;
  const publicUrl = isPublished
    ? resolvePublishedSiteUrl({
        slug: site.slug,
        customDomain: site.custom_domain,
        domainStatus: site.domain_status,
      })
    : null;

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!busy) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "Une action Pixelrises est en cours. Si vous quittez maintenant, vous devrez la relancer.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [busy]);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      setLoadingContent(true);
      const { data, error } = await supabase
        .from("generated_sites")
        .select("generated_content, content_json")
        .eq("id", site.id)
        .single();

      setLoadingContent(false);

      if (!active) return;

      if (error) {
        toast({
          title: "Chargement impossible",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const nextContent = sanitizeTextDeep(
        ((data?.content_json ?? data?.generated_content ?? {}) as SiteContent) || {},
      );
      setContent(nextContent);
      setHeroTitle(String(nextContent.heroTitle || ""));
      setHeroSubtitle(String(nextContent.heroSubtitle || ""));
      setProblemTitle(String(nextContent.problemTitle || ""));
      setProblemContent(String(nextContent.problemContent || ""));
      setCtaTitle(String(nextContent.ctaTitle || ""));
      setCtaSubtitle(String(nextContent.ctaSubtitle || ""));
      setCtaButton(String(nextContent.ctaButton || ""));
      setServicesText(
        stringifyPairs(
          (nextContent.services as { name: string; description: string }[] | undefined)?.map((item) => ({
            a: item.name || "",
            b: item.description || "",
          })),
        ),
      );
      setTestimonialsText(
        stringifyPairs(
          (nextContent.testimonials as { name: string; role: string; text: string }[] | undefined)?.map((item) => ({
            a: item.name || "",
            b: item.role || "",
            c: item.text || "",
          })),
          true,
        ),
      );
      setFaqText(
        stringifyPairs(
          (nextContent.faqItems as { question: string; answer: string }[] | undefined)?.map((item) => ({
            a: item.question || "",
            b: item.answer || "",
          })),
        ),
      );
    };

    void loadContent();

    return () => {
      active = false;
    };
  }, [site.id]);

  const domainStatus = useMemo(() => {
    if (site.domain_status === "connected") {
      return {
        label: "Connecté",
        cls: "bg-green-500/10 text-green-400 border-green-500/20",
      };
    }
    if (site.domain_status === "pending") {
      return {
        label: "En attente DNS",
        cls: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      };
    }
    if (site.domain_status === "error") {
      return {
        label: "Erreur",
        cls: "bg-destructive/10 text-destructive border-destructive/20",
      };
    }
    return {
      label: "Non connecté",
      cls: "bg-muted text-muted-foreground border-border",
    };
  }, [site.domain_status]);

  const requestActivation = (intent: PaymentReturnIntent["intent"] = "publish") => {
    toast({
      title: "Ton site est prêt",
      description: "Active-le pour le mettre en ligne.",
    });
    onOpenCredits(intent === "subscription" ? "subscriptions" : "packs", {
      siteId: site.id,
      intent,
      returnPath: `/dashboard?tab=sites&manage=${site.id}&managerTab=publish`,
    });
  };

  const saveDetails = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("generated_sites")
      .update({ business_name: name, city, business_type: type })
      .eq("id", site.id);
    setBusy(false);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onUpdated({ id: site.id, business_name: name, city, business_type: type });
    toast({ title: "Détails enregistrés" });
  };

  const saveManualEdit = async () => {
    if (!content) return;

    const manualContent: SiteContent = {
      ...content,
      heroTitle: heroTitle.trim(),
      heroSubtitle: heroSubtitle.trim(),
      problemTitle: problemTitle.trim(),
      problemContent: problemContent.trim(),
      ctaTitle: ctaTitle.trim(),
      ctaSubtitle: ctaSubtitle.trim(),
      ctaButton: ctaButton.trim(),
      services: parseList(servicesText).map((line) => {
        const [namePart, descriptionPart] = line.split("|").map((entry) => entry.trim());
        return {
          name: namePart || "Service",
          description: descriptionPart || "Description à compléter.",
        };
      }),
      testimonials: parseList(testimonialsText).map((line, index) => {
        const [namePart, rolePart, textPart] = line.split("|").map((entry) => entry.trim());
        return {
          name: namePart || `Client ${index + 1}`,
          role: rolePart || "Client",
          text: textPart || "Témoignage à compléter.",
        };
      }),
      faqItems: parseList(faqText).map((line) => {
        const [questionPart, answerPart] = line.split("|").map((entry) => entry.trim());
        return {
          question: questionPart || "Question",
          answer: answerPart || "Réponse à compléter.",
        };
      }),
    };

    setBusy(true);
    const { error } = await supabase
      .from("generated_sites")
      .update({
        generated_content: manualContent,
        content_json: manualContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", site.id);
    setBusy(false);

    if (error) {
      toast({
        title: "Enregistrement impossible",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setContent(manualContent);
    toast({
      title: "Contenu mis à jour",
      description: "Le site généré peut maintenant être modifié manuellement.",
    });
  };

  const improveWithAI = async () => {
    if (!improvePrompt.trim()) {
      toast({
        title: "Décris ton amélioration",
        description: "Explique brièvement ce que tu veux changer.",
        variant: "destructive",
      });
      return;
    }

    if (credits < IMPROVE_COST) {
      onOpenCredits();
      toast({
        title: "Crédits insuffisants",
        description: `Il vous faut ${IMPROVE_COST} crédits.`,
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), IMPROVEMENT_TIMEOUT_MS);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${PUBLIC_ENV.supabaseUrl}/functions/v1/generate-site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: PUBLIC_ENV.supabasePublishableKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          form: {
            businessName: name,
            businessType: type,
            city,
            services: "",
            style: "Premium",
            colors: "Auto",
            objective: "Attirer des clients",
            cta: ctaButton || "Prendre rendez-vous",
            description: "",
            regenerate: true,
            improvementPrompt: improvePrompt.trim(),
            siteId: site.id,
            currentVersion: site.version,
          },
        }),
      });

      window.clearTimeout(timeoutId);
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 402) onOpenCredits();
        throw new Error(payload.error || "Erreur de génération");
      }

      onCreditsChange(payload.credits ?? Math.max(credits - IMPROVE_COST, 0));
      onUpdated({ id: site.id, version: site.version + 1 });
      setContent(payload.content ? sanitizeTextDeep(payload.content as SiteContent) : null);
      setImprovePrompt("");
      setBusy(false);
      toast({
        title: "Site amélioré",
        description: `${payload.creditCost || IMPROVE_COST} crédits utilisés.`,
      });
      navigate(`/preview/${site.id}`);
    } catch (error: unknown) {
      window.clearTimeout(timeoutId);
      reportFrontendError(
        "improve-site",
        error,
        {
          siteId: site.id,
          businessName: name,
        },
        "L'optimisation du site a échoué.",
      );
      setBusy(false);
      const description =
        error instanceof DOMException && error.name === "AbortError"
          ? "L'optimisation a pris trop de temps. Aucun crédit n'a été débité et vous pouvez réessayer."
          : getReadableErrorMessage(
              error,
              "Une erreur est survenue pendant l'optimisation. Aucun crédit n'a été débité.",
            );
      toast({
        title: "Erreur",
        description,
        variant: "destructive",
      });
    }
  };

  const publish = async () => {
    if (!hasActivationCredits) {
      requestActivation("publish");
      return;
    }

    if (!slug.trim()) {
      toast({
        title: "Slug requis",
        description: "Choisis une URL pour ton site.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    const cleanSlug = slugify(slug);
    const { error } = await supabase
      .from("generated_sites")
      .update({
        status: "published",
        slug: cleanSlug,
        published_at: new Date().toISOString(),
      })
      .eq("id", site.id);
    setBusy(false);

    if (error) {
      const message = /unique/i.test(error.message)
        ? "Cette URL est déjà utilisée. Choisis-en une autre."
        : error.message;
      toast({ title: "Erreur", description: message, variant: "destructive" });
      return;
    }

    onUpdated({ id: site.id, status: "published", slug: cleanSlug });
    toast({
      title: "Site publié",
      description: "Le site est maintenant accessible via son lien public Pixelrises.",
    });
  };

  const unpublish = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("generated_sites")
      .update({ status: "draft" })
      .eq("id", site.id);
    setBusy(false);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onUpdated({ id: site.id, status: "draft" });
    toast({
      title: "Site dépublié",
      description: "Le site n'est plus accessible publiquement.",
    });
  };

  const saveDomain = async () => {
    if (!hasActivationCredits) {
      requestActivation("publish");
      return;
    }

    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");

    if (cleanDomain && !isAllowedCustomDomainHostname(cleanDomain)) {
      toast({
        title: "Domaine non accepté",
        description:
          "Ajoute un vrai domaine client. Les URLs techniques de type Vercel, Supabase ou localhost ne sont pas autorisées ici.",
        variant: "destructive",
      });
      return;
    }
    const newStatus = cleanDomain ? "pending" : "none";

    setBusy(true);
    const { error } = await supabase
      .from("generated_sites")
      .update({
        custom_domain: cleanDomain || null,
        domain_status: newStatus,
      })
      .eq("id", site.id);
    setBusy(false);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onUpdated({
      id: site.id,
      custom_domain: cleanDomain || null,
      domain_status: newStatus,
    });
    toast({
      title: cleanDomain ? "Domaine enregistré" : "Domaine retiré",
      description: cleanDomain
        ? "Le domaine est enregistré. Il faudra maintenant pointer les DNS vers Pixelrises."
        : undefined,
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Détails" },
    { key: "edit", label: "Éditer" },
    { key: "improve", label: "Optimiser" },
    { key: "publish", label: "Publication" },
    { key: "domain", label: "Domaine" },
  ];

  const connectedDomainLabel = publicUrl;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Gérer le site
          </p>
          <DialogTitle className="truncate text-xl font-bold">
            {site.business_name}
          </DialogTitle>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                isPublished
                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {isPublished ? "Publié" : "Brouillon"}
            </span>
            <span className="text-[10px] text-muted-foreground">v{site.version}</span>
          </div>
          <div className="mt-5 flex gap-1 overflow-x-auto">
            {tabs.map((entry) => (
              <button
                key={entry.key}
                onClick={() => setTab(entry.key)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  tab === entry.key
                    ? "border border-primary/20 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "details" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Nom du business
                  </Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Type d'activité
                  </Label>
                  <Input value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Ville
                  </Label>
                  <Input value={city} onChange={(event) => setCity(event.target.value)} className="mt-1.5" />
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-sm font-semibold">Publication actuelle</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {connectedDomainLabel || "Pas encore publiée"}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Ici, tu modifies les informations rapides du projet sans consommer de crédits.
              </p>

              <Button onClick={saveDetails} disabled={busy} className="w-full">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                Enregistrer les détails
              </Button>
            </div>
          )}

          {tab === "edit" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-bold">Édition manuelle du site</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Tu peux maintenant modifier le contenu directement, sans repartir de zéro.
                </p>
              </div>

              {loadingContent ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement du contenu du site...
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Hero title</Label>
                    <Input value={heroTitle} onChange={(event) => setHeroTitle(event.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Hero subtitle</Label>
                    <Textarea value={heroSubtitle} onChange={(event) => setHeroSubtitle(event.target.value)} className="mt-1.5 min-h-[90px]" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Problème / solution</Label>
                      <Input value={problemTitle} onChange={(event) => setProblemTitle(event.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">CTA button</Label>
                      <Input value={ctaButton} onChange={(event) => setCtaButton(event.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Contenu problème / solution</Label>
                    <Textarea value={problemContent} onChange={(event) => setProblemContent(event.target.value)} className="mt-1.5 min-h-[90px]" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Titre CTA final</Label>
                      <Input value={ctaTitle} onChange={(event) => setCtaTitle(event.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Sous-titre CTA final</Label>
                      <Input value={ctaSubtitle} onChange={(event) => setCtaSubtitle(event.target.value)} className="mt-1.5" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Services
                    </Label>
                    <Textarea
                      value={servicesText}
                      onChange={(event) => setServicesText(event.target.value)}
                      className="mt-1.5 min-h-[120px]"
                      placeholder={"Service 1 | Description\nService 2 | Description"}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Témoignages
                    </Label>
                    <Textarea
                      value={testimonialsText}
                      onChange={(event) => setTestimonialsText(event.target.value)}
                      className="mt-1.5 min-h-[120px]"
                      placeholder={"Nom | Rôle | Témoignage\nNom | Rôle | Témoignage"}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      FAQ
                    </Label>
                    <Textarea
                      value={faqText}
                      onChange={(event) => setFaqText(event.target.value)}
                      className="mt-1.5 min-h-[120px]"
                      placeholder={"Question | Réponse\nQuestion | Réponse"}
                    />
                  </div>

                  <Button onClick={saveManualEdit} disabled={busy || loadingContent} className="w-full">
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Enregistrer les modifications
                  </Button>
                </div>
              )}
            </div>
          )}

          {tab === "improve" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1 text-sm font-bold">Optimise cette version</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Renforce le message, la clarté commerciale, les appels à l'action et la crédibilité globale du site.
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Que veux-tu améliorer ?
                </Label>
                <Textarea
                  value={improvePrompt}
                  onChange={(event) => setImprovePrompt(event.target.value)}
                  className="mt-1.5 min-h-[120px] resize-none"
                  placeholder="Ex : rends le hero plus premium, clarifie l'offre, renforce les CTA et améliore la crédibilité locale."
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Coût de l'optimisation</span>
                </div>
                <span className="text-sm font-bold text-primary">{IMPROVE_COST} crédits</span>
              </div>

              <Button
                onClick={improveWithAI}
                disabled={busy || !improvePrompt.trim()}
                className="h-12 w-full gap-2 font-bold"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {busy ? "Optimisation en cours..." : `Optimiser le site (${IMPROVE_COST} crédits)`}
              </Button>
            </div>
          )}

          {tab === "publish" && (
            <div className="space-y-4">
              <div
                className={`rounded-xl border p-4 ${
                  isPublished ? "border-green-500/20 bg-green-500/5" : "border-border bg-muted/30"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  {isPublished ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <p className="text-sm font-bold">
                    {isPublished ? "Ton site est en ligne" : "Site en brouillon"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPublished
                    ? "Le lien public est actif sur Pixelrises."
                    : "Publie le site pour générer son lien public Pixelrises."}
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Slug public Pixelrises</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">pixelrises.fr/s/</span>
                  <Input
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    className="font-mono text-sm"
                    placeholder="mon-site"
                  />
                </div>
              </div>

              {publicUrl && (
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Lien public
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-muted/40 px-2 py-1.5 text-xs">
                      {publicUrl}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(publicUrl);
                        toast({ title: "Lien copié" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        window.open(publicUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                {isPublished ? (
                  <>
                    <Button onClick={publish} disabled={busy} variant="outline" className="flex-1">
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                      Mettre à jour l'URL
                    </Button>
                    <Button onClick={unpublish} disabled={busy} variant="destructive" className="flex-1">
                      <EyeOff className="mr-2 h-4 w-4" />
                      Dépublier
                    </Button>
                  </>
                ) : (
                  <Button onClick={publish} disabled={busy} className="h-12 w-full gap-2 font-bold">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Publier maintenant
                  </Button>
                )}
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Aperçu privé toujours disponible :{" "}
                <Link to={`/preview/${site.id}`} className="text-primary hover:underline">
                  ouvrir la preview
                </Link>
              </p>
            </div>
          )}

          {tab === "domain" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Globe2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Domaine personnalisé</p>
                    <p className="text-[11px] text-muted-foreground">
                      {site.custom_domain || "Aucun domaine connecté"}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${domainStatus.cls}`}>
                  {domainStatus.label}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-sm font-semibold">Fonctionnement recommandé</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• Publication immédiate sur un lien public Pixelrises</li>
                  <li>• Domaine personnalisé possible ensuite si le client veut sa propre marque</li>
                  <li>• Le domaine personnalisé doit pointer vers Pixelrises via DNS</li>
                </ul>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Ton domaine</Label>
                <Input
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  className="mt-1.5 font-mono text-sm"
                  placeholder="monsite.fr"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Sans http:// ni www.</p>
              </div>

              {domain.trim() && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold">
                    <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
                    Configuration DNS requise
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Pointe ton domaine vers l'app Pixelrises. Une fois le domaine relié à
                    l'hébergement, le site pourra aussi s'ouvrir directement dessus.
                  </p>
                </div>
              )}

              <Button onClick={saveDomain} disabled={busy} className="w-full">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe2 className="mr-2 h-4 w-4" />}
                {domain.trim() ? "Enregistrer le domaine" : "Retirer le domaine"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SiteManager;




