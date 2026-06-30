import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, MessageCircle, Heart, Reply, Send } from "lucide-react";
import {
  fetchPollComments,
  fetchTrendingPolls,
  submitPollVote,
  type PollCommentRow,
  type PollVoteResult,
  type TrendingPoll,
} from "@/lib/api/polls";
import type { Poll } from "@/store/types";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";
import { isNoPollOption, isYesPollOption } from "@/lib/polls/normalizePollOptionText";

interface TrendingPollsBoxProps {
  isLight?: boolean;
  polls: Poll[];
  userId?: string;
}

interface TrendingEntry {
  poll: Poll;
  commentCount: number;
}

function resolveYesNoOptions(poll: Poll) {
  const yesOption = poll.options.find((option) => isYesPollOption(option.text)) ?? poll.options[0];
  const noOption =
    poll.options.find((option) => isNoPollOption(option.text)) ??
    poll.options.find((option) => option.id !== yesOption?.id) ??
    yesOption;
  return yesOption && noOption ? { yesOption, noOption } : null;
}

function answersStorageKey(userId: string | undefined): string | null {
  return userId ? `raw.poll-history.answers.${userId}` : null;
}

function readStoredSelections(userId: string | undefined): Record<string, string> {
  const key = answersStorageKey(userId);
  if (!key) return {};
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistSelection(userId: string | undefined, pollId: string, optionId: string | null) {
  const key = answersStorageKey(userId);
  if (!key) return;
  try {
    const current = readStoredSelections(userId);
    if (optionId) {
      current[pollId] = optionId;
    } else {
      delete current[pollId];
    }
    window.localStorage.setItem(key, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

export function TrendingPollsBox({
  isLight = false,
  polls,
  userId,
}: TrendingPollsBoxProps) {
  const [trending, setTrending] = useState<TrendingPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteOverrides, setVoteOverrides] = useState<Record<string, Record<string, number>>>({});
  const [selectedByPoll, setSelectedByPoll] = useState<Record<string, string>>(() =>
    readStoredSelections(userId),
  );
  const [expandedCommentsPollId, setExpandedCommentsPollId] = useState<string | null>(null);
  const [commentsByPoll, setCommentsByPoll] = useState<Record<string, PollCommentRow[]>>({});
  const [commentsLoadingByPoll, setCommentsLoadingByPoll] = useState<Record<string, boolean>>({});
  const [commentInputByPoll, setCommentInputByPoll] = useState<Record<string, string>>({});
  const [likesByCommentId, setLikesByCommentId] = useState<Record<string, number>>({});
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedByPoll(readStoredSelections(userId));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTrendingPolls(3)
      .then((rows) => {
        if (!cancelled) setTrending(rows);
      })
      .catch(() => {
        if (!cancelled) setTrending([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries: TrendingEntry[] = useMemo(() => {
    const byId = new Map(polls.map((poll) => [poll.id, poll] as const));
    return trending
      .map((row) => {
        const poll = byId.get(row.id);
        return poll ? { poll, commentCount: row.commentCount } : null;
      })
      .filter((entry): entry is TrendingEntry => entry !== null);
  }, [trending, polls]);

  const handleVote = useCallback(async (pollId: string, optionId: string) => {
    setSelectedByPoll((previous) => ({ ...previous, [pollId]: optionId }));
    persistSelection(userId, pollId, optionId);
    setVoteOverrides((previous) => {
      const current = previous[pollId] ?? {};
      return {
        ...previous,
        [pollId]: { ...current, [optionId]: (current[optionId] ?? 0) + 1 },
      };
    });

    try {
      const result = await submitPollVote(pollId, optionId);
      setVoteOverrides((previous) => ({ ...previous, [pollId]: result.optionVotes }));
    } catch (error) {
      if (error instanceof Error && error.message === "already_voted") {
        const optionVotes = (error as Error & Partial<PollVoteResult>).optionVotes;
        if (optionVotes) {
          setVoteOverrides((previous) => ({ ...previous, [pollId]: optionVotes }));
        }
        return;
      }
      setSelectedByPoll((previous) => {
        const next = { ...previous };
        delete next[pollId];
        return next;
      });
      persistSelection(userId, pollId, null);
      setVoteOverrides((previous) => {
        const current = { ...(previous[pollId] ?? {}) };
        const optimistic = current[optionId] ?? 0;
        if (optimistic > 0) {
          current[optionId] = optimistic - 1;
        }
        return { ...previous, [pollId]: current };
      });
    }
  }, [userId]);

  const handleToggleComments = useCallback((pollId: string) => {
    setExpandedCommentsPollId((current) => (current === pollId ? null : pollId));

    if (commentsByPoll[pollId] || commentsLoadingByPoll[pollId]) return;

    setCommentsLoadingByPoll((previous) => ({ ...previous, [pollId]: true }));
    fetchPollComments(pollId)
      .then((comments) => {
        setCommentsByPoll((previous) => ({ ...previous, [pollId]: comments }));
      })
      .catch(() => {
        setCommentsByPoll((previous) => ({ ...previous, [pollId]: [] }));
      })
      .finally(() => {
        setCommentsLoadingByPoll((previous) => ({ ...previous, [pollId]: false }));
      });
  }, [commentsByPoll, commentsLoadingByPoll]);

  const handleAddComment = useCallback((pollId: string) => {
    const text = (commentInputByPoll[pollId] ?? "").trim();
    if (!text) return;

    const newComment: PollCommentRow = {
      id: `comment-${Date.now()}`,
      poll_id: pollId,
      text,
      author_name: `@user-${userId?.slice(0, 4)}`,
      created_at: new Date().toISOString(),
    };

    setCommentsByPoll((previous) => ({
      ...previous,
      [pollId]: [...(previous[pollId] ?? []), newComment],
    }));

    setCommentInputByPoll((previous) => ({ ...previous, [pollId]: "" }));
  }, [commentInputByPoll, userId]);

  const handleLikeComment = useCallback((commentId: string) => {
    setLikedCommentIds((previous) => {
      const next = new Set(previous);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });

    setLikesByCommentId((previous) => {
      const current = previous[commentId] ?? 0;
      const isLiked = likedCommentIds.has(commentId);
      return { ...previous, [commentId]: isLiked ? current - 1 : current + 1 };
    });
  }, [likedCommentIds]);

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isLight ? "border-slate-200 bg-white/80" : "border-white/10 bg-raw-black/40"
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <Flame className="size-4 text-raw-gold" />
        <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>
          Trending Polls
        </h2>
      </div>
      <p className={`text-[13px] ${isLight ? "text-slate-500" : "text-white/40"}`}>
        Polls the community is talking about right now. Tap a side to vote — these don't count toward your daily 7.
      </p>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-7 md:overflow-visible md:pb-0">
        {loading ? (
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-white/40"}`}>Loading…</p>
        ) : entries.length === 0 ? (
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-white/40"}`}>
            No discussions yet. Be the first to drop a take in Polls.
          </p>
        ) : (
          entries.map((entry) => {
            const options = resolveYesNoOptions(entry.poll);
            if (!options) return null;

            const overrides = voteOverrides[entry.poll.id] ?? {};
            const primaryVotes = overrides[options.yesOption.id] ?? options.yesOption.votes;
            const secondaryVotes = overrides[options.noOption.id] ?? options.noOption.votes;
            const selectedOptionId = selectedByPoll[entry.poll.id];
            const safeSelected =
              selectedOptionId === options.yesOption.id || selectedOptionId === options.noOption.id
                ? selectedOptionId
                : null;
            const isCommentsOpen = expandedCommentsPollId === entry.poll.id;
            const comments = commentsByPoll[entry.poll.id] ?? [];
            const commentsLoading = Boolean(commentsLoadingByPoll[entry.poll.id]);

            return (
              <div key={entry.poll.id} className="w-[18.5rem] shrink-0 space-y-3 sm:w-[20rem] md:w-auto md:shrink">
                <PremiumPollCard
                  question={entry.poll.question}
                  primaryOption={{
                    id: options.yesOption.id,
                    label: options.yesOption.text,
                    votes: primaryVotes,
                  }}
                  secondaryOption={{
                    id: options.noOption.id,
                    label: options.noOption.text,
                    votes: secondaryVotes,
                  }}
                  selectedOptionId={safeSelected}
                  onVote={(optionId) => handleVote(entry.poll.id, optionId)}
                />

                <div className="mx-auto flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleComments(entry.poll.id)}
                    aria-expanded={isCommentsOpen}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                      isLight
                        ? "border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-700"
                        : "border-raw-gold/35 bg-raw-black/45 text-raw-gold hover:border-raw-gold/60 hover:bg-raw-gold/10"
                    }`}
                  >
                    <MessageCircle className="size-3.5" />
                    {entry.commentCount} {entry.commentCount === 1 ? "comment" : "comments"}
                  </button>
                </div>

                {isCommentsOpen && (
                  <div
                    className={`mx-auto w-full max-w-[22rem] rounded-2xl border px-4 py-3 space-y-3 ${
                      isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-raw-black/45 text-raw-silver"
                    }`}
                  >
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isLight ? "text-slate-500" : "text-raw-gold/70"}`}>
                      Comments
                    </p>

                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {commentsLoading ? (
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>Loading comments...</p>
                      ) : comments.length === 0 ? (
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>No comments yet. Be first!</p>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`rounded-xl border px-3 py-2 ${
                              isLight ? "border-slate-100 bg-slate-50" : "border-white/10 bg-white/[0.03]"
                            }`}
                          >
                            <div className={`flex items-center justify-between gap-2 text-[10px] ${isLight ? "text-slate-500" : "text-raw-silver/40"}`}>
                              <span className="truncate">@{comment.author_name?.trim() || "Anonymous"}</span>
                              <span className="shrink-0">
                                {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className={`mt-1 text-sm leading-relaxed ${isLight ? "text-slate-700" : "text-raw-silver/80"}`}>
                              {comment.text}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleLikeComment(comment.id)}
                                className={`flex items-center gap-1 text-[11px] transition ${
                                  likedCommentIds.has(comment.id)
                                    ? isLight
                                      ? "text-red-500"
                                      : "text-red-400"
                                    : isLight
                                    ? "text-slate-400 hover:text-red-500"
                                    : "text-raw-silver/50 hover:text-red-400"
                                }`}
                              >
                                <Heart
                                  className={`h-3.5 w-3.5 ${likedCommentIds.has(comment.id) ? "fill-current" : ""}`}
                                />
                                {likesByCommentId[comment.id] ?? 0}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)}
                                className={`flex items-center gap-1 text-[11px] transition ${
                                  isLight ? "text-slate-400 hover:text-blue-500" : "text-raw-silver/50 hover:text-blue-400"
                                }`}
                              >
                                <Reply className="h-3.5 w-3.5" />
                                Reply
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment…"
                        value={commentInputByPoll[entry.poll.id] ?? ""}
                        onChange={(e) =>
                          setCommentInputByPoll((prev) => ({ ...prev, [entry.poll.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddComment(entry.poll.id);
                          }
                        }}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm outline-none transition ${
                          isLight
                            ? "border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-blue-400"
                            : "border border-white/10 bg-white/5 text-raw-silver placeholder:text-raw-silver/40 focus:border-raw-gold/50"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(entry.poll.id)}
                        disabled={!(commentInputByPoll[entry.poll.id] ?? "").trim()}
                        className={`flex items-center justify-center rounded-lg p-2 transition disabled:opacity-40 ${
                          isLight
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-raw-gold/20 text-raw-gold hover:bg-raw-gold/30"
                        }`}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
