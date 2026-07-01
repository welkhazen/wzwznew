import type { CommunityChatMemberRecord, CommunityChatMessageRecord, PersistedCommunityRecord } from "./communityChat.types";
import { ensureString } from "./communityChat.utils";
import { toUserId } from "@/lib/adminData";

export function normalizeMessage(rawMessage: unknown, communityId: string): CommunityChatMessageRecord | null {
  if (!rawMessage || typeof rawMessage !== "object") {
    return null;
  }

  const candidate = rawMessage as Partial<CommunityChatMessageRecord>;
  const senderName = ensureString(candidate.senderName, "unknown");

  return {
    id: ensureString(candidate.id, `${communityId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    communityId,
    senderId: ensureString(candidate.senderId, toUserId(senderName)),
    senderName,
    text: typeof candidate.text === "string" ? candidate.text : "",
    createdAt: ensureString(candidate.createdAt, new Date().toISOString()),
    replyToMessageId: typeof candidate.replyToMessageId === "string" ? candidate.replyToMessageId : undefined,
    replyToSenderName: typeof candidate.replyToSenderName === "string" ? candidate.replyToSenderName : undefined,
    replyToText: typeof candidate.replyToText === "string" ? candidate.replyToText : undefined,
    deletedAt: typeof candidate.deletedAt === "string" ? candidate.deletedAt : undefined,
    deletedByUserId: typeof candidate.deletedByUserId === "string" ? candidate.deletedByUserId : undefined,
    likedBy: Array.isArray(candidate.likedBy) ? candidate.likedBy.filter((id): id is string => typeof id === "string") : undefined,
  };
}

export function normalizeMember(rawMember: unknown): CommunityChatMemberRecord | null {
  if (!rawMember || typeof rawMember !== "object") {
    return null;
  }

  const candidate = rawMember as Partial<CommunityChatMemberRecord>;
  const username = ensureString(candidate.username, "member");

  return {
    userId: ensureString(candidate.userId, toUserId(username)),
    username,
    joinedAt: ensureString(candidate.joinedAt, new Date().toISOString()),
    lastSeenAt: ensureString(candidate.lastSeenAt, candidate.joinedAt ?? new Date().toISOString()),
    lastReadAt: typeof candidate.lastReadAt === "string" ? candidate.lastReadAt : undefined,
    notificationsEnabled: ensureBoolean(candidate.notificationsEnabled, true),
  };
}

export function normalizeCommunity(rawCommunity: unknown): PersistedCommunityRecord | null {
  if (!rawCommunity || typeof rawCommunity !== "object") {
    return null;
  }

  const candidate = rawCommunity as Partial<PersistedCommunityRecord>;
  const id = ensureString(candidate.id, "");
  const title = ensureString(candidate.title, "Untitled Community");
  if (!id) {
    return null;
  }

  return {
    id,
    abbr: ensureString(candidate.abbr, title.slice(0, 2).toUpperCase() || "GC"),
    title,
    logoUrl: typeof candidate.logoUrl === "string" ? candidate.logoUrl : undefined,
    description: ensureString(candidate.description, "Group chat"),
    topic: ensureString(candidate.topic, "Say something real."),
    locked: candidate.locked === true ? true : undefined,
    status: candidate.status === "Active" || candidate.status === "Early Access" ? candidate.status : "Active",
    createdAt: ensureString(candidate.createdAt, new Date().toISOString()),
    createdBy: typeof candidate.createdBy === "string" ? candidate.createdBy : undefined,
    members: Array.isArray(candidate.members) ? candidate.members.map(normalizeMember).filter((member): member is CommunityChatMemberRecord => member !== null) : [],
    messages: Array.isArray(candidate.messages) ? candidate.messages.map((message) => normalizeMessage(message, id)).filter((message): message is CommunityChatMessageRecord => message !== null) : [],
  };
}
