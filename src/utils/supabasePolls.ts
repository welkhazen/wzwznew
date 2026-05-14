import { supabase } from "./supabase";
import type { Poll } from "@/store/types";

export interface PollCommentRow {
  id: string;
  poll_id: string;
  body: string;
  created_at: string;
}

export async function fetchSupabasePolls(limit = 10): Promise<Poll[]> {
  const { data: pollRows, error: pollError } = await supabase
    .from("polls")
    .select("id, question, status")
    .eq("is_onboarding", false)
    .neq("status", "locked")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (pollError) throw pollError;

  const pollIds = (pollRows ?? []).map((row) => row.id).filter(Boolean) as string[];
  if (pollIds.length === 0) return [];

  const [
    { data: optionRows, error: optionError },
    { data: voteRows },
  ] = await Promise.all([
    supabase.from("poll_options").select("id, poll_id, label, position").in("poll_id", pollIds),
    supabase.from("poll_votes").select("poll_id, option_id").in("poll_id", pollIds),
  ]);

  if (optionError) throw optionError;

  const optionsByPoll = new Map<string, { id: string; label: string; position: number }[]>();
  (optionRows ?? []).forEach((row) => {
    const list = optionsByPoll.get(row.poll_id) ?? [];
    list.push({ id: row.id, label: row.label, position: row.position ?? 0 });
    optionsByPoll.set(row.poll_id, list);
  });

  const voteCounts = new Map<string, number>();
  (voteRows ?? []).forEach((row) => {
    if (row.option_id) voteCounts.set(row.option_id, (voteCounts.get(row.option_id) ?? 0) + 1);
  });

  return (pollRows ?? [])
    .map((row) => {
      const options = [...(optionsByPoll.get(row.id) ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((opt) => ({ id: opt.id, text: opt.label, votes: voteCounts.get(opt.id) ?? 0 }));
      return { id: row.id as string, question: row.question as string, options, locked: false };
    })
    .filter((poll) => poll.question?.trim().length > 5 && poll.options.length >= 2);
}

export async function submitPollVote(pollId: string, optionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("poll_votes")
    .upsert(
      { poll_id: pollId, option_id: optionId, user_id: userId, surface: "app" },
      { onConflict: "poll_id,user_id" }
    );
  if (error) throw error;
}

export async function fetchPollComments(pollId: string): Promise<PollCommentRow[]> {
  const { data, error } = await supabase
    .from("poll_comments")
    .select("id, body, created_at")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function addPollComment(pollId: string, text: string): Promise<PollCommentRow> {
  const { data, error } = await supabase
    .from("poll_comments")
    .insert({ poll_id: pollId, body: text })
    .select("id, body, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create comment");
  return data as PollCommentRow;
}

export async function fetchTokenBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("users")
    .select("token_balance")
    .eq("id", userId)
    .single();
  if (error || !data) throw error ?? new Error("Failed to fetch token balance");
  return (data as { token_balance: number }).token_balance;
}

export async function spendTokens(userId: string, amount: number): Promise<number> {
  const { data, error } = await supabase.rpc("spend_tokens", {
    p_user_id: userId,
    p_amount: amount,
  });
  if (error) throw error;
  const result = data as { ok: boolean; balance?: number; error?: string };
  if (!result.ok) throw new Error(result.error ?? "Failed to spend tokens");
  return result.balance!;
}
