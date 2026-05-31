import { supabase } from "@/lib/supabase";
import type { AdminPoll, PollOptionRow } from "@/backend/supabase/models/poll";
import type { Poll } from "@/store/types";

export interface PollCommentRow {
  id: string;
  poll_id: string;
  body: string;
  created_at: string;
}

export interface PollVoteResult {
  optionVotes: Record<string, number>;
}

export async function testPollConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase.from("polls").select("id").limit(1);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Connected to Supabase" };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}

export async function fetchPolls(limit = 10): Promise<Poll[]> {
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

  const { data: optionRows, error: optionError } = await supabase
    .from("poll_options")
    .select("id, poll_id, label, position")
    .in("poll_id", pollIds);
  if (optionError) throw optionError;

  const normalizedOptionRows = (optionRows ?? []).map((row) => ({
    id: row.id,
    poll_id: row.poll_id,
    label: row.label,
    position: row.position ?? 0,
  }));

  const optionsByPoll = new Map<string, { id: string; label: string; position: number }[]>();
  normalizedOptionRows.forEach((row) => {
    const list = optionsByPoll.get(row.poll_id) ?? [];
    list.push(row);
    optionsByPoll.set(row.poll_id, list);
  });

  const voteCountEntries = await Promise.all(
    normalizedOptionRows.map(async (option) => {
      const { count, error } = await supabase
        .from("poll_votes")
        .select("id", { count: "exact", head: true })
        .eq("option_id", option.id);
      if (error) throw error;
      return [option.id, count ?? 0] as const;
    })
  );
  const voteCounts = new Map<string, number>(voteCountEntries);

  return (pollRows ?? [])
    .map((row) => {
      const options = [...(optionsByPoll.get(row.id) ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((opt) => ({ id: opt.id, text: opt.label, votes: voteCounts.get(opt.id) ?? 0 }));
      return { id: row.id as string, question: row.question as string, options, locked: false };
    })
    .filter((poll) => poll.question?.trim().length > 5 && poll.options.length >= 2);
}

export async function fetchAdminPolls(): Promise<AdminPoll[]> {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      id,
      question,
      status,
      created_at,
      poll_options (
        id,
        label,
        position
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const options = [...((row.poll_options as PollOptionRow[]) ?? [])].sort((a, b) => a.position - b.position);
    return {
      id: row.id as string,
      question: row.question as string,
      options: options.map((opt) => ({ id: opt.id, text: opt.label, votes: 0 })),
      locked: row.status === "locked",
      createdAt: row.created_at as string,
    };
  });
}

export async function createAdminPoll(poll: AdminPoll): Promise<void> {
  const { error: pollError } = await supabase.from("polls").insert({
    id: poll.id,
    question: poll.question,
    status: poll.locked ? "locked" : "active",
    is_onboarding: false,
    created_at: poll.createdAt,
  });
  if (pollError) throw pollError;

  if (poll.options.length > 0) {
    const { error: optionsError } = await supabase.from("poll_options").insert(
      poll.options.map((opt, i) => ({
        id: opt.id,
        poll_id: poll.id,
        label: opt.text,
        position: i,
      }))
    );
    if (optionsError) throw optionsError;
  }
}

export async function deleteAdminPoll(pollId: string): Promise<void> {
  await supabase.from("poll_votes").delete().eq("poll_id", pollId);
  await supabase.from("poll_options").delete().eq("poll_id", pollId);
  const { error } = await supabase.from("polls").delete().eq("id", pollId);
  if (error) throw error;
}

function apiUrl(path: string): string {
  const apiOrigin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, "");
  return apiOrigin ? `${apiOrigin}${path}` : path;
}

function parseOptionVotes(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, count]) => [key, Number(count)])
      .filter(([, count]) => Number.isFinite(count) && count >= 0)
  );
}

export async function submitPollVote(pollId: string, optionId: string): Promise<PollVoteResult> {
  const response = await fetch(apiUrl(`/api/polls/${encodeURIComponent(pollId)}/vote`), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ optionId }),
  });

  const payload = (await response.json().catch(() => null)) as { optionVotes?: unknown } | null;

  if (!response.ok) {
    if (response.status === 409) {
      const error = new Error("already_voted") as Error & PollVoteResult;
      error.optionVotes = parseOptionVotes(payload?.optionVotes);
      throw error;
    }

    throw new Error("Failed to submit poll vote");
  }

  return { optionVotes: parseOptionVotes(payload?.optionVotes) };
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
