import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPolls, submitPollVote } from "@/lib/api/polls";
import { fetchTokenBalance, spendTokens } from "@/lib/api/tokens";
import { track } from "@/lib/analytics";
import type { Poll } from "@/store/types";
import { getTodayKey } from "@/store/useRawStore.storage";
import { POLL_QUESTION_SEEDS } from "@/features/polls/pollQuestions";

const DAILY_POLL_LIMIT = 7;
const EXTRA_BATCH_SIZE = 7;
const UNLOCK_TOKEN_COST = 10;
const GUEST_TOKEN_BALANCE = 0;
const TOKEN_BALANCE_STORAGE_KEY = "raw.polls.token-balance";
const TOKEN_BALANCE_UPDATED_EVENT = "raw:token-balance-updated";

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
    const polls = await fetchPolls(100);
    if (polls.length > 0) {
      return polls;
    }
  } catch {
    // fall through to seeds
  }

  return INITIAL_POLLS;
}

function readStoredPollIds(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function readStoredExtraBatches(storageKey: string, answeredStorageKey: string): number {
  try {
    const stored = window.localStorage.getItem(storageKey);
    const storedValue = stored !== null ? Number(stored) : 0;
    const answeredCount = readStoredPollIds(answeredStorageKey).size;
    const minBatches = Math.max(0, Math.ceil((answeredCount - DAILY_POLL_LIMIT) / EXTRA_BATCH_SIZE));

    return Math.max(storedValue, minBatches);
  } catch {
    return 0;
  }
}

function emitTokenBalanceUpdated(storageKey: string, balance: number): void {
  window.dispatchEvent(new CustomEvent(TOKEN_BALANCE_UPDATED_EVENT, {
    detail: { storageKey, balance },
  }));
}

export function usePolls(isLoggedIn: boolean, userId?: string) {
  const queryClient = useQueryClient();
  const [freeVotesUsed, setFreeVotesUsed] = useState(0);
  const [guestVotedPolls, setGuestVotedPolls] = useState<Set<string>>(new Set());
  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  const pollStorageScope = isLoggedIn && userId ? `user.${userId}` : "guest";
  const STORAGE_KEY = `raw.polls.daily-answered.${pollStorageScope}.${todayKey}`;
  const EXTRA_BATCHES_KEY = `raw.polls.extra-batches.${pollStorageScope}.${todayKey}`;
  const TOKEN_BALANCE_KEY = isLoggedIn && userId ? `${TOKEN_BALANCE_STORAGE_KEY}.${userId}` : TOKEN_BALANCE_STORAGE_KEY;

  const [dailyPollDate, setDailyPollDate] = useState(todayKey);
  const [loadedDailyStorageKey, setLoadedDailyStorageKey] = useState(STORAGE_KEY);
  const [dailyAnsweredPollIds, setDailyAnsweredPollIds] = useState<Set<string>>(() => readStoredPollIds(STORAGE_KEY));
  const [sessionVotedPolls, setSessionVotedPolls] = useState<Set<string>>(new Set());
  const [tokenBalance, setTokenBalance] = useState<number>(() => {
    if (!isLoggedIn) return GUEST_TOKEN_BALANCE;
    try {
      const stored = window.localStorage.getItem(TOKEN_BALANCE_KEY);
      return stored !== null ? Number(stored) : GUEST_TOKEN_BALANCE;
    } catch {
      return GUEST_TOKEN_BALANCE;
    }
  });
  const [loadedExtraBatchesKey, setLoadedExtraBatchesKey] = useState(EXTRA_BATCHES_KEY);
  const [extraBatchesUnlocked, setExtraBatchesUnlocked] = useState<number>(() => readStoredExtraBatches(EXTRA_BATCHES_KEY, STORAGE_KEY));

  useEffect(() => {
    const refreshTodayKey = () => setTodayKey(getTodayKey());
    refreshTodayKey();
    const intervalId = window.setInterval(refreshTodayKey, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setDailyPollDate(todayKey);
    setLoadedDailyStorageKey(STORAGE_KEY);
    setDailyAnsweredPollIds(readStoredPollIds(STORAGE_KEY));
    setLoadedExtraBatchesKey(EXTRA_BATCHES_KEY);
    setExtraBatchesUnlocked(readStoredExtraBatches(EXTRA_BATCHES_KEY, STORAGE_KEY));
    setSessionVotedPolls(new Set());
    setGuestVotedPolls(new Set());
    setFreeVotesUsed(0);
  }, [EXTRA_BATCHES_KEY, STORAGE_KEY, todayKey]);

  useEffect(() => {
    if (loadedExtraBatchesKey !== EXTRA_BATCHES_KEY) return;
    try {
      window.localStorage.setItem(EXTRA_BATCHES_KEY, String(extraBatchesUnlocked));
    } catch {
      // ignore storage errors
    }
  }, [EXTRA_BATCHES_KEY, extraBatchesUnlocked, loadedExtraBatchesKey]);

  useEffect(() => {
    const handleTokenBalanceUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ storageKey?: string; balance?: number }>;
      if (customEvent.detail?.storageKey !== TOKEN_BALANCE_KEY) return;
      const nextBalance = Number(customEvent.detail.balance);
      if (!Number.isFinite(nextBalance)) return;
      setTokenBalance(nextBalance);
    };

    window.addEventListener(TOKEN_BALANCE_UPDATED_EVENT, handleTokenBalanceUpdated);
    return () => window.removeEventListener(TOKEN_BALANCE_UPDATED_EVENT, handleTokenBalanceUpdated);
  }, [TOKEN_BALANCE_KEY]);

  // Sync token balance from Supabase when logged in
  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    fetchTokenBalance(userId)
      .then((balance) => {
        setTokenBalance(balance);
        try {
          window.localStorage.setItem(TOKEN_BALANCE_KEY, String(balance));
          emitTokenBalanceUpdated(TOKEN_BALANCE_KEY, balance);
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // keep local value on network error
      });
  }, [TOKEN_BALANCE_KEY, isLoggedIn, userId]);

  useEffect(() => {
    if (loadedDailyStorageKey !== STORAGE_KEY) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...dailyAnsweredPollIds]));
    } catch {
      // ignore storage errors
    }
  }, [STORAGE_KEY, dailyAnsweredPollIds, loadedDailyStorageKey]);

  const pollsQuery = useQuery({
    queryKey: ["polls", "randomized"],
    enabled: true,
    retry: false,
    queryFn: fetchPollsWithFallback,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      if (!userId) return { pollId, optionId };
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
      setTokenBalance((prev) => prev - UNLOCK_TOKEN_COST);
      setExtraBatchesUnlocked((prev) => prev + 1);
      try {
        const newBalance = await spendTokens(userId, UNLOCK_TOKEN_COST);
        setTokenBalance(newBalance);
        try {
          window.localStorage.setItem(TOKEN_BALANCE_KEY, String(newBalance));
          emitTokenBalanceUpdated(TOKEN_BALANCE_KEY, newBalance);
        } catch {
          // ignore
        }
      } catch {
        // Roll back optimistic update on failure
        setTokenBalance((prev) => prev + UNLOCK_TOKEN_COST);
        setExtraBatchesUnlocked((prev) => prev - 1);
      }
    } else {
      setTokenBalance((prev) => {
        const next = prev - UNLOCK_TOKEN_COST;
        try {
          window.localStorage.setItem(TOKEN_BALANCE_KEY, String(next));
          emitTokenBalanceUpdated(TOKEN_BALANCE_KEY, next);
        } catch {
          // ignore storage errors
        }
        return next;
      });
      setExtraBatchesUnlocked((prev) => prev + 1);
    }
  }, [TOKEN_BALANCE_KEY, tokenBalance, isLoggedIn, userId]);

  const addTokens = useCallback((amount: number) => {
    const safeAmount = Math.max(0, amount);
    if (safeAmount === 0) return;

    if (isLoggedIn && userId) {
      setTokenBalance((previous) => {
        const next = previous + safeAmount;
        try {
          window.localStorage.setItem(TOKEN_BALANCE_KEY, String(next));
          emitTokenBalanceUpdated(TOKEN_BALANCE_KEY, next);
        } catch {
          // ignore storage errors
        }
        return next;
      });

      // Token rewards stay local until a trusted reward/payment API mints them server-side.
      // Direct frontend minting is disabled by design — the /tokens endpoint refuses { action: "add" }.
      return;
    }

    setTokenBalance((previous) => {
      const next = previous + safeAmount;
      try {
        window.localStorage.setItem(TOKEN_BALANCE_KEY, String(next));
        emitTokenBalanceUpdated(TOKEN_BALANCE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, [TOKEN_BALANCE_KEY, isLoggedIn, userId]);

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
    addTokens,
    unlockExtraPolls,
    tokenBalance,
    dailyAnsweredCount: dailyAnsweredPollIds.size,
    dailyPollLimit: effectiveDailyLimit,
    isDailyPollLimitReached: dailyAnsweredPollIds.size >= effectiveDailyLimit,
  }), [addTokens, dailyAnsweredPollIds.size, effectiveDailyLimit, freeVotesUsed, polls, tokenBalance, unlockExtraPolls, vote, votedPolls]);
}
