import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StateIconProps {
  size?: number;
  color?: string;
  className?: string;
  duration?: number;
}

function useAutoToggle(interval: number) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setOn((value) => !value), interval);
    return () => window.clearInterval(id);
  }, [interval]);

  return on;
}

export function SuccessIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2200,
}: StateIconProps) {
  const done = useAutoToggle(duration);

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <motion.circle
        cx="20"
        cy="20"
        r="16"
        stroke={color}
        strokeWidth={2}
        animate={done ? { pathLength: 1, opacity: 1 } : { pathLength: 0.7, opacity: 0.4 }}
        transition={{ duration: 0.5 }}
      />
      {!done && (
        <motion.circle
          cx="20"
          cy="20"
          r="16"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="25 75"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "20px 20px" }}
        />
      )}
      <motion.path
        d="M12 20l6 6 10-12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={done ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay: done ? 0.2 : 0 }}
      />
    </svg>
  );
}

export function CopiedIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2200,
}: StateIconProps) {
  const copied = useAutoToggle(duration);

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <rect x="12" y="10" width="18" height="22" rx="2" stroke={color} strokeWidth={2} />
      <path
        d="M10 14h0a2 2 0 00-2 2v18a2 2 0 002 2h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.3}
      />
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.path
            key="check"
            d="M16 21l4 4 6-8"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            exit={{ pathLength: 0 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <motion.g
            key="lines"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <line x1="17" y1="18" x2="25" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
            <line x1="17" y1="23" x2="25" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
            <line x1="17" y1="28" x2="22" y2="28" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

export function NotificationIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2800,
}: StateIconProps) {
  const notif = useAutoToggle(duration);

  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      animate={notif ? { rotate: [0, 8, -8, 6, -6, 3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6 }}
      style={{ width: size, height: size, transformOrigin: "20px 6px" }}
    >
      <path
        d="M28 16a8 8 0 00-16 0c0 8-4 10-4 10h24s-4-2-4-10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17.5 30a3 3 0 005 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <motion.circle
        cx="28"
        cy="10"
        r="4"
        fill="#EF4444"
        animate={notif ? { scale: [0, 1.3, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      />
    </motion.svg>
  );
}

export function DownloadDoneIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2400,
}: StateIconProps) {
  const done = useAutoToggle(duration);

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <path d="M8 28v4a2 2 0 002 2h20a2 2 0 002-2v-4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <AnimatePresence mode="wait">
        {done ? (
          <motion.path
            key="check"
            d="M14 22l6 6 8-10"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        ) : (
          <motion.g
            key="arrow"
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <line x1="20" y1="6" x2="20" y2="24" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <polyline points="14,18 20,24 26,18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

export function SendIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2600,
}: StateIconProps) {
  const sent = useAutoToggle(duration);

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <motion.g
        animate={sent ? { x: 30, y: -30, opacity: 0, scale: 0.5 } : { x: 0, y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        <path d="M34 6L16 20l-6-2L34 6z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <path d="M34 6L22 34l-6-14" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <line x1="16" y1="20" x2="22" y2="34" stroke={color} strokeWidth={2} />
      </motion.g>
    </svg>
  );
}

export function ToggleIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 1800,
}: StateIconProps) {
  const on = useAutoToggle(duration);

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <motion.rect
        x="5"
        y="13"
        width="30"
        height="14"
        rx="7"
        animate={on ? { fill: color, opacity: 0.2 } : { fill: color, opacity: 0.08 }}
        transition={{ duration: 0.3 }}
      />
      <rect x="5" y="13" width="30" height="14" rx="7" stroke={color} strokeWidth={2} opacity={on ? 1 : 0.4} />
      <motion.circle
        cy="20"
        r="5"
        fill={color}
        animate={on ? { cx: 28 } : { cx: 12 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      />
    </svg>
  );
}

export function EyeToggleIcon({
  size = 40,
  color = "currentColor",
  className,
  duration = 2200,
}: StateIconProps) {
  const hidden = useAutoToggle(duration);

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <motion.path
        d="M4 20s6-10 16-10 16 10 16 10-6 10-16 10S4 20 4 20z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={hidden ? { opacity: 0.3 } : { opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx="20"
        cy="20"
        r="5"
        stroke={color}
        strokeWidth={2}
        animate={hidden ? { scale: 0.6, opacity: 0.2 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line
        x1="6"
        y1="34"
        x2="34"
        y2="6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        animate={hidden ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.25 }}
      />
    </svg>
  );
}

export const PixelrisesLaunchIcon = SendIcon;
export const PixelrisesOptimizeIcon = ToggleIcon;
export const PixelrisesPublishIcon = DownloadDoneIcon;
export const PixelrisesPreviewIcon = EyeToggleIcon;
export const PixelrisesProjectsIcon = CopiedIcon;
export const PixelrisesAudienceIcon = NotificationIcon;
