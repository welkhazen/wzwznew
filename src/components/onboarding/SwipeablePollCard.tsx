import { ChevronLeft, ChevronRight } from "lucide-react";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";
import { isNoPollOption, isYesPollOption } from "@/lib/polls/normalizePollOptionText";

interface SwipeablePollCardProps {
  id: string;
  question: string;
  options: string[];
  selectedOption?: string;
  isAnswered: boolean;
  responseStats: Record<string, number>;
  pollIndex: number;
  totalPolls: number;
  onSwipe: (option: string) => void;
  onNavigate?: (direction: "left" | "right") => void;
  hideInternalNav?: boolean;
}

function resolveOptions(options: string[]) {
  const yesOption = options.find((option) => isYesPollOption(option)) ?? options[0];
  const noOption =
    options.find((option) => isNoPollOption(option)) ??
    options.find((option) => option !== yesOption) ??
    yesOption;

  return yesOption && noOption ? { yesOption, noOption } : null;
}

export function SwipeablePollCard({
  id,
  question,
  options,
  selectedOption,
  isAnswered,
  responseStats,
  pollIndex,
  totalPolls,
  onSwipe,
  onNavigate,
  hideInternalNav = false,
}: SwipeablePollCardProps) {
  const resolvedOptions = resolveOptions(options);


  if (!resolvedOptions) {
    return (
      <div className="border border-raw-border/40 bg-raw-black/45 p-6 text-center text-sm text-raw-silver/55">
        No options available for this poll.
      </div>
    );
  }

  const { yesOption, noOption } = resolvedOptions;

  return (
    <div className="flex flex-col gap-4 sm:gap-5" data-poll-id={id}>
      <PremiumPollCard
        question={question}
        primaryOption={{ id: yesOption, label: yesOption, votes: responseStats[yesOption] ?? 0 }}
        secondaryOption={{ id: noOption, label: noOption, votes: responseStats[noOption] ?? 0 }}
        selectedOptionId={isAnswered ? selectedOption ?? null : null}
        uniformNeutralTheme
        onVote={onSwipe}
      />

      {isAnswered && !hideInternalNav && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.("left")}
            disabled={pollIndex === 0}
            className="flex min-h-[40px] items-center justify-center gap-1.5 border border-raw-border/40 bg-raw-black/40 py-2.5 text-[11px] font-medium text-raw-silver/65 transition hover:border-raw-border/70 hover:text-raw-text disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous poll"
          >
            <ChevronLeft className="size-3.5" /> Previous
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("right")}
            disabled={pollIndex >= totalPolls - 1}
            className="flex min-h-[40px] items-center justify-center gap-1.5 border border-raw-border/40 bg-raw-black/40 py-2.5 text-[11px] font-medium text-raw-silver/65 transition hover:border-raw-border/70 hover:text-raw-text disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next poll"
          >
            Next <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
