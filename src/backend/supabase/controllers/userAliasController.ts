import { supabase } from '../client';
import type { SaveUserAliasInput, UserAliasRow } from '../models/user-alias';

export async function fetchUserAliases(userId: string): Promise<UserAliasRow[]> {
  const { data, error } = await supabase
    .from('user_aliases')
    .select('id, user_id, alias, is_public, avatar_level, created_at, updated_at')
    .eq('user_id', userId)
    .order('is_public', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserAliasRow[];
}

export async function saveUserAliases(userId: string, aliases: SaveUserAliasInput[]): Promise<UserAliasRow[]> {
  const cleaned = aliases
    .map((item) => ({ alias: item.alias.trim(), is_public: item.isPublic, avatar_level: item.avatarLevel }))
    .filter((item) => item.alias.length > 0);

  const rows = cleaned.map((item) => ({
    user_id: userId,
    alias: item.alias,
    avatar_level: item.avatar_level,
    is_public: item.is_public,
  }));

  const { error: deleteError } = await supabase
    .from('user_aliases')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_aliases')
    .insert(rows)
    .select('id, user_id, alias, is_public, avatar_level, created_at, updated_at');

  if (error) throw error;
  return (data ?? []) as UserAliasRow[];
}
