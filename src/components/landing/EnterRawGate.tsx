import { useEffect } from "react";

interface EnterRawGateProps {
  onEnter: () => void;
}

/**
 * Lightweight splash gate shown before the heavy landing page is loaded.
 * The full landing bundle is only fetched once the user taps "Enter raW".
 */
export function EnterRawGate({ onEnter }: EnterRawGateProps) {
  useEffect(() => {
    // Pre-warm the landing chunk after a short idle so the click feels instant.
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const schedule = idle ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const handle = schedule(() => {
      void import("@/components/landing/LandingShell");
    });
    return () => {
      const cancelIdle = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (cancelIdle && typeof handle === "number") cancelIdle(handle);
      else if (typeof handle === "number") window.clearTimeout(handle);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-raw-black px-5 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(241,196,45,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-raw-gold/40 to-transparent" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        <p className="font-display text-[10px] uppercase tracking-[0.45em] text-raw-gold/70 sm:text-xs">
          welcome
        </p>
        <h1 className="font-display text-3xl leading-tight text-raw-text sm:text-5xl">
          this is <span className="text-raw-gold">raW</span>
        </h1>
        <p className="text-sm leading-relaxed text-raw-silver/65 sm:text-base">
          Anonymous voices. Real opinions. Step inside to see what people are actually saying.
        </p>
        <button
          type="button"
          onClick={onEnter}
          data-testid="enter-raw-gate-button"
          className="enter-raw-gate-pulse mt-2 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-raw-gold px-8 py-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-raw-ink transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/80 sm:w-auto sm:tracking-[0.22em]"
        >
          Enter raW
        </button>
        <p className="text-[10px] uppercase tracking-[0.3em] text-raw-silver/40">
          tap to begin
        </p>
      </div>

      <style>{`
        .enter-raw-gate-pulse {
          box-shadow: 0 0 0 0 rgba(241, 196, 45, 0.55);
          animation: enterRawGatePulse 1.6s ease-out infinite;
        }
        @keyframes enterRawGatePulse {
          0%   { box-shadow: 0 0 0 0    rgba(241, 196, 45, 0.55); }
          70%  { box-shadow: 0 0 0 18px rgba(241, 196, 45, 0);    }
          100% { box-shadow: 0 0 0 0    rgba(241, 196, 45, 0);    }
        }
        @media (prefers-reduced-motion: reduce) {
          .enter-raw-gate-pulse { animation: none; }
        }
      `}</style>
    </div>
  );
}
