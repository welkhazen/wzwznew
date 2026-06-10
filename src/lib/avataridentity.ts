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
  { bg: "#1f0a05", figure: "#ff8a1f", ring: "#ff8a1f", glow: "#ff8a1f80", name: "Ember", imageSrc: "/avatars/avatar-3.svg" },
  { bg: "#08160b", figure: "#22c55e", ring: "#22c55e", glow: "#22c55e80", name: "Verdant", imageSrc: "/avatars/avatar-1.svg" },
  { bg: "#1f0808", figure: "#ff2d3d", ring: "#ff2d3d", glow: "#ff2d3d80", name: "Horned", imageSrc: "/avatars/avatar-5.svg" },
  { bg: "#1f1605", figure: "#f2d21a", ring: "#f2d21a", glow: "#f2d21a80", name: "Pharaoh", imageSrc: "/avatars/avatar-6.svg" },
  { bg: "#150a22", figure: "#b84dff", ring: "#b84dff", glow: "#b84dff80", name: "Violet", imageSrc: "/avatars/avatar-2.svg" },
  { bg: "#1f0a14", figure: "#f43f5e", ring: "#f43f5e", glow: "#f43f5e80", name: "Rose", imageSrc: "/avatars/avatar-4.svg" },
  { bg: "#0a0a0a", figure: "#cfd3da", ring: "#cfd3da", glow: "#cfd3da80", name: "Black", imageSrc: "/avatars/avatar-7.svg" },
  { bg: "#0a1424", figure: "#3b82f6", ring: "#3b82f6", glow: "#3b82f680", name: "Blue", imageSrc: "/avatars/avatar-10.svg" },
  { bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180", name: "Silver Void", imageSrc: "/avatars/1.webp" },
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

/** localStorage key for a user's chosen private-identity avatar level. */
export const privateAvatarKey = (uid: string): string => `raw.profile.private-avatar.${uid}`;

/** Read a user's chosen private-identity avatar level (defaults to 1). */
export function getPrivateAvatarLevel(uid: string): number {
  if (typeof window === "undefined") return 1;
  const stored = window.localStorage.getItem(privateAvatarKey(uid));
  return stored ? Number(stored) : 1;
}
