import { supabase } from '../client';

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

export async function fetchFoundingInviteCodes(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('founding_invites')
    .select('code')
    .eq('inviter_id', userId)
    .order('created_at', { ascending: true })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((row) => row.code as string);
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
