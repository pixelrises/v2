import { motion } from "framer-motion";

export type LandingMode = "delegation" | "ai";

interface HomeModeSwitchProps {
  mode: LandingMode;
  onModeChange: (mode: LandingMode) => void;
}

const HomeModeSwitch = ({ mode, onModeChange }: HomeModeSwitchProps) => {
  const isAI = mode === "ai";

  return (
    <div className="mb-10 flex justify-center px-2">
      <div
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-[#090909]/90 p-2 shadow-[0_20px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:gap-3"
        aria-label="Choisir le parcours d'accueil Pixelrises"
      >
        <button
          type="button"
          onClick={() => onModeChange("delegation")}
          aria-pressed={!isAI}
          className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition sm:px-4 sm:text-[11px] sm:tracking-[0.22em] ${
            !isAI ? "text-primary" : "text-white/62 hover:text-white"
          }`}
        >
          Délégation
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={isAI}
          aria-label="Basculer entre Délégation et Espace IA"
          onClick={() => onModeChange(isAI ? "delegation" : "ai")}
          className="relative h-9 w-[66px] shrink-0 rounded-full border border-white/10 bg-white/[0.08] p-1 transition hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <motion.span
            className="block h-7 w-7 rounded-full bg-gradient-to-t from-primary to-[hsl(var(--primary-light))] shadow-[0_0_28px_-6px_hsl(var(--primary)_/_0.8)]"
            animate={{ x: isAI ? 30 : 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
          />
        </button>

        <button
          type="button"
          onClick={() => onModeChange("ai")}
          aria-pressed={isAI}
          className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition sm:px-4 sm:text-[11px] sm:tracking-[0.22em] ${
            isAI ? "text-primary" : "text-white/62 hover:text-white"
          }`}
        >
          Espace IA
        </button>
      </div>
    </div>
  );
};

export default HomeModeSwitch;
