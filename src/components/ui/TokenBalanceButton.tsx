import { useRef, useState } from "react";
import tokenImg from "@/assets/tokens.png";

interface TokenBalanceButtonProps {
  balance?: number | string;
  symbol?: string;
}

export function TokenBalanceButton({ balance = 0, symbol = "WZWZ" }: TokenBalanceButtonProps) {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          to   { opacity: 1; max-width: 120px; }
        }
        .balance-text-in {
          animation: balance-text-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          overflow: hidden;
          white-space: nowrap;
        }
      `}</style>

      {/* Pill wraps the token icon + optional balance text — no duplicate icon */}
      <button
        type="button"
        onClick={handleClick}
        aria-label="Token balance"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border px-2 py-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
        style={{
          borderColor: open ? "rgba(250,204,21,0.45)" : "transparent",
          background: open ? "rgba(0,0,0,0.85)" : "transparent",
          boxShadow: open ? "0 0 12px rgba(250,204,21,0.12)" : "none",
          backdropFilter: open ? "blur(8px)" : "none",
        }}
      >
        <img
          src={tokenImg}
          alt="WZWZ token"
          width={26}
          height={26}
          draggable={false}
          className={`shrink-0 select-none object-contain${spinning ? " token-spin-anim" : ""}`}
          style={{ filter: "drop-shadow(0 0 4px rgba(250,204,21,0.45))" }}
        />
        {open && !spinning && (
          <span className="balance-text-in font-display text-xs tracking-wide text-raw-gold">
            {balance} {symbol}
          </span>
        )}
      </button>
    </>
  );
}
