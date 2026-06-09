import { supabase } from "../client";
import { assertUserTextAllowed } from "@/lib/inputSecurity";

export interface GeneralFeedPostRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarLevel?: number;
  text: string;
  createdAt: string;
}

type DbGeneralFeedPost = {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_level: number | null;
  text: string;
  created_at: string;
};

function mapGeneralFeedPost(row: DbGeneralFeedPost): GeneralFeedPostRecord {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatarLevel: row.sender_avatar_level ?? undefined,
    text: row.text,
    createdAt: row.created_at,
  };
}

export async function fetchGeneralFeedPosts(limit = 8): Promise<GeneralFeedPostRecord[]> {
  const { data, error } = await supabase
    .from("general_feed_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as DbGeneralFeedPost[]).map(mapGeneralFeedPost);
}

export async function sendGeneralFeedPost(text: string): Promise<GeneralFeedPostRecord> {
  const cleanText = assertUserTextAllowed(text);
  const { data, error } = await supabase.rpc("send_general_feed_post", {
    p_text: cleanText,
  });

  if (error) throw error;
  if (!data) throw new Error("send_general_feed_post_returned_empty");

  return mapGeneralFeedPost(data as DbGeneralFeedPost);
}
