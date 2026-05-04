import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportFrontendError } from "@/lib/monitoring";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

class PixelrisesErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: import.meta.env.DEV
        ? error.message || "Une erreur a empêché l'affichage de la page."
        : "",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportFrontendError("react-error-boundary", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background app-grid-bg flex items-center justify-center px-5">
        <div className="premium-shell max-w-xl px-6 py-8 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Pixelrises AI
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Une erreur a interrompu l’affichage
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Une erreur est survenue. Veuillez réessayer dans quelques instants.
          </p>
          {this.state.message && (
            <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {this.state.message}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Recharger la page
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-background/70 px-5 py-3 text-sm font-semibold text-foreground"
            >
              Retour à l’accueil
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default PixelrisesErrorBoundary;
