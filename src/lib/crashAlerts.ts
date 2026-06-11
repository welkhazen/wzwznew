import { apiFetch } from "@/lib/http";

type CrashAlertInput = {
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  source: "error_boundary" | "unhandled_error" | "unhandled_rejection" | "diagnostics_probe";
};

const sentCrashKeys = new Set<string>();

export async function sendCrashAlert(input: CrashAlertInput): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const route = input.route ?? window.location.pathname;
  const crashKey = `${input.source}:${route}:${input.message}`;
  if (sentCrashKeys.has(crashKey)) {
    return;
  }
  sentCrashKeys.add(crashKey);

  // The server gates this endpoint with trusted-origin + per-IP rate limit for
  // browser callers, and additionally requires Bearer CRASH_ALERT_SECRET for
  // server-to-server callers. Do not ship the secret to the browser bundle.
  await apiFetch("/api/monitoring/crash-alert", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      route,
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION,
      occurredAt: new Date().toISOString(),
    }),
  }).catch(() => {
    // Sentry remains the source of truth if email alerts are not configured.
  });
}

export function installGlobalCrashAlerts(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    void sendCrashAlert({
      message: event.message || "Unhandled browser error",
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: "unhandled_error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    void sendCrashAlert({
      message: reason instanceof Error ? reason.message : "Unhandled promise rejection",
      stack: reason instanceof Error ? reason.stack : String(reason ?? ""),
      source: "unhandled_rejection",
    });
  });
}
