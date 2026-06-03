import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { track } from "@/lib/analytics";
import { setClient } from "@/lib/analytics/client";
import { installGlobalCrashAlerts } from "@/lib/crashAlerts";
import { initSentry } from "@/lib/sentry";
import App from "./App.tsx";
import "./index.css";
import "./styles/raw-reveal-button.css";
import posthog from "posthog-js";

const queryClient = new QueryClient();

initSentry();
installGlobalCrashAlerts();

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
  });

  setClient({
    capture: (name, properties) => {
      posthog.capture(name, properties);
    },
    identify: (userId, traits) => {
      posthog.identify(userId, traits);
    },
    alias: (newId, previousId) => {
      posthog.alias(newId, previousId);
    },
    reset: () => {
      posthog.reset();
    },
    group: (groupType, groupKey, traits) => {
      posthog.group(groupType, groupKey, traits);
    },
    register: (props) => {
      posthog.register(props);
    },
    get_distinct_id: () => posthog.get_distinct_id(),
  });
}

if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : "";
    if (message.includes("THREE.THREE.Clock: This module has been deprecated")) {
      return;
    }
    originalWarn(...args);
  };
}

const shouldEnableSpeedInsights =
  import.meta.env.PROD &&
  (import.meta.env.VITE_ENABLE_SPEED_INSIGHTS === "true" ||
    window.location.hostname.endsWith(".vercel.app"));

if (typeof window !== "undefined" && import.meta.env.DEV) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("analytics_test") === "1") {
    track("diagnostics_probe_fired", {
      source: "query_param",
      mode: import.meta.env.MODE,
    });
  }
}


if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // no-op: app works without offline caching if registration fails.
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        {shouldEnableSpeedInsights ? <SpeedInsights /> : null}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
