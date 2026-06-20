// Single source of truth for the avatar ordering used across
// landing, onboarding, and the spin/claim systems. Anytime you'd
// hardcode an avatar array elsewhere, import from here instead.

// Ordered by rank tier (rank 1 grey -> rank 10 rainbow); see src/lib/avatarRank.ts.
export const FREE_SPIN_AVATAR_IDS = [43, 52, 41, 42, 13, 47, 40, 35, 20, 26] as const;

// Early-signup reward pool. Must NOT overlap with FREE_SPIN_AVATAR_IDS.
export const EARLY_SIGNUP_AVATAR_IDS = [29, 21, 25, 33] as const;

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
  console.error("[avatarConfig] Spin and early-signup pools overlap:", _overlap);
}
