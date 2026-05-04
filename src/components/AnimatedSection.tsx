import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  /** Stronger cinematic reveal: blur + scale + larger offset */
  cinematic?: boolean;
}

const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  cinematic = true,
}: AnimatedSectionProps) => {
  const { ref, isInView } = useScrollAnimation();

  const offset = cinematic ? 80 : 50;
  const getInitialPosition = () => {
    switch (direction) {
      case "up": return { y: offset, x: 0 };
      case "down": return { y: -offset, x: 0 };
      case "left": return { x: offset, y: 0 };
      case "right": return { x: -offset, y: 0 };
      default: return { y: offset, x: 0 };
    }
  };

  const initial = getInitialPosition();

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...initial,
        scale: cinematic ? 0.96 : 1,
        filter: cinematic ? "blur(8px)" : "blur(0px)",
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }
          : {
              opacity: 0,
              ...initial,
              scale: cinematic ? 0.96 : 1,
              filter: cinematic ? "blur(8px)" : "blur(0px)",
            }
      }
      transition={{
        duration: cinematic ? 0.9 : 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
