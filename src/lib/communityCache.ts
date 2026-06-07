// Lightweight persistent cache for the communities feature so navigating away
// and back doesn't re-show the cold-load spinner. Cache is read instantly from
// memory (or rehydrated from localStorage on first read), then the real network
// fetch fires in the background and replaces it with fresh data.
//
// No external deps — keeps the bundle the same size.

import type { CommunityChatMessageRecord, PersistedCommunityRecord } from "./communityChat.types";

const COMMUNITIES_KEY = "raw.cache.communities.v1";
const MESSAGES_KEY_PREFIX = "raw.cache.community-messages.v1.";

// Below this age we trust the cache enough to skip the spinner entirely.
// Above it, we still surface the stale data instantly but components can
// choose to render a subtle refresh indicator while revalidation runs.
export const CACHE_FRESH_MS = 30_000;

// Anything older than this is considered too stale to render at all.
const CACHE_HARD_TTL_MS = 24 * 60 * 60 * 1000;

type Cached<T> = { data: T; ts: number };

const memory = new Map<string, Cached<unknown>>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string): Cached<T> | null {
  const hit = memory.get(key) as Cached<T> | undefined;
  if (hit) return hit;
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached<T>;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CACHE_HARD_TTL_MS) return null;
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  const entry: Cached<T> = { data, ts: Date.now() };
  memory.set(key, entry);
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Quota exceeded or storage unavailable — in-memory cache still works for this session.
  }
}

export function readCachedCommunities(): { data: PersistedCommunityRecord[]; ageMs: number } | null {
  const entry = read<PersistedCommunityRecord[]>(COMMUNITIES_KEY);
  if (!entry || !Array.isArray(entry.data)) return null;
  return { data: entry.data, ageMs: Date.now() - entry.ts };
}

export function writeCachedCommunities(list: PersistedCommunityRecord[]): void {
  write(COMMUNITIES_KEY, list);
}

function messagesKey(communityId: string): string {
  return `${MESSAGES_KEY_PREFIX}${communityId}`;
}

export function readCachedMessages(
  communityId: string,
): { data: CommunityChatMessageRecord[]; ageMs: number } | null {
  const entry = read<CommunityChatMessageRecord[]>(messagesKey(communityId));
  if (!entry || !Array.isArray(entry.data)) return null;
  return { data: entry.data, ageMs: Date.now() - entry.ts };
}

export function writeCachedMessages(
  communityId: string,
  messages: CommunityChatMessageRecord[],
): void {
  write(messagesKey(communityId), messages);
}

/**
 * Returns true if we can skip the spinner because the cache is recent enough
 * that any incoming refresh will visibly stitch on top instead of replacing
 * a blank screen.
 */
export function isCacheFresh(ageMs: number): boolean {
  return ageMs <= CACHE_FRESH_MS;
}
