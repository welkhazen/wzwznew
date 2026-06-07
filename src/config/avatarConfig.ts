// Single source of truth for the avatar ordering used across
// landing, onboarding, and the spin/claim systems. Anytime you'd
// hardcode an avatar array elsewhere, import from here instead.

export const FREE_SPIN_AVATAR_IDS = [43, 42, 52, 41, 13, 47, 40, 20] as const;

// Early-signup reward pool. Must NOT overlap with FREE_SPIN_AVATAR_IDS.
export const EARLY_SIGNUP_AVATAR_IDS = [29, 21, 25, 33] as const;

// Display names per avatar image. Numeric ids are the file numbers in /public/avatars.
export const AVATAR_NAMES: Record<number, string> = {
  // Spin pool
  43: "Crimson Halo",
  42: "Ember Saint",
  52: "Onyx Bloom",
  41: "Steel Sage",
  13: "Violet Specter",
  47: "Solar Helix",
  40: "Pink Drift",
  20: "Frost Saint",
  // Early-signup exclusive pool
  29: "Bronze Eclipse",
  21: "Iron Veil",
  25: "Cyan Phoenix",
  33: "Indigo Sentinel",
};

export function avatarDisplayName(id: number): string {
  return AVATAR_NAMES[id] ?? `Avatar ${id}`;
}

// Cutoff for who counts as an "early signup". Users with created_at
// strictly before this timestamp can claim the early-signup reward;
// users created at or after this timestamp cannot.
export const EARLY_SIGNUP_CUTOFF_ISO = "2026-06-07T00:00:00Z";

/** Helper: full /public/avatars URL for a numeric avatar id. */
export function avatarImageSrc(id: number): string {
  return `/avatars/${id}.png`;
}

/** Dev-time sanity check: the two pools must not overlap. */
const _overlap = FREE_SPIN_AVATAR_IDS.filter((id) =>
  (EARLY_SIGNUP_AVATAR_IDS as readonly number[]).includes(id),
);
if (_overlap.length > 0) {
  // eslint-disable-next-line no-console
  console.error("[avatarConfig] Spin and early-signup pools overlap:", _overlap);
}
