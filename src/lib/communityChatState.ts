// Pure state transforms for the community chat message list. Extracted from
// DashboardCommunities.tsx so the component can shrink and so these can be
// unit-tested without spinning up React.
//
// All functions are pure: same input → same output, no side effects, no
// React, no Supabase.
import type {
  CommunityChatMessageRecord,
  PersistedCommunityRecord,
} from "@/lib/communityChat.types";
import { getCommunitySenderBlockKey } from "@/lib/blockedCommunitySenders";

export function getMessageSenderBlockKey(
  message: Pick<CommunityChatMessageRecord, "senderId" | "senderName">,
): string {
  return getCommunitySenderBlockKey(message.senderId, message.senderName);
}

/**
 * Merge an incoming message into a single community's message list. If a
 * pending optimistic copy of the same message exists (same sender + same
 * text, deliveryStatus 'sending'), replace it in place; otherwise append.
 * Skips the O(n log n) sort for the common case where the incoming message
 * is newer than the tail of the list (realtime INSERT).
 */
export function mergeCommunityMessages(
  messages: CommunityChatMessageRecord[],
  incoming: CommunityChatMessageRecord,
): CommunityChatMessageRecord[] {
  const withoutSameId = messages.filter((message) => message.id !== incoming.id);

  const pendingIndex = withoutSameId.findIndex(
    (message) =>
      message.deliveryStatus === "sending" &&
      message.senderId === incoming.senderId &&
      message.text === incoming.text,
  );

  if (pendingIndex >= 0) {
    // Replace optimistic copy in place — order doesn't change
    const next = [...withoutSameId];
    next[pendingIndex] = incoming;
    return next;
  }

  // Common path: new message is at or after the current tail — append without sort
  const tail = withoutSameId[withoutSameId.length - 1];
  if (!tail || incoming.createdAt >= tail.createdAt) {
    return [...withoutSameId, incoming];
  }

  // Rare path: backfill or out-of-order event
  return [...withoutSameId, incoming].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Targeted like-count update — no full array recreation needed. */
export function updateMessageLike(
  communities: PersistedCommunityRecord[],
  communityId: string,
  messageId: string,
  likedBy: string[],
): PersistedCommunityRecord[] {
  return communities.map((community) =>
    community.id !== communityId
      ? community
      : {
          ...community,
          messages: community.messages.map((m) =>
            m.id === messageId ? { ...m, likedBy } : m,
          ),
        },
  );
}

export function upsertCommunityMessage(
  communities: PersistedCommunityRecord[],
  communityId: string,
  message: CommunityChatMessageRecord,
): PersistedCommunityRecord[] {
  return communities.map((community) =>
    community.id === communityId
      ? { ...community, messages: mergeCommunityMessages(community.messages, message) }
      : community,
  );
}

export function removeCommunityMessage(
  communities: PersistedCommunityRecord[],
  communityId: string,
  messageId: string,
): PersistedCommunityRecord[] {
  return communities.map((community) =>
    community.id === communityId
      ? { ...community, messages: community.messages.filter((message) => message.id !== messageId) }
      : community,
  );
}

export function setCommunityMessages(
  communities: PersistedCommunityRecord[],
  communityId: string,
  messages: CommunityChatMessageRecord[],
): PersistedCommunityRecord[] {
  return communities.map((community) =>
    community.id === communityId ? { ...community, messages } : community,
  );
}

/**
 * Merge two message lists (e.g. when paginating older messages in). Last
 * occurrence wins by id so realtime updates from the second list override
 * stale copies from the first.
 */
export function mergeCommunityMessageList(
  messages: CommunityChatMessageRecord[],
  incoming: CommunityChatMessageRecord[],
): CommunityChatMessageRecord[] {
  const byId = new Map<string, CommunityChatMessageRecord>();
  [...messages, ...incoming].forEach((message) => {
    byId.set(message.id, message);
  });
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function replaceCommunityMessage(
  communities: PersistedCommunityRecord[],
  communityId: string,
  previousId: string,
  message: CommunityChatMessageRecord,
): PersistedCommunityRecord[] {
  return communities.map((community) => {
    if (community.id !== communityId) return community;
    const withoutPrevious = community.messages.filter((entry) => entry.id !== previousId);
    return { ...community, messages: mergeCommunityMessages(withoutPrevious, message) };
  });
}

export function markCommunityMessageFailed(
  communities: PersistedCommunityRecord[],
  communityId: string,
  messageId: string,
): PersistedCommunityRecord[] {
  return communities.map((community) =>
    community.id === communityId
      ? {
          ...community,
          messages: community.messages.map((message) =>
            message.id === messageId ? { ...message, deliveryStatus: "failed" } : message,
          ),
        }
      : community,
  );
}

export function appendOptimisticMessage(
  communities: PersistedCommunityRecord[],
  communityId: string,
  message: CommunityChatMessageRecord,
): PersistedCommunityRecord[] {
  return communities.map((community) => {
    if (community.id !== communityId) return community;
    const withoutExisting = community.messages.filter((entry) => entry.id !== message.id);
    const nextMessage = { ...message, deliveryStatus: "sending" as const };
    const tail = withoutExisting[withoutExisting.length - 1];
    if (!tail || nextMessage.createdAt >= tail.createdAt) {
      return {
        ...community,
        messages: [...withoutExisting, nextMessage],
      };
    }
    return {
      ...community,
      messages: [...withoutExisting, nextMessage].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  });
}
