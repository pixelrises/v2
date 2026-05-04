import { buildPixelrisesRootUrl } from "@/lib/published-site";

export interface PortfolioProject {
  title: string;
  category: string;
  link: string;
  image: string;
  description: string;
  descriptionEn: string;
  impact: string;
  impactEn: string;
  resultLabel: string;
  resultLabelEn: string;
  resultValue: string;
  badges: string[];
}

export const portfolioProjects: PortfolioProject[] = [
  {
    title: "Luxe Immobilier",
    category: "Immobilier",
    link: buildPixelrisesRootUrl("/s/luxeimmobilier"),
    image: "/projects/luxeimmobilier.webp",
    description: "Site premium pour une agence immobilière de prestige",
    descriptionEn: "Premium image for a prestigious real estate agency",
    impact:
      "Renforce l'image haut de gamme et rassure les vendeurs exigeants dès la première visite.",
    impactEn:
      "Creates a more premium image and reassures demanding sellers from the first visit.",
    resultLabel: "Crédibilité perçue",
    resultLabelEn: "Perceived credibility",
    resultValue: "Image premium renforcée",
    badges: ["Design premium", "Conversion"],
  },
  {
    title: "CoachFit",
    category: "Sport",
    link: buildPixelrisesRootUrl("/s/coachfit"),
    image: "/projects/coachfit.webp",
    description: "Site clair pour un coach sportif",
    descriptionEn: "Lead generation for a sports coach",
    impact:
      "Clarifie l'offre, valorise l'accompagnement et facilite la prise de rendez-vous.",
    impactEn:
      "Clarifies the offer, drives bookings, and turns more traffic into inquiries.",
    resultLabel: "Demandes qualifiées",
    resultLabelEn: "Qualified inquiries",
    resultValue: "Plus de leads",
    badges: ["Mobile first", "Conversion"],
  },
  {
    title: "Élégance Salon",
    category: "Beauté",
    link: buildPixelrisesRootUrl("/s/elegant-salon"),
    image: "/projects/elegant-salon.webp",
    description: "Réservation en ligne pour un salon premium",
    descriptionEn: "Online booking for a premium hair salon",
    impact:
      "Valorise l'expérience en salon et facilite les réservations sans friction.",
    impactEn: "Highlights the experience and makes booking frictionless.",
    resultLabel: "Réservations",
    resultLabelEn: "Bookings",
    resultValue: "Plus de rendez-vous",
    badges: ["Design premium", "SEO optimisé"],
  },
  {
    title: "Luxe Events",
    category: "Événementiel",
    link: buildPixelrisesRootUrl("/s/luxe-events"),
    image: "/projects/luxe-events.webp",
    description: "Site haut de gamme pour une agence événementielle",
    descriptionEn: "High-end image for an event agency",
    impact:
      "Renforce la désirabilité de l'offre et aide à vendre des prestations plus premium.",
    impactEn:
      "Increases offer desirability and helps sell a more premium service.",
    resultLabel: "Image de marque",
    resultLabelEn: "Brand image",
    resultValue: "Positionnement fort",
    badges: ["Conversion", "Design premium"],
  },
  {
    title: "Voyages Paris",
    category: "Tourisme",
    link: buildPixelrisesRootUrl("/s/agence-voyage"),
    image: "/projects/agence-voyage.webp",
    description: "Réservations et devis pour une agence de voyage",
    descriptionEn: "Booking and quotes for a travel agency",
    impact:
      "Rassure rapidement et guide les visiteurs vers la demande de devis ou la réservation.",
    impactEn:
      "Builds trust quickly and guides visitors toward quotes or booking.",
    resultLabel: "Visibilité locale",
    resultLabelEn: "Local visibility",
    resultValue: "Plus de devis",
    badges: ["SEO optimisé", "Mobile first"],
  },
  {
    title: "Agence Marketing",
    category: "Marketing",
    link: buildPixelrisesRootUrl("/s/agence-marketing"),
    image: "/projects/agence-marketing.webp",
    description: "Crédibilité et demandes qualifiées pour une agence digitale",
    descriptionEn: "Credibility and leads for a digital agency",
    impact:
      "Aide l'agence à paraître plus solide et à convertir plus facilement ses prospects.",
    impactEn:
      "Helps the agency look more solid and convert prospects more easily.",
    resultLabel: "Nouveaux clients",
    resultLabelEn: "New clients",
    resultValue: "Offre plus claire",
    badges: ["Conversion", "Site rapide"],
  },
  {
    title: "Paysagiste Paris",
    category: "Services",
    link: buildPixelrisesRootUrl("/s/paysagiste"),
    image: "/projects/paysagiste.webp",
    description: "Devis et visibilité locale pour un paysagiste professionnel",
    descriptionEn: "Quotes and visibility for a professional landscaper",
    impact:
      "Inspire confiance aux prospects locaux et simplifie la demande de devis.",
    impactEn:
      "Builds trust with local prospects and simplifies quote requests.",
    resultLabel: "Demandes locales",
    resultLabelEn: "Local inquiries",
    resultValue: "Plus de devis",
    badges: ["SEO optimisé", "Conversion"],
  },
  {
    title: "TechStore Paris",
    category: "Tech",
    link: buildPixelrisesRootUrl("/s/tech"),
    image: "/projects/tech.webp",
    description: "Site lisible pour un magasin informatique",
    descriptionEn: "High-performance site for a computer store",
    impact:
      "Rend l'offre plus lisible et améliore la perception du service.",
    impactEn:
      "Makes the offer easier to understand and improves service perception.",
    resultLabel: "Visibilité produit",
    resultLabelEn: "Product visibility",
    resultValue: "Offre plus claire",
    badges: ["SEO optimisé", "Mobile first"],
  },
  {
    title: "DéménagePro",
    category: "Services",
    link: buildPixelrisesRootUrl("/s/demenagepro"),
    image: "/projects/demenagepro.webp",
    description: "Demandes de devis pour un service de déménagement",
    descriptionEn: "Lead generation for a moving service",
    impact:
      "Réduit la friction dans le parcours et augmente les demandes de contact.",
    impactEn:
      "Removes friction from the journey and increases contact requests.",
    resultLabel: "Contacts entrants",
    resultLabelEn: "Inbound contacts",
    resultValue: "Plus de demandes",
    badges: ["Conversion", "Site rapide"],
  },
  {
    title: "La Table d'Or",
    category: "Restauration",
    link: buildPixelrisesRootUrl("/s/restaurant"),
    image: "/projects/restaurant.webp",
    description: "Site premium pour un restaurant gastronomique",
    descriptionEn: "Premium image for a gourmet restaurant",
    impact:
      "Installe une ambiance forte et encourage davantage la réservation.",
    impactEn: "Projects a strong atmosphere and drives more reservations.",
    resultLabel: "Réservations",
    resultLabelEn: "Reservations",
    resultValue: "Plus de réservations",
    badges: ["Design premium", "Mobile first"],
  },
  {
    title: "Studio Photo",
    category: "Créatif",
    link: buildPixelrisesRootUrl("/s/photographe"),
    image: "/projects/photographe.webp",
    description: "Portfolio élégant pour un photographe professionnel",
    descriptionEn: "Elegant portfolio for a professional photographer",
    impact:
      "Valorise les visuels et renforce la confiance avant la prise de contact.",
    impactEn:
      "Highlights visuals and strengthens trust before contact.",
    resultLabel: "Crédibilité créative",
    resultLabelEn: "Creative credibility",
    resultValue: "Image plus forte",
    badges: ["SEO optimisé", "Design premium"],
  },
  {
    title: "Danse Studio",
    category: "Éducation",
    link: buildPixelrisesRootUrl("/s/danse-school"),
    image: "/projects/danse-school.webp",
    description: "Inscriptions en ligne pour une école de danse",
    descriptionEn: "Online registration for a dance school",
    impact:
      "Clarifie l'offre et facilite les inscriptions en ligne.",
    impactEn:
      "Explains the offer better and makes online enrollment easier.",
    resultLabel: "Inscriptions",
    resultLabelEn: "Registrations",
    resultValue: "Parcours plus simple",
    badges: ["Conversion", "Mobile first"],
  },
  {
    title: "Dr. Sourire",
    category: "Santé",
    link: buildPixelrisesRootUrl("/s/caring"),
    image: "/projects/caring.webp",
    description: "Confiance et crédibilité pour un cabinet dentaire",
    descriptionEn: "Trust and credibility for a dental practice",
    impact:
      "Rassure dès les premières secondes et facilite la prise de rendez-vous.",
    impactEn:
      "Builds trust from the first seconds and helps trigger appointment requests.",
    resultLabel: "Confiance immédiate",
    resultLabelEn: "Immediate trust",
    resultValue: "Réassurance forte",
    badges: ["SEO optimisé", "Site rapide"],
  },
  {
    title: "Médical",
    category: "Santé",
    link: buildPixelrisesRootUrl("/s/medical"),
    image: "/projects/medical.webp",
    description: "Positionnement clair et rassurant pour une activité médicale",
    descriptionEn: "Reassuring and clear positioning for a medical activity",
    impact:
      "Simplifie la compréhension de l'offre et renforce le sérieux perçu.",
    impactEn:
      "Simplifies offer understanding and strengthens perceived seriousness.",
    resultLabel: "Lisibilité",
    resultLabelEn: "Clarity",
    resultValue: "Message plus net",
    badges: ["Crédibilité", "Conversion"],
  },
  {
    title: "Auto-École Paris",
    category: "Éducation",
    link: buildPixelrisesRootUrl("/s/auto-ecole"),
    image: "/projects/auto-ecole.webp",
    description: "Inscriptions et visibilité locale pour une auto-école",
    descriptionEn: "Registration and visibility for a driving school",
    impact:
      "Aide les futurs élèves à comprendre l'offre et à passer à l'action plus vite.",
    impactEn:
      "Helps future students understand the offer and act faster.",
    resultLabel: "Visibilité locale",
    resultLabelEn: "Local visibility",
    resultValue: "Plus d'inscriptions",
    badges: ["Conversion", "Mobile first"],
  },
];
