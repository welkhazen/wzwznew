import type { WheelPrize } from "@/components/wheel/WheelOfFortune";

function toRgba(rgbSpaceSeparated: string, alpha: number): string {
  const [r, g, b] = rgbSpaceSeparated.split(" ").map((value) => Number(value));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildSpinPrizes(mode: "light" | "dark", accentRgb: string): WheelPrize[] {
  const isLight = mode === "light";
  const neutralA = isLight ? "#c9d7ea" : "#1d2533";
  const neutralB = isLight ? "#b8c7dc" : "#131b29";
  const neutralText = isLight ? "#223247" : "#d7e1f2";
  const missText = isLight ? "#4e5f78" : "#6f7d93";
  const accentSoft = toRgba(accentRgb, isLight ? 0.28 : 0.24);
  const accentStrong = toRgba(accentRgb, isLight ? 0.38 : 0.32);

  return [
    { id: "xp-50", label: "50 XP", shortLabel: "50 XP", color: neutralA, textColor: neutralText },
    { id: "try-1", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "xp-100", label: "100 XP", shortLabel: "100 XP", color: accentSoft, textColor: neutralText },
    { id: "try-2", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "xp-200", label: "200 XP", shortLabel: "200 XP", color: accentStrong, textColor: neutralText },
    { id: "try-3", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "theme", label: "Avatar Theme", shortLabel: "THEME", color: accentStrong, textColor: neutralText },
    { id: "xp-50b", label: "50 XP", shortLabel: "50 XP", color: neutralA, textColor: neutralText },
    { id: "try-4", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "xp-500", label: "500 XP Jackpot!", shortLabel: "500 XP", color: isLight ? "#efd98f" : "#1a1508", textColor: isLight ? "#6f4e00" : "#F1C42D" },
    { id: "xp-100b", label: "100 XP", shortLabel: "100 XP", color: accentSoft, textColor: neutralText },
    { id: "xp-50c", label: "50 XP", shortLabel: "50 XP", color: neutralA, textColor: neutralText },
  ];
}
