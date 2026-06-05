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
  const isPublic = true;

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

export async function updateProfileVisibility(userId: string, profilePublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ profile_public: profilePublic })
    .eq('id', userId);
  if (error) throw error;
}
