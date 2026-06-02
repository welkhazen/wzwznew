const OWNED_INSIGHTS_PREFIX = "raw.insights.owned.v1.";

export function readOwnedInsightIds(userId: string): Set<string> {
  if (!userId || typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(`${OWNED_INSIGHTS_PREFIX}${userId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function addOwnedInsightId(userId: string, insightId: string): Set<string> {
  const current = readOwnedInsightIds(userId);
  current.add(insightId);
  if (typeof window !== "undefined" && userId) {
    try {
      window.localStorage.setItem(
        `${OWNED_INSIGHTS_PREFIX}${userId}`,
        JSON.stringify(Array.from(current)),
      );
    } catch {
      // Best effort; runtime state still holds the value.
    }
  }
  return current;
}
