import type { SupabaseClient } from "@supabase/supabase-js";

export type BlockedWordRecord = {
  id: string;
  term: string;
  normalizedTerm: string;
  createdAt: string;
  createdBy?: string | null;
};

type BlockedWordRow = {
  id: string;
  term: string;
  normalized_term: string;
  created_at: string;
  created_by: string | null;
};

const MAX_BLOCKED_WORD_LENGTH = 80;

export function normalizeBlockedWord(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase().slice(0, MAX_BLOCKED_WORD_LENGTH) : "";
}

export function mapBlockedWord(row: BlockedWordRow): BlockedWordRecord {
  return {
    id: row.id,
    term: row.term,
    normalizedTerm: row.normalized_term,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export async function listBlockedWords(supabase: SupabaseClient): Promise<BlockedWordRecord[]> {
  const { data, error } = await supabase
    .from("blocked_words")
    .select("id, term, normalized_term, created_at, created_by")
    .order("normalized_term", { ascending: true });

  if (error) throw new Error("failed_to_load_blocked_words");
  return ((data ?? []) as BlockedWordRow[]).map(mapBlockedWord);
}

export async function addBlockedWord(
  supabase: SupabaseClient,
  term: string,
  createdBy: string,
): Promise<BlockedWordRecord> {
  const normalized = normalizeBlockedWord(term);
  if (!normalized) throw new Error("invalid_blocked_word");

  const { data, error } = await supabase
    .from("blocked_words")
    .upsert({ term: normalized, created_by: createdBy }, { onConflict: "normalized_term" })
    .select("id, term, normalized_term, created_at, created_by")
    .single();

  if (error || !data) throw new Error("failed_to_save_blocked_word");
  return mapBlockedWord(data as BlockedWordRow);
}

export async function removeBlockedWord(supabase: SupabaseClient, id: string): Promise<void> {
  if (!id.trim()) throw new Error("invalid_blocked_word");

  const { error } = await supabase.from("blocked_words").delete().eq("id", id);
  if (error) throw new Error("failed_to_remove_blocked_word");
}
