import { makeLocalStorageCache } from "./localStorageCache";
import type { CommunityChatMessageRecord, PersistedCommunityRecord } from "./communityChat.types";

const COMMUNITIES_KEY = "raw.cache.communities.v1";
const MESSAGES_KEY_PREFIX = "raw.cache.community-messages.v1.";
const CACHE_HARD_TTL_MS = 24 * 60 * 60 * 1000;

// Below this age we trust the cache enough to skip the spinner entirely.
export const CACHE_FRESH_MS = 30_000;

const communitiesCache = makeLocalStorageCache<PersistedCommunityRecord[]>(CACHE_HARD_TTL_MS);
const messagesCache = makeLocalStorageCache<CommunityChatMessageRecord[]>(CACHE_HARD_TTL_MS);

export function readCachedCommunities(): { data: PersistedCommunityRecord[]; ageMs: number } | null {
  const result = communitiesCache.getWithAge(COMMUNITIES_KEY);
  if (!result || !Array.isArray(result.data)) return null;
  return result;
}

export function writeCachedCommunities(list: PersistedCommunityRecord[]): void {
  communitiesCache.write(COMMUNITIES_KEY, list);
}

export function readCachedMessages(
  communityId: string,
): { data: CommunityChatMessageRecord[]; ageMs: number } | null {
  const result = messagesCache.getWithAge(`${MESSAGES_KEY_PREFIX}${communityId}`);
  if (!result || !Array.isArray(result.data)) return null;
  return result;
}

export function writeCachedMessages(
  communityId: string,
  messages: CommunityChatMessageRecord[],
): void {
  messagesCache.write(`${MESSAGES_KEY_PREFIX}${communityId}`, messages);
}

export function isCacheFresh(ageMs: number): boolean {
  return ageMs <= CACHE_FRESH_MS;
}
