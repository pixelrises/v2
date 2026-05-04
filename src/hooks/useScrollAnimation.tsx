import { useInView } from "framer-motion";
import { useRef } from "react";

export const useScrollAnimation = (options?: { once?: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    margin: "-100px 0px -100px 0px",
  });

  return { ref, isInView };
};
