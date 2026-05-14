import { useCallback, useEffect, useState } from "react";
import {
  INTERFACE_MODE_STORAGE_KEY,
  persistInterfaceMode,
  readInterfaceMode,
  type InterfaceMode,
} from "@/lib/interface-mode";

export function useInterfaceMode() {
  const [mode, setModeState] = useState<InterfaceMode>(() => readInterfaceMode());

  const setMode = useCallback((nextMode: InterfaceMode) => {
    setModeState(nextMode);
    persistInterfaceMode(nextMode);
    window.dispatchEvent(new CustomEvent("pixelrises-interface-mode", { detail: nextMode }));
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === INTERFACE_MODE_STORAGE_KEY) setModeState(readInterfaceMode());
    };
    const onCustomMode = (event: Event) => {
      const detail = (event as CustomEvent<InterfaceMode>).detail;
      if (detail === "simple" || detail === "advanced") setModeState(detail);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("pixelrises-interface-mode", onCustomMode);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pixelrises-interface-mode", onCustomMode);
    };
  }, []);

  return {
    mode,
    isSimple: mode === "simple",
    isAdvanced: mode === "advanced",
    setMode,
  };
}
