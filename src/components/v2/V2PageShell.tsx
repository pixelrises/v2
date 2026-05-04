import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Bot,
  Boxes,
  Cable,
  ChartNoAxesCombined,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Sparkles,
  Wand2,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import pixelrisesLogo from "@/assets/pixelrises-logo.png";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Créer", href: "/create", icon: PlusCircle },
  { label: "Site Builder", href: "/builder/site", icon: Wand2 },
  { label: "Agents IA", href: "/agents", icon: Bot },
  { label: "Game Builder", href: "/builder/game", icon: Gamepad2 },
  { label: "Templates", href: "/templates", icon: Boxes },
  { label: "Integrations", href: "/integrations", icon: Cable },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Automatisations", href: "/automations", icon: Workflow },
  { label: "Settings", href: "/settings", icon: Settings },
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(245,197,66,0.14),transparent_32%),radial-gradient(circle_at_90%_12%,rgba(91,141,239,0.12),transparent_28%),linear-gradient(180deg,#070707_0%,#050505_48%,#090909_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:64px_64px]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-white/[0.08] bg-black/35 px-4 py-5 backdrop-blur-2xl lg:block">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 rounded-[24px] border border-white/[0.08] bg-white/[0.03] px-4 py-4"
        >
          <img src={pixelrisesLogo} alt="Pixelrises" className="h-10 w-10 rounded-2xl object-contain" />
          <div>
            <p className="text-sm font-semibold tracking-tight">Pixelrises</p>
            <p className="text-xs text-white/45">Digital Creation OS</p>
          </div>
        </Link>

        <nav className="mt-8 max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto pr-1">
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
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-[#F5C542]/30 bg-[#F5C542]/10 text-[#F5C542]"
                    : "border-transparent text-white/62 hover:border-white/[0.08] hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-[24px] border border-[#F5C542]/15 bg-[#F5C542]/[0.07] p-4">
          <div className="flex items-center gap-2 text-[#F5C542]">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold">IA automatique</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-white/56">
            Pixelrises choisit le meilleur moteur pour chaque tâche, sans exposer la complexité aux débutants.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-black/45 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={pixelrisesLogo} alt="Pixelrises" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-sm font-semibold">Pixelrises V2</span>
          </Link>
          <Link
            to="/create"
            className="rounded-full border border-[#F5C542]/20 bg-[#F5C542]/10 px-3 py-1.5 text-xs font-semibold text-[#F5C542]"
          >
            Créer
          </Link>
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

      <main className="lg:pl-[280px]">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!hideHeader ? (
            <div className="mb-7 flex flex-col gap-5 rounded-[30px] border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_24px_90px_-60px_rgba(245,197,66,0.45)] backdrop-blur-xl sm:p-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F5C542]">
                  {eyebrow}
                </p>
                <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58 sm:text-base">
                  {description}
                </p>
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          ) : null}

          {children}
        </div>
      </main>

      <Link
        to="/"
        className="fixed bottom-4 right-4 z-40 hidden items-center gap-2 rounded-full border border-white/[0.08] bg-black/60 px-4 py-2 text-xs text-white/55 backdrop-blur-xl transition hover:text-white sm:flex"
      >
        <LogOut className="h-3.5 w-3.5 rotate-180" />
        Landing
      </Link>
    </div>
  );
}
