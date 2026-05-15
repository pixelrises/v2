import type { ReactNode } from "react";
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
  MessagesSquare,
  PlusCircle,
  Settings,
  UserCircle,
  Wand2,
  Workflow,
} from "lucide-react";
import { GeneralAIFloatingAssistant } from "@/components/GeneralAIFloatingAssistant";
import { InterfaceModeToggle } from "@/components/v2/InterfaceModeToggle";
import pixelrisesLogo from "@/assets/pixelrises-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Créer", href: "/create", icon: PlusCircle },
  { label: "AI Spaces", href: "/ai-spaces", icon: MessagesSquare },
  { label: "Site Builder", href: "/builder/site", icon: Wand2 },
  { label: "Agents IA", href: "/agents", icon: Bot },
  { label: "Game Builder", href: "/builder/game", icon: Gamepad2 },
  { label: "Templates", href: "/templates", icon: Boxes },
  { label: "Intégrations", href: "/integrations", icon: Cable },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Projets", href: "/projects", icon: FolderKanban },
  { label: "Crédits", href: "/billing", icon: CreditCard },
  { label: "Automatisations", href: "/automations", icon: Workflow },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export type V2PageShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
  hideHeader?: boolean;
};

export function V2PageShell({
  children,
  title,
  description,
  eyebrow = "Pixelrises V2",
  action,
  hideHeader = false,
}: V2PageShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030303] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_78%_17%,rgba(245,197,66,0.18),transparent_23%),radial-gradient(circle_at_16%_8%,rgba(245,197,66,0.08),transparent_24%),linear-gradient(180deg,#050505_0%,#030303_48%,#060606_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.75)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.75)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="fixed left-[35%] top-16 -z-10 hidden h-64 w-[58vw] rotate-[-7deg] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,197,66,0.24),rgba(245,197,66,0.06)_38%,transparent_72%)] blur-2xl lg:block" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-white/[0.08] bg-[#050505]/88 px-4 py-6 shadow-[20px_0_80px_-60px_rgba(245,197,66,0.5)] backdrop-blur-2xl lg:block">
        <Link to="/dashboard" className="flex items-center gap-3 px-1">
          <img
            src={pixelrisesLogo}
            alt="Pixelrises"
            className="h-11 w-11 rounded-2xl object-contain drop-shadow-[0_0_22px_rgba(245,197,66,0.35)]"
          />
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.08em]">Pixelrises V2</p>
            <p className="text-xs text-white/52">Business OS</p>
          </div>
        </Link>

        <nav className="mt-9 max-h-[calc(100vh-300px)] space-y-2 overflow-y-auto pr-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-[15px] font-medium transition",
                  active
                    ? "border-[#F5C542]/55 bg-[#F5C542]/12 text-[#F5C542] shadow-[0_0_34px_-24px_rgba(245,197,66,0.8)]"
                    : "border-transparent text-white/72 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-[#F5C542]" : "text-white/72 group-hover:text-white")} />
                {item.label}
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
              Deconnexion
            </button>
          </div>
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
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
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
              aria-label="Deconnexion"
              className="rounded-full border border-white/[0.10] bg-white/[0.035] p-2 text-white/70"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <Link
              to="/create"
              className="rounded-full border border-[#F5C542]/20 bg-[#F5C542]/10 px-3 py-1.5 text-xs font-semibold text-[#F5C542]"
            >
              Créer
            </Link>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs",
                location.pathname.startsWith(item.href)
                  ? "border-[#F5C542]/30 bg-[#F5C542]/10 text-[#F5C542]"
                  : "border-white/[0.08] bg-white/[0.03] text-white/70",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="lg:pl-[240px]">
        <div className="mx-auto w-full max-w-[1660px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!hideHeader ? (
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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
                </div>
              </div>
            </div>
          ) : null}

          {children}
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-[#F5C542]/[0.06] blur-3xl" />
      <GeneralAIFloatingAssistant />
    </div>
  );
}
