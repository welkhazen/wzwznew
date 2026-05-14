import { useEffect, useState } from "react";
import { useAnimatedPercent } from "@/components/polls/useAnimatedPercent";
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
  showFill?: boolean;
  hideSelectedGlow?: boolean;
  isLight?: boolean;
}

const RESULT_ANIMATION_DURATION_MS = 800;

export function HoverGradientVoteButton({
  label,
  percent,
  selected = false,
  answered = false,
  disabled = false,
  align = "right",
  themeHue = "primary",
  onClick,
  showFill = true,
  hideSelectedGlow = false,
  isLight = false,
}: HoverGradientVoteButtonProps) {
  const [waterFilled, setWaterFilled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(media.matches);

    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);

    return () => {
      media.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  const displayedPercent = useAnimatedPercent(percent ?? 0, {
    durationMs: RESULT_ANIMATION_DURATION_MS,
    enabled: answered,
    reduceMotion: prefersReducedMotion,
  });

  useEffect(() => {
    if (!answered) {
      setWaterFilled(false);
      return;
    }

    setWaterFilled(false);
    const fillTimer = setTimeout(() => setWaterFilled(true), 60);

    return () => {
      clearTimeout(fillTimer);
    };
  }, [answered]);

  const isPrimary = themeHue === "primary";
  const useLightPillStyle = isLight && !answered;
  const dimmed = answered && !selected;
  const borderGradient = isLight
    ? dimmed
      ? "linear-gradient(120deg, rgba(120,108,76,0.2), rgba(120,108,76,0.32), rgba(120,108,76,0.2))"
      : isPrimary
        ? "linear-gradient(120deg, rgb(var(--raw-accent) / 0.45), rgb(var(--raw-accent) / 0.95), rgb(var(--raw-accent) / 0.48))"
        : "linear-gradient(120deg, rgba(80,72,52,0.22), rgba(80,72,52,0.48), rgba(80,72,52,0.22))"
    : dimmed
      ? "linear-gradient(120deg, rgba(60,60,60,0.4), rgba(80,80,80,0.5), rgba(60,60,60,0.4))"
      : isPrimary
        ? "linear-gradient(120deg, rgb(var(--raw-accent) / 0.35), rgb(var(--raw-accent) / 1), rgb(var(--raw-accent) / 0.5))"
        : "linear-gradient(120deg, rgba(230,230,230,0.28), rgba(240,240,240,0.9), rgba(170,170,170,0.36))";

  const fillGradient = isPrimary
    ? align === "right"
      ? "linear-gradient(to left, rgb(var(--raw-accent) / 0.95), rgb(var(--raw-accent) / 0.55))"
      : "linear-gradient(to right, rgb(var(--raw-accent) / 0.95), rgb(var(--raw-accent) / 0.55))"
    : align === "right"
      ? "linear-gradient(to left, rgba(230,230,230,0.9), rgba(140,140,140,0.7))"
      : "linear-gradient(to right, rgba(230,230,230,0.9), rgba(140,140,140,0.7))";

  return (
    <button
      type="button"
      disabled={disabled || answered}
      onClick={onClick}
      className={cn(
        "group relative min-h-[4rem] overflow-hidden rounded-2xl p-[1.5px] text-center transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/80 disabled:cursor-not-allowed sm:min-h-[4.8rem]",
        selected ? "scale-[1.06]" : "hover:scale-[1.03]"
      )}
      style={{
        background: borderGradient,
        boxShadow: isLight
          ? selected && !hideSelectedGlow
            ? "0 8px 18px rgb(var(--raw-accent) / 0.16), inset 0 1px 0 rgba(255,255,255,0.8)"
            : "0 6px 14px rgba(55,47,24,0.08), inset 0 1px 0 rgba(255,255,255,0.75)"
          : selected && !hideSelectedGlow
            ? "0 0 24px rgb(var(--raw-accent) / 0.55), 0 0 48px rgb(var(--raw-accent) / 0.28)"
            : dimmed ? "none" : "0 0 12px rgb(var(--raw-accent) / 0.12)",
      }}
    >
      <span className={cn(
        "absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent to-transparent",
        isLight ? "via-white/75" : "via-white/55"
      )} />
      <span className={cn(
        "relative block h-full w-full rounded-[calc(1rem-1.5px)] px-2 py-2.5 sm:px-3 sm:py-3",
        isLight
          ? selected
            ? "bg-[#fffaf0]"
            : "bg-[#f7f0dc]"
          : "bg-[#050505]/85"
      )}>
        {answered && showFill && (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0",
              align === "right" ? "right-0" : "left-0"
            )}
            style={{
              width: waterFilled ? `${percent ?? 0}%` : "0%",
              background: fillGradient,
              transition: waterFilled ? `width ${RESULT_ANIMATION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
            }}
          />
        )}
        <span
          className={cn(
            "relative z-10 flex h-full flex-col items-center justify-center gap-1 font-display text-base tracking-wide sm:text-lg",
            isLight ? "text-[#2a2000]" : "text-[#EBEBEB]"
          )}
          style={{
            opacity: answered && !selected ? 0.7 : 1,
          }}
        >
          {answered ? <span className="text-xl font-semibold leading-none">{displayedPercent}%</span> : null}
          <span>{label}</span>
        </span>
      </span>
    </button>
  );
}
