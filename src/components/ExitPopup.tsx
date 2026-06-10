import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Compass, Sparkles, Target, X } from "lucide-react";

const exitHighlights = [
  {
    icon: Compass,
    text: "Savoir si vous devez déléguer, créer seul ou tester l'espace IA.",
  },
  {
    icon: Target,
    text: "Repérer la prochaine action utile : site, offres, SEO, portfolio ou automatisations.",
  },
  {
    icon: CheckCircle2,
    text: "Garder le contrôle : aucune action externe sans validation humaine.",
  },
];

const ExitPopup = () => {
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 0 && !triggered) {
        setTriggered(true);
        setOpen(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [triggered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-popup-title"
            className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-primary/25 bg-[#070706]/95 p-5 text-white shadow-[0_26px_90px_rgba(0,0,0,0.75)] sm:p-7"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,210,48,0.28),transparent_34%),radial-gradient(circle_at_0%_90%,rgba(255,210,48,0.12),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,210,48,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,210,48,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-primary/40 hover:text-primary"
              aria-label="Fermer la popup"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Avant de partir
              </div>

              <h3 id="exit-popup-title" className="max-w-md text-3xl font-black leading-[0.98] tracking-[-0.04em] sm:text-4xl">
                Repartez avec une suite claire.
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/68 sm:text-base">
                En 2 minutes, le diagnostic vous aide à choisir le bon chemin : déléguer votre site, créer avec l'IA ou prioriser les prochaines actions.
              </p>

              <div className="mt-6 space-y-3">
                {exitHighlights.map((item) => (
                  <div key={item.text} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-5 text-white/78">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Link
                  to="/diagnostic"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-black shadow-[0_16px_40px_rgba(255,210,48,0.24)] transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  Faire le diagnostic
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/dashboard-demo"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:border-primary/35 hover:text-primary"
                >
                  Tester l'espace
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 w-full text-center text-xs font-semibold text-white/45 transition hover:text-white/70"
              >
                Continuer à parcourir le site
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitPopup;
