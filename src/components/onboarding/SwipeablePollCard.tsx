import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, SendHorizontal } from "lucide-react";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";
import type { Comment } from "./PollComments";
import { isNoPollOption, isYesPollOption } from "@/lib/polls/normalizePollOptionText";

interface SwipeablePollCardProps {
  id: string;
  question: string;
  options: string[];
  selectedOption?: string;
  isAnswered: boolean;
  totalResponses: number;
  responseStats: Record<string, number>;
  comments?: Comment[];
  pollIndex: number;
  totalPolls: number;
  onSwipe: (option: string) => void;
  onNavigate?: (direction: "left" | "right") => void;
  onAddComment?: (content: string) => void;
  currentIndex: number;
  completedCount: number;
}

function resolveOptions(options: string[]) {
  const yesOption = options.find((option) => isYesPollOption(option)) ?? options[0];
  const noOption =
    options.find((option) => isNoPollOption(option)) ??
    options.find((option) => option !== yesOption) ??
    yesOption;

  return yesOption && noOption ? { yesOption, noOption } : null;
}

export function SwipeablePollCard({
  id,
  question,
  options,
  selectedOption,
  isAnswered,
  totalResponses,
  responseStats,
  comments = [],
  pollIndex,
  totalPolls,
  onSwipe,
  onNavigate,
  onAddComment,
  currentIndex,
  completedCount,
}: SwipeablePollCardProps) {
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [updatedComments, setUpdatedComments] = useState<Comment[]>(comments);
  const resolvedOptions = resolveOptions(options);

  useEffect(() => {
    setUpdatedComments(comments);
  }, [comments]);

  const handleCommentAdd = () => {
    const content = commentText.trim();
    if (!content) return;
    const next: Comment = {
      id: `comment-${Date.now()}`,
      author: "You",
      avatar: 5,
      content,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      likes: 0,
      replies: [],
      isAnonymous: false,
    };
    setUpdatedComments((prev) => [next, ...prev]);
    onAddComment?.(content);
    setCommentText("");
  };

  const handleReplyAdd = (commentId: string) => {
    const content = replyText.trim();
    if (!content) return;
    const next: Comment = {
      id: `${commentId}-reply-${Date.now()}`,
      author: "You",
      avatar: 5,
      content,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      likes: 0,
      replies: [],
      isAnonymous: false,
    };
    setUpdatedComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies ?? []), next] }
          : comment
      )
    );
    setReplyText("");
    setReplyingToId(null);
  };

  if (!resolvedOptions) {
    return (
      <div className="border border-raw-border/40 bg-raw-black/45 p-6 text-center text-sm text-raw-silver/55">
        No options available for this poll.
      </div>
    );
  }

  const { yesOption, noOption } = resolvedOptions;

  return (
    <div className="flex flex-col gap-4 sm:gap-5" data-poll-id={id}>
      <div className="flex items-center justify-between border border-raw-gold/20 bg-black/35 px-3 py-2 sm:px-4 sm:py-3">
        <span className="font-display text-[10px] uppercase tracking-[0.18em] text-raw-silver/45">
          {currentIndex + 1} / {totalPolls}
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-raw-gold/75">
          {completedCount}/{totalPolls} completed
        </span>
      </div>

      <PremiumPollCard
        question={question}
        primaryOption={{ id: yesOption, label: yesOption, votes: responseStats[yesOption] ?? 0 }}
        secondaryOption={{ id: noOption, label: noOption, votes: responseStats[noOption] ?? 0 }}
        selectedOptionId={isAnswered ? selectedOption ?? null : null}
        onVote={onSwipe}
      />

      {isAnswered && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.("left")}
            disabled={pollIndex === 0}
            className="flex min-h-[40px] items-center justify-center gap-1.5 border border-raw-border/40 bg-raw-black/40 py-2.5 text-[11px] font-medium text-raw-silver/65 transition hover:border-raw-border/70 hover:text-raw-text disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous poll"
          >
            <ChevronLeft className="size-3.5" /> Previous
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("right")}
            disabled={pollIndex >= totalPolls - 1}
            className="flex min-h-[40px] items-center justify-center gap-1.5 border border-raw-border/40 bg-raw-black/40 py-2.5 text-[11px] font-medium text-raw-silver/65 transition hover:border-raw-border/70 hover:text-raw-text disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next poll"
          >
            Next <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      {isAnswered && (
        <div className="border border-raw-border/35 bg-raw-black/45 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.12em] text-raw-silver/55">
              Comments
              {totalResponses > 0 && <span className="ml-2 text-raw-silver/35">{totalResponses} responses</span>}
            </p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleCommentAdd();
            }}
            className="flex items-center gap-2 rounded-full border border-raw-border/35 bg-raw-black/35 px-3 py-2"
          >
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm text-raw-text placeholder:text-raw-silver/35 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="rounded-full border border-raw-border/40 bg-raw-surface/40 p-2 text-raw-silver/80 transition hover:bg-raw-surface/55 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Add comment"
            >
              <SendHorizontal className="size-3.5" />
            </button>
          </form>

          <div className="mt-3 max-h-[50vh] overflow-y-auto pr-1 sm:mt-4 sm:max-h-64">
            <div className="flex flex-col gap-2.5">
              {updatedComments.length === 0 ? (
                <p className="text-center text-xs text-raw-silver/45">No comments yet. Be the first.</p>
              ) : (
                updatedComments.slice(0, 6).map((comment) => (
                  <article key={comment.id} className="border border-raw-border/35 bg-raw-black/50 px-3.5 py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-raw-silver/50">
                      <span>@{comment.isAnonymous ? "Anonymous" : comment.author}</span>
                      <span>{comment.timestamp}</span>
                    </div>
                    <p className="mt-1 text-sm text-raw-silver/85">{comment.content}</p>

                    <div className="mt-2 flex flex-col gap-1.5">
                      {(comment.replies ?? []).slice(-2).map((reply) => (
                        <div key={reply.id} className="border border-raw-border/35 bg-raw-black/30 px-3 py-2">
                          <div className="flex items-center justify-between text-[10px] text-raw-silver/45">
                            <span>@{reply.isAnonymous ? "Anonymous" : reply.author}</span>
                            <span>{reply.timestamp}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-raw-silver/80">{reply.content}</p>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleReplyAdd(comment.id);
                      }}
                      className="mt-2 flex items-center gap-2 rounded-full border border-raw-border/35 bg-raw-black/30 px-3 py-1.5"
                    >
                      <input
                        value={replyingToId === comment.id ? replyText : ""}
                        onFocus={() => setReplyingToId(comment.id)}
                        onChange={(event) => {
                          setReplyingToId(comment.id);
                          setReplyText(event.target.value);
                        }}
                        placeholder="Reply..."
                        className="flex-1 bg-transparent text-xs text-raw-text placeholder:text-raw-silver/35 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={replyingToId !== comment.id || !replyText.trim()}
                        className="rounded-full border border-raw-border/40 px-2 py-0.5 text-[10px] text-raw-silver/80 hover:bg-raw-surface/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Reply
                      </button>
                    </form>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
