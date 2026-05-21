import { supabase } from '../client';
import type { PersistedCommunityRecord, CommunityChatMessageRecord, CommunityChatMemberRecord } from '@/lib/communityChat.types';
import type { CommunityRequestRecord } from '@/lib/adminData';
import { buildCommunityAbbr } from '@/lib/communityChat.utils';

type DbMessage = {
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
  liked_by: string[];
};

type DbMember = {
  community_id: string;
  user_id: string;
  username: string;
  joined_at: string;
  last_seen_at: string;
  last_read_at: string | null;
  notifications_enabled: boolean;
};

type DbCommunity = {
  id: string;
  abbr: string;
  title: string;
  description: string;
  topic: string;
  status: string;
  locked: boolean;
  logo_url: string | null;
  created_at: string;
  created_by: string | null;
  community_members: DbMember[];
  community_messages: DbMessage[];
};

function mapMessage(m: DbMessage): CommunityChatMessageRecord {
  return {
    id: m.id,
    communityId: m.community_id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    text: m.text,
    createdAt: m.created_at,
    pinned: m.pinned,
    replyToMessageId: m.reply_to_message_id ?? undefined,
    replyToSenderName: m.reply_to_sender_name ?? undefined,
    replyToText: m.reply_to_text ?? undefined,
    deletedAt: m.deleted_at ?? undefined,
    deletedByUserId: m.deleted_by_user_id ?? undefined,
    likedBy: m.liked_by ?? [],
  };
}

function mapMember(m: DbMember): CommunityChatMemberRecord {
  return {
    userId: m.user_id,
    username: m.username,
    joinedAt: m.joined_at,
    lastSeenAt: m.last_seen_at,
    lastReadAt: m.last_read_at ?? undefined,
    notificationsEnabled: m.notifications_enabled,
  };
}

function mapCommunity(c: DbCommunity): PersistedCommunityRecord {
  return {
    id: c.id,
    abbr: c.abbr,
    title: c.title,
    description: c.description,
    topic: c.topic,
    status: c.status as 'Active' | 'Early Access',
    locked: c.locked,
    logoUrl: c.logo_url ?? undefined,
    createdAt: c.created_at,
    createdBy: c.created_by ?? undefined,
    members: (c.community_members ?? []).map(mapMember),
    messages: (c.community_messages ?? [])
      .map(mapMessage)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export async function fetchCommunities(): Promise<PersistedCommunityRecord[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*, community_members(*), community_messages(*)')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as DbCommunity[]).map(mapCommunity);
}

export async function joinCommunity(communityId: string, userId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from('community_members')
    .upsert(
      { community_id: communityId, user_id: userId, username, last_seen_at: new Date().toISOString() },
      { onConflict: 'community_id,user_id' }
    );
  if (error) throw error;
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function touchMemberActivity(communityId: string, userId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from('community_members')
    .update({ last_seen_at: new Date().toISOString(), username })
    .eq('community_id', communityId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function markCommunityRead(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('community_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('community_id', communityId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function setCommunityNotifications(communityId: string, userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('community_members')
    .update({ notifications_enabled: enabled })
    .eq('community_id', communityId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function createCommunityFromRequest(request: CommunityRequestRecord): Promise<void> {
  const id = `request-${request.id}`;
  const abbr = buildCommunityAbbr(request.communityName);
  const now = request.reviewedAt ?? new Date().toISOString();

  const { error } = await supabase.from('communities').upsert({
    id,
    abbr,
    title: request.communityName,
    description: request.whyNow,
    topic: request.samplePrompt || request.focusArea,
    status: 'Early Access',
    locked: false,
    created_at: now,
    created_by: request.requesterName,
  }, { onConflict: 'id' });

  if (error) throw error;
}
