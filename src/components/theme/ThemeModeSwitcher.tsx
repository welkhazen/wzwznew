import { Sun, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/useTheme";
import type { ThemeMode } from "@/providers/theme-context";

const MODES: {
  mode: ThemeMode;
  Icon: React.ElementType;
  label: string;
  activeColor: string;
}[] = [
  { mode: "light", Icon: Sun,    label: "Light", activeColor: "text-amber-500" },
  { mode: "dusk",  Icon: Sunset, label: "Dusk",  activeColor: "text-orange-400" },
  { mode: "dark",  Icon: Moon,   label: "Dark",  activeColor: "text-violet-400" },
];

export function ThemeModeSwitcher({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  const activeIndex = MODES.findIndex((m) => m.mode === mode);
  const isLight = mode === "light";
  const isDusk = mode === "dusk";

  return (
    <div
      role="group"
      aria-label="Theme mode"
      className={cn(
        "relative flex h-8 w-[5.5rem] shrink-0 items-center rounded-full border p-[3px] transition-colors duration-300",
        isLight
          ? "border-slate-200/80 bg-slate-100/90"
          : isDusk
            ? "border-[#3d2a1e]/60 bg-[#1c1008]/70"
            : "border-raw-border/40 bg-raw-surface/60",
        className
      )}
    >
      {/* Sliding active pill */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-[3px] rounded-full transition-[transform,box-shadow] duration-300",
          "will-change-transform",
          isLight
            ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.05)]"
            : isDusk
              ? "bg-[#2e1a0e] shadow-[0_1px_4px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,160,80,0.08)]"
              : "bg-[#1e2030] shadow-[0_1px_4px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)]"
        )}
        style={{
          width: "calc((100% - 6px) / 3)",
          height: "calc(100% - 6px)",
          left: "3px",
          transform: `translateX(calc(${activeIndex} * 100%))`,
          transitionTimingFunction: "cubic-bezier(0.34, 1.4, 0.64, 1)",
        }}
      />

      {/* Buttons */}
      {MODES.map(({ mode: m, Icon, label, activeColor }) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-label={`${label} mode`}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center rounded-full",
              "h-full transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-raw-gold/60",
              isActive
                ? activeColor
                : isLight
                  ? "text-slate-400 hover:text-slate-500"
                  : "text-raw-silver/35 hover:text-raw-silver/60"
            )}
          >
            <Icon
              className={cn(
                "transition-transform duration-200",
                isActive ? "h-3.5 w-3.5 scale-110" : "h-3.5 w-3.5 scale-100"
              )}
              strokeWidth={isActive ? 2 : 1.75}
            />
          </button>
        );
      })}
    </div>
  );
}
