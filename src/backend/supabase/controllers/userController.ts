import { supabase } from '../client';
import type { UserRow, UserRole } from '../models/user';
import {
  getUserFavoriteCommunities,
  getUserPinnedMessage,
  type PinnedMessageRecord,
} from './userExtrasController';

export async function isUsernameTaken(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, status, warnings, avatar_level, email, created_at, profile_public')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data as UserRow | null;
}

export async function createUser(
  id: string,
  username: string,
  role: UserRole = 'member',
): Promise<UserRow> {
  const alreadyTaken = await isUsernameTaken(username);
  if (alreadyTaken) throw new Error(`Username "${username}" is already taken.`);

  const { data, error } = await supabase
    .from('users')
    .insert({ id, username, role, status: 'active', warnings: 0, avatar_level: 1 })
    .select('id, username, role, status, warnings, avatar_level, created_at, profile_public')
    .single();
  if (error) throw error;
  return data as UserRow;
}

export interface PublicUserProfile {
  id: string;
  username: string | null;
  avatarLevel: number;
  role: UserRole | null;
  createdAt: string | null;
  profilePublic: boolean;
  favoriteCommunityIds: string[];
  pinnedMessage: PinnedMessageRecord | null;
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, avatar_level, created_at, profile_public')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as UserRow;
  const isPublic = row.profile_public ?? true;

  let favoriteCommunityIds: string[] = [];
  let pinnedMessage: PinnedMessageRecord | null = null;
  if (isPublic) {
    try {
      [favoriteCommunityIds, pinnedMessage] = await Promise.all([
        getUserFavoriteCommunities(userId),
        getUserPinnedMessage(userId),
      ]);
    } catch {
      // Profile extras are best-effort; fall back to empty/null on error.
    }
  }

  return {
    id: row.id,
    username: isPublic ? row.username : null,
    avatarLevel: row.avatar_level ?? 1,
    role: isPublic ? row.role : null,
    createdAt: isPublic ? row.created_at ?? null : null,
    profilePublic: isPublic,
    favoriteCommunityIds,
    pinnedMessage,
  };
}

export async function getProfileVisibility(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('profile_public')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.profile_public ?? true;
}

export async function updateProfileVisibility(userId: string, profilePublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ profile_public: profilePublic })
    .eq('id', userId);
  if (error) throw error;
}

export async function saveOnboardingIdentities(publicUsername: string, privateUsername: string): Promise<void> {
  const { data, error } = await supabase.rpc('save_onboarding_identities', {
    p_public_username: publicUsername,
    p_private_alias: privateUsername,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    if (result?.error === 'public_username_taken') throw new Error('Public username is already taken.');
    if (result?.error === 'private_username_taken') throw new Error('Private username is already taken.');
    throw new Error('Choose usernames with 3-24 letters, numbers, dots, dashes, or underscores.');
  }
}

export interface UserAliasRow {
  id: string;
  alias: string;
  is_public: boolean;
  created_at: string;
}

export async function listUserAliases(userId: string): Promise<UserAliasRow[]> {
  const { data, error } = await supabase
    .from('user_aliases')
    .select('id, alias, is_public, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserAliasRow[];
}

export async function savePrivateAlias(alias: string): Promise<UserAliasRow> {
  const trimmed = alias.trim();
  if (!/^[A-Za-z0-9._-]{3,24}$/.test(trimmed)) {
    throw new Error('Name must be 3-24 letters, numbers, dots, dashes, or underscores.');
  }
  const { data, error } = await supabase.rpc('save_private_alias', { p_alias: trimmed });
  if (error) {
    if (error.code === '23505' || error.message.includes('private_username_taken')) {
      throw new Error('That name is already taken.');
    }
    if (error.message.includes('invalid_private_username')) {
      throw new Error('Name must be 3-24 letters, numbers, dots, dashes, or underscores.');
    }
    throw error;
  }
  return data as UserAliasRow;
}

export async function addPrivateAlias(_userId: string, alias: string): Promise<UserAliasRow> {
  void _userId;
  return savePrivateAlias(alias);
}

export async function deleteUserAlias(aliasId: string): Promise<void> {
  const { error } = await supabase.from('user_aliases').delete().eq('id', aliasId);
  if (error) throw error;
}
