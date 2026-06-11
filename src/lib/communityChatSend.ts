import { sendCommunityMessage as sendCommunityMessageLocal } from "@/lib/communityChat";
import type { CommunityChatMessageRecord, PersistedCommunityRecord, SendCommunityMessageInput } from "@/lib/communityChat.types";

type JoinCommunity = (communityId: string, userId: string, username: string) => Promise<void>;
type SendCommunityMessageRemote = (communityId: string, input: SendCommunityMessageInput) => Promise<CommunityChatMessageRecord>;

interface SendDashboardCommunityMessageInput extends SendCommunityMessageInput {
  communityId: string;
  username: string;
  isJoined: boolean;
}

interface SendDashboardCommunityMessageDependencies {
  joinCommunity: JoinCommunity;
  sendMessage: SendCommunityMessageRemote;
}

export interface SendDashboardCommunityMessageResult {
  message: CommunityChatMessageRecord;
  usedLocalFallback: boolean;
}

function findFallbackMessage(
  community: PersistedCommunityRecord,
  input: SendDashboardCommunityMessageInput,
): CommunityChatMessageRecord | null {
  return [...community.messages]
    .reverse()
    .find((message) =>
      message.senderId === input.senderId &&
      message.senderName === input.senderName &&
      message.text === input.text.trim()
    ) ?? null;
}

export async function sendDashboardCommunityMessage(
  input: SendDashboardCommunityMessageInput,
  { joinCommunity, sendMessage }: SendDashboardCommunityMessageDependencies,
): Promise<SendDashboardCommunityMessageResult> {
  try {
    if (!input.isJoined) {
      await joinCommunity(input.communityId, input.senderId, input.username);
    }

    const message = await sendMessage(input.communityId, input);
    return { message, usedLocalFallback: false };
  } catch (error) {
    const fallbackCommunity = sendCommunityMessageLocal(input.communityId, input);
    const fallbackMessage = fallbackCommunity ? findFallbackMessage(fallbackCommunity, input) : null;

    if (!fallbackMessage) {
      throw error;
    }

    return { message: fallbackMessage, usedLocalFallback: true };
  }
}
