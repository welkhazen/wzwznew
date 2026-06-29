import { Suspense, lazy, useEffect, useRef, useState } from "react";
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
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple-pay" | "google-pay" | null>(null);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvc: "" });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isLight = mode === "light";

  function handleClick() {
    setOpen((o) => !o);
  }

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
      <button
        type="button"
        onClick={handleClick}
        aria-label="Token balance"
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative flex items-center gap-1.5 rounded-xl border px-2 py-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
        style={{
          borderColor: open
            ? isLight ? "rgba(148,163,184,0.55)" : "rgba(250,204,21,0.45)"
            : "transparent",
          background: open
            ? isLight ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.85)"
            : "transparent",
          boxShadow: open
            ? isLight ? "0 6px 16px rgba(15,23,42,0.1)" : "0 0 16px rgba(250,204,21,0.15)"
            : "none",
          backdropFilter: open ? "blur(8px)" : "none",
        }}
      >
        <img
          src={tokenImg}
          alt="Token"
          width={26}
          height={26}
          draggable={false}
          className="shrink-0 select-none object-contain"
          style={{ filter: "drop-shadow(0 0 5px rgba(250,204,21,0.5))" }}
        />
        {open && (
          <span className="font-display text-xs tracking-wide text-raw-gold">
            {balance}
          </span>
        )}
      </button>

      {open && (
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
