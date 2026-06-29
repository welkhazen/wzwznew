// Frame-color → rank tier mapping used everywhere we display, sort, or filter
// avatars. Centralized so shop, inventory, onboarding picker, and any future
// surface stay in lockstep.

import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { avatarIdFromImageSrc, canonicalAvatarImageId, NUMBERED_AVATAR_NAMES } from "@/config/avatarNames";

export const AVATAR_RANK_MAP: Record<string, number> = {
  grey: 1,
  gray: 1,
  blue: 2,
  green: 3,
  orange: 4,
  purple: 5,
  red: 6,
  pink: 7,
  rose: 8,
  gold: 9,
  white: 10,
  rainbow: 11,
  custom: 12,
};

/**
 * Authoritative rank assignment keyed by numbered avatar image id.
 * Source of truth for ranks across Shop, Inventory, onboarding pickers.
 * Names that include color cues outside the tier system (green / lime) fall
 * back to grey/R1 — adjust here when the rank ladder grows.
 */
// Id 35 ("Platinum Echo") was purged — its artwork was mis-colored red, not
// platinum. Rank system updated: added Green (R3), shifted Orange (R4), Purple (R5),
// Red (R6), Pink (R7), Rose (R8), Gold (R9), White (R10), and Rainbow→S1 (R11).
export const NUMBERED_AVATAR_RANKS: Record<number, number> = {
  1: 1,  2: 4,  3: 1,  4: 7,  5: 5,  6: 4,  7: 9,  8: 1,  9: 2,  10: 2,
  11: 1, 12: 2, 13: 6, 14: 4, 15: 1, 16: 7, 17: 4, 18: 2, 19: 11, 20: 10,
  21: 8, 22: 11, 23: 9, 24: 5, 25: 2, 26: 11, 27: 6, 28: 10, 29: 8, 30: 3,
  31: 9, 32: 5, 33: 2, 34: 11, 36: 3, 37: 5, 38: 9, 39: 6, 40: 8,
  41: 5, 42: 4, 43: 1, 44: 2, 46: 5, 47: 7, 48: 2, 49: 5,
  51: 7, 52: 2, 53: 3, 54: 8, 55: 8, 56: 2, 57: 5, 58: 5,
};

/**
 * Ids of the eight unranked base free avatars rendered as colored silhouettes.
 * These show no RANK label in any picker / inventory card.
 */
const UNRANKED_BASE_AVATAR_IDS = new Set([
  "ember",
  "verdant",
  "horned",
  "pharaoh",
  "violet",
  "rose",
  "black",
  "blue",
]);

/** Returns false for the eight base free avatars so the UI can hide the rank label. */
export function hasAvatarRank(avatar: Pick<AvatarCatalogItem, "id" | "imageSrc">): boolean {
  if (avatar.id && UNRANKED_BASE_AVATAR_IDS.has(avatar.id.toLowerCase())) return false;
  if (avatar.imageSrc && /\/avatars\/avatar-\d+\.svg$/.test(avatar.imageSrc)) return false;
  return true;
}

/** Slug-based image-source overrides for catalog rows that don't use /avatars/<n>.png. */
export const SLUG_AVATAR_RANKS: Record<string, number> = {
  "silver-void": 1,
  "neon-lynx": 2,
  "blue-signal": 9,
  "blu-fifer": 6,
  "violet-mask": 4,
  "horned-iron": 6,
  "crimson-muse": 4,
  "solar-flame": 9,
  "pink-circuit": 7,
  "viozen": 6,
};

export const AVATAR_RANK_LABELS: Record<number, string> = {
  1: "Grey",
  2: "Blue",
  3: "Green",
  4: "Orange",
  5: "Purple",
  6: "Red",
  7: "Pink",
  8: "Rose",
  9: "Gold",
  10: "White",
  11: "S1",
  12: "C1",
};

type RankableAvatar = Pick<AvatarCatalogItem, "name" | "id"> & {
  imageSrc?: string;
  figure?: string;
  ring?: string;
  glow?: string;
  frame_color?: string;
  rank_tier?: number;
};

const NAME_TO_IMAGE_ID: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const [idStr, name] of Object.entries(NUMBERED_AVATAR_NAMES)) {
    map[name.toLowerCase()] = Number(idStr);
  }
  return map;
})();

/**
 * Derive an avatar's rank (1..10). Resolution order:
 * 1. explicit rank_tier (server)
 * 2. explicit frame_color (server)
 * 3. imageId-keyed authoritative table (NUMBERED_AVATAR_RANKS)
 * 4. slug-keyed overrides for `/avatars/landing/<slug>.webp` style paths
 * 5. name → imageId lookup
 * 6. name-keyword heuristic
 * 7. R1 grey fallback
 */
export function getAvatarRank(avatar: RankableAvatar): number {
  if (typeof avatar.rank_tier === "number" && avatar.rank_tier > 0) {
    return avatar.rank_tier;
  }
  const color = avatar.frame_color?.toLowerCase();
  if (color && AVATAR_RANK_MAP[color] !== undefined) {
    return AVATAR_RANK_MAP[color];
  }

  const imageId = avatarIdFromImageSrc(avatar.imageSrc);
  if (imageId !== null) {
    const canonical = canonicalAvatarImageId(imageId);
    if (NUMBERED_AVATAR_RANKS[canonical] !== undefined) {
      return NUMBERED_AVATAR_RANKS[canonical];
    }
  }

  if (avatar.imageSrc) {
    const slugMatch = /\/avatars\/landing\/([^/.]+)\./.exec(avatar.imageSrc);
    if (slugMatch) {
      const slug = slugMatch[1].toLowerCase();
      if (SLUG_AVATAR_RANKS[slug] !== undefined) return SLUG_AVATAR_RANKS[slug];
    }
  }
  if (avatar.id && SLUG_AVATAR_RANKS[avatar.id.toLowerCase()] !== undefined) {
    return SLUG_AVATAR_RANKS[avatar.id.toLowerCase()];
  }

  if (avatar.name) {
    const nameId = NAME_TO_IMAGE_ID[avatar.name.toLowerCase()];
    if (nameId !== undefined && NUMBERED_AVATAR_RANKS[nameId] !== undefined) {
      return NUMBERED_AVATAR_RANKS[nameId];
    }
  }

  const haystack = `${avatar.name ?? ""} ${avatar.id ?? ""}`.toLowerCase();
  if (/rainbow|prism|spectrum/.test(haystack)) return 11;
  if (/white|snow|glass|ivory/.test(haystack)) return 10;
  if (/gold|yellow|pharaoh|solar|sun|diamond/.test(haystack)) return 9;
  if (/pink|magenta|fuchsia/.test(haystack)) return 7;
  if (/red|crimson|ruby|scarlet|blood|horned/.test(haystack)) return 6;
  if (/orange|ember|bronze|copper|amber/.test(haystack)) return 5;
  if (/purple|violet|amethyst|lilac|lavender/.test(haystack)) return 4;
  if (/green|lime|emerald|jade|forest|grass/.test(haystack)) return 3;
  if (/\bblu\b|blue|cyan|azure|teal|frost|indigo|aqua/.test(haystack)) return 2;
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
