// Single source of truth for the avatar ordering used across
// landing, onboarding, and the spin/claim systems. Anytime you'd
// hardcode an avatar array elsewhere, import from here instead.

// One avatar per rank tier (R1 Grey → R11 S1). See src/lib/avatarRank.ts for the full ladder.
// Id 35 (old "Platinum") was removed — mis-colored artwork.
// Id 36 (Green Relic, R3) added — fills the Green tier gap.
// Id 23 (Gold Specter, R9) replaces id 40 (Gold Warden, actually R8 Rose).
// Id 26 (Rainbow Pulse, R11 S1) restored — previously swapped out for a second Purple slot.
// Id 37 (Purple Hex) and id 40 (Gold Warden) removed — both were rank-duplicates.
export const FREE_SPIN_AVATAR_IDS = [43, 52, 36, 42, 41, 13, 47, 21, 23, 20, 26] as const;

// Early-signup reward pool. Must NOT overlap with FREE_SPIN_AVATAR_IDS.
// Emptied: all four ids were retired (21 was promoted into the spin pool above).
export const EARLY_SIGNUP_AVATAR_IDS = [] as const;

// Cutoff for who counts as an "early signup". Users with created_at
// strictly before this timestamp can claim the early-signup reward;
// users created at or after this timestamp cannot.
export const EARLY_SIGNUP_CUTOFF_ISO = "2026-06-07T00:00:00Z";

// Avatars that have a .webp file; all others fall back to .png.
const WEBP_AVATAR_IDS = new Set([1, 6, 8, 13, 20, 21, 26, 40, 41, 42, 43, 47, 52]);

/** Helper: full /public/avatars URL for a numeric avatar id. */
export function avatarImageSrc(id: number): string {
  return `/avatars/${id}.${WEBP_AVATAR_IDS.has(id) ? "webp" : "png"}`;
}

/** Dev-time sanity check: the two pools must not overlap. */
const _overlap = FREE_SPIN_AVATAR_IDS.filter((id) =>
  (EARLY_SIGNUP_AVATAR_IDS as readonly number[]).includes(id),
);
if (_overlap.length > 0) {
  console.error("[avatarConfig] Spin and early-signup pools overlap:", _overlap);
}
