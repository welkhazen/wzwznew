import { useEffect, useMemo, useRef, useState } from "react";
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
  Coins,
  Fingerprint,
  Lock,
  Map,
  MessageCircle,
  SendHorizontal,
  Users,
  WandSparkles,
} from "lucide-react";

function getNextUnlockTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(22, 0, 0, 0);
  return tomorrow.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " at 10:00 PM";
}

interface PollProgressProps {
  currentIndex: number;
  total: number;
  answeredCount: number;
  dailyLimit: number;
  onSelect: (index: number) => void;
}

function PollProgress({ currentIndex, total, answeredCount, dailyLimit, onSelect }: PollProgressProps) {
  return (
    <div className="mt-3 text-center">
      <p className="font-display text-[12px] tracking-[0.32em] text-raw-silver/70">{answeredCount} / {dailyLimit}</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-1.5 rounded-none transition-all ${
              index === currentIndex
                ? "w-7 bg-[#F1C42D] shadow-[0_0_10px_rgba(241,196,45,0.45)]"
                : "w-4 bg-raw-border/60"
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
}

interface DashboardPollsProps {
  polls: Poll[];
  votedPolls: Set<string>;
  userId: string;
  username: string;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  isDailyPollLimitReached: boolean;
  tokenBalance: number;
  onUnlockExtra: () => void;
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

function readStoredAnswerHistory(storageKey: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function DashboardPolls({
  polls,
  votedPolls,
  userId,
  username,
  dailyAnsweredCount,
  dailyPollLimit,
  isDailyPollLimitReached,
  tokenBalance,
  onUnlockExtra,
  onVote,
}: DashboardPollsProps) {
  const { mode } = useTheme();
  const isLightMode = mode === "light";
  const answersStorageKey = `raw.poll-history.answers.${userId}`;
  const commentsStorageKey = `raw.poll-history.comments.${userId}`;
  const voteHintStorageKey = `raw.polls.vote-hint-seen.${userId}`;
  const [loadedAnswersStorageKey, setLoadedAnswersStorageKey] = useState(answersStorageKey);
  const [answerHistory, setAnswerHistory] = useState<Record<string, string>>(() => readStoredAnswerHistory(answersStorageKey));
  const [historyComments, setHistoryComments] = useState<Record<string, PollHistoryComment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [hasSeenVoteHint, setHasSeenVoteHint] = useState(false);
  const [lockedInsightMessage, setLockedInsightMessage] = useState<string | null>(null);
  const [lockedPollId, setLockedPollId] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadedAnswersStorageKey(answersStorageKey);
    setAnswerHistory(readStoredAnswerHistory(answersStorageKey));
    setCurrentPollIndex(0);
  }, [answersStorageKey]);

  useEffect(() => {
    try {
      const rawComments = window.localStorage.getItem(commentsStorageKey);
      const parsedComments = rawComments ? (JSON.parse(rawComments) as Record<string, PollHistoryComment[]>) : {};
      setHistoryComments(parsedComments && typeof parsedComments === "object" ? parsedComments : {});
    } catch {
      setHistoryComments({});
    }
  }, [commentsStorageKey]);

  useEffect(() => {
    if (loadedAnswersStorageKey !== answersStorageKey) return;
    window.localStorage.setItem(answersStorageKey, JSON.stringify(answerHistory));
  }, [answerHistory, answersStorageKey, loadedAnswersStorageKey]);

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

  const unseenPolls = useMemo(
    () => polls.filter((p) => !answerHistory[p.id]),
    [polls, answerHistory]
  );

  const answeredPolls = useMemo(
    () => polls.filter((p) => answerHistory[p.id]),
    [polls, answerHistory]
  );

  // Once the daily limit is hit, show today's answered polls (capped at dailyPollLimit).
  // While still under the limit, show unseen polls (or answered ones if nothing left to answer).
  const displayPolls = isDailyPollLimitReached && answeredPolls.length > 0
    ? answeredPolls.slice(0, dailyPollLimit)
    : unseenPolls.length > 0
      ? unseenPolls
      : answeredPolls.length > 0
        ? answeredPolls
        : polls;

  useEffect(() => {
    if (currentPollIndex >= displayPolls.length && displayPolls.length > 0) {
      setCurrentPollIndex(displayPolls.length - 1);
    }
  }, [currentPollIndex, displayPolls.length]);


  const rawCurrentPoll = lockedPollId
    ? (polls.find((p) => p.id === lockedPollId) ?? displayPolls[currentPollIndex])
    : displayPolls[currentPollIndex];

  const currentPoll = rawCurrentPoll
    ? { ...rawCurrentPoll, options: rawCurrentPoll.options.slice(0, 2) }
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
            content: comment.body,
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
  const progressIndex = isDailyPollLimitReached
    ? Math.min(currentPollIndex, dailyPollLimit - 1)
    : Math.min(dailyAnsweredCount + currentPollIndex, dailyPollLimit - 1);

  const totalResponses = useMemo(
    () => polls.reduce((sum, poll) => sum + poll.options.reduce((acc, option) => acc + option.votes, 0), 0),
    [polls]
  );

  const pollsAnswered = Math.max(votedPolls.size, Object.keys(answerHistory).length);

  const insightsProgress = [
    {
      id: "myers-briggs",
      name: "Myers-Briggs",
      icon: Brain,
      description: "Discover your personality type across 4 key dimensions of how you see the world.",
      requiredPolls: 10,
      tokenPrice: 10,
      unlocked: false,
    },
    {
      id: "big-five-profile",
      name: "Big Five Profile",
      icon: Fingerprint,
      description:
        "Measure your openness, conscientiousness, extraversion, agreeableness, and emotional range.",
      requiredPolls: 30,
      tokenPrice: 30,
      unlocked: false,
    },
    {
      id: "emotional-intelligence",
      name: "Emotional Intelligence",
      icon: CircleGauge,
      description:
        "Understand how you process emotions, empathy, and interpersonal cues under pressure.",
      requiredPolls: 70,
      tokenPrice: 70,
      unlocked: false,
    },
    {
      id: "shadow-self",
      name: "Shadow Self",
      icon: WandSparkles,
      description:
        "Reveal hidden patterns, blind spots, and traits that surface in difficult moments.",
      requiredPolls: 100,
      tokenPrice: 100,
      unlocked: false,
    },
    {
      id: "attachment-style",
      name: "Attachment Style",
      icon: BookOpen,
      description: "Understand your patterns in relationships and emotional bonding with others.",
      requiredPolls: 150,
      tokenPrice: 150,
      unlocked: false,
    },
    {
      id: "cognitive-bias-map",
      name: "Cognitive Bias Map",
      icon: Map,
      description: "Identify the mental shortcuts and biases that shape your decisions and thinking.",
      requiredPolls: 200,
      tokenPrice: 200,
      unlocked: false,
    },
  ];

  const unlockedReports = insightsProgress.filter((item) => item.unlocked).length;
  const showMorePollsPaywall = isDailyPollLimitReached && dailyPollLimit > 0;

  const handleVote = (pollId: string, optionId: string) => {
    setHasSeenVoteHint(true);
    setLockedPollId(pollId);

    setAnswerHistory((previous) => ({
      ...previous,
      [pollId]: optionId,
    }));

    if (!votedPolls.has(pollId)) {
      onVote(pollId, optionId);
    }
  };

  const handleInsightClick = (item: (typeof insightsProgress)[number]) => {
    if (item.unlocked) return;

    const remainingPolls = Math.max(0, item.requiredPolls - pollsAnswered);
    const requirements = [
      `Can only be unlocked after ${item.requiredPolls} polls answered.`,
      remainingPolls > 0 ? `Answer ${remainingPolls} more polls to generate this report.` : "You have enough poll data, but generation is not enabled yet.",
      `Generation price: ${item.tokenPrice} tokens.`,
    ];

    if (tokenBalance < item.tokenPrice) {
      requirements.push(`Current balance: ${tokenBalance} tokens.`);
    }

    setLockedInsightMessage(requirements.join(" "));
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
      [currentPoll.id]: [...(previous[currentPoll.id] ?? []), nextComment],
    }));

    setCommentDraft("");
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

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


  if (!currentPoll) {
    return (
      <div className="border border-raw-border/30 bg-raw-black/30 p-6 text-center text-sm text-raw-silver/55">
        No polls available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {lockedInsightMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setLockedInsightMessage(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="locked-insight-title"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm border p-5 shadow-[0_18px_70px_rgba(0,0,0,0.45)] ${
              isLightMode ? "border-slate-300 bg-white text-slate-900" : "border-raw-gold/35 bg-raw-black text-raw-text"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex size-8 items-center justify-center rounded-full border ${
                isLightMode ? "border-amber-600/40 bg-amber-100 text-amber-700" : "border-raw-gold/45 bg-raw-gold/10 text-raw-gold"
              }`}>
                <Lock className="size-4" />
              </span>
              <div className="min-w-0">
                <h3 id="locked-insight-title" className="font-display text-base">Insight locked</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isLightMode ? "text-slate-600" : "text-raw-silver/65"}`}>
                  {lockedInsightMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLockedInsightMessage(null)}
              className="mt-5 w-full border border-raw-gold/55 bg-raw-gold px-4 py-2.5 text-xs font-semibold text-raw-ink hover:bg-raw-gold/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}

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
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-raw-gold/80">Daily Limit Reached</p>
              <h3 className="mt-1 font-display text-lg text-raw-text sm:text-xl">You answered all {dailyPollLimit} polls for today.</h3>
              <p className="mt-1.5 text-xs text-raw-silver/60 sm:text-sm">
                Next 7 polls unlock on <span className="text-raw-gold/80">{getNextUnlockTime()}</span>.
              </p>
              <p className="mt-1 text-xs text-raw-gold/75 sm:text-sm">
                Use 10 tokens to unlock 7 more polls now.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1.5 text-[11px] text-raw-silver/50">
                <Coins className="size-3.5 text-raw-gold/60" />
                <span>Your balance: <span className="text-raw-gold/80 font-medium">{tokenBalance} tokens</span></span>
              </div>
              <button
                onClick={onUnlockExtra}
                disabled={tokenBalance < 10}
                className="mt-1 flex items-center justify-center gap-2 border border-raw-gold/65 bg-raw-gold/90 px-4 py-2.5 text-xs font-semibold text-raw-ink hover:bg-raw-gold disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:ml-auto"
              >
                <Coins className="size-3.5" />
                {tokenBalance < 10 ? "Need 10 tokens to unlock 7 more" : "Unlock 7 more polls - 10 tokens"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-5 px-1">
        <div className="w-full border border-raw-gold/20 bg-black/35 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(241,196,45,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 font-display text-sm uppercase tracking-[0.18em] text-[#EBEBEB] sm:text-base">
              2. Answer 7 polls
            </h3>
            <span className="shrink-0 border border-[#F1C42D]/60 bg-[#F1C42D]/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#F1C42D]">
              {dailyAnsweredCount}/{dailyPollLimit}
            </span>
          </div>
          <PollProgress currentIndex={progressIndex} total={dailyPollLimit} answeredCount={dailyAnsweredCount} dailyLimit={dailyPollLimit} onSelect={setCurrentPollIndex} />
        </div>

        <div className="relative w-full max-w-[24rem]">
          <button
            onClick={() => { setLockedPollId(null); setCurrentPollIndex((previous) => Math.max(0, previous - 1)); }}
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
            onClick={() => { setLockedPollId(null); setCurrentPollIndex((previous) => Math.min(displayPolls.length - 1, previous + 1)); }}
            disabled={currentPollIndex === displayPolls.length - 1}
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

            <div className="mb-3 max-h-64 overflow-y-auto flex flex-col gap-2.5 pr-1">
              {currentComments.length === 0 ? (
                <p className={`text-center text-xs ${isLightMode ? "text-slate-500" : "text-raw-silver/45"}`}>
                  No comments yet. Be the first.
                </p>
              ) : (
                currentComments.map((comment) => (
                  <article key={comment.id} className="border border-raw-border/35 bg-raw-black/50 px-3.5 py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-raw-silver/50">
                      <span>@{comment.author}</span>
                      <span>{comment.createdAt}</span>
                    </div>
                    <p className="mt-1 text-sm text-raw-silver/85">{comment.content}</p>
                  </article>
                ))
              )}
              <div ref={commentsEndRef} />
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
              role="button"
              tabIndex={0}
              onClick={() => handleInsightClick(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleInsightClick(item);
                }
              }}
              className={`flex flex-col overflow-hidden rounded-xl border p-3 ${
                isLightMode ? "border-slate-300/80 bg-white/85" : "border-raw-gold/30 bg-raw-black/35 backdrop-blur-sm"
              } ${item.unlocked ? "" : "cursor-pointer"}`}
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
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleInsightClick(item);
                  }}
                  className={`mt-3 w-full rounded-lg border px-2 py-1.5 text-[11px] transition ${
                    item.unlocked
                      ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20"
                      : isLightMode
                        ? "border-slate-300 bg-slate-100 text-slate-500 hover:border-amber-500/60 hover:text-amber-700"
                        : "border-raw-border/40 bg-raw-black/35 text-raw-silver/45 hover:border-raw-gold/45 hover:text-raw-gold/80"
                  }`}
                >
                  {item.unlocked ? "Open report" : "Generate report"}
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
                    {item.tokenPrice} tokens
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
