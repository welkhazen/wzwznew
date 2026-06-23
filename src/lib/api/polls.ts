import { supabase } from "@/lib/supabase";
import type { AdminPoll, PollOptionRow } from "@/backend/supabase/models/poll";
import type { Poll } from "@/store/types";

export interface PollCommentRow {
  id: string;
  poll_id: string;
  text: string;
  created_at: string;
  user_id?: string | null;
  author_name?: string | null;
  parent_comment_id?: string | null;
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

type RpcPollRow = {
  id?: string;
  question?: string;
  locked?: boolean;
  options?: Array<{ id?: string; text?: string; votes?: number }>;
};

export async function fetchPolls(limit = 10): Promise<Poll[]> {
  // Single round-trip: the RPC inlines poll filtering, option fetching, and
  // vote tallying into one query (replaces the previous N+1 over options).
  const { data, error } = await supabase.rpc("get_polls_with_vote_counts", { p_limit: limit });
  if (error) throw error;

  const rows = Array.isArray(data) ? (data as RpcPollRow[]) : [];
  return rows
    .map((row) => ({
      id: String(row.id ?? ""),
      question: String(row.question ?? ""),
      options: (row.options ?? [])
        .map((opt) => ({
          id: String(opt.id ?? ""),
          text: String(opt.text ?? ""),
          votes: Number.isFinite(Number(opt.votes)) ? Number(opt.votes) : 0,
        }))
        .filter((opt) => opt.id && opt.text),
      locked: Boolean(row.locked ?? false),
    }))
    .filter((poll) => poll.id && poll.question.trim().length > 5 && poll.options.length >= 2);
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

export interface TrendingPoll {
  id: string;
  question: string;
  commentCount: number;
}

type TrendingPollRow = {
  id?: string;
  question?: string;
  status?: string;
  poll_comments?: Array<{ count?: number }> | { count?: number } | null;
};

export async function fetchTrendingPolls(limit = 5): Promise<TrendingPoll[]> {
  const { data, error } = await supabase
    .from("polls")
    .select("id, question, status, poll_comments(count)")
    .eq("status", "active")
    .limit(50);
  if (error) throw error;

  const rows = (data ?? []) as TrendingPollRow[];
  return rows
    .map((row) => {
      const commentsField = row.poll_comments;
      const rawCount = Array.isArray(commentsField)
        ? commentsField[0]?.count
        : commentsField?.count;
      const commentCount = Number(rawCount ?? 0);
      return {
        id: String(row.id ?? ""),
        question: String(row.question ?? ""),
        commentCount: Number.isFinite(commentCount) ? commentCount : 0,
      };
    })
    .filter((poll) => poll.id && poll.question.trim().length > 0 && poll.commentCount > 0)
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, limit);
}

export async function fetchPollComments(pollId: string): Promise<PollCommentRow[]> {
  const { data, error } = await supabase
    .from("poll_comments")
    .select("id, poll_id, text, created_at, user_id, author_name, parent_comment_id")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as PollCommentRow[];
}

export async function addPollComment(
  pollId: string,
  text: string,
  author?: { id: string; name: string } | null,
  parentCommentId?: string | null,
): Promise<PollCommentRow> {
  const payload: Record<string, unknown> = { poll_id: pollId, text };
  if (author) {
    payload.user_id = author.id;
    payload.author_name = author.name;
  }
  if (parentCommentId) {
    payload.parent_comment_id = parentCommentId;
  }
  const { data, error } = await supabase
    .from("poll_comments")
    .insert(payload)
    .select("id, poll_id, text, created_at, user_id, author_name, parent_comment_id")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create comment");
  return data as PollCommentRow;
}
