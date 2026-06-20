import { supabase } from "../client";
import { assertUserTextAllowed } from "@/lib/inputSecurity";

export interface GeneralFeedPostRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarLevel?: number;
  text: string;
  createdAt: string;
  communityId?: string;
  communityName?: string;
}

type DbGeneralFeedPost = {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_level: number | null;
  text: string;
  created_at: string;
  community_id: string | null;
  community_name: string | null;
};

function mapGeneralFeedPost(row: DbGeneralFeedPost): GeneralFeedPostRecord {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatarLevel: row.sender_avatar_level ?? undefined,
    text: row.text,
    createdAt: row.created_at,
    communityId: row.community_id ?? undefined,
    communityName: row.community_name ?? undefined,
  };
}

export async function fetchGeneralFeedPosts(limit = 8): Promise<GeneralFeedPostRecord[]> {
  const { data, error } = await supabase
    .from("general_feed_posts")
    .select("id, sender_id, sender_name, sender_avatar_level, text, created_at, community_id, community_name")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as DbGeneralFeedPost[]).map(mapGeneralFeedPost);
}

export async function sendGeneralFeedPost(text: string, communityId?: string | null): Promise<GeneralFeedPostRecord> {
  const cleanText = assertUserTextAllowed(text);
  const { data, error } = await supabase.rpc("send_general_feed_post", {
    p_text: cleanText,
    p_community_id: communityId ?? null,
  });

  if (error) throw error;
  if (!data) throw new Error("send_general_feed_post_returned_empty");

  return mapGeneralFeedPost(data as DbGeneralFeedPost);
}
