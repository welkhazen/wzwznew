import { useCallback, useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
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
const SWIPE_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 500;

function getPercent(optionVotes: number, totalVotes: number, selected: boolean) {
  if (totalVotes <= 0) return selected ? 100 : 0;
  return Math.round((optionVotes / totalVotes) * 100);
}

/**
 * Tinder-style swipeable poll card.
 *
 * Drag right or tap the gold button → primary option (yes-ish).
 * Drag left or tap the silver button → secondary option (no-ish).
 *
 * Implementation mirrors the landing-page DraggablePollCard that is known to
 * work: a single motion.div with drag="x", dragConstraints, dragElastic,
 * onDragEnd computing offset/velocity thresholds. Buttons use an isDragging
 * ref to avoid firing onClick after a drag.
 */
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
  const isAnswered = Boolean(selectedOptionId);
  const primarySelected = selectedOptionId === primaryOption.id;
  const secondarySelected = selectedOptionId === secondaryOption.id;

  const primaryVotes = primaryOption.votes ?? 0;
  const secondaryVotes = secondaryOption.votes ?? 0;
  const totalVotes = primaryVotes + secondaryVotes;
  const primaryPercent = getPercent(primaryVotes, totalVotes, primarySelected);
  const secondaryPercent = getPercent(secondaryVotes, totalVotes, secondarySelected);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const primaryGlow = useTransform(x, [20, 110], [0, 1]);
  const secondaryGlow = useTransform(x, [-110, -20], [1, 0]);

  const isDragging = useRef(false);
  const voteLocked = useRef(false);

  useEffect(() => {
    voteLocked.current = false;
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  }, [question, selectedOptionId, x]);

  const submitVote = useCallback(
    (optionId: string) => {
      if (disabled || isAnswered || voteLocked.current) return;
      voteLocked.current = true;
      onHintSeen?.();
      onVote(optionId);
    },
    [disabled, isAnswered, onHintSeen, onVote]
  );

  const flingAndVote = useCallback(
    (optionId: string, targetX: number) => {
      animate(x, targetX, { type: "spring", stiffness: 180, damping: 22 }).then(() =>
        submitVote(optionId)
      );
    },
    [submitVote, x]
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Release drag flag after a microtask so click on button that triggered
      // drag still fires but click handlers see isDragging=true and bail.
      setTimeout(() => {
        isDragging.current = false;
      }, 50);

      if (disabled || isAnswered) {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        return;
      }

      const { offset, velocity } = info;
      if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
        flingAndVote(primaryOption.id, 600);
      } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
        flingAndVote(secondaryOption.id, -600);
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 28 });
      }
    },
    [disabled, isAnswered, flingAndVote, primaryOption.id, secondaryOption.id, x]
  );

  const canDrag = !disabled && !isAnswered;

  return (
    <motion.article
      className={cn(
        "relative mx-auto w-full max-w-[22rem] select-none",
        canDrag ? "touch-pan-y cursor-grab active:cursor-grabbing" : "touch-auto",
        className
      )}
      drag={canDrag ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragStart={() => {
        isDragging.current = true;
      }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      aria-label={question}
    >
      {/* NO indicator */}
      <motion.div
        className="pointer-events-none absolute left-1 top-8 z-20 rounded-full border border-raw-silver/45 bg-[#111]/90 p-2.5 text-raw-silver shadow-[0_0_22px_rgba(180,180,180,0.22)] sm:-left-5 sm:top-10 sm:p-3"
        style={{ opacity: secondaryGlow }}
        aria-hidden="true"
      >
        <span className="block text-xs font-bold uppercase leading-none tracking-widest sm:text-sm">No</span>
      </motion.div>
      {/* YES indicator */}
      <motion.div
        className="pointer-events-none absolute right-1 top-8 z-20 rounded-full border border-raw-gold/65 bg-[#151006]/95 p-2.5 text-raw-gold shadow-[0_0_24px_rgba(241,196,45,0.35)] sm:-right-5 sm:top-10 sm:p-3"
        style={{ opacity: primaryGlow }}
        aria-hidden="true"
      >
        <span className="block text-xs font-bold uppercase leading-none tracking-widest sm:text-sm">Yes</span>
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
          className="relative min-h-[22rem] overflow-hidden bg-[#070707] sm:min-h-[25.5rem]"
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

          <div className="relative flex min-h-[22rem] flex-col items-center px-4 pb-5 pt-7 sm:min-h-[25.5rem] sm:px-6 sm:pb-6 sm:pt-9">
            <div className="flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-raw-gold/55 to-raw-gold/20" />
              <span className="h-1 w-1 bg-raw-gold shadow-[0_0_10px_rgba(241,196,45,0.9)]" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-raw-gold/55 to-raw-gold/20" />
            </div>

            <div className="relative mt-4 h-14 w-14 overflow-hidden sm:mt-5 sm:h-20 sm:w-20">
              <img
                src="/assets/cumulative-mind.png"
                alt="Cumulative Mind"
                className="h-full w-full object-contain drop-shadow-[0_0_16px_rgba(241,196,45,0.36)]"
                draggable={false}
              />
            </div>

            {showHint && !isAnswered && (
              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-raw-gold/75">
                swipe or tap to vote
              </p>
            )}

            <h2 className="mt-4 flex min-h-[5.5rem] items-center text-center font-display text-[clamp(1rem,4.6vw,1.46rem)] leading-[1.4] text-[#dedede] [text-wrap:balance] sm:mt-5 sm:min-h-[7.75rem]">
              {question}
            </h2>

            <div className="mt-auto w-full pt-4 sm:pt-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  disabled={disabled || isAnswered}
                  onClick={() => {
                    // Short-circuit if the click came at the end of a drag
                    if (isDragging.current) {
                      isDragging.current = false;
                      return;
                    }
                    submitVote(primaryOption.id);
                  }}
                  className={cn(
                    "relative min-h-[4rem] cursor-pointer overflow-hidden px-2 py-2.5 text-center font-display text-base tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/80 disabled:cursor-not-allowed sm:min-h-[4.8rem] sm:px-3 sm:py-3 sm:text-lg",
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
                  onClick={() => {
                    if (isDragging.current) {
                      isDragging.current = false;
                      return;
                    }
                    submitVote(secondaryOption.id);
                  }}
                  className={cn(
                    "group relative min-h-[4rem] overflow-hidden px-2 py-2.5 text-center font-display text-base tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/70 disabled:cursor-not-allowed sm:min-h-[4.8rem] sm:px-3 sm:py-3 sm:text-lg",
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
