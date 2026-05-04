import type { NormalizedAIOutput } from "./types";

const requiredSectionFallback = {
  id: "hero",
  type: "hero",
  title: "Une présence professionnelle prête à convertir",
  subtitle: "Pixelrises transforme votre idée en base business claire, crédible et actionnable.",
  content: "Une structure pensée pour rassurer, expliquer l'offre et guider vers le bon CTA.",
  cta: {
    label: "Démarrer",
    action: "#contact",
  },
  items: [],
  media: [],
  layout: "split-premium",
};

export const createEmptyAIOutput = (): NormalizedAIOutput => ({
  meta: {
    businessName: "Nouveau business",
    niche: "business",
    goal: "presence_professionnelle",
    targetAudience: "clients potentiels",
    tier: "premium",
    style: "moderne",
    language: "fr",
  },
  brand: {
    name: "Nouveau business",
    tagline: "Une présence claire, crédible et prête à convertir.",
    colors: ["#050505", "#F5C542", "#FFFFFF"],
    fonts: ["Sora", "Inter"],
    tone: "clair, premium, rassurant",
  },
  pages: [
    {
      slug: "/",
      title: "Accueil",
      sections: [requiredSectionFallback],
    },
  ],
  seo: {
    title: "Site professionnel créé avec Pixelrises",
    description: "Une présence professionnelle claire, crédible et orientée conversion.",
    keywords: [],
    localKeywords: [],
  },
  business: {
    offer: "Offre à clarifier",
    valueProposition: "Une base professionnelle pour développer votre activité.",
    pricingSuggestion: "À définir selon le positionnement.",
    mainCTA: "Demander un devis",
    leadCapture: "Formulaire de contact ou prise de rendez-vous",
    trustElements: ["Avis", "Garanties", "Méthode", "Exemples"],
  },
  conversion: {
    primaryGoal: "générer des demandes qualifiées",
    ctaStrategy: "Un CTA principal visible dans le hero et répété en fin de page.",
    objections: ["Manque de confiance", "Offre peu claire", "Pas assez de preuves"],
    proofElements: ["Témoignages", "Résultats", "Méthode", "FAQ"],
    recommendedSections: ["Hero", "Services", "Preuves", "FAQ", "CTA final"],
  },
  design: {
    style: "dark premium",
    layoutDirection: "sections aérées avec cartes sobres",
    spacing: "généreux",
    radius: "large",
    visualMood: "premium, business, rassurant",
    components: ["Hero", "ServiceCard", "ProofCard", "CTA", "FAQ"],
  },
  recommendations: [],
});

export const validateAIOutput = (input: Partial<NormalizedAIOutput> | null | undefined) => {
  const fallback = createEmptyAIOutput();
  const output = {
    ...fallback,
    ...(input ?? {}),
    meta: { ...fallback.meta, ...(input?.meta ?? {}) },
    brand: { ...fallback.brand, ...(input?.brand ?? {}) },
    seo: { ...fallback.seo, ...(input?.seo ?? {}) },
    business: { ...fallback.business, ...(input?.business ?? {}) },
    conversion: { ...fallback.conversion, ...(input?.conversion ?? {}) },
    design: { ...fallback.design, ...(input?.design ?? {}) },
  };

  output.pages = Array.isArray(input?.pages) && input.pages.length > 0 ? input.pages : fallback.pages;
  output.pages = output.pages.map((page, pageIndex) => ({
    slug: page.slug || (pageIndex === 0 ? "/" : `/page-${pageIndex + 1}`),
    title: page.title || "Page",
    sections:
      Array.isArray(page.sections) && page.sections.length > 0
        ? page.sections.map((section, sectionIndex) => ({
            ...requiredSectionFallback,
            ...section,
            id: section.id || `section-${sectionIndex + 1}`,
            cta: {
              ...requiredSectionFallback.cta,
              ...(section.cta ?? {}),
            },
            items: Array.isArray(section.items) ? section.items : [],
            media: Array.isArray(section.media) ? section.media : [],
          }))
        : [requiredSectionFallback],
  }));

  output.recommendations = Array.isArray(input?.recommendations) ? input.recommendations : [];
  output.seo.keywords = Array.isArray(output.seo.keywords) ? output.seo.keywords : [];
  output.seo.localKeywords = Array.isArray(output.seo.localKeywords) ? output.seo.localKeywords : [];
  output.business.trustElements = Array.isArray(output.business.trustElements)
    ? output.business.trustElements
    : fallback.business.trustElements;

  return output;
};
