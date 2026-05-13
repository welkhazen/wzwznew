import { useCallback, useEffect, useRef, useState } from "react";
import { loadUserProgress, awardXP, type UserProgress } from "@/lib/userProgress";

interface UseUserProgressReturn {
  progress: UserProgress | null;
  isLoading: boolean;
  leveledUpTo: number | null;
  clearLevelUp: () => void;
  award: (amount: number) => Promise<void>;
}

export function useUserProgress(userId: string | undefined): UseUserProgressReturn {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState<number | null>(null);
  const loadedForRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!userId || loadedForRef.current === userId) return;
    loadedForRef.current = userId;
    setIsLoading(true);
    loadUserProgress(userId)
      .then((p) => { if (p) setProgress(p); })
      .finally(() => setIsLoading(false));
  }, [userId]);

  const award = useCallback(async (amount: number) => {
    if (!userId) return;
    const result = await awardXP(userId, amount);
    if (!result) return;
    setProgress((prev) => prev
      ? { ...prev, xp: result.xp, level: result.level }
      : { xp: result.xp, level: result.level, totalPollsAnswered: 0, streakDays: 0 }
    );
    if (result.leveledUp) setLeveledUpTo(result.level);
  }, [userId]);

  const clearLevelUp = useCallback(() => setLeveledUpTo(null), []);

  return { progress, isLoading, leveledUpTo, clearLevelUp, award };
}
