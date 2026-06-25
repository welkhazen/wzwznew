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

export const MAX_PINNED_MESSAGES = 7;

export class PinnedMessageLimitError extends Error {
  constructor() {
    super(`You can only pin up to ${MAX_PINNED_MESSAGES} messages.`);
    this.name = 'PinnedMessageLimitError';
  }
}

function mapPinnedMessageRow(data: Record<string, unknown>): PinnedMessageRecord {
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

export async function getUserPinnedMessages(userId: string): Promise<PinnedMessageRecord[]> {
  const { data, error } = await supabase
    .from('user_pinned_message')
    .select('message_id, community_id, community_title, sender_name, message_text, message_created_at, pinned_at')
    .eq('user_id', userId)
    .order('pinned_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPinnedMessageRow);
}

export async function addUserPinnedMessage(userId: string, payload: PinnedMessagePayload): Promise<PinnedMessageRecord> {
  // Check if this exact message is already pinned — upsert is fine, skip limit check.
  const { data: existing, error: existingError } = await supabase
    .from('user_pinned_message')
    .select('message_id')
    .eq('user_id', userId)
    .eq('message_id', payload.messageId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existing) {
    const { count, error: countError } = await supabase
      .from('user_pinned_message')
      .select('message_id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PINNED_MESSAGES) throw new PinnedMessageLimitError();
  }

  const pinnedAt = new Date().toISOString();
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
      pinned_at: pinnedAt,
    }, { onConflict: 'user_id,message_id' });
  if (error) throw error;
  return { ...payload, pinnedAt };
}

export async function removeUserPinnedMessage(userId: string, messageId: string): Promise<void> {
  const { error } = await supabase
    .from('user_pinned_message')
    .delete()
    .eq('user_id', userId)
    .eq('message_id', messageId);
  if (error) throw error;
}

export interface PinNotificationRecord {
  id: string;
  actorName: string;
  messageText: string | null;
  communityTitle: string | null;
  createdAt: string;
}

export interface NotifyMessagePinnedPayload {
  recipientUserId: string;
  messageId: string;
  communityId?: string | null;
  communityTitle?: string | null;
  messageText: string;
}

export async function notifyMessagePinned(payload: NotifyMessagePinnedPayload): Promise<void> {
  const { error } = await supabase.rpc('notify_message_pinned', {
    p_recipient_user_id: payload.recipientUserId,
    p_message_id: payload.messageId,
    p_community_id: payload.communityId ?? null,
    p_community_title: payload.communityTitle ?? null,
    p_message_text: payload.messageText,
  });
  if (error) throw error;
}

export async function getPinNotifications(userId: string): Promise<PinNotificationRecord[]> {
  const { data, error } = await supabase
    .from('message_pin_notifications')
    .select('id, actor_name, message_text, community_title, created_at')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    actorName: row.actor_name as string,
    messageText: (row.message_text as string | null) ?? null,
    communityTitle: (row.community_title as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function registerFoundingInviteCodes(codes: string[], inviterId: string): Promise<void> {
  if (codes.length === 0) return;
  const { error } = await supabase
    .from('founding_invites')
    .upsert(
      codes.map((code) => ({ code: code.toUpperCase(), inviter_id: inviterId })),
      { onConflict: 'code', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export interface FoundingInviteRedemptionRecord {
  id: string;
  referredUsername: string;
  referralCode: string;
  createdAt: string;
}

export async function getFoundingInviteRedemptions(userId: string): Promise<FoundingInviteRedemptionRecord[]> {
  const { data, error } = await supabase
    .from('founding_invite_redemptions')
    .select('id, redeemed_username, code, created_at')
    .eq('inviter_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    referredUsername: row.redeemed_username as string,
    referralCode: row.code as string,
    createdAt: row.created_at as string,
  }));
}
