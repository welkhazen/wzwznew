import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const LAUNCH_DATE = new Date("2026-07-04T15:00:00");

function getTimeLeft() {
  const diff = LAUNCH_DATE.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSec = Math.floor(diff / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const totalH = Math.floor(totalMin / 60);
  const h = totalH % 24;
  const d = Math.floor(totalH / 24);
  return { d, h, m, s };
}

function Pad({ value, label, isLight }: { value: number; label: string; isLight: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn(
        "min-w-[2.5rem] rounded-xl border px-3 py-2 text-center font-mono text-xl font-bold tabular-nums sm:text-2xl",
        isLight
          ? "border-amber-200 bg-white text-amber-700"
          : "border-raw-gold/20 bg-raw-gold/8 text-raw-gold",
      )}>
        {String(value).padStart(2, "0")}
      </span>
      <span className={cn("text-[10px] uppercase tracking-[0.14em]", isLight ? "text-slate-400" : "text-raw-silver/40")}>
        {label}
      </span>
    </div>
  );
}

interface LaunchCountdownProps {
  isLight?: boolean;
  /** "banner" = compact strip for landing page; "section" = dashboard card style */
  variant?: "banner" | "section";
}

export function LaunchCountdown({ isLight = false, variant = "section" }: LaunchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (timeLeft === null) return null;

  if (variant === "banner") {
    return (
      <div className={cn(
        "flex flex-wrap items-center justify-center gap-4 border-y px-4 py-4 text-center sm:gap-6",
        isLight
          ? "border-amber-200/60 bg-amber-50/70"
          : "border-raw-gold/15 bg-raw-gold/[0.04]",
      )}>
        <div className="flex items-center gap-2">
          <Rocket className="size-4 text-raw-gold" />
          <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-white/80")}>
            Full launch — July 4, 2026 · 3 PM
          </span>
        </div>
        <div className="flex items-end gap-3">
          <Pad value={timeLeft.d} label="days" isLight={isLight} />
          <Pad value={timeLeft.h} label="hrs" isLight={isLight} />
          <Pad value={timeLeft.m} label="min" isLight={isLight} />
          <Pad value={timeLeft.s} label="sec" isLight={isLight} />
        </div>
      </div>
    );
  }

  return (
    <section className={cn(
      "space-y-4 rounded-2xl border p-5 sm:p-6",
      isLight
        ? "border-amber-200/60 bg-amber-50/50"
        : "border-raw-gold/15 bg-raw-gold/[0.04]",
    )}>
      <div className="flex items-center gap-2">
        <Rocket className="size-4 text-raw-gold" />
        <h2 className={cn("text-base font-bold", isLight ? "text-slate-950" : "text-white")}>
          Full launch
        </h2>
        <span className={cn("text-sm", isLight ? "text-slate-500" : "text-white/40")}>
          · July 4, 2026 at 3 PM
        </span>
      </div>
      <div className="flex gap-3 sm:gap-4">
        <Pad value={timeLeft.d} label="days" isLight={isLight} />
        <Pad value={timeLeft.h} label="hours" isLight={isLight} />
        <Pad value={timeLeft.m} label="minutes" isLight={isLight} />
        <Pad value={timeLeft.s} label="seconds" isLight={isLight} />
      </div>
    </section>
  );
}
