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
  { bg: "#1a1a1a", figure: "#c8c8c8", ring: "#8a8a8a", glow: "none",       name: "Avatar", imageSrc: "/avatars/avatar-1.svg"  },
  { bg: "#0c1a24", figure: "#5ed6ff", ring: "#2ea6d6", glow: "#5ed6ff80",  name: "Avatar", imageSrc: "/avatars/avatar-2.svg"  },
  { bg: "#0a1124", figure: "#3f8bff", ring: "#2557c4", glow: "#3f8bff80",  name: "Avatar", imageSrc: "/avatars/avatar-3.svg"  },
  { bg: "#0f1f12", figure: "#4ade80", ring: "#22a84a", glow: "#4ade8080",  name: "Avatar", imageSrc: "/avatars/avatar-4.svg"  },
  { bg: "#0b1a0e", figure: "#16a34a", ring: "#0f7a36", glow: "#16a34a80",  name: "Avatar", imageSrc: "/avatars/avatar-5.svg"  },
  { bg: "#1f0d18", figure: "#ec4899", ring: "#a6235f", glow: "#ec489980",  name: "Avatar", imageSrc: "/avatars/avatar-6.svg"  },
  { bg: "#150a22", figure: "#8b5cf6", ring: "#5b2aa8", glow: "#8b5cf680",  name: "Avatar", imageSrc: "/avatars/avatar-7.svg"  },
  { bg: "#1f1208", figure: "#f97316", ring: "#b0550f", glow: "#f9731680",  name: "Avatar", imageSrc: "/avatars/avatar-8.svg"  },
  { bg: "#1f0a0a", figure: "#dc2626", ring: "#8a1515", glow: "#dc262680",  name: "Avatar", imageSrc: "/avatars/avatar-9.svg"  },
  { bg: "#1f1705", figure: "#facc15", ring: "#b8900b", glow: "#facc1590",  name: "Avatar", imageSrc: "/avatars/avatar-10.svg" },
];

function loadInitialThemes(): AvatarTheme[] {
  const fromCache = readAvatarThemesFromCache().map((item) => ({
    bg: item.bg,
    figure: item.figure,
    ring: item.ring,
    glow: item.glow,
    name: item.name,
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
