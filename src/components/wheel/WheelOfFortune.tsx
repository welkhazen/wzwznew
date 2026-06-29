import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTheme } from "@/providers/useTheme";

// Keep in sync with WHEEL_REWARD_POOL in WheelReward.tsx.
const IMAGE_SCALE_BY_SRC: Record<string, number> = {
  "/avatars/1.webp": 1.18,                    // Silver Void
  "/avatars/landing/neon-lynx.webp": 1.45,    // Neon Lynx
  "/avatars/landing/blue-signal.webp": 1.45,  // Blue Signal
  "/avatars/landing/violet-mask.webp": 1.55,  // Violet Mask
  "/avatars/landing/viozen.webp": 1.45,       // Viozen
  "/avatars/6.webp": 1.0,                     // Crimson Muse
  "/avatars/landing/solar-flame.webp": 1.45,  // Solar Flame
  "/avatars/landing/pink-circuit.webp": 1.22, // Pink Circuit
};

export interface WheelPrize {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  textColor: string;
  imageSrc?: string;
}

interface WheelOfFortuneProps {
  prizes: WheelPrize[];
  onSpinEnd: (prize: WheelPrize) => void;
  onSpinStart?: () => void;
  disabled?: boolean;
  prizeWeights?: Partial<Record<string, number>>;
  forcedPrizeId?: string | null;
  radius?: number;
  previewOnly?: boolean;
  /** Replaces the disabled button label after spinning (e.g. countdown text). */
  disabledLabel?: React.ReactNode;
}

const SPIN_DURATION = 6500;
const MIN_ROTATIONS = 5;
const MAX_ROTATIONS = 8;

function getSegmentPath(index: number, total: number, radius: number): string {
  const angle = 360 / total;
  const start = index * angle - 90;
  const end = start + angle;
  const startRad = (start * Math.PI) / 180;
  const endRad = (end * Math.PI) / 180;

  const x1 = radius + radius * Math.cos(startRad);
  const y1 = radius + radius * Math.sin(startRad);
  const x2 = radius + radius * Math.cos(endRad);
  const y2 = radius + radius * Math.sin(endRad);
  const largeArcFlag = angle > 180 ? 1 : 0;

  return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

function getTextPosition(index: number, total: number, radius: number): { x: number; y: number; rotation: number } {
  const angle = 360 / total;
  const center = index * angle + angle / 2 - 90;
  const rad = (center * Math.PI) / 180;
  const textRadius = radius * 0.72;

  return {
    x: radius + textRadius * Math.cos(rad),
    y: radius + textRadius * Math.sin(rad),
    rotation: center,
  };
}


export function WheelOfFortune({ prizes, onSpinEnd, onSpinStart, disabled = false, prizeWeights, forcedPrizeId = null, radius: radiusProp = 200, previewOnly = false, disabledLabel }: WheelOfFortuneProps) {
  const { mode } = useTheme();
  const pointerId = useId().replace(/:/g, "");
  const baseId = useId().replace(/:/g, "");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const currentPrizeRef = useRef<WheelPrize | null>(null);
  const onSpinEndRef = useRef(onSpinEnd);
  const onSpinStartRef = useRef(onSpinStart);

  const radius = radiusProp;
  const size = radius * 2;
  const total = prizes.length;
  const isLight = mode === "light";
  const accentColor = "rgb(var(--raw-accent))";
  const accentSoft = "rgb(var(--raw-accent) / 0.3)";
  const pointerGradientId = `pointerGrad-${pointerId}`;
  const pointerShadowId = `pointerShadow-${pointerId}`;
  const wheelDisplaySize = `min(${size}px, calc(100vw - 3rem), calc(100svh - 12rem))`;

  useEffect(() => {
    onSpinEndRef.current = onSpinEnd;
  }, [onSpinEnd]);

  useEffect(() => {
    onSpinStartRef.current = onSpinStart;
  }, [onSpinStart]);

  const handleSpin = useCallback(() => {
    if (isSpinning || disabled || total === 0) {
      return;
    }

    setIsSpinning(true);
    onSpinStartRef.current?.();

    let prizeIndex = Math.floor(Math.random() * total);

    if (forcedPrizeId) {
      const forcedIndex = prizes.findIndex((prize) => prize.id === forcedPrizeId);
      if (forcedIndex >= 0) {
        prizeIndex = forcedIndex;
      }
    }

    if (!forcedPrizeId && prizeWeights) {
      const weightedEntries = prizes
        .map((prize, index) => ({ index, weight: Math.max(0, prizeWeights[prize.id] ?? 0) }))
        .filter((entry) => entry.weight > 0);

      if (weightedEntries.length > 0) {
        const totalWeight = weightedEntries.reduce((sum, entry) => sum + entry.weight, 0);

        if (totalWeight > 0) {
          let cursor = Math.random() * totalWeight;
          for (const entry of weightedEntries) {
            cursor -= entry.weight;
            if (cursor <= 0) {
              prizeIndex = entry.index;
              break;
            }
          }
        }
      }
    }

    currentPrizeRef.current = prizes[prizeIndex];

    const segmentAngle = 360 / total;
    const targetOffset = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    const currentRotationNormalized = ((rotation % 360) + 360) % 360;
    const deltaToTarget = ((targetOffset - currentRotationNormalized) + 360) % 360;
    const fullRotationCount = MIN_ROTATIONS + Math.floor(Math.random() * (MAX_ROTATIONS - MIN_ROTATIONS + 1));
    const fullRotations = fullRotationCount * 360;
    const finalRotation = rotation + fullRotations + deltaToTarget;

    setRotation(finalRotation);
  }, [disabled, forcedPrizeId, isSpinning, prizeWeights, prizes, rotation, total]);

  useEffect(() => {
    if (!isSpinning) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSpinning(false);
      if (currentPrizeRef.current) {
        onSpinEndRef.current(currentPrizeRef.current);
      }
    }, SPIN_DURATION + 180);

    return () => window.clearTimeout(timer);
  }, [isSpinning]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
        <svg width="32" height="40" viewBox="0 0 32 40">
          <defs>
            <linearGradient id={pointerGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor={accentColor} />
            </linearGradient>
            <filter id={pointerShadowId}>
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={accentColor} floodOpacity="0.4" />
            </filter>
          </defs>
          <polygon points="16,4 28,4 16,30 4,4" fill={`url(#${pointerGradientId})`} filter={`url(#${pointerShadowId})`} />
        </svg>
      </div>

      <div
        className={`relative aspect-square w-full rounded-full p-1.5 shadow-[0_0_45px_rgb(var(--raw-accent)/0.18)] ${
          isLight
            ? "border border-raw-border/70 bg-[linear-gradient(160deg,rgb(246_249_255),rgb(221_229_241))]"
            : "border border-raw-gold/30 bg-black/30"
        }`}
        style={{ maxWidth: wheelDisplaySize }}
      >
        {/* Center SPIN button — mobile only, sits inside the SVG center circle */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || disabled}
          className={`absolute left-1/2 top-1/2 z-10 flex h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-[8px] uppercase tracking-[0.04em] transition-all sm:hidden ${
            isSpinning || disabled
              ? "cursor-not-allowed bg-raw-surface/90 text-raw-silver/40"
              : "bg-raw-gold text-raw-black active:scale-95 shadow-[0_0_16px_rgb(var(--raw-accent)/0.5)]"
          }`}
        >
          {isSpinning ? "···" : disabled ? "Done" : "Spin"}
        </button>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="block h-full w-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17,0.67,0.12,0.99)` : "none",
          }}
        >
          {prizes.map((prize, index) => {
            const textPosition = getTextPosition(index, total, radius);
            const imgSize = 50;
            const clipId = `wheel-clip-${baseId}-${index}`;
            const scale = (prize.imageSrc && IMAGE_SCALE_BY_SRC[prize.imageSrc]) || 1;
            const scaledSize = imgSize * scale;
            return (
              <g key={prize.id}>
                <path d={getSegmentPath(index, total, radius)} fill={prize.color} stroke={isLight ? "#9ca9bb" : "#1f1f1f"} strokeWidth="1" />
                {prize.imageSrc ? (
                  <g transform={`rotate(${textPosition.rotation + 90} ${textPosition.x} ${textPosition.y})`}>
                    <defs>
                      <clipPath id={clipId}>
                        <circle cx={textPosition.x} cy={textPosition.y} r={imgSize / 2} />
                      </clipPath>
                    </defs>
                    <circle cx={textPosition.x} cy={textPosition.y} r={imgSize / 2} fill={isLight ? "#1a1a1a" : "#000000"} />
                    <image
                      href={prize.imageSrc}
                      x={textPosition.x - scaledSize / 2}
                      y={textPosition.y - scaledSize / 2}
                      width={scaledSize}
                      height={scaledSize}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#${clipId})`}
                    />
                    <text
                      x={textPosition.x}
                      y={textPosition.y + imgSize / 2 + 10}
                      fill={prize.textColor}
                      fontSize={9}
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      letterSpacing="0.5"
                    >
                      {prize.shortLabel}
                    </text>
                  </g>
                ) : (
                  <text
                    x={textPosition.x}
                    y={textPosition.y}
                    fill={prize.textColor}
                    fontSize={prize.shortLabel.length > 7 ? 9 : 11}
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    letterSpacing="0.6"
                    transform={`rotate(${textPosition.rotation} ${textPosition.x} ${textPosition.y})`}
                  >
                    {prize.shortLabel}
                  </text>
                )}
              </g>
            );
          })}

          <circle cx={radius} cy={radius} r={radius * 0.28} fill={isLight ? "#edf2fa" : "#080808"} stroke={accentColor} strokeWidth="2" />
          <circle cx={radius} cy={radius} r={radius * 0.24} fill={isLight ? "#d9e2f0" : "#0c0c0c"} stroke={accentColor} strokeWidth="0.5" />

          {prizes.map((_, index) => {
            const angle = (index * 360) / total - 90;
            const rad = (angle * Math.PI) / 180;
            const dotRadius = radius - 8;
            const cx = radius + dotRadius * Math.cos(rad);
            const cy = radius + dotRadius * Math.sin(rad);

            return <circle key={`dot-${index}`} cx={cx} cy={cy} r="3" fill={accentSoft} opacity={isLight ? "0.65" : "0.8"} />;
          })}
        </svg>
      </div>

      {!previewOnly && (
        <button
          onClick={handleSpin}
          disabled={isSpinning || disabled}
          className={`mt-4 hidden overflow-hidden rounded-full px-10 py-3.5 font-display text-sm uppercase tracking-[0.2em] transition-all sm:relative sm:mt-8 sm:block ${
            isSpinning || disabled
              ? "cursor-not-allowed border border-raw-border/30 bg-raw-surface text-raw-silver/30"
              : "bg-raw-gold text-raw-black hover:scale-105 hover:shadow-[0_0_30px_rgb(var(--raw-accent)/0.3)] active:scale-95"
          }`}
        >
          {isSpinning
            ? "Spinning..."
            : disabled
              ? (disabledLabel ?? "Spin Complete")
              : "Spin"}
        </button>
      )}
    </div>
  );
}
