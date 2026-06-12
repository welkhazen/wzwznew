import { getChatIdentity } from "@/backend/supabase/controllers/userController";
import { privateAvatarKey } from "@/lib/avataridentity";

export const CHAT_IDENTITY_PREFIX = "raw.chat.identity.v1.";
export const CHAT_IDENTITY_CHANGED_EVENT = "raw:chat-identity-changed";

export function readSelectedChatAlias(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${CHAT_IDENTITY_PREFIX}${userId}`);
}

export function writeSelectedChatAlias(userId: string, alias: string | null): void {
  if (typeof window === "undefined") return;
  const storageKey = `${CHAT_IDENTITY_PREFIX}${userId}`;
  if (alias) {
    window.localStorage.setItem(storageKey, alias);
  } else {
    window.localStorage.removeItem(storageKey);
  }
  window.dispatchEvent(new CustomEvent(CHAT_IDENTITY_CHANGED_EVENT, { detail: { userId, alias } }));
}

/**
 * Seed local chat-identity state from the Supabase-backed prefs so the
 * selection and private avatar follow the account across devices. Writes into
 * the same localStorage keys the rest of the app reads, then fires the change
 * event so Nav/Communities/Profile pick up the synced values. Best-effort:
 * a failed fetch leaves any existing local selection untouched.
 */
export async function hydrateChatIdentityFromServer(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const prefs = await getChatIdentity(userId).catch(() => null);
  if (!prefs) return;
  if (prefs.avatarLevel != null) {
    window.localStorage.setItem(privateAvatarKey(userId), String(prefs.avatarLevel));
  }
  writeSelectedChatAlias(userId, prefs.alias);
}
