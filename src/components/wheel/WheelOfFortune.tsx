import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTheme } from "@/providers/useTheme";

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
  disabled?: boolean;
  prizeWeights?: Partial<Record<string, number>>;
  forcedPrizeId?: string | null;
  radius?: number;
}

const SPIN_DURATION = 5000;
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

function getLabelLines(label: string): string[] {
  const parts = label.trim().split(/\s+/);
  if (parts.length <= 1) {
    return [label];
  }

  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }

  const midpoint = Math.ceil(parts.length / 2);
  return [parts.slice(0, midpoint).join(" "), parts.slice(midpoint).join(" ")];
}

export function WheelOfFortune({ prizes, onSpinEnd, disabled = false, prizeWeights, forcedPrizeId = null, radius: radiusProp = 200 }: WheelOfFortuneProps) {
  const { mode } = useTheme();
  const pointerId = useId().replace(/:/g, "");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const currentPrizeRef = useRef<WheelPrize | null>(null);

  const radius = radiusProp;
  const size = radius * 2;
  const total = prizes.length;
  const isLight = mode === "light";
  const accentColor = "rgb(var(--raw-accent))";
  const accentSoft = "rgb(var(--raw-accent) / 0.3)";
  const pointerGradientId = `pointerGrad-${pointerId}`;
  const pointerShadowId = `pointerShadow-${pointerId}`;

  const handleSpin = useCallback(() => {
    if (isSpinning || disabled || total === 0) {
      return;
    }

    setIsSpinning(true);

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
        onSpinEnd(currentPrizeRef.current);
      }
    }, SPIN_DURATION + 180);

    return () => window.clearTimeout(timer);
  }, [isSpinning, onSpinEnd]);

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
        className={`relative aspect-square w-full max-w-[min(400px,calc(100vw-3rem))] rounded-full p-1.5 shadow-[0_0_45px_rgb(var(--raw-accent)/0.18)] ${
          isLight
            ? "border border-raw-border/70 bg-[linear-gradient(160deg,rgb(246_249_255),rgb(221_229_241))]"
            : "border border-raw-gold/30 bg-black/30"
        }`}
      >
        {/* Center SPIN button — mobile only, sits inside the SVG center circle */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || disabled}
          className={`hidden absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1.5 font-display text-[10px] uppercase tracking-[0.18em] transition-all whitespace-nowrap ${
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
            return (
              <g key={prize.id}>
                <path d={getSegmentPath(index, total, radius)} fill={prize.color} stroke={isLight ? "#9ca9bb" : "#1f1f1f"} strokeWidth="1" />
                {prize.imageSrc ? (
                  <image
                    href={prize.imageSrc}
                    x={textPosition.x - imgSize / 2}
                    y={textPosition.y - imgSize / 2}
                    width={imgSize}
                    height={imgSize}
                    transform={`rotate(${textPosition.rotation + 90} ${textPosition.x} ${textPosition.y})`}
                    style={{ borderRadius: "50%" }}
                  />
                ) : (
                  <text
                    x={textPosition.x}
                    y={textPosition.y}
                    fill={prize.textColor}
                    fontSize={prize.shortLabel.length > 7 ? 12 : 14}
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

      <button
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className={`mt-6 sm:mt-8 relative overflow-hidden rounded-full px-10 py-3.5 font-display text-sm uppercase tracking-[0.2em] transition-all ${
          isSpinning || disabled
            ? "cursor-not-allowed border border-raw-border/30 bg-raw-surface text-raw-silver/30"
            : "bg-raw-gold text-raw-black hover:scale-105 hover:shadow-[0_0_30px_rgb(var(--raw-accent)/0.3)] active:scale-95"
        }`}
      >
        {isSpinning ? "Spinning..." : disabled ? "Spin Complete" : "Spin"}
      </button>
    </div>
  );
}
