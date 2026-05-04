import { useEffect, useRef, useState } from "react";

/**
 * Soft cursor halo that follows the pointer on desktop.
 * Disabled on touch devices and when prefers-reduced-motion is set.
 * Pure transform/opacity for 60fps performance.
 */
const CursorHalo = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduced) return;
    setEnabled(true);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let hx = mx;
    let hy = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const t = e.target as HTMLElement;
      const interactive = t.closest('button, a, [role="button"], input, textarea, select');
      setHovering(!!interactive);
    };

    const tick = () => {
      hx += (mx - hx) * 0.18;
      hy += (my - hy) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${hx}px, ${hy}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={haloRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[60] rounded-full"
        style={{
          width: hovering ? 80 : 40,
          height: hovering ? 80 : 40,
          background: `radial-gradient(circle, hsl(var(--primary) / ${hovering ? 0.35 : 0.18}), transparent 70%)`,
          filter: "blur(8px)",
          transition: "width 0.3s ease, height 0.3s ease, background 0.3s ease",
          willChange: "transform",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[60] rounded-full bg-primary"
        style={{
          width: hovering ? 8 : 5,
          height: hovering ? 8 : 5,
          transition: "width 0.2s ease, height 0.2s ease",
          willChange: "transform",
          mixBlendMode: "difference",
        }}
      />
    </>
  );
};

export default CursorHalo;
