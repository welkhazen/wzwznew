import type { PersistedCommunityRecord } from "./communityChat.types";

const ONLINE_WINDOW_MINUTES = 15;

export function toTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getLatestCommunityTimestamp(community: PersistedCommunityRecord): number {
  return Math.max(
    0,
    ...community.messages.map((message) => toTimestamp(message.createdAt)),
    ...community.members.flatMap((member) => [toTimestamp(member.lastSeenAt), toTimestamp(member.lastReadAt)])
  );
}

export function createMonotonicIsoTimestamp(previousTimestamp = 0): string {
  return new Date(Math.max(Date.now(), previousTimestamp + 1)).toISOString();
}

export function buildCommunityAbbr(title: string): string {
  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  return titleWords.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("").slice(0, 3) || "NEW";
}

export function ensureString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function ensureBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function countOnlineMembers(community: PersistedCommunityRecord): number {
  const threshold = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60_000);
  return community.members.filter((member) => new Date(member.lastSeenAt) >= threshold).length;
}

export function countUnreadMessages(community: PersistedCommunityRecord, userId: string): number {
  const currentMember = community.members.find((member) => member.userId === userId);
  const lastReadTime = toTimestamp(currentMember?.lastReadAt);

  return community.messages.filter((message) => {
    if (message.senderId === userId || message.deletedAt) {
      return false;
    }

    return toTimestamp(message.createdAt) > lastReadTime;
  }).length;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });

function formatDistanceToNowStrict(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);
  const diffMonths = Math.round(diffMs / 2_592_000_000);
  const diffYears = Math.round(diffMs / 31_536_000_000);

  if (diffSecs < 45) return rtf.format(-diffSecs, "second");
  if (diffSecs < 90) return rtf.format(-1, "minute");
  if (diffMins < 45) return rtf.format(-diffMins, "minute");
  if (diffMins < 90) return rtf.format(-1, "hour");
  if (diffHours < 22) return rtf.format(-diffHours, "hour");
  if (diffHours < 36) return rtf.format(-1, "day");
  if (diffDays < 26) return rtf.format(-diffDays, "day");
  if (diffDays < 46) return rtf.format(-1, "month");
  if (diffDays < 345) return rtf.format(-diffMonths, "month");
  if (diffDays < 545) return rtf.format(-1, "year");
  return rtf.format(-diffYears, "year");
}

export function formatChatTimestamp(value: string): string {
  const date = new Date(value);
  const minutesAgo = Math.abs(Date.now() - date.getTime()) / 60000;

  if (minutesAgo < 1) {
    return "now";
  }

  if (minutesAgo < 60) {
    return `${Math.floor(minutesAgo)}m`;
  }

  if (isSameCalendarDay(date, new Date())) {
    return timeFormatter.format(date);
  }

  return formatDistanceToNowStrict(date);
}

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function formatChatDayLabel(value: string): string {
  const date = new Date(value);
  const now = new Date();

  if (isSameCalendarDay(date, now)) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(date, yesterday)) {
    return "Yesterday";
  }

  return dayLabelFormatter.format(date);
}

export function canManageCommunity(community: PersistedCommunityRecord, userId: string, username?: string): boolean {
  if (!community.createdBy) {
    return false;
  }

  return community.createdBy === userId || (Boolean(username) && community.createdBy === username);
}
