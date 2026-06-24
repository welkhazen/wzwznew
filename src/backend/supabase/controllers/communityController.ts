import { supabase } from '../client';
import type { CommunityChatMessageRecord, PersistedCommunityRecord, CommunityChatMemberRecord } from '@/lib/communityChat.types';
import type { CommunityRequestRecord } from '@/lib/adminData';
import { buildCommunityAbbr } from '@/lib/communityChat.utils';
import { mapCommunityMessage, type DbCommunityMessage } from './chatController';
import { assertUserTextAllowed } from '@/lib/inputSecurity';

type DbMessage = DbCommunityMessage;

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
  community_messages?: DbMessage[];
};

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
      .map(mapCommunityMessage)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export async function fetchCommunities(): Promise<PersistedCommunityRecord[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*, community_members(*)')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as DbCommunity[]).map(mapCommunity);
}

export async function fetchCommunityMessages(
  communityId: string,
  options: { before?: string; limit?: number } = {},
): Promise<CommunityChatMessageRecord[]> {
  const limit = options.limit ?? 10;
  let query = supabase
    .from('community_messages')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.before) {
    query = query.lt('created_at', options.before);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as DbMessage[])
    .map(mapCommunityMessage)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// All membership writes go through SECURITY DEFINER RPCs that derive the
// caller from current_user_id() (auth.uid()). The frontend can no longer
// pass an arbitrary user_id/username for membership or activity rows.
// Function signatures are preserved so call sites don't need to change; the
// userId/username args are now redundant and ignored server-side.

export async function joinCommunity(communityId: string, _userId: string, _username: string): Promise<void> {
  void _userId; void _username;
  const { error } = await supabase.rpc('join_community', { p_community_id: communityId });
  if (error) throw error;
}

export async function leaveCommunity(communityId: string, _userId: string): Promise<void> {
  void _userId;
  const { error } = await supabase.rpc('leave_community', { p_community_id: communityId });
  if (error) throw error;
}

export async function touchMemberActivity(communityId: string, _userId: string, _username: string): Promise<void> {
  void _userId; void _username;
  const { error } = await supabase.rpc('touch_member_activity', { p_community_id: communityId });
  if (error) throw error;
}

export async function markCommunityRead(communityId: string, _userId: string): Promise<void> {
  void _userId;
  const { error } = await supabase.rpc('mark_community_read', { p_community_id: communityId });
  if (error) throw error;
}

export async function setCommunityNotifications(communityId: string, _userId: string, enabled: boolean): Promise<void> {
  void _userId;
  const { error } = await supabase.rpc('set_community_notifications', {
    p_community_id: communityId,
    p_enabled: enabled,
  });
  if (error) throw error;
}

// Admin-only — RPC enforces is_admin() server-side.
export async function updateCommunityPresentation(
  communityId: string,
  input: { title: string; logoUrl?: string },
): Promise<void> {
  void buildCommunityAbbr; // abbr derived inside the RPC; kept import for backward compat
  const { error } = await supabase.rpc('update_community_presentation', {
    p_community_id: communityId,
    p_title: input.title,
    p_logo_url: input.logoUrl ?? null,
  });
  if (error) throw error;
}

// Admin-only — RPC enforces is_admin() server-side.
export async function createCommunityFromRequest(request: CommunityRequestRecord): Promise<void> {
  const id = `request-${request.id}`;
  const communityName = assertUserTextAllowed(request.communityName);
  const whyNow = assertUserTextAllowed(request.whyNow);
  const focusArea = assertUserTextAllowed(request.focusArea);
  const samplePrompt = request.samplePrompt.trim() ? assertUserTextAllowed(request.samplePrompt) : '';
  const now = request.reviewedAt ?? new Date().toISOString();
  const { error } = await supabase.rpc('create_community_from_request', {
    p_id: id,
    p_title: communityName,
    p_description: whyNow,
    p_topic: samplePrompt || focusArea,
    p_created_by: request.requesterName,
    p_created_at: now,
  });
  if (error) throw error;
}
