import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { HoverGradientVoteButton } from "@/components/polls/HoverGradientVoteButton";

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
  uniformNeutralTheme?: boolean;
  className?: string;
  onVote: (optionId: string) => void;
  onHintSeen?: () => void;
}

interface VoteButtonProps {
  label: string;
  answered: boolean;
  selected: boolean;
  percent: number;
  disabled: boolean;
  pulse: boolean;
  tone: "primary" | "neutral";
  onClick: () => void;
  animateNumbers: boolean;
}

const CARD_CLIP =
  "polygon(0 7%, 5.5% 0, 28% 0, 31% 1.4%, 69% 1.4%, 72% 0, 94.5% 0, 100% 7%, 100% 93%, 94.5% 100%, 5.5% 100%, 0 93%)";

function getPercent(optionVotes: number, totalVotes: number, selected: boolean) {
  if (totalVotes <= 0) return selected ? 100 : 0;
  return Math.round((optionVotes / totalVotes) * 100);
}



function AnimatedPercentage({ value, animate }: { value: number; animate: boolean }) {
  const [displayValue, setDisplayValue] = useState(value);
    const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const durationMs = 800;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(now - start, durationMs);
      const progress = elapsed / durationMs;
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, value]);

  return <span className="text-xl font-semibold leading-none">{displayValue}%</span>;
}
export function PremiumPollCard({
  question,
  primaryOption,
  secondaryOption,
  selectedOptionId = null,
  disabled = false,
  showHint = false,
  uniformNeutralTheme = false,
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

  const voteLocked = useRef(false);
  const [animateNumbers, setAnimateNumbers] = useState(false);
  const [votePulse, setVotePulse] = useState(false);

  useEffect(() => {
    voteLocked.current = false;
    setAnimateNumbers(false);
    setVotePulse(false);
  }, [question]);

  useEffect(() => {
    if (!selectedOptionId) return;
    setAnimateNumbers(true);
    setVotePulse(true);
    const t = setTimeout(() => setVotePulse(false), 280);
    return () => clearTimeout(t);
  }, [selectedOptionId]);

  useEffect(() => {
    voteLocked.current = false;
  }, [question]);

  const submitVote = useCallback(
    (optionId: string) => {
      if (disabled || isAnswered || voteLocked.current) return;
      voteLocked.current = true;
      hasJustVotedRef.current = true;
      setAnimateNumbers(true);
      onHintSeen?.();
      onVote(optionId);
    },
    [disabled, isAnswered, onHintSeen, onVote]
  );

  return (
    <article className={cn("relative mx-auto w-full max-w-[22rem] select-none", className)} aria-label={question}>
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
              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-raw-gold/75">tap to vote</p>
            )}

            <h2 className="mt-4 flex min-h-[5.5rem] items-center text-center font-display text-[clamp(1rem,4.6vw,1.46rem)] leading-[1.4] text-[#dedede] [text-wrap:balance] sm:mt-5 sm:min-h-[7.75rem]">
              {question}
            </h2>

            <div className="mt-auto w-full pt-4 sm:pt-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Primary / Yes button */}
                <HoverGradientVoteButton
                  label={primaryOption.label}
                  answered={isAnswered}
                  selected={primarySelected}
                  percent={primaryPercent}
                  align="right"
                  themeHue={uniformNeutralTheme ? "neutral" : "primary"}
                  disabled={disabled}
                  onClick={() => submitVote(primaryOption.id)}
                  className={cn(
                    "relative min-h-[4rem] cursor-pointer overflow-hidden px-2 py-2.5 text-center font-display text-base tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/80 disabled:cursor-not-allowed sm:min-h-[4.8rem] sm:px-3 sm:py-3 sm:text-lg"
                  )}
                  style={{
                    clipPath: BUTTON_CLIP,
                    background: "linear-gradient(145deg, rgba(241,196,45,0.20), rgba(18,14,5,0.9))",
                    border: "1px solid rgba(241,196,45,0.62)",
                    boxShadow: primarySelected
                      ? "inset 0 0 0 1px rgba(255,241,178,0.28), 0 0 28px rgba(241,196,45,0.75), 0 0 60px rgba(241,196,45,0.38)"
                      : isAnswered
                        ? "inset 0 0 0 1px rgba(255,241,178,0.06), 0 0 6px rgba(241,196,45,0.07)"
                        : "inset 0 0 0 1px rgba(255,241,178,0.12), 0 0 18px rgba(241,196,45,0.17)",
                    transition: "box-shadow 0.5s ease, transform 0.2s ease",
                    transform: votePulse && primarySelected ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent via-raw-gold/70 to-transparent" />
                  <span
                    className="relative z-10 flex flex-col items-center justify-center gap-1"
                    style={{
                      color: isAnswered ? (primarySelected ? "#FFFFFF" : "rgba(255,255,255,0.55)") : undefined,
                      textShadow: primarySelected ? "0 0 10px rgba(241,196,45,1)" : undefined,
                      transition: "color 0.4s ease",
                    }}
                  >
                    {isAnswered && <AnimatedPercentage value={primaryPercent} animate={animateNumbers} />}
                    {!isAnswered && <span>{primaryOption.label}</span>}
                  </span>
                </button>
                />

                {/* Secondary / No button */}
                <HoverGradientVoteButton
                  label={secondaryOption.label}
                  answered={isAnswered}
                  selected={secondarySelected}
                  percent={secondaryPercent}
                  align="left"
                  themeHue="neutral"
                  disabled={disabled}
                  onClick={() => submitVote(secondaryOption.id)}
                  className={cn(
                    "group relative min-h-[4rem] overflow-hidden px-2 py-2.5 text-center font-display text-base tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/70 disabled:cursor-not-allowed sm:min-h-[4.8rem] sm:px-3 sm:py-3 sm:text-lg"
                  )}
                  style={{
                    clipPath: BUTTON_CLIP,
                    background: "linear-gradient(145deg, rgba(235,235,235,0.08), rgba(12,12,12,0.92))",
                    border: "1px solid rgba(217,217,217,0.34)",
                    boxShadow: secondarySelected
                      ? "inset 0 0 0 1px rgba(255,255,255,0.22), 0 0 28px rgba(210,210,210,0.65), 0 0 56px rgba(180,180,180,0.28)"
                      : isAnswered
                        ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                        : "inset 0 0 0 1px rgba(255,255,255,0.07)",
                    transition: "box-shadow 0.5s ease, transform 0.2s ease",
                    transform: votePulse && secondarySelected ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-5 top-2 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  <span
                    className="relative z-10 flex flex-col items-center justify-center gap-1"
                    style={{
                      color: isAnswered ? (secondarySelected ? "#FFFFFF" : "rgba(255,255,255,0.55)") : undefined,
                      textShadow: secondarySelected ? "0 0 10px rgba(255,255,255,0.9)" : undefined,
                      transition: "color 0.4s ease",
                    }}
                  >
                    {isAnswered && <AnimatedPercentage value={secondaryPercent} animate={animateNumbers} />}
                    <span>{secondaryOption.label}</span>
                  </span>
                </button>
              </div>
                />
</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
