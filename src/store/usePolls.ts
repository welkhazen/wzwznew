import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSupabasePolls, fetchTokenBalance, spendTokens, submitPollVote } from "@/utils/supabasePolls";
import { track } from "@/lib/analytics";
import type { Poll } from "@/store/types";
import { getTodayKey } from "@/store/useRawStore.storage";
import { POLL_QUESTION_SEEDS } from "@/features/polls/pollQuestions";

const DAILY_POLL_LIMIT = 7;
const EXTRA_BATCH_SIZE = 7;
const UNLOCK_TOKEN_COST = 10;
const GUEST_TOKEN_BALANCE = 0;
const TOKEN_BALANCE_STORAGE_KEY = "raw.polls.token-balance";

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
    const polls = await fetchSupabasePolls(100);
    if (polls.length > 0) {
      return polls;
    }
  } catch {
    // fall through to seeds
  }

  return INITIAL_POLLS;
}

export function usePolls(isLoggedIn: boolean, userId?: string) {
  const queryClient = useQueryClient();
  const [freeVotesUsed, setFreeVotesUsed] = useState(0);
  const [guestVotedPolls, setGuestVotedPolls] = useState<Set<string>>(new Set());
  const todayKey = getTodayKey();
  const STORAGE_KEY = `raw.polls.daily-answered.${todayKey}`;

  const [dailyPollDate, setDailyPollDate] = useState(todayKey);
  const [dailyAnsweredPollIds, setDailyAnsweredPollIds] = useState<Set<string>>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(Array.isArray(ids) ? ids : []);
    } catch {
      return new Set();
    }
  });
  const [sessionVotedPolls, setSessionVotedPolls] = useState<Set<string>>(new Set());
  const [tokenBalance, setTokenBalance] = useState<number>(() => {
    if (!isLoggedIn) return GUEST_TOKEN_BALANCE;
    try {
      const stored = window.localStorage.getItem(TOKEN_BALANCE_STORAGE_KEY);
      return stored !== null ? Number(stored) : GUEST_TOKEN_BALANCE;
    } catch {
      return GUEST_TOKEN_BALANCE;
    }
  });
  const [extraBatchesUnlocked, setExtraBatchesUnlocked] = useState(0);

  // Sync token balance from Supabase when logged in
  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    fetchTokenBalance(userId)
      .then((balance) => {
        setTokenBalance(balance);
        try {
          window.localStorage.setItem(TOKEN_BALANCE_STORAGE_KEY, String(balance));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // keep local value on network error
      });
  }, [isLoggedIn, userId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...dailyAnsweredPollIds]));
    } catch {
      // ignore storage errors
    }
  }, [STORAGE_KEY, dailyAnsweredPollIds]);

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

  const unlockExtraPolls = useCallback(async () => {
    if (tokenBalance < UNLOCK_TOKEN_COST) return;

    if (isLoggedIn && userId) {
      // Optimistically update, then confirm with Supabase
      setTokenBalance((prev) => prev - UNLOCK_TOKEN_COST);
      setExtraBatchesUnlocked((prev) => prev + 1);
      try {
        const newBalance = await spendTokens(userId, UNLOCK_TOKEN_COST);
        setTokenBalance(newBalance);
        try {
          window.localStorage.setItem(TOKEN_BALANCE_STORAGE_KEY, String(newBalance));
        } catch {
          // ignore
        }
      } catch {
        // Roll back optimistic update on failure
        setTokenBalance((prev) => prev + UNLOCK_TOKEN_COST);
        setExtraBatchesUnlocked((prev) => prev - 1);
      }
    } else {
      setTokenBalance((prev) => prev - UNLOCK_TOKEN_COST);
      setExtraBatchesUnlocked((prev) => prev + 1);
    }
  }, [tokenBalance, isLoggedIn, userId]);

  const vote = useCallback((pollId: string, optionId: string) => {
    const currentDay = getTodayKey();
    if (dailyPollDate !== currentDay) {
      setDailyPollDate(currentDay);
      setDailyAnsweredPollIds(new Set());
    }

    const effectiveLimit = DAILY_POLL_LIMIT + extraBatchesUnlocked * EXTRA_BATCH_SIZE;
    const currentDailySet = dailyPollDate === currentDay ? dailyAnsweredPollIds : new Set<string>();
    if (!currentDailySet.has(pollId) && currentDailySet.size >= effectiveLimit) {
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
  }, [dailyAnsweredPollIds, dailyPollDate, extraBatchesUnlocked, guestVotedPolls, isLoggedIn, sessionVotedPolls, voteMutation]);

  const polls = useMemo(() => pollsQuery.data ?? INITIAL_POLLS, [pollsQuery.data]);
  const votedPolls = isLoggedIn ? sessionVotedPolls : guestVotedPolls;
  const effectiveDailyLimit = DAILY_POLL_LIMIT + extraBatchesUnlocked * EXTRA_BATCH_SIZE;

  return useMemo(() => ({
    polls,
    votedPolls,
    freeVotesUsed,
    vote,
    unlockExtraPolls,
    tokenBalance,
    dailyAnsweredCount: dailyAnsweredPollIds.size,
    dailyPollLimit: effectiveDailyLimit,
    isDailyPollLimitReached: dailyAnsweredPollIds.size >= effectiveDailyLimit,
  }), [dailyAnsweredPollIds.size, effectiveDailyLimit, freeVotesUsed, polls, tokenBalance, unlockExtraPolls, vote, votedPolls]);
}
