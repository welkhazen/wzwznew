// localStorage + in-memory cache for the profile stats grid so navigation
// doesn't re-show a cold spinner. Mirrors src/lib/communityCache.ts.

import type { ProfileStats } from "@/backend/supabase/controllers/profileStatsController";

const KEY_PREFIX = "raw.cache.profile-stats.v1.";
const CACHE_HARD_TTL_MS = 24 * 60 * 60 * 1000;

type Cached<T> = { data: T; ts: number };

const memory = new Map<string, Cached<ProfileStats>>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function key(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function readCachedProfileStats(userId: string): { data: ProfileStats; ageMs: number } | null {
  const k = key(userId);
  const hit = memory.get(k);
  if (hit) return { data: hit.data, ageMs: Date.now() - hit.ts };
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached<ProfileStats>;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CACHE_HARD_TTL_MS) return null;
    memory.set(k, parsed);
    return { data: parsed.data, ageMs: Date.now() - parsed.ts };
  } catch {
    return null;
  }
}

export function writeCachedProfileStats(userId: string, stats: ProfileStats): void {
  const entry: Cached<ProfileStats> = { data: stats, ts: Date.now() };
  memory.set(key(userId), entry);
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(entry));
  } catch {
    // Quota / storage unavailable — in-memory still works for this session.
  }
}
