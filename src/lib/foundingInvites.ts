import { buildInviteUrl } from "@/lib/inviteLink";

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
        if (codes.length < FOUNDING_INVITE_COUNT) {
          while (codes.length < FOUNDING_INVITE_COUNT) {
            codes.push(createInviteCode(codes.length + 1));
          }
          persistFoundingInviteCodes(userId, codes);
        }
        return codes;
      }
    } catch {
      // fall through to regenerate
    }
  }

  // Generate once and persist so every surface (Home, Profile) reads the same
  // codes instead of each generating its own random set before the sync lands.
  const generated = Array.from({ length: FOUNDING_INVITE_COUNT }, (_, index) => createInviteCode(index + 1));
  persistFoundingInviteCodes(userId, generated);
  return generated;
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
  return `You've been invited to join raW.\n\nThis invitation is exclusive to you. Click the link below and your invitation code will be applied automatically during sign up.\n\n${buildInviteUrl(code)}`;
}

/**
 * Supabase-first: fetches the user's canonical codes from the server,
 * syncs them to localStorage, and only generates new codes if none exist yet.
 * Call this instead of readFoundingInviteCodes for the initial load.
 */
export async function getOrSyncInviteCodes(
  userId: string,
  fetchFromDb: (userId: string) => Promise<string[]>,
  registerToDb: (codes: string[], userId: string) => Promise<void>,
): Promise<string[]> {
  // 1. Try Supabase first — authoritative source.
  let serverCodes: string[] = [];
  try {
    serverCodes = await fetchFromDb(userId);
  } catch {
    // Network failure — fall through to localStorage.
  }

  if (serverCodes.length > 0) {
    // Pad to FOUNDING_INVITE_COUNT in case older accounts have fewer rows.
    while (serverCodes.length < FOUNDING_INVITE_COUNT) {
      serverCodes.push(createInviteCode(serverCodes.length + 1));
    }
    const canonical = serverCodes.slice(0, FOUNDING_INVITE_COUNT);
    persistFoundingInviteCodes(userId, canonical);
    // Register any newly padded codes so they're in Supabase too.
    try { await registerToDb(canonical, userId); } catch { /* best-effort */ }
    return canonical;
  }

  // 2. No server codes — generate, persist, register.
  const local = readFoundingInviteCodes(userId);
  persistFoundingInviteCodes(userId, local);
  try { await registerToDb(local, userId); } catch { /* best-effort */ }
  return local;
}
