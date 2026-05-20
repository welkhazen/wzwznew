import { toUserId, type CommunityRequestRecord } from "@/lib/adminData";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";
import type {
  JoinCommunityInput,
  PersistedCommunityRecord,
  SendCommunityMessageInput,
  UpdateCommunityPresentationInput,
} from "./communityChat.types";
import {
  buildCommunityAbbr,
  canManageCommunity,
  createMonotonicIsoTimestamp,
  getLatestCommunityTimestamp,
} from "./communityChat.utils";
import { normalizeCommunity, readStoredCommunities, writeCommunityChats } from "./communityChat.storage";
import { buildDefaultCommunities } from "./communityChat.seed";

function mergeWithDefaults(storedCommunities: PersistedCommunityRecord[]): PersistedCommunityRecord[] {
  const defaultCommunities = buildDefaultCommunities();
  const knownIds = new Set(storedCommunities.map((community) => community.id));
  return [...storedCommunities, ...defaultCommunities.filter((community) => !knownIds.has(community.id))];
}

const RETIRED_COMMUNITY_IDS = new Set(["sg", "sic", "mw"]);

const BUILT_IN_LOGOS: Record<string, string> = {
  lnt: LNTLogo,
  syt: SYTLogo,
};

const BUILT_IN_TITLES: Record<string, string> = {
  iijm: "Is It Just Me?",
};

const ALWAYS_LOCKED_IDS = new Set(["li"]);

function applyBuiltInOverrides(communities: PersistedCommunityRecord[]): PersistedCommunityRecord[] {
  return communities.map((community) => {
    const logoUrl = BUILT_IN_LOGOS[community.id] && !community.logoUrl ? BUILT_IN_LOGOS[community.id] : community.logoUrl;
    const locked = ALWAYS_LOCKED_IDS.has(community.id) ? true : community.locked;
    const title = BUILT_IN_TITLES[community.id] ?? community.title;
    return { ...community, logoUrl, locked, title };
  });
}

export function readCommunityChats(): PersistedCommunityRecord[] {
  const storedCommunities = readStoredCommunities();
  const communities = applyBuiltInOverrides(
    (storedCommunities.length > 0 ? mergeWithDefaults(storedCommunities) : buildDefaultCommunities())
      .filter((community) => !RETIRED_COMMUNITY_IDS.has(community.id))
  );

  writeCommunityChats(communities);

  return communities;
}

export function joinCommunityChat(communityId: string, { userId, username }: JoinCommunityInput): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const now = new Date().toISOString();
    const existingMember = community.members.find((member) => member.userId === userId);
    if (existingMember) {
      return {
        ...community,
        members: community.members.map((member) => member.userId === userId ? { ...member, username, lastSeenAt: now } : member),
      };
    }

    return {
      ...community,
      members: [
        ...community.members,
        {
          userId,
          username,
          joinedAt: now,
          lastSeenAt: now,
          lastReadAt: now,
          notificationsEnabled: true,
        },
      ],
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function touchCommunityMemberActivity(communityId: string, { userId, username }: JoinCommunityInput): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  let didUpdate = false;
  const now = new Date().toISOString();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const hasMember = community.members.some((member) => member.userId === userId);
    if (!hasMember) {
      return community;
    }

    didUpdate = true;
    return {
      ...community,
      members: community.members.map((member) => member.userId === userId ? { ...member, username, lastSeenAt: now } : member),
    };
  });

  if (didUpdate) {
    writeCommunityChats(nextCommunities);
  }

  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function setCommunityNotifications(communityId: string, userId: string, enabled: boolean): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    return {
      ...community,
      members: community.members.map((member) => member.userId === userId ? { ...member, notificationsEnabled: enabled, lastSeenAt: new Date().toISOString() } : member),
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function sendCommunityMessage(communityId: string, input: SendCommunityMessageInput): PersistedCommunityRecord | null {
  const communities = readCommunityChats();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const now = createMonotonicIsoTimestamp(getLatestCommunityTimestamp(community));

    const hasMember = community.members.some((member) => member.userId === input.senderId);
    const members = hasMember
      ? community.members.map((member) => member.userId === input.senderId ? { ...member, username: input.senderName, lastSeenAt: now } : member)
      : [
          ...community.members,
          {
            userId: input.senderId,
            username: input.senderName,
            joinedAt: now,
            lastSeenAt: now,
            lastReadAt: now,
            notificationsEnabled: true,
          },
        ];

    const nextMessage = {
      id: `${communityId}-${Date.now()}`,
      communityId,
      senderId: input.senderId,
      senderName: input.senderName,
      text: input.text.trim(),
      createdAt: now,
      replyToMessageId: input.replyToMessage?.id,
      replyToSenderName: input.replyToMessage?.senderName,
      replyToText: input.replyToMessage?.text,
    };

    return {
      ...community,
      members,
      messages: [...community.messages, nextMessage],
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function createCommunityFromApprovedRequest(request: CommunityRequestRecord): PersistedCommunityRecord {
  const communities = readCommunityChats();
  const requestCommunityId = `request-${request.id}`;
  const existingCommunity = communities.find((community) => community.id === requestCommunityId);
  if (existingCommunity) {
    return existingCommunity;
  }

  const abbr = buildCommunityAbbr(request.communityName);
  const nextCommunity: PersistedCommunityRecord = {
    id: requestCommunityId,
    abbr,
    title: request.communityName,
    description: request.whyNow,
    topic: request.samplePrompt || request.focusArea,
    status: "Early Access",
    createdAt: request.reviewedAt ?? new Date().toISOString(),
    createdBy: request.requesterId,
    members: [
      {
        userId: request.requesterId,
        username: request.requesterName,
        joinedAt: request.reviewedAt ?? new Date().toISOString(),
        lastSeenAt: request.reviewedAt ?? new Date().toISOString(),
        lastReadAt: request.reviewedAt ?? new Date().toISOString(),
        notificationsEnabled: true,
      },
    ],
    messages: request.samplePrompt
      ? [
          {
            id: `${requestCommunityId}-welcome`,
            communityId: requestCommunityId,
            senderId: request.requesterId,
            senderName: request.requesterName,
            text: request.samplePrompt,
            createdAt: request.reviewedAt ?? new Date().toISOString(),
            pinned: true,
          },
        ]
      : [],
  };

  const nextCommunities = [nextCommunity, ...communities];
  writeCommunityChats(nextCommunities);
  return nextCommunity;
}

export function updateCommunityPresentation(
  communityId: string,
  { actorUserId, actorUsername, title, logoUrl }: UpdateCommunityPresentationInput,
): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  let updatedCommunity: PersistedCommunityRecord | null = null;

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    if (!canManageCommunity(community, actorUserId, actorUsername)) {
      updatedCommunity = null;
      return community;
    }

    const normalizedTitle = typeof title === "string" ? title.trim() : community.title;
    const normalizedLogoUrl = typeof logoUrl === "string" ? logoUrl.trim() : community.logoUrl;
    if (!normalizedTitle) {
      updatedCommunity = null;
      return community;
    }

    updatedCommunity = {
      ...community,
      title: normalizedTitle,
      abbr: buildCommunityAbbr(normalizedTitle),
      logoUrl: normalizedLogoUrl || undefined,
    };

    return updatedCommunity;
  });

  writeCommunityChats(nextCommunities);
  return updatedCommunity;
}

export function markCommunityRead(communityId: string, userId: string): PersistedCommunityRecord | null {
  const communities = readCommunityChats();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const now = createMonotonicIsoTimestamp(getLatestCommunityTimestamp(community));

    return {
      ...community,
      members: community.members.map((member) => member.userId === userId ? { ...member, lastReadAt: now, lastSeenAt: now } : member),
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function deleteCommunityMessage(communityId: string, messageId: string, requesterId: string): PersistedCommunityRecord | null {
  const communities = readCommunityChats();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    return {
      ...community,
      messages: community.messages.map((message) => {
        if (message.id !== messageId || message.senderId !== requesterId || message.deletedAt) {
          return message;
        }

        return {
          ...message,
          text: "This message was deleted.",
          deletedAt: new Date().toISOString(),
          deletedByUserId: requesterId,
          replyToText: message.replyToText,
        };
      }),
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function likeCommunityMessage(communityId: string, messageId: string, userId: string): void {
  const communities = readCommunityChats();
  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) return community;
    return {
      ...community,
      messages: community.messages.map((message) => {
        if (message.id !== messageId || message.deletedAt) return message;
        const likedBy = message.likedBy ?? [];
        const nextLikedBy = likedBy.includes(userId)
          ? likedBy.filter((id) => id !== userId)
          : [...likedBy, userId];
        return { ...message, likedBy: nextLikedBy };
      }),
    };
  });
  writeCommunityChats(nextCommunities);
}

export function approveCommunityJoinRequest(communityId: string, userId: string, username: string): PersistedCommunityRecord | null {
  return joinCommunityChat(communityId, { userId, username });
}

export type { PersistedCommunityRecord, CommunityChatMessageRecord, CommunityChatMemberRecord, CommunityStatus } from "./communityChat.types";
export { countOnlineMembers, countUnreadMessages, formatChatTimestamp, formatChatDayLabel, canManageCommunity } from "./communityChat.utils";
