const FALLBACK_INVITE_CODES = ["RAW-ALPHA", "RAW-BETA"] as const;

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}

function configuredInviteCodes(): string[] {
  const raw = process.env.SIGNUP_INVITE_CODES ?? process.env.VITE_SIGNUP_INVITE_CODES ?? "";
  if (!raw) return [...FALLBACK_INVITE_CODES];

  return raw
    .split(/[,\n]+/)
    .map(normalizeInviteCode)
    .filter(Boolean);
}

export function isValidInviteCode(code: string): boolean {
  const normalizedCode = normalizeInviteCode(code);
  if (!normalizedCode) return false;
  return configuredInviteCodes().some((inviteCode) => inviteCode === normalizedCode);
}
