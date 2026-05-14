import { useRef, useState } from "react";
import tokenImg from "@/assets/tokens.png";
import { useRawStore } from "@/store/useRawStore";
import { useTheme } from "@/providers/useTheme";

export function TokenBalanceButton() {
  const { tokenBalance: balance } = useRawStore();
  const { mode } = useTheme();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  return (
    <>
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
    </>
  );
}
