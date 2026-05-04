import { ReactNode, useRef, MouseEvent, useState } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees */
  maxTilt?: number;
  /** Show glare reflection on hover */
  glare?: boolean;
}

/**
 * 3D tilt + magnetic glow card.
 * Tracks mouse position to rotate on X/Y and renders a soft moving glare.
 * Disabled on touch / coarse pointers via CSS media query check.
 */
const TiltCard = ({
  children,
  className = "",
  maxTilt = 8,
  glare = true,
}: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -maxTilt;
    const ry = ((x - cx) / cx) * maxTilt;
    setTransform(
      `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.015)`
    );
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 1,
    });
  };

  const handleLeave = () => {
    setTransform("");
    setGlarePos((p) => ({ ...p, opacity: 0 }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform,
        transformStyle: "preserve-3d",
        transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={`relative ${className}`}
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          style={{
            background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, hsl(var(--primary) / 0.18), transparent 60%)`,
            opacity: glarePos.opacity,
            transition: "opacity 0.4s ease",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
};

export default TiltCard;
