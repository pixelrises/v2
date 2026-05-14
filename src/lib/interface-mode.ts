export type InterfaceMode = "simple" | "advanced";

export const INTERFACE_MODE_STORAGE_KEY = "pixelrises-v2-interface-mode";

export const readInterfaceMode = (): InterfaceMode => {
  if (typeof window === "undefined") return "simple";
  return window.localStorage.getItem(INTERFACE_MODE_STORAGE_KEY) === "advanced" ? "advanced" : "simple";
};

export const persistInterfaceMode = (mode: InterfaceMode) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTERFACE_MODE_STORAGE_KEY, mode);
};

export const interfaceModeLabel: Record<InterfaceMode, string> = {
  simple: "Mode simple",
  advanced: "Mode avancé",
};
