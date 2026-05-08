import { cn } from "@/lib/utils";

interface HoverGradientVoteButtonProps {
  label: string;
  percent?: number;
  selected?: boolean;
  answered?: boolean;
  disabled?: boolean;
  align?: "left" | "right";
  themeHue?: "primary" | "neutral";
  onClick: () => void;
}

export function HoverGradientVoteButton({
  label,
  percent,
  selected = false,
  answered = false,
  disabled = false,
  align = "right",
  themeHue = "primary",
  onClick,
}: HoverGradientVoteButtonProps) {
  const isPrimary = themeHue === "primary";
  const borderGradient = isPrimary
    ? "linear-gradient(120deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 1), hsl(var(--ring) / 0.5))"
    : "linear-gradient(120deg, rgba(230,230,230,0.28), rgba(240,240,240,0.9), rgba(170,170,170,0.36))";

  const fillGradient = isPrimary
    ? align === "right"
      ? "linear-gradient(to left, hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.55))"
      : "linear-gradient(to right, hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.55))"
    : align === "right"
      ? "linear-gradient(to left, rgba(230,230,230,0.9), rgba(140,140,140,0.7))"
      : "linear-gradient(to right, rgba(230,230,230,0.9), rgba(140,140,140,0.7))";

  return (
    <button
      type="button"
      disabled={disabled || answered}
      onClick={onClick}
      className={cn(
        "group relative min-h-[4rem] overflow-hidden rounded-2xl p-[1.5px] text-center transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 disabled:cursor-not-allowed sm:min-h-[4.8rem]",
        selected ? "scale-[1.06]" : "hover:scale-[1.03]"
      )}
      style={{
        background: borderGradient,
        boxShadow: selected
          ? "0 0 24px hsl(var(--primary) / 0.55), 0 0 48px hsl(var(--primary) / 0.28)"
          : "0 0 12px hsl(var(--primary) / 0.12)",
      }}
    >
      <span className="absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <span className="relative block h-full w-full rounded-[calc(1rem-1.5px)] bg-black/85 px-2 py-2.5 sm:px-3 sm:py-3">
        {answered && (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 transition-all duration-1000 ease-out",
              align === "right" ? "right-0" : "left-0"
            )}
            style={{ width: `${percent ?? 0}%`, background: fillGradient }}
          />
        )}
        <span
          className="relative z-10 flex h-full flex-col items-center justify-center gap-1 font-display text-base tracking-wide text-white sm:text-lg"
          style={{
            textShadow: selected ? "0 0 10px hsl(var(--primary) / 0.9)" : undefined,
            opacity: answered && !selected ? 0.7 : 1,
          }}
        >
          {answered ? <span className="text-xl font-semibold leading-none">{percent ?? 0}%</span> : null}
          <span>{label}</span>
        </span>
      </span>
    </button>
  );
}
