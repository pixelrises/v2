import { Link } from "react-router-dom";
import type { ElementType } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderKanban,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";

type CardItem = {
  title: string;
  description: string;
  icon: ElementType;
  href?: string;
  cta?: string;
  tag?: string;
};

const aiSpaces: CardItem[] = [
  {
    title: "General AI",
    description: "Découvrir, réfléchir, analyser, résumer et débloquer tout type de demande.",
    icon: Brain,
    href: "/espace-ia/general-ai",
    cta: "Découvrir",
  },
  {
    title: "Business AI",
    description: "Offres, stratégies, ventes, marketing, business plan et relation client.",
    icon: Briefcase,
    href: "/espace-ia/business-ai",
    cta: "Découvrir",
  },
  {
    title: "Student AI",
    description: "Cours, révisions, fiches, quiz, devoirs, exposés et organisation étudiante.",
    icon: GraduationCap,
    href: "/espace-ia/student-ai",
    cta: "Découvrir",
  },
  {
    title: "Creator AI",
    description: "Contenus, scripts, posts, visuels, idées et storytelling préparatoire.",
    icon: Palette,
    href: "/espace-ia/creator-ai",
    cta: "Découvrir",
  },
  {
    title: "Management AI",
    description: "Projets, tâches, organisation, suivi, productivité et prise de décision.",
    icon: BarChart3,
    href: "/espace-ia/management-ai",
    cta: "Découvrir",
  },
  {
    title: "Enterprise AI",
    description: "Équipes, workflows, process, support et usages avancés pour entreprises.",
    icon: LayoutDashboard,
    href: "/espace-ia/enterprise-ai",
    cta: "Découvrir",
  },
];

const builderCards: CardItem[] = [
  {
    title: "Site & App Builder",
    description:
      "Créez des sites, landing pages et applications web modernes avec preview, amélioration par prompt et statuts honnêtes.",
    icon: Wand2,
    href: "/builder/site",
    cta: "Créer un site",
    tag: "Design + SEO",
  },
  {
    title: "Game Builder",
    description:
      "Préparez des jeux 2D/3D, quiz, mini-jeux et prototypes interactifs avec score, progression et limites claires.",
    icon: Gamepad2,
    href: "/builder/game",
    cta: "Créer un jeu",
    tag: "Prototype",
  },
  {
    title: "Agent Builder",
    description:
      "Créez vos agents IA personnalisés avec mission, limites, permissions, test chat et validation humaine.",
    icon: Bot,
    href: "/builder/agent",
    cta: "Créer un agent",
    tag: "Contrôlé",
  },
];

const agentCards: CardItem[] = [
  {
    title: "Agent SEO",
    description: "Recherche, audit et optimisation.",
    icon: Search,
  },
  {
    title: "Agent Support",
    description: "Répond aux questions et escalade.",
    icon: MessageSquare,
  },
  {
    title: "Agent SAV",
    description: "Gère les demandes et le suivi client.",
    icon: UserCheck,
  },
  {
    title: "Agent Business",
    description: "Analyse, stratégie et recommandations.",
    icon: BarChart3,
  },
  {
    title: "Agent Étudiant",
    description: "Aide aux devoirs, révisions et quiz.",
    icon: GraduationCap,
  },
  {
    title: "Agent Contenu",
    description: "Rédige, structure et améliore vos idées.",
    icon: FileText,
  },
  {
    title: "Agent Gestion",
    description: "Organise tâches, projets et priorités.",
    icon: FolderKanban,
  },
  {
    title: "Agent sur mesure",
    description: "À créer selon votre workflow.",
    icon: Sparkles,
  },
];

const organizationCards: CardItem[] = [
  {
    title: "Projets",
    description: "Centralisez tous vos projets au même endroit.",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    title: "Analytics",
    description: "Suivez vos performances et vos résultats.",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    title: "Automatisations",
    description: "Préparez des workflows IA avec validation humaine.",
    icon: Workflow,
    href: "/automations",
  },
  {
    title: "Crédits",
    description: "Gérez votre usage et votre consommation.",
    icon: CreditCard,
    href: "/credits",
  },
];

const workflowSteps = [
  {
    title: "Choisissez un espace IA",
    description: "Sélectionnez l'espace adapté à votre besoin.",
    icon: Brain,
  },
  {
    title: "Décrivez votre projet",
    description: "Expliquez clairement ce que vous voulez obtenir.",
    icon: FileText,
  },
  {
    title: "Choisissez Direct ou Plan",
    description: "Lancez directement ou préparez d'abord un plan.",
    icon: FolderKanban,
  },
  {
    title: "Validez les résultats",
    description: "Contrôlez et ajustez si nécessaire.",
    icon: ShieldCheck,
  },
  {
    title: "Générez votre projet",
    description: "Site, app, contenu, image, jeu ou agent.",
    icon: Rocket,
  },
  {
    title: "Améliorez en continu",
    description: "Itérez et passez au niveau supérieur.",
    icon: Zap,
  },
];

const faqItems = [
  {
    question: "Qu'est-ce que l'Espace IA Pixelrises ?",
    answer:
      "C'est la page publique qui présente le cockpit IA : espaces spécialisés, builders, agents contrôlés, organisation et dashboard démo.",
  },
  {
    question: "Quelles sont les 6 espaces IA disponibles ?",
    answer:
      "General AI, Business AI, Student AI, Creator AI, Management AI et Enterprise AI.",
  },
  {
    question: "Comment fonctionnent les crédits ?",
    answer:
      "Les crédits servent à cadrer l'usage IA. Les actions sensibles et les coûts doivent rester visibles et contrôlés.",
  },
  {
    question: "Qu'est-ce que le Mode Plan ?",
    answer:
      "Le Mode Plan prépare une stratégie, une structure ou une checklist avant l'exécution pour éviter les actions floues.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "La page publique n'affiche aucun secret. Les actions sensibles doivent rester protégées et validées par l'utilisateur.",
  },
  {
    question: "Puis-je tester sans compte ?",
    answer:
      "Oui, le dashboard démo permet de voir l'interface sans connexion et sans droits d'action réelle.",
  },
];

const AILanding = () => {
  return (
    <div id="ai-overview" className="relative overflow-hidden">
      <section className="landing-section">
        <div className="landing-section-inner">
          <SectionHeader
            eyebrow="Un espace pour chaque besoin"
            title="Chaque IA a un rôle clair, chaque module a une destination."
            description="Pixelrises évite le cockpit flou : l'utilisateur choisit son besoin, puis avance avec le bon espace, le bon builder ou le bon agent."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {aiSpaces.map((space, index) => (
              <AnimatedSection key={space.title} delay={index * 0.04}>
                <Link
                  to={space.href ?? "/ai-spaces"}
                  className="group flex h-full min-h-[230px] flex-col rounded-[26px] border border-white/10 bg-white/[0.035] p-5 text-center transition hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/10"
                >
                  <IconBadge icon={space.icon} className="mx-auto" />
                  <h3 className="mt-5 text-lg font-black text-white">{space.title}</h3>
                  <p className="mt-3 flex-1 text-xs leading-6 text-white/58">{space.description}</p>
                  <span className="mt-4 inline-flex items-center justify-center gap-2 text-xs font-black text-primary">
                    {space.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <SectionHeader
            eyebrow="Créez avec des builders puissants"
            title="Passez de l'idée au prototype visible."
            description="Les builders sont pensés pour demander, voir, modifier et améliorer sans promettre de publication non prouvée."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {builderCards.map((builder, index) => (
              <AnimatedSection key={builder.title} delay={index * 0.06}>
                <Link
                  to={builder.href ?? "/dashboard-demo"}
                  className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-[32px] border border-primary/16 bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-black p-7 transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="absolute -bottom-16 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
                  <div className="relative flex items-start justify-between gap-4">
                    <IconBadge icon={builder.icon} />
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                      {builder.tag}
                    </span>
                  </div>
                  <h3 className="relative mt-7 text-2xl font-black text-primary">{builder.title}</h3>
                  <p className="relative mt-4 flex-1 text-sm leading-7 text-white/64">{builder.description}</p>
                  <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-black text-primary">
                    {builder.cta}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <SectionHeader
            eyebrow="Travaillez avec des agents IA contrôlés"
            title="Une équipe IA, mais jamais hors de contrôle."
            description="Les agents aident à analyser, proposer, rédiger et organiser. Toute action sensible reste guidée par validation humaine."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agentCards.map((agent, index) => (
              <AnimatedSection key={agent.title} delay={index * 0.03}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <IconBadge icon={agent.icon} compact />
                  <div>
                    <h3 className="text-sm font-black text-white">{agent.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-white/55">{agent.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <SectionHeader
            eyebrow="Organisez, analysez et automatisez"
            title="Le cockpit IA est relié à votre espace de travail."
            description="Les modules publics montrent les destinations principales sans activer d'intégration externe non validée."
          />
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {organizationCards.map((item, index) => (
                <AnimatedSection key={item.title} delay={index * 0.04}>
                  <Link
                    to={item.href ?? "/dashboard-demo"}
                    className="group flex h-full min-h-[170px] flex-col rounded-[26px] border border-white/10 bg-white/[0.035] p-5 transition hover:border-primary/35 hover:bg-primary/10"
                  >
                    <IconBadge icon={item.icon} compact />
                    <h3 className="mt-5 text-lg font-black text-primary">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-white/58">{item.description}</p>
                    <ArrowRight className="mt-4 h-4 w-4 text-primary transition group-hover:translate-x-1" />
                  </Link>
                </AnimatedSection>
              ))}
            </div>
            <AnimatedSection delay={0.08}>
              <div className="relative flex h-full min-h-[360px] flex-col justify-between overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary/14 via-white/[0.04] to-black p-7">
                <div className="absolute -bottom-16 -right-12 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
                <span className="landing-eyebrow w-fit">
                  <FolderKanban className="h-3 w-3" />
                  Mode Direct / Mode Plan
                </span>
                <div className="relative mt-8 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                    <h3 className="text-xl font-black text-white">Mode Direct</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      Pour générer vite quand la demande est claire.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/25 bg-primary/10 p-5">
                    <h3 className="text-xl font-black text-primary">Mode Plan</h3>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      Pour analyser le besoin, préparer les étapes et valider avant exécution.
                    </p>
                  </div>
                </div>
                <Button asChild className="relative mt-8 w-fit rounded-2xl font-black">
                  <Link to="/dashboard-demo">
                    Tester le mode démo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <SectionHeader
            eyebrow="Comment ça marche ?"
            title="Un parcours simple, lisible et contrôlé."
            description="L'utilisateur comprend ce qu'il fait, ce que l'IA prépare, et quand il doit valider."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {workflowSteps.map((step, index) => (
              <AnimatedSection key={step.title} delay={index * 0.04}>
                <div className="h-full rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-black text-black">
                      {index + 1}
                    </span>
                    <IconBadge icon={step.icon} compact />
                  </div>
                  <h3 className="text-base font-black text-white">{step.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-white/56">{step.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <AnimatedSection>
            <div className="premium-shell grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/40 p-4">
                <DashboardDemoMockup />
              </div>
              <div className="flex flex-col justify-center">
                <span className="landing-eyebrow w-fit">
                  <LayoutDashboard className="h-3 w-3" />
                  Dashboard démo
                </span>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Essayez le cockpit sans connexion obligatoire.
                </h2>
                <p className="mt-5 text-sm leading-7 text-white/62 sm:text-base">
                  Le dashboard démo permet de voir l'interface comme un vrai espace, mais sans droits d'action réelle. Idéal pour tester la vision Pixelrises avant de créer un compte.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {["6 espaces", "3 builders", "Actions protégées"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-primary">
                      {item}
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-8 w-fit rounded-2xl font-black">
                  <Link to="/dashboard-demo">
                    Tester le dashboard démo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <SectionHeader
            eyebrow="Questions fréquentes"
            title="Les réponses essentielles avant de tester."
            description="La page reste publique, claire et séparée du système interne."
          />
          <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-2">
            {faqItems.map((faq, index) => (
              <AnimatedSection key={faq.question} delay={index * 0.03}>
                <details className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-white">
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      {faq.question}
                    </span>
                    <span className="text-primary transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 pl-7 text-sm leading-7 text-white/58">{faq.answer}</p>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-[36px] border border-primary/20 bg-gradient-to-br from-primary/18 via-white/[0.04] to-black p-7 text-center shadow-[0_38px_120px_-70px_hsl(var(--primary)/0.7)] sm:p-10">
              <div className="absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[70px]" />
              <Sparkles className="relative mx-auto h-10 w-10 text-primary" />
              <h2 className="relative mx-auto mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                Prêt à transformer vos idées avec l'IA ?
              </h2>
              <p className="relative mx-auto mt-5 max-w-2xl text-base leading-8 text-white/64">
                Rejoignez Pixelrises et accédez à votre espace IA complet dès maintenant, en gardant les actions sensibles sous contrôle.
              </p>
              <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 w-full rounded-2xl px-7 text-base font-black sm:h-14 sm:w-auto">
                  <Link to="/dashboard-demo">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-2xl border-primary/30 px-7 text-base font-black sm:h-14 sm:w-auto"
                >
                  <Link to="/pricing">Voir les tarifs</Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

const SectionHeader = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <AnimatedSection>
    <div className="landing-section-header">
      <span className="landing-eyebrow">
        <Sparkles className="h-3 w-3" />
        {eyebrow}
      </span>
      <h2 className="landing-title">{title}</h2>
      <p className="landing-copy max-w-2xl">{description}</p>
    </div>
  </AnimatedSection>
);

const IconBadge = ({
  icon: Icon,
  compact = false,
  className = "",
}: {
  icon: ElementType;
  compact?: boolean;
  className?: string;
}) => (
  <span
    className={`${className} grid ${compact ? "h-10 w-10 rounded-2xl" : "h-14 w-14 rounded-[22px]"} place-items-center border border-primary/25 bg-primary/10 text-primary shadow-[0_0_35px_-16px_hsl(var(--primary))]`}
  >
    <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} />
  </span>
);

const DashboardDemoMockup = () => (
  <div className="rounded-[22px] border border-white/10 bg-[#080808] p-3 shadow-2xl">
    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-xs font-black uppercase tracking-[0.14em] text-white">Pixelrises</span>
      </div>
      <span className="rounded-full border border-primary/20 px-2 py-1 text-[10px] font-black text-primary">Démo</span>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[0.45fr_1fr]">
      <div className="grid gap-2">
        {["Dashboard", "Espace IA", "Builders", "Agents", "Crédits"].map((item, index) => (
          <div
            key={item}
            className={`rounded-xl px-3 py-2 text-[10px] font-black ${index === 1 ? "bg-primary/10 text-primary" : "bg-white/[0.035] text-white/55"}`}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="grid gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
          <p className="text-xs font-black text-white">Bonjour, prêt à créer ?</p>
          <div className="mt-3 rounded-xl bg-black/45 px-3 py-2 text-[10px] text-white/45">Décrivez votre besoin...</div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["General", "Business", "Student", "Creator"].map((item) => (
            <div key={item} className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 text-center text-[10px] font-black text-white/65">
              <Sparkles className="mx-auto mb-2 h-4 w-4 text-primary" />
              {item}
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs font-black text-primary">Mode Plan prêt</div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 text-xs font-black text-white/65">Actions verrouillées</div>
        </div>
      </div>
    </div>
  </div>
);

export default AILanding;
