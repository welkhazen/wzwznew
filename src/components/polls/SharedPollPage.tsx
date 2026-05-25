import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { PremiumPollCard } from "@/components/polls/PremiumPollCard";
import { Button } from "@/components/ui/button";
import { resolvePollShareCode } from "@/lib/pollShare";
import { submitPollVote } from "@/utils/supabasePolls";
import type { Poll } from "@/store/types";

interface SharedPollPageProps {
  polls: Poll[];
  shareCode: string;
  votedPolls: Set<string>;
  onVote: (pollId: string, optionId: string) => void;
  onSignup: () => void;
}

export function SharedPollPage({
  polls,
  shareCode,
  votedPolls,
  onVote,
  onSignup,
}: SharedPollPageProps) {
  const pollId = resolvePollShareCode(polls, shareCode);
  const poll = pollId ? polls.find((item) => item.id === pollId) : null;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<"idle" | "saving" | "saved" | "duplicate" | "error">("idle");

  useEffect(() => {
    setSelectedOptionId(null);
    setVoteStatus("idle");
  }, [shareCode]);

  if (!poll) {
    return (
      <main className="dashboard-enhanced-bg flex min-h-screen items-center justify-center bg-raw-black px-5 py-10 text-center">
        <section className="max-w-sm border border-raw-border/30 bg-raw-black/70 px-5 py-6">
          <p className="font-display text-lg text-raw-text">Poll link expired</p>
          <p className="mt-2 text-sm leading-relaxed text-raw-silver/55">
            This shared poll is not available right now.
          </p>
          <Button asChild className="mt-5 rounded-none bg-raw-gold text-raw-ink hover:bg-raw-gold/90">
            <Link to="/">Explore raW</Link>
          </Button>
        </section>
      </main>
    );
  }

  const primaryOption = poll.options[0];
  const secondaryOption = poll.options[1];
  const answered = Boolean(selectedOptionId || votedPolls.has(poll.id) || voteStatus === "duplicate");

  return (
    <main className="dashboard-enhanced-bg min-h-screen bg-raw-black px-5 py-10 text-raw-text">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center justify-center gap-5">
        <div className="w-full text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-raw-gold/70">Shared poll</p>
          <h1 className="mt-2 font-display text-xl tracking-wide text-raw-text">Answer anonymously</h1>
        </div>

        {primaryOption && secondaryOption && (
          <PremiumPollCard
            question={poll.question}
            primaryOption={{ id: primaryOption.id, label: primaryOption.text, votes: primaryOption.votes }}
            secondaryOption={{ id: secondaryOption.id, label: secondaryOption.text, votes: secondaryOption.votes }}
            selectedOptionId={selectedOptionId}
            showHint={!answered}
            onVote={async (optionId) => {
              setSelectedOptionId(optionId);
              setVoteStatus("saving");
              try {
                await submitPollVote(poll.id, optionId, "guest");
                onVote(poll.id, optionId);
                setVoteStatus("saved");
              } catch (error) {
                setVoteStatus(error instanceof Error && error.message === "already_voted" ? "duplicate" : "error");
              }
            }}
          />
        )}

        {answered && (
          <div className="relative z-10 w-full border border-raw-gold/45 bg-raw-black/95 px-4 py-4 text-center shadow-[0_18px_45px_rgba(0,0,0,0.65),0_0_28px_rgba(241,196,45,0.12)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-raw-gold">Answer saved</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-raw-text">
              {voteStatus === "duplicate"
                ? "Looks like this device or network already answered this poll."
                : "Create an anonymous profile to answer more polls and find your communities."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button onClick={onSignup} className="rounded-none bg-raw-gold font-semibold text-raw-ink hover:bg-raw-gold/90">
                Sign up
              </Button>
              <Button asChild variant="outline" className="rounded-none border-raw-gold/45 bg-raw-surface/40 font-semibold text-raw-text hover:bg-raw-gold/10 hover:text-raw-gold">
                <Link to="/">Explore raW</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
