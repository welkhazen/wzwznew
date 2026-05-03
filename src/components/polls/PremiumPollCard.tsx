import { useCallback, useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { cn } from "@/lib/utils";

export interface PremiumPollOption {
  id: string;
  label: string;
  votes?: number;
}

interface PremiumPollCardProps {
  question: string;
  primaryOption: PremiumPollOption;
  secondaryOption: PremiumPollOption;
  selectedOptionId?: string | null;
  disabled?: boolean;
  showHint?: boolean;
  className?: string;
  onVote: (optionId: string) => void;
  onHintSeen?: () => void;
}

const CARD_CLIP =
  "polygon(0 7%, 5.5% 0, 28% 0, 31% 1.4%, 69% 1.4%, 72% 0, 94.5% 0, 100% 7%, 100% 93%, 94.5% 100%, 5.5% 100%, 0 93%)";
const BUTTON_CLIP = "polygon(10% 0, 90% 0, 100% 22%, 100% 78%, 90% 100%, 10% 100%, 0 78%, 0 22%)";
const DISTANCE_THRESHOLD = 84;
const FLING_VELOCITY_THRESHOLD = 560;
const MIN_FLING_DISTANCE = 18;

function getPercent(optionVotes: number, totalVotes: number, selected: boolean) {
  if (totalVotes <= 0) return selected ? 100 : 0;
  return Math.round((optionVotes / totalVotes) * 100);
}

export function PremiumPollCard({
  question,
  primaryOption,
  secondaryOption,
  selectedOptionId = null,
  disabled = false,
  showHint = false,
  className,
  onVote,
  onHintSeen,
}: PremiumPollCardProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 0, 180], [-8, 0, 8]);
  const primaryGlow = useTransform(x, [14, 112], [0, 1]);
  const secondaryGlow = useTransform(x, [-112, -14], [1, 0]);
  const voteLockedRef = useRef(false);

  const primaryVotes = primaryOption.votes ?? 0;
  const secondaryVotes = secondaryOption.votes ?? 0;
  const totalVotes = primaryVotes + secondaryVotes;
  const isAnswered = Boolean(selectedOptionId);
  const primarySelected = selectedOptionId === primaryOption.id;
  const secondarySelected = selectedOptionId === secondaryOption.id;
  const primaryPercent = getPercent(primaryVotes, totalVotes, primarySelected);
  const secondaryPercent = getPercent(secondaryVotes, totalVotes, secondarySelected);

  useEffect(() => {
    voteLockedRef.current = false;
    animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
  }, [question, selectedOptionId, x]);

  const submitVote = useCallback(
    (optionId: string) => {
      if (disabled || isAnswered || voteLockedRef.current) return;
      voteLockedRef.current = true;
      onHintSeen?.();
      onVote(optionId);
    },
    [disabled, isAnswered, onHintSeen, onVote]
  );

  const finishSwipe = useCallback(
    (optionId: string, targetX: number) => {
      if (reduceMotion) {
        submitVote(optionId);
        return;
      }

      const controls = animate(x, targetX, { type: "spring", stiffness: 180, damping: 24 });
      void controls.finished.then(() => submitVote(optionId));
    },
    [reduceMotion, submitVote, x]
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled || isAnswered) {
        animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
        return;
      }

      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;
      const hasDistance = Math.abs(offsetX) >= DISTANCE_THRESHOLD;
      const hasFling = Math.abs(velocityX) >= FLING_VELOCITY_THRESHOLD && Math.abs(offsetX) >= MIN_FLING_DISTANCE;

      if (!hasDistance && !hasFling) {
        animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
        return;
      }

      const direction = hasFling ? Math.sign(velocityX) : Math.sign(offsetX);
      if (direction > 0) {
        finishSwipe(primaryOption.id, 520);
      } else {
        finishSwipe(secondaryOption.id, -520);
      }
    },
    [disabled, finishSwipe, isAnswered, primaryOption.id, secondaryOption.id, x]
  );

  return (
    <motion.article
      className={cn("relative mx-auto w-full max-w-[20rem] touch-pan-y select-none", className)}
      drag={disabled || isAnswered ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.72}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      whileTap={disabled || isAnswered ? undefined : { cursor: "grabbing" }}
      aria-label={question}
    >
      <motion.div
        className="pointer-events-none absolute -left-5 top-10 z-20 rounded-full border border-raw-gold/35 bg-[#111]/90 p-3 text-raw-gold shadow-[0_0_22px_rgba(241,196,45,0.18)]"
        style={{ opacity: secondaryGlow }}
        aria-hidden="true"
      >
        <span className="block text-sm leading-none">No</span>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute -right-5 top-10 z-20 rounded-full border border-raw-gold/55 bg-[#151006]/95 p-3 text-raw-gold shadow-[0_0_24px_rgba(241,196,45,0.28)]"
        style={{ opacity: primaryGlow }}
        aria-hidden="true"
      >
        <span className="block text-sm leading-none">Yes</span>
      </motion.div>

      <div
        className="relative p-px shadow-[0_28px_70px_rgba(0,0,0,0.68),0_0_36px_rgba(241,196,45,0.14)]"
        style={{
          clipPath: CARD_CLIP,
          background:
            "linear-gradient(155deg, rgba(241,196,45,0.72), rgba(235,235,235,0.18) 28%, rgba(35,35,35,0.5) 52%, rgba(241,196,45,0.64))",
        }}
      >
        <div
          className="relative min-h-[25.5rem] overflow-hidden bg-[#070707]"
          style={{
            clipPath: CARD_CLIP,
            background:
              "radial-gradient(circle at 50% 0%, rgba(241,196,45,0.14), transparent 33%), linear-gradient(180deg, #20201d 0%, #0a0a0a 38%, #050505 100%)",
          }}
        >
          <div className="absolute inset-[0.42rem] border border-raw-gold/18" style={{ clipPath: CARD_CLIP }} />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(235,235,235,0.52) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.34)_65%,rgba(0,0,0,0.84)_100%)]" />

          <div className="relative flex min-h-[25.5rem] flex-col items-center px-5 pb-6 pt-9 sm:px-6">
            <div className="flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-raw-gold/55 to-raw-gold/20" />
              <span className="h-1 w-1 bg-raw-gold shadow-[0_0_10px_rgba(241,196,45,0.9)]" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-raw-gold/55 to-raw-gold/20" />
            </div>

            <div className="relative mt-5 h-20 w-20 overflow-hidden">
              <img
                src="/assets/cumulative-mind.png"
                alt="Cumulative Mind"
                className="h-full w-full object-contain drop-shadow-[0_0_16px_rgba(241,196,45,0.36)]"
                draggable={false}
              />
            </div>

            {showHint && !isAnswered && (
              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-raw-gold/75">
                (swipe or click to vote)
              </p>
            )}

            <h2 className="mt-5 flex min-h-[7.75rem] items-center text-center font-display text-[clamp(1.12rem,4.8vw,1.46rem)] leading-[1.42] text-[#dedede] [text-wrap:balance]">
              {question}
            </h2>

            <div className="mt-auto w-full pt-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={disabled || isAnswered}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => submitVote(primaryOption.id)}
                  className={cn(
                    "relative min-h-[4.8rem] cursor-pointer overflow-hidden px-3 py-3 text-center font-display text-lg tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/80 disabled:cursor-not-allowed",
                    primarySelected ? "text-black" : "text-raw-gold hover:text-[#ffe07a]",
                    !primarySelected && isAnswered && "text-raw-gold/75"
                  )}
                  style={{
                    clipPath: BUTTON_CLIP,
                    background: primarySelected
                      ? "linear-gradient(160deg, #f7d557, #d29b12)"
                      : "linear-gradient(145deg, rgba(241,196,45,0.20), rgba(18,14,5,0.9))",
                    border: "1px solid rgba(241,196,45,0.62)",
                    boxShadow: "inset 0 0 0 1px rgba(255,241,178,0.12), 0 0 18px rgba(241,196,45,0.17)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent via-raw-gold/70 to-transparent" />
                  <span className="relative flex flex-col items-center justify-center gap-1">
                    {isAnswered && <span className="text-xl font-semibold leading-none">{primaryPercent}%</span>}
                    {!isAnswered && <span>{primaryOption.label}</span>}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={disabled || isAnswered}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => submitVote(secondaryOption.id)}
                  className={cn(
                    onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => submitVote(secondaryOption.id)}
                  className={cn(
                    "group relative min-h-[4.8rem] overflow-hidden px-3 py-3 text-center font-display text-lg tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/70 disabled:cursor-not-allowed",
                    secondarySelected ? "text-black" : "text-[#d9d9d9] hover:border-raw-gold/50 hover:text-white",
                    !secondarySelected && isAnswered && "text-raw-silver/72"
                  )}
                  style={{
                    clipPath: BUTTON_CLIP,
                    background: secondarySelected
                      ? "linear-gradient(160deg, #ececec, #9b9b9b)"
                      : "linear-gradient(145deg, rgba(235,235,235,0.08), rgba(12,12,12,0.92))",
                    border: "1px solid rgba(217,217,217,0.34)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  <span className="relative flex flex-col items-center justify-center gap-1">
                    {isAnswered && <span className="text-xl font-semibold leading-none">{secondaryPercent}%</span>}
                    <span>{secondaryOption.label}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
