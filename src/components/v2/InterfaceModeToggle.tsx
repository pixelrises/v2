import { SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInterfaceMode } from "@/hooks/use-interface-mode";
import { cn } from "@/lib/utils";
import type { InterfaceMode } from "@/lib/interface-mode";

const modeOptions: Array<{ mode: InterfaceMode; label: string; helper: string }> = [
  { mode: "simple", label: "Simple", helper: "Moins de bruit, actions guidées" },
  { mode: "advanced", label: "Avancé", helper: "Plus d'options et d'historique" },
];

export function InterfaceModeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useInterfaceMode();

  if (compact) {
    return (
      <div className="flex rounded-2xl border border-white/[0.10] bg-black/25 p-1">
        {modeOptions.map((option) => (
          <button
            key={option.mode}
            type="button"
            aria-label={`Activer ${option.label}`}
            onClick={() => setMode(option.mode)}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-semibold transition",
              mode === option.mode ? "bg-[#F5C542] text-black" : "text-white/58 hover:text-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/[0.10] bg-white/[0.035] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F5C542]">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Interface
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.08] bg-black/25 p-1">
        {modeOptions.map((option) => (
          <Button
            key={option.mode}
            type="button"
            variant="ghost"
            onClick={() => setMode(option.mode)}
            className={cn(
              "h-auto rounded-xl px-3 py-2 text-xs",
              mode === option.mode ? "bg-[#F5C542] text-black hover:bg-[#FFD766]" : "text-white/58 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <p className="mt-2 flex gap-2 text-xs leading-5 text-white/46">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F5C542]" />
        {modeOptions.find((option) => option.mode === mode)?.helper}
      </p>
    </div>
  );
}
