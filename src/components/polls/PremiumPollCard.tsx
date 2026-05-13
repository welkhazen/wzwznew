import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { HoverGradientVoteButton } from "@/components/polls/HoverGradientVoteButton";
import { useTheme } from "@/providers/useTheme";

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

const CARD_CLIP =
  "polygon(0 7%, 5.5% 0, 28% 0, 31% 1.4%, 69% 1.4%, 72% 0, 94.5% 0, 100% 7%, 100% 93%, 94.5% 100%, 5.5% 100%, 0 93%)";

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
  uniformNeutralTheme = false,
  className,
  onVote,
  onHintSeen,
}: PremiumPollCardProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const isAnswered = Boolean(selectedOptionId);
  const primarySelected = selectedOptionId === primaryOption.id;
  const secondarySelected = selectedOptionId === secondaryOption.id;

  const primaryVotes = primaryOption.votes ?? 0;
  const secondaryVotes = secondaryOption.votes ?? 0;
  const totalVotes = primaryVotes + secondaryVotes;
  const primaryPercent = getPercent(primaryVotes, totalVotes, primarySelected);
  const secondaryPercent = getPercent(secondaryVotes, totalVotes, secondarySelected);

  const voteLocked = useRef(false);

  useEffect(() => {
    voteLocked.current = false;
  }, [question]);

  const submitVote = useCallback(
    (optionId: string) => {
      if (disabled || isAnswered || voteLocked.current) return;
      voteLocked.current = true;
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
          className="relative min-h-[22rem] overflow-hidden sm:min-h-[25.5rem]"
          style={{
            clipPath: CARD_CLIP,
            background: isLight
              ? "radial-gradient(circle at 50% 0%, rgba(241,196,45,0.18), transparent 33%), linear-gradient(180deg, #faf6e8 0%, #f5f0d8 38%, #ede8c8 100%)"
              : "radial-gradient(circle at 50% 0%, rgba(241,196,45,0.14), transparent 33%), linear-gradient(180deg, #20201d 0%, #0a0a0a 38%, #050505 100%)",
          }}
        >
          <div className="absolute inset-[0.42rem] border border-raw-gold/18" style={{ clipPath: CARD_CLIP }} />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: isLight
                ? "radial-gradient(circle at 1px 1px, rgba(100,80,0,0.3) 1px, transparent 0)"
                : "radial-gradient(circle at 1px 1px, rgba(235,235,235,0.52) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          {!isLight && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.34)_65%,rgba(0,0,0,0.84)_100%)]" />}

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

            <h2 className={`mt-4 flex min-h-[5.5rem] items-center text-center font-display text-[clamp(1rem,4.6vw,1.46rem)] leading-[1.4] [text-wrap:balance] sm:mt-5 sm:min-h-[7.75rem] ${isLight ? "text-[#2a2000]" : "text-[#dedede]"}`}>
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
                  themeHue={uniformNeutralTheme && !primarySelected ? "neutral" : "primary"}
                  disabled={disabled}
                  onClick={() => submitVote(primaryOption.id)}
                  showFill={false}
                />

                {/* Secondary / No button */}
                <HoverGradientVoteButton
                  label={secondaryOption.label}
                  answered={isAnswered}
                  selected={secondarySelected}
                  percent={secondaryPercent}
                  align="left"
                  themeHue={secondarySelected ? "primary" : "neutral"}
                  disabled={disabled}
                  onClick={() => submitVote(secondaryOption.id)}
                  showFill={false}
                />
</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
