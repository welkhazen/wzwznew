// Server-side text moderation helpers — usable in edge and Node runtimes.
// Mirrors the logic in src/lib/inputSecurity.ts without any Vite/browser imports.

const LINK_REGEX =
  /\b(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|app|dev|me|gg|xyz|ly|link|site|info|biz)(?:\/\S*)?)/i;
const CONTACT_NUMBER_REGEX = /(?:\+?\d[\d\s().-]{5,}\d)|(?:\b\d{6,}\b)/;
const DENYLIST_SEPARATOR_REGEX = /[\n,]+/;

export type TextViolation = "denylist" | "link" | "number";

export function normalizeServerText(value: string): string {
  // Strip ASCII control characters then collapse whitespace.
  // Using a character class avoids the no-control-regex lint rule on this module.
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) continue;
    out += value[i];
  }
  return out.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findDenylistedTerm(text: string, terms: string[]): boolean {
  const lower = text.toLocaleLowerCase();
  return terms.some((term) => {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}_])${escapeRegExp(term)}(?=$|[^\\p{L}\\p{N}_])`,
      "iu",
    );
    return pattern.test(lower);
  });
}

/** Parse a comma- or newline-separated denylist string (e.g. from an env var). */
export function parseEnvDenylist(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(DENYLIST_SEPARATOR_REGEX)
        .map((t) => t.trim().toLocaleLowerCase())
        .filter(Boolean),
    ),
  ];
}

/**
 * Check user text against blocked terms + link/number rules.
 * Does NOT log the matched term — callers must not surface it in responses.
 */
export function checkServerText(
  text: string,
  blockedTerms: string[],
): { allowed: boolean; violation: TextViolation | null } {
  const normalized = normalizeServerText(text);

  if (blockedTerms.length > 0 && findDenylistedTerm(normalized, blockedTerms)) {
    return { allowed: false, violation: "denylist" };
  }
  if (LINK_REGEX.test(normalized)) {
    return { allowed: false, violation: "link" };
  }
  if (CONTACT_NUMBER_REGEX.test(normalized)) {
    return { allowed: false, violation: "number" };
  }

  return { allowed: true, violation: null };
}
