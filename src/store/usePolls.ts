import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSupabasePolls, submitPollVote } from "@/utils/supabasePolls";
import { track } from "@/lib/analytics";
import type { Poll } from "@/store/types";
import { getTodayKey } from "@/store/useRawStore.storage";
import { POLL_QUESTION_SEEDS } from "@/features/polls/pollQuestions";

const DAILY_POLL_LIMIT = 7;

const INITIAL_POLLS: Poll[] = POLL_QUESTION_SEEDS.map((poll, index) => ({
  id: poll.id,
  question: poll.question,
  options: [
    { id: `p${index + 1}-yes`, text: "Yes", votes: poll.yesVotes },
    { id: `p${index + 1}-no`, text: "No", votes: poll.noVotes },
  ],
  locked: false,
}));

async function fetchPollsWithFallback(): Promise<Poll[]> {
  try {
    const polls = await fetchSupabasePolls(10);
    if (polls.length > 0) {
      return polls;
    }
  } catch {
    // fall through to seeds
  }

  return INITIAL_POLLS;
}

export function usePolls(isLoggedIn: boolean) {
  const queryClient = useQueryClient();
  const [freeVotesUsed, setFreeVotesUsed] = useState(0);
  const [guestVotedPolls, setGuestVotedPolls] = useState<Set<string>>(new Set());
  const [dailyPollDate, setDailyPollDate] = useState(getTodayKey());
  const [dailyAnsweredPollIds, setDailyAnsweredPollIds] = useState<Set<string>>(new Set());
  const [sessionVotedPolls, setSessionVotedPolls] = useState<Set<string>>(new Set());

  const pollsQuery = useQuery({
    queryKey: ["polls", "randomized"],
    enabled: true,
    retry: false,
    queryFn: fetchPollsWithFallback,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      await submitPollVote(pollId, optionId);
      return { pollId, optionId };
    },
    onSuccess: ({ pollId, optionId }) => {
      setSessionVotedPolls((previous) => new Set(previous).add(pollId));
      queryClient.setQueryData<Poll[] | undefined>(["polls", "randomized"], (previous) => {
        if (!previous) {
          return previous;
        }

        return previous.map((poll) =>
          poll.id === pollId
            ? {
                ...poll,
                options: poll.options.map((option) =>
                  option.id === optionId ? { ...option, votes: option.votes + 1 } : option
                ),
              }
            : poll
        );
      });
    },
  });

  const vote = useCallback((pollId: string, optionId: string) => {
    const todayKey = getTodayKey();
    if (dailyPollDate !== todayKey) {
      setDailyPollDate(todayKey);
      setDailyAnsweredPollIds(new Set());
    }

    const currentDailySet = dailyPollDate === todayKey ? dailyAnsweredPollIds : new Set<string>();
    if (!currentDailySet.has(pollId) && currentDailySet.size >= DAILY_POLL_LIMIT) {
      return;
    }

    setDailyAnsweredPollIds((previous) => new Set(previous).add(pollId));

    if (isLoggedIn) {
      if (sessionVotedPolls.has(pollId)) {
        return;
      }
      voteMutation.mutate({ pollId, optionId });
      track("poll_answered", { poll_id: pollId, option_id: optionId, surface: "app" });
      return;
    }

    if (guestVotedPolls.has(pollId)) {
      return;
    }

    setGuestVotedPolls((previous) => new Set(previous).add(pollId));
    setFreeVotesUsed((previous) => previous + 1);
  }, [dailyAnsweredPollIds, dailyPollDate, guestVotedPolls, isLoggedIn, sessionVotedPolls, voteMutation]);

  const polls = useMemo(() => pollsQuery.data ?? INITIAL_POLLS, [pollsQuery.data]);
  const votedPolls = isLoggedIn ? sessionVotedPolls : guestVotedPolls;

  return useMemo(() => ({
    polls,
    votedPolls,
    freeVotesUsed,
    vote,
    dailyAnsweredCount: dailyAnsweredPollIds.size,
    dailyPollLimit: DAILY_POLL_LIMIT,
    isDailyPollLimitReached: dailyAnsweredPollIds.size >= DAILY_POLL_LIMIT,
  }), [dailyAnsweredPollIds.size, freeVotesUsed, polls, vote, votedPolls]);
}
