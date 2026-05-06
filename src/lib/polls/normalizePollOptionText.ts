export function normalizePollOptionText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isYesPollOption(value: string | null | undefined): boolean {
  return normalizePollOptionText(value) === "yes";
}

export function isNoPollOption(value: string | null | undefined): boolean {
  return normalizePollOptionText(value) === "no";
}
