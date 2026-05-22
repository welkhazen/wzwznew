export const BLOCKED_COMMUNITY_SENDERS_KEY = "raw.community.blocked-senders.v1";

export function getCommunitySenderBlockKey(senderId: string, senderName: string): string {
  return (senderId || senderName).trim().toLowerCase();
}

export function readBlockedCommunitySenders(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BLOCKED_COMMUNITY_SENDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const blocked = parsed?.[userId];
    return Array.isArray(blocked) ? blocked.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function writeBlockedCommunitySenders(userId: string, blockedSenderKeys: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(BLOCKED_COMMUNITY_SENDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(
      BLOCKED_COMMUNITY_SENDERS_KEY,
      JSON.stringify({ ...parsed, [userId]: blockedSenderKeys })
    );
  } catch {
    // ignore storage write errors
  }
}
