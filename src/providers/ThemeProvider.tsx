import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ACCENT_PRESETS,
  THEME_ACCENT_STORAGE_KEY,
  THEME_MODE_STORAGE_KEY,
  ThemeContext,
  type AccentPresetId,
  type ThemeMode,
} from "@/providers/theme-context";

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return storedMode === "light" || storedMode === "medium" ? storedMode : "dark";
}

function getStoredAccent(): AccentPresetId {
  if (typeof window === "undefined") {
    return "gold";
  }

  const storedAccent = window.localStorage.getItem(THEME_ACCENT_STORAGE_KEY) as AccentPresetId | null;
  return ACCENT_PRESETS.some((preset) => preset.id === storedAccent) ? storedAccent : "gold";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [accent, setAccent] = useState<AccentPresetId>(() => getStoredAccent());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    const selectedAccent = ACCENT_PRESETS.find((preset) => preset.id === accent) ?? ACCENT_PRESETS[0];

    root.classList.toggle("theme-light", mode === "light");
    root.classList.toggle("theme-medium", mode === "medium");
    root.dataset.themeMode = mode;
    root.dataset.themeAccent = accent;
    root.style.setProperty("--raw-accent", selectedAccent.rgb);
    root.style.setProperty("--raw-accent-shadow", selectedAccent.shadowRgb);
    root.style.setProperty("--primary", selectedAccent.hsl);
    root.style.setProperty("--accent", selectedAccent.hsl);
    root.style.setProperty("--ring", selectedAccent.hsl);
    root.style.setProperty("--sidebar-primary", selectedAccent.hsl);
    root.style.setProperty("--sidebar-ring", selectedAccent.hsl);

    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    window.localStorage.setItem(THEME_ACCENT_STORAGE_KEY, accent);
  }, [accent, mode]);

  const value = useMemo(() => ({ mode, accent, accentPresets: ACCENT_PRESETS, setMode, setAccent }), [accent, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
