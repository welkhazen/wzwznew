import { useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import TokenImage from "@/assets/tokens.png";
import { useRawStore } from "@/store/useRawStore";

const PACKAGES = [
  { id: "tokens-50",   tokens: 50,   price: 5,   label: "Starter",    highlight: false, accent: "from-sky-500/20 via-blue-500/10 to-transparent",       perToken: "10¢ / token" },
  { id: "tokens-100",  tokens: 100,  price: 10,  label: "Basic",      highlight: false, accent: "from-violet-500/20 via-fuchsia-500/10 to-transparent",  perToken: "10¢ / token" },
  { id: "tokens-200",  tokens: 200,  price: 20,  label: "Popular",    highlight: false, accent: "from-raw-gold/25 via-amber-500/10 to-transparent",      perToken: "10¢ / token" },
  { id: "tokens-500",  tokens: 500,  price: 50,  label: "Best Value", highlight: true,  accent: "from-emerald-500/20 via-teal-500/10 to-transparent",    perToken: "10¢ / token" },
  { id: "tokens-1000", tokens: 1000, price: 100, label: "Power User", highlight: false, accent: "from-rose-500/20 via-pink-500/10 to-transparent",       perToken: "10¢ / token" },
] as const;

export function DashboardWallet() {
  const { tokenBalance: balance } = useRawStore();
  const [selected, setSelected] = useState<string | null>(null);

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
        <div className="relative overflow-hidden rounded-3xl border border-raw-gold/30 bg-raw-black">
          {/* layered glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(241,196,45,0.22),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_110%,rgba(241,196,45,0.10),transparent)]" />
          {/* dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />

          <div className="relative px-5 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
            {/* badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-raw-gold/40 bg-raw-gold/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-raw-gold">
              <Zap className="h-2.5 w-2.5 fill-current" /> All Access
            </div>

            {/* price + perks row */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-display text-5xl tracking-tight text-raw-text sm:text-6xl">
                  $5
                  <span className="ml-2 text-base font-normal tracking-normal text-raw-silver/40">/ mo</span>
                </p>
                <div className="mt-4 flex flex-col gap-1.5">
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
                  className="w-full cursor-not-allowed rounded-2xl border border-raw-gold/25 bg-raw-gold/10 px-8 py-3.5 text-sm font-semibold text-raw-gold/50 sm:w-auto"
                >
                  Coming Soon
                </button>
                <p className="text-center text-[10px] text-raw-silver/25 sm:text-right">Stripe · Secure checkout</p>
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
                onClick={() => setSelected(pkg.id)}
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
                    <p className="font-display text-lg sm:text-xl text-raw-text">${pkg.price}</p>
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

      {/* Buy button */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          disabled={!selected}
          className="w-full rounded-xl bg-raw-gold px-6 py-3 text-sm font-semibold leading-tight text-raw-ink transition hover:bg-raw-gold/90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
        >
          {selected
            ? `Buy ${PACKAGES.find((p) => p.id === selected)?.tokens.toLocaleString()} tokens — $${PACKAGES.find((p) => p.id === selected)?.price}`
            : "Select a package to continue"}
        </button>
        <p className="text-xs text-raw-silver/35">Payments powered by Stripe. Tokens never expire.</p>
      </div>
    </div>
  );
}
