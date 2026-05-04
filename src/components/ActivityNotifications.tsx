import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const notifications = [
  "Un entrepreneur consulte nos offres",
  "Un visiteur découvre nos réalisations",
  "Un entrepreneur explore le Pack Signature",
  "Un visiteur analyse nos projets",
  "Quelqu'un consulte la page tarifs",
  "Un visiteur regarde les avis clients",
  "Un nouveau visiteur découvre Pixelrises",
  "Un entrepreneur regarde le Pack Essentiel",
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
    <div className="fixed bottom-6 left-6 z-30 max-w-[280px]">
      <AnimatePresence>
        {visible && current && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-snug">{current}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityNotifications;
