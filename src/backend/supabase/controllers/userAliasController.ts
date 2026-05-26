import { supabase } from '../client';
import type { SaveUserAliasInput, UserAliasRow } from '../models/user-alias';

export async function fetchUserAliases(userId: string): Promise<UserAliasRow[]> {
  const { data, error } = await supabase
    .from('user_aliases')
    .select('id, user_id, alias, is_public, created_at, updated_at')
    .eq('user_id', userId)
    .order('is_public', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserAliasRow[];
}

export async function saveUserAliases(userId: string, aliases: SaveUserAliasInput[]): Promise<UserAliasRow[]> {
  const cleaned = aliases
    .map((item) => ({ alias: item.alias.trim(), is_public: item.isPublic }))
    .filter((item) => item.alias.length > 0);

  if (cleaned.length === 0) {
    throw new Error('Add at least one identity name.');
  }

  if (!cleaned.some((item) => item.is_public)) {
    cleaned[0].is_public = true;
  }

  const publicIndex = cleaned.findIndex((item) => item.is_public);
  const rows = cleaned.map((item, index) => ({
    user_id: userId,
    alias: item.alias,
    is_public: index === publicIndex,
  }));

  const { error: deleteError } = await supabase
    .from('user_aliases')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  const { data, error } = await supabase
    .from('user_aliases')
    .insert(rows)
    .select('id, user_id, alias, is_public, created_at, updated_at');

  if (error) throw error;
  return (data ?? []) as UserAliasRow[];
}
