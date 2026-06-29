import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowLeft, X, Lock, CreditCard } from "lucide-react";
import { BrandName } from "@/components/ui/brand-name";

const DONATION_AMOUNTS = [5, 10, 25, 50];

function DonationModal({ amount, onClose }: { amount: number; onClose: () => void }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-raw-gold/30 bg-raw-black overflow-y-auto max-h-[92dvh] sm:max-h-[90vh]">
        <div className="p-5 sm:p-6">
          {/* header */}
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide text-raw-text">Complete donation</h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-raw-border/40 text-raw-silver/60 transition hover:border-raw-gold/40 hover:text-raw-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* order summary */}
          <div className="mb-5 rounded-xl border border-raw-gold/25 bg-raw-gold/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-raw-silver/50">Donation</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-raw-gold">${amount}</span>
              <span className="text-sm text-raw-silver/50">one-time</span>
            </div>
          </div>

          {/* card fields */}
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-raw-silver/50">Card details</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-raw-silver/60">Cardholder name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-raw-border/40 bg-raw-black/60 px-4 py-3 text-sm text-raw-text placeholder-raw-silver/30 outline-none focus:border-raw-gold/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-raw-silver/60">Card number</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full rounded-xl border border-raw-border/40 bg-raw-black/60 px-4 py-3 pr-10 text-sm text-raw-text placeholder-raw-silver/30 outline-none focus:border-raw-gold/50"
                />
                <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-raw-silver/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-raw-silver/60">Expiry</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className="w-full rounded-xl border border-raw-border/40 bg-raw-black/60 px-4 py-3 text-sm text-raw-text placeholder-raw-silver/30 outline-none focus:border-raw-gold/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-raw-silver/60">CVC</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full rounded-xl border border-raw-border/40 bg-raw-black/60 px-4 py-3 text-sm text-raw-text placeholder-raw-silver/30 outline-none focus:border-raw-gold/50"
                />
              </div>
            </div>
          </div>

          {/* submit */}
          <button
            className="mt-6 w-full rounded-full bg-raw-gold py-3.5 text-base font-semibold text-raw-black transition hover:bg-raw-gold/90"
          >
            Donate ${amount}
          </button>

          {/* security note */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-raw-silver/40">
            <Lock className="h-3 w-3" />
            Payments are encrypted and secure
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function WhyDonate() {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-raw-black">
      <nav className="border-b border-raw-border/50 bg-raw-black/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-raw-silver/60 transition-colors hover:text-raw-text"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="mb-12 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-raw-text sm:text-5xl">
            Why Donate to <BrandName />?
          </h1>
          <p className="text-lg leading-relaxed text-raw-silver/75">
            Your support helps us build a platform for genuine anonymous conversations.
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission Section */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">Our Mission</h2>
            <p className="text-raw-silver/70">
              {/* Add your mission statement and explanation here */}
              Placeholder: Describe the purpose and mission of raW
            </p>
          </section>

          {/* Data/Stats Section */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">Impact by the Numbers</h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {/* Add your stats/data cards here */}
              <div className="rounded-lg border border-raw-border/30 bg-raw-black/50 p-6">
                <div className="text-3xl font-bold text-raw-gold">—</div>
                <p className="mt-2 text-sm text-raw-silver/60">Metric placeholder</p>
              </div>
            </div>
          </section>

          {/* How Donations Help */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">How Your Donation Helps</h2>
            <ul className="space-y-3 text-raw-silver/70">
              <li className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raw-gold/20 text-xs font-bold text-raw-gold">
                  •
                </span>
                <span>Placeholder: First benefit</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raw-gold/20 text-xs font-bold text-raw-gold">
                  •
                </span>
                <span>Placeholder: Second benefit</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raw-gold/20 text-xs font-bold text-raw-gold">
                  •
                </span>
                <span>Placeholder: Third benefit</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-lg border border-raw-gold/35 bg-gradient-to-b from-raw-gold/[0.08] to-transparent p-8 text-center">
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">
              Ready to Support <BrandName />?
            </h2>
            <p className="mb-6 text-raw-silver/70">
              Your contribution helps us continue building the future of anonymous communication.
            </p>

            {/* amount selector */}
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {DONATION_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`min-w-[72px] rounded-full border px-5 py-2 text-sm font-semibold transition ${
                    selectedAmount === amt
                      ? "border-raw-gold bg-raw-gold text-raw-black"
                      : "border-raw-gold/40 text-raw-gold hover:border-raw-gold hover:bg-raw-gold/10"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-raw-gold px-8 py-3 text-base font-semibold text-raw-black transition hover:bg-raw-gold/90"
            >
              Donate ${selectedAmount}
            </button>
          </section>
        </div>
      </main>

      {modalOpen && (
        <DonationModal amount={selectedAmount} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
