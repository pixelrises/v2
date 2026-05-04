import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Mail,
  MapPin,
  Phone,
  Shield,
  Share2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import {
  buildPixelrisesRootUrl,
  getDomainLookupCandidates,
  getPublishedSiteSlugFromHostname,
  normalizeDomainHostname,
  resolvePublishedSiteUrl,
} from "@/lib/published-site";
import { sanitizeTextDeep } from "@/lib/text-sanitize";

const ACTIVATION_CREDIT_THRESHOLD = 3;

interface GeneratedContent {
  heroTitle: string;
  heroSubtitle: string;
  heroEyebrow?: string;
  heroPromise?: string;
  heroSecondaryCta?: string;
  trustBadges?: string[];
  servicesTitle?: string;
  servicesSubtitle?: string;
  services: { name: string; description: string }[];
  benefitsTitle?: string;
  benefits: { title: string; description: string }[];
  testimonials: { name: string; role: string; text: string }[];
  ctaTitle: string;
  ctaSubtitle?: string;
  ctaButton: string;
  processSteps?: { step: string; title: string; description: string }[];
  faqItems?: { question: string; answer: string }[];
  footerTagline?: string;
  statsItems?: { value: string; label: string }[];
  problemTitle?: string;
  problemContente: string;
  reassuranceTitle?: string;
  reassuranceContente: string;
  reassuranceItems?: string[];
  localSeoTitle?: string;
  localSeoContente: string;
  localSeoItems?: string[];
  sectionOrder?: string[];
  tone?: string;
  urgencyHint?: string;
  metadata?: {
    targetAudience?: string;
    conversionGoal?: string;
    positioning?: string;
    niche?: string;
    offer?: string;
    differentiators?: string[];
    seoKeywords?: string[];
    seoTitle?: string;
    metaDescription?: string;
  };
  design?: {
    colors?: {
      primary?: string;
      secondary?: string;
      surface?: string;
      accent?: string;
    };
    style?: string;
    layout_type?: string;
    animation_style?: string;
    visual_direction?: string;
    typography?: string;
    image_style?: string;
    spacing_style?: string;
    button_style?: string;
    card_style?: string;
    section_style?: string;
    mobile_behavior?: string;
    designArchetype?: string;
  };
  visuals?: {
    accentLabel?: string;
    hero?: {
      url?: string;
      alt?: string;
      prompt?: string;
    };
    gallery?: Array<{
      url?: string;
      alt?: string;
      prompt?: string;
    }>;
  };
}

type VisualSet = {
  hero: string;
  gallery: string[];
  accentLabel: string;
};

const normalizePreviewKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const isPhotographyContext = (value: string) =>
  /\b(photographe|photographie|photo|shooting|portrait|studio photo|reportage photo|seance photo|portfolio)\b/.test(
    normalizePreviewKey(value),
  );

const photographyBlockedImageMarkers = [
  "photo-1497366811353",
  "photo-1497366754035",
  "photo-1516321318423",
  "photo-1552664730",
  "photo-1520607162513",
  "photo-1557804506",
  "photo-1556761175",
  "photo-1460925895917",
  "photo-1551434678",
  "photo-1522202176988",
  "photo-1519389950473",
];

const uniqueUrls = (urls: string[]) =>
  Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));

const defaultVisuals: VisualSet = {
  hero:
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
  ],
  accentLabel: "Presence digitale premium",
};

const getBusinessVisuals = (businessType: string): VisualSet => {
  const value = businessType.toLowerCase();

  if (isPhotographyContext(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Portfolio photo",
    };
  }

  if (/restaurant|boulangerie|traiteur|pizza|cafe|brasserie|food|bar/.test(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Experience gourmande",
    };
  }

  if (/coach|fitness|yoga|pilates|sport|musculation|nutrition/.test(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517837016564-bfc1d1d13d5f?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Transformation visible",
    };
  }

  if (/beaute|coiffeur|esthetique|spa|massage|onglerie|barbier/.test(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Image haut de gamme",
    };
  }

  if (/avocat|notaire|comptable|finance|consulting|cabinet|juridique/.test(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Confiance immediate",
    };
  }

  if (/medecin|dentiste|sante|kine|osteopathe|pharmacie/.test(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1580281657527-47b43b3a4b19?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Reassurance medicale",
    };
  }

  if (/artisan|plombier|electricien|peintre|menuisier|jardinier|renovation|btp/.test(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Fiabilite terrain",
    };
  }

  if (/agence|digital|web|seo|marketing|startup|saas|developpeur/.test(value)) {
    return {
      hero:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
      ],
      accentLabel: "Croissance mesurable",
    };
  }

  return defaultVisuals;
};

const Preview = () => {
  const exportTriggeredRef = useRef(false);
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const currentHostname = normalizeDomainHostname(window.location.hostname);
  const isPreviewRoute = Boolean(id);
  const hostnameSlug = getPublishedSiteSlugFromHostname(currentHostname);
  const resolvedPublicSlug = isPreviewRoute ? null : slug || hostnameSlug;
  const customDomainHost =
    !isPreviewRoute &&
    !resolvedPublicSlug &&
    currentHostname !== "localhost" &&
    currentHostname !== "127.0.0.1" &&
    !currentHostname.endsWith(".localhost")
      ? currentHostname
      : null;
  const [site, setSite] = useState<GeneratedSiteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [viewerCredits, setViewerCredits] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let query = supabase.from("generated_sites").select("*");

        if (id) {
          query = query.eq("id", id);
        } else if (resolvedPublicSlug) {
          query = query.eq("slug", resolvedPublicSlug).eq("status", "published");
        } else if (customDomainHost) {
          query = query
            .in("custom_domain", getDomainLookupCandidates(customDomainHost))
            .eq("status", "published");
        } else {
          setSite(null);
          setLoading(false);
          return;
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error("Preview loading failed", error);
          setSite(null);
          setLoading(false);
          return;
        }

        setSite(data ? (sanitizeTextDeep(data) as GeneratedSiteRecord) : null);
        setLoading(false);
      } catch (error) {
        console.error("Preview loading crashed", error);
        setSite(null);
        setLoading(false);
      }
    };

    void load();
  }, [customDomainHost, id, resolvedPublicSlug]);

  useEffect(() => {
    if (!site?.id || site.status !== "published") return;
    if (!resolvedPublicSlug && !customDomainHost) return;

    const visitKey = `pixelrises:visit:${site.id}:${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (window.sessionStorage.getItem(visitKey) === "done") return;

    const trackVisit = async () => {
      const { error } = await supabase.from("site_page_views").insert({
        generated_site_id: site.id,
        hostname: window.location.hostname,
        path: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });

      if (!error) {
        window.sessionStorage.setItem(visitKey, "done");
      }
    };

    void trackVisit();
  }, [customDomainHost, resolvedPublicSlug, site?.id, site?.status]);

  const rawContent = site
    ? sanitizeTextDeep((site.content_json ?? site.generated_content ?? null) as unknown)
    : null;
  const content =
    rawContent && typeof rawContent === "object" && !Array.isArray(rawContent)
      ? (rawContent as GeneratedContent)
      : null;

  const previewVisualContext = [
    site?.business_type,
    site?.business_name,
    content?.metadata?.niche,
    content?.metadata?.offer,
    content?.design?.image_style,
    content?.design?.visual_direction,
  ]
    .filter(Boolean)
    .join(" ");
  const usesPhotographyVisuals = isPhotographyContext(previewVisualContext);
  const fallbackVisuals = getBusinessVisuals(previewVisualContext);
  const generatedGallery =
    content?.visuals?.gallery
      ?.map((item) => item?.url || "")
      .filter(Boolean) || [];
  const safeGeneratedGallery = generatedGallery.filter(
    (url) =>
      !usesPhotographyVisuals ||
      !photographyBlockedImageMarkers.some((marker) => url.includes(marker)),
  );
  const heroCandidate = content?.visuals?.hero?.url || "";
  const safeHero =
    usesPhotographyVisuals &&
    photographyBlockedImageMarkers.some((marker) => heroCandidate.includes(marker))
      ? fallbackVisuals.hero
      : heroCandidate || fallbackVisuals.hero;
  const visuals = {
    hero: safeHero,
    gallery: uniqueUrls([...safeGeneratedGallery, ...fallbackVisuals.gallery]).slice(0, 6),
    accentLabel:
      content?.visuals?.accentLabel ||
      content?.design?.visual_direction ||
      fallbackVisuals.accentLabel,
  };
  const galleryImages = visuals.gallery.length > 0 ? visuals.gallery : [visuals.hero];
  const getGalleryImage = (index: number) =>
    galleryImages[index % galleryImages.length] || visuals.hero;
  const layoutType = content?.design?.layout_type || "balanced-modern";
  const spacingStyle = content?.design?.spacing_style || "";
  const buttonStyle = content?.design?.button_style || "";
  const visualRecipe = [
    layoutType,
    content?.design?.visual_direction,
    content?.design?.card_style,
    content?.design?.section_style,
    content?.design?.image_style,
    content?.design?.mobile_behavior,
    content?.design?.designArchetype,
    site?.business_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const isCompactSpacing = /compact|direct|dense/i.test(spacingStyle);
  const isEditorialLayout = /editorial|premium|raffin|restaurant|beauty|immobilier|authority|autorite|luxury|magazine|chef-table|portfolio|studio/i.test(visualRecipe);
  const isDynamicLayout = /conversion|dynamique|dynamic|coach|sport|car|location|local-services|impact|pulse|momentum|hero-track|drive/i.test(visualRecipe);
  const isMinimalLayout = /minimal|sobre|trust|medical|sante|sante|white-space|calm|care/i.test(visualRecipe);
  const isBentoLayout = /bento|dashboard|program|product|storefront|fleet|offer|use-case|proof-lab|comparison|grid/i.test(visualRecipe);
  const isCinematicLayout = /cinematic|immersive|story|showcase|gallery|event|restaurant|travel|stay|moment|full-bleed|editorial-immersive/i.test(visualRecipe);
  const isProofStackLayout = /proof|authority|trust|method|diagnostic|responsible|expert|reassurance|valuation|seller|neighborhood|magazine/i.test(visualRecipe);
  const isActionFlowLayout = /booking|reservation|appointment|urgent|intervention|flow|conversion|calendar|tunnel|action-map|ladder/i.test(visualRecipe);
  const isSocialYouthLayout = /tiktok|tik tok|social|jeune|gen z|rose|violet|neon|creator|communaut|youth|bold-social/i.test(visualRecipe);
  const isWhatsAppLeadLayout = /whatsapp|message|contact rapide|direct message|mobile-first/i.test(visualRecipe);
  const isPortfolioServicesLayout =
    usesPhotographyVisuals || /portfolio-gallery-conversion|portfolio|studio|gallery|galerie|photographe|shooting/i.test(visualRecipe);
  const rootBackgroundClass = isCinematicLayout
    ? "min-h-screen bg-[radial-gradient(circle_at_18%_12%,hsl(var(--primary)/0.24),transparent_30%),radial-gradient(circle_at_82%_4%,hsl(var(--accent)/0.16),transparent_28%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--card)),hsl(var(--background)))] text-foreground"
    : isSocialYouthLayout
      ? "min-h-screen bg-[radial-gradient(circle_at_16%_8%,hsl(var(--primary)/0.32),transparent_28%),radial-gradient(circle_at_84%_18%,hsl(var(--secondary)/0.22),transparent_25%),linear-gradient(160deg,hsl(var(--background)),hsl(var(--card)),hsl(var(--background)))] text-foreground"
      : isBentoLayout
      ? "min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.42),hsl(var(--background)))] text-foreground"
      : isProofStackLayout
        ? "min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)/0.74),hsl(var(--background)))] text-foreground"
        : "min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.10),transparent_34%),hsl(var(--background))] text-foreground";
  const heroSpacingClass = isCompactSpacing
    ? "relative px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
    : isCinematicLayout
      ? "relative px-4 py-14 sm:px-8 sm:py-24 lg:px-10 lg:py-32"
      : isBentoLayout
        ? "relative px-4 py-12 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
    : isEditorialLayout
      ? "relative px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32"
      : "relative px-4 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28";
  const primaryButtonShapeClass = isSocialYouthLayout
    ? "rounded-[18px]"
    : /sobre|fin|elegant|\u00e9l\u00e9gant/i.test(buttonStyle)
      ? "rounded-2xl"
      : "rounded-full";
  const sectionCardClass = isBentoLayout
    ? "rounded-[28px] border border-border/80 bg-card/90 p-6 shadow-2xl shadow-primary/5 backdrop-blur-sm sm:p-8 lg:p-10"
    : isProofStackLayout
      ? "rounded-[20px] border border-border bg-card/92 p-8 lg:p-10 shadow-lg shadow-black/10"
      : isMinimalLayout
    ? "rounded-[22px] border border-border bg-card/90 p-8 lg:p-10 shadow-lg shadow-black/5"
    : isEditorialLayout
      ? "rounded-[36px] border border-border/80 bg-card/85 p-8 lg:p-11 shadow-2xl shadow-primary/5"
      : "rounded-[28px] border border-border bg-card p-8 lg:p-10 shadow-xl shadow-black/10";
  const compactCardClass = isSocialYouthLayout
    ? "rounded-[22px] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/12 p-5 shadow-xl shadow-primary/10"
    : isBentoLayout
    ? "rounded-[20px] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/10 p-5 shadow-xl shadow-primary/5"
    : isProofStackLayout
      ? "rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-black/5"
      : isMinimalLayout
    ? "rounded-2xl border border-border bg-card/90 p-5"
    : isDynamicLayout
      ? "rounded-[24px] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/10 p-5 shadow-xl shadow-primary/5"
      : "rounded-2xl border border-border bg-card p-5";
  const serviceGridClass = isPortfolioServicesLayout
    ? "lg:grid-cols-2"
    : isBentoLayout
    ? "lg:grid-cols-[1.1fr_0.9fr_1fr]"
    : /editorial|authority|trust|minimal|balanced/.test(layoutType)
    ? "lg:grid-cols-2"
    : "lg:grid-cols-3";
  const serviceCardClass = isSocialYouthLayout
    ? "group overflow-hidden rounded-[24px] border border-primary/20 bg-gradient-to-br from-card via-card to-secondary/10 shadow-2xl shadow-primary/10 hover:-translate-y-1 hover:border-primary/45 transition-all duration-300"
    : isBentoLayout
    ? "group overflow-hidden rounded-[26px] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/10 shadow-2xl shadow-primary/5 hover:-translate-y-1 hover:border-primary/40 transition-all duration-300"
    : isProofStackLayout
      ? "group overflow-hidden rounded-[20px] border border-border bg-card/95 shadow-lg shadow-black/10 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
      : isEditorialLayout
    ? "group overflow-hidden rounded-[36px] border border-border/80 bg-card/90 shadow-2xl shadow-primary/5 hover:-translate-y-1 hover:border-primary/35 transition-all duration-300"
    : isDynamicLayout
      ? "group overflow-hidden rounded-[22px] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/10 shadow-xl shadow-primary/5 hover:-translate-y-1 hover:border-primary/40 transition-all duration-300"
      : "group overflow-hidden rounded-[28px] border border-border bg-card shadow-xl shadow-black/10 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300";
  const mediaFrameClass = isSocialYouthLayout
    ? "relative overflow-hidden rounded-[30px] border border-primary/25 bg-card/70 shadow-2xl shadow-primary/20 backdrop-blur-xl"
    : isCinematicLayout
    ? "relative overflow-hidden rounded-[34px] border border-white/10 bg-card/70 shadow-2xl shadow-black/40 backdrop-blur-xl lg:rounded-[44px]"
    : isBentoLayout
      ? "relative overflow-hidden rounded-[28px] border border-primary/20 bg-card/75 shadow-2xl shadow-primary/10 backdrop-blur-xl"
      : isProofStackLayout
        ? "relative overflow-hidden rounded-[22px] border border-white/10 bg-card/80 shadow-xl shadow-black/25 backdrop-blur-xl"
        : isEditorialLayout
    ? "relative overflow-hidden rounded-tl-[70px] rounded-br-[70px] border border-white/10 bg-card/70 shadow-2xl shadow-black/35 backdrop-blur-xl"
    : isDynamicLayout
      ? "relative overflow-hidden rounded-[26px] border border-primary/20 bg-card/70 shadow-2xl shadow-primary/10 backdrop-blur-xl"
      : "relative overflow-hidden rounded-[28px] border border-white/10 bg-card/70 shadow-2xl shadow-black/35 backdrop-blur-xl sm:rounded-[32px]";
  const mediaImageClass = isCinematicLayout
    ? "h-[360px] w-full object-cover saturate-[1.08] contrast-[1.04] sm:h-[480px] lg:h-[620px]"
    : isDynamicLayout || isActionFlowLayout
    ? "h-[320px] w-full object-cover saturate-[1.12] contrast-[1.05] sm:h-[420px] lg:h-[520px]"
    : isMinimalLayout
      ? "h-[300px] w-full object-cover saturate-[0.92] sm:h-[400px] lg:h-[500px]"
      : "h-[320px] w-full object-cover sm:h-[420px] lg:h-[520px]";
  const heroGridClass = isWhatsAppLeadLayout
    ? "max-w-7xl mx-auto grid lg:grid-cols-[1fr_0.92fr] gap-9 items-center"
    : isCinematicLayout
    ? "max-w-7xl mx-auto grid lg:grid-cols-[0.82fr_1.18fr] gap-12 items-center"
    : isBentoLayout
      ? "max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-8 items-center"
      : isProofStackLayout
        ? "max-w-7xl mx-auto grid lg:grid-cols-[1.12fr_0.88fr] gap-10 items-center"
        : isEditorialLayout
    ? "max-w-7xl mx-auto grid lg:grid-cols-[0.92fr_1.08fr] gap-12 items-center"
    : isDynamicLayout
      ? "max-w-7xl mx-auto grid lg:grid-cols-[1.08fr_0.92fr] gap-10 items-center"
      : "max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center";
  const visualDirectionLabel = visuals.accentLabel;
  const heroPromiseText =
    content?.heroPromise ||
    content?.metadata?.offer ||
    `${site?.business_name || "Cette entreprise"} met en avant une offre concrete, des preuves utiles et une action simple.`;
  const localSeoTitle =
    content?.localSeoTitle ||
    (site?.city
      ? `${site.business_type || "Activite"} a ${site.city}`
      : "Visibilite locale");
  const localSeoContent =
    content?.localSeoContent ||
    (site?.city
      ? `${site.business_name} relie ses prestations a ${site.city}, avec une promesse lisible et une action directe.`
      : `${site?.business_name || "L'entreprise"} presente ses prestations avec une promesse lisible et une action directe.`);
  const localSeoItems =
    Array.isArray(content?.localSeoItems) && content.localSeoItems.length
      ? content.localSeoItems
      : [
          site?.city
            ? `${site.business_type || "activite"} a ${site.city}`
            : "Offre clairement positionnee",
          content?.metadata?.conversionGoal || "Prise de contact simplifiee",
          content?.metadata?.offer || "Promesse principale clarifiee",
        ];

  const rootHomeUrl = buildPixelrisesRootUrl("/");
  const rootAiUrl = buildPixelrisesRootUrl("/ai");
  const previewUrl =
    site?.id ? `${window.location.origin}/preview/${site.id}` : window.location.href;
  const isEmbeddedPreview =
    new URLSearchParams(window.location.search).get("embed") === "1";
  const publishedSiteUrl = resolvePublishedSiteUrl({
    slug: site?.slug,
    customDomain: site?.custom_domain,
    domainStatus: site?.domain_status,
  });
  const publicUrl =
    site?.status === "published" && publishedSiteUrl ? publishedSiteUrl : previewUrl;
  const isPublicSurface = Boolean(resolvedPublicSlug || customDomainHost);
  const isPrivatePreview = Boolean(site?.id && !isPublicSurface && site.status !== "published");
  const hasActivationCredits =
    !isPrivatePreview || (viewerCredits ?? 0) >= ACTIVATION_CREDIT_THRESHOLD;
  const creditCheckReady = !isPrivatePreview || viewerCredits !== null;
  const publishActivationUrl = site?.id
    ? buildPixelrisesRootUrl(`/dashboard?tab=subscription&manage=${site.id}&activation=publish`)
    : buildPixelrisesRootUrl("/dashboard");
  const subscriptionActivationUrl = site?.id
    ? buildPixelrisesRootUrl(`/dashboard?tab=subscription&manage=${site.id}&activation=subscription`)
    : buildPixelrisesRootUrl("/dashboard");

  useEffect(() => {
    if (!isPrivatePreview) {
      setViewerCredits(null);
      return;
    }

    let active = true;

    const loadViewerCredits = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setViewerCredits(0);
        return;
      }

      const { data } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .maybeSingle();

      if (active) {
        setViewerCredits(data?.credits ?? 0);
      }
    };

    void loadViewerCredits();

    return () => {
      active = false;
    };
  }, [isPrivatePreview]);
  const previewSeoTitle =
    content?.metadata?.seoTitle ||
    (site
      ? `${site.business_name}${site.city ? ` a ${site.city}` : ""} | Pixelrises`
      : "Preview du site | Pixelrises");
  const previewSeoDescription =
    content?.metadata?.metaDescription ||
    content?.heroSubtitle ||
    "Previsualisez ou consultez un site cree avec Pixelrises.";
  const canonicalUrl = isPublicSurface && site?.status === "published" ? publicUrl : previewUrl;
  const seoKeywords = Array.from(
    new Set(
      [
        ...(Array.isArray(content?.metadata?.seoKeywords) ? content.metadata.seoKeywords : []),
        site?.business_type ? `${site.business_type}${site.city ? ` ${site.city}` : ""}` : "",
        site?.city ? `${site.business_name} ${site.city}` : "",
      ].filter(Boolean),
    ),
  );

  const problemTitle =
    content?.problemTitle || content?.benefitsTitle || "Le bon message change tout";
  const problemContent =
    content?.problemContent ||
    content?.benefits?.[0]?.description ||
    "Votre site doit rassurer vite, expliquer l'offre clairement et pousser a l'action sans friction.";
  const reassuranceTitle =
    content?.reassuranceTitle || "Une base serieuse pour convertir";
  const reassuranceContent =
    content?.reassuranceContent ||
    content?.ctaSubtitle ||
    "Chaque bloc du site sert un objectif clair : rassurer, prouver, faire agir.";
  const rawReassuranceItems = content?.reassuranceItems;
  const reassuranceItems = useMemo(
    () =>
      Array.isArray(rawReassuranceItems) && rawReassuranceItems.length
        ? rawReassuranceItems
        : [
            "Structure pensee pour convertir rapidement",
            "Message clair des les premieres secondes",
            "CTA visibles et credibles",
            "Version publiable et ameliorable ensuite",
          ],
    [rawReassuranceItems],
  );

  const ctaText = content?.ctaButton || "Prendre rendez-vous";
  const secondaryCtaText =
    content?.heroSecondaryCta || "Decouvrir nos services";
  const actionLinkLabel =
    site?.status === "published" ? "Voir le lien public" : "Ouvrir la preview";
  const heroEyebrow =
    content?.heroEyebrow ||
    `${site?.business_type || "Activite"}${site?.city ? ` - ${site.city}` : ""}`;

  const benefitIcons = [Target, Award, Clock, TrendingUp, Shield, Eye];
  const rawServices = content?.services;
  const services = useMemo(
    () =>
      Array.isArray(rawServices) && rawServices.length
        ? rawServices
        : [
            {
              name: site?.business_type || "Offre principale",
              description: "Une offre claire, structuree et simple a comprendre avant de passer a l'action.",
            },
          ],
    [rawServices, site?.business_type],
  );
  const benefits =
    Array.isArray(content?.benefits) && content.benefits.length
      ? content.benefits
      : [
          {
            title: "Un message plus clair",
            description: "Le visiteur comprend rapidement l'offre, la valeur et la prochaine etape.",
          },
          {
            title: "Plus de confiance",
            description: "Les preuves, la methode et les reponses aux objections rassurent avant le contact.",
          },
        ];
  const trustBadges =
    Array.isArray(content?.trustBadges) && content.trustBadges.length
      ? content.trustBadges
      : reassuranceItems;

  const testimonials =
    Array.isArray(content?.testimonials) && content.testimonials.length
      ? content.testimonials
      : [
          {
            name: "Client satisfait",
            role: "Projet local",
            text: "Le message est enfin clair et les demandes entrent beaucoup plus vite.",
          },
        ];

  const processSteps =
    Array.isArray(content?.processSteps) && content.processSteps.length
      ? content.processSteps
      : [
          { step: "1", title: "On capte l'attention", description: "Une promesse simple et forte des l'ouverture." },
          { step: "2", title: "On donne confiance", description: "Des preuves, des benefices et une structure lisible." },
          { step: "3", title: "On fait agir", description: "Un CTA visible et une prise de contact sans friction." },
        ];

  const faqItems =
    Array.isArray(content?.faqItems) && content.faqItems.length
      ? content.faqItems
      : [
          { question: "Comment demarre-t-on ?", answer: "Vous demandez un echange ou un devis, puis nous cadrons la meilleure suite." },
          { question: "En combien de temps ?", answer: "Une base claire peut etre lancee rapidement, puis amelioree bloc par bloc." },
          { question: "Ce site est-il modifiable ?", answer: "Oui, la base est pensee pour etre retravaillee et republiee." },
        ];
  const generatedSectionTitles = (content || {}) as GeneratedContent & {
    testimonialsTitle?: string;
    processTitle?: string;
    faqTitle?: string;
  };
  const serviceSectionTitle =
    content?.servicesTitle ||
    (usesPhotographyVisuals
      ? "Des seances photo pensees pour chaque moment"
      : `Ce que propose ${site?.business_name || "l'entreprise"}`);
  const testimonialsSectionTitle =
    generatedSectionTitles.testimonialsTitle ||
    (usesPhotographyVisuals
      ? "Ce que les clients retiennent de la seance"
      : isProofStackLayout
        ? "Des preuves qui rassurent avant le premier contact"
        : "Des retours concrets sur l'experience");
  const processSectionTitle =
    generatedSectionTitles.processTitle ||
    (usesPhotographyVisuals
      ? "De l'idee au rendu final, sans stress"
      : isActionFlowLayout
        ? "Un chemin court jusqu'a la prochaine action"
        : "Une methode simple pour avancer");
  const faqSectionTitle =
    generatedSectionTitles.faqTitle ||
    (usesPhotographyVisuals
      ? "Avant de reserver une seance photo"
      : isWhatsAppLeadLayout
        ? "Les questions avant d'envoyer un message"
        : "Les questions qui comptent avant de se lancer");
  const sectionMicroLabels = {
    problem:
      usesPhotographyVisuals
        ? "Besoin client / rendu attendu"
        : isProofStackLayout
          ? "Diagnostic / confiance"
          : isActionFlowLayout
            ? "Frein / action"
            : "Probleme / reponse",
    services:
      usesPhotographyVisuals
        ? "Formats de seance"
        : isBentoLayout
          ? "Modules de l'offre"
          : isEditorialLayout
            ? "Experience proposee"
            : "Offres concretes",
    testimonials:
      usesPhotographyVisuals
        ? "Retours de seance"
        : isProofStackLayout
          ? "Preuves client"
          : "Retours clients",
    process:
      usesPhotographyVisuals
        ? "Deroule de la seance"
        : isActionFlowLayout
          ? "Parcours d'action"
          : "Methode",
    reassurance:
      usesPhotographyVisuals
        ? "Cadre et confiance"
        : isMinimalLayout
          ? "Points de confiance"
          : "Reassurance",
    local:
      usesPhotographyVisuals
        ? "Spots et zone"
        : isProofStackLayout
          ? "Ancrage local"
          : "Presence locale",
    localSignal:
      usesPhotographyVisuals ? "Idee locale" : "Signal local",
    faq:
      usesPhotographyVisuals
        ? "Avant booking"
        : isWhatsAppLeadLayout
          ? "Avant le message"
          : "Questions utiles",
    finalCta:
      usesPhotographyVisuals
        ? "Reservation"
        : isActionFlowLayout
          ? "Prochaine action"
          : "Passer a l'action",
    heroNote: usesPhotographyVisuals ? "A retenir pour la seance" : "A retenir",
  };

  const contactDetails =
    content && "contact" in content && typeof (content as { contact?: unknown }).contact === "object"
      ? ((content as { contact?: { email?: string; phone?: string; whatsapp?: string } }).contact ?? {})
      : {};
  const contactEmail =
    typeof contactDetails.email === "string" && /@/.test(contactDetails.email)
      ? contactDetails.email
      : "";
  const contactPhone =
    typeof contactDetails.phone === "string" && contactDetails.phone.trim().length >= 6
      ? contactDetails.phone.trim()
      : "";
  const contactWhatsapp =
    typeof contactDetails.whatsapp === "string" && contactDetails.whatsapp.trim().length >= 6
      ? contactDetails.whatsapp.trim()
      : "";
  const wantsWhatsAppAction = /whatsapp/i.test(
    [
      ctaText,
      content?.ctaTitle,
      content?.ctaSubtitle,
      content?.heroSecondaryCta,
      content?.design?.button_style,
      content?.design?.mobile_behavior,
      content?.design?.visual_direction,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const primaryContactHref = wantsWhatsAppAction
    ? `https://wa.me/${contactWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Bonjour, je souhaite echanger avec ${site?.business_name || "votre equipe"}.`,
      )}`
    : contactEmail
      ? `mailto:${contactEmail}`
      : "#contact";

  const schemaJsonLd =
    site && content
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: site.business_name,
          description: content.heroSubtitle,
          url: canonicalUrl,
          areaServed: site.city || localSeoItems[0] || "France",
          address: site.city
            ? {
                "@type": "PostalAddress",
                addressLocality: site.city,
                addressCountry: "FR",
              }
            : undefined,
          email: contactEmail || undefined,
          telephone: contactPhone || undefined,
          image: content.visuals?.hero?.url || visuals.hero,
          knowsAbout: seoKeywords,
          makesOffer: services.slice(0, 6).map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: service.name,
              description: service.description,
            },
          })),
        }
      : undefined;

  const handleShare = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Lien copie",
      description: "Le lien du site a ete copie.",
    });
  };

  const handleExport = useCallback(() => {
    if (!site || !content) return;
    if (isPrivatePreview && !hasActivationCredits) {
      toast({
        title: "Ton site est pret",
        description: "Active-le pour le mettre en ligne.",
      });
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${site.business_name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#07111f;color:#f5f7fb}
    a{text-decoration:none;color:inherit}
    .hero{padding:96px 24px;background:radial-gradient(circle at top,rgba(78,132,255,.28),transparent 45%),linear-gradient(135deg,#08111f,#111c31 55%,#0b1323)}
    .container{max-width:1180px;margin:0 auto}
    .eyebrow{font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#8db3ff;margin-bottom:18px}
    h1{font-size:clamp(42px,7vw,84px);line-height:.96;margin-bottom:22px}
    .lead{font-size:18px;line-height:1.7;max-width:720px;color:#d3dbef;margin-bottom:34px}
    .btn{display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border-radius:999px;font-weight:700}
    .btn-primary{background:#4e84ff;color:#fff}
    .btn-secondary{border:1px solid rgba(255,255,255,.16);color:#e8eefc}
    .section{padding:82px 24px}
    .alt{background:rgba(255,255,255,.03)}
    .grid{display:grid;gap:20px}
    .grid-2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
    .grid-3{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
    .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:28px}
    .title{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8db3ff;margin-bottom:10px}
    h2{font-size:clamp(30px,5vw,54px);margin-bottom:18px}
    p{color:#d0d7e8}
    .footer{padding:36px 24px;border-top:1px solid rgba(255,255,255,.08);text-align:center;color:#9ba8c7}
  </style>
</head>
<body>
  <section class="hero">
    <div class="container">
      <p class="eyebrow">${heroEyebrow}</p>
      <h1>${content.heroTitle}</h1>
      <p class="lead">${content.heroSubtitle}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn-primary" href="#contact">${ctaText}</a>
        <a class="btn btn-secondary" href="#services">${secondaryCtaText}</a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <p class="title">${sectionMicroLabels.problem}</p>
      <h2>${problemTitle}</h2>
      <p class="lead" style="max-width:840px">${problemContent}</p>
    </div>
  </section>
  <section class="section alt" id="services">
    <div class="container">
      <p class="title">${sectionMicroLabels.services}</p>
      <h2>${content.servicesTitle || "Des offres claires et vendables"}</h2>
      <div class="grid grid-3">
        ${services
          .slice(0, 6)
          .map(
            (service) =>
              `<div class="card"><h3 style="font-size:22px;margin-bottom:12px">${service.name}</h3><p>${service.description}</p></div>`,
          )
          .join("")}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <p class="title">${sectionMicroLabels.reassurance}</p>
      <h2>${reassuranceTitle}</h2>
      <p class="lead">${reassuranceContent}</p>
      <div class="grid grid-2">
        ${reassuranceItems
          .slice(0, 4)
          .map((item) => `<div class="card"><p>${item}</p></div>`)
          .join("")}
      </div>
    </div>
  </section>
  <section class="section alt" id="contact">
    <div class="container" style="text-align:center">
      <p class="title">${sectionMicroLabels.finalCta}</p>
      <h2>${content.ctaTitle}</h2>
      <p class="lead" style="margin-left:auto;margin-right:auto">${content.ctaSubtitle || "Passez a l'action maintenant."}</p>
      <a class="btn btn-primary" href="${primaryContactHref}">${ctaText}</a>
    </div>
  </section>
  <div class="footer">Copyright ${new Date().getFullYear()} ${site.business_name}. Site cree avec Pixelrises.</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${site.business_name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    content,
    ctaText,
    hasActivationCredits,
    heroEyebrow,
    isPrivatePreview,
    problemContent,
    problemTitle,
    primaryContactHref,
    reassuranceContent,
    reassuranceItems,
    reassuranceTitle,
    sectionMicroLabels.finalCta,
    sectionMicroLabels.problem,
    sectionMicroLabels.reassurance,
    sectionMicroLabels.services,
    secondaryCtaText,
    services,
    site,
  ]);

  useEffect(() => {
    if (!site || !content || exportTriggeredRef.current || !creditCheckReady) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("download") !== "1") return;

    exportTriggeredRef.current = true;
    handleExport();
  }, [content, creditCheckReady, handleExport, site]);

  const AnimatedBlock = ({
    children,
    className = "",
    delay = 0,
    id: sectionId,
  }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    id?: string;
  }) => (
    <motion.div
      id={sectionId}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  );

  const readDesignHex = (value: unknown) => {
    const candidate = typeof value === "string" ? value.trim() : "";
    return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : null;
  };

  const customPrimaryHex = (() => {
    const designPrimary = readDesignHex(content?.design?.colors?.primary);
    if (designPrimary) return designPrimary;

    const colorValue = (site?.colors || "").toString();
    const map: Record<string, string> = {
      Bleu: "#4e84ff",
      Vert: "#10b981",
      Rouge: "#ef4444",
      Violet: "#8b5cf6",
      Rose: "#ec4899",
      Orange: "#f59e0b",
      Noir: "#0f172a",
      Or: "#d4a843",
    };

    for (const key of Object.keys(map)) {
      if (colorValue.startsWith(key)) return map[key];
    }

    return null;
  })();
  const customSecondaryHex = readDesignHex(content?.design?.colors?.secondary);
  const customSurfaceHex = readDesignHex(content?.design?.colors?.surface);
  const customAccentHex = readDesignHex(content?.design?.colors?.accent);
  const typographySignature = [
    content?.design?.typography,
    content?.design?.style,
    content?.design?.visual_direction,
    layoutType,
    site?.business_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const bodyFontFamily = /sports|responsible|data|analysis|analyse/i.test(typographySignature)
    ? "'Bahnschrift', 'Trebuchet MS', 'Segoe UI', sans-serif"
    : /product|bento|dashboard|saas|tech|program/i.test(typographySignature)
      ? "'Aptos', 'Segoe UI', sans-serif"
      : /cinematic|travel|restaurant|beauty|editorial|premium|\u00e9l\u00e9gant|elegant|immobilier|raffin/i.test(typographySignature)
        ? "Georgia, 'Times New Roman', serif"
        : /dynamique|coach|moderne|location|car|automotive|intervention/i.test(typographySignature)
          ? "'Trebuchet MS', 'Segoe UI', sans-serif"
          : /sobre|minimal|medical|sant/i.test(typographySignature)
            ? "Verdana, 'Segoe UI', sans-serif"
            : "'Sora', 'Inter', system-ui, sans-serif";
  const headingFontFamily = /sports|responsible|data|analysis|analyse/i.test(typographySignature)
    ? "'Bahnschrift', 'Trebuchet MS', 'Segoe UI', sans-serif"
    : /product|bento|dashboard|saas|tech|program/i.test(typographySignature)
      ? "'Aptos Display', 'Aptos', 'Segoe UI', sans-serif"
      : /editorial|premium|\u00e9l\u00e9gant|elegant|immobilier|restaurant|beauty|raffin|cinematic|travel/i.test(typographySignature)
        ? "Georgia, 'Times New Roman', serif"
    : bodyFontFamily;
  const sectionHeadingStyle = { fontFamily: headingFontFamily } as React.CSSProperties;
  const heroTitleTrackingClass = /editorial|premium|\u00e9l\u00e9gant|elegant|raffin/i.test(typographySignature)
    ? "tracking-[-0.055em]"
    : "tracking-tight";

  const hexToHslString = (hex: string): string | null => {
    const match = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return null;

    const r = parseInt(match[1], 16) / 255;
    const g = parseInt(match[2], 16) / 255;
    const b = parseInt(match[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h *= 60;
    }

    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const customStyle = {
    ...(customPrimaryHex ? { ["--primary" as never]: hexToHslString(customPrimaryHex) || undefined } : {}),
    ...(customPrimaryHex ? { ["--primary-glow" as never]: hexToHslString(customAccentHex || customPrimaryHex) || undefined } : {}),
    ...(customSecondaryHex ? { ["--secondary" as never]: hexToHslString(customSecondaryHex) || undefined } : {}),
    ...(customAccentHex ? { ["--accent" as never]: hexToHslString(customAccentHex) || undefined } : {}),
    ...(customSurfaceHex ? { ["--background" as never]: hexToHslString(customSurfaceHex) || undefined } : {}),
    ...(customSurfaceHex ? { ["--card" as never]: hexToHslString(customSurfaceHex) || undefined } : {}),
    fontFamily: bodyFontFamily,
  } as React.CSSProperties;

  if (loading) {
    return (
      <>
        <SEOHead
          title="Chargement du site | Pixelrises"
          description="Chargement de la previsualisation Pixelrises."
          canonical={previewUrl}
          noIndex
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-border" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Chargement du site...</p>
          </div>
        </div>
      </>
    );
  }

  if (!site) {
    return (
      <>
        <SEOHead
          title={isPublicSurface ? "Site introuvable | Pixelrises" : "Preview introuvable | Pixelrises"}
          description="Cette page n'est pas disponible."
          canonical={previewUrl}
          noIndex
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isPublicSurface ? "Site introuvable ou non publie" : "Site introuvable"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {isPublicSurface
                ? "Ce site n'existe pas, n'est pas encore publie, ou a ete retir?."
                : "Ce site n'existe pas ou a ete supprime."}
            </p>
            <a
              href={rootHomeUrl}
              className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Retour a l'accueil
            </a>
          </div>
        </div>
      </>
    );
  }

  if (!content) {
    return (
      <>
        <SEOHead
          title="Contenu indisponible | Pixelrises"
          description="Le contenu de ce site n'est pas disponible."
          canonical={previewUrl}
          noIndex
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Aucun contenu genere pour ce site.</p>
        </div>
      </>
    );
  }

  const defaultContentSectionOrder = [
    "problem_solution",
    "services",
    "benefits",
    "testimonials",
    "process",
    "reassurance",
    "local_seo",
    "faq",
    "final_cta",
  ];

  const safeSectionOrder =
    Array.isArray(content.sectionOrder) && content.sectionOrder.length
      ? content.sectionOrder
      : defaultContentSectionOrder;
  const orderedContentSectionsBase = safeSectionOrder.filter(
    (sectionId) => typeof sectionId === "string" && sectionId && sectionId !== "hero",
  );
  const orderedContentSections = Array.from(
    new Set([
      ...orderedContentSectionsBase,
      ...(orderedContentSectionsBase.includes("final_cta") ? [] : ["final_cta"]),
    ]),
  );

  const navigationLinks = orderedContentSections
    .map((sectionId) => {
      switch (sectionId) {
        case "services":
          return { href: "#services", label: "Services" };
        case "testimonials":
          return { href: "#testimonials", label: "Avis" };
        case "faq":
          return { href: "#faq", label: "FAQ" };
        case "final_cta":
          return { href: "#contact", label: "Contact" };
        default:
          return null;
      }
    })
    .filter(Boolean) as Array<{ href: string; label: string }>;

  const renderContentSection = (sectionId: string) => {
    switch (sectionId) {
      case "problem_solution":
        return (
          <AnimatedBlock key={sectionId} className="px-6 sm:px-12 py-20 lg:py-24">
            <div className="max-w-6xl mx-auto">
              <div className={sectionCardClass}>
                <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase mb-3">
                  {sectionMicroLabels.problem}
                </p>
                <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4" style={sectionHeadingStyle}>
                  {problemTitle}
                </h2>
                <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-4xl">
                  {problemContent}
                </p>
              </div>
            </div>
          </AnimatedBlock>
        );
      case "services":
        return (
          <AnimatedBlock key={sectionId} id="services" className="px-6 sm:px-12 py-20 lg:py-24 bg-secondary/35">
            <div className="max-w-6xl mx-auto">
              <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase text-center mb-3">
                {sectionMicroLabels.services}
              </p>
              <h2 className="text-3xl lg:text-5xl font-bold text-center tracking-tight mb-3" style={sectionHeadingStyle}>
                {serviceSectionTitle}
              </h2>
              {content.servicesSubtitle && (
                <p className="text-base text-muted-foreground text-center max-w-2xl mx-auto mb-10 leading-relaxed">
                  {content.servicesSubtitle}
                </p>
              )}

              <div
                className={`grid gap-6 ${serviceGridClass}`}
              >
                {services.slice(0, 6).map((service, index) => (
                  <motion.div
                    key={`${service.name}-${index}`}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className={`${serviceCardClass} ${isPortfolioServicesLayout && index === 0 ? "lg:col-span-2 lg:grid lg:grid-cols-[1.08fr_0.92fr]" : ""}`}
                  >
                    <div className={`relative overflow-hidden ${isPortfolioServicesLayout && index === 0 ? "h-72 lg:h-full" : "h-48"}`}>
                      <img
                        src={getGalleryImage(index)}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                      <div className="absolute left-5 bottom-5 rounded-full bg-white/12 border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                        {visualDirectionLabel}
                      </div>
                    </div>
                    <div className={isPortfolioServicesLayout && index === 0 ? "p-8 lg:p-10 flex flex-col justify-center" : "p-6"}>
                      <p className={isPortfolioServicesLayout && index === 0 ? "text-2xl lg:text-3xl font-bold mb-3" : "text-lg font-bold mb-3"}>{service.name}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                        {service.description}
                      </p>
                      <a
                        href="#contact"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                      >
                        {ctaText}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedBlock>
        );
      case "benefits":
        return (
          <AnimatedBlock key={sectionId} className="px-6 sm:px-12 py-20 lg:py-24">
            <div className="max-w-6xl mx-auto">
              <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase mb-3">
                Pourquoi cela convainc
              </p>
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4" style={sectionHeadingStyle}>
                {content.benefitsTitle || "Ce que le visiteur comprend et retient"}
              </h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-8 max-w-3xl">
                {reassuranceContent}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.slice(0, 4).map((benefit, index) => {
                  const Icon = benefitIcons[index % benefitIcons.length];
                  return (
                    <div
                      key={`${benefit.title}-${index}`}
                      className={`${compactCardClass} flex items-start gap-4`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-bold mb-1.5">{benefit.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedBlock>
        );
      case "testimonials":
        return (
          <AnimatedBlock key={sectionId} id="testimonials" className="px-6 sm:px-12 py-20 lg:py-24">
            <div className="max-w-6xl mx-auto">
              <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase text-center mb-3">
                {sectionMicroLabels.testimonials}
              </p>
              <h2 className="text-3xl lg:text-5xl font-bold text-center tracking-tight mb-12" style={sectionHeadingStyle}>
                {testimonialsSectionTitle}
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.slice(0, 3).map((testimonial, index) => (
                  <motion.div
                    key={`${testimonial.name}-${index}`}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.07 }}
                    className={`${sectionCardClass} p-7 hover:-translate-y-1 hover:border-primary/25 transition-all`}
                  >
                    <div className="flex gap-1 mb-5">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/90 italic leading-relaxed mb-5">
                      "{testimonial.text}"
                    </p>
                    <p className="text-sm font-bold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedBlock>
        );
      case "process":
        return (
          <AnimatedBlock key={sectionId} className="px-6 sm:px-12 py-20 lg:py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase text-center mb-3">
                {sectionMicroLabels.process}
              </p>
              <h2 className="text-3xl lg:text-5xl font-bold text-center tracking-tight mb-12" style={sectionHeadingStyle}>
                {processSectionTitle}
              </h2>

              <div className="grid md:grid-cols-3 gap-5">
                {processSteps.slice(0, 3).map((step, index) => (
                  <motion.div
                    key={`${step.title}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className={`${compactCardClass} text-center`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center mx-auto mb-5 text-lg font-bold text-primary">
                      {step.step || index + 1}
                    </div>
                    <p className="text-lg font-bold mb-2">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedBlock>
        );
      case "reassurance":
        return (
          <AnimatedBlock key={sectionId} className="px-6 sm:px-12 py-20 lg:py-24 bg-secondary/25">
            <div className="max-w-6xl mx-auto">
              <div className={sectionCardClass}>
                <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase mb-3">
                  {sectionMicroLabels.reassurance}
                </p>
                <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4" style={sectionHeadingStyle}>
                  {reassuranceTitle}
                </h2>
                <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-8">
                  {reassuranceContent}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {reassuranceItems.slice(0, 4).map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className={`${compactCardClass} flex items-start gap-3`}
                    >
                      <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground/90 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedBlock>
        );
      case "local_seo":
        return (
          <AnimatedBlock key={sectionId} className="px-6 sm:px-12 py-20 lg:py-24 bg-secondary/20">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
              <div className={sectionCardClass}>
                <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase mb-3">
                  {sectionMicroLabels.local}
                </p>
                <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4" style={sectionHeadingStyle}>
                  {localSeoTitle}
                </h2>
                <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                  {localSeoContent}
                </p>
              </div>
              <div className="grid gap-4">
                {(localSeoItems.length ? localSeoItems : content.metadata?.differentiators || [])
                  .slice(0, 4)
                  .map((item, index) => (
                    <motion.div
                      key={`${item}-${index}`}
                      initial={{ opacity: 0, x: 16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.07 }}
                      className={`${compactCardClass} p-6`}
                    >
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                        {sectionMicroLabels.localSignal}
                      </p>
                      <p className="text-base font-semibold leading-relaxed">{item}</p>
                    </motion.div>
                  ))}
              </div>
            </div>
          </AnimatedBlock>
        );
      case "faq":
        return (
          <AnimatedBlock key={sectionId} id="faq" className="px-6 sm:px-12 py-20 lg:py-24 bg-secondary/35">
            <div className="max-w-4xl mx-auto">
              <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase text-center mb-3">
                {sectionMicroLabels.faq}
              </p>
              <h2 className="text-3xl lg:text-5xl font-bold text-center tracking-tight mb-10" style={sectionHeadingStyle}>
                {faqSectionTitle}
              </h2>

              <div className="space-y-3">
                {faqItems.map((faq, index) => (
                  <div
                    key={`${faq.question}-${index}`}
                    className={`${compactCardClass} overflow-hidden p-0`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-medium">{faq.question}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          openFaq === index ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {openFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="px-5 pb-5"
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AnimatedBlock>
        );
      case "final_cta":
        return (
          <section key={sectionId} id="contact" className="px-6 sm:px-12 py-20 lg:py-24">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
              <AnimatedBlock className={`${mediaFrameClass} shadow-xl shadow-black/10`}>
                <img
                  src={getGalleryImage(2)}
                  alt={`${site.business_name} contact`}
                  className="h-full min-h-[340px] w-full object-cover"
                  loading="lazy"
                />
              </AnimatedBlock>

              <AnimatedBlock delay={0.05} className={sectionCardClass}>
                <p className="text-[10px] font-semibold text-primary tracking-[0.22em] uppercase mb-3">
                  {sectionMicroLabels.finalCta}
                </p>
                <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4" style={sectionHeadingStyle}>
                  {content.ctaTitle}
                </h2>
                <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-8">
                  {content.ctaSubtitle || "Passez a l'action maintenant avec un echange simple et rapide."}
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {contactEmail && (
                    <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                        Email
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        {contactEmail}
                      </p>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                        Telephone
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        {contactPhone}
                      </p>
                    </div>
                  )}
                  {!contactEmail && !contactPhone && (
                    <div className="rounded-2xl border border-border bg-secondary/35 p-4 sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                        Contact
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {wantsWhatsAppAction ? (
                          <Phone className="w-4 h-4 text-primary" />
                        ) : (
                          <Mail className="w-4 h-4 text-primary" />
                        )}
                        {wantsWhatsAppAction ? "Message direct sur WhatsApp" : "Utilisez le bouton de contact"}
                      </p>
                    </div>
                  )}
                  {site.city && (
                    <div className="rounded-2xl border border-border bg-secondary/35 p-4 sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                        Zone d'intervention
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {site.city}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={primaryContactHref}
                    className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground text-base font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform"
                  >
                    <Mail className="w-4 h-4" />
                    {ctaText}
                  </a>
                  <a
                    href={resolvedPublicSlug ? publicUrl : previewUrl}
                    className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full border border-border text-base font-medium text-foreground/90 hover:border-primary/30 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {actionLinkLabel}
                  </a>
                </div>
              </AnimatedBlock>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={rootBackgroundClass}
      style={customStyle}
    >
      <SEOHead
        title={previewSeoTitle}
        description={previewSeoDescription}
        canonical={canonicalUrl}
        noIndex={!isPublicSurface || site.status !== "published"}
        keywords={seoKeywords}
        jsonLd={site.status === "published" ? schemaJsonLd : undefined}
        ogImage={content.visuals?.hero?.url || visuals.hero}
        ogType="website"
      />
      {!isEmbeddedPreview && (
        <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex items-center gap-3">
              <a
                href={rootHomeUrl}
                className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                Pixelrises
              </a>
              <span className="w-px h-4 bg-border flex-shrink-0" />
              <span className="text-sm font-bold truncate">{site.business_name}</span>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                title="Partager"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Partager</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                title="Exporter"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exporter</span>
              </button>
              {site.status === "published" && site.slug && (
                <a
                  href={publicUrl}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                  title="Ouvrir le lien public"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lien public
                </a>
              )}
              <a
                href={rootAiUrl}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Creer le mien</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.28),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--background)/0.98),hsl(var(--card)/0.82),hsl(var(--primary)/0.20))]" />
        <div className={heroSpacingClass}>
          <div className={heroGridClass}>
            <AnimatedBlock className="max-w-3xl">
              <p className="text-[11px] font-semibold text-primary tracking-[0.28em] uppercase mb-5">
                {heroEyebrow}
              </p>
              <h1
                className={`text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.96] ${heroTitleTrackingClass} mb-6`}
                style={{ fontFamily: headingFontFamily }}
              >
                {content.heroTitle}
              </h1>
              <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl lg:mb-10 lg:text-2xl">
                {content.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <a
                  href="#contact"
                  className={`inline-flex items-center justify-center gap-2 h-14 px-8 ${primaryButtonShapeClass} bg-primary text-primary-foreground text-base font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform`}
                >
                  <ChevronRight className="w-5 h-5" />
                  {ctaText}
                </a>
                <a
                  href="#services"
                  className={`inline-flex items-center justify-center gap-2 h-14 px-8 ${primaryButtonShapeClass} border border-white/10 bg-white/5 text-base font-medium text-foreground/90 hover:border-primary/30 hover:bg-white/8 transition-colors`}
                >
                  {secondaryCtaText}
                </a>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {trustBadges
                  .slice(0, 4)
                  .map((badge, index) => (
                    <span
                      key={`${badge}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-foreground/80"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      {badge}
                    </span>
                  ))}
              </div>
            </AnimatedBlock>

            <AnimatedBlock delay={0.08} className="relative">
              <div className={mediaFrameClass}>
                <img
                  src={visuals.hero}
                  alt={site.business_name}
                  className={mediaImageClass}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                <div className="absolute top-5 left-5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80 backdrop-blur-md">
                  {visualDirectionLabel}
                </div>
                <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:bottom-5 sm:left-5 sm:right-5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/12 bg-black/40 p-4 backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 mb-2">
                      {sectionMicroLabels.heroNote}
                    </p>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {heroPromiseText}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-black/40 p-4 backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 mb-2">
                      Pour qui
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {content.metadata?.targetAudience
                        ? `${content.metadata.targetAudience}, avec des preuves concretes et une prochaine etape simple.`
                        : `${site?.business_type || "Cette offre"} avec des preuves concretes et une prochaine etape simple.`}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedBlock>
          </div>
        </div>
      </section>
      {orderedContentSections.map((sectionId) => renderContentSection(sectionId))}

      {isPrivatePreview && !isEmbeddedPreview ? (
        <section className="px-4 py-14 sm:px-8 sm:py-16 lg:px-12">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[30px] border border-primary/20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_38%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--background)))] p-6 shadow-2xl shadow-black/20 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Preview prete
                </p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl" style={sectionHeadingStyle}>
                  Ton site est pret
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Active-le pour le mettre en ligne et commencer a attirer des clients.
                </p>

                <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3">
                    <Shield className="h-4 w-4 text-primary" />
                    Paiement securise
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Aucun credit debite si echec
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3">
                    <Eye className="h-4 w-4 text-primary" />
                    Site utilisable immediatement
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <a
                  href={publishActivationUrl}
                  className="group rounded-[24px] border border-primary/30 bg-primary p-5 text-primary-foreground shadow-xl shadow-primary/20 transition hover:scale-[1.01] hover:shadow-primary/30"
                >
                  <span className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-lg font-bold">Publier mon site</span>
                      <span className="mt-1 block text-sm opacity-85">
                        Paiement unique - acces immediat
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </span>
                </a>

                <a
                  href={subscriptionActivationUrl}
                  className="group rounded-[24px] border border-border bg-card p-5 text-foreground transition hover:border-primary/30 hover:bg-secondary/40"
                >
                  <span className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-lg font-bold">
                        Creer plusieurs sites chaque mois
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Ideal si tu veux en creer regulierement
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-primary transition group-hover:translate-x-0.5" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="bg-card border-t border-border px-4 py-10 sm:px-12">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8">
          <div>
            <p className="text-sm font-bold mb-2">{site.business_name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {content.footerTagline ||
                `${site.business_type || "Activite"}${site.city ? ` a ${site.city}` : ""}.`}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Navigation
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              {navigationLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Pixelrises
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href={rootHomeUrl} className="block hover:text-foreground transition-colors">
                Accueil
              </a>
              <a href={rootAiUrl} className="block hover:text-foreground transition-colors">
                Creer un site
              </a>
              <a href={publicUrl} className="block hover:text-foreground transition-colors">
                {site.status === "published" ? "Lien public" : "Preview du site"}
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border text-center">
          <p className="text-[10px] text-muted-foreground">
            Copyright {new Date().getFullYear()} {site.business_name}. Tous droits reserves. Site cree avec{" "}
            <a href={rootHomeUrl} className="text-primary hover:underline">
              Pixelrises
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Preview;
