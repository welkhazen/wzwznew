import type { CommunityChatMessageRecord, SendCommunityMessageInput } from '@/lib/communityChat.types';
import { assertUserTextAllowed } from '@/lib/inputSecurity';
import { supabase } from '../client';

export type DbCommunityMessage = {
  id: string;
  community_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  pinned: boolean;
  reply_to_message_id: string | null;
  reply_to_sender_name: string | null;
  reply_to_text: string | null;
  deleted_at: string | null;
  deleted_by_user_id: string | null;
  liked_by: string[] | null;
  sender_avatar_level?: number | null;
  moderation_status?: string | null;
};

export function mapCommunityMessage(row: DbCommunityMessage): CommunityChatMessageRecord {
  return {
    id: row.id,
    communityId: row.community_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    text: row.text,
    createdAt: row.created_at,
    pinned: row.pinned,
    replyToMessageId: row.reply_to_message_id ?? undefined,
    replyToSenderName: row.reply_to_sender_name ?? undefined,
    replyToText: row.reply_to_text ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    deletedByUserId: row.deleted_by_user_id ?? undefined,
    likedBy: row.liked_by ?? [],
    senderAvatarLevel: row.sender_avatar_level ?? undefined,
    moderationStatus: row.moderation_status ?? undefined,
  };
}

/**
 * Send a community message via the send_community_message SECURITY DEFINER
 * RPC. The function derives the sender from current_user_id() and enforces
 * auth, ban status, community membership, and alias validity server-side.
 */
export async function sendMessage(
  communityId: string,
  input: SendCommunityMessageInput
): Promise<CommunityChatMessageRecord> {
  const text = assertUserTextAllowed(input.text);
  const { data, error } = await supabase.rpc('send_community_message', {
    p_community_id: communityId,
    p_text: text,
    p_reply_to_message_id: input.replyToMessage?.id ?? null,
    p_identity_alias: input.identityAlias ?? null,
    p_avatar_level: input.avatarLevel ?? null,
  });
  if (error) throw new Error(error.message ?? 'send_message_failed');
  return mapCommunityMessage(data as DbCommunityMessage);
}

/**
 * Soft-delete a community message.
 *
 * Security: delete_community_message verifies the authenticated user matches
 * sender_id OR is an admin, then sets deleted_at + deleted_by_user_id from
 * server context. The requesterId argument is kept for backward compatibility
 * with the existing call sites and is NOT trusted by the database.
 */
export async function deleteMessage(messageId: string, _requesterId: string): Promise<void> {
  void _requesterId;
  const { error } = await supabase.rpc('delete_community_message', {
    p_message_id: messageId,
  });
  if (error) throw error;
}

export async function likeMessage(messageId: string, _userId: string): Promise<void> {
  void _userId;
  const { error } = await supabase.rpc('toggle_message_like', {
    p_message_id: messageId,
  });
  if (error) throw error;
}
