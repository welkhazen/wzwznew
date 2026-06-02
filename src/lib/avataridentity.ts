export interface AvatarTheme {
  bg: string;
  figure: string;
  ring: string;
  glow: string;
  name: string;
  imageSrc?: string;
}

import { readAvatarThemesFromCache } from "@/lib/avatarCatalog";

const DEFAULT_LEVEL_THEMES: AvatarTheme[] = [
  { bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180", name: "Silver Void", imageSrc: "/avatars/1.webp" },
  { bg: "#170f2e", figure: "#a855f7", ring: "#c084fc", glow: "#a855f780", name: "Neon Lynx", imageSrc: "/avatars/2.webp" },
  { bg: "#06131f", figure: "#22d3ee", ring: "#22d3ee", glow: "#22d3ee80", name: "Blue Signal", imageSrc: "/avatars/3.webp" },
  { bg: "#1a1028", figure: "#d946ef", ring: "#d946ef", glow: "#d946ef80", name: "Violet Mask", imageSrc: "/avatars/4.webp" },
  { bg: "#1f0a05", figure: "#fb923c", ring: "#fb923c", glow: "#fb923c80", name: "Viozen", imageSrc: "/avatars/5.png" },
  { bg: "#2a0b0b", figure: "#f97316", ring: "#f97316", glow: "#f9731680", name: "Crimson Muse", imageSrc: "/avatars/6.webp" },
  { bg: "#241005", figure: "#facc15", ring: "#facc15", glow: "#facc1590", name: "Solar Flame", imageSrc: "/avatars/7.webp" },
  { bg: "#2a0b1c", figure: "#fb7185", ring: "#fb7185", glow: "#fb718580", name: "Pink Circuit", imageSrc: "/avatars/8.webp" },
  { bg: "#0a1a2e", figure: "#3b82f6", ring: "#60a5fa", glow: "#3b82f680", name: "Blu Fifer", imageSrc: "/avatars/11.png" },
];

function loadInitialThemes(): AvatarTheme[] {
  const fromCache = readAvatarThemesFromCache().filter(Boolean).map((item, idx) => ({
    bg: item.bg || "#1a1a1a",
    figure: item.figure || "#c8c8c8",
    ring: item.ring || "#c8c8c8",
    glow: item.glow || "none",
    name: item.name || `Avatar ${idx + 1}`,
    imageSrc: item.imageSrc,
  }));

  return fromCache.length > 0 ? fromCache : [...DEFAULT_LEVEL_THEMES];
}

export const LEVEL_THEMES: AvatarTheme[] = loadInitialThemes();

export let MAX_LEVEL = LEVEL_THEMES.length;

export function setAvatarThemes(themes: AvatarTheme[]): void {
  const next = themes.length > 0 ? themes : [DEFAULT_LEVEL_THEMES[0]];
  LEVEL_THEMES.splice(0, LEVEL_THEMES.length, ...next);
  MAX_LEVEL = LEVEL_THEMES.length;
}

/** Get avatar by 1-based index (matches stored avatarLevel values). */
export const AVATARS = LEVEL_THEMES;

export function getAvatar(index: number): AvatarTheme {
  return LEVEL_THEMES[index - 1] || LEVEL_THEMES[0];
}

export const getAvatarTheme = getAvatar;
