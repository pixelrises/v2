import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle, MessageCircle, Sparkles } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { useTranslation } from "@/i18n/useTranslation";

const WHATSAPP_LINK = "https://wa.me/33775256214?text=Bonjour,%20j'ai%20une%20question.";

const FAQ = () => {
  const { t, locale } = useTranslation();
  const isFr = locale === "fr";

  const faqs = isFr
    ? [
        {
          question: "Le diagnostic est-il vraiment gratuit ?",
          answer:
            "Oui, totalement. Notre outil d'analyse est gratuit et sans engagement. Il vous donne une recommandation personnalisée en 2 minutes.",
        },
        {
          question: "Quels sont les délais de livraison ?",
          answer:
            "Selon la complexité du projet : 2 à 4 jours pour l'offre Essentiel, 4 à 7 jours pour Professionnel. La mise en ligne se fait après votre validation.",
        },
        {
          question: "L'hébergement est-il obligatoire ?",
          answer:
            "Non. Le site vous est livré avec un paiement unique. L'hébergement premium à 29€/mois est facultatif et inclut maintenance, sauvegardes et support prioritaire.",
        },
        {
          question: "Suis-je obligé de finaliser après le diagnostic ?",
          answer:
            "Non. Le diagnostic est là pour vous donner de la clarté. Vous êtes libre de ne pas donner suite. Zéro pression.",
        },
        {
          question: "Le paiement est-il sécurisé ?",
          answer:
            "Oui. Les paiements passent par un prestataire de paiement sécurisé. Vos données bancaires ne passent jamais par nos serveurs.",
        },
        {
          question: "Qu'est-ce que le SEO inclus ?",
          answer:
            "Balises Title et Meta descriptions optimisées, hiérarchie H1-H2-H3 structurée, URLs propres, indexation Google et performance mobile optimisée.",
        },
        {
          question: "Et si le résultat ne me convient pas ?",
          answer:
            "Nous offrons une garantie satisfait ou remboursé. Nous travaillons avec vous jusqu'à ce que le site vous convienne parfaitement.",
        },
      ]
    : [
        {
          question: "Is the diagnostic really free?",
          answer:
            "Yes, completely. Our analysis tool is free with no commitment. It gives you a personalized recommendation in 2 minutes.",
        },
        {
          question: "What are the delivery times?",
          answer:
            "Depending on complexity: 2-4 days for the Essential plan, 4-7 days for Professional. Launch happens after your approval.",
        },
        {
          question: "Is hosting mandatory?",
          answer:
            "No. The site is delivered with a one-time payment. Premium hosting at €29/month is optional and includes maintenance, backups, and priority support.",
        },
        {
          question: "Am I obligated after the diagnostic?",
          answer: "No. The diagnostic gives you clarity. You're free not to proceed. Zero pressure.",
        },
        {
          question: "Is payment secure?",
          answer:
            "Yes. Payments are handled by a secure payment provider. Your banking details never pass through our servers.",
        },
        {
          question: "What does basic SEO include?",
          answer:
            "Optimized Title and Meta tags, structured H1-H2-H3 hierarchy, clean URLs, Google indexing, and optimized mobile performance.",
        },
        {
          question: "What if I'm not satisfied?",
          answer:
            "We offer a satisfied-or-refunded guarantee. We work with you until the site is perfect.",
        },
      ];

  return (
    <section className="landing-section" id="faq">
      <div className="landing-section-inner z-10">
        <AnimatedSection>
          <div className="landing-section-header">
            <span className="landing-eyebrow">
              <Sparkles className="h-3 w-3" />
              {t("faq.badge")}
            </span>
            <h2 className="landing-title">{t("faq.title")}</h2>
            <p className="landing-copy max-w-xl">
              {isFr
                ? "Tout ce que vous devez savoir avant de vous lancer."
                : "Everything you need to know before getting started."}
            </p>
          </div>
        </AnimatedSection>

        <div className="premium-shell mx-auto max-w-4xl p-4 sm:p-5">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AnimatedSection key={faq.question} delay={index * 0.05}>
                <AccordionItem
                  value={`item-${index}`}
                  className="landing-card group border border-border px-5 transition-all duration-500 data-[state=open]:border-primary/30 data-[state=open]:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.18)]"
                >
                  <AccordionTrigger className="py-5 text-left text-sm hover:no-underline group-data-[state=open]:text-primary sm:text-[15px] [&[data-state=open]>svg]:text-primary">
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 transition-all duration-300 group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                        <HelpCircle className="h-3.5 w-3.5 text-primary group-data-[state=open]:text-primary-foreground" />
                      </span>
                      <span className="font-medium">{faq.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-10 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </AnimatedSection>
            ))}
          </Accordion>
        </div>

        <AnimatedSection delay={0.4}>
          <div className="mt-12 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              {isFr ? "Encore une question ?" : "Still have a question?"}
            </p>
            <Button asChild size="lg" className="glow-primary btn-hover-lift">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                {isFr ? "Nous contacter" : "Contact us"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FAQ;
