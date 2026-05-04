import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ReactNode, useRef } from "react";

interface ParallaxTitleProps {
  children: ReactNode;
  className?: string;
  /** Parallax intensity in px (positive = title moves up faster than scroll) */
  intensity?: number;
}

/**
 * Wraps a heading with a subtle parallax effect tied to scroll progress.
 * Disabled when prefers-reduced-motion is set.
 */
const ParallaxTitle = ({ children, className = "", intensity = 40 }: ParallaxTitleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [intensity, -intensity]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.4, 1, 1, 0.4]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  );
};

export default ParallaxTitle;
