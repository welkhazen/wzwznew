import { supabase } from "../client";
import {
  EARLY_SIGNUP_AVATAR_IDS,
  FREE_SPIN_AVATAR_IDS,
  avatarDisplayName,
  avatarImageSrc,
} from "@/config/avatarConfig";

export interface AvatarRewardEntry {
  /** Catalog id used by Supabase, e.g. "spin-43" or "signup-29". */
  catalogId: string;
  /** Source image number from /public/avatars, e.g. 43. */
  imageId: number;
  /** Convenience: full image path. */
  imageSrc: string;
  /** Display name (e.g. "Crimson Halo"). */
  name: string;
}

function toEntry(prefix: "spin" | "signup", imageId: number): AvatarRewardEntry {
  return {
    catalogId: `${prefix}-${imageId}`,
    imageId,
    imageSrc: avatarImageSrc(imageId),
    name: avatarDisplayName(imageId),
  };
}

/** Ordered free-spin pool (used by both landing + onboarding wheels). */
export const SPIN_POOL: AvatarRewardEntry[] = FREE_SPIN_AVATAR_IDS.map((id) => toEntry("spin", id));

/** Ordered early-signup reward pool. */
export const EARLY_SIGNUP_POOL: AvatarRewardEntry[] = EARLY_SIGNUP_AVATAR_IDS.map((id) =>
  toEntry("signup", id),
);

interface ClaimResponse {
  ok: boolean;
  avatarId?: string;
  alreadyClaimed?: boolean;
  error?: string;
}

function parseClaim(data: unknown, fallbackError = "claim_failed"): ClaimResponse {
  if (!data || typeof data !== "object") {
    return { ok: false, error: fallbackError };
  }
  const row = data as Record<string, unknown>;
  return {
    ok: Boolean(row.ok),
    avatarId: typeof row.avatar_id === "string" ? row.avatar_id : undefined,
    alreadyClaimed: row.already_claimed === true,
    error: typeof row.error === "string" ? row.error : undefined,
  };
}

/** Server check — never trust the client for "early signup" eligibility. */
export async function isEarlySignupEligible(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_early_signup_eligible", { p_user_id: userId });
  if (error) return false;
  return Boolean(data);
}

export async function claimEarlySignupAvatar(
  userId: string,
  catalogId: string,
): Promise<ClaimResponse> {
  const { data, error } = await supabase.rpc("claim_early_signup_avatar", {
    p_user_id: userId,
    p_avatar_id: catalogId,
  });
  if (error) return { ok: false, error: error.message };
  return parseClaim(data);
}

export async function claimFreeSpinAvatar(
  userId: string,
  catalogId: string,
): Promise<ClaimResponse> {
  const { data, error } = await supabase.rpc("claim_free_spin_avatar", {
    p_user_id: userId,
    p_avatar_id: catalogId,
  });
  if (error) return { ok: false, error: error.message };
  return parseClaim(data);
}
