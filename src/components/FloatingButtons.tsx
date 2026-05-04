import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/i18n/useTranslation";

const FloatingButtons = () => {
  const [showCTA, setShowCTA] = useState(false);
  const { locale, t } = useTranslation();
  const isFr = locale === "fr";

  useEffect(() => {
    const handleScroll = () => setShowCTA(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const whatsappUrl = "https://wa.me/33775256214?text=Bonjour,%20je%20souhaite%20cr%C3%A9er%20un%20site%20web.";

  return (
    <>
      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-8 left-1/2 z-40 hidden -translate-x-1/2 md:block"
          >
            <div className="premium-shell flex items-center gap-4 px-4 py-3 pr-3 shadow-[0_22px_80px_-28px_rgba(0,0,0,0.65)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 pr-2">
                <p className="text-sm font-semibold text-foreground">
                  {isFr ? "Passez à la création" : "Move to creation"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isFr
                    ? "Lancez votre première version et testez la qualité Pixelrises."
                    : "Launch your first version and test Pixelrises quality."}
                </p>
              </div>

              <a
                href="#tarifs"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90"
              >
                {t("floating.cta")}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 bottom-[88px] z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 sm:bottom-6 sm:right-6"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </>
  );
};

export default FloatingButtons;
