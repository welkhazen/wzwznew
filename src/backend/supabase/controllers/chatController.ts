import { supabase } from '../client';
import type { CommunityChatMessageRecord, SendCommunityMessageInput } from '@/lib/communityChat.types';
import { assertUserTextAllowed } from '@/lib/inputSecurity';

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
  };
}

/**
 * Send a community message. The SECURITY DEFINER RPC derives the sender from
 * current_user_id() and enforces not-banned + community membership; the only
 * client-supplied fields are the message text and an optional reply target.
 */
export async function sendMessage(
  communityId: string,
  input: SendCommunityMessageInput
): Promise<CommunityChatMessageRecord> {
<<<<<<< Updated upstream
  const { data, error } = await supabase.rpc('send_community_message', {
    p_community_id: communityId,
    p_text: input.text,
    p_reply_to_message_id: input.replyToMessage?.id ?? null,
  });
=======
  const moderatedText = assertUserTextAllowed(text);

  const { data, error } = await supabase
    .from('community_messages')
    .insert({
      community_id: communityId,
      sender_id: senderId,
      sender_name: senderName,
      text: moderatedText,
      reply_to_message_id: replyToMessage?.id ?? null,
      reply_to_sender_name: replyToMessage?.senderName ?? null,
      reply_to_text: replyToMessage?.text ?? null,
    })
    .select()
    .single();
>>>>>>> Stashed changes

  if (error) throw error;
  if (!data) throw new Error('send_community_message_returned_empty');

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
