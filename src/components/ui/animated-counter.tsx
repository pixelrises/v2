import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  /** Final numeric value (digits only) */
  value: number;
  /** Optional prefix like "+" or "€" */
  prefix?: string;
  /** Optional suffix like "%" or "/5" or "k" */
  suffix?: string;
  /** Number of decimals (e.g. 1 for "4.9") */
  decimals?: number;
  /** Animation duration in ms */
  duration?: number;
  className?: string;
}

/**
 * Counts from 0 → value when scrolled into view.
 * Uses easeOutCubic for a satisfying decelerating animation.
 */
const AnimatedCounter = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1800,
  className = "",
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) {
      if (reduced) setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
