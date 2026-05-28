export const IDENTITY_SELECTION_EVENT = "raw:identity-selection-updated";

function identitySelectionKey(userId: string): string {
  return `raw.identity.selected.v1.${userId}`;
}

export function readSelectedIdentityAlias(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(identitySelectionKey(userId));
}

export function writeSelectedIdentityAlias(userId: string, alias: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(identitySelectionKey(userId), alias);
  window.dispatchEvent(new CustomEvent(IDENTITY_SELECTION_EVENT, { detail: { userId, alias } }));
}
