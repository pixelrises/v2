import { createRoot } from "react-dom/client";
import "./index.css";
import { reportFrontendError } from "./lib/monitoring";

const formatError = (value: unknown) => {
  if (value instanceof Error) {
    return [value.name, value.message, value.stack].filter(Boolean).join("\n");
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
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

  overlay.innerHTML = `
    <h1 style="font-size: 18px; margin: 0 0 16px;">${title}</h1>
    <pre style="margin: 0; white-space: pre-wrap;">${formatError(error)}</pre>
  `;
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
