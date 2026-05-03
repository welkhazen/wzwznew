import { useEffect } from "react";

interface EnterRawModalProps {
  open: boolean;
  onEnter: () => void;
  onDismiss: () => void;
}

/**
 * Pulsating "Enter raW" overlay shown after the user answers all 3 onboarding polls.
 * - Click the button to enter raW (calls onEnter).
 * - Click the dimmed/blurred backdrop (anywhere outside the card) to dismiss (calls onDismiss).
 * - Press Escape to dismiss.
 */
export function EnterRawModal({ open, onEnter, onDismiss }: EnterRawModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while modal is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enter raW"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(event) => {
        // Dismiss only when the backdrop itself is clicked, not the card
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        className="relative mx-4 w-full max-w-sm border border-raw-gold/40 bg-gradient-to-br from-raw-black via-[#0c0c0c] to-raw-black p-5 text-center shadow-[0_24px_60px_rgba(0,0,0,0.7),0_0_36px_rgba(241,196,45,0.18)] sm:mx-5 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-raw-gold/70 sm:tracking-[0.4em]">You're in</p>
        <h2 className="mt-2 font-display text-xl tracking-wide text-raw-text sm:text-3xl">
          Welcome to <span className="text-raw-gold">raW</span>
        </h2>
        <p className="mt-2 text-xs text-raw-silver/70 sm:mt-3 sm:text-sm">
          Your answers are locked in. Step inside to meet your circles.
        </p>

        <button
          type="button"
          onClick={onEnter}
          className="enter-raw-pulse mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-raw-ink transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/80 sm:mt-6 sm:w-auto sm:px-8 sm:tracking-[0.18em]"
        >
          Enter raW
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 block w-full min-h-[40px] text-[11px] uppercase tracking-[0.2em] text-raw-silver/45 transition hover:text-raw-silver/70"
        >
          Not yet
        </button>
      </div>

      <style>{`
        .enter-raw-pulse {
          box-shadow: 0 0 0 0 rgba(241, 196, 45, 0.55);
          animation: enterRawPulse 1.6s ease-out infinite;
        }
        @keyframes enterRawPulse {
          0%   { box-shadow: 0 0 0 0    rgba(241, 196, 45, 0.55); }
          70%  { box-shadow: 0 0 0 16px rgba(241, 196, 45, 0);    }
          100% { box-shadow: 0 0 0 0    rgba(241, 196, 45, 0);    }
        }
        @media (prefers-reduced-motion: reduce) {
          .enter-raw-pulse { animation: none; }
        }
      `}</style>
    </div>
  );
}
