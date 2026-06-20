import { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { track } from "@/lib/analytics";
import { sendCrashAlert } from "@/lib/crashAlerts";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  isChunkError: boolean;
  willReload: boolean;
}

function detectChunkError(error: Error): boolean {
  return (
    error.message.includes("Failed to fetch dynamically imported module") ||
    error.message.includes("Importing a module script failed") ||
    error.message.includes("error loading dynamically imported module") ||
    error.name === "ChunkLoadError"
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, isChunkError: false, willReload: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const isChunkError = detectChunkError(error);
    const alreadyReloaded =
      typeof window !== "undefined" && sessionStorage.getItem("raw.chunk_error_reload") === "1";
    return { error, isChunkError, willReload: isChunkError && !alreadyReloaded };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const route =
      typeof window !== "undefined" ? window.location.pathname : "unknown";

    // Surface a rich diagnostic block in the console so we can root-cause
    // intermittent "Something broke" without guessing.
    if (typeof window !== "undefined") {
      const supabaseAuthKey = Object.keys(window.localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );
      const hasSession = supabaseAuthKey
        ? Boolean(window.localStorage.getItem(supabaseAuthKey))
        : false;
      console.error("[ErrorBoundary] caught error", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: info.componentStack,
        route,
        href: window.location.href,
        hasSupabaseSession: hasSession,
        timestamp: new Date().toISOString(),
      });
    }

    // Auto-reload once when a lazy chunk fails to load after a new deployment.
    // We intentionally do NOT auto-reload other errors (auth races, null
    // dereferences, etc.) — those need to be diagnosed, not papered over.
    const isChunkError = detectChunkError(error);

    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "raw.chunk_error_reload";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
        return;
      }
    }

    Sentry.captureException(error, {
      tags: { route },
      extra: { componentStack: info.componentStack },
    });

    void sendCrashAlert({
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
      route,
      source: "error_boundary",
    });

    track("error_boundary_triggered", {
      message: error.message,
      stack: info.componentStack ?? error.stack ?? undefined,
      route,
    });
  }

  reset = (): void => {
    this.setState({ error: null, isChunkError: false, willReload: false });
  };

  componentDidMount(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("raw.chunk_error_reload");
    }
  }

  componentDidUpdate(_prev: ErrorBoundaryProps, prevState: ErrorBoundaryState): void {
    if (prevState.error && !this.state.error && typeof window !== "undefined") {
      sessionStorage.removeItem("raw.chunk_error_reload");
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      // Stale-chunk path: a reload is in flight (or about to be triggered by
      // componentDidCatch). Show a neutral loading screen rather than the
      // scary error fallback so users don't see "Something broke" flash
      // during a deploy-cycle refresh.
      if (this.state.willReload) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-raw-black">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold" />
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-raw-black to-raw-black/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-raw-border/50 bg-raw-surface p-8 text-center shadow-2xl">
            <p className="font-display text-lg tracking-wide text-raw-text">
              Something broke.
            </p>
            <p className="mt-2 text-sm text-raw-silver/60">
              We logged it and we'll look at it. Try again, or reload.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.reset}
                className="w-full rounded-xl bg-raw-gold py-3 text-sm font-bold text-raw-ink transition-all hover:bg-raw-gold/90"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full rounded-xl border border-raw-border/60 py-3 text-sm text-raw-silver/70 transition-colors hover:text-raw-silver"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
