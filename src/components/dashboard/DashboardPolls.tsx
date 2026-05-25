import { useEffect, useMemo, useRef, useState } from "react";
import type { Poll } from "@/store/useRawStore";
import { useTheme } from "@/providers/useTheme";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";
import { ShareButton } from "@/components/ui/share-button";
import { addPollComment, fetchPollComments } from "@/utils/supabasePolls";
import { isNoPollOption, isYesPollOption } from "@/lib/polls/normalizePollOptionText";
import {
  getPollShareCode,
  LEGACY_POLL_SHARE_PARAM,
  POLL_SHARE_PARAM,
  resolvePollShareCode,
} from "@/lib/pollShare";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Copy,
  Facebook,
  Link2,
  Instagram,
  MessageCircle,
  SendHorizontal,
  Share2,
  Smartphone,
  Users,
} from "lucide-react";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function generatePollImage(question: string, opt1: string, opt2: string, url: string): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = "rgba(235,235,235,0.07)";
  for (let x = 18; x < W; x += 18) {
    for (let y = 18; y < H; y += 18) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Gold top accent
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, "rgba(241,196,45,0)");
  topGrad.addColorStop(0.3, "#F1C42D");
  topGrad.addColorStop(0.7, "#F1C42D");
  topGrad.addColorStop(1, "rgba(241,196,45,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 6);

  // "raW" brand
  ctx.fillStyle = "#F1C42D";
  ctx.font = "bold 90px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("raW", W / 2, 170);

  ctx.fillStyle = "rgba(241,196,45,0.6)";
  ctx.font = "38px Arial, sans-serif";
  ctx.fillText("Community Poll", W / 2, 255);

  // Divider
  const divGrad = ctx.createLinearGradient(120, 0, W - 120, 0);
  divGrad.addColorStop(0, "rgba(241,196,45,0)");
  divGrad.addColorStop(0.3, "rgba(241,196,45,0.4)");
  divGrad.addColorStop(0.7, "rgba(241,196,45,0.4)");
  divGrad.addColorStop(1, "rgba(241,196,45,0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 310);
  ctx.lineTo(W - 120, 310);
  ctx.stroke();

  // Question
  ctx.fillStyle = "#EBEBEB";
  ctx.font = "bold 64px Arial, sans-serif";
  ctx.textAlign = "center";
  const qLines = wrapText(ctx, question, 860);
  const qStartY = 520 - ((qLines.length - 1) * 84) / 2;
  qLines.forEach((line, i) => ctx.fillText(line, W / 2, qStartY + i * 84));

  const optY = qStartY + qLines.length * 84 + 100;
  const btnW = 450, btnH = 130, gap = 36;
  const btn1X = (W - btnW * 2 - gap) / 2;
  const btn2X = btn1X + btnW + gap;

  // Option 1 (neutral/silver)
  ctx.fillStyle = "rgba(180,180,180,0.15)";
  ctx.strokeStyle = "rgba(180,180,180,0.55)";
  ctx.lineWidth = 3;
  roundRect(ctx, btn1X, optY, btnW, btnH, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#EBEBEB";
  ctx.font = "bold 52px Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(opt1, btn1X + btnW / 2, optY + btnH / 2);

  // Option 2 (gold)
  ctx.fillStyle = "rgba(241,196,45,0.15)";
  ctx.strokeStyle = "rgba(241,196,45,0.8)";
  roundRect(ctx, btn2X, optY, btnW, btnH, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#F1C42D";
  ctx.fillText(opt2, btn2X + btnW / 2, optY + btnH / 2);

  // "Vote anonymously" text
  ctx.fillStyle = "rgba(235,235,235,0.35)";
  ctx.font = "36px Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Vote anonymously — see what everyone thinks", W / 2, optY + btnH + 80);

  // URL at bottom
  ctx.fillStyle = "rgba(241,196,45,0.55)";
  ctx.font = "38px Arial, sans-serif";
  ctx.fillText(url, W / 2, H - 110);

  // Gold bottom accent
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, H - 6, W, 6);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

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

function optionPercent(optionVotes: number, totalVotes: number): number {
  if (totalVotes <= 0) return 0;
  return Math.round((optionVotes / totalVotes) * 100);
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

function buildPollShareText(poll: Poll): string {
  return `Vote anonymously on raW: ${poll.question}`;
}

function buildPollShareUrl(pollId: string): string {
  const url = new URL(window.location.href);
  url.pathname = "/dashboard";
  url.search = "";
  url.searchParams.set(POLL_SHARE_PARAM, getPollShareCode(pollId));
  return url.toString();
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
  const [lockedPollId, setLockedPollId] = useState<string | null>(null);
  const [sharedPollId, setSharedPollId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [expandedSharePollId, setExpandedSharePollId] = useState<string | null>(null);

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
  const answeredPollHistory = useMemo(
    () => answeredPolls.slice().reverse(),
    [answeredPolls]
  );

  // Once the daily limit is hit, show today's answered polls (capped at dailyPollLimit).
  // While still under the limit, show unseen polls capped at the daily limit so the gate
  // triggers after the batch — not after all 100+ polls.
  const displayPolls = isDailyPollLimitReached && answeredPolls.length > 0
    ? answeredPolls.slice(0, dailyPollLimit)
    : unseenPolls.length > 0
      ? unseenPolls.slice(0, dailyPollLimit)
      : answeredPolls.length > 0
        ? answeredPolls
        : polls;

  useEffect(() => {
    if (currentPollIndex >= displayPolls.length && displayPolls.length > 0) {
      setCurrentPollIndex(displayPolls.length - 1);
    }
  }, [currentPollIndex, displayPolls.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const shareCode = searchParams.get(POLL_SHARE_PARAM);
    const legacyPollId = searchParams.get(LEGACY_POLL_SHARE_PARAM);
    const nextSharedPollId = resolvePollShareCode(polls, shareCode) ?? legacyPollId;
    setSharedPollId(nextSharedPollId);
    if (!nextSharedPollId) return;

    if (legacyPollId || searchParams.has(LEGACY_POLL_SHARE_PARAM)) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.search = "";
      cleanUrl.searchParams.set(POLL_SHARE_PARAM, getPollShareCode(nextSharedPollId));
      window.history.replaceState(null, "", cleanUrl.toString());
    }

    const displayIndex = displayPolls.findIndex((poll) => poll.id === nextSharedPollId);
    if (displayIndex >= 0) {
      setLockedPollId(null);
      setCurrentPollIndex(displayIndex);
      return;
    }

    if (polls.some((poll) => poll.id === nextSharedPollId)) {
      setLockedPollId(nextSharedPollId);
    }
  }, [displayPolls, polls]);


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
  const showSharedPollAnswerPrompt = Boolean(sharedPollId && currentPoll?.id === sharedPollId && hasVotedCurrent);
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

  const copyShareLink = async (poll: Poll) => {
    const text = `${buildPollShareText(poll)}\n${buildPollShareUrl(poll.id)}`;
    await navigator.clipboard?.writeText(text);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1600);
  };

  const handleShare = async (poll: Poll) => {
    const shareData = {
      title: "raW poll",
      text: buildPollShareText(poll),
      url: buildPollShareUrl(poll.id),
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await copyShareLink(poll);
  };

  const handleFacebookShare = (poll: Poll) => {
    const url = encodeURIComponent(buildPollShareUrl(poll.id));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
  };

  const handleWhatsAppShare = (poll: Poll) => {
    const text = encodeURIComponent(`${buildPollShareText(poll)}\n${buildPollShareUrl(poll.id)}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleInstagramShare = async (poll: Poll) => {
    const resolved = resolveYesNoOptions(poll);
    const opt1 = resolved?.yesOption.text ?? poll.options[0]?.text ?? "";
    const opt2 = resolved?.noOption.text ?? poll.options[1]?.text ?? "";
    const shareUrl = buildPollShareUrl(poll.id);

    try {
      const blob = await generatePollImage(poll.question, opt1, opt2, shareUrl);
      const file = new File([blob], "raw-poll.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "raW Poll", text: poll.question });
        return;
      }
      // Fallback: download the image
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "raw-poll.png";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      await handleShare(poll);
    }
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

          <div className="mt-4 flex justify-center">
            <ShareButton
              links={[
                { icon: Smartphone, onClick: () => handleWhatsAppShare(currentPoll), label: "Share on WhatsApp" },
                { icon: Instagram, onClick: () => handleInstagramShare(currentPoll), label: "Share on Instagram" },
                { icon: Facebook, onClick: () => handleFacebookShare(currentPoll), label: "Share on Facebook" },
                { icon: SendHorizontal, onClick: () => handleShare(currentPoll), label: "More apps" },
                { icon: Link2, onClick: () => copyShareLink(currentPoll), label: "Copy link" },
              ]}
              className="w-full border-raw-gold/45 bg-raw-gold/10 text-[11px] font-semibold uppercase tracking-[0.16em] text-raw-gold hover:bg-raw-gold/15 dark:border-raw-gold/45 dark:bg-raw-gold/10 dark:text-raw-gold dark:hover:bg-raw-gold/15"
            >
              <Share2 className="size-3.5" />
              Share
            </ShareButton>
          </div>

          {shareCopied && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-raw-gold/75">
              <Check className="size-3" />
              Copied share text
            </p>
          )}

          {showSharedPollAnswerPrompt && (
            <div className="mt-3 border border-raw-gold/30 bg-raw-gold/10 px-4 py-3 text-center shadow-[0_0_24px_rgba(241,196,45,0.08)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-raw-gold/80">
                Answer saved
              </p>
              <p className="mt-1 text-xs leading-relaxed text-raw-silver/65">
                Sign in to answer more polls, keep your streak, and unlock your profile rewards.
              </p>
            </div>
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

      <section className="border border-raw-border/30 bg-raw-black/35 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-raw-gold/65">Answer history</p>
            <h2 className="mt-1 font-display text-base tracking-wide text-raw-text">Polls you answered</h2>
          </div>
          <span className="shrink-0 border border-raw-gold/35 bg-raw-gold/10 px-3 py-1 text-[11px] text-raw-gold/80">
            {answeredPollHistory.length}
          </span>
        </div>

        {answeredPollHistory.length === 0 ? (
          <p className="mt-4 text-sm text-raw-silver/45">
            Answer a poll and it will appear here.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {answeredPollHistory.map((poll) => {
              const selectedId = answerHistory[poll.id];
              const selectedOption = poll.options.find((option) => option.id === selectedId);
              const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
              const percent = selectedOption ? optionPercent(selectedOption.votes, totalVotes) : 0;

              return (
                <article
                  key={poll.id}
                  className="border border-raw-border/25 bg-raw-surface/20 p-3 sm:p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-relaxed text-raw-text">
                        {poll.question}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-raw-silver/45">
                        <span className="border border-raw-gold/25 bg-raw-gold/10 px-2 py-1 text-raw-gold/80">
                          You answered: {selectedOption?.text ?? "Unknown"}
                        </span>
                        <span>{percent}% picked this</span>
                        <span>{totalVotes.toLocaleString()} votes</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLockedPollId(poll.id)}
                      className="shrink-0 border border-raw-border/35 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-raw-silver/65 transition hover:border-raw-gold/45 hover:text-raw-gold"
                    >
                      Review
                    </button>
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedSharePollId((current) => (current === poll.id ? null : poll.id))}
                        className="inline-flex items-center justify-center gap-2 border border-raw-border/35 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-raw-silver/65 transition hover:border-raw-gold/45 hover:text-raw-gold"
                        aria-expanded={expandedSharePollId === poll.id}
                      >
                        <Copy className="size-3" />
                        Share
                      </button>
                    </div>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedSharePollId === poll.id ? "mt-3 max-h-16 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleWhatsAppShare(poll)}
                        className="border border-raw-border/35 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-raw-silver/70 transition hover:border-raw-gold/45 hover:text-raw-gold"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstagramShare(poll)}
                        className="border border-raw-border/35 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-raw-silver/70 transition hover:border-raw-gold/45 hover:text-raw-gold"
                      >
                        Instagram
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFacebookShare(poll)}
                        className="border border-raw-border/35 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-raw-silver/70 transition hover:border-raw-gold/45 hover:text-raw-gold"
                      >
                        Facebook
                      </button>
                      <button
                        type="button"
                        onClick={() => copyShareLink(poll)}
                        className="inline-flex items-center gap-1.5 border border-raw-border/35 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-raw-silver/70 transition hover:border-raw-gold/45 hover:text-raw-gold"
                      >
                        <Copy className="size-3" />
                        Copy link
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
