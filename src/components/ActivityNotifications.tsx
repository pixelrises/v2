import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const notifications = [
  "Un entrepreneur compare les offres",
  "Un visiteur regarde les réalisations",
  "Quelqu'un teste l'espace IA",
  "Un fondateur démarre un diagnostic",
  "Un créateur explore les outils IA",
  "Un étudiant découvre Student AI",
  "Une équipe prépare une automatisation",
  "Un visiteur imagine son premier site",
  "Un indépendant consulte les tarifs",
  "Quelqu'un ouvre le dashboard démo",
];

const ActivityNotifications = () => {
  const [current, setCurrent] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showNotification = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * notifications.length);
    setCurrent(notifications[randomIndex]);
    setVisible(true);
    setTimeout(() => setVisible(false), 4000);
  }, []);

  useEffect(() => {
    const initial = setTimeout(showNotification, 12000);
    const interval = setInterval(() => {
      const delay = 20000 + Math.random() * 20000;
      setTimeout(showNotification, delay);
    }, 30000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [showNotification]);

  return (
    <div className="fixed bottom-5 left-4 z-30 max-w-[300px] sm:bottom-6 sm:left-6">
      <AnimatePresence>
        {visible && current && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-2xl border border-primary/20 bg-black/85 px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary shadow-[0_0_18px_rgba(250,204,21,0.65)]" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/85">
                  Activité récente
                </p>
                <p className="mt-1 text-[12px] font-semibold leading-snug text-white/70">{current}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityNotifications;
