import { supabase } from '../client';
import type { CommunityChatMessageRecord, SendCommunityMessageInput } from '@/lib/communityChat.types';

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

export async function sendMessage(
  communityId: string,
  { senderId, senderName, senderAvatarLevel, text, replyToMessage }: SendCommunityMessageInput
): Promise<CommunityChatMessageRecord> {
  const { data, error } = await supabase
    .from('community_messages')
    .insert({
      community_id: communityId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar_level: senderAvatarLevel ?? null,
      text,
      reply_to_message_id: replyToMessage?.id ?? null,
      reply_to_sender_name: replyToMessage?.senderName ?? null,
      reply_to_text: replyToMessage?.text ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return mapCommunityMessage(data as DbCommunityMessage);
}

export async function deleteMessage(messageId: string, requesterId: string): Promise<void> {
  const { error } = await supabase
    .from('community_messages')
    .update({ deleted_at: new Date().toISOString(), deleted_by_user_id: requesterId })
    .eq('id', messageId);
  if (error) throw error;
}

export async function likeMessage(messageId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_message_like', {
    p_message_id: messageId,
    p_user_id: userId,
  });
  if (error) throw error;
}
