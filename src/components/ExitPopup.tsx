import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Search, TrendingDown, Target } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const WHATSAPP_LINK = "https://wa.me/33775256214?text=Bonjour,%20je%20souhaite%20recevoir%20mon%20diagnostic%20digital%20gratuit.";

const ExitPopup = () => {
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !triggered) {
        setTriggered(true);
        setOpen(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [triggered]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} transition={{ duration: 0.4, ease: "easeOut" }} className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full mb-4">
                <Zap className="w-3.5 h-3.5" />
                {t("exit.badge")}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-center mb-2">{t("exit.title")}</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">{t("exit.text")}</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2.5 text-sm text-foreground"><Search className="w-4 h-4 text-primary flex-shrink-0" />{t("exit.analysis")}</li>
              <li className="flex items-center gap-2.5 text-sm text-foreground"><TrendingDown className="w-4 h-4 text-primary flex-shrink-0" />{t("exit.opportunities")}</li>
              <li className="flex items-center gap-2.5 text-sm text-foreground"><Target className="w-4 h-4 text-primary flex-shrink-0" />{t("exit.plan")}</li>
            </ul>
            <Button asChild size="lg" className="w-full glow-primary mb-4">
              <a href="#diagnostic" onClick={() => setOpen(false)}>{t("exit.cta")} <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <button onClick={() => setOpen(false)} className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer py-1">
              {t("exit.dismiss")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitPopup;
