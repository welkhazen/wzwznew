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
