import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "raw_terms_accepted";

export function TermsConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-[9998] flex justify-center px-4 pb-4 sm:pb-6"
      role="dialog"
      aria-modal="true"
      aria-label="Terms and Privacy Policy"
    >
      <div className="w-full max-w-xl rounded-2xl border border-raw-border/50 bg-raw-surface/95 px-5 py-4 shadow-2xl backdrop-blur-md sm:px-6">
        <p className="text-sm font-semibold text-raw-text">We care about your privacy</p>
        <p className="mt-1 text-xs leading-relaxed text-raw-silver/55">
          By continuing to use raW you agree to our{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-raw-gold/80 underline hover:text-raw-gold"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-raw-gold/80 underline hover:text-raw-gold"
          >
            Privacy Policy
          </a>
          . raW is anonymous — no email, no real name required.
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={accept}
            className="rounded-xl bg-raw-gold px-5 py-2 text-sm font-bold text-raw-ink transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
