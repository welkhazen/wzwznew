import { supabase } from '../client';

export interface PinnedMessagePayload {
  messageId: string;
  communityId: string;
  communityTitle?: string | null;
  senderName?: string | null;
  messageText: string;
  messageCreatedAt?: string | null;
}

export interface PinnedMessageRecord extends PinnedMessagePayload {
  pinnedAt: string;
}

export const MAX_FAVORITE_COMMUNITIES = 3;

export async function getUserFavoriteCommunities(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_favorite_communities')
    .select('community_id, position')
    .eq('user_id', userId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.community_id as string);
}

export async function setUserFavoriteCommunities(userId: string, communityIds: string[]): Promise<void> {
  const trimmed = communityIds.slice(0, MAX_FAVORITE_COMMUNITIES);
  const { error: deleteError } = await supabase
    .from('user_favorite_communities')
    .delete()
    .eq('user_id', userId);
  if (deleteError) throw deleteError;
  if (trimmed.length === 0) return;
  const rows = trimmed.map((communityId, index) => ({
    user_id: userId,
    community_id: communityId,
    position: index + 1,
  }));
  const { error: insertError } = await supabase
    .from('user_favorite_communities')
    .insert(rows);
  if (insertError) throw insertError;
}

export async function getUserPinnedMessage(userId: string): Promise<PinnedMessageRecord | null> {
  const { data, error } = await supabase
    .from('user_pinned_message')
    .select('message_id, community_id, community_title, sender_name, message_text, message_created_at, pinned_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    messageId: data.message_id as string,
    communityId: data.community_id as string,
    communityTitle: (data.community_title as string | null) ?? null,
    senderName: (data.sender_name as string | null) ?? null,
    messageText: data.message_text as string,
    messageCreatedAt: (data.message_created_at as string | null) ?? null,
    pinnedAt: data.pinned_at as string,
  };
}

export async function setUserPinnedMessage(userId: string, payload: PinnedMessagePayload): Promise<void> {
  const { error } = await supabase
    .from('user_pinned_message')
    .upsert({
      user_id: userId,
      message_id: payload.messageId,
      community_id: payload.communityId,
      community_title: payload.communityTitle ?? null,
      sender_name: payload.senderName ?? null,
      message_text: payload.messageText,
      message_created_at: payload.messageCreatedAt ?? null,
      pinned_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function clearUserPinnedMessage(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_pinned_message')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}
