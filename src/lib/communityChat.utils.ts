import { format, formatDistanceToNowStrict, isToday, isYesterday, subMinutes } from "date-fns";
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

export function countOnlineMembers(community: PersistedCommunityRecord): number {
  const threshold = subMinutes(new Date(), ONLINE_WINDOW_MINUTES);
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

export function formatChatTimestamp(value: string): string {
  const date = new Date(value);
  const minutesAgo = Math.abs(Date.now() - date.getTime()) / 60000;

  if (minutesAgo < 1) {
    return "now";
  }

  if (minutesAgo < 60) {
    return `${Math.floor(minutesAgo)}m`;
  }

  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatChatDayLabel(value: string): string {
  const date = new Date(value);

  if (isToday(date)) {
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return format(date, "EEE, MMM d");
}

export function canManageCommunity(community: PersistedCommunityRecord, userId: string, username?: string): boolean {
  if (!community.createdBy) {
    return false;
  }

  return community.createdBy === userId || (Boolean(username) && community.createdBy === username);
}
