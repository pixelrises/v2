import { createRoot } from "react-dom/client";
import "./index.css";
import { reportFrontendError } from "./lib/monitoring";
import { redactSecrets } from "./modules/ai/security/redactSecrets";

const formatError = (value: unknown) => {
  if (!import.meta.env.DEV) {
    return "Une erreur est survenue. Réessayez ou contactez le support si le problème continue.";
  }

  if (value instanceof Error) {
    return redactSecrets([value.name, value.message].filter(Boolean).join("\n"));
  }

  if (typeof value === "string") {
    return redactSecrets(value);
  }

  try {
    return redactSecrets(JSON.stringify(value, null, 2));
  } catch {
    return redactSecrets(String(value));
  }
};

const showBootstrapError = (title: string, error: unknown) => {
  const overlayId = "pixelrises-bootstrap-error";
  let overlay = document.getElementById(overlayId);

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "99999";
    overlay.style.padding = "24px";
    overlay.style.color = "#f5f5f5";
    overlay.style.background = "#111";
    overlay.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    overlay.style.whiteSpace = "pre-wrap";
    overlay.style.overflow = "auto";
    document.body.appendChild(overlay);
  }

  const heading = document.createElement("h1");
  heading.style.fontSize = "18px";
  heading.style.margin = "0 0 16px";
  heading.textContent = title;

  const details = document.createElement("p");
  details.style.margin = "0";
  details.style.whiteSpace = "pre-wrap";
  details.textContent = formatError(error);

  overlay.replaceChildren(heading, details);
};

window.addEventListener("error", (event) => {
  reportFrontendError("window-error", event.error ?? event.message, {
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
  });
  showBootstrapError("Erreur JavaScript", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  reportFrontendError("unhandled-promise", event.reason);
  showBootstrapError("Promesse rejet\u00e9e", event.reason);
});

const mount = async () => {
  try {
    const { default: App } = await import("./App.tsx");
    const root = document.getElementById("root");

    if (!root) {
      throw new Error("Impossible de trouver #root");
    }

    createRoot(root).render(<App />);
  } catch (error) {
    reportFrontendError("app-bootstrap", error);
    showBootstrapError("Erreur au d\u00e9marrage", error);
  }
};

void mount();
