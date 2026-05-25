import type { Poll } from "@/store/types";

export const POLL_SHARE_PARAM = "ref";
export const LEGACY_POLL_SHARE_PARAM = "poll";

function hashPollId(value: string, seed: number): string {
  let hash = 0x811c9dc5 ^ seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

export function getPollShareCode(pollId: string): string {
  return `raw-${hashPollId(pollId, 0x47a3)}${hashPollId(pollId, 0xb91f)}`;
}

export function resolvePollShareCode(polls: Poll[], code: string | null): string | null {
  if (!code) return null;
  return polls.find((poll) => getPollShareCode(poll.id) === code)?.id ?? null;
}
