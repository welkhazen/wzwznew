import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import tokenImg from "@/assets/tokens.webp";
import { useRawStore } from "@/store/useRawStore";
import { useTheme } from "@/providers/useTheme";
import { PACKAGES } from "@/lib/wallet-packages";

const PaymentModal = lazy(() =>
  import("@/components/dashboard/DashboardWallet").then((m) => ({ default: m.PaymentModal }))
);


export function TokenBalanceButton() {
  const { tokenBalance: balance } = useRawStore();
  const { mode } = useTheme();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple-pay" | "google-pay" | null>(null);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvc: "" });
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isLight = mode === "light";

  const handleClick = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setRippleKey((k) => k + 1);
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      setSpinning(false);
      setOpen((o) => !o);
    }, 560);
  }, [spinning]);

  function handleBuy(packId: string) {
    setSelectedPackId(packId);
    setOpen(false);
    setPaymentOpen(true);
  }

  function handleClosePayment() {
    setPaymentOpen(false);
    setPaymentMethod(null);
    setCardDetails({ number: "", expiry: "", cvc: "" });
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <style>{`
        @keyframes token-spin {
          0%   { transform: translateY(0)   rotateY(0deg)   scale(1);    filter: drop-shadow(0 0 5px rgba(250,204,21,0.5)); }
          25%  { transform: translateY(-6px) rotateY(180deg) scale(1.3);  filter: drop-shadow(0 0 18px rgba(250,204,21,1)); }
          55%  { transform: translateY(-3px) rotateY(450deg) scale(1.12); filter: drop-shadow(0 0 10px rgba(250,204,21,0.7)); }
          80%  { transform: translateY(2px)  rotateY(660deg) scale(0.94); filter: drop-shadow(0 0 6px rgba(250,204,21,0.5)); }
          100% { transform: translateY(0)   rotateY(720deg) scale(1);    filter: drop-shadow(0 0 5px rgba(250,204,21,0.5)); }
        }
        .token-spin-anim {
          animation: token-spin 0.56s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-style: preserve-3d;
        }
        @keyframes token-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        .token-float {
          animation: token-float 2.4s ease-in-out infinite;
        }
        @keyframes ripple-ring {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .ripple-ring {
          animation: ripple-ring 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes balance-text-in {
          from { opacity: 0; max-width: 0; transform: translateX(-6px); }
          to   { opacity: 1; max-width: 80px; transform: translateX(0); }
        }
        .balance-text-in {
          animation: balance-text-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          overflow: hidden;
          white-space: nowrap;
        }
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-in {
          animation: dropdown-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: top right;
        }
        @keyframes btn-glow {
          0%   { box-shadow: 0 0 0 0 rgba(250,204,21,0.55); }
          60%  { box-shadow: 0 0 0 10px rgba(250,204,21,0); }
          100% { box-shadow: 0 0 0 0 rgba(250,204,21,0); }
        }
        .btn-glow {
          animation: btn-glow 0.55s ease-out forwards;
        }
      `}</style>

      <button
        key={rippleKey > 0 ? `btn-${rippleKey}` : "btn"}
        type="button"
        onClick={handleClick}
        aria-label="Token balance"
        aria-expanded={open}
        aria-haspopup="menu"
        className={`relative flex items-center gap-1.5 rounded-xl border px-2 py-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50${spinning ? " btn-glow" : ""}`}
        style={{
          borderColor: open
            ? isLight ? "rgba(148,163,184,0.55)" : "rgba(250,204,21,0.45)"
            : spinning ? "rgba(250,204,21,0.3)" : "transparent",
          background: open
            ? isLight ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.85)"
            : "transparent",
          boxShadow: open
            ? isLight ? "0 6px 16px rgba(15,23,42,0.1)" : "0 0 16px rgba(250,204,21,0.15)"
            : "none",
          backdropFilter: open ? "blur(8px)" : "none",
        }}
      >
        {/* ripple ring on click */}
        {rippleKey > 0 && (
          <span
            key={rippleKey}
            className="ripple-ring pointer-events-none absolute inset-0 rounded-xl border-2 border-raw-gold/70"
          />
        )}
        <img
          src={tokenImg}
          alt="Token"
          width={26}
          height={26}
          draggable={false}
          className={`shrink-0 select-none object-contain${spinning ? " token-spin-anim" : " token-float"}`}
          style={{ filter: "drop-shadow(0 0 5px rgba(250,204,21,0.5))" }}
        />
        {open && !spinning && (
          <span className="balance-text-in font-display text-xs tracking-wide text-raw-gold" style={{ textShadow: "0 0 8px rgba(250,204,21,0.5)" }}>
            {balance}
          </span>
        )}
      </button>

      {open && !spinning && (
        <div
          role="menu"
          className={`dropdown-in absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border p-3 shadow-xl ${
            isLight ? "border-slate-200 bg-white text-slate-900" : "border-raw-gold/25 bg-raw-black/95 text-raw-text"
          }`}
          style={{
            backdropFilter: "blur(10px)",
            boxShadow: isLight ? "0 12px 28px rgba(15,23,42,0.12)" : "0 0 18px rgba(250,204,21,0.10)",
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-display text-[11px] uppercase tracking-[0.18em] text-raw-gold/75">Buy tokens</span>
            <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>
              Balance {balance}
            </span>
          </div>
          <div className="space-y-1.5">
            {PACKAGES.map((pack) => (
              <button
                key={pack.id}
                type="button"
                role="menuitem"
                onClick={() => handleBuy(pack.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50 ${
                  isLight
                    ? "border-slate-200 hover:border-raw-gold/45 hover:bg-amber-50"
                    : "border-raw-border/45 hover:border-raw-gold/45 hover:bg-raw-gold/[0.06]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <img src={tokenImg} alt="" width={20} height={20} className="shrink-0 object-contain" />
                  <span>
                    <span className="block text-sm font-semibold text-raw-gold">{pack.tokens.toLocaleString()} tokens</span>
                    <span className={`text-[10px] uppercase tracking-[0.16em] ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>{pack.label}</span>
                  </span>
                </span>
                <span className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-raw-text"}`}>
                  ${pack.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
          <p className={`mt-3 text-[10px] leading-relaxed ${isLight ? "text-slate-500" : "text-raw-silver/40"}`}>
            Token purchases process through a secure checkout. Earn free tokens daily from the spin and challenges.
          </p>
        </div>
      )}
      {paymentOpen && selectedPackId && (
        <Suspense fallback={null}>
          <PaymentModal
            selectedPackage={PACKAGES.find((p) => p.id === selectedPackId)!}
            paymentMethod={paymentMethod}
            cardDetails={cardDetails}
            onPaymentMethodChange={setPaymentMethod}
            onCardDetailsChange={setCardDetails}
            onBack={handleClosePayment}
            onClose={handleClosePayment}
          />
        </Suspense>
      )}
    </div>
  );
}
