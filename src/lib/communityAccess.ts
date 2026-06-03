import { supabase } from "@/lib/supabase";

export const FREE_COMMUNITY_SLOTS = 2;
export const COMMUNITY_UNLOCK_TOKEN_COST = 10;

export interface CommunityAccess {
  hasSubscription: boolean;
  unlockedIds: Set<string>;
}

export async function loadCommunityAccess(userId: string): Promise<CommunityAccess> {
  void userId;
  let data: unknown = null;
  let error: unknown = null;
  try {
    const result = await supabase.rpc("get_community_access");
    data = result.data;
    error = result.error;
  } catch {
    error = true;
  }

  if (error || !data) return { hasSubscription: false, unlockedIds: new Set() };

  const result = data as { has_subscription: boolean; unlocked_community_ids: string[] };
  return {
    hasSubscription: result.has_subscription ?? false,
    unlockedIds: new Set(result.unlocked_community_ids ?? []),
  };
}

export interface UnlockResult {
  ok: boolean;
  already: boolean;
  free: boolean;
  balance: number;
  error: string | null;
}

export async function unlockCommunity(userId: string, communityId: string): Promise<UnlockResult> {
  void userId;
  let data: unknown = null;
  let error: unknown = null;
  try {
    const result = await supabase.rpc("unlock_community", { p_community_id: communityId });
    data = result.data;
    error = result.error;
  } catch {
    error = true;
  }

  if (error || !data) {
    return { ok: false, already: false, free: false, balance: 0, error: "network_error" };
  }

  const result = data as { ok: boolean; already?: boolean; free?: boolean; balance: number; error?: string };
  return {
    ok: result.ok,
    already: result.already ?? false,
    free: result.free ?? false,
    balance: result.balance ?? 0,
    error: result.error ?? null,
  };
}
