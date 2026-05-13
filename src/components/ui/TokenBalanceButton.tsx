import { useRef, useState } from "react";

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
    <div className="relative flex items-center">
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
        @keyframes pill-in {
          from { opacity: 0; transform: translateX(-6px) scaleX(0.85); }
          to   { opacity: 1; transform: translateX(0) scaleX(1); }
        }
        .pill-in-anim {
          animation: pill-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: left center;
        }
      `}</style>

      {/* Token button */}
      <button
        type="button"
        onClick={handleClick}
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-raw-surface/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
        style={{
          transform: open ? "translateX(-4px)" : "translateX(0)",
          transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        aria-label="Token balance"
        aria-expanded={open}
      >
        <img
          src="/token.png"
          alt="WZWZ token"
          width={26}
          height={26}
          draggable={false}
          className={`select-none object-contain${spinning ? " token-spin-anim" : ""}`}
          style={{ filter: "drop-shadow(0 0 4px rgba(250,204,21,0.45))" }}
        />
      </button>

      {/* Inline balance pill */}
      {open && !spinning && (
        <div
          className="pill-in-anim ml-1 flex items-center gap-1.5 overflow-hidden rounded-xl border border-raw-gold/40 bg-raw-black/90 px-2.5 py-1 backdrop-blur-sm"
          style={{ boxShadow: "0 0 12px rgba(250,204,21,0.12), inset 0 0 0 1px rgba(250,204,21,0.06)" }}
        >
          <img
            src="/token.png"
            alt=""
            width={14}
            height={14}
            draggable={false}
            className="shrink-0 object-contain opacity-80"
          />
          <span className="whitespace-nowrap font-display text-xs tracking-wide text-raw-gold">
            {balance} {symbol}
          </span>
        </div>
      )}
    </div>
  );
}
