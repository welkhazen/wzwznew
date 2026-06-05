import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/providers/useTheme";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { fetchPolls } from "@/lib/api/polls";
import { POLL_QUESTION_SEEDS } from "@/features/polls/pollQuestions";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

interface PollItem {
  id?: string;
  question: string;
  yesPercent: number;
  noPercent: number;
}

const FALLBACK: PollItem[] = POLL_QUESTION_SEEDS.slice(0, 4).map((s) => ({
  question: s.question,
  yesPercent: Math.round((s.yesVotes / (s.yesVotes + s.noVotes)) * 100),
  noPercent: Math.round((s.noVotes / (s.yesVotes + s.noVotes)) * 100),
}));

const SEED_COMMENTS: Record<number, string[]> = {
  0: [
    "100% — I drop all the masks when I'm alone",
    "That's basically the only time I feel real",
    "Honestly yes, social pressure is exhausting",
    "Wish I could feel that way around people too",
    "Not even close to the same person in public",
  ],
  1: [
    "Depends on the values, but probably yes",
    "Already looking for something like this",
    "The right community genuinely changes everything",
    "Most communities talk values but don't live them",
    "Yes, if it's honest and not performative",
  ],
  2: [
    "Absolutely — a static teacher stops being relevant",
    "The best ones I had were still figuring things out",
    "Growth goes both ways or it's just a transaction",
    "Nothing worse than someone who stopped learning",
    "Yes, that vulnerability builds real trust",
  ],
};

const COMMENT_CLIP =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

interface LandingPollsSectionProps {
  onSignupClick: () => void;
}

export function LandingPollsSection({ onSignupClick }: LandingPollsSectionProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const sectionRef = useTrackSectionView("polls");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "yes" | "no">>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [extraComments, setExtraComments] = useState<Record<number, string[]>>({});
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const commentInputWrapperRef = useRef<HTMLDivElement>(null);
  useKeyboardOffset(commentInputWrapperRef);

  const { data: fetchedPolls } = useQuery({
    queryKey: ["landing-polls-section"],
    queryFn: async () => {
      const polls = await fetchPolls(4);
      if (polls.length === 0) return null;
      return polls.slice(0, 4).map((poll) => {
        const yesVotes = poll.options.find((o) => o.text.toLowerCase() === "yes")?.votes ?? 0;
        const noVotes = poll.options.find((o) => o.text.toLowerCase() === "no")?.votes ?? 0;
        const totalVotes = yesVotes + noVotes;
        return {
          id: poll.id,
          question: poll.question,
          yesPercent: totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 50,
          noPercent: totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 50,
        } as PollItem;
      });
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const polls: PollItem[] = fetchedPolls ?? FALLBACK;
  const total = polls.length;
  const canPrev = index > 0;
  const canNext = index < total - 1;
  const currentPoll = polls[index];
  const selected = answers[index];
  const isLastPoll = index === total - 1;
  const showComments = !!selected && !isLastPoll;
  const allComments = [...(SEED_COMMENTS[index] ?? []), ...(extraComments[index] ?? [])];

  const handleAnswer = useCallback(
    (choice: "yes" | "no") => {
      setAnswers((prev) => ({ ...prev, [index]: choice }));
    },
    [index]
  );

  const handleSubmitComment = () => {
    const text = (commentInputs[index] ?? "").trim();
    if (!text) return;
    setExtraComments((prev) => ({ ...prev, [index]: [...(prev[index] ?? []), text] }));
    setCommentInputs((prev) => ({ ...prev, [index]: "" }));
    setTimeout(() => {
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  return (
    <LandingSectionShell
      id="landing-polls"
      sectionRef={sectionRef as React.Ref<HTMLElement>}
      title="What does the community think?"
      description="Answer live polls — see how your views compare with others, anonymously."
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-white/35" />
            <p className="text-[12px] font-medium tracking-[0.42em] text-white/85">
              {index + 1} / {total}
            </p>
            <span className="h-px w-7 bg-white/35" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-[3px] transition-all ${
                  i === index
                    ? "w-9 bg-raw-gold shadow-[0_0_8px_rgb(var(--raw-accent)/0.7)]"
                    : "w-6 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => canPrev && setIndex((i) => i - 1)}
            disabled={!canPrev}
            aria-label="Previous question"
            className="absolute left-0 z-10 flex h-11 w-11 -translate-x-3 items-center justify-center rounded-full border border-raw-gold/55 bg-black/75 text-raw-gold shadow-none transition hover:bg-black/75 hover:shadow-none focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-25 sm:-translate-x-7"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              className="mx-auto w-full max-w-[22rem]"
            >
              <PremiumPollCard
                question={currentPoll.question}
                primaryOption={{ id: "yes", label: "Yes", votes: currentPoll.yesPercent }}
                secondaryOption={{ id: "no", label: "No", votes: currentPoll.noPercent }}
                selectedOptionId={selected ?? null}
                showHint
                onVote={(optionId) => handleAnswer(optionId === "yes" ? "yes" : "no")}
              />
              {isLastPoll && selected && (
                <div
                  className="absolute left-1/2 top-20 z-20 w-[min(19rem,calc(100%-2rem))] -translate-x-1/2 p-[1px]"
                  style={{
                    clipPath: COMMENT_CLIP,
                    background:
                      "linear-gradient(160deg, rgb(var(--raw-accent) / 0.35) 0%, rgb(var(--raw-accent) / 0.08) 50%, rgb(var(--raw-accent) / 0.25) 100%)",
                    boxShadow: "0 8px 32px rgb(var(--raw-accent) / 0.1)",
                  }}
                >
                  <div
                    className="px-4 py-4 text-center"
                    style={{
                      clipPath: COMMENT_CLIP,
                      background: isLight
                        ? "linear-gradient(165deg, #fdfaf0 0%, #f5f0e0 100%)"
                        : "linear-gradient(165deg, #111111 0%, #070707 100%)",
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-raw-gold/70">
                      Want to answer more?
                    </p>
                    <p className={`mx-auto mt-2 max-w-[220px] text-[12px] leading-relaxed ${isLight ? "text-stone-600" : "text-white/55"}`}>
                      Continue to onboarding to answer more questions and keep revealing how your views compare.
                    </p>
                    <button
                      type="button"
                      onClick={onSignupClick}
                      className="mt-4 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-5 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-raw-gold/85 transition hover:bg-raw-gold/15"
                    >
                      Continue to onboarding
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={() => canNext && setIndex((i) => i + 1)}
            disabled={!canNext}
            aria-label="Next question"
            className="absolute right-0 z-10 flex h-11 w-11 translate-x-3 items-center justify-center rounded-full border border-raw-gold/55 bg-black/75 text-raw-gold shadow-none transition hover:bg-black/75 hover:shadow-none focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-25 sm:translate-x-7"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mx-auto w-full max-w-[330px]">
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
                  className="h-px origin-left bg-gradient-to-r from-transparent via-raw-gold/55 to-transparent"
                  style={{ boxShadow: "0 0 8px rgb(var(--raw-accent) / 0.4)" }}
                />

                <div
                  className="p-[1px]"
                  style={{
                    clipPath: COMMENT_CLIP,
                    background:
                      "linear-gradient(160deg, rgb(var(--raw-accent) / 0.35) 0%, rgb(var(--raw-accent) / 0.08) 50%, rgb(var(--raw-accent) / 0.25) 100%)",
                    boxShadow: "0 8px 32px rgb(var(--raw-accent) / 0.1)",
                  }}
                >
                  <div
                    className="overflow-hidden px-4 py-4"
                    style={{
                      clipPath: COMMENT_CLIP,
                      background: isLight
                        ? "linear-gradient(165deg, #fdfaf0 0%, #f5f0e0 100%)"
                        : "linear-gradient(165deg, #111111 0%, #070707 100%)",
                    }}
                  >
                    {!isLastPoll && (
                      <>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-raw-gold/70">
                      Anonymous Comments
                    </p>

                    <div ref={commentsContainerRef} className="max-h-36 space-y-2 overflow-y-auto pr-1">
                      {allComments.map((comment, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-raw-gold/15 text-[9px] font-bold text-raw-gold/70">
                            ?
                          </span>
                          <p className={`text-[12px] leading-[1.4] ${isLight ? "text-stone-600" : "text-white/55"}`}>
                            {comment}
                          </p>
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>

                    <div ref={commentInputWrapperRef} className="mt-3 flex items-center gap-2 pr-1">
                      <input
                        type="text"
                        placeholder="Add anonymous comment…"
                        value={commentInputs[index] ?? ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [index]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmitComment();
                          }
                        }}
                        className={`min-w-0 flex-1 rounded px-3 py-1.5 text-[12px] outline-none transition ${
                          isLight
                            ? "border border-black/10 bg-black/5 text-stone-700 placeholder:text-stone-400 focus:border-raw-gold/50"
                            : "border border-white/10 bg-white/5 text-white/70 placeholder:text-white/25 focus:border-raw-gold/40"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleSubmitComment}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-raw-gold/30 bg-raw-gold/10 text-raw-gold/70 transition hover:bg-raw-gold/20"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LandingSectionShell>
  );
}
