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

export async function submitPollVote(pollId: string, optionId: string, _userId: string): Promise<void> {
  const response = await fetch(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ optionId }),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("already_voted");
    }

    throw new Error("Failed to submit poll vote");
  }
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
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`);
  if (!response.ok) throw new Error("Failed to fetch token balance");

  const payload = (await response.json()) as { balance?: unknown };
  const balance = Number(payload.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token balance response");
  return balance;
}

export async function spendTokens(userId: string, amount: number): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  const payload = (await response.json().catch(() => null)) as { balance?: unknown; error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? "Failed to spend tokens");

  const balance = Number(payload?.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token spend response");
  return balance;
}

export async function addTokensToBalance(userId: string, amount: number): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "add", amount }),
  });

  const payload = (await response.json().catch(() => null)) as { balance?: unknown; error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? "Failed to add tokens");

  const balance = Number(payload?.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token add response");
  return balance;
}
