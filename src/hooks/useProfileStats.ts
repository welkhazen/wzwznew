import { useEffect, useState } from "react";
import {
  fetchProfileStats,
  EMPTY_PROFILE_STATS,
  type ProfileStats,
} from "@/backend/supabase/controllers/profileStatsController";
import { readCachedProfileStats, writeCachedProfileStats } from "@/lib/profileStatsCache";

interface UseProfileStatsResult {
  stats: ProfileStats;
  isLoading: boolean;
  isError: boolean;
  hasCache: boolean;
}

/**
 * Hydrates from localStorage instantly, then revalidates from the API.
 * Spinner is only shown on a true cold load (no cache yet).
 */
export function useProfileStats(userId: string | undefined): UseProfileStatsResult {
  const seeded = userId ? readCachedProfileStats(userId) : null;
  const [stats, setStats] = useState<ProfileStats>(seeded?.data ?? EMPTY_PROFILE_STATS);
  const [isLoading, setIsLoading] = useState(!seeded);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setStats(EMPTY_PROFILE_STATS);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    const cached = readCachedProfileStats(userId);
    if (cached) {
      setStats(cached.data);
      setIsLoading(false);
      setIsError(false);
    } else {
      setIsLoading(true);
      setIsError(false);
    }

    let cancelled = false;
    void (async () => {
      try {
        const fresh = await fetchProfileStats(userId);
        if (cancelled) return;
        setStats(fresh);
        writeCachedProfileStats(userId, fresh);
        setIsError(false);
      } catch {
        if (cancelled) return;
        // Only surface the error UI if there was nothing cached to fall back on.
        if (!cached) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { stats, isLoading, isError, hasCache: Boolean(seeded) };
}
