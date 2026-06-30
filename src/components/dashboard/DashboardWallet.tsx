import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Zap, X, Lock } from "lucide-react";
import TokenImage from "@/assets/tokens.webp";
import { useRawStore } from "@/store/useRawStore";
import { PACKAGES } from "@/lib/wallet-packages";

export interface PaymentModalProps {
  selectedPackage: (typeof PACKAGES)[number];
  onBack: () => void;
  onClose: () => void;
}

export function PaymentModal({
  selectedPackage,
  onClose,
}: PaymentModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* sheet */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-raw-gold/30 bg-raw-black overflow-y-auto max-h-[92dvh] sm:max-h-[90vh]">
        <div className="p-5 sm:p-6">
          {/* header */}
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide text-raw-text">Payments coming soon</h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-raw-border/40 text-raw-silver/60 transition hover:border-raw-gold/40 hover:text-raw-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* order summary */}
          <div className="mb-5 rounded-xl border border-raw-gold/25 bg-raw-gold/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-raw-silver/50">Order Summary</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={TokenImage} alt="Token" className="h-5 w-5 object-contain" />
                <span className="font-display text-lg text-raw-text">{selectedPackage.tokens.toLocaleString()} tokens</span>
              </div>
              <span className="font-display text-lg text-raw-gold">${selectedPackage.price.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-raw-border/40 bg-raw-surface/25 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raw-gold/10 text-raw-gold">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-raw-text">Checkout is not available yet.</p>
                <p className="mt-1 text-xs leading-relaxed text-raw-silver/50">
                  Token purchases are coming soon. No card details can be entered or stored right now.
                </p>
              </div>
            </div>
          </div>

          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-raw-gold/20 px-8 py-3.5 text-sm font-semibold text-raw-gold/55"
          >
            <Lock className="h-4 w-4" />
            Coming Soon
          </button>

          <p className="mt-4 text-center text-[10px] text-raw-silver/30">
            Payment integration coming soon · UI preview only
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function closePayment(
  setPaymentOpen: (v: boolean) => void,
) {
  setPaymentOpen(false);
}

export function DashboardWallet() {
  const { tokenBalance: balance } = useRawStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const handleClose = () => closePayment(setPaymentOpen);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">Billing</h1>
        <p className="text-xs text-raw-silver/45 sm:text-sm">
          Purchase tokens to unlock features, boost rewards, and access premium content.
        </p>
      </header>

      {/* Balance */}
      <section className="relative overflow-hidden rounded-2xl border border-raw-gold/25 bg-raw-black/50 p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_-20%,rgba(241,196,45,0.18),transparent_55%)]" />
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-raw-gold/60">Current Balance</p>
            <p className="mt-1 font-display text-3xl tracking-wide text-raw-text sm:text-4xl">{balance}</p>
            <p className="mt-1 text-xs text-raw-silver/40">tokens</p>
          </div>
          <img src={TokenImage} alt="Token" className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14" />
        </div>
      </section>

      {/* Monthly Subscription */}
      <section>
        <div className="relative overflow-hidden rounded-2xl border border-raw-gold/30 bg-raw-black sm:rounded-3xl">
          {/* layered glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(241,196,45,0.22),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_110%,rgba(241,196,45,0.10),transparent)]" />
          {/* dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />

          <div className="relative px-4 pb-4 pt-4 sm:px-8 sm:pb-7 sm:pt-8">
            {/* badge */}
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-raw-gold/40 bg-raw-gold/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-raw-gold sm:mb-4 sm:px-3 sm:text-[10px] sm:tracking-[0.18em]">
              <Zap className="h-2.5 w-2.5 fill-current" /> All Access
            </div>

            {/* price + perks row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
              <div>
                <p className="font-display text-4xl tracking-tight text-raw-text sm:text-6xl">
                  $5
                  <span className="ml-1.5 text-sm font-normal tracking-normal text-raw-silver/40 sm:ml-2 sm:text-base">/ mo</span>
                </p>
                <div className="mt-3 flex flex-col gap-1 sm:mt-4 sm:gap-1.5">
                  <span className="flex items-center gap-2 text-xs text-raw-silver/55">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-raw-gold/70" />
                    Every community, no limits
                  </span>
                  <span className="flex items-center gap-2 text-xs text-raw-silver/55">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-raw-gold/70" />
                    Cancel anytime
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-1.5 sm:items-end">
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-raw-gold/25 bg-raw-gold/10 px-6 py-3 text-sm font-semibold text-raw-gold/50 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-3.5"
                >
                  Coming Soon
                </button>
                <p className="text-center text-[10px] text-raw-silver/25 sm:text-right">Payments coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section>
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-raw-silver/40">Choose a package</p>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {PACKAGES.map((pkg) => {
            const isSelected = selected === pkg.id;
            return (
              <button
                key={pkg.id}
                onClick={() => { setSelected(pkg.id); setPaymentOpen(true); }}
                className={`group relative overflow-hidden rounded-2xl border p-3 sm:p-5 text-left transition-all ${
                  isSelected
                    ? "border-raw-gold/60 shadow-[0_0_24px_rgba(241,196,45,0.2)]"
                    : pkg.highlight
                      ? "border-raw-gold/35 hover:border-raw-gold/55"
                      : "border-raw-border/40 hover:border-raw-border/70"
                }`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${pkg.accent}`} />
                <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.12)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />

                <div className={`relative mb-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                  pkg.highlight
                    ? "border border-raw-gold/35 bg-raw-gold/15 text-raw-gold"
                    : "border border-raw-border/35 bg-raw-surface/30 text-raw-silver/50"
                }`}>
                  {pkg.label}
                </div>

                <div className="relative flex items-center gap-1.5">
                  <img src={TokenImage} alt="Token" className="h-4 w-4 object-contain" />
                  <span className="font-display text-xl sm:text-2xl text-raw-text">{pkg.tokens.toLocaleString()}</span>
                </div>
                <p className="relative text-[11px] text-raw-silver/50">tokens</p>

                <div className="relative mt-2 flex items-end justify-between">
                  <div>
                    <p className="font-display text-lg sm:text-xl text-raw-text">${pkg.price.toFixed(2)}</p>
                    <p className="text-[10px] text-raw-silver/40">{pkg.perToken}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-raw-gold" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-raw-silver/35">Token purchases are coming soon. Tokens never expire.</p>

      {paymentOpen && selected && (
        <PaymentModal
          selectedPackage={PACKAGES.find((p) => p.id === selected)!}
          onBack={handleClose}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
