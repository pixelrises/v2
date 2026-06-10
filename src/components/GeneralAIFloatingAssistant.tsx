import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Loader2,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataBadge } from "@/components/ui/data-state";
import { routeGeneralAIRequest, type GeneralAIRouteResult } from "@/modules/ai-spaces";

type AssistantTurn = {
  id: string;
  prompt: string;
  result: GeneralAIRouteResult;
};

const quickPrompts = [
  "Je veux créer un site pour mon business",
  "Je dois organiser mes clients",
  "Je veux faire des vidéos TikTok",
  "Je dois réviser un contrôle",
];

const pageContext: Array<{ prefix: string; label: string }> = [
  { prefix: "/dashboard", label: "dashboard" },
  { prefix: "/create", label: "création" },
  { prefix: "/ai-spaces", label: "AI Spaces" },
  { prefix: "/builder/site", label: "Site Builder" },
  { prefix: "/builder/agent", label: "Agent Builder" },
  { prefix: "/builder/game", label: "Game Builder" },
  { prefix: "/projects", label: "projets" },
  { prefix: "/analytics", label: "analytics" },
  { prefix: "/templates", label: "templates" },
  { prefix: "/integrations", label: "intégrations" },
  { prefix: "/automations", label: "automatisations" },
  { prefix: "/settings", label: "settings" },
];

const makeTurnId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function GeneralAIFloatingAssistant() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isRouting, setIsRouting] = useState(false);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const routingTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (routingTimeoutRef.current !== undefined) {
        window.clearTimeout(routingTimeoutRef.current);
      }
    },
    [],
  );

  const contextLabel = useMemo(
    () => pageContext.find((item) => location.pathname.startsWith(item.prefix))?.label ?? "Pixelrises",
    [location.pathname],
  );

  const latestTurn = turns[0];

  const submitPrompt = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isRouting) return;

    setIsRouting(true);
    const result = routeGeneralAIRequest(cleanPrompt);
    setTurns((previous) => [{ id: makeTurnId(), prompt: cleanPrompt, result }, ...previous].slice(0, 5));
    setPrompt("");
    if (routingTimeoutRef.current !== undefined) {
      window.clearTimeout(routingTimeoutRef.current);
    }
    routingTimeoutRef.current = window.setTimeout(() => {
      setIsRouting(false);
      routingTimeoutRef.current = undefined;
    }, 180);
  };

  const applyQuickPrompt = (value: string) => {
    setPrompt(value);
    if (!open) setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-50 flex items-center gap-3 rounded-2xl border border-[#F5C542]/25 bg-[#090909]/92 px-4 py-3 text-sm font-semibold text-white shadow-[0_22px_80px_-36px_rgba(245,197,66,0.75)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-[#F5C542]/45 lg:bottom-7 lg:right-7"
        aria-label="Ouvrir le conseiller Pixelrises"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5C542] text-black">
          <Bot className="h-4 w-4" />
        </span>
        <span className="hidden sm:block">Conseiller Pixelrises</span>
        <Sparkles className="hidden h-4 w-4 text-[#F5C542] sm:block" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="absolute inset-x-3 bottom-3 mx-auto max-h-[calc(100vh-24px)] max-w-[520px] overflow-hidden rounded-[30px] border border-white/[0.10] bg-[#070707]/96 shadow-[0_30px_140px_-60px_rgba(245,197,66,0.8)] sm:right-5 sm:left-auto sm:bottom-5 sm:w-[520px]">
            <div className="border-b border-white/[0.08] bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/10 text-[#F5C542]">
                    <Route className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Assistant Pixelrises</p>
                    <p className="mt-1 text-xs leading-5 text-white/52">
                      Conseiller global et routeur intelligent depuis la page {contextLabel}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/[0.08] bg-black/25 p-2 text-white/58 transition hover:text-white"
                  aria-label="Fermer le conseiller Pixelrises"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <DataBadge state="mock" label="Routeur local sécurisé" />
                <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10">
                  Aucune action automatique
                </Badge>
              </div>
            </div>

            <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-4">
              {latestTurn ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#F5C542]/20 bg-[#F5C542]/[0.07] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#F5C542]">Demande</p>
                    <p className="mt-2 text-sm leading-6 text-white/84">{latestTurn.prompt}</p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <DataBadge state={latestTurn.result.dataState} label="Conseil non sensible" />
                      <Badge className="border-white/[0.10] bg-white/[0.04] text-white/62 hover:bg-white/[0.04]">
                        Intention : {latestTurn.result.intent.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/74">{latestTurn.result.answer}</p>

                    <Button asChild className="mt-4 w-full justify-between rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]">
                      <Link to={latestTurn.result.primaryAction.href} onClick={() => setOpen(false)}>
                        <span>
                          {latestTurn.result.primaryAction.label}
                          <span className="mt-1 block text-left text-xs font-normal text-black/62">
                            {latestTurn.result.primaryAction.description}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>

                    {latestTurn.result.secondaryActions.length ? (
                      <div className="mt-3 grid gap-2">
                        {latestTurn.result.secondaryActions.map((action) => (
                          <Button
                            key={action.href}
                            asChild
                            variant="outline"
                            className="justify-between rounded-2xl border-white/[0.10] bg-transparent text-white/72"
                          >
                            <Link to={action.href} onClick={() => setOpen(false)}>
                              {action.label}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-white/[0.08] bg-black/25 p-3 text-sm leading-6 text-white/58">
                    <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#F5C542]" />
                    <span>{latestTurn.result.safetyNote}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 text-center">
                  <Sparkles className="mx-auto h-9 w-9 text-[#F5C542]" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Dis-moi ce que tu veux faire.</h3>
                  <p className="mt-2 text-sm leading-6 text-white/52">
                    Je t'oriente vers le bon espace IA, le bon builder ou la prochaine action concrète.
                  </p>
                  <div className="mt-5 grid gap-2">
                    {quickPrompts.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => applyQuickPrompt(item)}
                        className="rounded-2xl border border-white/[0.08] bg-black/25 px-3 py-2 text-left text-sm text-white/72 transition hover:border-[#F5C542]/30 hover:text-white"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={submitPrompt} className="border-t border-white/[0.08] p-4">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ex : je veux créer un site pour mon restaurant..."
                className="min-h-[92px] resize-none rounded-2xl border-white/[0.10] bg-black/35 text-white placeholder:text-white/35"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white/44">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Validation humaine avant toute action sensible.
                </div>
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isRouting}
                  className="rounded-2xl bg-[#F5C542] text-black hover:bg-[#FFD766]"
                >
                  {isRouting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Orienter
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
