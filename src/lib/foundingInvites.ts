export const FOUNDING_INVITES_STORAGE_PREFIX = "raw.founding-invites";
export const FOUNDING_INVITE_COUNT = 2;

export function createInviteCode(slot: number): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 8)
    .toUpperCase();
  return `RAW-${slot}-${randomPart}`;
}

export function readFoundingInviteCodes(userId: string): string[] {
  if (typeof window === "undefined") {
    return Array.from({ length: FOUNDING_INVITE_COUNT }, (_, index) => `RAW-${index + 1}-FOUNDING`);
  }

  const storageKey = `${FOUNDING_INVITES_STORAGE_PREFIX}.${userId}`;
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(storageKey);
  } catch {
    saved = null;
  }

  if (saved) {
    try {
      const parsed = JSON.parse(saved) as unknown;
      if (Array.isArray(parsed) && parsed.every((code) => typeof code === "string")) {
        const codes = parsed.slice(0, FOUNDING_INVITE_COUNT);
        while (codes.length < FOUNDING_INVITE_COUNT) {
          codes.push(createInviteCode(codes.length + 1));
        }
        return codes;
      }
    } catch {
      // fall through to regenerate
    }
  }

  return Array.from({ length: FOUNDING_INVITE_COUNT }, (_, index) => createInviteCode(index + 1));
}

export function persistFoundingInviteCodes(userId: string, codes: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${FOUNDING_INVITES_STORAGE_PREFIX}.${userId}`,
      JSON.stringify(codes.slice(0, FOUNDING_INVITE_COUNT)),
    );
  } catch {
    // Invite tickets remain usable for this session even if storage is blocked.
  }
}

export function buildInviteShareText(code: string): string {
  return `Here is an exclusive invitation code to enter raW. Use this during signup: ${code}`;
}
