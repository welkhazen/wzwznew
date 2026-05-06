import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
import { POLL_QUESTION_SEEDS } from "@/features/polls/pollQuestions";

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

const apiPollsToPollData = (polls: Poll[]): PollData[] =>
  polls.map((poll) => {
    const yesVotes = poll.options.find((option) => option.text.toLowerCase() === "yes")?.votes ?? 0;
    const noVotes = poll.options.find((option) => option.text.toLowerCase() === "no")?.votes ?? 0;
    const totalVotes = yesVotes + noVotes;

    return {
      id: poll.id,
      question: poll.question,
      yesPercent: totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 50,
      noPercent: totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 50,
    };
  });

function GoldIcosahedron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 12px rgba(241,196,45,0.55))" }}
    >
      <defs>
        <linearGradient id="goldFaceA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="55%" stopColor="#F1C42D" />
          <stop offset="100%" stopColor="#7a5e0a" />
        </linearGradient>
        <linearGradient id="goldFaceB" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a4708" />
          <stop offset="50%" stopColor="#d6a322" />
          <stop offset="100%" stopColor="#fff2a8" />
        </linearGradient>
        <linearGradient id="goldFaceC" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fff8c8" />
          <stop offset="100%" stopColor="#a37f10" />
        </linearGradient>
        <radialGradient id="goldCore" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#fff8d2" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#F1C42D" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5a4708" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="url(#goldFaceA)" opacity="0.92" />
      <polygon points="50,4 92,28 50,52 8,28" fill="url(#goldFaceC)" opacity="0.95" />
      <polygon points="8,28 50,52 8,72" fill="url(#goldFaceB)" opacity="0.85" />
      <polygon points="92,28 92,72 50,52" fill="url(#goldFaceB)" opacity="0.82" />
      <polygon points="50,52 92,72 50,96 8,72" fill="url(#goldFaceA)" opacity="0.7" />
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="url(#goldCore)" />
      <g stroke="#fff3a8" strokeWidth="0.9" fill="none" opacity="0.95">
        <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" />
        <line x1="50" y1="4" x2="50" y2="96" />
        <line x1="8" y1="28" x2="92" y2="72" />
        <line x1="92" y1="28" x2="8" y2="72" />
        <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" />
        <line x1="50" y1="18" x2="50" y2="82" />
        <line x1="22" y1="34" x2="78" y2="66" />
        <line x1="78" y1="34" x2="22" y2="66" />
      </g>
      <g stroke="#7a5e0a" strokeWidth="0.5" fill="none" opacity="0.85">
        <line x1="50" y1="4" x2="22" y2="34" />
        <line x1="50" y1="4" x2="78" y2="34" />
        <line x1="50" y1="96" x2="22" y2="66" />
        <line x1="50" y1="96" x2="78" y2="66" />
        <line x1="8" y1="28" x2="22" y2="34" />
        <line x1="8" y1="72" x2="22" y2="66" />
        <line x1="92" y1="28" x2="78" y2="34" />
        <line x1="92" y1="72" x2="78" y2="66" />
      </g>
    </svg>
  );
}

const CARD_CLIP =
  "polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)";
const CARD_INNER_CLIP =
  "polygon(17px 0, calc(100% - 17px) 0, 100% 17px, 100% calc(100% - 17px), calc(100% - 17px) 100%, 17px 100%, 0 calc(100% - 17px), 0 17px)";
const BUTTON_CLIP =
  "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 400;

export function PollShowcase({ initialOpen = true, onResolved }: PollShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "yes" | "no">>({});
  const [open, setOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);
  const isDragging = useRef(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const yesOpacity = useTransform(x, [20, 90], [0, 1]);
  const noOpacity = useTransform(x, [-90, -20], [1, 0]);
  const yesBg = useTransform(
    x,
    [0, 120],
    ["rgba(16,185,129,0)", "rgba(16,185,129,0.18)"]
  );
  const noBg = useTransform(
    x,
    [-120, 0],
    ["rgba(239,68,68,0.18)", "rgba(239,68,68,0)"]
  );

  const { data: fetchedPolls } = useQuery({
    queryKey: ["landing-poll-showcase", "polls"],
    queryFn: async () => {
      const polls = await fetchSupabasePolls(5);
      if (polls.length === 0) return null;
      return apiPollsToPollData(polls);
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const POLLS: PollData[] = fetchedPolls ?? FALLBACK_POLLS;

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

  // Reset card position whenever the poll changes
  useEffect(() => {
    x.set(0);
  }, [index, x]);

  const handleAnswer = useCallback(
    (choice: "yes" | "no") => {
      setAnswers((prev) => ({ ...prev, [index]: choice }));
    },
    [index]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const { offset, velocity } = info;
      if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
        animate(x, 600, { type: "spring", stiffness: 180, damping: 22 }).then(
          () => { handleAnswer("yes"); x.set(0); }
        );
      } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
        animate(x, -600, { type: "spring", stiffness: 180, damping: 22 }).then(
          () => { handleAnswer("no"); x.set(0); }
        );
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 28 });
      }
      isDragging.current = false;
    },
    [handleAnswer, x]
  );

  const currentPoll = POLLS[index];

  useEffect(() => {
    if (!currentPoll?.id) {
      setDbComments([]);
      return;
    }

    let isMounted = true;
    fetchPollComments(currentPoll.id)
      .then((comments) => {
        if (isMounted) {
          setDbComments(comments.map((comment) => comment.text));
        }
      })
      .catch(() => {
        if (isMounted) {
          setDbComments([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPoll?.id]);

  if (!mounted || !open) return null;

  const total = POLLS.length;
  const isLastPoll = index === total - 1;
  const canPrev = index > 0;
  const canNext = index < total - 1;
  const selected = answers[index];
  const currentPoll = POLLS[index];

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
                    ? "w-9 bg-[#F1C42D] shadow-[0_0_8px_rgba(241,196,45,0.7)]"
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
            className="absolute left-0 z-10 flex h-11 w-11 -translate-x-3 items-center justify-center rounded-full border border-[#F1C42D]/55 bg-black/75 text-[#F1C42D] shadow-[0_0_18px_rgba(241,196,45,0.25)] transition hover:bg-[#F1C42D]/10 disabled:cursor-not-allowed disabled:opacity-25 sm:-translate-x-7"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>

          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              style={{ x, rotate, position: "relative", width: "100%" }}
              drag={selected ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragStart={() => { isDragging.current = true; }}
              onDragEnd={handleDragEnd}
              className="w-full max-w-[330px] mx-auto"
            >
          <div
            className="relative w-full max-w-[330px] p-[1.5px]"
            style={{
              clipPath: CARD_CLIP,
              background:
                "linear-gradient(160deg, rgba(241,196,45,0.95) 0%, rgba(241,196,45,0.35) 35%, rgba(241,196,45,0.15) 60%, rgba(241,196,45,0.7) 100%)",
              boxShadow:
                "0 0 60px rgba(241,196,45,0.18), 0 0 24px rgba(241,196,45,0.22)",
            }}
          >
            {/* Swipe bg tints */}
            <motion.div
              className="absolute inset-0 rounded-[1px] pointer-events-none z-10"
              style={{ background: yesBg, clipPath: CARD_CLIP }}
            />
            <motion.div
              className="absolute inset-0 rounded-[1px] pointer-events-none z-10"
              style={{ background: noBg, clipPath: CARD_CLIP }}
            />

            {/* YES indicator */}
            <motion.div
              className="absolute top-5 right-5 z-20 pointer-events-none"
              style={{ opacity: yesOpacity }}
            >
              <div
                className="rounded-md px-2.5 py-1 font-bold text-xs tracking-widest uppercase"
                style={{
                  border: "2px solid rgba(16,185,129,0.8)",
                  color: "rgba(16,185,129,0.95)",
                  background: "rgba(16,185,129,0.1)",
                  textShadow: "0 0 10px rgba(16,185,129,0.55)",
                }}
              >
                YES ✓
              </div>
            </motion.div>

            {/* NO indicator */}
            <motion.div
              className="absolute top-5 left-5 z-20 pointer-events-none"
              style={{ opacity: noOpacity }}
            >
              <div
                className="rounded-md px-2.5 py-1 font-bold text-xs tracking-widest uppercase"
                style={{
                  border: "2px solid rgba(239,68,68,0.8)",
                  color: "rgba(239,68,68,0.95)",
                  background: "rgba(239,68,68,0.1)",
                  textShadow: "0 0 10px rgba(239,68,68,0.55)",
                }}
              >
                NO ✗
              </div>
            </motion.div>

            <div
              className="relative px-7 pt-7 pb-7"
              style={{
                clipPath: CARD_INNER_CLIP,
                background:
                  "linear-gradient(165deg, #161616 0%, #0a0a0a 60%, #050505 100%)",
              }}
            >
              {/* Corner accents */}
              <span className="pointer-events-none absolute left-[6px] top-[6px] h-[6px] w-[6px] border-l border-t border-[#F1C42D]" />
              <span className="pointer-events-none absolute right-[6px] top-[6px] h-[6px] w-[6px] border-r border-t border-[#F1C42D]" />
              <span className="pointer-events-none absolute bottom-[6px] left-[6px] h-[6px] w-[6px] border-b border-l border-[#F1C42D]" />
              <span className="pointer-events-none absolute bottom-[6px] right-[6px] h-[6px] w-[6px] border-b border-r border-[#F1C42D]" />
              <span className="pointer-events-none absolute left-[10px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#F1C42D]/55" />
              <span className="pointer-events-none absolute right-[10px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#F1C42D]/55" />

              <div className="flex flex-col items-center text-center">
                <GoldIcosahedron className="mb-5 h-20 w-20" />

                <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#F1C42D] [text-shadow:0_0_8px_rgba(241,196,45,0.45)]">
                  Instantly See What Others Think.
                </p>

                <p
                  className="mt-5 font-display text-[26px] font-medium leading-[1.18] tracking-wide text-[#EBEBEB]"
                  style={{
                    fontFamily:
                      'var(--font-display, "Orbitron", "Inter", system-ui, sans-serif)',
                  }}
                >
                  {currentPoll?.question}
                </p>

                <div className="mt-6 h-px w-16 bg-white/20" />

                <p className="mt-4 text-[11px] tracking-[0.05em] text-white/45">
                  {selected ? `You answered: ${selected.toUpperCase()}` : "Swipe/Click To Answer"}
                </p>

                <div className="mt-5 grid w-full grid-cols-2 gap-3">
                  {/* No button */}
                  <button
                    type="button"
                    onClick={() => { if (isDragging.current) { isDragging.current = false; return; } handleAnswer("no"); }}
                    aria-label="Vote no"
                    className="group relative h-12 transition active:scale-95"
                    style={{ clipPath: BUTTON_CLIP }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background: "rgba(180,180,180,0.6)",
                      }}
                    />
                    <span
                      className="absolute inset-[1.5px]"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background:
                          selected === "no"
                            ? "linear-gradient(155deg, rgba(220,220,220,0.25), rgba(10,10,10,0.95))"
                            : "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(10,10,10,0.95))",
                      }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center gap-1.5 text-base font-semibold tracking-wide text-[#EBEBEB]">
                      No
                      {selected && (
                        <span className="text-sm font-bold opacity-90">{currentPoll?.noPercent}%</span>
                      )}
                    </span>
                  </button>

                  {/* Yes button */}
                  <button
                    type="button"
                    onClick={() => { if (isDragging.current) { isDragging.current = false; return; } handleAnswer("yes"); }}
                    aria-label="Vote yes"
                    className="group relative h-12 transition active:scale-95"
                    style={{ clipPath: BUTTON_CLIP }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background: "rgba(241,196,45,0.85)",
                      }}
                    />
                    <span
                      className="absolute inset-[1.5px]"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background:
                          selected === "yes"
                            ? "linear-gradient(155deg, rgba(241,196,45,0.45), rgba(40,28,4,0.95))"
                            : "linear-gradient(155deg, rgba(241,196,45,0.18), rgba(20,14,2,0.95))",
                      }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center gap-1.5 text-base font-semibold tracking-wide text-[#F1C42D]">
                      Yes
                      {selected && (
                        <span className="text-sm font-bold opacity-90">{currentPoll?.yesPercent}%</span>
                      )}
                    </span>
                  </button>
                </div>

                {/* Next / Enter raW button */}
                {selected && canNext && (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => i + 1)}
                    className="mt-4 w-full h-10 relative transition active:scale-95"
                    style={{ clipPath: BUTTON_CLIP }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background: "rgba(241,196,45,0.3)",
                      }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center gap-1 text-sm font-semibold tracking-widest text-[#F1C42D]/80 uppercase">
                      Next <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </button>
                )}
                {selected && isLastPoll && (
                  <button
                    type="button"
                    onClick={closeShowcase}
                    className="mt-4 w-full h-10 relative transition active:scale-95"
                    style={{ clipPath: BUTTON_CLIP }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background: "rgba(241,196,45,0.85)",
                      }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center text-sm font-bold tracking-widest text-black uppercase">
                      Enter raW
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
            </motion.div>
          </AnimatePresence>

          {!isLastPoll && (
            <button
              type="button"
              onClick={() => canNext && setIndex((i) => i + 1)}
              disabled={!canNext}
              aria-label="Next question"
              className="absolute right-0 z-10 flex h-11 w-11 translate-x-3 items-center justify-center rounded-full border border-[#F1C42D]/55 bg-black/75 text-[#F1C42D] shadow-[0_0_18px_rgba(241,196,45,0.25)] transition hover:bg-[#F1C42D]/10 disabled:cursor-not-allowed disabled:opacity-25 sm:translate-x-7"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
