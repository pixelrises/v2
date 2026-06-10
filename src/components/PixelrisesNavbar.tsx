import * as React from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  ChevronDown,
  FileText,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Rocket,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Wand2,
  X,
} from "lucide-react";

type Locale = "fr" | "en";

type MegaMenuLink = {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
};

type MegaMenuSection = {
  title: string;
  items: MegaMenuLink[];
};

type MegaMenuItem = {
  id: number;
  label: string;
  href: string;
  desktopClassName?: string;
  subMenus?: MegaMenuSection[];
};

interface PixelrisesNavbarProps {
  locale: Locale;
  isLoggedIn: boolean;
  onLocaleChange: (locale: Locale) => void;
  onWorkspaceClick: () => void;
  onSignOut: () => void;
}

export const PixelrisesNavbar = ({
  locale,
  isLoggedIn,
  onLocaleChange,
  onWorkspaceClick,
  onSignOut,
}: PixelrisesNavbarProps) => {
  const isFr = locale === "fr";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileOpenGroups, setMobileOpenGroups] = React.useState<Record<string, boolean>>({});
  const items = React.useMemo(() => getNavbarItems(isFr), [isFr]);

  React.useEffect(() => {
    if (!mobileOpen) {
      setMobileOpenGroups({});
    }
  }, [mobileOpen]);

  return (
    <nav
      aria-label={isFr ? "Navigation principale Pixelrises" : "Pixelrises main navigation"}
      className="relative z-30 mb-10"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[26px] border border-white/10 bg-[#090909]/88 px-2 py-3 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-3">
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition hover:bg-white/[0.04]"
          aria-label={isFr ? "Accueil Pixelrises" : "Pixelrises home"}
        >
          <img
            src="/pixelrises-navbar-logo.png"
            alt=""
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-black tracking-tight text-white">Pixelrises</span>
        </Link>

        <MegaMenu items={items} className="hidden min-[1100px]:flex" />

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitch locale={locale} onLocaleChange={onLocaleChange} />

          <button
            type="button"
            onClick={onWorkspaceClick}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-extrabold text-white/82 transition hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
          >
            <User className="h-4 w-4" />
            {isFr ? "Mon espace" : "My space"}
          </button>

          <Link
            to="/dashboard-demo"
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-2xl bg-primary px-4 text-xs font-black text-black shadow-[0_18px_45px_rgba(250,204,21,0.22)] transition hover:scale-[1.02] hover:bg-[#ffd84d]"
          >
            {isFr ? "Tester l'espace" : "Test space"}
            <ArrowRight className="h-4 w-4" />
          </Link>

          {isLoggedIn && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex h-11 items-center rounded-2xl border border-white/10 px-3 text-xs font-bold text-white/52 transition hover:border-primary/25 hover:text-primary"
            >
              {isFr ? "Déconnexion" : "Sign out"}
            </button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-primary/30 hover:text-primary lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="pixelrises-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="sr-only">{isFr ? "Ouvrir le menu" : "Open menu"}</span>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="pixelrises-mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mt-3 max-h-[calc(100vh-112px)] overflow-y-auto rounded-[24px] border border-white/10 bg-[#090909]/95 p-4 shadow-2xl backdrop-blur-2xl lg:hidden"
          >
            <div className="grid gap-2">
              {items.map((item) => {
                const hasSubMenus = Boolean(item.subMenus?.length);
                const isGroupOpen = Boolean(mobileOpenGroups[item.label]);
                const groupId = `pixelrises-mobile-group-${item.id}`;

                if (!hasSubMenus) {
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-2xl px-4 py-3 text-sm font-extrabold text-white/82 transition hover:bg-primary/10 hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025]">
                    <button
                      type="button"
                      aria-expanded={isGroupOpen}
                      aria-controls={groupId}
                      onClick={() =>
                        setMobileOpenGroups((current) => ({
                          ...current,
                          [item.label]: !current[item.label],
                        }))
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-white/86 transition hover:bg-primary/10 hover:text-primary"
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
                        <motion.div
                          id={groupId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mx-3 mb-3 grid gap-1 border-l border-white/10 pl-3">
                            <Link
                              to={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="rounded-xl px-3 py-2 text-xs font-black text-primary transition hover:bg-primary/10"
                            >
                              {isFr ? "Vue d'ensemble" : "Overview"}
                            </Link>
                            {item.subMenus?.flatMap((subMenu) => subMenu.items).map((subItem) => (
                              <Link
                                key={subItem.href}
                                to={subItem.href}
                                onClick={() => setMobileOpen(false)}
                                className="rounded-xl px-3 py-2 text-xs font-bold text-white/58 transition hover:bg-primary/10 hover:text-primary"
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
              <LocaleSwitch locale={locale} onLocaleChange={onLocaleChange} />
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onWorkspaceClick();
                }}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-extrabold text-white/82"
              >
                <User className="h-4 w-4" />
                {isFr ? "Mon espace" : "My space"}
              </button>
              <Link
                to="/dashboard-demo"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-black"
              >
                {isFr ? "Tester" : "Test"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const MegaMenu = ({ items, className }: { items: MegaMenuItem[]; className?: string }) => {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [hoveredId, setHoveredId] = React.useState<number | null>(null);

  return (
    <ul className={`relative items-center gap-1 ${className ?? ""}`}>
      {items.map((navItem) => {
        const hasSubMenu = Boolean(navItem.subMenus?.length);

        return (
          <li
            key={navItem.label}
            className={`relative ${navItem.desktopClassName ?? ""}`}
            onMouseEnter={() => setOpenMenu(navItem.label)}
            onMouseLeave={() => setOpenMenu(null)}
          >
            {hasSubMenu && (navItem.href === "/realisations" || navItem.href === "/espace-ia") ? (
              <Link
                to={navItem.href}
                className="group relative inline-flex h-10 items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 text-xs font-extrabold text-white/62 transition-colors duration-300 hover:text-white"
                onMouseEnter={() => setHoveredId(navItem.id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-expanded={openMenu === navItem.label}
              >
                <NavHoverBg active={hoveredId === navItem.id || openMenu === navItem.label} />
                <span className="relative z-10 whitespace-nowrap">{navItem.label}</span>
                <ChevronDown
                  className={`relative z-10 h-4 w-4 transition-transform duration-300 ${
                    openMenu === navItem.label ? "rotate-180" : ""
                  }`}
                />
              </Link>
            ) : hasSubMenu ? (
              <button
                type="button"
                className="group relative inline-flex h-10 items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 text-xs font-extrabold text-white/62 transition-colors duration-300 hover:text-white"
                onMouseEnter={() => setHoveredId(navItem.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setOpenMenu((current) => (current === navItem.label ? null : navItem.label))}
                aria-expanded={openMenu === navItem.label}
              >
                <NavHoverBg active={hoveredId === navItem.id || openMenu === navItem.label} />
                <span className="relative z-10 whitespace-nowrap">{navItem.label}</span>
                <ChevronDown
                  className={`relative z-10 h-4 w-4 transition-transform duration-300 ${
                    openMenu === navItem.label ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : (
              <Link
                to={navItem.href}
                className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full px-2.5 text-xs font-extrabold text-white/62 transition-colors duration-300 hover:text-white"
                onMouseEnter={() => setHoveredId(navItem.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <NavHoverBg active={hoveredId === navItem.id} />
                <span className="relative z-10 whitespace-nowrap">{navItem.label}</span>
              </Link>
            )}

            <AnimatePresence>
              {openMenu === navItem.label && hasSubMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute left-1/2 top-full z-40 w-max -translate-x-1/2 pt-3"
                >
                  <div className="rounded-[22px] border border-white/10 bg-[#090909] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.78)]">
                    <div className="flex gap-7">
                      {navItem.subMenus?.map((subMenu) => (
                        <div key={subMenu.title} className="w-[245px]">
                          <p className="mb-4 px-2 text-[11px] font-black uppercase tracking-[0.24em] text-primary">
                            {subMenu.title}
                          </p>
                          <ul className="space-y-1.5">
                            {subMenu.items.map((item) => {
                              const Icon = item.icon;

                              return (
                                <li key={item.label}>
                                  <Link
                                    to={item.href}
                                    className="group flex items-start gap-3 rounded-2xl p-2.5 transition hover:bg-white/[0.06]"
                                  >
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary transition group-hover:border-primary/35 group-hover:bg-primary group-hover:text-black">
                                      <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block text-sm font-extrabold text-white">
                                        {item.label}
                                      </span>
                                      <span className="mt-1 block text-xs leading-5 text-white/48 transition group-hover:text-white/68">
                                        {item.description}
                                      </span>
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
};

const NavHoverBg = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.span
        layoutId="pixelrises-navbar-hover"
        className="absolute inset-0 rounded-full bg-white/[0.08]"
        transition={{ duration: 0.18, ease: "easeOut" }}
      />
    )}
  </AnimatePresence>
);

const LocaleSwitch = ({
  locale,
  onLocaleChange,
}: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}) => (
  <div className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1">
    {(["fr", "en"] as Locale[]).map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => onLocaleChange(item)}
        className={`h-8 rounded-xl px-3 text-xs font-black uppercase transition ${
          locale === item ? "bg-primary text-black" : "text-white/48 hover:text-white"
        }`}
        aria-pressed={locale === item}
      >
        {item}
      </button>
    ))}
  </div>
);

const getNavbarItems = (isFr: boolean): MegaMenuItem[] => [
  {
    id: 1,
    label: isFr ? "Accueil" : "Home",
    href: "/",
  },
  {
    id: 10,
    label: "Diagnostic",
    href: "/diagnostic",
  },
  {
    id: 2,
    label: isFr ? "Produit" : "Product",
    href: "/create",
    subMenus: [
      {
        title: isFr ? "Créer" : "Create",
        items: [
          {
            label: "Site Builder",
            description: isFr ? "Créer un site clair avec preview." : "Create a clear site with preview.",
            href: "/builder/site",
            icon: Wand2,
          },
          {
            label: "Game Builder",
            description: isFr ? "Prototype de jeu en mode bêta." : "Prototype a game in beta mode.",
            href: "/builder/game",
            icon: Gamepad2,
          },
          {
            label: "Agent Builder",
            description: isFr ? "Créer un agent avec limites sûres." : "Create an agent with safe limits.",
            href: "/builder/agent",
            icon: Bot,
          },
        ],
      },
      {
        title: isFr ? "Piloter" : "Operate",
        items: [
          {
            label: "Dashboard",
            description: isFr ? "Suivre projets, crédits et activité." : "Track projects, credits and activity.",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            label: isFr ? "Projets" : "Projects",
            description: isFr ? "Retrouver les créations V2." : "Find V2 creations.",
            href: "/projects",
            icon: Rocket,
          },
          {
            label: "Analytics",
            description: isFr ? "Lire les signaux de performance." : "Read performance signals.",
            href: "/analytics",
            icon: BarChart3,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    label: isFr ? "Espace IA" : "AI Space",
    href: "/espace-ia",
    subMenus: [
      {
        title: isFr ? "Espaces" : "Spaces",
        items: [
          {
            label: "General AI",
            description: isFr ? "Réponse générale orchestrée." : "General orchestrated answer.",
            href: "/espace-ia/general-ai",
            icon: Sparkles,
          },
          {
            label: "Business AI",
            description: isFr ? "Structurer offres, idées et stratégie." : "Structure offers, ideas and strategy.",
            href: "/espace-ia/business-ai",
            icon: Briefcase,
          },
          {
            label: "Student AI",
            description: isFr ? "Réviser, organiser et produire mieux." : "Study, organize and produce better.",
            href: "/espace-ia/student-ai",
            icon: GraduationCap,
          },
          {
            label: "Creator AI",
            description: isFr ? "Préparer scripts, posts, hooks et idées." : "Prepare scripts, posts, hooks and ideas.",
            href: "/espace-ia/creator-ai",
            icon: Sparkles,
          },
          {
            label: "Management AI",
            description: isFr ? "Organiser projets, priorités et tâches." : "Organize projects, priorities and tasks.",
            href: "/espace-ia/management-ai",
            icon: BarChart3,
          },
          {
            label: "Enterprise AI",
            description: isFr ? "Préparer process, support et workflows." : "Prepare processes, support and workflows.",
            href: "/espace-ia/enterprise-ai",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        title: isFr ? "Accès" : "Access",
        items: [
          {
            label: isFr ? "Espace IA" : "AI Space",
            description: isFr ? "Voir la landing complète Espace IA." : "See the complete AI Space landing.",
            href: "/espace-ia",
            icon: Sparkles,
          },
          {
            label: isFr ? "Tester Pixelrises" : "Test Pixelrises",
            description: isFr ? "Ouvrir le dashboard démo verrouillé." : "Open the locked demo dashboard.",
            href: "/dashboard-demo",
            icon: Bot,
          },
          {
            label: isFr ? "Tarifs" : "Pricing",
            description: isFr ? "Voir les offres publiques." : "See public offers.",
            href: "/pricing",
            icon: FileText,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    label: isFr ? "Réalisations" : "Work",
    href: "/realisations",
    subMenus: [
      {
        title: isFr ? "Réalisations" : "Work",
        items: [
          {
            label: "Portfolio",
            description: isFr ? "Voir les projets préparés dans Pixelrises." : "See the work prepared in Pixelrises.",
            href: "/realisations/portfolio",
            icon: Sparkles,
          },
          {
            label: isFr ? "Démos" : "Demos",
            description: isFr ? "Ouvrir les aperçus et démos disponibles." : "Open available previews and demos.",
            href: "/realisations/demos",
            icon: LayoutDashboard,
          },
          {
            label: "Prototypes",
            description: isFr ? "Voir des prototypes de sites, apps et dashboards." : "See site, app and dashboard prototypes.",
            href: "/realisations/prototypes",
            icon: Rocket,
          },
        ],
      },
    ],
  },
  { id: 5, label: isFr ? "Tarifs" : "Pricing", href: "/pricing" },
  { id: 6, label: "FAQ", href: "/#faq" },
  { id: 7, label: "Contact", href: "/support/new", desktopClassName: "hidden min-[1380px]:block" },
  { id: 8, label: "Support", href: "/support", desktopClassName: "hidden min-[1380px]:block" },
  {
    id: 9,
    label: isFr ? "Ressources" : "Resources",
    href: "/templates",
    subMenus: [
      {
        title: isFr ? "Documentation" : "Documentation",
        items: [
          {
            label: "Templates",
            description: isFr ? "Bibliothèque de modèles V2." : "V2 model library.",
            href: "/templates",
            icon: FileText,
          },
          {
            label: isFr ? "Docs intégrations" : "Integration docs",
            description: isFr ? "Configurer les connecteurs prudemment." : "Configure connectors carefully.",
            href: "/integrations/docs",
            icon: Settings2,
          },
          {
            label: isFr ? "Sécurité" : "Security",
            description: isFr ? "Statuts, secrets et garde-fous." : "Statuses, secrets and guardrails.",
            href: "/security",
            icon: ShieldCheck,
          },
          {
            label: "Support",
            description: isFr ? "Aide, bugs et demandes testeurs." : "Help, bugs and tester requests.",
            href: "/support",
            icon: MessageCircle,
          },
          {
            label: "Contact",
            description: isFr ? "Envoyer une demande à Pixelrises." : "Send a request to Pixelrises.",
            href: "/support/new",
            icon: HelpCircle,
          },
          {
            label: "Roadmap",
            description: isFr ? "Voir les évolutions prévues." : "See planned improvements.",
            href: "/roadmap",
            icon: HelpCircle,
          },
        ],
      },
    ],
  },
];

export default PixelrisesNavbar;
