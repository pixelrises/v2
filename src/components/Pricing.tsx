import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesParticles } from "@/components/ui/sparkles";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const WHATSAPP_LINK = "https://wa.me/33775256214";

type View = "service" | "ai" | "maintenance";

type PricingCard = {
  name: string;
  price: string;
  badge?: string;
  summary?: string;
  result?: string;
  subtitle?: string;
  volume?: string;
  link: string;
  featured?: boolean;
  features: string[];
};

const Pricing = () => {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [view, setView] = useState<View>("service");

  const servicePlans: PricingCard[] = [
    {
      name: "Essentiel",
      price: "490",
      badge: isFr ? "Pour d\u00E9marrer vite" : "Fast start",
      summary: isFr
        ? "Une pr\u00E9sence simple, propre et cr\u00E9dible pour mettre l'activit\u00E9 en ligne rapidement."
        : "A simple, clean and credible presence to launch your business online quickly.",
      result: isFr
        ? "Id\u00E9al pour une premi\u00E8re version s\u00E9rieuse."
        : "Ideal for a solid first version.",
      link: "https://buy.stripe.com/eVqaEZgHHeF9d6v5qpaZi0k",
      features: isFr
        ? [
            "1 page forte, claire et mobile",
            "Message business structur\u00E9",
            "Contact / devis / prise de rendez-vous",
            "Mise en ligne rapide",
          ]
        : [
            "1 strong mobile-ready page",
            "Structured business messaging",
            "Contact / quote / booking CTA",
            "Fast launch",
          ],
    },
    {
      name: "Professionnel",
      price: "790",
      badge: isFr ? "Le meilleur \u00E9quilibre" : "Best balance",
      summary: isFr
        ? "L'offre la plus forte pour vendre mieux, rassurer vite et donner une image plus premium."
        : "The strongest package to sell better, build trust faster and feel more premium.",
      result: isFr
        ? "Le bon choix pour attirer de vrais clients."
        : "The right choice to attract real clients.",
      link: "https://buy.stripe.com/8x200l3UVdB56I7065aZi0j",
      featured: true,
      features: isFr
        ? [
            "3 \u00E0 5 pages coh\u00E9rentes",
            "Structure orient\u00E9e conversion",
            "Sections preuve sociale + CTA",
            "Base SEO + image plus haut de gamme",
          ]
        : [
            "3 to 5 coherent pages",
            "Conversion-oriented structure",
            "Social proof + CTA sections",
            "SEO foundation + stronger premium feel",
          ],
    },
    {
      name: "Premium",
      price: "1190",
      badge: isFr ? "Positionnement fort" : "Strong positioning",
      summary: isFr
        ? "Pour un site plus ambitieux, plus premium et plus diff\u00E9renciant."
        : "For a more ambitious, premium and differentiated website.",
      result: isFr
        ? "Parfait pour asseoir une image d'autorit\u00E9."
        : "Perfect to build authority.",
      link: "https://buy.stripe.com/bJe00l4YZ9kP3vV1a9aZi0i",
      features: isFr
        ? [
            "Site sur-mesure plus pouss\u00E9",
            "Hi\u00E9rarchie visuelle premium",
            "Exp\u00E9rience plus diff\u00E9renciante",
            "Base pr\u00EAte \u00E0 scaler ensuite",
          ]
        : [
            "More advanced custom website",
            "Premium visual hierarchy",
            "More differentiated experience",
            "Ready-to-scale foundation",
          ],
    },
  ];

  const aiPlans: PricingCard[] = [
    {
      name: "Starter",
      price: "13",
      badge: isFr ? "Lien public Pixelrises" : "Pixelrises public link",
      volume: isFr ? "10 cr\u00E9dits" : "10 credits",
      summary: isFr
        ? "Pour publier vite sur un lien public Pixelrises et valider votre message."
        : "Publish quickly on a Pixelrises public link and validate your message.",
      link: "https://buy.stripe.com/7sYbJ3dvveF90jJf0ZaZi0q",
      features: isFr
        ? [
            "Cr\u00E9er, pr\u00E9visualiser et publier seul",
            "\u00C9dition manuelle dans le dashboard",
            "Publication sur un lien public Pixelrises",
            "Parfait pour tester la qualit\u00E9",
          ]
        : [
            "Create, preview and publish on your own",
            "Manual editing from the dashboard",
            "Publish on a Pixelrises public link",
            "Perfect to test quality",
          ],
    },
    {
      name: "Pro",
      price: "25",
      badge: isFr ? "Offre recommand\u00E9e" : "Recommended",
      volume: isFr ? "25 cr\u00E9dits" : "25 credits",
      summary: isFr
        ? "Le meilleur plan pour it\u00E9rer, am\u00E9liorer vos pages et lancer un vrai rythme."
        : "The best plan to iterate, improve pages and launch a real cadence.",
      link: "https://buy.stripe.com/7sYdRbcrrcx1d6vdWVaZi0r",
      featured: true,
      features: isFr
        ? [
            "Plus de cr\u00E9ations et d'optimisations",
            "Export HTML",
            "Domaine personnalis\u00E9 inclus",
            "Le plan le plus logique pour progresser vite",
          ]
        : [
            "More creations and optimizations",
            "HTML export",
            "Custom domain included",
            "The smartest plan to move faster",
          ],
    },
    {
      name: "Business",
      price: "49",
      badge: isFr ? "Pour scaler" : "Scale",
      volume: isFr ? "60 cr\u00E9dits" : "60 credits",
      summary: isFr
        ? "Pour g\u00E9rer plusieurs projets avec un rythme intensif et plus d'autonomie."
        : "For multiple projects with an intensive pace and more autonomy.",
      link: "https://buy.stripe.com/eVq28t4YZ54z6I71a9aZi0s",
      features: isFr
        ? [
            "Production fr\u00E9quente",
            "Plusieurs projets en parall\u00E8le",
            "Domaine personnalis\u00E9 inclus",
            "Pens\u00E9 pour ceux qui lancent souvent",
          ]
        : [
            "Frequent production",
            "Multiple parallel projects",
            "Custom domain included",
            "Made for teams launching often",
          ],
    },
  ];

  const maintenancePlans: PricingCard[] = [
    {
      name: isFr ? "Maintenance Premium" : "Premium Maintenance",
      price: "29",
      subtitle: isFr ? "1 site en d\u00E9l\u00E9gation" : "1 delegated site",
      summary: isFr
        ? "Pour garder un site d\u00E9l\u00E9gu\u00E9 stable, rapide et suivi sans friction."
        : "Keep a delegated site stable, fast and monitored without friction.",
      link: "https://buy.stripe.com/14A3cx8bbdB59Uj9GFaZi08",
      features: isFr
        ? [
            "Uniquement pour un site r\u00E9alis\u00E9 par d\u00E9l\u00E9gation",
            "H\u00E9bergement haute performance",
            "Surveillance et s\u00E9curit\u00E9",
            "Sauvegardes automatiques",
          ]
        : [
            "Only for a delegated website",
            "High-performance hosting",
            "Monitoring and security",
            "Automatic backups",
          ],
    },
    {
      name: isFr ? "Maintenance Ultra" : "Ultra Maintenance",
      price: "45",
      subtitle: isFr ? "2 sites en d\u00E9l\u00E9gation" : "2 delegated sites",
      summary: isFr
        ? "La solution la plus sereine pour g\u00E9rer plusieurs sites livr\u00E9s par Pixelrises."
        : "The calmest way to manage several websites delivered by Pixelrises.",
      link: "https://buy.stripe.com/9B6bJ3bnncx19Uj7yxaZi0h",
      featured: true,
      features: isFr
        ? [
            "Uniquement pour des sites r\u00E9alis\u00E9s par d\u00E9l\u00E9gation",
            "2 sites inclus",
            "Support prioritaire",
            "Optimisation continue",
          ]
        : [
            "Only for delegated websites",
            "2 sites included",
            "Priority support",
            "Continuous optimization",
          ],
    },
  ];

  const tabs = [
    { key: "service" as const, label: isFr ? "D\u00E9l\u00E9guer" : "Delegation" },
    { key: "ai" as const, label: isFr ? "Cr\u00E9er seul" : "Self-serve" },
    { key: "maintenance" as const, label: isFr ? "Maintenance" : "Maintenance" },
  ];

  const activeCards = view === "service" ? servicePlans : view === "ai" ? aiPlans : maintenancePlans;
  const columnsClass = view === "maintenance" ? "md:grid-cols-2 max-w-4xl" : "md:grid-cols-3 max-w-6xl";

  const headerCopy = useMemo(() => {
    if (view === "service") {
      return {
        title: isFr ? "Des offres pens\u00E9es pour vendre vite" : "Plans designed to sell fast",
        text: isFr
          ? "Choisissez entre d\u00E9l\u00E9guer compl\u00E8tement, avancer seul avec Pixelrises ou s\u00E9curiser l'exploitation de vos sites livr\u00E9s."
          : "Choose between full delegation, moving on your own with Pixelrises or securing operations for delivered sites.",
      };
    }

    if (view === "ai") {
      return {
        title: isFr ? "Cr\u00E9er, am\u00E9liorer, publier" : "Create, improve, publish",
        text: isFr
          ? "Le mode autonome Pixelrises est fait pour lancer vite, it\u00E9rer et garder un tunnel simple."
          : "Pixelrises self-serve mode is built to launch fast, iterate and keep the funnel simple.",
      };
    }

    return {
      title: isFr ? "Maintenance pour les sites d\u00E9l\u00E9gu\u00E9s" : "Maintenance for delegated sites",
      text: isFr
        ? "Cette maintenance concerne uniquement les sites r\u00E9alis\u00E9s par d\u00E9l\u00E9gation avec Pixelrises."
        : "This maintenance only applies to websites delivered through Pixelrises delegation.",
    };
  }, [isFr, view]);

  const reassurance = [
    isFr ? "Paiement clair, sans tunnel compliqu\u00E9" : "Clear checkout, no messy funnel",
    isFr ? "Objectif : publier et convertir, pas complexifier" : "Built to publish and convert, not to complicate",
    isFr ? "Le plan Pro reste l'offre la plus logique pour la majorit\u00E9" : "Pro remains the smartest default for most users",
  ];

  return (
    <section id="tarifs" className="relative overflow-hidden py-24 text-white sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:72px_72px] opacity-10" />
        <div className="absolute left-1/2 top-0 h-[720px] w-[720px] -translate-x-1/2 rounded-full border-[120px] border-primary/16 blur-[120px]" />
        <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/6 blur-[140px]" />
        <SparklesParticles
          density={900}
          speed={0.6}
          size={1.1}
          color="#f6d15a"
          opacity={0.28}
          className="absolute inset-x-0 top-0 h-[520px] w-full [mask-image:radial-gradient(65%_65%_at_50%_30%,white,transparent_80%)]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.22),rgba(5,5,5,0.34)_28%,rgba(5,5,5,0.52)_62%,rgba(5,5,5,0.72))]" />
      </div>

      <div className="container relative z-10 mx-auto px-5">
        <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/80 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {isFr ? "Offres Pixelrises" : "Pixelrises pricing"}
            </span>

            <h2 className="mx-auto mt-8 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {headerCopy.title}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              {headerCopy.text}
            </p>

            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-white/55">
              {isFr
                ? "Nouveaux comptes : cr\u00E9dits offerts pour tester la qualit\u00E9, la preview et la publication avant de passer en rythme payant."
                : "New accounts: free credits to test quality, preview and publishing before moving into paid usage."}
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.08}>
          <div className="mt-10 flex justify-center">
            <div className="relative z-10 mx-auto flex w-fit rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className={cn(
                    "relative z-10 h-11 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.18em] transition-colors sm:px-6",
                    view === tab.key ? "text-white" : "text-white/65 hover:text-white",
                  )}
                >
                  {view === tab.key && (
                    <motion.span
                      layoutId="pricing-switch"
                      className="absolute inset-0 rounded-full border border-primary/60 bg-gradient-to-t from-primary to-[hsl(var(--primary-light))] shadow-[0_0_40px_-8px_hsl(var(--primary)_/_0.75)]"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <div className={cn("mx-auto mt-14 grid gap-5", columnsClass)}>
          <AnimatePresence mode="wait">
            {activeCards.map((card, index) => (
              <motion.div
                key={`${view}-${card.name}`}
                initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
                className={cn(
                  "relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-neutral-900 via-neutral-900 to-black p-7 shadow-[0_18px_60px_-28px_rgba(0,0,0,0.7)]",
                  card.featured &&
                    "border-primary/35 bg-[radial-gradient(circle_at_top,hsl(var(--primary)_/_0.18),transparent_48%),linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,1))] shadow-[0_-8px_140px_-45px_hsl(var(--primary)_/_0.55)]",
                )}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <CardHeader className="space-y-0 p-0 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-medium tracking-tight">{card.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">
                        {card.summary || card.subtitle || card.volume}
                      </p>
                    </div>
                    {card.badge && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-7 flex items-end gap-2">
                    <span className="text-4xl font-semibold">{card.price}</span>
                    <span className="pb-1 text-lg text-white/55">€</span>
                    <span className="pb-1 text-xs uppercase tracking-[0.16em] text-white/40">
                      {view === "service"
                        ? isFr
                          ? "paiement unique"
                          : "one-time"
                        : isFr
                          ? "/mois"
                          : "/month"}
                    </span>
                  </div>

                  {(card.result || card.volume || card.subtitle) && (
                    <p className="mt-3 text-sm font-medium text-primary">
                      {card.result || card.volume || card.subtitle}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-0 pt-7">
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "h-12 w-full rounded-2xl text-sm font-semibold",
                      card.featured
                        ? "bg-gradient-to-t from-primary to-[hsl(var(--primary-light))] text-primary-foreground shadow-lg shadow-[0_20px_50px_-18px_hsl(var(--primary)_/_0.65)]"
                        : "border border-primary/20 bg-gradient-to-t from-neutral-950 to-neutral-800 text-white hover:border-primary/35 hover:bg-neutral-900",
                    )}
                    variant={card.featured ? "default" : "outline"}
                  >
                    <a href={card.link} target="_blank" rel="noopener noreferrer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      {isFr ? "Choisir cette offre" : "Choose this plan"}
                    </a>
                  </Button>

                  <div className="mt-7 border-t border-white/10 pt-6">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/90">
                      <Star className="h-4 w-4 text-primary" />
                      {view === "service"
                        ? isFr
                          ? "Ce que vous obtenez"
                          : "What you get"
                        : isFr
                          ? "Inclus dans l'offre"
                          : "Included in the plan"}
                    </div>
                    <ul className="space-y-3">
                      {card.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/14">
                            <Check className="h-3 w-3 text-primary" />
                          </span>
                          <span className="text-sm text-white/68">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-7 flex flex-col gap-3">
                    <Button asChild variant="ghost" className="justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-white/80 hover:bg-white/10 hover:text-white">
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                        <span className="inline-flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {isFr ? "En parler sur WhatsApp" : "Discuss on WhatsApp"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatedSection delay={0.14}>
          <div className="mx-auto mt-14 grid max-w-4xl gap-4 rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:grid-cols-3 sm:p-7">
            {reassurance.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/14">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-white/68">{item}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.18}>
          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/65">
              <Star className="h-3.5 w-3.5 text-primary" />
              {isFr ? "Pro reste l'offre la plus logique pour la majorité" : "Pro remains the smartest default for most users"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/65">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {isFr ? "Pixelrises sert \u00E0 lancer vite, pas \u00E0 compliquer" : "Pixelrises is built to launch fast, not to complicate"}
            </span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Pricing;


