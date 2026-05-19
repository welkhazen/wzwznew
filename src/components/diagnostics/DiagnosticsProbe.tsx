import { useState } from "react";
import * as Sentry from "@sentry/react";
import { track } from "@/lib/analytics";
import { sendCrashAlert } from "@/lib/crashAlerts";

const diagnosticsEnabled =
  import.meta.env.DEV ||
  import.meta.env.MODE === "staging" ||
  import.meta.env.VITE_ENABLE_DIAGNOSTICS === "true";

export function DiagnosticsProbe() {
  const [firedAt, setFiredAt] = useState<string | null>(null);

  if (!diagnosticsEnabled) {
    return null;
  }

  const runProbe = () => {
    const now = new Date().toISOString();

    track("diagnostics_probe_fired", {
      source: "hidden_button",
      mode: import.meta.env.MODE,
    });

    Sentry.captureException(new Error(`Diagnostics probe test error @ ${now}`), {
      tags: { source: "diagnostics_probe", env_mode: import.meta.env.MODE },
      level: "error",
    });

    void sendCrashAlert({
      message: `Diagnostics probe test error @ ${now}`,
      source: "diagnostics_probe",
    });

    setFiredAt(now);
  };

  return (
    <div className="fixed bottom-3 left-3 z-[120]">
      <button
        type="button"
        onClick={runProbe}
        aria-label="Run diagnostics probe"
        title="Diagnostics probe"
        className="h-2.5 w-2.5 rounded-full bg-raw-gold/35 opacity-20 transition hover:scale-110 hover:opacity-80"
      />
      {firedAt ? (
        <p className="mt-1 text-[10px] text-raw-silver/55">probe sent</p>
      ) : null}
    </div>
  );
}
