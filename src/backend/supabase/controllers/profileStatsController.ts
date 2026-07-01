import { supabase } from "../client";

export interface ProfileStats {
  polls: number;
  commentsOnPolls: number;
  likesReceived: number;
  hostsMade: number;
  communitiesJoined: number;
}

export const EMPTY_PROFILE_STATS: ProfileStats = {
  polls: 0,
  commentsOnPolls: 0,
  likesReceived: 0,
  hostsMade: 0,
  communitiesJoined: 0,
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/** Single RPC call that returns profile metrics. ~1 round-trip, no chatty client. */
export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc("get_profile_stats", { p_user_id: userId });
  if (error) throw new Error(error.message || "Could not load profile stats.");
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    polls: toNumber(row.polls),
    commentsOnPolls: toNumber(row.comments_on_polls),
    likesReceived: toNumber(row.likes_received),
    hostsMade: toNumber(row.hosts_made),
    communitiesJoined: toNumber(row.communities_joined),
  };
}
