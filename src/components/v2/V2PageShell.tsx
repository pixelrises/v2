import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bot,
  Boxes,
  Cable,
  ChartNoAxesCombined,
  CreditCard,
  FolderKanban,
  Gamepad2,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  PlusCircle,
  Settings,
  Sparkles,
  UserCircle,
  Wand2,
  Workflow,
  X,
} from "lucide-react";
import { GeneralAIFloatingAssistant } from "@/components/GeneralAIFloatingAssistant";
import { InterfaceModeToggle } from "@/components/v2/InterfaceModeToggle";
import pixelrisesLogo from "@/assets/pixelrises-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Créer", href: "/create", icon: PlusCircle },
  { label: "AI Spaces", href: "/ai-spaces", icon: MessagesSquare },
  { label: "Site Builder", href: "/builder/site", icon: Wand2 },
  { label: "Agents IA", href: "/agents", icon: Bot },
  { label: "Agent Studio", href: "/builder/agent", icon: Sparkles },
  { label: "Game Builder", href: "/builder/game", icon: Gamepad2 },
  { label: "Templates", href: "/templates", icon: Boxes },
  { label: "Intégrations", href: "/integrations", icon: Cable },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Projets", href: "/projects", icon: FolderKanban },
  { label: "Crédits", href: "/billing", icon: CreditCard },
  { label: "Automatisations", href: "/automations", icon: Workflow },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

const mobileNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Spaces", href: "/ai-spaces", icon: MessagesSquare },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Crédits", href: "/billing", icon: CreditCard },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

const isNavigationItemActive = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

const supportNavigation = [
  { label: "Support manuel", href: "/support", icon: HelpCircle },
  { label: "Profil", href: "/profile", icon: UserCircle },
];

export type V2PageShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
  hideHeader?: boolean;
  readOnlyDemo?: boolean;
  hideAssistant?: boolean;
};

const DashboardMobileLimelightNav = ({
  pathname,
  readOnlyDemo = false,
  onLockedAction,
}: {
  pathname: string;
  readOnlyDemo?: boolean;
  onLockedAction?: (label: string) => void;
}) => {
  const effectivePathname = readOnlyDemo && pathname === "/dashboard-demo" ? "/dashboard" : pathname;
  const activeIndex = mobileNavigation.findIndex((item) => isNavigationItemActive(effectivePathname, item.href));
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const limelight = limelightRef.current;
    if (activeIndex < 0) {
      if (limelight) limelight.style.left = "-999px";
      return undefined;
    }

    const activeItem = navItemRefs.current[activeIndex];

    if (!limelight || !activeItem) return undefined;

    const nextLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
    limelight.style.left = `${nextLeft}px`;

    if (!isReady) {
      const timeoutId = window.setTimeout(() => setIsReady(true), 50);
      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [activeIndex, isReady]);

  return (
    <nav
      aria-label="Navigation mobile dashboard"
      data-testid="dashboard-mobile-limelight-nav"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 lg:hidden"
    >
      <div className="relative grid h-[76px] w-full max-w-[430px] grid-cols-5 items-center overflow-hidden rounded-[28px] border border-[#F5C542]/20 bg-[#070707]/92 px-2 shadow-[0_24px_90px_-34px_rgba(0,0,0,0.95),0_0_48px_-28px_rgba(245,197,66,0.95)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,197,66,0.18),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.07),transparent)]" />
        {mobileNavigation.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeIndex;

          return readOnlyDemo ? (
            <button
              key={item.href}
              ref={(element) => {
                navItemRefs.current[index] = element;
              }}
              type="button"
              onClick={() => onLockedAction?.(item.label)}
              aria-current={active ? "page" : undefined}
              className="relative z-20 flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition duration-200",
                  active ? "text-[#F5C542] opacity-100" : "text-white/50 opacity-70",
                )}
              />
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-semibold leading-none transition duration-200",
                  active ? "text-[#F5C542]" : "text-white/48",
                )}
              >
                {item.label}
              </span>
            </button>
          ) : (
            <Link
              key={item.href}
              ref={(element) => {
                navItemRefs.current[index] = element;
              }}
              to={item.href}
              aria-current={active ? "page" : undefined}
              className="relative z-20 flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition duration-200",
                  active ? "text-[#F5C542] opacity-100" : "text-white/50 opacity-70",
                )}
              />
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-semibold leading-none transition duration-200",
                  active ? "text-[#F5C542]" : "text-white/48",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <div
          ref={limelightRef}
          className={cn(
            "absolute top-0 z-10 h-[5px] w-11 rounded-full bg-[#F5C542] shadow-[0_34px_32px_rgba(245,197,66,0.42),0_0_26px_rgba(245,197,66,0.75)]",
            isReady ? "transition-[left] duration-300 ease-out" : "",
          )}
          style={{ left: "-999px" }}
        >
          <div className="pointer-events-none absolute left-[-35%] top-[5px] h-[68px] w-[170%] bg-gradient-to-b from-[#F5C542]/30 via-[#F5C542]/10 to-transparent [clip-path:polygon(8%_100%,28%_0,72%_0,92%_100%)]" />
        </div>
      </div>
    </nav>
  );
};

const DashboardMobileCompleteMenu = ({
  pathname,
  open,
  onClose,
  readOnlyDemo = false,
  onLockedAction,
}: {
  pathname: string;
  open: boolean;
  onClose: () => void;
  readOnlyDemo?: boolean;
  onLockedAction?: (label: string) => void;
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu complet dashboard mobile">
      <button type="button" aria-label="Fermer le menu complet" className="absolute inset-0 bg-black" onClick={onClose} />
      <div className="absolute inset-x-3 top-3 max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-[32px] border border-[#F5C542]/24 bg-[#050505] shadow-[0_32px_120px_-50px_rgba(0,0,0,1),0_0_70px_-42px_rgba(245,197,66,0.95)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(245,197,66,0.14),transparent_36%),radial-gradient(circle_at_92%_8%,rgba(245,197,66,0.08),transparent_32%)]" />

        <div className="relative flex items-center justify-between border-b border-[#F5C542]/12 bg-[#090806] px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={pixelrisesLogo} alt="Pixelrises" className="h-10 w-10 rounded-2xl object-contain" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">Toutes les sections</p>
              <p className="text-sm font-semibold text-white">Menu dashboard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu complet"
            className="rounded-full border border-[#F5C542]/18 bg-[#11100d] p-2 text-white/70 transition hover:border-[#F5C542]/45 hover:text-[#F5C542]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative max-h-[calc(100dvh-105px)] overflow-y-auto px-4 pb-5 pt-4">
          <div data-testid="dashboard-mobile-complete-menu" className="grid grid-cols-1 gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const effectivePathname = readOnlyDemo && pathname === "/dashboard-demo" ? "/dashboard" : pathname;
              const active = isNavigationItemActive(effectivePathname, item.href);

              const menuItemClassName = cn(
                "group flex min-h-[58px] items-center gap-3 rounded-[22px] border px-4 py-3 text-left text-[15px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition",
                active
                  ? "border-[#F5C542]/58 bg-[#1b1607] text-[#F5C542] shadow-[0_0_34px_-24px_rgba(245,197,66,0.9)]"
                  : "border-white/[0.10] bg-[#10100d] text-white/82 hover:border-[#F5C542]/32 hover:bg-[#151208] hover:text-white",
              );
              const menuItemContent = (
                <>
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition",
                      active
                        ? "border-[#F5C542]/58 bg-[#2a2108] text-[#F5C542]"
                        : "border-white/[0.10] bg-[#050505] text-white/62 group-hover:text-[#F5C542]",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className={cn("text-xs", active ? "text-[#F5C542]" : "text-white/38 group-hover:text-[#F5C542]/80")}>→</span>
                </>
              );

              if (readOnlyDemo) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      onLockedAction?.(item.label);
                      onClose();
                    }}
                    className={menuItemClassName}
                  >
                    {menuItemContent}
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onClose}
                  className={menuItemClassName}
                >
                  {menuItemContent}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 rounded-[24px] border border-[#F5C542]/14 bg-[#080808] p-3">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Accès utiles</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {supportNavigation.map((item) => {
                const Icon = item.icon;
                const itemClassName =
                  "flex min-h-[50px] items-center gap-3 rounded-[18px] border border-white/[0.10] bg-[#11100d] px-4 py-3 text-left text-sm font-semibold text-white/76 transition hover:border-[#F5C542]/32 hover:bg-[#171307] hover:text-[#F5C542]";

                if (readOnlyDemo) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        onLockedAction?.(item.label);
                        onClose();
                      }}
                      className={itemClassName}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={itemClassName}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 px-2 text-xs leading-5 text-white/42">
              Le support reste manuel. Aucune action externe live n'est lancée depuis ce menu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function V2PageShell({
  children,
  title,
  description,
  eyebrow = "Pixelrises V2",
  action,
  hideHeader = false,
  readOnlyDemo = false,
  hideAssistant = false,
}: V2PageShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLockedDemoAction = (label = "Cette action") => {
    toast({
      title: "Démo visuelle en lecture seule",
      description: `${label} sera disponible après connexion au vrai espace Pixelrises.`,
    });
  };

  const handleSignOut = async () => {
    if (readOnlyDemo) {
      handleLockedDemoAction("La deconnexion");
      return;
    }

    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-[#030303] text-white",
        "overflow-x-hidden",
      )}
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_78%_17%,rgba(245,197,66,0.18),transparent_23%),radial-gradient(circle_at_16%_8%,rgba(245,197,66,0.08),transparent_24%),linear-gradient(180deg,#050505_0%,#030303_48%,#060606_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.75)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.75)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="fixed left-[35%] top-16 -z-10 hidden h-64 w-[58vw] rotate-[-7deg] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,197,66,0.24),rgba(245,197,66,0.06)_38%,transparent_72%)] blur-2xl lg:block" />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-white/[0.08] bg-[#050505]/88 px-4 py-6 shadow-[20px_0_80px_-60px_rgba(245,197,66,0.5)] backdrop-blur-2xl",
            "lg:block",
          )}
        >
        <Link to={readOnlyDemo ? "/dashboard-demo" : "/dashboard"} className="flex items-center gap-3 px-1">
          <img
            src={pixelrisesLogo}
            alt="Pixelrises"
            className="h-11 w-11 rounded-2xl object-contain drop-shadow-[0_0_22px_rgba(245,197,66,0.35)]"
          />
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.08em]">Pixelrises V2</p>
            <p className="text-xs text-white/52">{readOnlyDemo ? "Démo visuelle" : "Business OS"}</p>
          </div>
        </Link>

        <nav className="mt-9 max-h-[calc(100vh-300px)] space-y-2 overflow-y-auto pr-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const effectivePathname = readOnlyDemo && location.pathname === "/dashboard-demo" ? "/dashboard" : location.pathname;
            const active = isNavigationItemActive(effectivePathname, item.href);
            const itemClassName = cn(
              "group flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left text-[15px] font-medium transition",
              active
                ? "border-[#F5C542]/55 bg-[#F5C542]/12 text-[#F5C542] shadow-[0_0_34px_-24px_rgba(245,197,66,0.8)]"
                : "border-transparent text-white/72 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white",
            );
            const itemContent = (
              <>
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-[#F5C542]" : "text-white/72 group-hover:text-white")} />
                {item.label}
              </>
            );

            if (readOnlyDemo) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleLockedDemoAction(item.label)}
                  className={itemClassName}
                >
                  {itemContent}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className={itemClassName}
              >
                {itemContent}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 space-y-4">
          <InterfaceModeToggle />
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.035] px-3 py-2.5 text-xs font-semibold text-white/70 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.035] px-3 py-2.5 text-xs font-semibold text-white/70 transition hover:border-[#F5C542]/25 hover:text-[#F5C542]"
            >
              <LogOut className="h-4 w-4" />
              {readOnlyDemo ? "Lecture seule" : "Deconnexion"}
            </button>
          </div>
          {readOnlyDemo ? (
          <button
            type="button"
            onClick={() => handleLockedDemoAction("Le profil")}
            className="flex w-full items-center gap-3 rounded-[18px] border border-white/[0.10] bg-white/[0.035] p-4 text-left transition hover:border-[#F5C542]/25"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5C542] text-sm font-bold text-black">
              P
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Votre espace</p>
              <p className="truncate text-xs text-white/42">Profil en lecture seule</p>
            </div>
            <UserCircle className="h-4 w-4 text-white/45" />
          </button>
          ) : (
          <Link to="/profile" className="flex items-center gap-3 rounded-[18px] border border-white/[0.10] bg-white/[0.035] p-4 transition hover:border-[#F5C542]/25">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5C542] text-sm font-bold text-black">
              P
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Votre espace</p>
              <p className="truncate text-xs text-white/42">Profil & préférences</p>
            </div>
            <UserCircle className="h-4 w-4 text-white/45" />
          </Link>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={readOnlyDemo ? "/dashboard-demo" : "/dashboard"} className="flex items-center gap-2">
            <img src={pixelrisesLogo} alt="Pixelrises" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-sm font-semibold">Pixelrises V2</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              aria-label="Retour a l'accueil"
              className="rounded-full border border-white/[0.10] bg-white/[0.035] p-2 text-white/70"
            >
              <Home className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label={readOnlyDemo ? "Lecture seule" : "Deconnexion"}
              className="rounded-full border border-white/[0.10] bg-white/[0.035] p-2 text-white/70"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu complet dashboard"
              aria-expanded={mobileMenuOpen}
              className="inline-flex items-center gap-2 rounded-full border border-[#F5C542]/24 bg-[#F5C542]/10 px-3 py-1.5 text-xs font-semibold text-[#F5C542]"
            >
              <Menu className="h-4 w-4" />
              Menu
            </button>
          </div>
        </div>
      </header>

      <main className="lg:pl-[240px]">
        <div className="mx-auto w-full max-w-[1660px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:py-8">
          {!hideHeader ? (
            <div
              className={cn(
                "mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between",
              )}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">
                  {eyebrow}
                </p>
                <h1 className="mt-3 max-w-6xl text-[34px] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-[44px]">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58 sm:text-base">{description}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {action}
                <InterfaceModeToggle compact />
                <div className="hidden items-center gap-2 lg:flex">
                  <Link
                    to="/"
                    aria-label="Retour a l'accueil"
                    className="rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Deconnexion"
                    className="rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                  {readOnlyDemo ? (
                    <>
                      <button
                        type="button"
                        aria-label="Notifications en lecture seule"
                        onClick={() => handleLockedDemoAction("Les notifications")}
                        className="relative rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Support en lecture seule"
                        onClick={() => handleLockedDemoAction("Le support")}
                        className="rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Profil en lecture seule"
                        onClick={() => handleLockedDemoAction("Le profil")}
                        className="rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                      >
                        <UserCircle className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/notifications"
                        aria-label="Ouvrir les notifications"
                        className="relative rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                      >
                        <Bell className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/support"
                        aria-label="Ouvrir le support"
                        className="rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/profile"
                        aria-label="Ouvrir le profil"
                        className="rounded-2xl border border-white/[0.10] bg-black/25 p-3 text-white/70 transition hover:text-white"
                      >
                        <UserCircle className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {children}
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-[#F5C542]/[0.06] blur-3xl" />
      <DashboardMobileCompleteMenu
        pathname={location.pathname}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        readOnlyDemo={readOnlyDemo}
        onLockedAction={handleLockedDemoAction}
      />
      <DashboardMobileLimelightNav
        pathname={location.pathname}
        readOnlyDemo={readOnlyDemo}
        onLockedAction={handleLockedDemoAction}
      />
      {!hideAssistant ? <GeneralAIFloatingAssistant /> : null}
    </div>
  );
}
