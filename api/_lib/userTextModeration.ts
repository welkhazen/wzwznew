// eslint-disable-next-line no-control-regex -- intentional: strip control chars from public user text.
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;
const DENYLIST_SEPARATOR_REGEX = /[\n,]+/;
const LINK_REGEX = /\b(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|app|dev|me|gg|xyz|ly|link|site|info|biz)(?:\/\S*)?)/i;
const CONTACT_NUMBER_REGEX = /(?:\+?\d[\d\s().-]{5,}\d)|(?:\b\d{6,}\b)/;

export type UserTextModerationViolationType = "denylist" | "link" | "number";

export interface UserTextModerationViolation {
  type: UserTextModerationViolationType;
  value?: string;
}

export interface UserTextModerationResult {
  allowed: boolean;
  text: string;
  violations: UserTextModerationViolation[];
}

export class UserTextModerationError extends Error {
  result: UserTextModerationResult;

  constructor(result: UserTextModerationResult) {
    super(getUserTextModerationMessage(result));
    this.name = "UserTextModerationError";
    this.result = result;
  }
}

function normalizePlainText(value: string): string {
  return value.replace(CONTROL_CHARS_REGEX, "").replace(MULTIPLE_SPACES_REGEX, " ").trim();
}

function parseUserTextDenylist(value: string | undefined): string[] {
  if (!value) return [];
  return [...new Set(
    value
      .split(DENYLIST_SEPARATOR_REGEX)
      .map((term) => term.trim().toLocaleLowerCase())
      .filter(Boolean),
  )];
}

function configuredDenylist(): string[] {
  return parseUserTextDenylist(process.env.RAW_TEXT_DENYLIST ?? process.env.VITE_RAW_TEXT_DENYLIST);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findDenylistedTerm(text: string, denylist: string[]): string | undefined {
  const normalizedText = text.toLocaleLowerCase();

  return denylist.find((term) => {
    const escapedTerm = escapeRegExp(term);
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escapedTerm}(?=$|[^\\p{L}\\p{N}_])`, "iu");
    return pattern.test(normalizedText);
  });
}

export function moderateUserText(value: string): UserTextModerationResult {
  const text = normalizePlainText(value);
  const violations: UserTextModerationViolation[] = [];
  const denylistedTerm = findDenylistedTerm(text, configuredDenylist());

  if (denylistedTerm) violations.push({ type: "denylist", value: denylistedTerm });
  if (LINK_REGEX.test(text)) violations.push({ type: "link" });
  if (CONTACT_NUMBER_REGEX.test(text)) violations.push({ type: "number" });

  return {
    allowed: violations.length === 0,
    text,
    violations,
  };
}

export function getUserTextModerationMessage(result: UserTextModerationResult): string {
  const firstViolation = result.violations[0]?.type;
  if (firstViolation === "denylist") return "This contains a blocked word. Rephrase it and try again.";
  if (firstViolation === "link") return "Links are not allowed in public text yet.";
  if (firstViolation === "number") return "Phone numbers or long number sequences are not allowed in public text yet.";
  return "This text cannot be posted right now.";
}

export function assertUserTextAllowed(value: string): string {
  const result = moderateUserText(value);
  if (!result.allowed) throw new UserTextModerationError(result);
  return result.text;
}
