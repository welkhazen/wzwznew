import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { POLL_QUESTION_SEEDS } from "@/features/polls/pollQuestions";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";

interface PollData {
  id?: string;
  question: string;
  yesPercent: number;
  noPercent: number;
}

interface PollShowcaseProps {
  initialOpen?: boolean;
  onResolved?: () => void;
}

const FALLBACK_POLLS: PollData[] = POLL_QUESTION_SEEDS.map((s) => ({
  question: s.question,
  yesPercent: Math.round((s.yesVotes / (s.yesVotes + s.noVotes)) * 100),
  noPercent: Math.round((s.noVotes / (s.yesVotes + s.noVotes)) * 100),
}));

export function PollShowcase({ initialOpen = false, onResolved }: PollShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);
  const [selectedByPoll, setSelectedByPoll] = useState<Record<number, "yes" | "no">>({});

  const POLLS: PollData[] = FALLBACK_POLLS;

  useEffect(() => {
    setMounted(true);
    const handler = () => setOpen(true);
    window.addEventListener("open-poll-showcase", handler);
    return () => window.removeEventListener("open-poll-showcase", handler);
  }, []);

  const closeShowcase = useCallback(() => {
    setOpen(false);
    onResolved?.();
  }, [onResolved]);

  const currentPoll = POLLS[index];
  const selected = selectedByPoll[index] ?? null;

  const handleVote = useCallback(
    (optionId: string) => {
      setSelectedByPoll((prev) => ({
        ...prev,
        [index]: optionId === "yes" ? "yes" : "no",
      }));
    },
    [index]
  );

  if (!mounted || !open) return null;

  const total = POLLS.length;
  const isLastPoll = index === total - 1;
  const canPrev = index > 0;
  const canNext = index < total - 1;

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 px-4 backdrop-blur-md overflow-y-auto py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(217,217,217,0.06) 1px, transparent 0)",
        backgroundSize: "14px 14px",
      }}
      onClick={closeShowcase}
    >
      <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={closeShowcase}
          aria-label="Close poll preview"
          className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Counter and progress dashes */}
        <div className="mb-4 flex flex-col items-center">
          <div className="flex items-center gap-3 rounded-full bg-black/55 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-px w-7 bg-white/60" />
            <p className="text-[12px] font-medium tracking-[0.42em] text-white">
              {index + 1} / {total}
            </p>
            <span className="h-px w-7 bg-white/60" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-[3px] transition-all ${
                  i === index
                    ? "w-9 bg-raw-gold shadow-[0_0_8px_rgb(var(--raw-accent)/0.7)]"
                    : "w-6 bg-black/30"
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
              style={{ position: "relative", width: "100%" }}
              className="w-full max-w-[330px] mx-auto"
            >
              <PremiumPollCard
                question={currentPoll.question}
                primaryOption={{ id: "yes", label: "Yes", votes: currentPoll.yesPercent }}
                secondaryOption={{ id: "no", label: "No", votes: currentPoll.noPercent }}
                selectedOptionId={selected}
                showHint
                onVote={handleVote}
              />
            </motion.div>
          </AnimatePresence>

          {!isLastPoll && (
            <button
              type="button"
              onClick={() => canNext && setIndex((i) => i + 1)}
              disabled={!canNext}
              aria-label="Next question"
              className="absolute right-0 z-10 flex h-11 w-11 translate-x-3 items-center justify-center rounded-full border border-raw-gold/55 bg-black/75 text-raw-gold shadow-none transition hover:bg-black/75 hover:shadow-none focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-25 sm:translate-x-7"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {isLastPoll && selected && (
          <button
            type="button"
            onClick={closeShowcase}
            className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-raw-gold/55 bg-raw-gold px-5 py-2.5 font-display text-xs uppercase tracking-[0.22em] text-raw-black shadow-[0_0_18px_rgb(var(--raw-accent)/0.24)] transition hover:brightness-110"
          >
            Enter raW
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
