export const INVITE_CODES = ["RAW-ALPHA", "RAW-BETA"] as const;

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}

export function isValidInviteCode(code: string): boolean {
  const normalizedCode = normalizeInviteCode(code);
  return INVITE_CODES.some((inviteCode) => inviteCode === normalizedCode);
}
