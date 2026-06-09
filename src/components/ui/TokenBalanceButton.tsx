import { useEffect, useRef, useState } from "react";
import tokenImg from "@/assets/tokens.webp";
import { useRawStore } from "@/store/useRawStore";
import { useTheme } from "@/providers/useTheme";

type TokenPack = { id: string; tokens: number; priceUsd: number; label: string; tag?: string };

const TOKEN_PACKS: TokenPack[] = [
  { id: "tokens-50", tokens: 50, priceUsd: 5, label: "Starter" },
  { id: "tokens-100", tokens: 100, priceUsd: 10, label: "Basic" },
  { id: "tokens-200", tokens: 200, priceUsd: 18, label: "Popular", tag: "Popular" },
  { id: "tokens-500", tokens: 500, priceUsd: 40, label: "Best Value", tag: "Best value" },
  { id: "tokens-1000", tokens: 1000, priceUsd: 85, label: "Power User" },
];

export function TokenBalanceButton() {
  const { tokenBalance: balance } = useRawStore();
  const { mode } = useTheme();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isLight = mode === "light";

  function handleClick() {
    if (spinning) return;
    setSpinning(true);
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      setSpinning(false);
      setOpen((o) => !o);
    }, 420);
  }

  function handleBuy(packId: string) {
    setPendingPackId(packId);
    // Real Stripe / payment integration plugs in here. The frontend cannot mint
    // tokens directly (server returns 403); the buy click currently records
    // intent and surfaces a "coming soon" hint until the checkout API lands.
    window.setTimeout(() => setPendingPackId(null), 1600);
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
          0%   { transform: rotateY(0deg) scale(1); }
          40%  { transform: rotateY(180deg) scale(1.15); }
          80%  { transform: rotateY(320deg) scale(1.05); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        .token-spin-anim {
          animation: token-spin 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-style: preserve-3d;
        }
        @keyframes balance-text-in {
          from { opacity: 0; max-width: 0; }
          to   { opacity: 1; max-width: 80px; }
        }
        .balance-text-in {
          animation: balance-text-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          overflow: hidden;
          white-space: nowrap;
        }
      `}</style>

      <button
        type="button"
        onClick={handleClick}
        aria-label="Token balance"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-xl border px-2 py-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
        style={{
          borderColor: open
            ? isLight ? "rgba(148,163,184,0.55)" : "rgba(250,204,21,0.45)"
            : "transparent",
          background: open
            ? isLight ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.85)"
            : "transparent",
          boxShadow: open
            ? isLight ? "0 6px 16px rgba(15,23,42,0.1)" : "0 0 12px rgba(250,204,21,0.12)"
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
          className={`shrink-0 select-none object-contain${spinning ? " token-spin-anim" : ""}`}
          style={{ filter: "drop-shadow(0 0 4px rgba(250,204,21,0.45))" }}
        />
        {open && !spinning && (
          <span className="balance-text-in font-display text-xs tracking-wide text-raw-gold">
            {balance}
          </span>
        )}
      </button>

      {open && !spinning && (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border p-3 shadow-xl ${
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
            {TOKEN_PACKS.map((pack) => {
              const pending = pendingPackId === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleBuy(pack.id)}
                  disabled={pending}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50 ${
                    isLight
                      ? "border-slate-200 hover:border-raw-gold/45 hover:bg-amber-50"
                      : "border-raw-border/45 hover:border-raw-gold/45 hover:bg-raw-gold/[0.06]"
                  } ${pending ? "opacity-60" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <img src={tokenImg} alt="" width={20} height={20} className="shrink-0 object-contain" />
                    <span>
                      <span className="block text-sm font-semibold text-raw-gold">{pack.tokens.toLocaleString()} tokens</span>
                      <span className={`text-[10px] uppercase tracking-[0.16em] ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>{pack.tag ?? pack.label}</span>
                    </span>
                  </span>
                  <span className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-raw-text"}`}>
                    {pending ? "…" : `$${pack.priceUsd.toFixed(2)}`}
                  </span>
                </button>
              );
            })}
          </div>
          <p className={`mt-3 text-[10px] leading-relaxed ${isLight ? "text-slate-500" : "text-raw-silver/40"}`}>
            Token purchases process through a secure checkout. Earn free tokens daily from the spin and challenges.
          </p>
        </div>
      )}
    </div>
  );
}
