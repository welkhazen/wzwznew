// Frame-color → rank tier mapping used everywhere we display, sort, or filter
// avatars. Centralized so shop, inventory, onboarding picker, and any future
// surface stay in lockstep.

import type { AvatarCatalogItem } from "@/lib/avatarCatalog";

export const AVATAR_RANK_MAP: Record<string, number> = {
  grey: 1,
  gray: 1,
  blue: 2,
  purple: 3,
  orange: 4,
  red: 5,
  pink: 6,
  gold: 7,
  platinum: 8,
  white: 9,
  rainbow: 10,
};

export const AVATAR_RANK_LABELS: Record<number, string> = {
  1: "Grey",
  2: "Blue",
  3: "Purple",
  4: "Orange",
  5: "Red",
  6: "Pink",
  7: "Gold",
  8: "Platinum",
  9: "White",
  10: "Rainbow",
};

type RankableAvatar = Pick<AvatarCatalogItem, "name" | "id" | "figure" | "ring" | "glow"> & {
  frame_color?: string;
  rank_tier?: number;
};

/**
 * Derive an avatar's rank (1..10). Prefers explicit `rank_tier` / `frame_color`
 * when present, otherwise falls back to a heuristic over the avatar name.
 */
export function getAvatarRank(avatar: RankableAvatar): number {
  if (typeof avatar.rank_tier === "number" && avatar.rank_tier > 0) {
    return avatar.rank_tier;
  }
  const color = avatar.frame_color?.toLowerCase();
  if (color && AVATAR_RANK_MAP[color] !== undefined) {
    return AVATAR_RANK_MAP[color];
  }

  const haystack = `${avatar.name ?? ""} ${avatar.id ?? ""}`.toLowerCase();
  if (/rainbow|prism|spectrum/.test(haystack)) return 10;
  if (/white|snow|glass|ivory/.test(haystack)) return 9;
  if (/platinum|diamond/.test(haystack)) return 8;
  if (/gold|yellow|pharaoh|solar|sun/.test(haystack)) return 7;
  if (/pink|rose|magenta|fuchsia/.test(haystack)) return 6;
  if (/red|crimson|ruby|scarlet|blood|horned/.test(haystack)) return 5;
  if (/orange|ember|bronze|copper|amber/.test(haystack)) return 4;
  if (/purple|violet|amethyst/.test(haystack)) return 3;
  if (/blue|cyan|azure|teal|frost|indigo/.test(haystack)) return 2;
  return 1; // grey fallback
}

export function sortAvatarsByRank<T extends RankableAvatar>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const rankA = getAvatarRank(a);
    const rankB = getAvatarRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
}

/**
 * Server stores reward catalog ids like `spin-35` and `signup-21`. Derive the
 * underlying numeric image id so we can match against the local preview pools.
 */
export function imageIdFromCatalogId(catalogId: string): number | null {
  const match = /^(?:spin|signup)-(\d+)$/.exec(catalogId);
  return match ? Number(match[1]) : null;
}
