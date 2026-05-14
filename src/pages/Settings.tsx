import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Languages,
  LockKeyhole,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
  WalletCards,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { InterfaceModeToggle } from "@/components/v2/InterfaceModeToggle";
import { ClientSafeNotice, HeroPanel } from "@/components/v2/Phase9UI";
import { V2PageShell } from "@/components/v2/V2PageShell";

const settingsSections = [
  {
    title: "Compte",
    description: "Profil, espace principal et préférences de démarrage.",
    icon: UserCircle,
    href: "/profile",
    action: "Gérer",
  },
  {
    title: "Confidentialité",
    description: "Contrôle des données utilisées par les assistants et builders.",
    icon: LockKeyhole,
    href: "/security",
    action: "Voir",
  },
  {
    title: "Notifications",
    description: "Alertes utiles uniquement : création prête, validation requise, erreur propre.",
    icon: Bell,
    href: "/notifications",
    action: "Configurer",
  },
  {
    title: "Préférences IA",
    description: "Ton espace préféré et le niveau de guidage souhaité.",
    icon: Wand2,
    href: "/ai-spaces",
    action: "Choisir",
  },
  {
    title: "Apparence",
    description: "Thème sombre premium, lisibilité et densité d'interface.",
    icon: Moon,
    href: "/settings",
    action: "Actuel",
  },
  {
    title: "Langue",
    description: "Français par défaut, autres langues préparées progressivement.",
    icon: Languages,
    href: "/settings",
    action: "Bientôt",
    disabled: true,
  },
  {
    title: "Espace de travail",
    description: "Raccourcis vers projets, créations et analyses.",
    icon: BriefcaseBusiness,
    href: "/workspace",
    action: "Ouvrir",
  },
  {
    title: "Facturation & plan",
    description: "Vue de plan préparée. Les changements sensibles restent confirmés.",
    icon: WalletCards,
    href: "/dashboard",
    action: "Voir",
  },
  {
    title: "Sécurité",
    description: "Validation humaine, erreurs propres et actions externes bloquées par défaut.",
    icon: ShieldCheck,
    href: "/security",
    action: "Sécuriser",
  },
];

const Settings = () => {
  return (
    <V2PageShell
      eyebrow="Préférences"
      title="Paramètres"
      description="Une page claire pour régler l'expérience Pixelrises sans exposer les détails techniques."
      action={
        <Button asChild className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
          <Link to="/profile">Ouvrir le profil</Link>
        </Button>
      }
    >
      <SEOHead title="Paramètres | Pixelrises V2" description="Paramètres Pixelrises V2." noIndex />

      <HeroPanel
        eyebrow="Mode d'interface"
        title="Simple par défaut. Avancé quand tu veux plus de contrôle."
        description="Le mode simple masque les détails non essentiels. Le mode avancé affiche plus d'historique, de qualité et de configuration, sans jamais afficher d'information sensible."
      >
        <InterfaceModeToggle />
      </HeroPanel>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <article key={section.title} className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/56">{section.description}</p>
              <Button
                asChild={!section.disabled}
                disabled={section.disabled}
                variant={section.disabled ? "outline" : "default"}
                className={`mt-5 w-full rounded-2xl ${
                  section.disabled ? "border-white/[0.10] bg-transparent text-white/38" : "bg-[#F5C542] text-black hover:bg-[#FFD766]"
                }`}
              >
                {section.disabled ? <span>{section.action}</span> : <Link to={section.href}>{section.action}</Link>}
              </Button>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F5C542]">Consentement</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Règles simples</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Validation avant partage", "Aucune action externe automatique", "Erreurs lisibles et sûres"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 text-sm leading-6 text-white/62">
                <CheckCircle2 className="mb-2 h-4 w-4 text-[#F5C542]" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <ClientSafeNotice>
          Les réglages techniques complets restent réservés aux contrôles internes. Côté client, Pixelrises affiche l'usage,
          l'état et la prochaine action.
        </ClientSafeNotice>
      </section>
    </V2PageShell>
  );
};

export default Settings;
