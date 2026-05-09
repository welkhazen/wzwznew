import { createContext } from "react";

export type ThemeMode = "dark" | "medium" | "light";

export type AccentPresetId =
  | "gold"
  | "coral"
  | "rose"
  | "crimson"
  | "violet"
  | "indigo"
  | "ocean"
  | "cyan"
  | "emerald"
  | "lime";

export interface AccentPreset {
  id: AccentPresetId;
  label: string;
  rgb: string;
  shadowRgb: string;
  hsl: string;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  accent: AccentPresetId;
  accentPresets: AccentPreset[];
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentPresetId) => void;
}

export const THEME_MODE_STORAGE_KEY = "raw.theme.mode.v1";
export const THEME_ACCENT_STORAGE_KEY = "raw.theme.accent.v1";

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "gold", label: "Gold", rgb: "241 196 45", shadowRgb: "182 126 14", hsl: "47 88% 56%" },
  { id: "coral", label: "Coral", rgb: "255 125 92", shadowRgb: "213 88 54", hsl: "11 100% 68%" },
  { id: "rose", label: "Rose", rgb: "244 114 182", shadowRgb: "190 61 128", hsl: "330 82% 70%" },
  { id: "crimson", label: "Crimson", rgb: "248 113 113", shadowRgb: "191 54 54", hsl: "0 90% 71%" },
  { id: "violet", label: "Violet", rgb: "167 139 250", shadowRgb: "114 82 204", hsl: "255 92% 76%" },
  { id: "indigo", label: "Indigo", rgb: "129 140 248", shadowRgb: "78 92 212", hsl: "235 89% 74%" },
  { id: "ocean", label: "Ocean", rgb: "56 189 248", shadowRgb: "18 123 186", hsl: "198 93% 60%" },
  { id: "cyan", label: "Cyan", rgb: "45 212 191", shadowRgb: "14 148 136", hsl: "172 67% 50%" },
  { id: "emerald", label: "Emerald", rgb: "52 211 153", shadowRgb: "5 150 105", hsl: "158 64% 52%" },
  { id: "lime", label: "Lime", rgb: "163 230 53", shadowRgb: "101 163 13", hsl: "83 78% 55%" },
];

export const ThemeContext = createContext<ThemeContextValue | null>(null);
