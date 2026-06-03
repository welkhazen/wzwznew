export type CommunityStatus = "Active" | "Early Access";

export interface CommunityChatMemberRecord {
  userId: string;
  username: string;
  joinedAt: string;
  lastSeenAt: string;
  lastReadAt?: string;
  notificationsEnabled: boolean;
}

export interface CommunityChatMessageRecord {
  id: string;
  communityId: string;
  senderId: string;
  senderName: string;
  senderAvatarLevel?: number;
  text: string;
  createdAt: string;
  pinned?: boolean;
  replyToMessageId?: string;
  replyToSenderName?: string;
  replyToText?: string;
  deletedAt?: string;
  deletedByUserId?: string;
  likedBy?: string[];
  senderAvatarLevel?: number;
  deliveryStatus?: "sending" | "failed";
}

export interface PersistedCommunityRecord {
  id: string;
  abbr: string;
  title: string;
  logoUrl?: string;
  description: string;
  topic: string;
  status: CommunityStatus;
  locked?: boolean;
  createdAt: string;
  createdBy?: string;
  members: CommunityChatMemberRecord[];
  messages: CommunityChatMessageRecord[];
}

export interface SendCommunityMessageInput {
  senderId: string;
  senderName: string;
  text: string;
  replyToMessage?: CommunityChatMessageRecord | null;
}

export interface JoinCommunityInput {
  userId: string;
  username: string;
}

export interface UpdateCommunityPresentationInput {
  actorUserId: string;
  actorUsername?: string;
  title?: string;
  logoUrl?: string;
}
