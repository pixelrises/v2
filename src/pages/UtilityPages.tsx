import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  LifeBuoy,
  LockKeyhole,
  Map,
  PlugZap,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InterfaceModeToggle } from "@/components/v2/InterfaceModeToggle";
import { ActionTile, ClientSafeNotice, HeroPanel } from "@/components/v2/Phase9UI";
import { V2PageShell } from "@/components/v2/V2PageShell";
import { builderTools, type BuilderToolId } from "@/lib/builder-tools";

type UtilityPageId =
  | "notifications"
  | "support"
  | "supportRequest"
  | "profile"
  | "security"
  | "roadmap"
  | "integrationDocs"
  | "customConnector"
  | "webhooks"
  | "workspace";

type UtilityCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  cta?: string;
};

type UtilityConfig = {
  eyebrow: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  cards: UtilityCard[];
  checklist: string[];
  footerNote?: string;
};

const utilityConfigs: Record<UtilityPageId, UtilityConfig> = {
  notifications: {
    eyebrow: "Centre de suivi",
    title: "Notifications",
    description: "Les alertes importantes, sans bruit inutile.",
    heroTitle: "Une notification doit aider à décider.",
    heroDescription: "Pixelrises affiche uniquement les événements utiles : création terminée, validation requise, erreur propre ou action à reprendre.",
    primaryAction: { label: "Voir le dashboard", href: "/dashboard" },
    secondaryAction: { label: "Préférences", href: "/settings" },
    cards: [
      { title: "Actions à reprendre", description: "Une création interrompue, un export prêt ou une validation nécessaire.", icon: Bell, href: "/projects", cta: "Voir mes projets" },
      { title: "Sécurité", description: "Une action sensible reste bloquée tant qu'elle n'est pas validée.", icon: ShieldCheck, href: "/security", cta: "Voir les règles" },
      { title: "Aide", description: "Si une page ne répond pas, ouvrir une demande support avec le contexte utile.", icon: LifeBuoy, href: "/support/new", cta: "Demander de l'aide" },
    ],
    checklist: ["Pas de mot de passe demandé.", "Pas de détail technique brut.", "Une alerte = une action claire."],
  },
  support: {
    eyebrow: "Aide",
    title: "Centre support",
    description: "Aide claire pour débloquer un usage produit, un bug ou une question de sécurité.",
    heroTitle: "Décrire le problème, obtenir la prochaine action.",
    heroDescription: "Le support Pixelrises collecte le module, l'action tentée et l'impact utilisateur. Il ne demande jamais d'information sensible.",
    primaryAction: { label: "Créer une demande", href: "/support/new" },
    secondaryAction: { label: "Documentation intégrations", href: "/automations/integrations/docs" },
    cards: [
      { title: "Bug ou erreur", description: "Explique ce qui bloque et sur quelle page.", icon: LifeBuoy, href: "/support/new?type=bug", cta: "Signaler" },
      { title: "Question produit", description: "Comprendre un builder, un agent, un export ou une intégration.", icon: FileText, href: "/support/new?type=product", cta: "Poser une question" },
      { title: "Sécurité", description: "Doute sur une donnée, une action externe ou une permission.", icon: LockKeyhole, href: "/support/new?type=security", cta: "Sécuriser" },
    ],
    checklist: ["Ne jamais envoyer de mot de passe.", "Masquer toute information privée inutile.", "Ajouter une capture ou un contexte seulement si nécessaire."],
  },
  supportRequest: {
    eyebrow: "Support",
    title: "Nouvelle demande",
    description: "Un formulaire support simple et sûr.",
    heroTitle: "Que veux-tu résoudre ?",
    heroDescription: "Choisis une catégorie, décris l'action tentée et indique ce que tu voulais obtenir. Pixelrises garde les demandes courtes et exploitables.",
    primaryAction: { label: "Retour support", href: "/support" },
    secondaryAction: { label: "Voir mes projets", href: "/projects" },
    cards: [
      { title: "1. Catégorie", description: "Bug, question produit, sécurité, compte ou facturation.", icon: FileText },
      { title: "2. Contexte", description: "Page concernée, action tentée, résultat attendu.", icon: Map },
      { title: "3. Envoi contrôlé", description: "Aucune donnée sensible n'est requise pour ouvrir une demande.", icon: ShieldCheck },
    ],
    checklist: ["Décrire le problème en une phrase.", "Ajouter la page concernée.", "Ne jamais coller de clé, mot de passe ou donnée bancaire."],
    footerNote: "L'envoi réel sera relié au support connecté en phase finale. Pour l'instant, cette page structure la demande sans action externe automatique.",
  },
  profile: {
    eyebrow: "Compte",
    title: "Profil",
    description: "Profil, préférences et espace principal.",
    heroTitle: "Ton espace Pixelrises, sans complexité.",
    heroDescription: "Gère ton mode d'interface, ton espace IA préféré, tes préférences de confidentialité et les raccourcis vers les projets.",
    primaryAction: { label: "Retour dashboard", href: "/dashboard" },
    secondaryAction: { label: "Paramètres", href: "/settings" },
    cards: [
      { title: "Mode d'interface", description: "Simple par défaut, avancé si tu veux plus de contrôle.", icon: SlidersHorizontal },
      { title: "Espace IA préféré", description: "Business, General, Student, Creator, Management ou Enterprise.", icon: UserCircle, href: "/ai-spaces", cta: "Choisir" },
      { title: "Confidentialité", description: "Les actions sensibles demandent validation.", icon: ShieldCheck, href: "/security", cta: "Voir" },
    ],
    checklist: ["Mode simple recommandé au lancement.", "Profil prêt pour persistance future côté compte.", "Aucun identifiant sensible affiché."],
  },
  security: {
    eyebrow: "Sécurité",
    title: "Sécurité & confidentialité",
    description: "Les règles simples qui protègent l'utilisateur et le produit.",
    heroTitle: "Rien de sensible sans validation.",
    heroDescription: "Pixelrises masque les détails techniques, bloque les actions externes et affiche des erreurs compréhensibles.",
    primaryAction: { label: "Paramètres", href: "/settings" },
    secondaryAction: { label: "Support sécurité", href: "/support/new?type=security" },
    cards: [
      { title: "Données protégées", description: "Aucune information privée inutile dans les écrans client.", icon: LockKeyhole },
      { title: "Validation humaine", description: "Publication, envoi, connexion externe ou suppression restent confirmés.", icon: ShieldCheck },
      { title: "Erreurs propres", description: "Le client voit une explication simple, jamais une erreur brute.", icon: CheckCircle2 },
    ],
    checklist: ["Pas de clé affichée.", "Pas d'action externe automatique.", "Pas de détail technique côté client."],
  },
  roadmap: {
    eyebrow: "Roadmap",
    title: "Roadmap",
    description: "Ce qui avance maintenant et ce qui reste pour la finalisation publique.",
    heroTitle: "Phase 9 : rendre Pixelrises clair, premium et sûr.",
    heroDescription: "Cette phase finalise l'expérience client. La validation production, le paiement final et les audits live restent pour la Phase 11.",
    primaryAction: { label: "Voir les projets", href: "/projects" },
    secondaryAction: { label: "Dashboard", href: "/dashboard" },
    cards: [
      { title: "Maintenant", description: "Simplifier, harmoniser, relier les boutons, masquer la technique.", icon: Zap },
      { title: "Ensuite", description: "QA production, permissions, monitoring, domaine final.", icon: Map },
      { title: "Toujours", description: "Stabilité, sécurité, données honnêtes et actions utiles.", icon: ShieldCheck },
    ],
    checklist: ["Pas de lancement public déclaré avant audit final.", "Pas de migration live automatique.", "Pas de paiement ou crédit modifié en Phase 9."],
  },
  integrationDocs: {
    eyebrow: "Documentation",
    title: "Documentation intégrations",
    description: "Comprendre les statuts, permissions et tests sans exposer les coulisses.",
    heroTitle: "Connecter proprement, tester avant d'activer.",
    heroDescription: "Chaque intégration indique son usage, ses permissions, son statut et les validations nécessaires.",
    primaryAction: { label: "Retour intégrations", href: "/integrations" },
    secondaryAction: { label: "Créer un connecteur", href: "/automations/connectors/new" },
    cards: [
      { title: "Statuts", description: "Connecté, à configurer, bêta, bientôt, bloqué ou dry-run.", icon: CheckCircle2 },
      { title: "Permissions", description: "Ce qui est lu, préparé ou proposé avant toute activation.", icon: ShieldCheck },
      { title: "Test", description: "Un brouillon doit être testé avant activation.", icon: Workflow, href: "/automations/webhooks", cta: "Tester" },
    ],
    checklist: ["Aucun connecteur actif sans consentement.", "Aucun envoi réel sans validation.", "Aucun identifiant sensible dans l'interface."],
  },
  customConnector: {
    eyebrow: "Connecteur",
    title: "Créer un connecteur sécurisé",
    description: "Préparer un connecteur métier avec permissions et test en brouillon.",
    heroTitle: "Un connecteur doit être compréhensible avant d'être actif.",
    heroDescription: "Définis l'événement, la destination, les permissions et la validation humaine requise. Les identifiants sensibles restent hors interface client.",
    primaryAction: { label: "Tester en brouillon", href: "/automations/webhooks" },
    secondaryAction: { label: "Documentation", href: "/automations/integrations/docs" },
    cards: [
      { title: "Événement", description: "Exemple : nouveau lead, site généré, projet créé.", icon: Zap },
      { title: "Destination", description: "Outil cible à configurer après consentement.", icon: PlugZap },
      { title: "Validation", description: "Bloquer toute action externe sensible par défaut.", icon: ShieldCheck },
    ],
    checklist: ["Nommer l'usage métier.", "Lister les permissions.", "Tester sans action réelle.", "Activer seulement après validation."],
  },
  webhooks: {
    eyebrow: "Webhooks",
    title: "Webhooks",
    description: "Créer et tester des flux sans action externe automatique.",
    heroTitle: "Tester en brouillon avant activation.",
    heroDescription: "Un webhook Pixelrises se configure en 3 étapes : événement, destination, test. Rien n'est envoyé réellement sans validation.",
    primaryAction: { label: "Créer un connecteur", href: "/automations/connectors/new" },
    secondaryAction: { label: "Automatisations", href: "/automations" },
    cards: [
      { title: "1. Choisir événement", description: "Projet créé, site généré, lead reçu ou action demandée.", icon: Zap },
      { title: "2. Choisir destination", description: "Outil ou connecteur à configurer avec consentement.", icon: Webhook },
      { title: "3. Tester", description: "Dry-run obligatoire avant toute activation.", icon: CheckCircle2 },
    ],
    checklist: ["Pas d'URL sensible affichée.", "Pas d'identifiant dans les logs client.", "Activation uniquement après test et confirmation."],
  },
  workspace: {
    eyebrow: "Workspace",
    title: "Espace de travail",
    description: "Vue simple pour reprendre la création.",
    heroTitle: "Un endroit pour retrouver projets, builders et IA.",
    heroDescription: "Le workspace centralise les accès rapides sans transformer l'interface en cockpit technique.",
    primaryAction: { label: "Créer", href: "/create" },
    secondaryAction: { label: "Mes projets", href: "/projects" },
    cards: [
      { title: "Créer", description: "Site, agent IA, jeu ou projet digital.", icon: Zap, href: "/create", cta: "Démarrer" },
      { title: "Améliorer", description: "Reprendre un projet existant.", icon: Workflow, href: "/projects", cta: "Ouvrir" },
      { title: "Analyser", description: "Voir les signaux utiles et prochaines actions.", icon: FileText, href: "/analytics", cta: "Analyser" },
    ],
    checklist: ["Pas de détail interne.", "Actions reliées à de vraies pages.", "Mode simple par défaut."],
  },
};

const builderToolDetails: Record<BuilderToolId, UtilityConfig> = {
  analytics: {
    eyebrow: "Builder",
    title: "Analytique builder",
    description: "Signaux utiles pour décider quoi améliorer.",
    heroTitle: "Voir uniquement ce qui aide à avancer.",
    heroDescription: "Cette page relie le builder aux vues Analytics sans afficher de détails internes. Les chiffres absents restent indiqués comme absents.",
    primaryAction: { label: "Ouvrir Analytics", href: "/analytics" },
    secondaryAction: { label: "Retour Site Builder", href: "/builder/site" },
    cards: [
      { title: "Signaux clés", description: "Vues, clics, leads et conversion si la collecte est disponible.", icon: FileText, href: "/analytics", cta: "Voir" },
      { title: "Priorité", description: "Une recommandation concrète plutôt qu'une liste de graphiques.", icon: Zap, href: "/analytics", cta: "Prioriser" },
      { title: "Données honnêtes", description: "Aucune métrique absente n'est présentée comme réelle.", icon: ShieldCheck },
    ],
    checklist: ["Données réelles si disponibles.", "Exemple marqué comme exemple.", "Aucun chiffre inventé."],
  },
  cloud: {
    eyebrow: "Builder",
    title: "Cloud",
    description: "Sauvegarde et synchronisation, avec statut clair.",
    heroTitle: "Sauvegarder sans faire croire à une publication.",
    heroDescription: "Le builder indique si le projet est sauvegardé, en brouillon ou à reprendre. La mise en ligne reste séparée et validée.",
    primaryAction: { label: "Voir mes projets", href: "/projects" },
    secondaryAction: { label: "Retour builder", href: "/builder/site" },
    cards: [
      { title: "Brouillon", description: "Conserver le travail avant publication.", icon: FileText, href: "/projects", cta: "Ouvrir" },
      { title: "Versions", description: "Chaque amélioration importante doit rester restaurable.", icon: Workflow },
      { title: "Validation", description: "Aucune publication automatique depuis ce panneau.", icon: ShieldCheck },
    ],
    checklist: ["Sauvegarde visible.", "Publication séparée.", "Retour arrière prévu."],
  },
  code: {
    eyebrow: "Builder",
    title: "Code",
    description: "Export code en préparation contrôlée.",
    heroTitle: "Exporter seulement quand le rendu est stable.",
    heroDescription: "L'export code reste une option avancée. En Phase 9, le panneau explique le statut sans exposer la mécanique interne.",
    primaryAction: { label: "Exporter depuis le builder", href: "/builder/site" },
    secondaryAction: { label: "Documentation", href: "/support" },
    cards: [
      { title: "Export structuré", description: "Préparer une sortie exploitable quand la fonctionnalité est prête.", icon: FileText },
      { title: "Aperçu d'abord", description: "Valider la preview avant tout export.", icon: CheckCircle2, href: "/builder/site", cta: "Prévisualiser" },
      { title: "Bientôt", description: "Le code avancé reste désactivé tant que la QA finale n'est pas terminée.", icon: LockKeyhole },
    ],
    checklist: ["Pas de code présenté comme final sans test.", "Pas d'identifiant sensible affiché.", "Export avancé réservé au mode connaisseur."],
    footerNote: "Cette zone prépare l'export. Elle ne modifie pas le déploiement et ne publie rien automatiquement.",
  },
  folders: {
    eyebrow: "Builder",
    title: "Dossiers",
    description: "Organisation simple des projets.",
    heroTitle: "Retrouver vite ce qui a été créé.",
    heroDescription: "Les projets, builders et versions restent accessibles depuis une vue claire, sans panneau technique.",
    primaryAction: { label: "Mes projets", href: "/projects" },
    secondaryAction: { label: "Workspace", href: "/workspace" },
    cards: [
      { title: "Projets", description: "Sites, agents et jeux sauvegardés.", icon: FileText, href: "/projects", cta: "Ouvrir" },
      { title: "Workspace", description: "Reprendre une création ou lancer un nouveau builder.", icon: Workflow, href: "/workspace", cta: "Reprendre" },
      { title: "Versions", description: "Conserver un historique propre quand il existe.", icon: CheckCircle2 },
    ],
    checklist: ["Destination réelle.", "Pas de dossier fantôme.", "Organisation progressive."],
  },
  payments: {
    eyebrow: "Builder",
    title: "Paiements",
    description: "Options commerciales à configurer, aucune action sensible.",
    heroTitle: "Préparer la vente sans toucher au paiement.",
    heroDescription: "Cette page sert à cadrer les futurs blocs commerciaux. Elle ne modifie aucun paiement, abonnement ou crédit.",
    primaryAction: { label: "Paramètres", href: "/settings" },
    secondaryAction: { label: "Retour builder", href: "/builder/site" },
    cards: [
      { title: "À configurer", description: "Les options de paiement restent désactivées tant qu'elles ne sont pas validées.", icon: LockKeyhole },
      { title: "Offre", description: "Préparer les textes et CTA commerciaux dans le site.", icon: FileText, href: "/builder/site", cta: "Modifier" },
      { title: "Validation", description: "Aucune transaction et aucun abonnement ne sont modifiés ici.", icon: ShieldCheck },
    ],
    checklist: ["Aucune action paiement.", "Aucun prix sensible modifié.", "Validation spéciale requise plus tard."],
  },
  security: {
    eyebrow: "Builder",
    title: "Sécurité builder",
    description: "Garde-fous visibles et action humaine obligatoire.",
    heroTitle: "Créer vite, valider avant toute action sensible.",
    heroDescription: "Les builders peuvent proposer, améliorer et exporter. Les actions sensibles restent confirmées par l'utilisateur.",
    primaryAction: { label: "Sécurité", href: "/security" },
    secondaryAction: { label: "Support sécurité", href: "/support/new?type=security" },
    cards: [
      { title: "Validation", description: "Publication, suppression, connexion externe ou envoi demandent confirmation.", icon: ShieldCheck },
      { title: "Erreurs propres", description: "Un problème est expliqué simplement, sans détail brut.", icon: CheckCircle2 },
      { title: "Contrôle", description: "L'utilisateur garde la décision finale.", icon: LockKeyhole },
    ],
    checklist: ["Pas d'identifiant sensible affiché.", "Pas d'action externe automatique.", "Aucun détail interne côté client."],
  },
  seo: {
    eyebrow: "Builder",
    title: "SEO & recherche IA",
    description: "Actions SEO utiles sans jargon inutile.",
    heroTitle: "Améliorer la visibilité avec des actions concrètes.",
    heroDescription: "Pixelrises guide les titres, descriptions, FAQ et signaux locaux quand les données sont disponibles. Les sources limitées restent indiquées.",
    primaryAction: { label: "Améliorer dans Site Builder", href: "/builder/site" },
    secondaryAction: { label: "Voir Analytics", href: "/analytics" },
    cards: [
      { title: "SEO local", description: "Ville, zone, FAQ et CTA cohérents si le brief les fournit.", icon: Map },
      { title: "Recherche", description: "Les inspirations ne sont jamais présentées comme des vérités absolues.", icon: FileText },
      { title: "Action suivante", description: "Améliorer un titre, une FAQ ou un CTA plutôt qu'un rapport long.", icon: Zap, href: "/builder/site", cta: "Améliorer" },
    ],
    checklist: ["Hypothèses marquées.", "Pas de fausse preuve.", "Pas de copie de marque ou contenu protégé."],
  },
};

function UtilityCardView({ card }: { card: UtilityCard }) {
  const Icon = card.icon;

  return (
    <article className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">{card.title}</h2>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/56">{card.description}</p>
      {card.href && card.cta ? (
        <Button asChild variant="outline" className="mt-5 w-full justify-between rounded-2xl border-white/[0.10] bg-transparent text-white/82">
          <Link to={card.href}>
            {card.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </article>
  );
}

function UtilityPage({ pageId, overrideConfig }: { pageId: UtilityPageId; overrideConfig?: UtilityConfig }) {
  const config = overrideConfig ?? utilityConfigs[pageId];

  return (
    <V2PageShell
      eyebrow={config.eyebrow}
      title={config.title}
      description={config.description}
      action={
        <>
          {config.secondaryAction ? (
            <Button asChild variant="outline" className="rounded-2xl border-white/[0.10] bg-black/25 text-white/82">
              <Link to={config.secondaryAction.href}>{config.secondaryAction.label}</Link>
            </Button>
          ) : null}
          <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
            <Link to={config.primaryAction.href}>
              {config.primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <SEOHead title={`${config.title} | Pixelrises V2`} description={config.description} noIndex />

      <HeroPanel eyebrow="Pixelrises V2" title={config.heroTitle} description={config.heroDescription}>
        {pageId === "profile" ? <InterfaceModeToggle /> : null}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {config.checklist.map((item) => (
            <div key={item} className="rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-sm leading-6 text-white/62">
              <CheckCircle2 className="mb-2 h-4 w-4 text-[#F5C542]" />
              {item}
            </div>
          ))}
        </div>
      </HeroPanel>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {config.cards.map((card) => (
          <UtilityCardView key={card.title} card={card} />
        ))}
      </section>

      {pageId === "customConnector" ? (
        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionTile title="Hub intégrations" description="Vérifier les statuts disponibles." href="/integrations" action="Ouvrir" />
          <ActionTile title="Webhooks" description="Tester un flux en brouillon." href="/automations/webhooks" action="Tester" />
          <ActionTile title="Documentation" description="Lire permissions et garde-fous." href="/automations/integrations/docs" action="Lire" />
          <ActionTile title="Support" description="Demander de l'aide si la connexion est sensible." href="/support/new" action="Aide" />
        </section>
      ) : null}

      <div className="mt-6">
        <ClientSafeNotice>{config.footerNote}</ClientSafeNotice>
      </div>

      <section className="mt-6 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">État</p>
            <h2 className="mt-2 text-xl font-semibold">Page reliée à une vraie destination</h2>
          </div>
          <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10">
            Navigation OK
          </Badge>
        </div>
      </section>
    </V2PageShell>
  );
}

export function NotificationsPage() {
  return <UtilityPage pageId="notifications" />;
}

export function SupportPage() {
  return <UtilityPage pageId="support" />;
}

export function SupportRequestPage() {
  return <UtilityPage pageId="supportRequest" />;
}

export function ProfilePage() {
  return <UtilityPage pageId="profile" />;
}

export function SecurityPage() {
  return <UtilityPage pageId="security" />;
}

export function RoadmapPage() {
  return <UtilityPage pageId="roadmap" />;
}

export function IntegrationDocsPage() {
  return <UtilityPage pageId="integrationDocs" />;
}

export function CustomConnectorPage() {
  return <UtilityPage pageId="customConnector" />;
}

export function WebhooksPage() {
  return <UtilityPage pageId="webhooks" />;
}

export function WorkspacePage() {
  return <UtilityPage pageId="workspace" />;
}

export function BuilderToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const safeToolId = builderTools.some((tool) => tool.id === toolId) ? (toolId as BuilderToolId) : "analytics";
  const config = builderToolDetails[safeToolId];

  return <UtilityPage pageId="workspace" overrideConfig={config} />;
}
