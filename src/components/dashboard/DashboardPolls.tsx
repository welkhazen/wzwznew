import { useEffect, useMemo, useState } from "react";
import type { Poll } from "@/store/useRawStore";
import { useTheme } from "@/providers/useTheme";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";
import { addPollComment, fetchPollComments } from "@/utils/supabasePolls";
import { isNoPollOption, isYesPollOption } from "@/lib/polls/normalizePollOptionText";
import {
  BarChart3,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Fingerprint,
  Lock,
  Map,
  MessageCircle,
  SendHorizontal,
  Users,
  WandSparkles,
} from "lucide-react";

interface PollProgressProps {
  currentIndex: number;
  total: number;
  onSelect: (index: number) => void;
}

function PollProgress({ currentIndex, total, onSelect }: PollProgressProps) {
  return (
    <div className="mt-3 text-center">
      <p className="font-display text-[12px] tracking-[0.32em] text-[#D9D9D9]">{currentIndex + 1} / {total}</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-1.5 rounded-none transition-all ${
              index === currentIndex
                ? "w-7 bg-[#F1C42D] shadow-[0_0_10px_rgba(241,196,45,0.45)]"
                : "w-4 bg-[#3A3A3A]"
            }`}
            aria-label={`Go to poll ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

interface PollHistoryComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  replies?: PollHistoryReply[];
}

interface PollHistoryReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface DashboardPollsProps {
  polls: Poll[];
  votedPolls: Set<string>;
  userId: string;
  username: string;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  isDailyPollLimitReached: boolean;
  onVote: (pollId: string, optionId: string) => void;
}

function resolveYesNoOptions(poll: Poll) {
  const yesOption = poll.options.find((option) => isYesPollOption(option.text)) ?? poll.options[0];
  const noOption =
    poll.options.find((option) => isNoPollOption(option.text)) ??
    poll.options.find((option) => option.id !== yesOption?.id) ??
    yesOption;

  return yesOption && noOption ? { yesOption, noOption } : null;
}

function PollStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-raw-border/35 bg-raw-surface/25 p-3 text-center sm:p-4">
      <Icon className="mx-auto mb-2 size-4 text-raw-gold/45" />
      <p className="text-lg font-semibold text-raw-text">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.16em] text-raw-silver/35">{label}</p>
    </div>
  );
}

export function DashboardPolls({
  polls,
  votedPolls,
  userId,
  username,
  dailyAnsweredCount,
  dailyPollLimit,
  isDailyPollLimitReached,
  onVote,
}: DashboardPollsProps) {
  const { mode } = useTheme();
  const isLightMode = mode === "light";
  const answersStorageKey = `raw.poll-history.answers.${userId}`;
  const commentsStorageKey = `raw.poll-history.comments.${userId}`;
  const voteHintStorageKey = `raw.polls.vote-hint-seen.${userId}`;
  const [answerHistory, setAnswerHistory] = useState<Record<string, string>>({});
  const [historyComments, setHistoryComments] = useState<Record<string, PollHistoryComment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [hasSeenVoteHint, setHasSeenVoteHint] = useState(false);

  useEffect(() => {
    try {
      const rawAnswers = window.localStorage.getItem(answersStorageKey);
      const parsedAnswers = rawAnswers ? (JSON.parse(rawAnswers) as Record<string, string>) : {};
      setAnswerHistory(parsedAnswers && typeof parsedAnswers === "object" ? parsedAnswers : {});
    } catch {
      setAnswerHistory({});
    }

    try {
      const rawComments = window.localStorage.getItem(commentsStorageKey);
      const parsedComments = rawComments ? (JSON.parse(rawComments) as Record<string, PollHistoryComment[]>) : {};
      setHistoryComments(parsedComments && typeof parsedComments === "object" ? parsedComments : {});
    } catch {
      setHistoryComments({});
    }
  }, [answersStorageKey, commentsStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(answersStorageKey, JSON.stringify(answerHistory));
  }, [answerHistory, answersStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(commentsStorageKey, JSON.stringify(historyComments));
  }, [commentsStorageKey, historyComments]);

  useEffect(() => {
    const saved = window.localStorage.getItem(voteHintStorageKey);
    setHasSeenVoteHint(saved === "1");
  }, [voteHintStorageKey]);

  useEffect(() => {
    if (hasSeenVoteHint) {
      window.localStorage.setItem(voteHintStorageKey, "1");
    }
  }, [hasSeenVoteHint, voteHintStorageKey]);

  useEffect(() => {
    if (currentPollIndex >= polls.length && polls.length > 0) {
      setCurrentPollIndex(polls.length - 1);
    }
    setShowAllComments(false);
  }, [currentPollIndex, polls.length]);

  const currentPoll = polls[currentPollIndex]
    ? {
        ...polls[currentPollIndex],
        options: polls[currentPollIndex].options.slice(0, 2),
      }
    : undefined;

  useEffect(() => {
    if (!currentPoll?.id) {
      return;
    }

    let isMounted = true;
    fetchPollComments(currentPoll.id)
      .then((comments) => {
        if (!isMounted) return;
        setHistoryComments((previous) => ({
          ...previous,
          [currentPoll.id]: comments.map((comment) => ({
            id: comment.id,
            author: "Anonymous",
            content: comment.text,
            createdAt: new Date(comment.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        }));
      })
      .catch(() => {
        // leave existing comments in place if fetch fails
      });

    return () => {
      isMounted = false;
    };
  }, [currentPoll?.id, username]);

  const selectedOptionId = currentPoll ? answerHistory[currentPoll.id] : undefined;
  const hasVotedCurrent = Boolean(selectedOptionId);
  const currentComments = currentPoll ? historyComments[currentPoll.id] ?? [] : [];
  const currentOptions = currentPoll ? resolveYesNoOptions(currentPoll) : null;
  const showVoteHint = currentPollIndex === 0 && !hasVotedCurrent && !hasSeenVoteHint;

  const totalResponses = useMemo(
    () => polls.reduce((sum, poll) => sum + poll.options.reduce((acc, option) => acc + option.votes, 0), 0),
    [polls]
  );

  const pollsAnswered = votedPolls.size;
  const paidUnlocks = {
    bigFiveProfile: false,
    shadowSelf: false,
    attachmentStyle: false,
    cognitiveBiasMap: false,
  };

  const insightsProgress = [
    {
      id: "myers-briggs",
      name: "Myers-Briggs",
      icon: Brain,
      description: "Discover your personality type across 4 key dimensions of how you see the world.",
      requiredPolls: 5,
      unlockPrice: 0,
      unlocked: pollsAnswered >= 5,
    },
    {
      id: "big-five-profile",
      name: "Big Five Profile",
      icon: Fingerprint,
      description:
        "Measure your openness, conscientiousness, extraversion, agreeableness, and emotional range.",
      requiredPolls: 10,
      unlockPrice: 4,
      unlocked: pollsAnswered >= 10 && paidUnlocks.bigFiveProfile,
    },
    {
      id: "emotional-intelligence",
      name: "Emotional Intelligence",
      icon: CircleGauge,
      description:
        "Understand how you process emotions, empathy, and interpersonal cues under pressure.",
      requiredPolls: 15,
      unlockPrice: 0,
      unlocked: pollsAnswered >= 15,
    },
    {
      id: "shadow-self",
      name: "Shadow Self",
      icon: WandSparkles,
      description:
        "Reveal hidden patterns, blind spots, and traits that surface in difficult moments.",
      requiredPolls: 20,
      unlockPrice: 8,
      unlocked: pollsAnswered >= 20 || paidUnlocks.shadowSelf,
    },
    {
      id: "attachment-style",
      name: "Attachment Style",
      icon: BookOpen,
      description: "Understand your patterns in relationships and emotional bonding with others.",
      requiredPolls: 14,
      unlockPrice: 2,
      unlocked: pollsAnswered >= 14 && paidUnlocks.attachmentStyle,
    },
    {
      id: "cognitive-bias-map",
      name: "Cognitive Bias Map",
      icon: Map,
      description: "Identify the mental shortcuts and biases that shape your decisions and thinking.",
      requiredPolls: 18,
      unlockPrice: 6,
      unlocked: pollsAnswered >= 18 && paidUnlocks.cognitiveBiasMap,
    },
  ];

  const unlockedReports = insightsProgress.filter((item) => item.unlocked).length;
  const showMorePollsPaywall = isDailyPollLimitReached && dailyPollLimit > 0;

  const handleVote = (pollId: string, optionId: string) => {
    setHasSeenVoteHint(true);

    setAnswerHistory((previous) => ({
      ...previous,
      [pollId]: optionId,
    }));

    if (!votedPolls.has(pollId)) {
      onVote(pollId, optionId);
    }
  };

  const handleCommentAdd = async () => {
    if (!currentPoll) return;

    const content = commentDraft.trim();
    if (!content) return;

    const nextComment: PollHistoryComment = {
      id: `${currentPoll.id}-${Date.now()}`,
      author: username,
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setHistoryComments((previous) => ({
      ...previous,
      [currentPoll.id]: [nextComment, ...(previous[currentPoll.id] ?? [])],
    }));

    setCommentDraft("");

    try {
      await addPollComment(currentPoll.id, content);
    } catch (error) {
      console.error("Failed to save dashboard comment to Supabase", error);
    }
  };

  const handleCommentKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleCommentAdd();
  };

  const handleReplyAdd = (commentId: string) => {
    if (!currentPoll) return;

    const content = (replyDrafts[commentId] ?? "").trim();
    if (!content) return;

    const nextReply: PollHistoryReply = {
      id: `${commentId}-reply-${Date.now()}`,
      author: username,
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setHistoryComments((previous) => ({
      ...previous,
      [currentPoll.id]: (previous[currentPoll.id] ?? []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [...(comment.replies ?? []), nextReply],
            }
          : comment
      ),
    }));

    setReplyDrafts((previous) => ({
      ...previous,
      [commentId]: "",
    }));
  };

  const handleReplyKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, commentId: string) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleReplyAdd(commentId);
  };

  if (!currentPoll) {
    return (
      <div className="border border-raw-border/30 bg-raw-black/30 p-6 text-center text-sm text-raw-silver/55">
        No polls available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header>
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">Polls</h1>
        <p className="mt-2 text-xs text-raw-silver/45 sm:text-sm">
          Anonymous voting, live percentages, and reflections from the community.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <PollStat icon={BarChart3} label="Live Polls" value={polls.length} />
        <PollStat icon={Users} label="Total Votes" value={totalResponses.toLocaleString()} />
        <PollStat icon={MessageCircle} label="Daily Progress" value={`${dailyAnsweredCount}/${dailyPollLimit}`} />
      </section>

      {showMorePollsPaywall && (
        <section className="border border-raw-gold/35 bg-gradient-to-r from-raw-gold/12 via-raw-black/60 to-raw-black/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-raw-gold/80">Daily Limit Reached</p>
              <h3 className="mt-1 font-display text-lg text-raw-text sm:text-xl">You completed {dailyAnsweredCount}/{dailyPollLimit} polls today.</h3>
              <p className="mt-1 text-xs text-raw-silver/50 sm:text-sm">
                Want to solve more right now? Upgrade to unlock extra polls instantly.
              </p>
            </div>
            <div className="flex items-stretch gap-2 sm:items-center">
              <button className="flex-1 border border-raw-border/45 bg-raw-black/35 px-4 py-2.5 text-xs text-raw-silver/75 hover:border-raw-gold/35 hover:text-raw-gold sm:flex-none">
                Maybe Later
              </button>
              <button className="flex-1 border border-raw-gold/65 bg-raw-gold/90 px-4 py-2.5 text-xs font-semibold text-raw-ink hover:bg-raw-gold sm:flex-none">
                Solve More - Pay
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-5 px-1">
        <div className="w-full border border-raw-gold/20 bg-black/35 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(241,196,45,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 font-display text-sm uppercase tracking-[0.18em] text-[#EBEBEB] sm:text-base">
              2. Answer 5 launch polls
            </h3>
            <span className="shrink-0 border border-[#F1C42D]/60 bg-[#F1C42D]/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#F1C42D]">
              {dailyAnsweredCount}/{dailyPollLimit}
            </span>
          </div>
          <PollProgress currentIndex={currentPollIndex} total={polls.length} onSelect={setCurrentPollIndex} />
        </div>

        <div className="relative w-full max-w-[24rem]">
          <button
            onClick={() => setCurrentPollIndex((previous) => Math.max(0, previous - 1))}
            disabled={currentPollIndex === 0}
            className={`absolute -left-2 top-1/2 z-20 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35 md:-left-6 ${
              isLightMode
                ? "border-slate-300 bg-white/95 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.2)] hover:border-amber-400 hover:text-amber-700"
                : "border-raw-gold/35 bg-raw-black/90 text-raw-gold shadow-[0_0_24px_rgba(241,196,45,0.16)] hover:border-raw-gold/70"
            }`}
            aria-label="Previous poll"
          >
            <ChevronLeft className="size-5" />
          </button>

          {currentOptions && (
            <PremiumPollCard
              question={currentPoll.question}
              primaryOption={{
                id: currentOptions.yesOption.id,
                label: currentOptions.yesOption.text,
                votes: currentOptions.yesOption.votes,
              }}
              secondaryOption={{
                id: currentOptions.noOption.id,
                label: currentOptions.noOption.text,
                votes: currentOptions.noOption.votes,
              }}
              selectedOptionId={selectedOptionId}
              showHint={showVoteHint}
              onHintSeen={() => setHasSeenVoteHint(true)}
              onVote={(optionId) => handleVote(currentPoll.id, optionId)}
            />
          )}

          <button
            onClick={() => setCurrentPollIndex((previous) => Math.min(polls.length - 1, previous + 1))}
            disabled={currentPollIndex === polls.length - 1}
            className={`absolute -right-2 top-1/2 z-20 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35 md:-right-6 ${
              isLightMode
                ? "border-slate-300 bg-white/95 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.2)] hover:border-amber-400 hover:text-amber-700"
                : "border-raw-gold/35 bg-raw-black/90 text-raw-gold shadow-[0_0_24px_rgba(241,196,45,0.16)] hover:border-raw-gold/70"
            }`}
            aria-label="Next poll"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {hasVotedCurrent && (
          <div className="w-full border border-raw-border/35 bg-raw-black/45 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className={`text-[11px] uppercase tracking-[0.12em] ${isLightMode ? "text-slate-600" : "text-raw-silver/55"}`}>COMMENTS</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleCommentAdd();
              }}
              className={`flex items-center gap-2 border px-3 py-2 ${
                isLightMode ? "border-slate-300 bg-white/95" : "border-raw-border/35 bg-raw-black/35"
              }`}
            >
              <input
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={handleCommentKeyDown}
                placeholder="Add a comment..."
                className={`flex-1 bg-transparent text-sm focus:outline-none ${
                  isLightMode ? "text-slate-800 placeholder:text-slate-400" : "text-raw-text placeholder:text-raw-silver/35"
                }`}
              />
              <button
                type="submit"
                disabled={!commentDraft.trim()}
                className={`rounded-full border p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isLightMode
                    ? "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    : "border-raw-border/40 bg-raw-surface/40 text-raw-silver/80 hover:bg-raw-surface/55"
                }`}
                aria-label="Add comment"
              >
                <SendHorizontal className="size-3.5" />
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-2.5">
              {currentComments.length === 0 ? (
                <p className={`text-center text-xs ${isLightMode ? "text-slate-500" : "text-raw-silver/45"}`}>
                  No comments yet. Be the first.
                </p>
              ) : (
                (showAllComments ? currentComments : currentComments.slice(0, 3)).map((comment) => (
                  <article key={comment.id} className="border border-raw-border/35 bg-raw-black/50 px-3.5 py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-raw-silver/50">
                      <span>@{comment.author}</span>
                      <span>{comment.createdAt}</span>
                    </div>
                    <p className="mt-1 text-sm text-raw-silver/85">{comment.content}</p>

                    <div className="mt-2 flex flex-col gap-1.5">
                      {(comment.replies ?? []).slice(-2).map((reply) => (
                        <div key={reply.id} className="border border-raw-border/35 bg-raw-black/30 px-3 py-2">
                          <div className="flex items-center justify-between text-[10px] text-raw-silver/45">
                            <span>@{reply.author}</span>
                            <span>{reply.createdAt}</span>
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
                        value={replyDrafts[comment.id] ?? ""}
                        onChange={(event) =>
                          setReplyDrafts((previous) => ({
                            ...previous,
                            [comment.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => handleReplyKeyDown(event, comment.id)}
                        placeholder="Reply..."
                        className="flex-1 bg-transparent text-xs text-raw-text placeholder:text-raw-silver/35 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!(replyDrafts[comment.id] ?? "").trim()}
                        className="rounded-full border border-raw-border/40 px-2 py-0.5 text-[10px] text-raw-silver/80 hover:bg-raw-surface/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Reply
                      </button>
                    </form>
                  </article>
                ))
              )}
              {currentComments.length > 3 && (
                <button
                  onClick={() => setShowAllComments((prev) => !prev)}
                  className={`w-full border py-2 text-xs font-medium transition ${
                    isLightMode
                      ? "border-slate-200 text-slate-500 hover:bg-slate-100"
                      : "border-raw-border/35 text-raw-silver/55 hover:bg-raw-surface/20"
                  }`}
                >
                  {showAllComments ? "Show less" : `Show ${currentComments.length - 3} more comment${currentComments.length - 3 === 1 ? "" : "s"}`}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg text-raw-text sm:text-xl">Personality Insights</h2>
            <div className={`mt-1 h-1.5 w-28 overflow-hidden rounded-full ${isLightMode ? "bg-slate-300/70" : "bg-raw-border/40"}`}>
              <span
                className="block h-full rounded-full bg-raw-gold"
                style={{ width: `${Math.min(100, Math.max(8, (unlockedReports / insightsProgress.length) * 100))}%` }}
              />
            </div>
          </div>
          <p className={`shrink-0 text-[11px] ${isLightMode ? "text-slate-600" : "text-raw-silver/55"}`}>
            {pollsAnswered} polls answered
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {insightsProgress.map((item) => (
            <article
              key={item.id}
              className={`flex flex-col overflow-hidden rounded-xl border p-3 ${
                isLightMode ? "border-slate-300/80 bg-white/85" : "border-raw-gold/30 bg-raw-black/35 backdrop-blur-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <item.icon className={`mt-0.5 size-3.5 shrink-0 ${isLightMode ? "text-amber-700" : "text-raw-gold/85"}`} />
                  <p className="font-display text-sm leading-snug text-raw-text">{item.name}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] ${
                    isLightMode
                      ? "border-amber-600/45 bg-amber-50 text-amber-700"
                      : "border-raw-gold/35 bg-raw-gold/10 text-raw-gold/85"
                  }`}
                >
                  {item.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              <div className={`flex-1 ${!item.unlocked ? "pointer-events-none select-none blur-[2px]" : ""}`}>
                <p className={`mt-1.5 text-[11px] leading-relaxed ${isLightMode ? "text-slate-600" : "text-raw-silver/55"}`}>
                  {item.description}
                </p>
                <button
                  disabled={!item.unlocked}
                  className={`mt-3 w-full rounded-lg border px-2 py-1.5 text-[11px] transition ${
                    item.unlocked
                      ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20"
                      : isLightMode
                        ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500"
                        : "cursor-not-allowed border-raw-border/40 bg-raw-black/35 text-raw-silver/45"
                  }`}
                >
                  {item.unlocked ? "Open report" : "Preview locked"}
                </button>
              </div>

              {!item.unlocked && (
                <div className="-mx-3 -mb-3 mt-2.5 flex items-center justify-between border-t border-dashed border-raw-border/40 px-2.5 py-1.5 text-[9px]">
                  <span className={isLightMode ? "text-slate-600" : "text-raw-silver/55"}>
                    {item.requiredPolls} polls req.
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 ${
                      isLightMode
                        ? "border-amber-600/40 bg-amber-100 text-amber-700"
                        : "border-raw-gold/40 bg-raw-gold/10 text-raw-gold/85"
                    }`}
                  >
                    <Lock className="size-2" />
                    {item.unlockPrice > 0 ? `$${item.unlockPrice}` : "Free"}
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>

        <p className={`text-center text-xs ${isLightMode ? "text-slate-500" : "text-raw-silver/45"}`}>
          Answer more polls to unlock deeper reports.
        </p>
      </section>
    </div>
  );
}
