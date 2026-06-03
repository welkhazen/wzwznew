import lvl1 from "@/assets/lvl-1.webp";
import lvl2 from "@/assets/lvl-2.webp";
import lvl3 from "@/assets/lvl-3.webp";
import lvl4 from "@/assets/lvl-4.webp";
import lvl5 from "@/assets/lvl-5.webp";
import lvl6 from "@/assets/lvl-6.webp";
import lvl7 from "@/assets/lvl-7.webp";
import lvl8 from "@/assets/lvl-8.webp";
import lvl9 from "@/assets/lvl-9.webp";
import lvl10 from "@/assets/lvl-10.webp";
import { cn } from "@/lib/utils";
import { xpProgressInLevel } from "@/lib/userProgress";

const levelBanners = [lvl1, lvl2, lvl3, lvl4, lvl5, lvl6, lvl7, lvl8, lvl9, lvl10];
const XP_MAX_LEVEL = levelBanners.length;

interface LevelProgressBannerProps {
  xp: number;
  level: number;
  compact?: boolean;
  className?: string;
}

function getLevelBanner(level: number): string {
  const index = Math.min(Math.max(level, 1), levelBanners.length) - 1;
  return levelBanners[index];
}

export function LevelProgressBanner({ xp, level, compact = false, className }: LevelProgressBannerProps) {
  const safeLevel = Math.min(Math.max(level, 1), XP_MAX_LEVEL);
  const nextLevel = Math.min(safeLevel + 1, XP_MAX_LEVEL);
  const isMax = safeLevel >= XP_MAX_LEVEL;
  const { current, needed, pct } = xpProgressInLevel(xp, safeLevel);
  const badgeFrameSize = compact ? "h-9 w-9" : "h-12 w-12";
  const badgeImageSize = compact ? "h-7 w-7" : "h-9 w-9";
  const progressLabel = isMax ? `${xp.toLocaleString()} XP` : `${current.toLocaleString()} / ${needed.toLocaleString()} XP`;

  return (
    <div className={cn("rounded-2xl border border-raw-border/40 bg-raw-black/35 px-5 py-4", className)}>
      {/* Level labels row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <img
            src={getLevelBanner(safeLevel)}
            alt={`Level ${safeLevel}`}
            className={cn("block rounded-full object-contain object-center", badgeImageSize)}
          />
          <span className={cn("whitespace-nowrap font-display tracking-wide text-[#8f96ff]", compact ? "text-[11px]" : "text-xs")}>
            Lvl {safeLevel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("whitespace-nowrap font-display tracking-wide text-[#8f96ff]/60", compact ? "text-[11px]" : "text-xs")}>
            {isMax ? "Max" : `Lvl ${nextLevel}`}
          </span>
          <img
            src={getLevelBanner(nextLevel)}
            alt={isMax ? `Level ${safeLevel}` : `Level ${nextLevel}`}
            className={cn("block rounded-full object-contain object-center opacity-50", badgeImageSize)}
          />
        </div>
      </div>
      {/* Progress bar */}
      <div className={cn(
        "relative overflow-hidden rounded-full bg-raw-border/20",
        compact ? "h-3.5" : "h-4",
      )}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-raw-gold/75 to-raw-gold transition-all duration-500 shadow-[0_0_10px_rgba(241,196,45,0.35)]"
          style={{ width: `${pct}%` }}
        />
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-bold leading-none tracking-wide text-white",
            compact ? "text-[9px]" : "text-[11px]",
          )}
          style={{ textShadow: "0 0 3px rgba(0,0,0,0.85), 0 1px 1px rgba(0,0,0,0.7)" }}
        >
          {progressLabel}
        </span>
      </div>
    </div>
  );
}
