import { makeLocalStorageCache } from "./localStorageCache";
import type { ProfileStats } from "@/backend/supabase/controllers/profileStatsController";

const KEY_PREFIX = "raw.cache.profile-stats.v1.";
const CACHE_HARD_TTL_MS = 24 * 60 * 60 * 1000;

const cache = makeLocalStorageCache<ProfileStats>(CACHE_HARD_TTL_MS);

export function readCachedProfileStats(userId: string): { data: ProfileStats; ageMs: number } | null {
  return cache.getWithAge(`${KEY_PREFIX}${userId}`);
}

export function writeCachedProfileStats(userId: string, stats: ProfileStats): void {
  cache.write(`${KEY_PREFIX}${userId}`, stats);
}
