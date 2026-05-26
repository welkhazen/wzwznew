import type { CommunityChatMessageRecord } from '@/lib/communityChat.types';

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
  };
}
